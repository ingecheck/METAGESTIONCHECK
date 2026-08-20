import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  TenderInfo,
  CompanyProfile,
  KeyPersonnel,
  EquipmentItem,
  ExperienceRecord,
  ClippedPdfSnippet,
} from "../types/osce";
import { formatPEN } from "./docxGenerator";

/**
 * Sanitizes text to remove characters unencodable by StandardFonts (Helvetica / WinAnsi)
 */
export function sanitizePdfText(str: string | undefined | null): string {
  if (!str) return "";
  return String(str)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/[\u00A0]/g, " ")
    .replace(/[^\x00-\x7F\xC0-\xFF]/g, " ");
}

/**
 * Parses user input page range strings like "1, 2-4, 7, 10-12" into an array of 1-indexed numbers.
 */
export function parsePageRanges(rangeStr: string, maxPages: number): number[] {
  if (!rangeStr || !rangeStr.trim()) {
    return Array.from({ length: maxPages }, (_, i) => i + 1);
  }

  const pagesSet = new Set<number>();
  const parts = rangeStr.split(",").map((p) => p.trim());

  for (const part of parts) {
    if (!part) continue;
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(maxPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          pagesSet.add(i);
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= maxPages) {
        pagesSet.add(page);
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b);
}

/**
 * Slices specific pages out of a PDF document (File, Uint8Array or base64)
 * and returns the new standalone clipped PDF.
 */
export async function slicePdfFile(
  pdfSource: Uint8Array | string,
  pageNumbers1Indexed: number[]
): Promise<{ pdfBytes: Uint8Array; base64: string; pageCount: number }> {
  let sourceBytes: Uint8Array;

  if (typeof pdfSource === "string") {
    const cleanB64 = pdfSource.includes(",") ? pdfSource.split(",")[1] : pdfSource;
    const binaryStr = atob(cleanB64.trim());
    sourceBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      sourceBytes[i] = binaryStr.charCodeAt(i);
    }
  } else {
    sourceBytes = pdfSource;
  }

  const srcDoc = await PDFDocument.load(sourceBytes);
  const totalSrcPages = srcDoc.getPageCount();

  const validPages = pageNumbers1Indexed.filter((p) => p >= 1 && p <= totalSrcPages);
  if (validPages.length === 0) {
    throw new Error(`No se seleccionaron páginas válidas dentro del rango (1 a ${totalSrcPages}).`);
  }

  const newDoc = await PDFDocument.create();
  const pageIndices = validPages.map((p) => p - 1);
  const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);

  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  const pdfBytes = await newDoc.save();
  const base64 = uint8ArrayToBase64(pdfBytes);

  return {
    pdfBytes,
    base64,
    pageCount: copiedPages.length,
  };
}

/**
 * Converts a Uint8Array to a Base64 string safely in browser
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts Base64 to Uint8Array safely in browser
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  try {
    const cleanB64 = base64.includes(",") ? base64.split(",")[1] : base64;
    const binaryStr = atob(cleanB64.trim());
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.error("base64ToUint8Array error:", err);
    return new Uint8Array(0);
  }
}

/**
 * Creates a clean text page in PDF for Annexes
 */
