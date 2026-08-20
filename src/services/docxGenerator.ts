import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  HeadingLevel,
} from "docx";
import saveAs from "file-saver";
import JSZip from "jszip";
import {
  TenderInfo,
  CompanyProfile,
  KeyPersonnel,
  EquipmentItem,
  ExperienceRecord,
  ObservationItem,
} from "../types/osce";

// Common formatting constants
const COLOR_PRIMARY = "0F2942"; // Deep Navy
const COLOR_SECONDARY = "2563EB";
const COLOR_GRAY_BG = "F1F5F9";
const COLOR_BORDER = "CBD5E1";
const FONT_FAMILY = "Arial";

// Helper to format currency in Soles
export function formatPEN(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount);
}

// Convert numbers to words in Spanish for formal tenders (Ej: S/ 385,600.00 -> TRESCIENTOS OCHENTA Y CINCO MIL SEISCIENTOS Y 00/100 SOLES)
export function numeroALetras(monto: number): string {
  const enteros = Math.floor(monto);
  const centavos = Math.round((monto - enteros) * 100);
  const centavosStr = centavos.toString().padStart(2, "0") + "/100 SOLES";

  if (enteros === 0) return `CERO Y ${centavosStr}`;

  const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const diezY = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];
  const veinti = ["VEINTE", "VEINTIUNO", "VEINTIDOS", "VEINTITRES", "VEINTICUATRO", "VEINTICINCO", "VEINTISEIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"];
  const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  function convertirGrupo(n: number): string {
    let res = "";
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (n === 100) {
      return "CIEN";
    }
    if (c > 0) {
      res += centenas[c] + " ";
    }
    if (d === 1) {
      res += diezY[u];
    } else if (d === 2) {
      res += veinti[u];
    } else if (d > 2) {
      res += decenas[d] + (u > 0 ? " Y " + unidades[u] : "");
    } else if (u > 0) {
      res += unidades[u];
    }
    return res.trim();
  }

  const millones = Math.floor(enteros / 1000000);
  const miles = Math.floor((enteros % 1000000) / 1000);
  const resto = enteros % 1000;

  let letras = "";
  if (millones > 0) {
    if (millones === 1) letras += "UN MILLÓN ";
    else letras += convertirGrupo(millones) + " MILLONES ";
  }
  if (miles > 0) {
    if (miles === 1) letras += "MIL ";
    else letras += convertirGrupo(miles) + " MIL ";
  }
  if (resto > 0 || letras === "") {
    letras += convertirGrupo(resto);
  }

  return `${letras.trim()} Y ${centavosStr}`;
}

// Table cell builder helper
function createStyledTableCell(
  text: string,
  isHeader = false,
  widthPercent = 100,
  align: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT
): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: isHeader ? { fill: COLOR_GRAY_BG } : undefined,
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    },
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text,
            bold: isHeader,
            font: FONT_FAMILY,
            size: isHeader ? 19 : 18, // 9.5pt or 9pt
            color: isHeader ? COLOR_PRIMARY : "334155",
          }),
        ],
      }),
    ],
  });
}

// Common Header & Footer
function createDocHeaderFooter(tender: TenderInfo) {
  return {
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `${tender.nomenclatura} - PROPUESTA DEL POSTOR`,
                font: FONT_FAMILY,
                size: 15,
                color: "64748B",
                italics: true,
              }),
            ],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Expediente de Contratación con el Estado Peruano (Ley N° 30225) - Página ",
                font: FONT_FAMILY,
                size: 16,
                color: "64748B",
              }),
              new TextRun({
                children: [PageNumber.CURRENT],
                font: FONT_FAMILY,
                size: 16,
                color: "64748B",
                bold: true,
              }),
              new TextRun({
                text: " de ",
                font: FONT_FAMILY,
                size: 16,
                color: "64748B",
              }),
              new TextRun({
                children: [PageNumber.TOTAL_PAGES],
                font: FONT_FAMILY,
                size: 16,
                color: "64748B",
              }),
            ],
          }),
        ],
      }),
    },
  };
}

// Signature Block Helper
function createSignatureBlock(company: CompanyProfile) {
  if (company.esConsorcio && company.integrantesConsorcio && company.integrantesConsorcio.length > 0) {
    // Return signature block for all consortium members plus common representative
    const memberRows: Paragraph[] = [];

    // Common Representative
    const repComun = company.representanteComunConsorcio || company.representanteLegal;
    const dniComun = company.dniRepresentanteComun || company.dniRepresentante;
    const nombreConsorcio = company.nombreConsorcio || company.razonSocial;

    memberRows.push(
      new Paragraph({ spacing: { before: 400, after: 100 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: "_________________________________________________________",
            font: FONT_FAMILY,
            size: 20,
            color: "64748B",
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: repComun,
            font: FONT_FAMILY,
            size: 20,
            bold: true,
            color: COLOR_PRIMARY,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `DNI N° ${dniComun} - REPRESENTANTE COMÚN DEL CONSORCIO`,
            font: FONT_FAMILY,
            size: 18,
            color: "475569",
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: nombreConsorcio,
            font: FONT_FAMILY,
            size: 18,
            bold: true,
            color: "475569",
          }),
        ],
      })
    );

    // Add signature blocks for individual member companies
    company.integrantesConsorcio.forEach((m, idx) => {
      memberRows.push(
        new Paragraph({ spacing: { before: 300, after: 80 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "_________________________________________________________",
              font: FONT_FAMILY,
              size: 20,
              color: "94A3B8",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: m.representante || `Representante Legal Empresa ${idx + 1}`,
              font: FONT_FAMILY,
              size: 19,
              bold: true,
              color: COLOR_PRIMARY,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `DNI N° ${m.dni || "-"} | Representante Legal de: ${m.razonSocial}`,
              font: FONT_FAMILY,
              size: 17,
              color: "475569",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `RUC N° ${m.ruc} (${m.porcentajeParticipacion}% de Participación en el Consorcio)`,
              font: FONT_FAMILY,
              size: 17,
              color: "64748B",
            }),
          ],
        })
      );
    });

    return memberRows;
  }

  // Individual company signature block
  return [
    new Paragraph({ spacing: { before: 500, after: 100 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "_________________________________________________________",
          font: FONT_FAMILY,
          size: 20,
          color: "64748B",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: company.representanteLegal,
          font: FONT_FAMILY,
          size: 20,
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `DNI N° ${company.dniRepresentante} - Representante Legal`,
          font: FONT_FAMILY,
          size: 18,
          color: "475569",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: company.razonSocial,
          font: FONT_FAMILY,
          size: 18,
          bold: true,
          color: "475569",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `RUC N° ${company.ruc}`,
          font: FONT_FAMILY,
          size: 18,
          color: "64748B",
        }),
      ],
    }),
  ];
}

