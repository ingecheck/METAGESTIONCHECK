import * as XLSX from "xlsx";

export interface ParsedExcelSheet {
  sheetName: string;
  rowCount: number;
  colCount: number;
  headers: string[];
  rows: (string | number | boolean | null)[][];
  rawJson: any[];
}

export interface ExtractedExcelResult {
  fileName: string;
  fileSizeBytes: number;
  sheetNames: string[];
  sheets: ParsedExcelSheet[];
  activeSheetName: string;
  summaryData?: {
    montoBruto?: number;
    reajusteK?: number;
    amortizacionDirecto?: number;
    amortizacionMateriales?: number;
    retencionGarantia?: number;
    montoNeto?: number;
    partidasCount?: number;
    partidasIdentificadas?: {
      item: string;
      descripcion: string;
      unidad?: string;
      metradoEjecutado?: number;
      precioUnitario?: number;
      parcial?: number;
    }[];
  };
}

/**
 * Extracts and parses workbook sheets from an uploaded Excel file (.xlsx, .xls, .csv).
 */
export async function extractDataFromExcelFile(file: File): Promise<ExtractedExcelResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true, cellFormula: true });

  const sheetNames = workbook.SheetNames;
  const sheets: ParsedExcelSheet[] = [];

  sheetNames.forEach((name) => {
    const ws = workbook.Sheets[name];
    if (!ws) return;

    // Convert to 2D array of values
    const data: (string | number | boolean | null)[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: "",
      raw: false,
    });

    const rawJson = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const headers = data.length > 0 ? data[0].map((h) => String(h || "")) : [];
    const rows = data.slice(1);

    sheets.push({
      sheetName: name,
      rowCount: data.length,
      colCount: headers.length,
      headers,
      rows,
      rawJson,
    });
  });

  // Attempt to identify summary metrics from the sheets
  let summaryData: ExtractedExcelResult["summaryData"] = undefined;
  const partidasList: NonNullable<ExtractedExcelResult["summaryData"]>["partidasIdentificadas"] = [];

  // Search across sheets for partidas
  for (const s of sheets) {
    for (const row of s.rows) {
      if (row.length >= 4) {
        const col0 = String(row[0] || "").trim();
        const col1 = String(row[1] || "").trim();
        const col2 = String(row[2] || "").trim();
        const col3 = String(row[3] || "").trim();
        const col4 = String(row[4] || "").trim();

        // Check if col0 or col1 looks like an item code (e.g. "01.01", "1.1", "02.03.01")
        const isItemCode = /^\d+(\.\d+)+$/.test(col0) || /^\d+(\.\d+)+$/.test(col1);
        if (isItemCode) {
          const itemCode = isItemCode && /^\d+(\.\d+)+$/.test(col0) ? col0 : col1;
          const desc = itemCode === col0 ? col1 : col2;
          const numMetrado = parseFloat(String(col3 || col4).replace(/,/g, ""));
          const numPrecio = parseFloat(String(col4 || row[5] || "").replace(/,/g, ""));

          if (desc && desc.length > 3) {
            partidasList.push({
              item: itemCode,
              descripcion: desc,
              unidad: String(col2 || "GLB"),
              metradoEjecutado: !isNaN(numMetrado) ? numMetrado : undefined,
              precioUnitario: !isNaN(numPrecio) ? numPrecio : undefined,
              parcial: !isNaN(numMetrado) && !isNaN(numPrecio) ? numMetrado * numPrecio : undefined,
            });
          }
        }
      }
    }
  }

  if (partidasList.length > 0) {
    const totalParcial = partidasList.reduce((acc, p) => acc + (p.parcial || 0), 0);
    summaryData = {
      montoBruto: totalParcial > 0 ? totalParcial : undefined,
      partidasCount: partidasList.length,
      partidasIdentificadas: partidasList.slice(0, 50),
    };
  }

  return {
    fileName: file.name,
    fileSizeBytes: file.size,
    sheetNames,
    sheets,
    activeSheetName: sheetNames[0] || "Hoja1",
    summaryData,
  };
}
