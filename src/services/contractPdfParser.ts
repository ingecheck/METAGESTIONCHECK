import { extractTextFromPdfFile } from "./pdfExtractor";

export interface ParsedContractData {
  tipoDetectado: "ejecucion" | "supervision" | "mixto";
  proyecto?: string;
  cui?: string;
  contratoEjecucionNumero?: string;
  contratoEjecucionMonto?: number;
  contratoEjecucionEmpresa?: string;
  residenteNombre?: string;
  contratoSupervisionNumero?: string;
  contratoSupervisionMonto?: number;
  contratoSupervisionEmpresa?: string;
  supervisorNombre?: string;
  plazoDias?: number;
  fechaEntregaTerreno?: string;
  fechaInicio?: string;
  rawConfidence: {
    hasContratoNum: boolean;
    hasMonto: boolean;
    hasEmpresa: boolean;
    hasIngeniero: boolean;
  };
}

/**
 * Normalizes text extracted from PDF
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ");
}

/**
 * Intelligent parser for Peruvian public work contracts (OSCE / Municipalidades / Gobiernos Regionales)
 */
export function parseContractText(text: string, fileName = ""): ParsedContractData {
  const normText = cleanText(text);
  const upper = normText.toUpperCase();

  const isSupervision =
    fileName.toUpperCase().includes("SUPERV") ||
    upper.includes("CONTRATO DE SUPERVISIÓN") ||
    upper.includes("CONTRATO DE SUPERVISION") ||
    upper.includes("CONSULTORÍA DE OBRA PARA LA SUPERVISIÓN") ||
    upper.includes("CONSULTORIA DE OBRA PARA LA SUPERVISION") ||
    upper.includes("SUPERVISIÓN DE LA OBRA") ||
    upper.includes("SUPERVISION DE LA OBRA");

  const result: ParsedContractData = {
    tipoDetectado: isSupervision ? "supervision" : "ejecucion",
    rawConfidence: {
      hasContratoNum: false,
      hasMonto: false,
      hasEmpresa: false,
      hasIngeniero: false,
    },
  };

  // 1. Detectar Número de Contrato
  // ej: CONTRATO N° 045-2025-MPR, CONTRATO DE EJECUCIÓN DE OBRA Nº 012-2026-MDR/GAF, ORDEN DE SERVICIO N° 451
  const contractRegex =
    /(?:CONTRATO(?:\s+DE\s+(?:EJECUCI[ÓO]N\s+DE\s+OBRA|SUPERVISI[ÓO]N|OBRA|CONSULTOR[ÍI]A))?|ORDEN\s+DE\s+SERVICIO)\s*(?:N[°º.o\s-]*)\s*([0-9]{1,5}\s*[-–/]\s*[0-9]{4}[A-Za-z0-9\s/-]*)/i;
  const contractMatch = normText.match(contractRegex);
  if (contractMatch) {
    const rawNum = contractMatch[0].trim();
    if (isSupervision) {
      result.contratoSupervisionNumero = rawNum;
    } else {
      result.contratoEjecucionNumero = rawNum;
    }
    result.rawConfidence.hasContratoNum = true;
  }

  // Fallback si no capturó con prefijo completo: buscar patrón tipo "045-2026-MPR"
  if (!result.contratoEjecucionNumero && !result.contratoSupervisionNumero) {
    const codeMatch = normText.match(/(?:CONTRATO|N[°º])\s*([0-9]{1,4}[-–][0-9]{4}[-–][A-Za-z0-9/-]+)/i);
    if (codeMatch) {
      const code = `CONTRATO N° ${codeMatch[1].trim()}`;
      if (isSupervision) {
        result.contratoSupervisionNumero = code;
      } else {
        result.contratoEjecucionNumero = code;
      }
      result.rawConfidence.hasContratoNum = true;
    }
  }

  // 2. Detectar CUI (Código Único de Inversiones: 6 o 7 dígitos)
  const cuiMatch =
    normText.match(/(?:CUI|C[ÓO]DIGO\s+[ÚU]NICO(?:\s+DE\s+INVERSIONES)?|SNIP)[\s:N°º.#]*([0-9]{6,8})/i) ||
    normText.match(/\b(2[0-9]{6})\b/); // En Perú casi todos los CUI vigentes empiezan con 2 (ej. 2489123)
  if (cuiMatch) {
    result.cui = cuiMatch[1];
  }

  // 3. Detectar Nombre de la Obra / Proyecto
  // Típicamente después de "OBJETO:", "CLÁUSULA SEGUNDA: OBJETO", "DENOMINADO:", "EJECUCIÓN DE LA OBRA:"
  const projectRegex =
    /(?:OBJETO\s*DEL\s*CONTRATO|EJECUCI[ÓO]N\s+DE\s+(?:LA\s+)?OBRA|SUPERVISI[ÓO]N\s+DE\s+(?:LA\s+)?OBRA|DENOMINACI[ÓO]N|PROYECTO|DENOMINAD[OA])[\s:]*["“]?((?:MEJORAMIENTO|CREACI[ÓO]N|CONSTRUCCI[ÓO]N|REHABILITACI[ÓO]N|REPARACI[ÓO]N|RENOVACI[ÓO]N|INSTALACI[ÓO]N|AMPLIACI[ÓO]N|ADQUISICI[ÓO]N)[^"”\n\r]{10,280})/i;
  const projectMatch = normText.match(projectRegex);
  if (projectMatch) {
    result.proyecto = projectMatch[1].trim().replace(/\s+/g, " ");
  } else {
    // Buscar la primera frase que empiece con verbos de inversión
    const verbMatch = normText.match(/\b((?:MEJORAMIENTO|CREACI[ÓO]N|CONSTRUCCI[ÓO]N|REHABILITACI[ÓO]N|REPARACI[ÓO]N|RENOVACI[ÓO]N)\s+DE[L]?\s+[^.\n\r]{15,220})/i);
    if (verbMatch) {
      result.proyecto = verbMatch[1].trim().replace(/\s+/g, " ");
    }
  }

  // 4. Detectar Monto Contractual (S/.)
  // Busca: "S/ 3,450,200.00", "S/. 3 450 200,00", "MONTO: S/ ...", "ASCIENDE A LA SUMA DE S/ ..."
  const amountRegex =
    /(?:MONTO\s+(?:CONTRACTUAL|DEL\s+CONTRATO|TOTAL)|ASCIENDE\s+A(?:\s+LA\s+SUMA\s+DE)?|POR\s+EL\s+MONTO\s+DE|PRECIO\s+TOTAL)[\s:]*(?:S\/?\.?|SOLES)?\s*([0-9]{1,3}(?:[.,\s][0-9]{3})*(?:[.,][0-9]{2}))/i;
  let amountMatch = normText.match(amountRegex);
  if (!amountMatch) {
    // Intenta buscar el monto con prefijo S/. directo
    amountMatch = normText.match(/(?:S\/?\.\s*)([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2}))/);
  }

  if (amountMatch) {
    let cleanNum = amountMatch[1].replace(/\s+/g, "");
    // Si usa coma para decimales (ej 3.500.000,50)
    if (cleanNum.includes(",") && cleanNum.lastIndexOf(",") > cleanNum.lastIndexOf(".")) {
      cleanNum = cleanNum.replace(/\./g, "").replace(",", ".");
    } else {
      // Formato estándar 3,500,000.50
      cleanNum = cleanNum.replace(/,/g, "");
    }
    const parsedMonto = parseFloat(cleanNum);
    if (!isNaN(parsedMonto) && parsedMonto > 0) {
      if (isSupervision) {
        result.contratoSupervisionMonto = parsedMonto;
      } else {
        result.contratoEjecucionMonto = parsedMonto;
      }
      result.rawConfidence.hasMonto = true;
    }
  }

  // 5. Detectar Empresa / Consorcio
  // Consorcios: "CONSORCIO VIAL NORTE", "CONSORCIO EJECUTOR RIOJA"
  // Empresas: "... S.A.C.", "... S.R.L.", "... E.I.R.L."
  const consorcioMatch = normText.match(/\b(CONSORCIO\s+[A-ZÁÉÍÓÚÑa-záéíóúñ\s0-9]{3,50}?)(?=[,.\n\r]|CONFORMADO|INTEGRADO|RUC)/i);
  const empresaMatch = normText.match(/\b([A-ZÁÉÍÓÚÑa-záéíóúñ\s0-9]{3,50}\s+(?:S\.A\.C\.|S\.A\.|S\.R\.L\.|E\.I\.R\.L\.|S\.C\.R\.L\.))/i);

  const foundEmpresa = consorcioMatch ? consorcioMatch[1].trim() : empresaMatch ? empresaMatch[1].trim() : "";
  if (foundEmpresa) {
    if (isSupervision) {
      result.contratoSupervisionEmpresa = foundEmpresa;
    } else {
      result.contratoEjecucionEmpresa = foundEmpresa;
    }
    result.rawConfidence.hasEmpresa = true;
  }

  // 6. Detectar Residente / Supervisor (Nombre y CIP)
  const cipMatch = normText.match(/CIP(?:\s*N?[°º.]*)?\s*([0-9]{4,7})/i);
  const ingenieroMatch = normText.match(/(?:RESIDENTE(?:\s+DE\s+OBRA)?|SUPERVISOR(?:\s+DE\s+OBRA)?|JEFE\s+DE\s+SUPERVISI[ÓO]N)[\s:]*(?:ING\.?|INGENIERO|ARQ\.?)?\s*([A-Za-zÁÉÍÓÚÑáéíóúñ\s.]{5,45}?)(?=[,.\n\r]|CIP|DNI|CON\s+CIP|CON\s+DNI)/i);

  if (ingenieroMatch) {
    const rawIng = `Ing. ${ingenieroMatch[1].trim().replace(/^ING\.?\s*/i, "")}`;
    const fullIng = cipMatch ? `${rawIng} (CIP ${cipMatch[1]})` : rawIng;
    if (isSupervision) {
      result.supervisorNombre = fullIng;
    } else {
      result.residenteNombre = fullIng;
    }
    result.rawConfidence.hasIngeniero = true;
  } else if (cipMatch) {
    const cipOnly = `Ing. Responsable (CIP ${cipMatch[1]})`;
    if (isSupervision) {
      result.supervisorNombre = cipOnly;
    } else {
      result.residenteNombre = cipOnly;
    }
  }

  // 7. Detectar Plazo en Días Calendario
  const plazoMatch = normText.match(/(?:PLAZO(?:\s+DE\s+EJECUCI[ÓO]N)?[\s:]*)(\d{1,4})\s*(?:D[ÍI]AS\s*CALENDARIO|\((?:CIENTO|DOSCIENTOS|TRESCIENTOS|[A-Z\s]+)\)\s*D[ÍI]AS)/i);
  if (plazoMatch) {
    result.plazoDias = parseInt(plazoMatch[1], 10);
  }

  // 8. Detectar Fechas (DD/MM/AAAA)
  const dateMatches = normText.match(/\b([0-3]?[0-9][/-][0-1]?[0-9][/-]202[4-9])\b/g);
  if (dateMatches && dateMatches.length > 0) {
    // Si hay mención de terreno
    if (upper.includes("ENTREGA DE TERRENO") || upper.includes("ENTREGA DEL TERRENO")) {
      result.fechaEntregaTerreno = dateMatches[0];
    }
    // Si hay mención de inicio
    if (upper.includes("INICIO DE OBRA") || upper.includes("INICIO DEL PLAZO")) {
      result.fechaInicio = dateMatches[dateMatches.length > 1 ? 1 : 0];
    }
  }

  return result;
}