export async function createSimpleAnnexPdf(
  annexTitle: string,
  annexSubheader: string,
  paragraphs: string[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  let page = doc.addPage([595.28, 841.89]); // A4 in points
  const { width, height } = page.getSize();
  const margin = 50;

  // Header band
  page.drawRectangle({
    x: margin,
    y: height - 60,
    width: width - margin * 2,
    height: 25,
    color: rgb(0.12, 0.23, 0.45),
  });

  page.drawText(sanitizePdfText(annexTitle.toUpperCase()), {
    x: margin + 10,
    y: height - 52,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  let currentY = height - 90;

  page.drawText(sanitizePdfText(annexSubheader), {
    x: margin,
    y: currentY,
    size: 9,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  currentY -= 20;

  for (const para of paragraphs) {
    const cleanPara = sanitizePdfText(para);
    if (currentY < 80) {
      page = doc.addPage([595.28, 841.89]);
      currentY = height - 60;
    }

    // Basic word wrap
    const words = cleanPara.split(" ");
    let line = "";
    for (const word of words) {
      const testLine = line + (line ? " " : "") + word;
      const textWidth = fontRegular.widthOfTextAtSize(testLine, 9);
      if (textWidth > width - margin * 2) {
        page.drawText(line, {
          x: margin,
          y: currentY,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.15, 0.15, 0.15),
        });
        currentY -= 13;
        line = word;
        if (currentY < 80) {
          page = doc.addPage([595.28, 841.89]);
          currentY = height - 60;
        }
      } else {
        line = testLine;
      }
    }
    if (line) {
      page.drawText(line, {
        x: margin,
        y: currentY,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.15, 0.15, 0.15),
      });
      currentY -= 18;
    }
  }

  return await doc.save();
}

/**
 * Creates the official SEACE Cover Page (Carátula del Expediente de Oferta)
 */
export async function createCoverPagePdf(
  tender: TenderInfo,
  company: CompanyProfile,
  montoOfertado: number
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 50;

  // Outer Border
  page.drawRectangle({
    x: 35,
    y: 35,
    width: width - 70,
    height: height - 70,
    borderColor: rgb(0.1, 0.2, 0.4),
    borderWidth: 2,
  });

  // Inner Border
  page.drawRectangle({
    x: 40,
    y: 40,
    width: width - 80,
    height: height - 80,
    borderColor: rgb(0.7, 0.75, 0.85),
    borderWidth: 1,
  });

  // Top Header Banner
  page.drawRectangle({
    x: 40,
    y: height - 120,
    width: width - 80,
    height: 70,
    color: rgb(0.08, 0.18, 0.38),
  });

  page.drawText("EXPEDIENTE DE PROPUESTA TECNICA Y ECONOMICA", {
    x: margin + 10,
    y: height - 85,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("SISTEMA ELECTRONICO DE CONTRATACIONES DEL ESTADO - SEACE / OSCE", {
    x: margin + 10,
    y: height - 105,
    size: 8,
    font: fontRegular,
    color: rgb(0.8, 0.9, 1),
  });

  let y = height - 160;

  // Tender Info Box
  const drawLabelValue = (label: string, value: string, isBig = false) => {
    const cleanLabel = sanitizePdfText(label);
    const cleanValue = sanitizePdfText(value);

    page.drawText(cleanLabel.toUpperCase(), {
      x: margin + 10,
      y,
      size: 8,
      font: fontBold,
      color: rgb(0.3, 0.4, 0.5),
    });
    y -= 14;

    const words = cleanValue.split(" ");
    let line = "";
    for (const w of words) {
      const test = line + (line ? " " : "") + w;
      if (fontBold.widthOfTextAtSize(test, isBig ? 11 : 9.5) > width - margin * 2 - 20) {
        page.drawText(line, {
          x: margin + 10,
          y,
          size: isBig ? 11 : 9.5,
          font: isBig ? fontBold : fontRegular,
          color: rgb(0.05, 0.1, 0.2),
        });
        y -= 14;
        line = w;
      } else {
        line = test;
      }
    }
    if (line) {
      page.drawText(line, {
        x: margin + 10,
        y,
        size: isBig ? 11 : 9.5,
        font: isBig ? fontBold : fontRegular,
        color: rgb(0.05, 0.1, 0.2),
      });
      y -= 18;
    }
  };

  drawLabelValue("Procedimiento de Seleccion:", tender.nomenclatura || "AS-SM-04-2026-MTC/10", true);
  drawLabelValue("Entidad Convocante:", tender.entidadConvocante || "ENTIDAD PUBLICA CONVOCANTE");
  drawLabelValue("Objeto de Contratacion:", `${tender.objetoContratacion} - ${tender.resumenAlcance || "Ejecucion de Obras"}`);
  drawLabelValue("Sistema de Contratacion:", `${tender.sistemaContratacion} | Plazo: ${tender.plazoEjecucion || "90 dias"}`);
  drawLabelValue("Valor Referencial de Bases:", formatPEN(tender.valorNumerico || 514737.28));

  y -= 10;
  page.drawLine({
    start: { x: margin + 10, y },
    end: { x: width - margin - 10, y },
    thickness: 1,
    color: rgb(0.8, 0.85, 0.9),
  });
  y -= 25;

  // Bidder Info
  page.drawText("DATOS DEL POSTOR:", {
    x: margin + 10,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.08, 0.18, 0.38),
  });
  y -= 18;

  const bidderName = company.esConsorcio
    ? `CONSORCIO: ${company.nombreConsorcio || "CONSORCIO VIAL"}`
    : company.razonSocial;

  drawLabelValue("Razon Social / Consorcio:", bidderName, true);
  drawLabelValue("RUC:", company.ruc);
  drawLabelValue("Representante Legal:", company.representanteLegal || "GERENTE GENERAL");
  drawLabelValue("Monto Ofertado (Anexo N 6):", `${formatPEN(montoOfertado)} (SOLES)`, true);

  // Footer note
  page.drawText(
    sanitizePdfText(`Fecha de Ensamblado: ${new Date().toLocaleDateString("es-PE")} | Conforme a la Ley N 30225 y Ley N 32069`),
    {
      x: margin + 10,
      y: 55,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.4, 0.5, 0.6),
    }
  );

  return await doc.save();
}

/**
 * Creates the Table of Contents / Índice del Expediente with Estimated Folios
 */
export async function createIndexPagePdf(
  items: Array<{ title: string; category: string; estimatedPages: number }>
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  let page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 50;

  // Title
  page.drawText("INDICE GENERAL DEL EXPEDIENTE DE OFERTA", {
    x: margin,
    y: height - 60,
    size: 12,
    font: fontBold,
    color: rgb(0.08, 0.18, 0.38),
  });

  page.drawText("Relacion de documentos y anexos foliados conforme a las Bases Administrativas", {
    x: margin,
    y: height - 76,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawLine({
    start: { x: margin, y: height - 85 },
    end: { x: width - margin, y: height - 85 },
    thickness: 1.5,
    color: rgb(0.08, 0.18, 0.38),
  });

  // Table headers
  let y = height - 105;
  page.drawText("N", { x: margin, y, size: 8.5, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText("DOCUMENTO / ANEXO", { x: margin + 30, y, size: 8.5, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText("FOLIOS", { x: width - margin - 50, y, size: 8.5, font: fontBold, color: rgb(0.2, 0.2, 0.2) });

  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 16;

  let currentFolio = 1;

  for (let i = 0; i < items.length; i++) {
    if (y < 70) {
      page = doc.addPage([595.28, 841.89]);
      y = height - 60;
    }

    const item = items[i];
    const startFolio = currentFolio;
    const endFolio = currentFolio + Math.max(1, item.estimatedPages) - 1;
    const folioStr = startFolio === endFolio ? `${startFolio}` : `${startFolio} - ${endFolio}`;
    currentFolio = endFolio + 1;

    page.drawText(`${i + 1}`, { x: margin, y, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

    const maxTitleW = width - margin * 2 - 100;
    let titleText = sanitizePdfText(item.title);
    if (fontRegular.widthOfTextAtSize(titleText, 8) > maxTitleW) {
      while (titleText.length > 5 && fontRegular.widthOfTextAtSize(titleText + "...", 8) > maxTitleW) {
        titleText = titleText.substring(0, titleText.length - 1);
      }
      titleText += "...";
    }

    page.drawText(titleText, { x: margin + 30, y, size: 8, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(folioStr, { x: width - margin - 50, y, size: 8, font: fontBold, color: rgb(0.12, 0.23, 0.45) });

    y -= 14;
  }

  return await doc.save();
}

/**
 * MASTER MERGER: Integrates all Annexes, Clipped PDFs, Cover & Index into ONE SINGLE PDF
 * and stamps official "FOLIO N 000X" on every single page!
 */
export async function generateMasterUnifiedPdf(params: {
  tender: TenderInfo;
  company: CompanyProfile;
  montoOfertado: number;
  incluyeIGV: boolean;
  personal: KeyPersonnel[];
  equipment: EquipmentItem[];
  experience: ExperienceRecord[];
  clippedSnippets: ClippedPdfSnippet[];
}): Promise<{ pdfBytes: Uint8Array; blob: Blob; totalPages: number }> {
  const { tender, company, montoOfertado, incluyeIGV, personal, equipment, experience, clippedSnippets } = params;

  const masterDoc = await PDFDocument.create();

  // 1. Cover Page
  const coverBytes = await createCoverPagePdf(tender, company, montoOfertado);
  const coverDoc = await PDFDocument.load(coverBytes);
  const [coverPage] = await masterDoc.copyPages(coverDoc, [0]);
  masterDoc.addPage(coverPage);

  // 2. Prepare items list for Index
  const indexItems: Array<{ title: string; category: string; estimatedPages: number; pdfBytes?: Uint8Array }> = [];

  // Anexo 1
  const anexo1Bytes = await createSimpleAnnexPdf(
    "Anexo N 1 - Declaracion Jurada de Datos del Postor",
    `Procedimiento: ${tender.nomenclatura || "Convocatoria OSCE"}`,
    [
      `El que se suscribe, ${company.representanteLegal || "Representante Legal"}, identificado con DNI N ${company.dniRepresentante || "40192837"}, en representacion de ${company.esConsorcio ? "Consorcio " + (company.nombreConsorcio || "Postor") : company.razonSocial}, con RUC N ${company.ruc}, declara bajo juramento:`,
      `1. Domicilio Legal / Fiscal: ${company.domicilioFiscal || "Av. Principal N 123, Lima"}`,
      `2. Correo Electronico para Notificaciones: ${company.email || "contacto@empresa.pe"}`,
      `3. Telefono de Contacto: ${company.telefono || "999-888-777"}`,
      `4. Cuenta Corriente / CCI: ${company.cuentaCCI || "002-191-000000000000-00"}`,
      `5. El postor se encuentra validamente inscrito en el Registro Nacional de Proveedores (RNP) en el capitulo correspondiente al objeto del procedimiento.`,
    ]
  );
  indexItems.push({ title: "Anexo N 1: Datos del Postor", category: "Admisión", estimatedPages: 1, pdfBytes: anexo1Bytes });

  // Anexo 2
  const anexo2Bytes = await createSimpleAnnexPdf(
    "Anexo N 2 - Declaracion Jurada de Cumplimiento de TDR / EETT",
    `Procedimiento: ${tender.nomenclatura}`,
    [
      `El que suscribe, declara bajo juramento que mi representada CUMPLE Y SE COMPROMETE a ejecutar integramente todas las Especificaciones Tecnicas, Terminos de Referencia y Requerimientos Tecnicos Minimos establecidos en el Capitulo III de las Bases.`,
      `Alcance Tecnico Declarado: ${tender.resumenAlcance || "Cumplimiento al 100% de las partidas y condiciones contractuales."}`,
      `Garantizamos la disponibilidad inmediata y continua de los recursos para el fiel cumplimiento del contrato.`,
    ]
  );
  indexItems.push({ title: "Anexo N 2: Cumplimiento de TDR/EETT", category: "Admisión", estimatedPages: 1, pdfBytes: anexo2Bytes });

  // Anexo 3
  const anexo3Bytes = await createSimpleAnnexPdf(
    "Anexo N 3 - Declaracion Jurada de Plazo de Entrega / Ejecucion",
    `Procedimiento: ${tender.nomenclatura}`,
    [
      `Declaramos bajo juramento que nos comprometemos a ejecutar y entregar la totalidad de las prestaciones objeto de la contratacion en el plazo estipulado en las Bases:`,
      `PLAZO DE EJECUCION OFERTADO: ${tender.plazoEjecucion || "90 dias calendario"}, computados conforme a lo establecido en la normativa de contrataciones del Estado.`,
    ]
  );
  indexItems.push({ title: "Anexo N 3: Plazo de Ejecucion", category: "Admisión", estimatedPages: 1, pdfBytes: anexo3Bytes });

  // Anexo 4
  const anexo4Bytes = await createSimpleAnnexPdf(
    "Anexo N 4 - Declaracion Jurada (Art. 52 del Reglamento)",
    `Procedimiento: ${tender.nomenclatura}`,
    [
      `Declaramos bajo juramento que:`,
      `a) No tenemos impedimento para postular en el procedimiento de seleccion ni para contratar con el Estado, conforme al articulo 11 del TUO de la Ley N 30225 y Ley N 32069.`,
      `b) Conocemos, aceptamos y nos sometemos a las Bases, condiciones y reglas del procedimiento.`,
      `c) Somos responsables de la veracidad de los documentos e informacion que presentamos.`,
      `d) Nos comprometemos a mantener la oferta durante el procedimiento y a suscribir el contrato en caso de resultar favorecidos con la Buena Pro.`,
      `e) Conocemos las sanciones aplicables por el Tribunal de Contrataciones del Estado ante la presentacion de informacion o documentacion inexacta o falsa.`,
    ]
  );
  indexItems.push({ title: "Anexo N 4: Declaracion Jurada Art. 52", category: "Admisión", estimatedPages: 1, pdfBytes: anexo4Bytes });

  // Anexo 5 if Consortium
  if (company.esConsorcio) {
    const anexo5Bytes = await createSimpleAnnexPdf(
      "Anexo N 5 - Promesa Formal de Consorcio",
      `Procedimiento: ${tender.nomenclatura}`,
      [
        `Los suscritos, representantes legales de las empresas consorciadas, nos comprometemos formalmente a constituir el "${company.nombreConsorcio || "CONSORCIO POSTOR"}" para participar en el presente procedimiento de seleccion:`,
        `1. Representante Comun del Consorcio: ${company.representanteComunConsorcio || company.representanteLegal || "Representante Comun"}`,
        `2. Domicilio Comun: ${company.domicilioComunConsorcio || company.domicilioFiscal || "Av. Principal N 123"}`,
        `3. Integrantes y Obligaciones:`,
        ...(company.integrantesConsorcio || []).map(
          (m, idx) =>
            `   ${idx + 1}. ${m.razonSocial} (RUC: ${m.ruc}) - Participacion: ${m.porcentajeParticipacion}% - Obligaciones: ${m.obligaciones}`
        ),
      ]
    );
    indexItems.push({ title: "Anexo N 5: Promesa de Consorcio", category: "Admisión", estimatedPages: 1, pdfBytes: anexo5Bytes });
  }

  // Anexo 8 Experiencia
  const anexo8Bytes = await createSimpleAnnexPdf(
    "Anexo N 8 - Declaracion Jurada de Experiencia del Postor",
    `Procedimiento: ${tender.nomenclatura}`,
    [
      `Relacion de contrataciones similares ejecutadas por el postor en los ultimos anos conforme al Capitulo III de las Bases:`,
      `Monto Total de Experiencia Acreditado: ${formatPEN(experience.reduce((acc, curr) => acc + (curr.montoEnSoles || 0), 0))} Soles.`,
      ...experience.slice(0, 10).map(
        (exp, idx) =>
          `Item ${idx + 1}: ${exp.cliente} - Doc: ${exp.nroDocumento} - Monto: ${formatPEN(exp.montoEnSoles)} - Objeto: ${exp.objetoContrato}`
      ),
    ]
  );
  indexItems.push({ title: "Anexo N 8: Experiencia del Postor", category: "Calificación", estimatedPages: 1, pdfBytes: anexo8Bytes });

  // Carta Personal y Equipos
  const personalBytes = await createSimpleAnnexPdf(
    "Carta de Acreditacion de Personal Clave y Equipamiento Estrategico",
    `Procedimiento: ${tender.nomenclatura}`,
    [
      `Declaramos bajo juramento la nomina de profesionales y maquinaria estrategica asignada:`,
      `A. PERSONAL CLAVE:`,
      ...personal.map(
        (p, idx) =>
          `   ${idx + 1}. ${p.cargoPostulado}: ${p.nombreCompleto} (DNI: ${p.dni} - ${p.cipOCol}) - ${p.tiempoExperienciaMeses} meses de experiencia.`
      ),
      `B. EQUIPAMIENTO ESTRATEGICO:`,
      ...equipment.map(
        (eq, idx) =>
          `   ${idx + 1}. ${eq.denominacion} - Marca: ${eq.marcaModelo} (Ano ${eq.anioFabricacion}) - Condicion: ${eq.estadoDisponibilidad}`
      ),
    ]
  );
  indexItems.push({ title: "Carta de Personal Clave y Equipos", category: "Calificación", estimatedPages: 1, pdfBytes: personalBytes });

  // Anexo 6 Oferta Económica
  const anexo6Bytes = await createSimpleAnnexPdf(
    "Anexo N 6 - Oferta Economica",
    `Procedimiento: ${tender.nomenclatura}`,
    [
      `El que suscribe, en representacion de ${company.esConsorcio ? "Consorcio " + (company.nombreConsorcio || "Postor") : company.razonSocial}, formula su PROPUESTA ECONOMICA para el procedimiento de seleccion:`,
      `MONTO TOTAL OFERTADO: ${formatPEN(montoOfertado)} SOLES.`,
      `Condicion Tributaria: ${incluyeIGV ? "El monto ofertado INCLUYE el Impuesto General a las Ventas (IGV - 18%)." : "El monto ofertado NO incluye IGV por estar exonerado conforme a Ley."}`,
      `La oferta comprende los costos directos, costos indirectos, gastos generales, utilidad, tributos, seguros y todo concepto necesario para la ejecucion contractual.`,
    ]
  );
  indexItems.push({ title: "Anexo N 6: Oferta Economica", category: "Económica", estimatedPages: 1, pdfBytes: anexo6Bytes });

  // Add Clipped PDF Snippets that actually contain valid base64 data
  const activeSnippets = clippedSnippets.filter((s) => s.isIncluded !== false);
  for (const snip of activeSnippets) {
    if (snip.pdfBase64 && snip.pdfBase64.trim().length > 50) {
      indexItems.push({
        title: `[PDF Adjunto] ${snip.title} (${snip.selectedPages})`,
        category: snip.category,
        estimatedPages: snip.pageCount || 1,
      });
    }
  }

  // 3. Create and Add Index Page(s)
  const indexPdfBytes = await createIndexPagePdf(indexItems);
  const indexDoc = await PDFDocument.load(indexPdfBytes);
  const indexPages = await masterDoc.copyPages(indexDoc, indexDoc.getPageIndices());
  for (const page of indexPages) {
    masterDoc.addPage(page);
  }

  // 4. Append Annex Documents
  for (const item of indexItems) {
    if (item.pdfBytes) {
      const docToAdd = await PDFDocument.load(item.pdfBytes);
      const copied = await masterDoc.copyPages(docToAdd, docToAdd.getPageIndices());
      for (const p of copied) {
        masterDoc.addPage(p);
      }
    }
  }

  // 5. Append Clipped PDF Snippets
  for (const snip of activeSnippets) {
    if (snip.pdfBase64 && snip.pdfBase64.trim().length > 50) {
      try {
        const snipBytes = base64ToUint8Array(snip.pdfBase64);
        if (snipBytes.length > 0) {
          const snipDoc = await PDFDocument.load(snipBytes);
          const copied = await masterDoc.copyPages(snipDoc, snipDoc.getPageIndices());
          for (const p of copied) {
            masterDoc.addPage(p);
          }
        }
      } catch (err) {
        console.warn("Error appending snippet to master PDF:", snip.title, err);
      }
    }
  }

  // 6. STAMP OFFICIAL FOLIO NUMBER ON EVERY PAGE (FOLIO N 0001, FOLIO N 0002...)
  const fontBold = await masterDoc.embedFont(StandardFonts.HelveticaBold);
  const totalPages = masterDoc.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    const page = masterDoc.getPage(i);
    const { width, height } = page.getSize();
    const folioNum = String(i + 1).padStart(4, "0");
    const folioText = `FOLIO N ${folioNum}`;

    // Stamp box in top right corner
    page.drawRectangle({
      x: width - 110,
      y: height - 28,
      width: 90,
      height: 16,
      color: rgb(0.95, 0.96, 0.98),
      borderColor: rgb(0.12, 0.23, 0.45),
      borderWidth: 1,
    });

    page.drawText(folioText, {
      x: width - 102,
      y: height - 23,
      size: 7.5,
      font: fontBold,
      color: rgb(0.12, 0.23, 0.45),
    });
  }

  const finalBytes = await masterDoc.save();
  const blob = new Blob([finalBytes], { type: "application/pdf" });

  return {
    pdfBytes: finalBytes,
    blob,
    totalPages,
  };
}