// -------------------------------------------------------------
// 1. GENERATOR: ANEXO N° 1 (Datos del Postor)
// -------------------------------------------------------------
export async function generateAnexo1Docx(tender: TenderInfo, company: CompanyProfile): Promise<Blob> {
  const doc = new Document({
    ...createDocHeaderFooter(tender),
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "ANEXO N° 1",
                bold: true,
                size: 26,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: "DECLARACIÓN JURADA DE DATOS DEL POSTOR",
                bold: true,
                size: 22,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ text: "Señores\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: "COMITÉ DE SELECCIÓN / ÓRGANO ENCARGADO DE LAS CONTRATACIONES\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: `${tender.entidadConvocante}\n`, font: FONT_FAMILY, size: 20 }),
              new TextRun({ text: "Presente.-\n", font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Referencia: ", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: tender.nomenclatura, font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 250 },
            children: [
              new TextRun({
                text: `El que se suscribe, ${company.representanteLegal}, identificado con DNI N° ${company.dniRepresentante}, en calidad de Representante Legal de la empresa ${company.razonSocial}, con RUC N° ${company.ruc}, declara bajo juramento que la siguiente información se sujeta a la verdad:`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Table with company data
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createStyledTableCell("Razón Social / Denominación:", true, 35),
                  createStyledTableCell(company.razonSocial, false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("Número de RUC:", true, 35),
                  createStyledTableCell(company.ruc, false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("Registro Nacional de Proveedores (RNP):", true, 35),
                  createStyledTableCell(`VIGENTE (${company.registroRNP})`, false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("Domicilio Fiscal:", true, 35),
                  createStyledTableCell(`${company.domicilioFiscal} - ${company.distrito}, ${company.provincia}, ${company.departamento}`, false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("Teléfono de Contacto:", true, 35),
                  createStyledTableCell(company.telefono, false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("Correo Electrónico (Notificación):", true, 35),
                  createStyledTableCell(company.email, false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("Representante Legal:", true, 35),
                  createStyledTableCell(`${company.representanteLegal} (DNI N° ${company.dniRepresentante})`, false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("Partida Registral SUNARP:", true, 35),
                  createStyledTableCell(`Partida Electrónica N° ${company.partidaRegistralSunarp || "11029384"} - Asiento ${company.asientoRegistral || "A0001"}`, false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("Cuenta Bancaria y CCI (Para Pagos):", true, 35),
                  createStyledTableCell(`Banco: ${company.banco} | CCI: ${company.cuentaCCI}`, false, 65),
                ],
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 200, after: 200 },
            children: [
              new TextRun({
                text: "Asimismo, autorizo expresamente a la Entidad a efectuar las notificaciones correspondientes al correo electrónico consignado en el presente anexo, conforme a lo establecido en la Ley N° 30225 y su Reglamento.",
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({
                text: `Lima, ${new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),
          ...createSignatureBlock(company),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// -------------------------------------------------------------
// 2. GENERATOR: ANEXO N° 2 (Cumplimiento de TDR / EE.TT.)
// -------------------------------------------------------------
export async function generateAnexo2Docx(tender: TenderInfo, company: CompanyProfile, customText?: string): Promise<Blob> {
  const doc = new Document({
    ...createDocHeaderFooter(tender),
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "ANEXO N° 2", bold: true, size: 26, font: FONT_FAMILY, color: COLOR_PRIMARY }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: "DECLARACIÓN JURADA DE CUMPLIMIENTO DE LOS TÉRMINOS DE REFERENCIA / ESPECIFICACIONES TÉCNICAS",
                bold: true,
                size: 22,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ text: "Señores\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: "COMITÉ DE SELECCIÓN / ÓRGANO ENCARGADO DE LAS CONTRATACIONES\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: `${tender.entidadConvocante}\n`, font: FONT_FAMILY, size: 20 }),
              new TextRun({ text: "Presente.-\n", font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Referencia: ", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: tender.nomenclatura, font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `De nuestra consideración:\n\nEl que suscribe, ${company.representanteLegal}, representante legal de ${company.razonSocial}, con RUC N° ${company.ruc}, luego de haber examinado los documentos del procedimiento de selección de la referencia, y conocer todas las condiciones existentes, el postor ofrece ejecutar la prestación de: "${tender.resumenAlcance}", de estricta conformidad con los Términos de Referencia, Especificaciones Técnicas y demás condiciones contenidas en las Bases del presente procedimiento.`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Specific bullet points of compliance
          new Paragraph({
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({ text: "DECLARAMOS FORMALMENTE:", bold: true, size: 20, font: FONT_FAMILY, color: COLOR_PRIMARY }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "Que cumplimos al 100% con la totalidad de los Requisitos Técnicos Mínimos (RTM) y condiciones operativas exigidas por la Entidad Convocante.",
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: `Que el lugar de prestación se desarrollará estrictamente en: ${tender.lugarEjecucion}.`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: `Que nos comprometemos a mantener el personal clave y equipamiento estratégico debidamente acreditado y habilitado durante todo el periodo contractual.`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: "Que asumimos total responsabilidad técnica, legal y de garantía comercial sobre la prestación ejecutada.",
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          ...(customText ? [
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { before: 150, after: 150 },
              children: [
                new TextRun({ text: "DETALLE Y METODOLOGÍA COMPLEMENTARIA:\n", bold: true, size: 20, font: FONT_FAMILY }),
                new TextRun({ text: customText, size: 19, font: FONT_FAMILY }),
              ],
            }),
          ] : []),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: `Lima, ${new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),
          ...createSignatureBlock(company),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// -------------------------------------------------------------
// 3. GENERATOR: ANEXO N° 3 (Plazo de Entrega)
// -------------------------------------------------------------
export async function generateAnexo3Docx(tender: TenderInfo, company: CompanyProfile): Promise<Blob> {
  const doc = new Document({
    ...createDocHeaderFooter(tender),
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "ANEXO N° 3", bold: true, size: 26, font: FONT_FAMILY, color: COLOR_PRIMARY }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: "DECLARACIÓN JURADA DE PLAZO DE ENTREGA / PRESTACIÓN",
                bold: true,
                size: 22,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ text: "Señores\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: "COMITÉ DE SELECCIÓN / ÓRGANO ENCARGADO DE LAS CONTRATACIONES\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: `${tender.entidadConvocante}\n`, font: FONT_FAMILY, size: 20 }),
              new TextRun({ text: "Presente.-\n", font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Referencia: ", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: tender.nomenclatura, font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 250 },
            children: [
              new TextRun({
                text: `El que suscribe, ${company.representanteLegal}, representante legal de ${company.razonSocial}, con RUC N° ${company.ruc}, declara bajo juramento que el postor se compromete a ejecutar y entregar la totalidad de la prestación objeto de la convocatoria en el plazo de:`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Box highlighting the committed duration
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: COLOR_GRAY_BG },
                    margins: { top: 200, bottom: 200, left: 200, right: 200 },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 2, color: COLOR_SECONDARY },
                      bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR_SECONDARY },
                      left: { style: BorderStyle.SINGLE, size: 2, color: COLOR_SECONDARY },
                      right: { style: BorderStyle.SINGLE, size: 2, color: COLOR_SECONDARY },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: `PLAZO OFERTADO: ${tender.plazoEjecucion.toUpperCase()}`,
                            bold: true,
                            font: FONT_FAMILY,
                            size: 24,
                            color: COLOR_PRIMARY,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 100 },
                        children: [
                          new TextRun({
                            text: "(Contabilizados a partir del día siguiente del perfeccionamiento del contrato o de cumplidas las condiciones previstas en las Bases)",
                            font: FONT_FAMILY,
                            size: 18,
                            italics: true,
                            color: "475569",
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 250, after: 100 },
            children: [
              new TextRun({
                text: `Lima, ${new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),
          ...createSignatureBlock(company),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// -------------------------------------------------------------
// 4. GENERATOR: ANEXO N° 4 (Declaración Jurada Art. 52 RLCE)
// -------------------------------------------------------------
export async function generateAnexo4Docx(tender: TenderInfo, company: CompanyProfile): Promise<Blob> {
  const doc = new Document({
    ...createDocHeaderFooter(tender),
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "ANEXO N° 4", bold: true, size: 26, font: FONT_FAMILY, color: COLOR_PRIMARY }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: "DECLARACIÓN JURADA DE CUMPLIMIENTO DEL ARTÍCULO 52 DEL REGLAMENTO DE LA LEY DE CONTRATACIONES DEL ESTADO",
                bold: true,
                size: 21,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ text: "Señores\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: "COMITÉ DE SELECCIÓN / ÓRGANO ENCARGADO DE LAS CONTRATACIONES\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: `${tender.entidadConvocante}\n`, font: FONT_FAMILY, size: 20 }),
              new TextRun({ text: "Presente.-\n", font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Referencia: ", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: tender.nomenclatura, font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `El que suscribe, ${company.representanteLegal}, identificado con DNI N° ${company.dniRepresentante}, en calidad de Representante Legal de ${company.razonSocial}, con RUC N° ${company.ruc}, declara bajo juramento lo siguiente:`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Mandated clauses
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: "1. No haber incurrido y obligarse a no incurrir en actos de corrupción, así como a respetar el principio de integridad establecido en el artículo 2 de la Ley de Contrataciones del Estado.",
                font: FONT_FAMILY,
                size: 19,
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: "2. No tener impedimento para postular en el procedimiento de selección ni para contratar con el Estado, conforme al artículo 11 de la Ley de Contrataciones del Estado.",
                font: FONT_FAMILY,
                size: 19,
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: "3. Que la información y documentación presentada en nuestra oferta es veraz, conforme al principio de presunción de veracidad establecido en el TUO de la Ley N° 27444.",
                font: FONT_FAMILY,
                size: 19,
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: "4. Conocer las sanciones contenidas en la Ley de Contrataciones del Estado y su Reglamento, así como las disposiciones del Código Penal aplicables.",
                font: FONT_FAMILY,
                size: 19,
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: "5. Comprometerse a comunicar oportunamente cualquier cambio en nuestra situación jurídica o incompatibilidad sobreviniente.",
                font: FONT_FAMILY,
                size: 19,
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: `Lima, ${new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),
          ...createSignatureBlock(company),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// -------------------------------------------------------------
// 4.5 GENERATOR: ANEXO N° 5 (Promesa Formal de Consorcio - OSCE Directiva N° 005-2019-OSCE/CD)
// -------------------------------------------------------------
export async function generateAnexo5PromesaConsorcioDocx(tender: TenderInfo, company: CompanyProfile): Promise<Blob> {
  const members = company.integrantesConsorcio && company.integrantesConsorcio.length > 0
    ? company.integrantesConsorcio
    : [
        {
          id: "m1",
          razonSocial: company.razonSocial,
          ruc: company.ruc,
          porcentajeParticipacion: 60,
          obligaciones: "Ejecución de partidas de obras preliminares, movimiento de tierras, pavimentación y dirección técnica",
          representante: company.representanteLegal,
          dni: company.dniRepresentante,
          domicilioFiscal: company.domicilioFiscal,
          registroRNP: company.registroRNP,
        },
        {
          id: "m2",
          razonSocial: "EMPRESA CONSORCIADA B S.A.C.",
          ruc: "20609876543",
          porcentajeParticipacion: 40,
          obligaciones: "Aporte de maquinaria pesada, ensayos de laboratorio y obras de arte",
          representante: "Ing. Segundo Consorciado",
          dni: "41987654",
          domicilioFiscal: "Av. Industrial 450, Lima",
          registroRNP: "Ejecutor de Obras",
        },
      ];

  const repComun = company.representanteComunConsorcio || company.representanteLegal;
  const dniComun = company.dniRepresentanteComun || company.dniRepresentante;
  const domComun = company.domicilioComunConsorcio || company.domicilioFiscal;
  const emailComun = company.emailComunConsorcio || company.email;
  const nombreConsorcio = company.nombreConsorcio || company.razonSocial;

  // Build members table rows
  const memberTableRows: TableRow[] = [
    new TableRow({
      children: [
        createStyledTableCell("INTEGRANTE DEL CONSORCIO / RUC", true, 30),
        createStyledTableCell("% PART.", true, 12, AlignmentType.CENTER),
        createStyledTableCell("OBLIGACIONES ESPECÍFICAS ASUMIDAS EN EL CONTRATO", true, 58),
      ],
    }),
  ];

  members.forEach((m) => {
    memberTableRows.push(
      new TableRow({
        children: [
          createStyledTableCell(`${m.razonSocial}\nRUC N° ${m.ruc}\nRep: ${m.representante} (DNI ${m.dni})`, false, 30),
          createStyledTableCell(`${m.porcentajeParticipacion}%`, false, 12, AlignmentType.CENTER),
          createStyledTableCell(m.obligaciones || "Ejecución técnica y operativa de partidas contractuales", false, 58),
        ],
      })
    );
  });

  const doc = new Document({
    ...createDocHeaderFooter(tender),
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "ANEXO N° 5", bold: true, size: 26, font: FONT_FAMILY, color: COLOR_PRIMARY }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: "PROMESA FORMAL DE CONSORCIO",
                bold: true,
                size: 22,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 250 },
            children: [
              new TextRun({
                text: "(Directiva N° 005-2019-OSCE/CD y Art. 49 del Reglamento de la Ley de Contrataciones del Estado)",
                italics: true,
                size: 18,
                font: FONT_FAMILY,
                color: "475569",
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ text: "Señores\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: "COMITÉ DE SELECCIÓN / ÓRGANO ENCARGADO DE LAS CONTRATACIONES\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: `${tender.entidadConvocante}\n`, font: FONT_FAMILY, size: 20 }),
              new TextRun({ text: "Presente.-\n", font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Referencia: ", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: `${tender.nomenclatura} - ${tender.descripcionObjeto || tender.objetoContratacion}`, font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `Los suscritos, en calidad de Representantes Legales debidamente facultados de las personas jurídicas que a continuación se detallan, expresamos nuestra voluntad irrevocable de participar de manera consorciada en el procedimiento de selección de la referencia, bajo las siguientes estipulaciones:`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Cláusula Primera: Denominación
          new Paragraph({
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({ text: "CLÁUSULA PRIMERA: DENOMINACIÓN DEL CONSORCIO\n", bold: true, font: FONT_FAMILY, size: 20, color: COLOR_PRIMARY }),
              new TextRun({
                text: `Los consorciados acuerdan que la denominación oficial del consorcio para todos los efectos del presente procedimiento de selección y ejecución del contrato derivado del mismo será: `,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({ text: `\"${nombreConsorcio.toUpperCase()}\".`, bold: true, font: FONT_FAMILY, size: 20, color: COLOR_PRIMARY }),
            ],
          }),

          // Cláusula Segunda: Representante Común
          new Paragraph({
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({ text: "CLÁUSULA SEGUNDA: DESIGNACIÓN DEL REPRESENTANTE COMÚN\n", bold: true, font: FONT_FAMILY, size: 20, color: COLOR_PRIMARY }),
              new TextRun({
                text: `Se designa como REPRESENTANTE COMÚN DEL CONSORCIO a Don(ña) `,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({ text: `${repComun}, `, bold: true, font: FONT_FAMILY, size: 20 }),
              new TextRun({
                text: `identificado(a) con DNI N° ${dniComun}, otorgándole facultades amplias y suficientes para representarnos en todos los actos del procedimiento de selección, presentar la oferta técnica y económica, formular consultas y observaciones, interponer recursos, suscribir el contrato de consorcio y el contrato de obra/servicio con la Entidad, así como para efectuar cobros y liquidaciones.`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Cláusula Tercera: Domicilio y Notificaciones
          new Paragraph({
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({ text: "CLÁUSULA TERCERA: DOMICILIO COMÚN Y NOTIFICACIONES\n", bold: true, font: FONT_FAMILY, size: 20, color: COLOR_PRIMARY }),
              new TextRun({
                text: `Para efectos de las notificaciones durante el procedimiento de selección y la ejecución contractual, fijamos como Domicilio Común: ${domComun}; y como Correo Electrónico Común Oficial: ${emailComun}, autorizando expresamente a la Entidad a efectuar todas las comunicaciones y notificaciones válidas a dicha casilla electrónica.`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Cláusula Cuarta: Porcentajes y Obligaciones
          new Paragraph({
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({ text: "CLÁUSULA CUARTA: PORCENTAJES DE PARTICIPACIÓN Y OBLIGACIONES ASUMIDAS\n", bold: true, font: FONT_FAMILY, size: 20, color: COLOR_PRIMARY }),
              new TextRun({
                text: `El porcentaje de participación de cada consorciado y el detalle pormenorizado de las obligaciones que asume cada integrante en la ejecución del objeto de la contratación se establecen a continuación:`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: memberTableRows,
          }),

          // Cláusula Quinta: Responsabilidad Solidaria
          new Paragraph({
            spacing: { before: 180, after: 120 },
            children: [
              new TextRun({ text: "CLÁUSULA QUINTA: RESPONSABILIDAD SOLIDARIA\n", bold: true, font: FONT_FAMILY, size: 20, color: COLOR_PRIMARY }),
              new TextRun({
                text: `Los integrantes del Consorcio declaramos expresamente que asumimos RESPONSABILIDAD SOLIDARIA E INDIVISIBLE ante la Entidad por todas y cada una de las obligaciones derivadas de la presentación de la oferta, de la suscripción y ejecución del contrato, así como por las penalidades o indemnizaciones a que hubiere lugar conforme al artículo 13 de la Ley N° 30225 y normas concordantes.`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: `Lima, ${new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 150 },
            children: [
              new TextRun({
                text: "(Firmas legalizadas ante Notario Público de los Representantes Legales de cada una de las empresas integrantes)",
                italics: true,
                size: 18,
                font: FONT_FAMILY,
                color: "64748B",
              }),
            ],
          }),
          ...createSignatureBlock(company),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// -------------------------------------------------------------
// 5. GENERATOR: ANEXO N° 6 / OFERTA ECONÓMICA
// -------------------------------------------------------------
export async function generateAnexo6EconomicoDocx(
  tender: TenderInfo,
  company: CompanyProfile,
  montoOfertado: number,
  incluyeIGV = true
): Promise<Blob> {
  const montoLetras = numeroALetras(montoOfertado);
  const subtotal = incluyeIGV ? montoOfertado / 1.18 : montoOfertado;
  const igv = incluyeIGV ? montoOfertado - subtotal : 0;

  const doc = new Document({
    ...createDocHeaderFooter(tender),
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "ANEXO N° 6", bold: true, size: 26, font: FONT_FAMILY, color: COLOR_PRIMARY }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: "OFERTA ECONÓMICA DEL POSTOR",
                bold: true,
                size: 22,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ text: "Señores\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: "COMITÉ DE SELECCIÓN / ÓRGANO ENCARGADO DE LAS CONTRATACIONES\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: `${tender.entidadConvocante}\n`, font: FONT_FAMILY, size: 20 }),
              new TextRun({ text: "Presente.-\n", font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Referencia: ", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: tender.nomenclatura, font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `El que suscribe, ${company.representanteLegal}, representante legal de ${company.razonSocial}, con RUC N° ${company.ruc}, luego de haber examinado las bases del procedimiento de selección y el alcance de las prestaciones, ofrece ejecutar el servicio/obra/suministro por el siguiente monto:`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Economic table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createStyledTableCell("CONCEPTO", true, 60),
                  createStyledTableCell("MONTO EN SOLES (S/)", true, 40, AlignmentType.RIGHT),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("Valor Venta / Subtotal:", false, 60),
                  createStyledTableCell(formatPEN(subtotal), false, 40, AlignmentType.RIGHT),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell(incluyeIGV ? "Impuesto General a las Ventas (18% IGV):" : "IGV (Exonerado por Ley):", false, 60),
                  createStyledTableCell(formatPEN(igv), false, 40, AlignmentType.RIGHT),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("MONTO TOTAL OFERTADO:", true, 60),
                  createStyledTableCell(formatPEN(montoOfertado), true, 40, AlignmentType.RIGHT),
                ],
              }),
            ],
          }),

          // Monto en letras
          new Paragraph({
            spacing: { before: 200, after: 150 },
            children: [
              new TextRun({ text: "SON: ", font: FONT_FAMILY, size: 20, bold: true, color: COLOR_PRIMARY }),
              new TextRun({ text: montoLetras, font: FONT_FAMILY, size: 20, bold: true }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: "El precio de la presente oferta incluye todos los tributos, seguros, transporte, inspecciones, pruebas y costos laborales conforme a la legislación vigente, así como cualquier otro costo que pueda tener incidencia sobre la ejecución de la prestación objeto del contrato.",
                font: FONT_FAMILY,
                size: 19,
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: `Lima, ${new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),
          ...createSignatureBlock(company),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// -------------------------------------------------------------
// 6. GENERATOR: ANEXO N° 8 (Experiencia del Postor en la Especialidad)
// -------------------------------------------------------------
export async function generateAnexo8ExperienciaDocx(
  tender: TenderInfo,
  company: CompanyProfile,
  experienceRecords: ExperienceRecord[]
): Promise<Blob> {
  const totalMontoSoles = experienceRecords.reduce((acc, curr) => acc + (curr.montoEnSoles || 0), 0);

  const tableRows = [
    new TableRow({
      children: [
        createStyledTableCell("N°", true, 4, AlignmentType.CENTER),
        createStyledTableCell("CLIENTE / ENTIDAD", true, 22),
        createStyledTableCell("OBJETO DEL CONTRATO / TIPOLOGÍA OFICIAL (RD N° 0016-2025-EF)", true, 30),
        createStyledTableCell("N° DOC. / CONTRATO", true, 16),
        createStyledTableCell("F. CONFORMIDAD", true, 12, AlignmentType.CENTER),
        createStyledTableCell("IMPORTE (S/)", true, 16, AlignmentType.RIGHT),
      ],
    }),
    ...experienceRecords.map((item, index) => {
      const descObj = item.tipologia 
        ? `${item.objetoContrato}\n[Tipología: ${item.tipologia}]`
        : item.subEspecialidad
        ? `${item.objetoContrato}\n[Subesp: ${item.subEspecialidad}]`
        : item.objetoContrato;

      return new TableRow({
        children: [
          createStyledTableCell((index + 1).toString(), false, 4, AlignmentType.CENTER),
          createStyledTableCell(`${item.cliente}\n(${item.tipoCliente || "Público"})`, false, 22),
          createStyledTableCell(descObj, false, 30),
          createStyledTableCell(item.nroDocumento, false, 16),
          createStyledTableCell(item.fechaConformidad, false, 12, AlignmentType.CENTER),
          createStyledTableCell(formatPEN(item.montoEnSoles), false, 16, AlignmentType.RIGHT),
        ],
      });
    }),
    new TableRow({
      children: [
        createStyledTableCell("TOTAL ACUMULADO:", true, 84, AlignmentType.RIGHT),
        createStyledTableCell(formatPEN(totalMontoSoles), true, 16, AlignmentType.RIGHT),
      ],
    }),
  ];

  const doc = new Document({
    ...createDocHeaderFooter(tender),
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "ANEXO N° 8", bold: true, size: 26, font: FONT_FAMILY, color: COLOR_PRIMARY }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: "EXPERIENCIA DEL POSTOR EN LA ESPECIALIDAD",
                bold: true,
                size: 22,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: "(Conforme a la Ley N° 32069, D.S. N° 009-2025-EF y Resolución Directoral N° 0016-2025-EF/54.01)",
                italics: true,
                size: 17,
                font: FONT_FAMILY,
                color: "475569",
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ text: "Señores\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: "COMITÉ DE SELECCIÓN / ÓRGANO ENCARGADO DE LAS CONTRATACIONES\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: `${tender.entidadConvocante}\n`, font: FONT_FAMILY, size: 20 }),
              new TextRun({ text: "Presente.-\n", font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ text: "Referencia: ", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: `${tender.nomenclatura}\n`, font: FONT_FAMILY, size: 20 }),
              new TextRun({ text: "Especialidad Oficial: ", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: `${tender.especialidad || "Viales, Puertos y Afines"}\n`, font: FONT_FAMILY, size: 20 }),
              new TextRun({ text: "Subespecialidad / Tipología: ", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: `${tender.subEspecialidad || "Vías urbanas"}${tender.tipologia ? ` - ${tender.tipologia}` : ""}`, font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `El que suscribe, ${company.representanteLegal}, representante legal de ${company.razonSocial}, con RUC N° ${company.ruc}, detalla a continuación las contrataciones ejecutadas correspondientes a la especialidad y subespecialidad requerida conforme al catálogo oficial aprobado por Resolución Directoral N° 0016-2025-EF/54.01 y las Bases ("${tender.requisitosCalificacion?.experienciaPostor?.definicionObrasSimilares || tender.requisitosCalificacion?.experienciaPostor?.descripcionSimilaridad || 'Obras similares ejecutadas satisfactoriamente'}"), adjuntando copia simple de los contratos y sus respectivas actas de recepción, liquidaciones de obra o comprobantes de pago cancelados:`,
                font: FONT_FAMILY,
                size: 19,
              }),
            ],
          }),

          // Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),

          new Paragraph({
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({
                text: `Monto mínimo exigido en bases: ${tender.requisitosCalificacion?.experienciaPostor?.montoMinimoAcumulado || formatPEN(tender.valorNumerico || 514737.28)}`,
                font: FONT_FAMILY,
                size: 19,
                bold: true,
                color: COLOR_SECONDARY,
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: `Lima, ${new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),
          ...createSignatureBlock(company),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// -------------------------------------------------------------
// 6B. GENERATOR: FICHA DE CLASIFICACIÓN TÉCNICA (RD N° 0016-2025-EF/54.01)
// -------------------------------------------------------------
export async function generateFichaClasificacionEspecialidadDocx(
  tender: TenderInfo,
  company: CompanyProfile
): Promise<Blob> {
  const doc = new Document({
    ...createDocHeaderFooter(tender),
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: "FICHA DE CLASIFICACIÓN TÉCNICA DE OBRA / CONSULTORÍA",
                bold: true,
                size: 24,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: "Conforme a la Resolución Directoral N° 0016-2025-EF/54.01 y Art. 157 del D.S. N° 009-2025-EF (Reglamento Ley N° 32069)",
                italics: true,
                size: 17,
                font: FONT_FAMILY,
                color: "475569",
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ text: "1. DATOS DEL PROCEDIMIENTO DE SELECCIÓN", bold: true, size: 20, font: FONT_FAMILY, color: COLOR_PRIMARY }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createStyledTableCell("Nomenclatura SEACE:", true, 30),
                  createStyledTableCell(tender.nomenclatura, false, 70),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("Entidad Convocante:", true, 30),
                  createStyledTableCell(tender.entidadConvocante, false, 70),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("Objeto de Contratación:", true, 30),
                  createStyledTableCell(tender.objetoContratacion, false, 70),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("Sistema de Contratación:", true, 30),
                  createStyledTableCell(tender.sistemaContratacion, false, 70),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("Valor Referencial:", true, 30),
                  createStyledTableCell(tender.valorEstimadoReferencial || formatPEN(tender.valorNumerico || 514737.28), false, 70),
                ],
              }),
            ],
          }),

          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({ text: "2. CLASIFICACIÓN OFICIAL DE ESPECIALIDAD Y SUBESPECIALIDAD", bold: true, size: 20, font: FONT_FAMILY, color: COLOR_PRIMARY }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createStyledTableCell("Especialidad Oficial (D.S. 009-2025-EF Art. 157.2):", true, 35),
                  createStyledTableCell(tender.especialidad || "Viales, Puertos y Afines", true, 65),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("Subespecialidad (R.D. 0016-2025-EF/54.01):", true, 35),
                  createStyledTableCell(tender.subEspecialidad || "Vías urbanas", false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("Tipología Conforme al Catálogo:", true, 35),
                  createStyledTableCell(tender.tipologia || "Pistas, veredas, ciclovías, puentes peatonales, puentes vehiculares urbanos, pasajes peatonales y carreteras vecinales", false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("Definición de Similaridad en Bases:", true, 35),
                  createStyledTableCell(tender.requisitosCalificacion?.experienciaPostor?.definicionObrasSimilares || tender.requisitosCalificacion?.experienciaPostor?.descripcionSimilaridad || "Obras viales de similar naturaleza", false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createStyledTableCell("Postor Declarado:", true, 35),
                  createStyledTableCell(`${company.razonSocial} (RUC: ${company.ruc})`, false, 65),
                ],
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 200, after: 150 },
            children: [
              new TextRun({
                text: "DECLARACIÓN JURADA DE CONCORDANCIA TÉCNICA: El postor declara bajo juramento que toda la experiencia presentada en el Anexo N° 8 se encuentra debidamente alineada y clasificada dentro de la especialidad, subespecialidad y tipologías normadas en la Resolución Directoral N° 0016-2025-EF/54.01, garantizando el estricto cumplimiento de los requisitos de calificación del Capítulo III de las Bases Administrativas.",
                font: FONT_FAMILY,
                size: 19,
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: `Lima, ${new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),
          ...createSignatureBlock(company),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// -------------------------------------------------------------
// 7. GENERATOR: PERSONAL CLAVE & EQUIPAMIENTO
// -------------------------------------------------------------
export async function generatePersonalYEquipamientoDocx(
  tender: TenderInfo,
  company: CompanyProfile,
  personnel: KeyPersonnel[],
  equipment: EquipmentItem[]
): Promise<Blob> {
  const persRows = [
    new TableRow({
      children: [
        createStyledTableCell("CARGO POSTULADO", true, 25),
        createStyledTableCell("NOMBRE COMPLETO", true, 30),
        createStyledTableCell("PROFESIÓN / CIP", true, 25),
        createStyledTableCell("EXP. ACREDITADA", true, 20),
      ],
    }),
    ...personnel.map((p) => {
      return new TableRow({
        children: [
          createStyledTableCell(p.cargoPostulado, true, 25),
          createStyledTableCell(p.nombreCompleto, false, 30),
          createStyledTableCell(`${p.profesion} (CIP N° ${p.cipOCol})`, false, 25),
          createStyledTableCell(`${p.tiempoExperienciaMeses} meses (${p.documentosAcreditacion})`, false, 20),
        ],
      });
    }),
  ];

  const eqRows = [
    new TableRow({
      children: [
        createStyledTableCell("DENOMINACIÓN / EQUIPO", true, 30),
        createStyledTableCell("MARCA Y MODELO", true, 25),
        createStyledTableCell("AÑO / CAPACIDAD", true, 20),
        createStyledTableCell("DISPONIBILIDAD / SUSTENTO", true, 25),
      ],
    }),
    ...equipment.map((e) => {
      return new TableRow({
        children: [
          createStyledTableCell(e.denominacion, true, 30),
          createStyledTableCell(e.marcaModelo, false, 25),
          createStyledTableCell(`${e.anioFabricacion} - ${e.capacidad}`, false, 20),
          createStyledTableCell(`${e.estadoDisponibilidad} (${e.sustento})`, false, 25),
        ],
      });
    }),
  ];

  const doc = new Document({
    ...createDocHeaderFooter(tender),
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "DOCUMENTOS DE CALIFICACIÓN TÉCNICA",
                bold: true,
                size: 24,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: "CARTA DE ACREDITACIÓN DE PERSONAL CLAVE Y EQUIPAMIENTO ESTRATÉGICO",
                bold: true,
                size: 20,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ text: "Señores\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: "COMITÉ DE SELECCIÓN / ÓRGANO ENCARGADO DE LAS CONTRATACIONES\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: `${tender.entidadConvocante}\n`, font: FONT_FAMILY, size: 20 }),
              new TextRun({ text: "Presente.-\n", font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Referencia: ", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: tender.nomenclatura, font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `El que suscribe, ${company.representanteLegal}, en representación de ${company.razonSocial}, presenta la relación formal de los profesionales y equipamiento asignados a la presente contratación:`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Personal Clave Header
          new Paragraph({
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({ text: "1. RELACIÓN DE PERSONAL CLAVE ASIGNADO:", bold: true, size: 20, font: FONT_FAMILY, color: COLOR_PRIMARY }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: persRows,
          }),

          // Equipamiento Header
          new Paragraph({
            spacing: { before: 250, after: 100 },
            children: [
              new TextRun({ text: "2. RELACIÓN DE EQUIPAMIENTO ESTRATÉGICO:", bold: true, size: 20, font: FONT_FAMILY, color: COLOR_PRIMARY }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: eqRows,
          }),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 250, after: 100 },
            children: [
              new TextRun({
                text: `Lima, ${new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),
          ...createSignatureBlock(company),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// -------------------------------------------------------------
// 8. GENERATOR: PLIEGO DE CONSULTAS Y OBSERVACIONES (Art. 72 RLCE)
// -------------------------------------------------------------
export async function generateConsultasObservacionesDocx(
  tender: TenderInfo,
  company: CompanyProfile,
  observations: ObservationItem[]
): Promise<Blob> {
  const doc = new Document({
    ...createDocHeaderFooter(tender),
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "PLIEGO DE CONSULTAS Y OBSERVACIONES A LAS BASES",
                bold: true,
                size: 24,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: "(Artículo 72 del Reglamento de la Ley N° 30225 - D.S. N° 344-2018-EF y modificatorias)",
                font: FONT_FAMILY,
                size: 18,
                italics: true,
                color: "475569",
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ text: "Señores\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: "COMITÉ DE SELECCIÓN\n", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: `${tender.entidadConvocante}\n`, font: FONT_FAMILY, size: 20 }),
              new TextRun({ text: "Presente.-\n", font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Procedimiento: ", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: tender.nomenclatura, font: FONT_FAMILY, size: 20 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 250 },
            children: [
              new TextRun({ text: "Participante: ", font: FONT_FAMILY, size: 20, bold: true }),
              new TextRun({ text: `${company.razonSocial} (RUC: ${company.ruc})`, font: FONT_FAMILY, size: 20 }),
            ],
          }),

          ...observations.flatMap((obs, idx) => [
            new Paragraph({
              spacing: { before: 200, after: 100 },
              children: [
                new TextRun({
                  text: `${obs.tipo} N° ${idx + 1}: ${obs.seccionBases || obs.numeralBases || "Capítulo III"}`,
                  bold: true,
                  size: 21,
                  font: FONT_FAMILY,
                  color: COLOR_SECONDARY,
                }),
              ],
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    createStyledTableCell("Sección / Numeral de Bases:", true, 30),
                    createStyledTableCell(obs.seccionBases || obs.numeralBases || "Capítulo III", false, 70),
                  ],
                }),
                new TableRow({
                  children: [
                    createStyledTableCell("Vulneración Normativa:", true, 30),
                    createStyledTableCell(obs.vulneracionNormativa || obs.sustentoLegalTecnico || "Normativa de Contrataciones del Estado", false, 70),
                  ],
                }),
                new TableRow({
                  children: [
                    createStyledTableCell("Fundamentación Jurídica / Técnica:", true, 30),
                    createStyledTableCell(obs.fundamento || obs.consultaObservacion || "", false, 70),
                  ],
                }),
                new TableRow({
                  children: [
                    createStyledTableCell("Petición Concreta al Comité:", true, 30),
                    createStyledTableCell(obs.peticionConcreta || obs.propuestaSolucion || "Modificar extremo observado conforme a ley", false, 70),
                  ],
                }),
              ],
            }),
          ]),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 250, after: 100 },
            children: [
              new TextRun({
                text: `Lima, ${new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),
          ...createSignatureBlock(company),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// -------------------------------------------------------------
// 10. GENERATOR: CONTRATO PRIVADO DE CONSORCIO (CON FIRMAS NOTARIALES)
// -------------------------------------------------------------
export async function generateContratoConsorcioDocx(
  tender: TenderInfo,
  company: CompanyProfile
): Promise<Blob> {
  const members = company.integrantesConsorcio && company.integrantesConsorcio.length > 0
    ? company.integrantesConsorcio
    : [
        {
          id: "m1",
          razonSocial: company.razonSocial || "EMPRESA CONSORCIADA 1 S.A.C.",
          ruc: company.ruc || "20542350033",
          porcentajeParticipacion: 95,
          obligaciones: "Ejecución integral de la obra/servicio, aporte de experiencia en la especialidad, responsabilidad por la dirección técnica y administración financiera.",
          representante: company.representanteLegal || "Henry Omar Marrufo Delgado",
          dni: company.dniRepresentante || "43900892",
          cargoRepresentante: "Gerente General",
          domicilioFiscal: company.domicilioFiscal || "Jr. Colón N° 958, Rioja, San Martín",
          partidaRegistralSunarp: company.partidaRegistralSunarp || "11052546",
          asientoRegistral: company.asientoRegistral || "C00003",
          sedeRegistral: company.sedeRegistral || "Oficina Registral de Moyobamba",
        },
        {
          id: "m2",
          razonSocial: "EMPRESA CONSORCIADA 2 S.A.C.",
          ruc: "20601280834",
          porcentajeParticipacion: 5,
          obligaciones: "Elaboración y formulación de la oferta técnica y económica, recopilación y presentación del plantel profesional clave y equipamiento.",
          representante: "Jhonny Reategui Alegría",
          dni: "43500740",
          cargoRepresentante: "Gerente General",
          domicilioFiscal: "Julio C. Arana N° 312, Rioja, San Martín",
          partidaRegistralSunarp: "11084474",
          asientoRegistral: "C00002",
          sedeRegistral: "Oficina Registral de Tarapoto",
        },
      ];

  const nombreConsorcio = (company.nombreConsorcio || "CONSORCIO").toUpperCase();
  const repComun = company.representanteComunConsorcio || company.representanteLegal || members[0].representante;
  const dniComun = company.dniRepresentanteComun || company.dniRepresentante || members[0].dni;
  const repAlterno = company.representanteAlternoConsorcio || members[1]?.representante || repComun;
  const dniAlterno = company.dniRepresentanteAlterno || members[1]?.dni || dniComun;
  const domComun = company.domicilioComunConsorcio || company.domicilioFiscal || members[0].domicilioFiscal || "Jr. Colón N° 958, Rioja, San Martín";
  const emailComun = company.emailComunConsorcio || company.email || "consorcio.licitacion@gmail.com";
  const opTributario = company.operadorTributario || members[0].razonSocial;
  const ciudadFirma = company.ciudadFirmaContrato || company.distrito || "Rioja";
  const fechaFirma = company.fechaFirmaContrato || new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
  const centroArbitraje = company.centroArbitraje || "Centro de Arbitraje de la Pontificia Universidad Católica del Perú (PUCP) / OSCE";

  const memberIntroParagraphs: Paragraph[] = members.map((m, idx) => {
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 120, after: 120 },
      children: [
        new TextRun({
          text: `•  ${m.razonSocial.toUpperCase()}`,
          bold: true,
          font: FONT_FAMILY,
          size: 20,
          color: COLOR_PRIMARY,
        }),
        new TextRun({
          text: `, con RUC N° ${m.ruc}, con domicilio legal en ${m.domicilioFiscal || "según ficha RUC"}, inscrito en la partida N° ${m.partidaRegistralSunarp || "11052546"} Asiento N° ${m.asientoRegistral || "C00003"} del Registro de Personas Jurídicas de la ${m.sedeRegistral || "Zona Registral SUNARP"}, debidamente representado por su ${m.cargoRepresentante || "Gerente General"}, Don(ña) `,
          font: FONT_FAMILY,
          size: 20,
        }),
        new TextRun({
          text: `${m.representante.toUpperCase()}`,
          bold: true,
          font: FONT_FAMILY,
          size: 20,
        }),
        new TextRun({
          text: `, peruano(a) identificado(a) con DNI N° ${m.dni}, empresario(a), quien declara proceder en representación de ${m.razonSocial.toUpperCase()}, en su condición de ${m.cargoRepresentante || "Gerente General"}, cuyo mandato expresa estar vigente e inscrito en la partida mencionada precedentemente y por lo cual asume plena responsabilidad jurídica por los efectos que esta declaración pueda derivar. ==========================================================`,
          font: FONT_FAMILY,
          size: 20,
        }),
      ],
    });
  });

  const memberObligationsParagraphs: Paragraph[] = members.flatMap((m, idx) => [
    new Paragraph({
      spacing: { before: 140, after: 60 },
      children: [
        new TextRun({
          text: `${idx + 1}.  ${m.razonSocial.toUpperCase()} [${m.porcentajeParticipacion.toFixed(2)}%]`,
          bold: true,
          font: FONT_FAMILY,
          size: 20,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `    - ${m.obligaciones || "Ejecución integral de las prestaciones técnicas contractuales."}`,
          font: FONT_FAMILY,
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `    - Aportar experiencia del postor en la especialidad, siendo responsable de la revisión, veracidad y autenticidad de los documentos que acrediten su experiencia.`,
          font: FONT_FAMILY,
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: `    - Responsable de la recopilación, elaboración, veracidad, autenticidad y presentación de la documentación técnica y administrativa para el perfeccionamiento del contrato.`,
          font: FONT_FAMILY,
          size: 20,
        }),
      ],
    }),
  ]);

  const doc = new Document({
    ...createDocHeaderFooter(tender),
    sections: [
      {
        properties: {},
        children: [
          // Titulo Principal
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: "CONTRATO DE CONSORCIO QUE CELEBRAN LAS EMPRESAS:",
                bold: true,
                size: 22,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 250 },
            children: [
              new TextRun({
                text: members.map((m) => m.razonSocial.toUpperCase()).join(" Y "),
                bold: true,
                size: 20,
                font: FONT_FAMILY,
                color: COLOR_SECONDARY,
              }),
            ],
          }),

          // Introducción
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: "Conste por el presente documento privado el contrato de consorcio que celebran de una parte:",
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          ...memberIntroParagraphs,

          new Paragraph({
            spacing: { before: 150, after: 150 },
            children: [
              new TextRun({
                text: "Bajo los términos y condiciones siguientes:",
                bold: true,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Cláusula Primera: Objeto del Contrato
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({
                text: "CLÁUSULA PRIMERA.- OBJETO DEL CONTRATO================================================\n",
                bold: true,
                font: FONT_FAMILY,
                size: 20,
                color: COLOR_PRIMARY,
              }),
              new TextRun({
                text: `Las partes de común acuerdo, constituyen el consorcio denominado `,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: `\"${nombreConsorcio}\"`,
                bold: true,
                font: FONT_FAMILY,
                size: 20,
                color: COLOR_PRIMARY,
              }),
              new TextRun({
                text: ` integrado por ${members.map((m) => m.razonSocial).join(" y ")}, para la presentación de oferta conjunta, adjudicación, suscripción y ejecución integral de la prestación: `,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: `\"${tender.nombreProyectoInversion || tender.descripcionObjeto || tender.objetoContratacion}\"`,
                bold: true,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: `, derivado del procedimiento de selección `,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: `${tender.nomenclatura}`,
                bold: true,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: `, convocado por la `,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: `${tender.entidadConvocante}.`,
                bold: true,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Cláusula Segunda: Denominación y Domicilio
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({
                text: "CLÁUSULA SEGUNDA.- DENOMINACIÓN Y DOMICILIO==========================================\n",
                bold: true,
                font: FONT_FAMILY,
                size: 20,
                color: COLOR_PRIMARY,
              }),
              new TextRun({
                text: `El consorcio, para todos sus efectos legales, se denomina `,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: `\"${nombreConsorcio}\"`,
                bold: true,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: ` y establece su domicilio legal común en ${domComun}, y correo electrónico oficial común: ${emailComun}, pudiendo mantener oficinas de apoyo y campamento en el lugar de ejecución del servicio u obra, según lo requerido en el expediente técnico de contratación.`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Cláusula Tercera: Duración del Consorcio
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({
                text: "CLÁUSULA TERCERA.- DURACIÓN DEL CONSORCIO============================================\n",
                bold: true,
                font: FONT_FAMILY,
                size: 20,
                color: COLOR_PRIMARY,
              }),
              new TextRun({
                text: `El consorcio estará vigente a partir de la fecha de su formalización que consta en el presente instrumento. El plazo de vigencia del consorcio será desde la fecha de suscripción del presente contrato y se extenderá todo lo que se requiera y sea necesario para el cumplimiento de su objeto y de sus obligaciones contraídas, hasta la liquidación final técnica, económica y financiera del servicio u obra a satisfacción de la Entidad y conforme a las exigencias normativas vigentes.`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Cláusula Cuarta: Organización y Responsabilidad
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({
                text: "CLÁUSULA CUARTA.- ORGANIZACIÓN Y RESPONSABILIDAD======================================\n",
                bold: true,
                font: FONT_FAMILY,
                size: 20,
                color: COLOR_PRIMARY,
              }),
              new TextRun({
                text: `El Consorcio se organiza a través del presente contrato de Consorcio, así como de las Adendas que modifiquen y/o complementen estos acuerdos. Las partes del Consorcio asumen `,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: "RESPONSABILIDAD SOLIDARIA E INDIVISIBLE",
                bold: true,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: ` ante la Entidad, por todas las consecuencias derivadas de su participación en el consorcio durante el proceso de selección, o de su participación en conjunto en la ejecución del contrato que se derive y por el cumplimiento integral de las prestaciones involucradas en el contrato y por cualquier aspecto vinculado a las prestaciones que ejecute.`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Cláusula Quinta: Porcentaje de Participación
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({
                text: "CLÁUSULA QUINTA.- PORCENTAJE DE PARTICIPACIÓN========================================\n",
                bold: true,
                font: FONT_FAMILY,
                size: 20,
                color: COLOR_PRIMARY,
              }),
              new TextRun({
                text: `Los consorciados establecen su participación en el consorcio, de acuerdo a la siguiente distribución pormenorizada de porcentajes y obligaciones:`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          ...memberObligationsParagraphs,

          // Cláusula Séptima: Contabilidad y Operador Tributario
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({
                text: "CLÁUSULA SEXTA.- CONTABILIDAD Y OPERADOR TRIBUTARIO==================================\n",
                bold: true,
                font: FONT_FAMILY,
                size: 20,
                color: COLOR_PRIMARY,
              }),
              new TextRun({
                text: `Operador Tributario del Consorcio.- `,
                bold: true,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: `Las partes de mutuo acuerdo designan como OPERADOR TRIBUTARIO A LA EMPRESA `,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: `${opTributario.toUpperCase()}`,
                bold: true,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: ` y como tal será la empresa encargada de llevar la contabilidad de todas las operaciones que realice el referido consorcio, por lo tanto todos los desembolsos provenientes de los adelantos, valorizaciones, adicionales, mayores gastos generales, saldo a favor en la liquidación y cuanto pago se efectúe por todo concepto concerniente a la ejecución del servicio o proyecto motivo del presente consorcio, deberán depositarse en las cuentas corrientes de ${opTributario.toUpperCase()}.\n\nLas partes de común acuerdo designan como Operador Administrativo y Financiero del consorcio a ${opTributario.toUpperCase()} para que se encargue de la administración financiera del servicio.\n\nLos consorciados acuerdan que ${opTributario.toUpperCase()} implementará en sus libros de contabilidad cuentas especiales tanto para los ingresos así como para los costos y gastos del servicio, a fin de diferenciar eficientemente los resultados del servicio con los resultados producto de las demás actividades comerciales del consorciado.`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Cláusula Octava: Representante Legal Común y Alterno
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({
                text: "CLÁUSULA SÉPTIMA.- REPRESENTANTE LEGAL COMÚN Y ALTERNO===============================\n",
                bold: true,
                font: FONT_FAMILY,
                size: 20,
                color: COLOR_PRIMARY,
              }),
              new TextRun({
                text: `Los consorciados acuerdan que la representación legal del consorcio será ejercida por Don(ña) `,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: `${repComun.toUpperCase()}`,
                bold: true,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: `, identificado con DNI N° ${dniComun}, así mismo se nombra como representante legal alterno a Don(ña) `,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: `${repAlterno.toUpperCase()}`,
                bold: true,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: `, identificado con DNI N° ${dniAlterno}, quienes se encuentran plenamente facultados para representar al consorcio y suscribir el contrato con la entidad ${tender.entidadConvocante}.`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Cláusula Novena: Facultades del Representante Legal (11 Facultades Notariales)
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({
                text: "CLÁUSULA OCTAVA.- FACULTADES DEL REPRESENTANTE LEGAL=================================\n",
                bold: true,
                font: FONT_FAMILY,
                size: 20,
                color: COLOR_PRIMARY,
              }),
              new TextRun({
                text: `Las partes convienen en que el Representante Legal o el Representante Legal Alterno del `,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: `\"${nombreConsorcio}\"`,
                bold: true,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: `, a sola firma, goza de las siguientes facultades amplias y plenas:\n`,
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: `1. Representar ante la Entidad en representación de El Consorcio y realizar los procedimientos que considere pertinente a favor de El Consorcio; así como todo acto exigido por la Entidad para alcanzar el objetivo trazado.\n` +
                  `2. Suscribir el contrato de la ejecución del servicio u obra, así como las adendas, ampliaciones de plazo, adicionales y deductivos, paralizaciones o suspensiones de plazo, reinicio de plazo, conciliación y liquidación final del contrato con la ${tender.entidadConvocante}.\n` +
                  `3. A sola firma cuenta con amplias facultades para solicitar cartas Fianzas y pólizas de caución, a nombre del ${nombreConsorcio}.\n` +
                  `4. Asumir la representación judicial y procesal en cualquier proceso judicial sea este civil, constitucional, laboral, tributario, administrativo, contencioso administrativo y otros en los que el consorcio haya de intervenir, actuando como demandante o demandado, como tercero legitimado, pudiendo apersonarse a cualquier proceso teniendo las facultades generales y especiales del mandato contenidas en los artículos 74°, 75° y 77° del Código Procesal Civil.\n` +
                  `5. Asumir la representación en procesos arbitrales en los que el consorcio haya de intervenir como demandante o demandado, confiriéndole al efecto las facultades generales de representación y las especiales de plantear la demanda, contestar demandas, desistirse del proceso, conciliar, recusar árbitros, solicitar cualquier tipo de medidas cautelares, plantear apelaciones y procesos de revisión y otros recursos impugnativos previstos en la ley de la materia contractual.\n` +
                  `6. Nombrar, promover, encargar y asignar funciones y/o denominaciones al puesto, contratar, reemplazar, amonestar, suspender o despedir al personal en caso de considerarlo necesario para la mejor marcha de la ejecución del servicio u obra.\n` +
                  `7. Negociar, celebrar y firmar contratos de trabajo a plazo fijo o sujeto a modalidad, locación de servicios y contratos civiles.\n` +
                  `8. Tratar y definir acuerdos y/o convenios de negociaciones colectivas, emitir cartas de preaviso y avisos de despido, así como proceder a la liquidación de beneficios sociales.\n` +
                  `9. Asumir la representación del consorcio en cualquier procedimiento laboral con las más amplias facultades de representación ante las autoridades de trabajo tanto administrativas como judiciales con las facultades contenidas en el Texto Único Ordenado del Decreto Legislativo N° 728, Ley 26636 y demás disposiciones laborales.\n` +
                  `10. El Representante Legal podrá otorgar carta poder o poder por escritura pública delegando sus facultades y/o atribuciones en terceras personas para que cumpla y ejecute los intereses del consorcio.\n` +
                  `11. Representar al Consorcio ante toda clase de autoridades políticas, militares, policiales, administrativas, judiciales, autoridades regionales, municipales, Ministerio Público, tributarias (SUNAT), aduaneras, empresas de Derecho Público, empresas estatales de derecho privado, empresas de economía mixta, Organismos Públicos (OSCE, Contraloría General de la República) y Autoridades de carácter autónomo de competencia nacional, así como ante toda clase de personas naturales y jurídicas públicas o privadas, estando facultado para presentar peticiones, solicitudes, licencias, registros, concesiones, permisos y firmar declaraciones juradas e interponer recursos impugnativos conforme a la legislación vigente.`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Cláusula Décima: Solución de Controversias
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({
                text: "CLÁUSULA NOVENA.- SOLUCIÓN DE CONTROVERSIAS==========================================\n",
                bold: true,
                font: FONT_FAMILY,
                size: 20,
                color: COLOR_PRIMARY,
              }),
              new TextRun({
                text: `Las partes deberán efectuar sus mejores esfuerzos para que cualquier desavenencia o controversia que pudiera derivarse del presente contrato, incluidas las de su nulidad o invalidez, sea resuelta en clima de buena fe mediante trato directo y amigable entre ambos, los cuales, actuando de conformidad con las pautas antes señaladas, deberán tratar de resolver las controversias en un plazo no mayor de siete (7) días luego de surgida la misma, o en un plazo mayor de convenirlo mutuamente.\n\nDe no obtenerse una solución dentro del referido plazo o del mayor plazo que hubieran convenido, se someterá la controversia a arbitraje de derecho que se resolverá mediante fallo definitivo e inapelable por un tribunal arbitral compuesto por tres miembros, de conformidad con los reglamentos de Unidad de Arbitraje del ${centroArbitraje}, a cuyas normas las partes se someten en forma incondicional. El proceso arbitral se seguirá en la sede de la ciudad correspondiente conforme a ley.`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Cláusula Décima Primera: Comunicaciones y Domicilios
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({
                text: "CLÁUSULA DÉCIMA.- COMUNICACIONES Y DOMICILIOS========================================\n",
                bold: true,
                font: FONT_FAMILY,
                size: 20,
                color: COLOR_PRIMARY,
              }),
              new TextRun({
                text: `Todas las comunicaciones o notificaciones que deban dirigirse las partes, se harán a los domicilios indicados en la introducción de este Contrato, donde se entenderán válidamente efectuadas. Cualquier cambio de domicilio deber ser comunicado a la otra parte por carta notarial, con tres (3) días hábiles de anticipación. Vencido dicho plazo, dejarán de ser válidas las comunicaciones o notificaciones efectuadas al domicilio anterior.`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Cierre
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 180, after: 150 },
            children: [
              new TextRun({
                text: `En señal de conformidad, se suscribe el presente Contrato de Consorcio, en tres (03) originales de igual forma y tenor.`,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 150, after: 300 },
            children: [
              new TextRun({
                text: `${ciudadFirma}, ${fechaFirma}`,
                bold: true,
                font: FONT_FAMILY,
                size: 20,
              }),
            ],
          }),

          // Firmas de todos los consorciados
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: members.map((m, idx) => {
                  return new TableCell({
                    width: { size: Math.floor(100 / members.length), type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    margins: { top: 200, bottom: 100, left: 100, right: 100 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 60 },
                        children: [
                          new TextRun({
                            text: "....................................................................",
                            color: "94A3B8",
                            font: FONT_FAMILY,
                            size: 18,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 30 },
                        children: [
                          new TextRun({
                            text: `Consorciado ${idx + 1}`,
                            bold: true,
                            font: FONT_FAMILY,
                            size: 18,
                            color: "64748B",
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 30 },
                        children: [
                          new TextRun({
                            text: m.representante.toUpperCase(),
                            bold: true,
                            font: FONT_FAMILY,
                            size: 19,
                            color: COLOR_PRIMARY,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 30 },
                        children: [
                          new TextRun({
                            text: `DNI N° ${m.dni}`,
                            font: FONT_FAMILY,
                            size: 17,
                            color: "475569",
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 30 },
                        children: [
                          new TextRun({
                            text: m.cargoRepresentante || "GERENTE GENERAL",
                            font: FONT_FAMILY,
                            size: 17,
                            bold: true,
                            color: "475569",
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: m.razonSocial.toUpperCase(),
                            font: FONT_FAMILY,
                            size: 16,
                            color: "64748B",
                          }),
                        ],
                      }),
                    ],
                  });
                }),
              }),
            ],
          }),

          // Bloque de Certificación Notarial
          new Paragraph({
            spacing: { before: 400, after: 100 },
            children: [
              new TextRun({
                text: "CERTIFICACIÓN NOTARIAL DE FIRMAS BIOMÉTRICA:",
                bold: true,
                font: FONT_FAMILY,
                size: 18,
                color: "64748B",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "CERTIFICO QUE: Las firmas que anteceden corresponden a los representantes legales de las empresas consorciadas individualizadas en la introducción, quienes se identificaron con sus respectivos Documentos Nacionales de Identidad y verificación biométrica conforme al Art. 108° del Decreto Legislativo N° 1049 del Notariado.",
                italics: true,
                font: FONT_FAMILY,
                size: 17,
                color: "94A3B8",
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// -------------------------------------------------------------
// 11. GENERATOR: CARÁTULAS Y SEPARADORES OFICIALES DEL EXPEDIENTE
// -------------------------------------------------------------
export async function generateCaratulasSeparadorasDocx(
  tender: TenderInfo,
  company: CompanyProfile,
  params?: {
    personal?: KeyPersonnel[];
    experience?: ExperienceRecord[];
    equipment?: EquipmentItem[];
  }
): Promise<Blob> {
  const members = company.esConsorcio && company.integrantesConsorcio && company.integrantesConsorcio.length > 0
    ? company.integrantesConsorcio
    : [{ id: "m1", razonSocial: company.razonSocial, ruc: company.ruc, porcentajeParticipacion: 100, obligaciones: "", representante: company.representanteLegal, dni: company.dniRepresentante }];

  const nombreOferta = company.esConsorcio
    ? (company.nombreConsorcio || "CONSORCIO POSTOR").toUpperCase()
    : company.razonSocial.toUpperCase();

  // Helper for creating full-page section divider
  function createDividerPage(title: string, subtitle?: string): Paragraph[] {
    return [
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 32,
            font: FONT_FAMILY,
            color: COLOR_PRIMARY,
          }),
        ],
      }),
      ...(subtitle
        ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
              children: [
                new TextRun({
                  text: subtitle,
                  italics: true,
                  size: 20,
                  font: FONT_FAMILY,
                  color: "64748B",
                }),
              ],
            }),
          ]
        : []),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 800 },
        children: [
          new TextRun({
            text: "____________________________________________",
            color: COLOR_SECONDARY,
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        pageBreakBefore: true,
        children: [],
      }),
    ];
  }

  const sectionsList: Paragraph[] = [
    // 1. CARATULA PRINCIPAL DE LA OFERTA
    new Paragraph({ spacing: { before: 1200, after: 300 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: tender.entidadConvocante.toUpperCase(),
          bold: true,
          size: 24,
          font: FONT_FAMILY,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `${tender.nomenclatura}`,
          bold: true,
          size: 20,
          font: FONT_FAMILY,
          color: COLOR_SECONDARY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 400 },
      children: [
        new TextRun({
          text: `OFERTA: ${nombreOferta}`,
          bold: true,
          size: 30,
          font: FONT_FAMILY,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    ...members.map((m) => {
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: `✓ OFERTA: ${m.razonSocial.toUpperCase()}, CON RUC N° ${m.ruc}`,
            bold: true,
            size: 20,
            font: FONT_FAMILY,
            color: "334155",
          }),
        ],
      });
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 600 },
      children: [
        new TextRun({
          text: "ANEXOS Y DOCUMENTACIÓN DE LA OFERTA TÉCNICA",
          bold: true,
          underline: {},
          size: 24,
          font: FONT_FAMILY,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new Paragraph({ pageBreakBefore: true, children: [] }),

    // 2. DOCUMENTO QUE ACREDITE LA REPRESENTACIÓN
    ...createDividerPage("DOCUMENTO QUE ACREDITE LA REPRESENTACIÓN DE QUIEN SUSCRIBE LA OFERTA"),

    // 3. DNI DEL REPRESENTANTE COMÚN
    ...createDividerPage("DNI DEL REPRESENTANTE COMÚN", company.representanteComunConsorcio || company.representanteLegal),

    // 4. DNI DE LOS CONSORCIADOS
    ...createDividerPage("DNI DE LOS CONSORCIADOS", "Representantes Legales de las Empresas Integrantes"),

    // 5. VIGENCIA DE PODER DE LOS CONSORCIADOS
    ...createDividerPage("VIGENCIA DE PODER DE LOS CONSORCIADOS", "Certificados Registrales SUNARP"),

    // 6. PROMESA FORMAL DE CONSORCIO
    ...createDividerPage("C. PARTICIPACIÓN EN CONSORCIO", "PROMESA FORMAL DE CONSORCIO Y CONTRATO DE CONSORCIO"),

    // 7. REQUISITOS DE CALIFICACIÓN
    ...createDividerPage("REQUISITOS DE CALIFICACIÓN", "Capítulo III de las Bases Integradas"),

    // 8. EXPERIENCIA DEL POSTOR EN LA ESPECIALIDAD
    ...createDividerPage("A. EXPERIENCIA DEL POSTOR EN LA ESPECIALIDAD", "Contratos, Actas de Recepción, Liquidaciones y Constancias"),

    // Separadores por cada contrato si se brindan
    ...(params?.experience && params.experience.length > 0
      ? params.experience.flatMap((exp, i) =>
          createDividerPage(`CONTRATO N° 0${i + 1}`, `${exp.cliente} - ${exp.nroDocumento}`)
        )
      : [
          ...createDividerPage("CONTRATO N° 01", "Documentación de sustento de experiencia en obras/servicios similares"),
          ...createDividerPage("CONTRATO N° 02", "Documentación de sustento de experiencia en obras/servicios similares"),
          ...createDividerPage("CONTRATO N° 03", "Documentación de sustento de experiencia en obras/servicios similares"),
        ]),

    // 9. CAPACIDAD TÉCNICA Y PROFESIONAL
    ...createDividerPage("B. CAPACIDAD TÉCNICA Y PROFESIONAL", "B.1 CALIFICACIONES Y B.2 EXPERIENCIA DEL PERSONAL CLAVE"),

    // Separadores para cada personal clave
    ...(params?.personal && params.personal.length > 0
      ? params.personal.flatMap((p) =>
          createDividerPage(p.cargoPostulado.toUpperCase(), `${p.nombreCompleto} (DNI N° ${p.dni} - CIP/COL: ${p.cipOCol})`)
        )
      : [
          ...createDividerPage("JEFE DE MANTENIMIENTO / RESIDENTE DE OBRA", "Título profesional, Colegiatura, Certificados y Constancias"),
          ...createDividerPage("ESPECIALISTA EN SEGURIDAD Y SALUD EN EL TRABAJO", "Título profesional, Colegiatura, Certificados y Constancias"),
        ]),

    // 10. EQUIPAMIENTO ESTRATÉGICO
    ...createDividerPage("B.3 EQUIPAMIENTO ESTRATÉGICO", "Declaraciones Juradas, Compromisos de Alquiler y Tarjetas de Propiedad"),

    // 11. INFRAESTRUCTURA ESTRATÉGICA
    ...createDividerPage("B.4 INFRAESTRUCTURA ESTRATÉGICA", "Declaración Jurada de Disponibilidad de Oficina y Almacén"),

    // 12. FACTORES DE EVALUACIÓN Y SOSTENIBILIDAD
    ...createDividerPage("B. SOSTENIBILIDAD AMBIENTAL", "Certificados ISO 14001 (Sistema de Gestión Ambiental)"),
    ...createDividerPage("F. INTEGRIDAD EN LA CONTRATACIÓN PÚBLICA", "Certificados ISO 37001 (Sistema de Gestión Antisoborno)"),
    ...createDividerPage("I. GESTIÓN DE LA CALIDAD Y RESPONSABILIDAD SOCIAL", "Certificados SA 8000 / ISO 9001 / ISO 45001"),
    ...createDividerPage("BONIFICACIÓN POR CONDICIÓN MYPE (5%)", "Acreditación y Constancia REMYPE"),
  ];

  const doc = new Document({
    ...createDocHeaderFooter(tender),
    sections: [
      {
        properties: {},
        children: sectionsList,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// -------------------------------------------------------------
// 9. BUNDLE ALL DOCUMENTS AS A ZIP PACKAGE
// -------------------------------------------------------------
export async function generateAllTenderDocumentsZip(params: {
  tender: TenderInfo;
  company: CompanyProfile;
  montoOfertado: number;
  incluyeIGV: boolean;
  personal: KeyPersonnel[];
  equipment: EquipmentItem[];
  experience: ExperienceRecord[];
  customAnnex2Text?: string;
  observations?: ObservationItem[];
}): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder(`Oferta_${params.tender.nomenclatura.replace(/[\/\\:]/g, "_")}`);

  // Generate Blobs
  const anexo1Blob = await generateAnexo1Docx(params.tender, params.company);
  const anexo2Blob = await generateAnexo2Docx(params.tender, params.company, params.customAnnex2Text);
  const anexo3Blob = await generateAnexo3Docx(params.tender, params.company);
  const anexo4Blob = await generateAnexo4Docx(params.tender, params.company);
  const anexo6Blob = await generateAnexo6EconomicoDocx(params.tender, params.company, params.montoOfertado, params.incluyeIGV);
  const anexo8Blob = await generateAnexo8ExperienciaDocx(params.tender, params.company, params.experience);
  const personalBlob = await generatePersonalYEquipamientoDocx(params.tender, params.company, params.personal, params.equipment);
  const fichaClasificacionBlob = await generateFichaClasificacionEspecialidadDocx(params.tender, params.company);
  const caratulasBlob = await generateCaratulasSeparadorasDocx(params.tender, params.company, {
    personal: params.personal,
    experience: params.experience,
    equipment: params.equipment,
  });

  folder?.file("00_Caratulas_y_Separadores_Oficiales.docx", caratulasBlob);
  folder?.file("01_Anexo_1_Datos_del_Postor.docx", anexo1Blob);
  folder?.file("02_Anexo_2_Declaracion_Cumplimiento_TDR_EETT.docx", anexo2Blob);
  folder?.file("03_Anexo_3_Declaracion_Plazo_Entrega.docx", anexo3Blob);
  folder?.file("04_Anexo_4_Declaracion_Jurada_Art52_RLCE.docx", anexo4Blob);

  if (params.company.esConsorcio) {
    const anexo5Blob = await generateAnexo5PromesaConsorcioDocx(params.tender, params.company);
    folder?.file("05_Anexo_5_Promesa_Formal_de_Consorcio.docx", anexo5Blob);

    const contratoConsorcioBlob = await generateContratoConsorcioDocx(params.tender, params.company);
    folder?.file("05B_Contrato_Privado_de_Consorcio_Notarial.docx", contratoConsorcioBlob);
  }

  folder?.file("06_Anexo_6_Oferta_Economica.docx", anexo6Blob);
  folder?.file("07_Anexo_8_Experiencia_del_Postor.docx", anexo8Blob);
  folder?.file("08_Personal_Clave_y_Equipamiento.docx", personalBlob);
  folder?.file("09_Ficha_Especialidad_y_Calificacion.docx", fichaClasificacionBlob);

  if (params.observations && params.observations.length > 0) {
    const obsBlob = await generateConsultasObservacionesDocx(params.tender, params.company, params.observations);
    folder?.file("10_Pliego_Consultas_y_Observaciones.docx", obsBlob);
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `Oferta_Completa_${params.tender.nomenclatura.replace(/[\/\\:]/g, "_")}.zip`);
}

// Download individual document helper
export function downloadDocxBlob(blob: Blob, filename: string) {
  saveAs(blob, filename.endsWith(".docx") ? filename : `${filename}.docx`);
}