/**
 * High-level helper: extracts text from PDF and parses Peruvian contract data
 * Uses fast local extraction + optional Gemini AI intelligence enhancement for tricky fields
 */
export async function parseContractPdfFile(file: File): Promise<{
  data: ParsedContractData;
  rawText: string;
  fileName: string;
}> {
  const extracted = await extractTextFromPdfFile(file);
  const data = parseContractText(extracted.text, file.name);

  // Intentar enriquecer mediante el backend de IA si falta algún campo clave
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch("/api/gemini/analyze-contract-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractText: extracted.text?.slice(0, 30000) || "",
        fileName: file.name,
        fileSizeBytes: file.size,
        pdfBase64: extracted.pdfBase64,
        documentType: data.tipoDetectado === "supervision" ? "supervisor" : "contratista",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      const aiData = json.data;
      if (aiData) {
        // Enriquecer campos si AI detectó con mayor precisión
        if (!data.proyecto && aiData.nombreObra) data.proyecto = aiData.nombreObra;
        if (!data.cui && aiData.cui) data.cui = aiData.cui;
        if (data.tipoDetectado === "supervision") {
          if (!data.contratoSupervisionNumero && aiData.numeroDocumento) {
            data.contratoSupervisionNumero = aiData.numeroDocumento;
          }
          if ((!data.contratoSupervisionMonto || data.contratoSupervisionMonto === 0) && aiData.monto) {
            data.contratoSupervisionMonto = Number(aiData.monto);
          }
          if (!data.contratoSupervisionEmpresa && aiData.razonSocial) {
            data.contratoSupervisionEmpresa = aiData.razonSocial;
          }
          if (!data.supervisorNombre && aiData.supervisor?.nombre) {
            const cip = aiData.supervisor.cip ? ` (CIP ${aiData.supervisor.cip})` : "";
            data.supervisorNombre = `${aiData.supervisor.nombre}${cip}`;
          }
        } else {
          if (!data.contratoEjecucionNumero && aiData.numeroDocumento) {
            data.contratoEjecucionNumero = aiData.numeroDocumento;
          }
          if ((!data.contratoEjecucionMonto || data.contratoEjecucionMonto === 0) && aiData.monto) {
            data.contratoEjecucionMonto = Number(aiData.monto);
          }
          if (!data.contratoEjecucionEmpresa && aiData.razonSocial) {
            data.contratoEjecucionEmpresa = aiData.razonSocial;
          }
          if (!data.residenteNombre && aiData.residente?.nombre) {
            const cip = aiData.residente.cip ? ` (CIP ${aiData.residente.cip})` : "";
            data.residenteNombre = `${aiData.residente.nombre}${cip}`;
          }
        }
        if ((!data.plazoDias || data.plazoDias === 0) && aiData.plazoDias) {
          data.plazoDias = Number(aiData.plazoDias);
        }
      }
    }
  } catch (enrichErr) {
    // Si falla o timeout, el resultado local ya extrajo los datos con regex
    console.log("Local extraction kept (backend enrichment skipped):", enrichErr);
  }

  return {
    data,
    rawText: extracted.text,
    fileName: file.name,
  };
}
