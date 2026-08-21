import { TenderInfo, CompanyProfile, KeyPersonnel, EquipmentItem, ExperienceRecord } from "../types/osce";
import { ProcurementGuideline, PROCUREMENT_GUIDELINES, ProcurementGuidelineAnnex } from "../data/procurementGuidelines";

export interface DynamicOfferDocItem {
  id: string;
  folderKey: "folder1" | "folder2" | "folder3" | "folder4";
  title: string;
  subtitle: string;
  type: "generated" | "uploaded_pdf" | "legal_cert";
  isIncluded: boolean;
  isMandatory: boolean;
  estimatedPages: number;
  fileName?: string;
  annexKey?: string;
  notes?: string;
  codigoInterno?: string;
  baseLegal?: string;
  etapa?: string;
}

/**
 * Builds the complete dynamic document checklist according to the active Procurement Guideline
 */
export function buildGuidelineDocItems(
  guideline: ProcurementGuideline,
  tender: TenderInfo,
  company: CompanyProfile,
  personal: KeyPersonnel[],
  equipment: EquipmentItem[],
  experience: ExperienceRecord[],
  montoOfertado: number,
  incluyeIGV: boolean
): DynamicOfferDocItem[] {
  const items: DynamicOfferDocItem[] = [];

  // 1. CARÁTULAS Y SEPARADORES OFICIALES (Always in Folder 1)
  items.push({
    id: "doc-caratulas",
    folderKey: "folder1",
    title: `Carátulas y Separadores Oficiales (${guideline.nombre})`,
    subtitle: `Portadas divisorias oficiales para Sobres 1 al 4, foliación y datos del postor (${company.esConsorcio ? "Consorcio" : company.razonSocial}).`,
    type: "generated",
    isIncluded: true,
    isMandatory: false,
    estimatedPages: 6,
    annexKey: "caratulas",
    baseLegal: guideline.marcoNormativo,
  });

  // 2. MAP REGULATED ANNEXES FROM GUIDELINE
  guideline.anexosRegulados.forEach((anx) => {
    let folderKey: "folder1" | "folder2" | "folder3" | "folder4" = "folder1";
    let isIncluded = anx.obligatorio;
    let isMandatory = anx.obligatorio;
    let annexKey = anx.codigoInterno;
    let estimatedPages = 1;

    // Determine folderKey and specifics based on annex code and stage
    if (anx.etapa === "oferta_economica" || anx.codigoInterno === "anexo6" || anx.codigoInterno === "anexo13_amazonia") {
      folderKey = "folder4"; // Propuesta Económica
      if (anx.codigoInterno === "anexo6") {
        annexKey = "anexo6";
      }
    } else if (
      anx.codigoInterno === "anexo11_experiencia" ||
      anx.codigoInterno === "anexo19_personal" ||
      anx.codigoInterno === "anexo8"
    ) {
      folderKey = "folder3"; // Capacidad Técnica y Calificación
      if (anx.codigoInterno === "anexo11_experiencia" || anx.codigoInterno === "anexo8") {
        annexKey = "anexo8";
        estimatedPages = Math.max(1, experience.length);
      } else if (anx.codigoInterno === "anexo19_personal") {
        annexKey = "personal";
        estimatedPages = Math.max(1, personal.length);
      }
    } else if (
      anx.etapa === "perfeccionamiento_contrato" ||
      anx.codigoInterno.includes("arbitraje") ||
      anx.codigoInterno.includes("notif") ||
      anx.codigoInterno.includes("retencion") ||
      anx.codigoInterno.includes("fideicomiso") ||
      anx.codigoInterno.includes("jprd") ||
      anx.codigoInterno.includes("redam")
    ) {
      folderKey = "folder2"; // Habilitación & Perfeccionamiento
    } else {
      folderKey = "folder1"; // Admisión General
    }

    // Special consortium rules
    if (anx.codigoInterno === "anexo4" && anx.nombre.toLowerCase().includes("consorcio")) {
      isIncluded = company.esConsorcio;
      isMandatory = company.esConsorcio;
      annexKey = "anexo5"; // Mapped to consortium generator
    }

    items.push({
      id: `doc-${guideline.id}-${anx.codigoInterno}`,
      folderKey,
      title: `${anx.numero}: ${anx.nombre}`,
      subtitle: anx.descripcion,
      type: "generated",
      isIncluded,
      isMandatory,
      estimatedPages,
      annexKey,
      codigoInterno: anx.codigoInterno,
      baseLegal: anx.baseLegal,
      etapa: anx.etapa,
    });
  });

  // 3. SPECIAL CONSORTIUM CONTRACT (If consortium is active)
  if (company.esConsorcio) {
    items.push({
      id: `doc-${guideline.id}-contrato-consorcio-notarial`,
      folderKey: "folder1",
      title: "Contrato Privado de Consorcio con Firmas Legalizadas Notarialmente",
      subtitle: `Contrato formal con 11 facultades notariales, asignación de operador tributario (${company.operadorTributario || company.razonSocial}) y cláusulas arbitrales.`,
      type: "generated",
      isIncluded: true,
      isMandatory: true,
      estimatedPages: 4,
      annexKey: "contratoConsorcio",
      baseLegal: "Art. 88 y 89 Reglamento Ley N° 32069",
    });
  }

  // 4. STATUTORY LEGAL DOCUMENTS (Folder 2 - Documentos de Habilitación y Persona Jurídica)
  items.push(
    {
      id: `doc-${guideline.id}-rnp`,
      folderKey: "folder2",
      title: `Constancia de Inscripción Vigente en el RNP (${guideline.rolPostor.includes("Supervisor") ? "Consultor de Obras" : "Ejecutor de Obras"})`,
      subtitle: `Registro Nacional de Proveedores vigente para ${tender.objetoContratacion || "Obras/Consultoría"}.`,
      type: "legal_cert",
      isIncluded: true,
      isMandatory: true,
      estimatedPages: 1,
      fileName: "Constancia_RNP_Vigente.pdf",
      baseLegal: "Art. 63 y 69 Reglamento Ley N° 32069",
    },
    {
      id: `doc-${guideline.id}-ruc`,
      folderKey: "folder2",
      title: "Ficha RUC SUNAT (Estado ACTIVO y Condición HABIDO)",
      subtitle: `RUC: ${company.ruc || "20XXXXXXXXX"} - Actividad económica principal vinculada al objeto.`,
      type: "legal_cert",
      isIncluded: true,
      isMandatory: true,
      estimatedPages: 2,
      fileName: "Ficha_RUC_SUNAT.pdf",
      baseLegal: "SUNAT / Cap. II Secc. Específica",
    },
    {
      id: `doc-${guideline.id}-poder`,
      folderKey: "folder2",
      title: "Certificado de Vigencia de Poder SUNARP",
      subtitle: `Poder inscrito del Representante Legal (${company.representanteLegal || "Representante"}) con facultades para contratar.`,
      type: "legal_cert",
      isIncluded: true,
      isMandatory: true,
      estimatedPages: 2,
      fileName: "Vigencia_Poder_SUNARP.pdf",
      baseLegal: "Directiva SUNARP / Art. 69",
    },
    {
      id: `doc-${guideline.id}-dni`,
      folderKey: "folder2",
      title: "Copia Simple de DNI del Representante Legal / Apoderado",
      subtitle: `DNI vigente de ${company.representanteLegal || "Representante Legal"}.`,
      type: "legal_cert",
      isIncluded: true,
      isMandatory: true,
      estimatedPages: 1,
      fileName: "DNI_Representante_Legal.pdf",
      baseLegal: "Ley N° 32069",
    }
  );

  return items;
}
