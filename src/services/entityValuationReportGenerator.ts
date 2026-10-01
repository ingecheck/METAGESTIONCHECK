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
import { EntityValuationReportConfig } from "../types/entityReports";
import { ObraProyecto, ValorizacionMensual } from "../types/obras";
import { formatPEN, numeroALetras } from "./docxGenerator";

const COLOR_NAVY = "0F2942";
const COLOR_BLUE = "1E40AF";
const COLOR_GRAY_BG = "F1F5F9";
const COLOR_BORDER = "94A3B8";
const FONT_FAMILY = "Arial";

const TABLE_BORDER_STYLE = {
  top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
};

/**
 * Builds the official Microsoft Word (.docx) document for the Municipalidad Provincial de Rioja
 */
export async function generateEntityValuationReportDocx(config: EntityValuationReportConfig): Promise<Blob> {
  const tipo = config.tipoInforme;
  const isLocador =
    config.categoriaDocumento === "LOCADORES" ||
    tipo === "INFORME_CONFORMIDAD_LOCADOR" ||
    tipo === "CARTA_INFORME_LOCADOR" ||
    tipo === "MEMO_TRAMITE_PAGO_LOCADOR";

  const isJefeOei =
    config.categoriaDocumento === "JEFE_OEI" ||
    tipo === "INFORME_ESTADO_SITUACIONAL_OEI" ||
    tipo === "INFORME_APROBACION_ADICIONAL_OEI" ||
    tipo === "INFORME_AMPLIACION_PLAZO_OEI" ||
    tipo === "INFORME_INSPECCION_TECNICA_OEI" ||
    tipo === "INFORME_PENALIDADES_NOTIFICACION_OEI";

  const isGerente =
    config.categoriaDocumento === "GERENTE_INVERSIONES" ||
    tipo === "INFORME_GERENCIAL_ELEVACION" ||
    tipo === "INFORME_RENDICION_CARTERA_PMI" ||
    tipo === "INFORME_LIQUIDACION_CIERRE_INVIERTE";

  const isMemoNota =
    config.categoriaDocumento === "NOTAS_MEMORANDUMS" ||
    tipo === "NOTA_INFORMATIVA_INTERNA" ||
    tipo === "MEMORANDUM_REQUERIMIENTO_PRESUPUESTAL" ||
    tipo === "MEMORANDUM_COORDINACION_LEGAL";

  if (isLocador) {
    return generateLocadorDocx(config);
  }
  if (isJefeOei) {
    return generateJefeOeiDocx(config);
  }
  if (isGerente) {
    return generateGerenteDocx(config);
  }
  if (isMemoNota) {
    return generateMemoNotaDocx(config);
  }

  // Por defecto, genera el informe técnico de valorización mensual completo
  return generateValuationReportDocxInternal(config);
}

async function generateValuationReportDocxInternal(config: EntityValuationReportConfig): Promise<Blob> {
  const isSupervision = config.tipoInforme === "INFORME_SUPERVISION";
  const isMemo = config.tipoInforme === "MEMORANDO_PAGO_TESORERIA";

  const docTitle = isMemo
    ? "MEMORÁNDUM DE TRÁMITE DE PAGO Y DEVENGADO DE VALORIZACIÓN"
    : isSupervision
    ? "INFORME MENSUAL DE SUPERVISIÓN Y CONFORMIDAD DE VALORIZACIÓN"
    : "INFORME TÉCNICO DE CONFORMIDAD Y APROBACIÓN DE VALORIZACIÓN DE OBRA";

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1200, bottom: 1200, left: 1400, right: 1400 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: `${config.entidadNombre} • ${config.entidadGerencia}`,
                    size: 16,
                    color: "64748B",
                    font: FONT_FAMILY,
                    bold: true,
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
                    text: `Página `,
                    size: 16,
                    color: "64748B",
                    font: FONT_FAMILY,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: "64748B",
                    font: FONT_FAMILY,
                    bold: true,
                  }),
                  new TextRun({
                    text: ` de `,
                    size: 16,
                    color: "64748B",
                    font: FONT_FAMILY,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: "64748B",
                    font: FONT_FAMILY,
                    bold: true,
                  }),
                  new TextRun({
                    text: ` • Control Oficial de Obras Públicas - D.S. 344-2018-EF`,
                    size: 14,
                    color: "94A3B8",
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Banner Entidad
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: config.entidadNombre,
                bold: true,
                size: 26,
                color: COLOR_NAVY,
                font: FONT_FAMILY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: `${config.entidadGerencia} • ${config.entidadSubgerencia}`,
                bold: true,
                size: 20,
                color: COLOR_BLUE,
                font: FONT_FAMILY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `"Año del Bicentenario, de la consolidación de nuestra Independencia y de las heroicas batallas de Junín y Ayacucho"`,
                italics: true,
                size: 15,
                color: "64748B",
                font: FONT_FAMILY,
              }),
            ],
          }),

          // Número de Documento
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: config.numeroDocumento,
                bold: true,
                size: 24,
                color: COLOR_NAVY,
                font: FONT_FAMILY,
                underline: {},
              }),
            ],
          }),

          // Encabezado Administrativo (A, DE, ASUNTO, REF, FECHA)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: TABLE_BORDER_STYLE,
            rows: [
              createMetaRow("A", `${config.destinatarioNombre}\n${config.destinatarioCargo} - ${config.destinatarioEntidad}`),
              createMetaRow("DE", isSupervision 
                ? `${config.supervisorNombre} (${config.supervisorCip})\n${config.supervisorEmpresa}`
                : `${config.remitenteNombre} (${config.remitenteCip})\n${config.remitenteCargo}`),
              createMetaRow("ASUNTO", config.asuntoTexto),
              createMetaRow("REFERENCIA", config.referenciaTexto),
              createMetaRow("FECHA", config.lugarFecha),
            ],
          }),

          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

          // Párrafo introductorio
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 160, line: 276 },
            children: [
              new TextRun({
                text: `Por intermedio del presente me dirijo a su digno despacho, a efectos de emitir la `,
                size: 20,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `CONFORMIDAD TÉCNICA, APROBACIÓN Y TRÁMITE DE PAGO `,
                size: 20,
                bold: true,
                color: COLOR_NAVY,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `correspondiente a la `,
                size: 20,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `VALORIZACIÓN N° ${String(config.numeroValorizacion).padStart(2, "0")} `,
                size: 20,
                bold: true,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `(${config.mesPeriodo}), de la obra denominada: `,
                size: 20,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `"${config.nombreObra}"`,
                size: 20,
                bold: true,
                color: COLOR_BLUE,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `, con Código Único de Inversiones CUI N° ${config.cui}, ejecutada bajo el marco de la Ley de Contrataciones del Estado (D.S. N° 344-2018-EF y Ley N° 32069), bajo el tenor del siguiente detalle técnico:`,
                size: 20,
                font: FONT_FAMILY,
              }),
            ],
          }),

          // I. ANTECEDENTES
          createHeading("I. ANTECEDENTES Y SUSTENTO NORMATIVO"),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 100, line: 260 },
            children: [
              new TextRun({
                text: `1.1. Mediante procedimiento de selección ${config.procesoSeleccion}, la Municipalidad Provincial de Rioja otorgó la Buena Pro para la ejecución del proyecto, suscribiéndose el ${config.contratoNumero} con fecha ${config.fechaFirmaContrato} con el Contratista ${config.contratistaRazonSocial}, por un monto contractual original de ${formatPEN(config.montoContratoOriginal)} y un plazo de ${config.plazoContractualDias} días calendario.`,
                size: 19,
                font: FONT_FAMILY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 100, line: 260 },
            children: [
              new TextRun({
                text: `1.2. El terreno fue entregado con fecha ${config.fechaEntregaTerreno}, computándose el inicio del plazo de ejecución contractual el ${config.fechaInicioPlazo}, fijándose como fecha de término contractual vigente el ${config.fechaFinContractual}.`,
                size: 19,
                font: FONT_FAMILY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 140, line: 260 },
            children: [
              new TextRun({
                text: `1.3. Conforme al Artículo 194 del Reglamento de la Ley de Contrataciones del Estado (aprobado por D.S. N° 344-2018-EF), el Residente de Obra presentó la Valorización N° ${String(config.numeroValorizacion).padStart(2, "0")} mediante ${config.residenteCartaNumero}, habiendo sido revisada, contrastada en campo y aprobada por la Supervisión ${config.supervisorEmpresa} mediante ${config.supervisorCartaNumero}, para su remisión a esta Entidad.`,
                size: 19,
                font: FONT_FAMILY,
              }),
            ],
          }),

          // II. DATOS GENERALES
          createHeading("II. DATOS GENERALES Y FICHA TÉCNICA DEL CONTRATO"),
          createFichaTecnicaTable(config),

          new Paragraph({ spacing: { before: 180, after: 80 }, children: [] }),

          // III. EVALUACIÓN DE AVANCE FÍSICO
          createHeading("III. EVALUACIÓN DEL AVANCE FÍSICO Y CURVA S (ART. 198 RLCE)"),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 100, line: 260 },
            children: [
              new TextRun({
                text: `Durante el periodo valorizado del ${config.periodoInicio} al ${config.periodoFin}, se ha procedido a la verificación de los metrados ejecutados in situ con el equipo técnico de la Municipalidad Provincial de Rioja y la Supervisión, obteniéndose los siguientes resultados de avance físico:`,
                size: 19,
                font: FONT_FAMILY,
              }),
            ],
          }),
          createAvanceFisicoTable(config),

          new Paragraph({ spacing: { before: 180, after: 80 }, children: [] }),

          // IV. PLANILLA DE LIQUIDACIÓN FINANCIERA
          createHeading("IV. PLANILLA DE LIQUIDACIÓN FINANCIERA MENSUAL A PAGAR"),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 100, line: 260 },
            children: [
              new TextRun({
                text: `La valorización ha sido liquidada aplicando las fórmulas polinómicas contractuales, deducciones por adelantos y amortizaciones vigentes conforme al Art. 195 del RLCE, arrojando el siguiente balance contable:`,
                size: 19,
                font: FONT_FAMILY,
              }),
            ],
          }),
          createLiquidacionFinancieraTable(config),

          // Párrafo de Monto en Letras
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 120, after: 140 },
            children: [
              new TextRun({
                text: `MONTO TOTAL A CANCELAR: `,
                bold: true,
                size: 20,
                color: COLOR_NAVY,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `${formatPEN(config.totalFacturarCancelar)} (${config.montoTotalLetras})`,
                bold: true,
                size: 20,
                color: COLOR_BLUE,
                font: FONT_FAMILY,
              }),
            ],
          }),

          // V. CONTROLES DE CALIDAD, SST Y CUADERNO DE OBRA DIGITAL
          createHeading("V. CONTROL DE CALIDAD, SST Y CUADERNO DE OBRA DIGITAL"),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 80, line: 260 },
            children: [
              new TextRun({ text: "• Control de Calidad y Ensayos: ", bold: true, size: 19, font: FONT_FAMILY }),
              new TextRun({ text: config.controlCalidadDetalle, size: 19, font: FONT_FAMILY }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 80, line: 260 },
            children: [
              new TextRun({ text: "• Seguridad y Salud en el Trabajo (SST): ", bold: true, size: 19, font: FONT_FAMILY }),
              new TextRun({ text: config.controlSSTDetalle, size: 19, font: FONT_FAMILY }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 80, line: 260 },
            children: [
              new TextRun({ text: "• Cuaderno de Obra Digital (COD): ", bold: true, size: 19, font: FONT_FAMILY }),
              new TextRun({ text: config.controlCuadernoObraDetalle, size: 19, font: FONT_FAMILY }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 140, line: 260 },
            children: [
              new TextRun({ text: "• Permanencia del Personal Clave: ", bold: true, size: 19, font: FONT_FAMILY }),
              new TextRun({ text: config.controlPersonalClaveDetalle, size: 19, font: FONT_FAMILY }),
            ],
          }),

          // VI. CONCLUSIONES
          createHeading("VI. CONCLUSIONES"),
          ...config.conclusiones.map(
            (c, i) =>
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 80, line: 260 },
                children: [
                  new TextRun({
                    text: `6.${i + 1}. `,
                    bold: true,
                    size: 19,
                    font: FONT_FAMILY,
                  }),
                  new TextRun({
                    text: c,
                    size: 19,
                    font: FONT_FAMILY,
                  }),
                ],
              })
          ),

          // VII. RECOMENDACIONES
          createHeading("VII. RECOMENDACIONES Y TRÁMITE ADMINISTRATIVO"),
          ...config.recomendaciones.map(
            (r, i) =>
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 80, line: 260 },
                children: [
                  new TextRun({
                    text: `7.${i + 1}. `,
                    bold: true,
                    size: 19,
                    font: FONT_FAMILY,
                  }),
                  new TextRun({
                    text: r,
                    size: 19,
                    font: FONT_FAMILY,
                  }),
                ],
              })
          ),

          new Paragraph({ spacing: { before: 240, after: 100 }, children: [] }),

          // FIRMAS Y SELLOS
          createFirmasTable(config),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// -------------------------------------------------------------
// HELPER DOCX BUILDERS
// -------------------------------------------------------------

function createHeading(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 180, after: 100 },
    heading: HeadingLevel.HEADING_2,
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 21,
        color: COLOR_NAVY,
        font: FONT_FAMILY,
      }),
    ],
  });
}

function createMetaRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 22, type: WidthType.PERCENTAGE },
        shading: { fill: COLOR_GRAY_BG },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: label,
                bold: true,
                size: 18,
                color: COLOR_NAVY,
                font: FONT_FAMILY,
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 78, type: WidthType.PERCENTAGE },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: value.split("\n").map(
          (line) =>
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  size: 18,
                  color: "1E293B",
                  font: FONT_FAMILY,
                }),
              ],
            })
        ),
      }),
    ],
  });
}

function createFichaTecnicaTable(c: EntityValuationReportConfig): Table {
  const rowsData = [
    ["Código Único de Inversiones (CUI)", c.cui],
    ["Nombre del Proyecto de Inversión", c.nombreObra],
    ["Entidad Contratante", `${c.entidadNombre} (RUC: ${c.entidadRuc})`],
    ["Procedimiento de Selección", c.procesoSeleccion],
    ["Contrato de Ejecución de Obra", c.contratoNumero],
    ["Contratista Ejecutor", `${c.contratistaRazonSocial} (RUC: ${c.contratistaRuc})`],
    ["Residente de Obra", `${c.residenteNombre} (${c.residenteCip})`],
    ["Supervisión de Obra", `${c.supervisorNombre} (${c.supervisorCip}) - ${c.supervisorEmpresa}`],
    ["Sistema de Contratación", c.sistemaContratacion],
    ["Plazo de Ejecución Contractual", `${c.plazoContractualDias} Días Calendario`],
    ["Fecha de Entrega de Terreno", c.fechaEntregaTerreno],
    ["Fecha de Inicio de Plazo", c.fechaInicioPlazo],
    ["Fecha de Término Contractual", c.fechaFinContractual],
    ["Monto Contractual Original", `${formatPEN(c.montoContratoOriginal)} (con IGV)`],
    ["Monto Contractual Vigente", `${formatPEN(c.montoContratoVigente)} (con IGV)`],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDER_STYLE,
    rows: rowsData.map(([k, v]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_GRAY_BG },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: k, bold: true, size: 17, color: COLOR_NAVY, font: FONT_FAMILY }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: v, size: 17, color: "0F172A", font: FONT_FAMILY }),
                ],
              }),
            ],
          }),
        ],
      })
    ),
  });
}

function createAvanceFisicoTable(c: EntityValuationReportConfig): Table {
  const isAtrasada = c.porcentajeEjecutadoAcumulado < c.porcentajeProgramadoAcumulado * 0.8;
  const situacionTexto = isAtrasada
    ? "ATRASADA (Art. 198 RLCE: Menor al 80% del programado - Exige Calendario Acelerado)"
    : c.porcentajeEjecutadoAcumulado >= c.porcentajeProgramadoAcumulado
    ? "NORMAL / ADELANTADA (Cumplimiento Óptimo de Cronograma)"
    : "NORMAL CON LEVE RETRASO (Superior al 80% del programado acumulado)";

  const headerRow = new TableRow({
    children: [
      createHeaderCell("CONCEPTO FÍSICO", 40),
      createHeaderCell("PROGRAMADO (S/ y %)", 30),
      createHeaderCell("EJECUTADO REAL (S/ y %)", 30),
    ],
  });

  const row1 = createDataRow(
    `Avance del Mes Actual (${c.mesPeriodo})`,
    `${formatPEN(c.montoProgramadoMes)} (${c.porcentajeProgramadoMes.toFixed(2)}%)`,
    `${formatPEN(c.montoEjecutadoMes)} (${c.porcentajeEjecutadoMes.toFixed(2)}%)`
  );

  const row2 = createDataRow(
    `Avance Físico Acumulado`,
    `${formatPEN(c.montoProgramadoAcumulado)} (${c.porcentajeProgramadoAcumulado.toFixed(2)}%)`,
    `${formatPEN(c.montoEjecutadoAcumulado)} (${c.porcentajeEjecutadoAcumulado.toFixed(2)}%)`,
    true
  );

  const row3 = createDataRow(
    `Umbral Legal del 80% (Art. 198 RLCE)`,
    `${(c.porcentajeProgramadoAcumulado * 0.8).toFixed(2)}% (Mínimo exigido)`,
    `${c.porcentajeEjecutadoAcumulado.toFixed(2)}% (${c.porcentajeEjecutadoAcumulado >= c.porcentajeProgramadoAcumulado * 0.8 ? "CUMPLE UMBRAL" : "EN RIESGO"})`
  );

  const row4 = new TableRow({
    children: [
      new TableCell({
        width: { size: 40, type: WidthType.PERCENTAGE },
        shading: { fill: COLOR_GRAY_BG },
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "SITUACIÓN TÉCNICA OFICIAL", bold: true, size: 17, color: COLOR_NAVY, font: FONT_FAMILY }),
            ],
          }),
        ],
      }),
      new TableCell({
        columnSpan: 2,
        width: { size: 60, type: WidthType.PERCENTAGE },
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: situacionTexto,
                bold: true,
                size: 17,
                color: isAtrasada ? "B91C1C" : "15803D",
                font: FONT_FAMILY,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDER_STYLE,
    rows: [headerRow, row1, row2, row3, row4],
  });
}

function createLiquidacionFinancieraTable(c: EntityValuationReportConfig): Table {
  const headerRow = new TableRow({
    children: [
      createHeaderCell("ITEM", 10),
      createHeaderCell("DESCRIPCIÓN DE LA PARTIDA FINANCIERA", 60),
      createHeaderCell("IMPORTE (S/)", 30),
    ],
  });

  const items: Array<[string, string, string, boolean]> = [
    ["1.0", `VALORIZACIÓN BRUTA EJECUTADA DEL MES (${c.mesPeriodo})`, formatPEN(c.valorizacionBruta), false],
    ["2.0", `REAJUSTES POR FÓRMULA POLINÓMICA (Coeficiente K = ${c.factorKReajuste.toFixed(3)})`, formatPEN(c.reajusteMontoK), false],
    ["2.1", `Deducción de Reajuste que no corresponde por Adelanto Directo`, `-${formatPEN(c.deduccionReajusteNoCorresponde)}`, false],
    ["2.2", `REAJUSTE NETO RECONOCIDO EN EL MES`, formatPEN(c.reajusteNeto), false],
    ["3.0", `SUBTOTAL (VALORIZACIÓN BRUTA + REAJUSTE NETO)`, formatPEN(c.valorizacionBruta + c.reajusteNeto), true],
    ["4.0", `AMORTIZACIÓN DE ADELANTO DIRECTO DEL MES (Saldo: ${formatPEN(c.saldoAdelantoDirecto)})`, `-${formatPEN(c.amortizacionAdelantoDirectoMes)}`, false],
    ["5.0", `AMORTIZACIÓN DE ADELANTO PARA MATERIALES (Saldo: ${formatPEN(c.saldoAdelantoMateriales)})`, `-${formatPEN(c.amortizacionMaterialesMes)}`, false],
    ["6.0", `RETENCIÓN FONDO DE GARANTÍA (10% si corresponde)`, `-${formatPEN(c.retencionFondoGarantiaMes)}`, false],
    ["7.0", `PENALIDADES POR MORA U OTRAS APLICADAS`, `-${formatPEN(c.penalidadesMora + c.otrasPenalidades)}`, false],
    ["8.0", `SUBTOTAL NETO A FAVOR DEL CONTRATISTA`, formatPEN(c.montoNetoAPagar), true],
    ["9.0", `IMPUESTO GENERAL A LAS VENTAS (I.G.V. 18%)`, formatPEN(c.igv18Pct), false],
    ["10.0", `TOTAL A FACTURAR Y CANCELAR EN EL MES`, formatPEN(c.totalFacturarCancelar), true],
  ];

  const dataRows = items.map(([num, desc, val, isBold]) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: isBold ? { fill: COLOR_GRAY_BG } : undefined,
          margins: { top: 60, bottom: 60, left: 60, right: 60 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: num, bold: isBold, size: 17, color: COLOR_NAVY, font: FONT_FAMILY }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          shading: isBold ? { fill: COLOR_GRAY_BG } : undefined,
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: desc, bold: isBold, size: 17, color: isBold ? COLOR_NAVY : "0F172A", font: FONT_FAMILY }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: isBold ? { fill: COLOR_GRAY_BG } : undefined,
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: val, bold: isBold, size: 17, color: isBold ? COLOR_BLUE : "0F172A", font: FONT_FAMILY }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDER_STYLE,
    rows: [headerRow, ...dataRows],
  });
}

function createFirmasTable(c: EntityValuationReportConfig): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          createSignatureBox(
            c.remitenteNombre,
            c.remitenteCip,
            c.remitenteCargo,
            "Municipalidad Provincial de Rioja"
          ),
          createSignatureBox(
            c.supervisorNombre,
            c.supervisorCip,
            "Supervisor de Obra",
            c.supervisorEmpresa
          ),
        ],
      }),
      new TableRow({
        children: [
          createSignatureBox(
            c.destinatarioNombre,
            "Gerente de Desarrollo Urbano e Infraestructura",
            "MUNICIPALIDAD PROVINCIAL DE RIOJA",
            "VISTO BUENO / APROBACIÓN TÉCNICA"
          ),
          createSignatureBox(
            "SUBGERENCIA DE CONTABILIDAD Y TESORERÍA",
            "Fase: Devengado y Giro (Art. 194.5 RLCE)",
            "Gerencia de Administración y Finanzas",
            "MUNICIPALIDAD PROVINCIAL DE RIOJA"
          ),
        ],
      }),
    ],
  });
}

function createLocadorFirmasTable(c: EntityValuationReportConfig): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          createSignatureBox(
            c.remitenteNombre,
            c.remitenteCargo,
            c.entidadGerencia,
            c.entidadNombre
          ),
          createSignatureBox(
            c.destinatarioNombre,
            c.destinatarioCargo,
            "VISTO BUENO / CONFORMIDAD",
            c.entidadNombre
          ),
        ],
      }),
      new TableRow({
        children: [
          createSignatureBox(
            "SUBGERENCIA DE LOGÍSTICA Y PATRIMONIO",
            "Control de Orden de Servicio",
            c.entidadNombre,
            "CONFORMIDAD ADMINISTRATIVA"
          ),
          createSignatureBox(
            "SUBGERENCIA DE CONTABILIDAD Y TESORERÍA",
            "Fase: Devengado y Giro (R.H. Electrónico)",
            c.entidadNombre,
            "TRÁMITE DE PAGO"
          ),
        ],
      }),
    ],
  });
}

function createJefeOeiFirmasTable(c: EntityValuationReportConfig): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          createSignatureBox(
            c.remitenteNombre,
            c.remitenteCargo,
            c.entidadGerencia,
            c.entidadNombre
          ),
          createSignatureBox(
            c.destinatarioNombre,
            c.destinatarioCargo,
            "VISTO BUENO Y PROVEÍDO",
            c.entidadNombre
          ),
        ],
      }),
    ],
  });
}

function createGerenteFirmasTable(c: EntityValuationReportConfig): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          createSignatureBox(
            c.remitenteNombre,
            c.remitenteCargo,
            "GERENCIA DE INVERSIONES / INFRAESTRUCTURA",
            c.entidadNombre
          ),
          createSignatureBox(
            c.destinatarioNombre,
            c.destinatarioCargo,
            "DESPACHO DE GERENCIA MUNICIPAL",
            "PARA EMISIÓN DE RESOLUCIÓN"
          ),
        ],
      }),
    ],
  });
}

/**
 * Builds Word (.docx) document for Locador / Orden de Servicio
 */
async function generateLocadorDocx(c: EntityValuationReportConfig): Promise<Blob> {
  const isCarta = c.tipoInforme === "CARTA_INFORME_LOCADOR";
  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1200, bottom: 1200, left: 1400, right: 1400 } },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: `${c.entidadNombre} • ${c.entidadGerencia} • ${c.entidadSubgerencia}`,
                    size: 16,
                    color: "64748B",
                    font: FONT_FAMILY,
                    bold: true,
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
                  new TextRun({ text: "Página ", size: 16, color: "64748B", font: FONT_FAMILY }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "64748B", font: FONT_FAMILY, bold: true }),
                  new TextRun({ text: " de ", size: 16, color: "64748B", font: FONT_FAMILY }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "64748B", font: FONT_FAMILY, bold: true }),
                  new TextRun({ text: " • Trámite de Pago a Locadores de Servicios - OEI", size: 14, color: "94A3B8", font: FONT_FAMILY }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({ text: c.entidadNombre, bold: true, size: 26, color: COLOR_NAVY, font: FONT_FAMILY })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({ text: `${c.entidadGerencia} • ${c.entidadSubgerencia}`, bold: true, size: 19, color: COLOR_BLUE, font: FONT_FAMILY })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [new TextRun({ text: `"Año de la Recuperación y Consolidación de la Economía Peruana"`, italics: true, size: 15, color: "64748B", font: FONT_FAMILY })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [new TextRun({ text: c.numeroDocumento, bold: true, size: 23, color: COLOR_NAVY, font: FONT_FAMILY, underline: {} })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: TABLE_BORDER_STYLE,
            rows: [
              createMetaRow("A", `${c.destinatarioNombre}\n${c.destinatarioCargo} - ${c.destinatarioEntidad}`),
              createMetaRow("DE", `${c.remitenteNombre} (${c.remitenteCip || c.remitenteDni || "CIP"})\n${c.remitenteCargo}`),
              createMetaRow("ASUNTO", c.asuntoTexto),
              createMetaRow("REFERENCIA", c.referenciaTexto),
              createMetaRow("FECHA", c.lugarFecha),
            ],
          }),
          new Paragraph({ spacing: { before: 200, after: 120 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 160, line: 276 },
            children: [
              new TextRun({
                text: isCarta
                  ? `Por intermedio de la presente me dirijo a su despacho para hacer entrega formal de mi `
                  : `Por intermedio del presente me dirijo a su digno despacho para emitir la `,
                size: 20,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: isCarta
                  ? `INFORME MENSUAL DE ACTIVIDADES Y PRODUCTOS TÉCNICOS `
                  : `CONFORMIDAD DE PRESTACIÓN DE SERVICIOS Y AUTORIZACIÓN DE PAGO `,
                size: 20,
                bold: true,
                color: COLOR_NAVY,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `correspondiente al `,
                size: 20,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `${c.numeroEntregable || "Entregable del Periodo"} (${c.periodoServicio || c.mesPeriodo})`,
                size: 20,
                bold: true,
                color: COLOR_BLUE,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `, prestado por el locador `,
                size: 20,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `${c.locadorNombre || c.remitenteNombre}`,
                size: 20,
                bold: true,
                color: COLOR_NAVY,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `, en el marco de la ${c.ordenServicioNumero || "Orden de Servicio"}, de acuerdo al tenor siguiente:`,
                size: 20,
                font: FONT_FAMILY,
              }),
            ],
          }),
          createHeading("I. DATOS DEL LOCADOR Y DE LA ORDEN DE SERVICIO"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: TABLE_BORDER_STYLE,
            rows: [
              createMetaRow("Locador / Prestador", `${c.locadorNombre || c.remitenteNombre}`),
              createMetaRow("DNI / RUC", `${c.locadorDni || "42109845"} / ${c.locadorRuc || "10421098451"}`),
              createMetaRow("Profesión / Especialidad", `${c.locadorProfesion || c.remitenteCargo} (${c.locadorCip || c.remitenteCip || "Colegiado"})`),
              createMetaRow("Orden de Servicio N°", `${c.ordenServicioNumero || "O.S. N° 0000452-2025"} (Fecha: ${c.ordenServicioFecha || c.fechaFirmaContrato})`),
              createMetaRow("Meta Presupuestal", `${c.metaPresupuestal || "0048 - Infraestructura Vial"}`),
              createMetaRow("Fuente de Financiamiento", `${c.fuenteFinanciamiento || "Canon y Sobrecanon"}`),
              createMetaRow("Plazo del Servicio", `${c.plazoContractualDias || 180} días calendario`),
              createMetaRow("Periodo Evaluado", `${c.periodoServicio || c.mesPeriodo}`),
              createMetaRow("N° de Entregable / Pago", `${c.numeroEntregable || "Entregable N° 04"}`),
              createMetaRow("Recibo por Honorarios", `${c.reciboHonorariosNumero || "E001-48"}`),
              createMetaRow("Honorario Mensual Pactado", formatPEN(c.montoHonorarioMensual || c.montoNetoAPagar || 4500)),
            ],
          }),
          createHeading("II. ANTECEDENTES Y MARCO DE CONTRATACIÓN"),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 120, line: 260 },
            children: [
              new TextRun({
                text: c.antecedentesTexto || `Mediante ${c.ordenServicioNumero || "Orden de Servicio"}, la Municipalidad Provincial de Rioja contrató los servicios profesionales del locador para realizar labores de asistencia técnica y control en la Oficina de Ejecución de Inversiones (OEI), dentro de los estándares de celeridad, calidad y eficiencia del servicio público.`,
                size: 19,
                font: FONT_FAMILY,
              }),
            ],
          }),
          createHeading("III. ACTIVIDADES Y LABORES REALIZADAS EN EL PERIODO"),
          ...(c.actividadesRealizadas && c.actividadesRealizadas.length > 0
            ? c.actividadesRealizadas.map((act) =>
                new Paragraph({
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: { after: 60, line: 240 },
                  bullet: { level: 0 },
                  children: [new TextRun({ text: act, size: 19, font: FONT_FAMILY })],
                })
              )
            : [
                new Paragraph({
                  children: [new TextRun({ text: "• Cumplimiento cabal de las metas y tareas encomendadas por la OEI.", size: 19, font: FONT_FAMILY })],
                }),
              ]),
          createHeading("IV. ENTREGABLES Y PRODUCTOS TÉCNICOS PRESENTADOS"),
          ...(c.entregablesPresentados && c.entregablesPresentados.length > 0
            ? c.entregablesPresentados.map((ent) =>
                new Paragraph({
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: { after: 60, line: 240 },
                  bullet: { level: 0 },
                  children: [new TextRun({ text: ent, size: 19, font: FONT_FAMILY })],
                })
              )
            : [
                new Paragraph({
                  children: [new TextRun({ text: "• Informe técnico mensual suscrito y foliado debidamente.", size: 19, font: FONT_FAMILY })],
                }),
              ]),
          createHeading("V. CONTROL DE CUMPLIMIENTO, CALIDAD Y ASISTENCIA"),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 120, line: 260 },
            children: [
              new TextRun({
                text: `${c.controlCalidadDetalle || "Conforme. Se ha verificado el cumplimiento estricto de las labores requeridas en los Términos de Referencia sin objeción técnica."} Asimismo, ${c.controlPersonalClaveDetalle || "se constató la permanencia y prestación efectiva del servicio."}`,
                size: 19,
                font: FONT_FAMILY,
              }),
            ],
          }),
          createHeading("VI. LIQUIDACIÓN ECONÓMICA DE PAGO DEL SERVICIO"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: TABLE_BORDER_STYLE,
            rows: [
              new TableRow({
                children: [createHeaderCell("CONCEPTO ECONÓMICO", 70), createHeaderCell("IMPORTE (S/)", 30)],
              }),
              createDataRow("Honorario Bruto Pactado del Periodo", "", formatPEN(c.montoHonorarioMensual || 4500)),
              createDataRow("Deducción / Retención de Impuesto de 4ta Categoría (si aplica)", "", "S/ 0.00"),
              createDataRow("Penalidades por Mora o Incumplimiento", "", formatPEN(c.penalidadServicioMonto || 0)),
              createDataRow("TOTAL LÍQUIDO A PAGAR AL LOCADOR", "", formatPEN(c.montoHonorarioMensual || 4500), true),
            ],
          }),
          new Paragraph({
            spacing: { before: 80, after: 140 },
            children: [
              new TextRun({ text: `SON: `, bold: true, size: 18, color: COLOR_NAVY, font: FONT_FAMILY }),
              new TextRun({ text: `${c.montoTotalLetras || numeroALetras(c.montoHonorarioMensual || 4500)}`, bold: true, size: 18, color: COLOR_BLUE, font: FONT_FAMILY }),
            ],
          }),
          createHeading("VII. BASE LEGAL APLICABLE"),
          ...(c.baseLegalList && c.baseLegalList.length > 0
            ? c.baseLegalList.map((bl) =>
                new Paragraph({
                  spacing: { after: 40 },
                  bullet: { level: 0 },
                  children: [new TextRun({ text: bl, size: 17, color: "334155", font: FONT_FAMILY })],
                })
              )
            : [
                new Paragraph({ children: [new TextRun({ text: "• Ley N° 30225 y Directiva Interna de Contrataciones Menores a 8 UIT.", size: 17, font: FONT_FAMILY })] }),
              ]),
          createHeading("VIII. CONCLUSIONES"),
          ...c.conclusiones.map((concl, idx) =>
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 80, line: 250 },
              children: [
                new TextRun({ text: `${idx + 1}. `, bold: true, size: 19, color: COLOR_NAVY, font: FONT_FAMILY }),
                new TextRun({ text: concl, size: 19, font: FONT_FAMILY }),
              ],
            })
          ),
          createHeading("IX. RECOMENDACIONES"),
          ...c.recomendaciones.map((recom, idx) =>
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 80, line: 250 },
              children: [
                new TextRun({ text: `${idx + 1}. `, bold: true, size: 19, color: COLOR_BLUE, font: FONT_FAMILY }),
                new TextRun({ text: recom, size: 19, font: FONT_FAMILY }),
              ],
            })
          ),
          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),
          createLocadorFirmasTable(c),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Builds Word (.docx) document for Jefe de OEI
 */
async function generateJefeOeiDocx(c: EntityValuationReportConfig): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 1200, bottom: 1200, left: 1400, right: 1400 } } },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: `${c.entidadNombre} • ${c.entidadGerencia} • ${c.entidadSubgerencia}`,
                    size: 16,
                    color: "64748B",
                    font: FONT_FAMILY,
                    bold: true,
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
                  new TextRun({ text: "Página ", size: 16, color: "64748B", font: FONT_FAMILY }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "64748B", font: FONT_FAMILY, bold: true }),
                  new TextRun({ text: " de ", size: 16, color: "64748B", font: FONT_FAMILY }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "64748B", font: FONT_FAMILY, bold: true }),
                  new TextRun({ text: " • Informes Técnicos de OEI - Gestión de Inversiones", size: 14, color: "94A3B8", font: FONT_FAMILY }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({ text: c.entidadNombre, bold: true, size: 26, color: COLOR_NAVY, font: FONT_FAMILY })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({ text: `${c.entidadGerencia} • ${c.entidadSubgerencia}`, bold: true, size: 19, color: COLOR_BLUE, font: FONT_FAMILY })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [new TextRun({ text: `"Año de la Recuperación y Consolidación de la Economía Peruana"`, italics: true, size: 15, color: "64748B", font: FONT_FAMILY })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [new TextRun({ text: c.numeroDocumento, bold: true, size: 23, color: COLOR_NAVY, font: FONT_FAMILY, underline: {} })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: TABLE_BORDER_STYLE,
            rows: [
              createMetaRow("A", `${c.destinatarioNombre}\n${c.destinatarioCargo} - ${c.destinatarioEntidad}`),
              createMetaRow("DE", `${c.remitenteNombre} (${c.remitenteCip || "CIP"})\n${c.remitenteCargo}`),
              createMetaRow("ASUNTO", c.asuntoTexto),
              createMetaRow("REFERENCIA", c.referenciaTexto),
              createMetaRow("FECHA", c.lugarFecha),
            ],
          }),
          new Paragraph({ spacing: { before: 200, after: 120 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 160, line: 276 },
            children: [
              new TextRun({
                text: `Por intermedio del presente me dirijo a su digno despacho a efectos de remitir el `,
                size: 20,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `INFORME TÉCNICO SITUACIONAL Y PRONUNCIAMIENTO `,
                size: 20,
                bold: true,
                color: COLOR_NAVY,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `correspondiente al proyecto de inversión pública: `,
                size: 20,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `"${c.nombreObra}"`,
                size: 20,
                bold: true,
                color: COLOR_BLUE,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `, con Código Único de Inversiones CUI N° ${c.cui}, conforme al siguiente análisis técnico:`,
                size: 20,
                font: FONT_FAMILY,
              }),
            ],
          }),
          createHeading("I. ANTECEDENTES DEL PROYECTO"),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 120, line: 260 },
            children: [new TextRun({ text: c.antecedentesTexto || "El proyecto se encuentra en etapa de ejecución física bajo la supervisión directa de esta Oficina de Ejecución de Inversiones.", size: 19, font: FONT_FAMILY })],
          }),
          createHeading("II. DATOS CONTRACTUALES Y FICHA TÉCNICA"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: TABLE_BORDER_STYLE,
            rows: [
              createMetaRow("Código CUI", c.cui),
              createMetaRow("Contrato de Obra", `${c.contratoNumero} (Fecha: ${c.fechaFirmaContrato})`),
              createMetaRow("Contratista Ejecutor", `${c.contratistaRazonSocial} (RUC: ${c.contratistaRuc})`),
              createMetaRow("Supervisión de Obra", `${c.supervisorEmpresa} (${c.supervisorNombre})`),
              createMetaRow("Monto Contractual Vigente", formatPEN(c.montoContratoVigente)),
              createMetaRow("Plazo de Ejecución", `${c.plazoContractualDias} días calendario`),
              createMetaRow("Fecha Término Vigente", c.fechaFinContractual),
            ],
          }),
          createHeading("III. ANÁLISIS TÉCNICO Y ESTADO SITUACIONAL"),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 120, line: 260 },
            children: [new TextRun({ text: c.analisisTecnicoTexto || "La obra presenta un desempeño conforme al cronograma de obra vigente.", size: 19, font: FONT_FAMILY })],
          }),
          createHeading("IV. RIESGOS, NOVEDADES Y ALERTAS DETECTADAS EN CAMPO"),
          ...(c.novedadesRiesgos && c.novedadesRiesgos.length > 0
            ? c.novedadesRiesgos.map((risk) =>
                new Paragraph({
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: { after: 60, line: 240 },
                  bullet: { level: 0 },
                  children: [new TextRun({ text: risk, size: 19, font: FONT_FAMILY })],
                })
              )
            : [
                new Paragraph({
                  children: [new TextRun({ text: "• No se reportan riesgos críticos de paralización en el frente de trabajo.", size: 19, font: FONT_FAMILY })],
                }),
              ]),
          createHeading("V. ACCIONES REQUERIDAS Y PLAN DE INTERVENCIÓN"),
          ...(c.accionesRequeridas && c.accionesRequeridas.length > 0
            ? c.accionesRequeridas.map((acc) =>
                new Paragraph({
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: { after: 60, line: 240 },
                  bullet: { level: 0 },
                  children: [new TextRun({ text: acc, size: 19, font: FONT_FAMILY })],
                })
              )
            : [
                new Paragraph({
                  children: [new TextRun({ text: "• Continuar con el monitoreo estricto de las partidas de la ruta crítica.", size: 19, font: FONT_FAMILY })],
                }),
              ]),
          createHeading("VI. CONCLUSIONES"),
          ...c.conclusiones.map((concl, idx) =>
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 80, line: 250 },
              children: [
                new TextRun({ text: `${idx + 1}. `, bold: true, size: 19, color: COLOR_NAVY, font: FONT_FAMILY }),
                new TextRun({ text: concl, size: 19, font: FONT_FAMILY }),
              ],
            })
          ),
          createHeading("VII. RECOMENDACIONES"),
          ...c.recomendaciones.map((recom, idx) =>
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 80, line: 250 },
              children: [
                new TextRun({ text: `${idx + 1}. `, bold: true, size: 19, color: COLOR_BLUE, font: FONT_FAMILY }),
                new TextRun({ text: recom, size: 19, font: FONT_FAMILY }),
              ],
            })
          ),
          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),
          createJefeOeiFirmasTable(c),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Builds Word (.docx) document for Gerente de Inversiones (Elevación a GM)
 */
async function generateGerenteDocx(c: EntityValuationReportConfig): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 1200, bottom: 1200, left: 1400, right: 1400 } } },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: `${c.entidadNombre} • ${c.entidadGerencia}`,
                    size: 16,
                    color: "64748B",
                    font: FONT_FAMILY,
                    bold: true,
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
                  new TextRun({ text: "Página ", size: 16, color: "64748B", font: FONT_FAMILY }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "64748B", font: FONT_FAMILY, bold: true }),
                  new TextRun({ text: " de ", size: 16, color: "64748B", font: FONT_FAMILY }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "64748B", font: FONT_FAMILY, bold: true }),
                  new TextRun({ text: " • Despacho de Gerencia de Inversiones e Infraestructura", size: 14, color: "94A3B8", font: FONT_FAMILY }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({ text: c.entidadNombre, bold: true, size: 26, color: COLOR_NAVY, font: FONT_FAMILY })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({ text: c.entidadGerencia, bold: true, size: 20, color: COLOR_BLUE, font: FONT_FAMILY })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [new TextRun({ text: `"Año de la Recuperación y Consolidación de la Economía Peruana"`, italics: true, size: 15, color: "64748B", font: FONT_FAMILY })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [new TextRun({ text: c.numeroDocumento, bold: true, size: 23, color: COLOR_NAVY, font: FONT_FAMILY, underline: {} })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: TABLE_BORDER_STYLE,
            rows: [
              createMetaRow("A", `${c.destinatarioNombre}\n${c.destinatarioCargo} - ${c.destinatarioEntidad}`),
              createMetaRow("DE", `${c.remitenteNombre} (${c.remitenteCip || "CIP"})\n${c.remitenteCargo}`),
              createMetaRow("ASUNTO", c.asuntoTexto),
              createMetaRow("REFERENCIA", c.referenciaTexto),
              createMetaRow("FECHA", c.lugarFecha),
            ],
          }),
          new Paragraph({ spacing: { before: 200, after: 120 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 160, line: 276 },
            children: [
              new TextRun({
                text: `Tengo a bien dirigirme a su digno despacho con el propósito de elevar con `,
                size: 20,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `VISTO BUENO TÉCNICO Y FAVORABLE `,
                size: 20,
                bold: true,
                color: COLOR_NAVY,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `el expediente administrativo correspondiente a la obra: `,
                size: 20,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `"${c.nombreObra}"`,
                size: 20,
                bold: true,
                color: COLOR_BLUE,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `, CUI N° ${c.cui}, para la prosecución del trámite resolutivo pertinente:`,
                size: 20,
                font: FONT_FAMILY,
              }),
            ],
          }),
          createHeading("I. ANTECEDENTES Y ELEVACIÓN CON V°B°"),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 120, line: 260 },
            children: [new TextRun({ text: c.antecedentesTexto || "El expediente cuenta con los informes técnicos favorables del área usuaria y la supervisión de obra.", size: 19, font: FONT_FAMILY })],
          }),
          createHeading("II. SUSTENTO TÉCNICO DE LA OFICINA DE EJECUCIÓN DE INVERSIONES"),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 120, line: 260 },
            children: [new TextRun({ text: c.analisisTecnicoTexto || "Se ha fundamentado técnica y presupuestalmente la procedencia del requerimiento.", size: 19, font: FONT_FAMILY })],
          }),
          createHeading("III. CONCLUSIONES Y RECOMENDACIÓN DE ACTO RESOLUTIVO"),
          ...c.conclusiones.map((concl, idx) =>
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 80, line: 250 },
              children: [
                new TextRun({ text: `${idx + 1}. `, bold: true, size: 19, color: COLOR_NAVY, font: FONT_FAMILY }),
                new TextRun({ text: concl, size: 19, font: FONT_FAMILY }),
              ],
            })
          ),
          ...c.recomendaciones.map((recom, idx) =>
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 80, line: 250 },
              children: [
                new TextRun({ text: `RECOMENDACIÓN ${idx + 1}: `, bold: true, size: 19, color: COLOR_BLUE, font: FONT_FAMILY }),
                new TextRun({ text: recom, size: 19, font: FONT_FAMILY }),
              ],
            })
          ),
          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),
          createGerenteFirmasTable(c),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Builds Word (.docx) document for Notas Informativas & Memorándums
 */
async function generateMemoNotaDocx(c: EntityValuationReportConfig): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 1200, bottom: 1200, left: 1400, right: 1400 } } },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: `${c.entidadNombre} • ${c.entidadGerencia} • ${c.entidadSubgerencia}`,
                    size: 16,
                    color: "64748B",
                    font: FONT_FAMILY,
                    bold: true,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({ text: c.entidadNombre, bold: true, size: 26, color: COLOR_NAVY, font: FONT_FAMILY })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({ text: `${c.entidadGerencia} • ${c.entidadSubgerencia}`, bold: true, size: 19, color: COLOR_BLUE, font: FONT_FAMILY })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [new TextRun({ text: `"Año de la Recuperación y Consolidación de la Economía Peruana"`, italics: true, size: 15, color: "64748B", font: FONT_FAMILY })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [new TextRun({ text: c.numeroDocumento, bold: true, size: 23, color: COLOR_NAVY, font: FONT_FAMILY, underline: {} })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: TABLE_BORDER_STYLE,
            rows: [
              createMetaRow("A", `${c.destinatarioNombre}\n${c.destinatarioCargo} - ${c.destinatarioEntidad}`),
              createMetaRow("DE", `${c.remitenteNombre} (${c.remitenteCip || "CIP"})\n${c.remitenteCargo}`),
              createMetaRow("ASUNTO", c.asuntoTexto),
              createMetaRow("REFERENCIA", c.referenciaTexto),
              createMetaRow("FECHA", c.lugarFecha),
            ],
          }),
          new Paragraph({ spacing: { before: 200, after: 120 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 140, line: 260 },
            children: [
              new TextRun({
                text: c.antecedentesTexto || "Por medio del presente documento me dirijo a usted con la finalidad de poner en conocimiento y coordinar las acciones inmediatas respecto al asunto de la referencia:",
                size: 20,
                font: FONT_FAMILY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 140, line: 260 },
            children: [
              new TextRun({
                text: c.analisisTecnicoTexto || "Se solicita la priorización y atención urgente de lo expuesto a fin de salvaguardar el correcto desarrollo y ejecución física de las inversiones de nuestra comuna provincial.",
                size: 20,
                font: FONT_FAMILY,
              }),
            ],
          }),
          createHeading("CONCLUSIONES Y ACCIONES REQUERIDAS"),
          ...c.conclusiones.map((concl, idx) =>
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 80, line: 250 },
              children: [
                new TextRun({ text: `${idx + 1}. `, bold: true, size: 19, color: COLOR_NAVY, font: FONT_FAMILY }),
                new TextRun({ text: concl, size: 19, font: FONT_FAMILY }),
              ],
            })
          ),
          ...c.recomendaciones.map((recom, idx) =>
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 80, line: 250 },
              children: [
                new TextRun({ text: `• `, bold: true, size: 19, color: COLOR_BLUE, font: FONT_FAMILY }),
                new TextRun({ text: recom, size: 19, font: FONT_FAMILY }),
              ],
            })
          ),
          new Paragraph({ spacing: { before: 260, after: 100 }, children: [] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            rows: [
              new TableRow({
                children: [
                  createSignatureBox(
                    c.remitenteNombre,
                    c.remitenteCargo,
                    c.entidadGerencia,
                    c.entidadNombre
                  ),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

function createSignatureBox(nombre: string, linea2: string, linea3: string, linea4: string): TableCell {
  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    margins: { top: 180, bottom: 120, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 40 },
        children: [
          new TextRun({
            text: "__________________________________________",
            size: 16,
            color: "94A3B8",
            font: FONT_FAMILY,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: nombre, bold: true, size: 16, color: COLOR_NAVY, font: FONT_FAMILY }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: linea2, size: 14, color: "334155", font: FONT_FAMILY }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: linea3, size: 14, color: "64748B", font: FONT_FAMILY }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: linea4, size: 13, bold: true, color: COLOR_BLUE, font: FONT_FAMILY }),
        ],
      }),
    ],
  });
}

function createHeaderCell(text: string, widthPercent: number): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: COLOR_NAVY },
    margins: { top: 80, bottom: 80, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text, bold: true, size: 17, color: "FFFFFF", font: FONT_FAMILY }),
        ],
      }),
    ],
  });
}

function createDataRow(label: string, col2: string, col3: string, isBold: boolean = false): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 40, type: WidthType.PERCENTAGE },
        shading: isBold ? { fill: COLOR_GRAY_BG } : undefined,
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: label, bold: isBold, size: 17, color: isBold ? COLOR_NAVY : "0F172A", font: FONT_FAMILY }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: isBold ? { fill: COLOR_GRAY_BG } : undefined,
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: col2, bold: isBold, size: 17, color: isBold ? COLOR_NAVY : "0F172A", font: FONT_FAMILY }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: isBold ? { fill: COLOR_GRAY_BG } : undefined,
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: col3, bold: isBold, size: 17, color: isBold ? COLOR_BLUE : "0F172A", font: FONT_FAMILY }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Generates interactive HTML string representation for the Word preview & editor
 */
export function getEntityValuationReportHtml(config: EntityValuationReportConfig): string {
  const tipo = config.tipoInforme;
  const isLocador =
    config.categoriaDocumento === "LOCADORES" ||
    tipo === "INFORME_CONFORMIDAD_LOCADOR" ||
    tipo === "CARTA_INFORME_LOCADOR" ||
    tipo === "MEMO_TRAMITE_PAGO_LOCADOR";

  const isJefeOei =
    config.categoriaDocumento === "JEFE_OEI" ||
    tipo === "INFORME_ESTADO_SITUACIONAL_OEI" ||
    tipo === "INFORME_APROBACION_ADICIONAL_OEI" ||
    tipo === "INFORME_AMPLIACION_PLAZO_OEI" ||
    tipo === "INFORME_INSPECCION_TECNICA_OEI" ||
    tipo === "INFORME_PENALIDADES_NOTIFICACION_OEI";

  const isGerente =
    config.categoriaDocumento === "GERENTE_INVERSIONES" ||
    tipo === "INFORME_GERENCIAL_ELEVACION" ||
    tipo === "INFORME_RENDICION_CARTERA_PMI" ||
    tipo === "INFORME_LIQUIDACION_CIERRE_INVIERTE";

  const isMemoNota =
    config.categoriaDocumento === "NOTAS_MEMORANDUMS" ||
    tipo === "NOTA_INFORMATIVA_INTERNA" ||
    tipo === "MEMORANDUM_REQUERIMIENTO_PRESUPUESTAL" ||
    tipo === "MEMORANDUM_COORDINACION_LEGAL";

  if (isLocador) return getLocadorReportHtml(config);
  if (isJefeOei) return getJefeOeiReportHtml(config);
  if (isGerente) return getGerenteReportHtml(config);
  if (isMemoNota) return getMemoNotaReportHtml(config);

  return getValuationReportHtmlInternal(config);
}

function getLocadorReportHtml(config: EntityValuationReportConfig): string {
  const isCarta = config.tipoInforme === "CARTA_INFORME_LOCADOR";
  const honorario = config.montoHonorarioMensual || config.montoNetoAPagar || 4500;
  const totalLetras = config.montoTotalLetras || numeroALetras(honorario);

  const actItems = config.actividadesRealizadas && config.actividadesRealizadas.length > 0
    ? config.actividadesRealizadas.map((act) => `<li style="margin-bottom: 6px; text-align: justify;">${act}</li>`).join("")
    : `<li>Cumplimiento total de las labores de asistencia técnica encomendadas por la OEI.</li>`;

  const entItems = config.entregablesPresentados && config.entregablesPresentados.length > 0
    ? config.entregablesPresentados.map((ent) => `<li style="margin-bottom: 6px; text-align: justify;">${ent}</li>`).join("")
    : `<li>Informe técnico mensual de actividades debidamente foliado y visado.</li>`;

  const conclItems = config.conclusiones.map((concl, idx) => `
    <div style="margin-bottom: 8px; text-align: justify;">
      <strong style="color: #0f2942;">${idx + 1}.</strong> ${concl}
    </div>
  `).join("");

  const recomItems = config.recomendaciones.map((recom, idx) => `
    <div style="margin-bottom: 8px; text-align: justify;">
      <strong style="color: #1e40af;">${idx + 1}.</strong> ${recom}
    </div>
  `).join("");

  return `
    <div style="font-family: Arial, sans-serif; font-size: 10pt; color: #1e293b; line-height: 1.5; padding: 10px 0;">
      <!-- Municipal Letterhead Header -->
      <div style="text-align: center; border-bottom: 2px solid #0f2942; padding-bottom: 12px; margin-bottom: 16px;">
        <h1 style="font-size: 15pt; font-weight: 800; color: #0f2942; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
          ${config.entidadNombre}
        </h1>
        <h2 style="font-size: 11pt; font-weight: 700; color: #1e40af; margin: 4px 0 0 0; text-transform: uppercase;">
          ${config.entidadGerencia} • ${config.entidadSubgerencia}
        </h2>
        <p style="font-size: 8.5pt; font-style: italic; color: #64748b; margin: 4px 0 0 0;">
          "Año de la Recuperación y Consolidación de la Economía Peruana"
        </p>
      </div>

      <!-- Document Title & Identification -->
      <div style="text-align: center; margin-bottom: 18px;">
        <h3 style="font-size: 13pt; font-weight: 800; color: #0f2942; text-decoration: underline; margin: 0;">
          ${config.numeroDocumento}
        </h3>
      </div>

      <!-- Administrative Routing Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 9.5pt;">
        <tr>
          <td style="width: 20%; font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">A</td>
          <td style="width: 80%; padding: 6px 10px; border: 1px solid #cbd5e1;">
            <strong>${config.destinatarioNombre}</strong><br/>
            ${config.destinatarioCargo} - ${config.destinatarioEntidad}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">DE</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">
            <strong>${config.remitenteNombre}</strong> (${config.remitenteCip || config.remitenteDni || "CIP"})<br/>
            ${config.remitenteCargo}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">ASUNTO</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">
            ${config.asuntoTexto}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">REFERENCIA</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; white-space: pre-line; color: #334155;">
            ${config.referenciaTexto}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">FECHA</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">
            ${config.lugarFecha}
          </td>
        </tr>
      </table>

      <!-- Intro Narrative -->
      <p style="text-align: justify; margin-bottom: 14px;">
        ${isCarta
          ? `Por intermedio de la presente me dirijo a su digno despacho para hacer entrega formal de mi <strong>INFORME MENSUAL DE ACTIVIDADES Y PRODUCTOS TÉCNICOS</strong> correspondiente al <strong>${config.numeroEntregable || "Entregable"} (${config.periodoServicio || config.mesPeriodo})</strong>, en el marco de la <strong>${config.ordenServicioNumero || "Orden de Servicio"}</strong>, de acuerdo al tenor siguiente:`
          : `Por intermedio del presente me dirijo a su digno despacho a efectos de emitir la <strong>CONFORMIDAD DE PRESTACIÓN DE SERVICIOS Y AUTORIZACIÓN DE PAGO</strong> correspondiente al <strong>${config.numeroEntregable || "Entregable"} (${config.periodoServicio || config.mesPeriodo})</strong> prestado por el locador <strong style="color: #0f2942;">${config.locadorNombre || config.remitenteNombre}</strong>, en el marco de la <strong>${config.ordenServicioNumero || "Orden de Servicio"}</strong>, bajo el tenor siguiente:`}
      </p>

      <!-- I. DATOS DEL LOCADOR -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        I. DATOS DEL LOCADOR Y DE LA ORDEN DE SERVICIO
      </h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9pt;">
        <tr><td style="width: 35%; font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Locador / Prestador</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;"><strong>${config.locadorNombre || config.remitenteNombre}</strong></td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">DNI / RUC</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${config.locadorDni || "42109845"} / ${config.locadorRuc || "10421098451"}</td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Profesión / Especialidad</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${config.locadorProfesion || config.remitenteCargo} (${config.locadorCip || config.remitenteCip || "Colegiado"})</td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Orden de Servicio N°</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;"><strong>${config.ordenServicioNumero || "O.S. N° 0000452-2025"}</strong> (Fecha: ${config.ordenServicioFecha || config.fechaFirmaContrato})</td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Meta Presupuestal / Fuente</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${config.metaPresupuestal || "0048 - Infraestructura Vial"} / ${config.fuenteFinanciamiento || "Canon y Sobrecanon"}</td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Plazo y Periodo del Servicio</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${config.plazoContractualDias || 180} días cal. • Periodo: <strong>${config.periodoServicio || config.mesPeriodo}</strong></td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">N° de Entregable / Recibo</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${config.numeroEntregable || "Entregable N° 04"} • Recibo por Honorarios: <strong>${config.reciboHonorariosNumero || "E001-48"}</strong></td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Honorario Mensual Pactado</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e40af;">${formatPEN(honorario)}</td></tr>
      </table>

      <!-- II. ANTECEDENTES -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        II. ANTECEDENTES DE LA CONTRATACIÓN
      </h4>
      <p style="text-align: justify; margin-bottom: 12px;">
        ${config.antecedentesTexto || `Mediante ${config.ordenServicioNumero || "Orden de Servicio"}, la Municipalidad Provincial de Rioja contrató los servicios profesionales del locador para desempeñar funciones de asistencia técnica y control en la Oficina de Ejecución de Inversiones (OEI), dentro de los estándares de celeridad, calidad y eficiencia institucional.`}
      </p>

      <!-- III. ACTIVIDADES REALIZADAS -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        III. ACTIVIDADES Y LABORES DESARROLLADAS EN EL PERIODO
      </h4>
      <ul style="padding-left: 20px; margin-bottom: 14px;">
        ${actItems}
      </ul>

      <!-- IV. ENTREGABLES -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        IV. ENTREGABLES Y PRODUCTOS TÉCNICOS PRESENTADOS
      </h4>
      <ul style="padding-left: 20px; margin-bottom: 14px;">
        ${entItems}
      </ul>

      <!-- V. CONTROLES -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        V. CONTROL DE CUMPLIMIENTO, CALIDAD Y ASISTENCIA
      </h4>
      <p style="text-align: justify; margin-bottom: 14px;">
        ${config.controlCalidadDetalle || "Conforme. Se ha verificado el cumplimiento estricto de las labores requeridas en los Términos de Referencia sin objeción técnica."} Asimismo, ${config.controlPersonalClaveDetalle || "se constató la permanencia y prestación efectiva del servicio."}
      </p>

      <!-- VI. LIQUIDACIÓN ECONÓMICA -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        VI. LIQUIDACIÓN ECONÓMICA DE PAGO DEL SERVICIO
      </h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9.5pt;">
        <thead>
          <tr style="background: #0f2942; color: #ffffff;">
            <th style="padding: 6px 10px; border: 1px solid #0f2942; text-align: left;">Concepto</th>
            <th style="padding: 6px 10px; border: 1px solid #0f2942; text-align: right; width: 30%;">Importe (S/)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 5px 10px; border: 1px solid #cbd5e1;">Honorario Bruto Pactado del Periodo</td>
            <td style="padding: 5px 10px; border: 1px solid #cbd5e1; text-align: right;">${formatPEN(honorario)}</td>
          </tr>
          <tr>
            <td style="padding: 5px 10px; border: 1px solid #cbd5e1;">Retención de Impuesto de 4ta Categoría (si aplica)</td>
            <td style="padding: 5px 10px; border: 1px solid #cbd5e1; text-align: right;">S/ 0.00</td>
          </tr>
          <tr>
            <td style="padding: 5px 10px; border: 1px solid #cbd5e1;">Penalidades por Mora o Incumplimiento</td>
            <td style="padding: 5px 10px; border: 1px solid #cbd5e1; text-align: right;">${formatPEN(config.penalidadServicioMonto || 0)}</td>
          </tr>
          <tr style="background: #f1f5f9; font-weight: bold;">
            <td style="padding: 6px 10px; border: 1px solid #cbd5e1; color: #0f2942;">TOTAL LÍQUIDO A PAGAR AL LOCADOR</td>
            <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right; color: #1e40af; font-size: 10.5pt;">${formatPEN(honorario)}</td>
          </tr>
        </tbody>
      </table>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 3px solid #1e40af; padding: 6px 12px; margin-bottom: 16px; font-size: 9pt;">
        <strong>SON:</strong> ${totalLetras}
      </div>

      <!-- VII. CONCLUSIONES Y RECOMENDACIONES -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        VII. CONCLUSIONES
      </h4>
      <div style="margin-bottom: 14px;">${conclItems}</div>

      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        VIII. RECOMENDACIONES
      </h4>
      <div style="margin-bottom: 24px;">${recomItems}</div>

      <!-- SIGNATURE BLOCKS -->
      <table style="width: 100%; margin-top: 40px; font-size: 8.5pt; text-align: center; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; padding: 20px 15px; vertical-align: top;">
            <div style="border-top: 1px solid #0f172a; padding-top: 6px; display: inline-block; width: 85%;">
              <strong>${config.remitenteNombre}</strong><br/>
              ${config.remitenteCargo}<br/>
              <span style="color: #64748b;">${config.entidadGerencia}</span><br/>
              <span style="color: #0f2942; font-weight: bold;">${config.entidadNombre}</span>
            </div>
          </td>
          <td style="width: 50%; padding: 20px 15px; vertical-align: top;">
            <div style="border-top: 1px solid #0f172a; padding-top: 6px; display: inline-block; width: 85%;">
              <strong>${config.destinatarioNombre}</strong><br/>
              ${config.destinatarioCargo}<br/>
              <span style="color: #1e40af; font-weight: bold;">VISTO BUENO / CONFORMIDAD</span><br/>
              <span style="color: #0f2942; font-weight: bold;">${config.entidadNombre}</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="width: 50%; padding: 30px 15px 10px 15px; vertical-align: top;">
            <div style="border-top: 1px solid #0f172a; padding-top: 6px; display: inline-block; width: 85%;">
              <strong>SUBGERENCIA DE LOGÍSTICA Y PATRIMONIO</strong><br/>
              Control y Registro de Orden de Servicio<br/>
              <span style="color: #15803d; font-weight: bold;">CONFORMIDAD ADMINISTRATIVA</span>
            </div>
          </td>
          <td style="width: 50%; padding: 30px 15px 10px 15px; vertical-align: top;">
            <div style="border-top: 1px solid #0f172a; padding-top: 6px; display: inline-block; width: 85%;">
              <strong>SUBGERENCIA DE CONTABILIDAD Y TESORERÍA</strong><br/>
              Fase: Devengado y Giro (R.H. Electrónico)<br/>
              <span style="color: #b45309; font-weight: bold;">TRÁMITE DE PAGO</span>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function getJefeOeiReportHtml(config: EntityValuationReportConfig): string {
  const conclItems = config.conclusiones.map((concl, idx) => `
    <div style="margin-bottom: 8px; text-align: justify;">
      <strong style="color: #0f2942;">${idx + 1}.</strong> ${concl}
    </div>
  `).join("");

  const recomItems = config.recomendaciones.map((recom, idx) => `
    <div style="margin-bottom: 8px; text-align: justify;">
      <strong style="color: #1e40af;">${idx + 1}.</strong> ${recom}
    </div>
  `).join("");

  const riskItems = config.novedadesRiesgos && config.novedadesRiesgos.length > 0
    ? config.novedadesRiesgos.map((r) => `<li style="margin-bottom: 6px;">${r}</li>`).join("")
    : `<li>No se registran riesgos críticos en el frente de trabajo.</li>`;

  const accItems = config.accionesRequeridas && config.accionesRequeridas.length > 0
    ? config.accionesRequeridas.map((a) => `<li style="margin-bottom: 6px;">${a}</li>`).join("")
    : `<li>Continuar con la fiscalización técnica y seguimiento de la ruta crítica.</li>`;

  return `
    <div style="font-family: Arial, sans-serif; font-size: 10pt; color: #1e293b; line-height: 1.5; padding: 10px 0;">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px solid #0f2942; padding-bottom: 12px; margin-bottom: 16px;">
        <h1 style="font-size: 15pt; font-weight: 800; color: #0f2942; margin: 0; text-transform: uppercase;">
          ${config.entidadNombre}
        </h1>
        <h2 style="font-size: 11pt; font-weight: 700; color: #1e40af; margin: 4px 0 0 0; text-transform: uppercase;">
          ${config.entidadGerencia} • ${config.entidadSubgerencia}
        </h2>
        <p style="font-size: 8.5pt; font-style: italic; color: #64748b; margin: 4px 0 0 0;">
          "Año de la Recuperación y Consolidación de la Economía Peruana"
        </p>
      </div>

      <!-- Title -->
      <div style="text-align: center; margin-bottom: 18px;">
        <h3 style="font-size: 13pt; font-weight: 800; color: #0f2942; text-decoration: underline; margin: 0;">
          ${config.numeroDocumento}
        </h3>
      </div>

      <!-- Table A/DE -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 9.5pt;">
        <tr>
          <td style="width: 20%; font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">A</td>
          <td style="width: 80%; padding: 6px 10px; border: 1px solid #cbd5e1;">
            <strong>${config.destinatarioNombre}</strong><br/>
            ${config.destinatarioCargo} - ${config.destinatarioEntidad}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">DE</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">
            <strong>${config.remitenteNombre}</strong> (${config.remitenteCip || "CIP"})<br/>
            ${config.remitenteCargo}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">ASUNTO</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">
            ${config.asuntoTexto}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">REFERENCIA</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; white-space: pre-line; color: #334155;">
            ${config.referenciaTexto}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">FECHA</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">
            ${config.lugarFecha}
          </td>
        </tr>
      </table>

      <!-- Intro -->
      <p style="text-align: justify; margin-bottom: 14px;">
        Por intermedio del presente me dirijo a su digno despacho a efectos de remitir el <strong>INFORME TÉCNICO SITUACIONAL Y PRONUNCIAMIENTO</strong> correspondiente al proyecto de inversión pública: <strong style="color: #1e40af;">"${config.nombreObra}"</strong>, con Código Único de Inversiones CUI N° <strong>${config.cui}</strong>, conforme al siguiente análisis técnico:
      </p>

      <!-- I. ANTECEDENTES -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        I. ANTECEDENTES DEL PROYECTO
      </h4>
      <p style="text-align: justify; margin-bottom: 12px;">
        ${config.antecedentesTexto || "El proyecto se encuentra en etapa de ejecución física bajo la supervisión directa de esta Oficina de Ejecución de Inversiones."}
      </p>

      <!-- II. DATOS CONTRACTUALES -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        II. DATOS CONTRACTUALES Y FICHA TÉCNICA
      </h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9pt;">
        <tr><td style="width: 35%; font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Código CUI</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;"><strong>${config.cui}</strong></td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Contrato de Obra</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${config.contratoNumero}</td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Contratista Ejecutor</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${config.contratistaRazonSocial}</td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Supervisión de Obra</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${config.supervisorEmpresa}</td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Monto Contractual Vigente</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e40af;">${formatPEN(config.montoContratoVigente)}</td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Plazo de Ejecución</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${config.plazoContractualDias} días calendario</td></tr>
      </table>

      <!-- III. ANALISIS TECNICO -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        III. ANÁLISIS TÉCNICO Y ESTADO SITUACIONAL
      </h4>
      <p style="text-align: justify; margin-bottom: 12px; white-space: pre-line;">
        ${config.analisisTecnicoTexto || "La obra presenta un desempeño conforme al cronograma de obra vigente."}
      </p>

      <!-- IV. RIESGOS -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        IV. RIESGOS, NOVEDADES Y ALERTAS DETECTADAS EN CAMPO
      </h4>
      <ul style="padding-left: 20px; margin-bottom: 14px;">
        ${riskItems}
      </ul>

      <!-- V. ACCIONES REQUERIDAS -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        V. ACCIONES REQUERIDAS Y PLAN DE INTERVENCIÓN
      </h4>
      <ul style="padding-left: 20px; margin-bottom: 14px;">
        ${accItems}
      </ul>

      <!-- VI. CONCLUSIONES -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        VI. CONCLUSIONES
      </h4>
      <div style="margin-bottom: 14px;">${conclItems}</div>

      <!-- VII. RECOMENDACIONES -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        VII. RECOMENDACIONES
      </h4>
      <div style="margin-bottom: 24px;">${recomItems}</div>

      <!-- FIRMAS -->
      <table style="width: 100%; margin-top: 40px; font-size: 8.5pt; text-align: center; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; padding: 20px 15px; vertical-align: top;">
            <div style="border-top: 1px solid #0f172a; padding-top: 6px; display: inline-block; width: 85%;">
              <strong>${config.remitenteNombre}</strong><br/>
              ${config.remitenteCargo}<br/>
              <span style="color: #64748b;">${config.entidadSubgerencia}</span><br/>
              <span style="color: #0f2942; font-weight: bold;">${config.entidadNombre}</span>
            </div>
          </td>
          <td style="width: 50%; padding: 20px 15px; vertical-align: top;">
            <div style="border-top: 1px solid #0f172a; padding-top: 6px; display: inline-block; width: 85%;">
              <strong>${config.destinatarioNombre}</strong><br/>
              ${config.destinatarioCargo}<br/>
              <span style="color: #1e40af; font-weight: bold;">VISTO BUENO Y PROVEÍDO</span><br/>
              <span style="color: #0f2942; font-weight: bold;">${config.entidadNombre}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function getGerenteReportHtml(config: EntityValuationReportConfig): string {
  const conclItems = config.conclusiones.map((concl, idx) => `
    <div style="margin-bottom: 8px; text-align: justify;">
      <strong style="color: #0f2942;">${idx + 1}.</strong> ${concl}
    </div>
  `).join("");

  const recomItems = config.recomendaciones.map((recom, idx) => `
    <div style="margin-bottom: 8px; text-align: justify;">
      <strong style="color: #1e40af;">${idx + 1}.</strong> ${recom}
    </div>
  `).join("");

  return `
    <div style="font-family: Arial, sans-serif; font-size: 10pt; color: #1e293b; line-height: 1.5; padding: 10px 0;">
      <div style="text-align: center; border-bottom: 2px solid #0f2942; padding-bottom: 12px; margin-bottom: 16px;">
        <h1 style="font-size: 15pt; font-weight: 800; color: #0f2942; margin: 0; text-transform: uppercase;">
          ${config.entidadNombre}
        </h1>
        <h2 style="font-size: 11pt; font-weight: 700; color: #1e40af; margin: 4px 0 0 0; text-transform: uppercase;">
          ${config.entidadGerencia}
        </h2>
        <p style="font-size: 8.5pt; font-style: italic; color: #64748b; margin: 4px 0 0 0;">
          "Año de la Recuperación y Consolidación de la Economía Peruana"
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 18px;">
        <h3 style="font-size: 13pt; font-weight: 800; color: #0f2942; text-decoration: underline; margin: 0;">
          ${config.numeroDocumento}
        </h3>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 9.5pt;">
        <tr>
          <td style="width: 20%; font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">A</td>
          <td style="width: 80%; padding: 6px 10px; border: 1px solid #cbd5e1;">
            <strong>${config.destinatarioNombre}</strong><br/>
            ${config.destinatarioCargo} - ${config.destinatarioEntidad}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">DE</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">
            <strong>${config.remitenteNombre}</strong> (${config.remitenteCip || "CIP"})<br/>
            ${config.remitenteCargo}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">ASUNTO</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">
            ${config.asuntoTexto}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">REFERENCIA</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; white-space: pre-line; color: #334155;">
            ${config.referenciaTexto}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">FECHA</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">
            ${config.lugarFecha}
          </td>
        </tr>
      </table>

      <p style="text-align: justify; margin-bottom: 14px;">
        Tengo a bien dirigirme a su digno despacho con el propósito de elevar con <strong>VISTO BUENO TÉCNICO Y FAVORABLE</strong> el expediente administrativo correspondiente a la obra: <strong style="color: #1e40af;">"${config.nombreObra}"</strong>, CUI N° <strong>${config.cui}</strong>, para la emisión del acto resolutivo pertinente:
      </p>

      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        I. ANTECEDENTES Y ELEVACIÓN CON V°B°
      </h4>
      <p style="text-align: justify; margin-bottom: 12px;">
        ${config.antecedentesTexto || "El expediente cuenta con los informes técnicos favorables del área usuaria y la supervisión de obra."}
      </p>

      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        II. SUSTENTO TÉCNICO DE LA OFICINA DE EJECUCIÓN DE INVERSIONES
      </h4>
      <p style="text-align: justify; margin-bottom: 12px; white-space: pre-line;">
        ${config.analisisTecnicoTexto || "Se ha fundamentado técnica y presupuestalmente la procedencia del requerimiento."}
      </p>

      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        III. CONCLUSIONES
      </h4>
      <div style="margin-bottom: 14px;">${conclItems}</div>

      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        IV. RECOMENDACIÓN DE ACTO RESOLUTIVO
      </h4>
      <div style="margin-bottom: 24px;">${recomItems}</div>

      <!-- FIRMAS -->
      <table style="width: 100%; margin-top: 40px; font-size: 8.5pt; text-align: center; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; padding: 20px 15px; vertical-align: top;">
            <div style="border-top: 1px solid #0f172a; padding-top: 6px; display: inline-block; width: 85%;">
              <strong>${config.remitenteNombre}</strong><br/>
              ${config.remitenteCargo}<br/>
              <span style="color: #0f2942; font-weight: bold;">${config.entidadNombre}</span>
            </div>
          </td>
          <td style="width: 50%; padding: 20px 15px; vertical-align: top;">
            <div style="border-top: 1px solid #0f172a; padding-top: 6px; display: inline-block; width: 85%;">
              <strong>${config.destinatarioNombre}</strong><br/>
              ${config.destinatarioCargo}<br/>
              <span style="color: #1e40af; font-weight: bold;">DESPACHO DE GERENCIA MUNICIPAL</span>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function getMemoNotaReportHtml(config: EntityValuationReportConfig): string {
  const conclItems = config.conclusiones.map((concl, idx) => `
    <div style="margin-bottom: 8px; text-align: justify;">
      <strong style="color: #0f2942;">${idx + 1}.</strong> ${concl}
    </div>
  `).join("");

  const recomItems = config.recomendaciones.map((recom, idx) => `
    <div style="margin-bottom: 8px; text-align: justify;">
      <strong style="color: #1e40af;">•</strong> ${recom}
    </div>
  `).join("");

  return `
    <div style="font-family: Arial, sans-serif; font-size: 10pt; color: #1e293b; line-height: 1.5; padding: 10px 0;">
      <div style="text-align: center; border-bottom: 2px solid #0f2942; padding-bottom: 12px; margin-bottom: 16px;">
        <h1 style="font-size: 15pt; font-weight: 800; color: #0f2942; margin: 0; text-transform: uppercase;">
          ${config.entidadNombre}
        </h1>
        <h2 style="font-size: 11pt; font-weight: 700; color: #1e40af; margin: 4px 0 0 0; text-transform: uppercase;">
          ${config.entidadGerencia} • ${config.entidadSubgerencia}
        </h2>
        <p style="font-size: 8.5pt; font-style: italic; color: #64748b; margin: 4px 0 0 0;">
          "Año de la Recuperación y Consolidación de la Economía Peruana"
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 18px;">
        <h3 style="font-size: 13pt; font-weight: 800; color: #0f2942; text-decoration: underline; margin: 0;">
          ${config.numeroDocumento}
        </h3>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 9.5pt;">
        <tr>
          <td style="width: 20%; font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">A</td>
          <td style="width: 80%; padding: 6px 10px; border: 1px solid #cbd5e1;">
            <strong>${config.destinatarioNombre}</strong><br/>
            ${config.destinatarioCargo} - ${config.destinatarioEntidad}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">DE</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">
            <strong>${config.remitenteNombre}</strong> (${config.remitenteCip || "CIP"})<br/>
            ${config.remitenteCargo}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">ASUNTO</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">
            ${config.asuntoTexto}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">REFERENCIA</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; white-space: pre-line; color: #334155;">
            ${config.referenciaTexto}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">FECHA</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">
            ${config.lugarFecha}
          </td>
        </tr>
      </table>

      <p style="text-align: justify; margin-bottom: 14px;">
        ${config.antecedentesTexto || "Por medio del presente documento me dirijo a usted con la finalidad de poner en conocimiento y coordinar las acciones inmediatas respecto al asunto de la referencia:"}
      </p>

      <p style="text-align: justify; margin-bottom: 14px; white-space: pre-line;">
        ${config.analisisTecnicoTexto || "Se solicita la priorización y atención urgente de lo expuesto a fin de salvaguardar el correcto desarrollo y ejecución física de las inversiones de nuestra comuna provincial."}
      </p>

      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        CONCLUSIONES Y ACCIONES REQUERIDAS
      </h4>
      <div style="margin-bottom: 14px;">${conclItems}</div>
      <div style="margin-bottom: 24px;">${recomItems}</div>

      <table style="width: 100%; margin-top: 40px; font-size: 8.5pt; text-align: center; border-collapse: collapse;">
        <tr>
          <td style="width: 100%; padding: 20px 15px; vertical-align: top;">
            <div style="border-top: 1px solid #0f172a; padding-top: 6px; display: inline-block; width: 45%;">
              <strong>${config.remitenteNombre}</strong><br/>
              ${config.remitenteCargo}<br/>
              <span style="color: #0f2942; font-weight: bold;">${config.entidadNombre}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function getValuationReportHtmlInternal(config: EntityValuationReportConfig): string {

  const isSupervision = config.tipoInforme === "INFORME_SUPERVISION";
  const isMemo = config.tipoInforme === "MEMORANDO_PAGO_TESORERIA";
  const isAtrasada = config.porcentajeEjecutadoAcumulado < config.porcentajeProgramadoAcumulado * 0.8;

  const situacionBadge = isAtrasada
    ? `<span style="color: #b91c1c; font-weight: bold; background: #fee2e2; padding: 2px 6px; border-radius: 4px;">ATRASADA (&lt; 80% ART. 198 RLCE)</span>`
    : config.porcentajeEjecutadoAcumulado >= config.porcentajeProgramadoAcumulado
    ? `<span style="color: #15803d; font-weight: bold; background: #dcfce7; padding: 2px 6px; border-radius: 4px;">NORMAL / ADELANTADA</span>`
    : `<span style="color: #b45309; font-weight: bold; background: #fef3c7; padding: 2px 6px; border-radius: 4px;">NORMAL (CUMPLE UMBRAL 80%)</span>`;

  return `
    <div style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #1e293b; line-height: 1.5; padding: 10px 0;">
      <!-- Municipal Letterhead Header -->
      <div style="text-align: center; border-bottom: 2px solid #0f2942; padding-bottom: 12px; margin-bottom: 16px;">
        <h1 style="font-size: 15pt; font-weight: 800; color: #0f2942; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
          ${config.entidadNombre}
        </h1>
        <h2 style="font-size: 11pt; font-weight: 700; color: #1e40af; margin: 4px 0 0 0; text-transform: uppercase;">
          ${config.entidadGerencia} • ${config.entidadSubgerencia}
        </h2>
        <p style="font-size: 8.5pt; font-style: italic; color: #64748b; margin: 4px 0 0 0;">
          "Año de la Recuperación y Consolidación de la Economía Peruana"
        </p>
      </div>

      <!-- Document Title & Identification -->
      <div style="text-align: center; margin-bottom: 18px;">
        <h3 style="font-size: 13pt; font-weight: 800; color: #0f2942; text-decoration: underline; margin: 0;">
          ${config.numeroDocumento}
        </h3>
      </div>

      <!-- Administrative Routing Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 9.5pt;">
        <tr>
          <td style="width: 20%; font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">A</td>
          <td style="width: 80%; padding: 6px 10px; border: 1px solid #cbd5e1;">
            <strong>${config.destinatarioNombre}</strong><br/>
            ${config.destinatarioCargo} - ${config.destinatarioEntidad}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">DE</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">
            ${isSupervision
              ? `<strong>${config.supervisorNombre}</strong> (${config.supervisorCip})<br/>${config.supervisorEmpresa}`
              : `<strong>${config.remitenteNombre}</strong> (${config.remitenteCip})<br/>${config.remitenteCargo}`}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">ASUNTO</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">
            ${config.asuntoTexto}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">REFERENCIA</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; white-space: pre-line; color: #334155;">
            ${config.referenciaTexto}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #0f2942; background: #f1f5f9; padding: 6px 10px; border: 1px solid #cbd5e1;">FECHA</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">
            ${config.lugarFecha}
          </td>
        </tr>
      </table>

      <!-- Intro Narrative -->
      <p style="text-align: justify; margin-bottom: 14px;">
        Por intermedio del presente me dirijo a su digno despacho a efectos de emitir la <strong>CONFORMIDAD TÉCNICA, APROBACIÓN Y TRÁMITE DE PAGO</strong> correspondiente a la <strong>VALORIZACIÓN N° ${String(config.numeroValorizacion).padStart(2, "0")} (${config.mesPeriodo})</strong>, de la obra pública: <strong style="color: #1e40af;">"${config.nombreObra}"</strong>, con Código Único de Inversiones CUI N° <strong>${config.cui}</strong>, bajo el marco del Art. 194 del Reglamento de la Ley de Contrataciones del Estado (D.S. N° 344-2018-EF), de acuerdo al sustento siguiente:
      </p>

      <!-- I. ANTECEDENTES -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        I. ANTECEDENTES Y MARCO LEGAL APLICABLE
      </h4>
      <p style="text-align: justify; margin-bottom: 8px;">
        <strong>1.1. Procedimiento de Selección y Contrato:</strong> Mediante ${config.procesoSeleccion}, la Municipalidad Provincial de Rioja suscribió el ${config.contratoNumero} con fecha ${config.fechaFirmaContrato} con el Contratista ${config.contratistaRazonSocial}, por un monto original de ${formatPEN(config.montoContratoOriginal)} a ejecutarse en un plazo de ${config.plazoContractualDias} días calendario.
      </p>
      <p style="text-align: justify; margin-bottom: 8px;">
        <strong>1.2. Inicio de Plazo de Obra:</strong> Conforme al Acta de Entrega de Terreno de fecha ${config.fechaEntregaTerreno}, se dio inicio formal al plazo contractual el ${config.fechaInicioPlazo}, con fecha de culminación contractual programada al ${config.fechaFinContractual}.
      </p>
      <p style="text-align: justify; margin-bottom: 12px;">
        <strong>1.3. Presentación y Revisión de Valorización:</strong> En estricto cumplimiento del Artículo 194 del RLCE, el Residente ${config.residenteNombre} presentó la valorización mensual con fecha ${config.residenteCartaFecha} (${config.residenteCartaNumero}). La Supervisión de Obra ${config.supervisorEmpresa} emitió pronunciamiento favorable y conformidad técnica mediante ${config.supervisorCartaNumero} de fecha ${config.supervisorCartaFecha}, remitiéndola a esta Entidad para su revisión y prosecución de trámite.
      </p>

      <!-- II. FICHA TECNICA -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        II. DATOS GENERALES Y FICHA TÉCNICA DEL CONTRATO
      </h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9pt;">
        <tr><td style="width: 35%; font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Código Único de Inversiones (CUI)</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;"><strong>${config.cui}</strong></td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Nombre de la Obra</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${config.nombreObra}</td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Entidad Contratante</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${config.entidadNombre} (RUC: ${config.entidadRuc})</td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Contratista Ejecutor</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${config.contratistaRazonSocial} (RUC: ${config.contratistaRuc})</td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Residente de Obra</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${config.residenteNombre} (${config.residenteCip})</td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Supervisión de Obra</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${config.supervisorNombre} (${config.supervisorCip}) - ${config.supervisorEmpresa}</td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Sistema de Contratación</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${config.sistemaContratacion}</td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Plazo de Ejecución / Inicio</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${config.plazoContractualDias} Días Calendario • Inicio: ${config.fechaInicioPlazo} • Término: ${config.fechaFinContractual}</td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Monto Contractual Original</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;"><strong>${formatPEN(config.montoContratoOriginal)}</strong> (Inc. IGV)</td></tr>
        <tr><td style="font-weight: bold; background: #f8fafc; padding: 4px 8px; border: 1px solid #cbd5e1;">Monto Contractual Vigente</td><td style="padding: 4px 8px; border: 1px solid #cbd5e1;"><strong>${formatPEN(config.montoContratoVigente)}</strong> (Inc. IGV)</td></tr>
      </table>

      <!-- III. EVALUACION FISICA -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        III. EVALUACIÓN DEL AVANCE FÍSICO Y CURVA S (ART. 198 RLCE)
      </h4>
      <p style="text-align: justify; margin-bottom: 8px;">
        Durante el periodo comprendido del <strong>${config.periodoInicio}</strong> al <strong>${config.periodoFin}</strong>, se contrastaron los metrados ejecutados en campo con los planos y cuaderno de obra digital:
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 9pt;">
        <thead>
          <tr style="background: #0f2942; color: #ffffff;">
            <th style="padding: 6px 8px; border: 1px solid #0f2942; text-align: left;">CONCEPTO</th>
            <th style="padding: 6px 8px; border: 1px solid #0f2942; text-align: center;">PROGRAMADO (S/ y %)</th>
            <th style="padding: 6px 8px; border: 1px solid #0f2942; text-align: center;">EJECUTADO REAL (S/ y %)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Avance Físico del Mes Actual (${config.mesPeriodo})</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center;">${formatPEN(config.montoProgramadoMes)} (${config.porcentajeProgramadoMes.toFixed(2)}%)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #1e40af;">${formatPEN(config.montoEjecutadoMes)} (${config.porcentajeEjecutadoMes.toFixed(2)}%)</td>
          </tr>
          <tr style="background: #f8fafc; font-weight: bold;">
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Avance Físico Acumulado a la Fecha</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center;">${formatPEN(config.montoProgramadoAcumulado)} (${config.porcentajeProgramadoAcumulado.toFixed(2)}%)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; color: #1e40af;">${formatPEN(config.montoEjecutadoAcumulado)} (${config.porcentajeEjecutadoAcumulado.toFixed(2)}%)</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Umbral Legal del 80% (Art. 198 RLCE)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center;">${(config.porcentajeProgramadoAcumulado * 0.8).toFixed(2)}% (Mínimo exigido)</td>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${config.porcentajeEjecutadoAcumulado.toFixed(2)}%</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">Situación Técnica de la Obra</td>
            <td colspan="2" style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center;">${situacionBadge}</td>
          </tr>
        </tbody>
      </table>

      <!-- IV. LIQUIDACION FINANCIERA -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        IV. PLANILLA DE LIQUIDACIÓN FINANCIERA MENSUAL
      </h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 9pt;">
        <thead>
          <tr style="background: #0f2942; color: #ffffff;">
            <th style="width: 10%; padding: 6px 8px; border: 1px solid #0f2942; text-align: center;">ITEM</th>
            <th style="width: 65%; padding: 6px 8px; border: 1px solid #0f2942; text-align: left;">DESCRIPCIÓN</th>
            <th style="width: 25%; padding: 6px 8px; border: 1px solid #0f2942; text-align: right;">IMPORTE (S/)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center; padding: 4px 8px; border: 1px solid #cbd5e1;">1.0</td>
            <td style="padding: 4px 8px; border: 1px solid #cbd5e1;"><strong>VALORIZACIÓN BRUTA EJECUTADA DEL MES (${config.mesPeriodo})</strong></td>
            <td style="text-align: right; padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: bold;">${formatPEN(config.valorizacionBruta)}</td>
          </tr>
          <tr>
            <td style="text-align: center; padding: 4px 8px; border: 1px solid #cbd5e1;">2.0</td>
            <td style="padding: 4px 8px; border: 1px solid #cbd5e1;">Reajuste por Fórmula Polinómica (Coeficiente K = ${config.factorKReajuste.toFixed(3)})</td>
            <td style="text-align: right; padding: 4px 8px; border: 1px solid #cbd5e1;">${formatPEN(config.reajusteMontoK)}</td>
          </tr>
          <tr>
            <td style="text-align: center; padding: 4px 8px; border: 1px solid #cbd5e1;">2.1</td>
            <td style="padding: 4px 8px; border: 1px solid #cbd5e1;">Deducción de Reajuste que no corresponde por Adelanto Directo</td>
            <td style="text-align: right; padding: 4px 8px; border: 1px solid #cbd5e1; color: #b91c1c;">-${formatPEN(config.deduccionReajusteNoCorresponde)}</td>
          </tr>
          <tr style="background: #f8fafc;">
            <td style="text-align: center; padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: bold;">2.2</td>
            <td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: bold;">REAJUSTE NETO RECONOCIDO EN EL MES</td>
            <td style="text-align: right; padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e40af;">${formatPEN(config.reajusteNeto)}</td>
          </tr>
          <tr style="background: #f1f5f9; font-weight: bold;">
            <td style="text-align: center; padding: 4px 8px; border: 1px solid #cbd5e1;">3.0</td>
            <td style="padding: 4px 8px; border: 1px solid #cbd5e1;">SUBTOTAL (VALORIZACIÓN BRUTA + REAJUSTE NETO)</td>
            <td style="text-align: right; padding: 4px 8px; border: 1px solid #cbd5e1;">${formatPEN(config.valorizacionBruta + config.reajusteNeto)}</td>
          </tr>
          <tr>
            <td style="text-align: center; padding: 4px 8px; border: 1px solid #cbd5e1;">4.0</td>
            <td style="padding: 4px 8px; border: 1px solid #cbd5e1;">Amortización de Adelanto Directo (Saldo Pendiente: ${formatPEN(config.saldoAdelantoDirecto)})</td>
            <td style="text-align: right; padding: 4px 8px; border: 1px solid #cbd5e1; color: #b91c1c;">-${formatPEN(config.amortizacionAdelantoDirectoMes)}</td>
          </tr>
          <tr>
            <td style="text-align: center; padding: 4px 8px; border: 1px solid #cbd5e1;">5.0</td>
            <td style="padding: 4px 8px; border: 1px solid #cbd5e1;">Amortización de Adelanto de Materiales (Saldo Pendiente: ${formatPEN(config.saldoAdelantoMateriales)})</td>
            <td style="text-align: right; padding: 4px 8px; border: 1px solid #cbd5e1; color: #b91c1c;">-${formatPEN(config.amortizacionMaterialesMes)}</td>
          </tr>
          <tr>
            <td style="text-align: center; padding: 4px 8px; border: 1px solid #cbd5e1;">6.0</td>
            <td style="padding: 4px 8px; border: 1px solid #cbd5e1;">Retención de Fondo de Garantía (10% según Art. 149 RLCE)</td>
            <td style="text-align: right; padding: 4px 8px; border: 1px solid #cbd5e1;">-${formatPEN(config.retencionFondoGarantiaMes)}</td>
          </tr>
          <tr>
            <td style="text-align: center; padding: 4px 8px; border: 1px solid #cbd5e1;">7.0</td>
            <td style="padding: 4px 8px; border: 1px solid #cbd5e1;">Penalidades por Mora u Otras Infracciones Aplicadas</td>
            <td style="text-align: right; padding: 4px 8px; border: 1px solid #cbd5e1;">-${formatPEN(config.penalidadesMora + config.otrasPenalidades)}</td>
          </tr>
          <tr style="background: #e0f2fe; font-weight: bold;">
            <td style="text-align: center; padding: 6px 8px; border: 1px solid #cbd5e1; color: #0369a1;">8.0</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; color: #0369a1;">MONTO NETO A FAVOR DEL CONTRATISTA</td>
            <td style="text-align: right; padding: 6px 8px; border: 1px solid #cbd5e1; color: #0369a1; font-size: 10pt;">${formatPEN(config.montoNetoAPagar)}</td>
          </tr>
          <tr>
            <td style="text-align: center; padding: 4px 8px; border: 1px solid #cbd5e1;">9.0</td>
            <td style="padding: 4px 8px; border: 1px solid #cbd5e1;">Impuesto General a las Ventas (I.G.V. 18%)</td>
            <td style="text-align: right; padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: bold;">${formatPEN(config.igv18Pct)}</td>
          </tr>
          <tr style="background: #0f2942; color: #ffffff; font-weight: bold;">
            <td style="text-align: center; padding: 8px; border: 1px solid #0f2942;">10.0</td>
            <td style="padding: 8px; border: 1px solid #0f2942;">TOTAL A FACTURAR Y CANCELAR EN EL MES</td>
            <td style="text-align: right; padding: 8px; border: 1px solid #0f2942; font-size: 11pt; color: #38bdf8;">${formatPEN(config.totalFacturarCancelar)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Monto en Letras Banner -->
      <div style="background: #f8fafc; border-left: 4px solid #1e40af; padding: 10px 14px; margin-bottom: 16px;">
        <span style="font-size: 9pt; color: #64748b; text-transform: uppercase; font-weight: bold;">Total a Cancelar en Letras:</span><br/>
        <strong style="font-size: 10.5pt; color: #0f2942;">${config.montoTotalLetras}</strong>
      </div>

      <!-- V. CONTROLES DE CALIDAD, SST Y COD -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        V. CONTROL DE CALIDAD, SEGURIDAD Y CUADERNO DE OBRA DIGITAL
      </h4>
      <ul style="margin: 0 0 14px 20px; padding: 0; font-size: 9.5pt;">
        <li style="margin-bottom: 6px;"><strong>Ensayos de Control de Calidad:</strong> ${config.controlCalidadDetalle}</li>
        <li style="margin-bottom: 6px;"><strong>Seguridad y Salud en el Trabajo (SST):</strong> ${config.controlSSTDetalle}</li>
        <li style="margin-bottom: 6px;"><strong>Cuaderno de Obra Digital (COD):</strong> ${config.controlCuadernoObraDetalle}</li>
        <li style="margin-bottom: 6px;"><strong>Acreditación de Personal Clave:</strong> ${config.controlPersonalClaveDetalle}</li>
      </ul>

      <!-- VI. CONCLUSIONES -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        VI. CONCLUSIONES
      </h4>
      <ol style="margin: 0 0 14px 20px; padding: 0; font-size: 9.5pt;">
        ${config.conclusiones.map((c) => `<li style="margin-bottom: 6px; text-align: justify;">${c}</li>`).join("")}
      </ol>

      <!-- VII. RECOMENDACIONES -->
      <h4 style="font-size: 11pt; font-weight: bold; color: #0f2942; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 8px 0;">
        VII. RECOMENDACIONES Y TRÁMITE DE PAGO
      </h4>
      <ol style="margin: 0 0 20px 20px; padding: 0; font-size: 9.5pt;">
        ${config.recomendaciones.map((r) => `<li style="margin-bottom: 6px; text-align: justify;">${r}</li>`).join("")}
      </ol>

      <!-- Firmas y Vistos Buenos -->
      <div style="margin-top: 35px; border-top: 1px dashed #cbd5e1; padding-top: 25px;">
        <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 9pt;">
          <tr>
            <td style="width: 50%; padding: 15px; vertical-align: bottom;">
              <div style="width: 220px; border-top: 1px solid #64748b; margin: 0 auto 6px auto;"></div>
              <strong>${config.remitenteNombre}</strong><br/>
              ${config.remitenteCip}<br/>
              <span style="color: #64748b;">${config.remitenteCargo}</span><br/>
              <strong style="color: #1e40af; font-size: 8pt;">MUNICIPALIDAD PROVINCIAL DE RIOJA</strong>
            </td>
            <td style="width: 50%; padding: 15px; vertical-align: bottom;">
              <div style="width: 220px; border-top: 1px solid #64748b; margin: 0 auto 6px auto;"></div>
              <strong>${config.supervisorNombre}</strong><br/>
              ${config.supervisorCip}<br/>
              <span style="color: #64748b;">Supervisor de Obra</span><br/>
              <strong style="color: #1e40af; font-size: 8pt;">${config.supervisorEmpresa}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 25px 15px 15px 15px; vertical-align: bottom;">
              <div style="width: 220px; border-top: 1px solid #64748b; margin: 0 auto 6px auto;"></div>
              <strong>${config.destinatarioNombre}</strong><br/>
              <span style="color: #64748b;">${config.destinatarioCargo}</span><br/>
              <strong style="color: #0f2942; font-size: 8pt;">MUNICIPALIDAD PROVINCIAL DE RIOJA</strong><br/>
              <span style="color: #059669; font-weight: bold; font-size: 7.5pt;">[VISTO BUENO / APROBADO]</span>
            </td>
            <td style="padding: 25px 15px 15px 15px; vertical-align: bottom;">
              <div style="width: 220px; border-top: 1px solid #64748b; margin: 0 auto 6px auto;"></div>
              <strong>SUBGERENCIA DE TESORERÍA Y CONTABILIDAD</strong><br/>
              <span style="color: #64748b;">Gerencia de Administración y Finanzas</span><br/>
              <strong style="color: #0f2942; font-size: 8pt;">MUNICIPALIDAD PROVINCIAL DE RIOJA</strong><br/>
              <span style="color: #2563eb; font-weight: bold; font-size: 7.5pt;">[DEVENGADO Y GIRO ART. 194.5 RLCE]</span>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;
}

/**
 * Builds an EntityValuationReportConfig directly from an ObraProyecto and a selected ValorizacionMensual
 */
export function buildEntityReportFromObra(
  obra: ObraProyecto,
  val: ValorizacionMensual,
  tipo: "INFORME_TECNICO_CONFORMIDAD" | "INFORME_SUPERVISION" | "MEMORANDO_PAGO_TESORERIA" = "INFORME_TECNICO_CONFORMIDAD",
  entidadNombreCustom?: string
): EntityValuationReportConfig {
  const numVal = val.numero || 1;
  const numFormatted = String(numVal).padStart(2, "0");
  const year = new Date().getFullYear();

  const numDoc = tipo === "MEMORANDO_PAGO_TESORERIA"
    ? `MEMORÁNDUM N° 0${numVal + 5}-${year}-MPR/GDUI`
    : tipo === "INFORME_SUPERVISION"
    ? `INFORME MENSUAL DE SUPERVISIÓN N° 0${numVal}-${year}-SO/MPR`
    : `INFORME TÉCNICO N° 0${numVal + 10}-${year}-MPR/GDUI/SGOPC`;

  const dateNow = new Date().toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const entidad = entidadNombreCustom || obra.entidad || "MUNICIPALIDAD PROVINCIAL DE RIOJA";
  const mProgramadoMes = val.montoProgramado || 0;
  const mEjecutadoMes = val.montoEjecutado || 0;
  const pProgramadoMes = val.porcentajeProgramadoMes || (obra.montoContractual > 0 ? (mProgramadoMes / obra.montoContractual) * 100 : 0);
  const pEjecutadoMes = val.porcentajeEjecutadoMes || (obra.montoContractual > 0 ? (mEjecutadoMes / obra.montoContractual) * 100 : 0);

  const mProgAcum = val.montoAcumuladoProgramado || mProgramadoMes;
  const mEjecAcum = val.montoAcumuladoEjecutado || mEjecutadoMes;
  const pProgAcum = val.porcentajeProgramadoAcumulado || (obra.montoContractual > 0 ? (mProgAcum / obra.montoContractual) * 100 : 0);
  const pEjecAcum = val.porcentajeEjecutadoAcumulado || (obra.montoContractual > 0 ? (mEjecAcum / obra.montoContractual) * 100 : 0);

  const factorK = val.factorKReajuste || 1.020;
  const reajusteMonto = val.montoReajusteK || Number((mEjecutadoMes * (factorK - 1)).toFixed(2));
  const deduccionReajuste = Number((reajusteMonto * 0.10).toFixed(2));
  const reajusteNeto = Number((reajusteMonto - deduccionReajuste).toFixed(2));

  const amortDirecto = val.amortizacionAdelantoDirecto || 0;
  const amortMateriales = val.amortizacionMateriales || 0;
  const retGarantia = val.retencionFondoGarantia || 0;

  // Calculo de monto neto
  const subtotalNeto = val.montoNetoAPagar > 0
    ? val.montoNetoAPagar
    : Number((mEjecutadoMes + reajusteNeto - amortDirecto - amortMateriales - retGarantia).toFixed(2));

  const igv = Number((subtotalNeto * 0.18).toFixed(2));
  const totalCancelar = Number((subtotalNeto + igv).toFixed(2));
  const letras = numeroALetras(totalCancelar);

  return {
    id: `report-${obra.id || "obra"}-val-${numVal}`,
    tipoInforme: tipo,
    numeroDocumento: numDoc,
    fechaDocumento: dateNow,
    lugarFecha: `Rioja, ${dateNow}`,

    entidadNombre: entidad.toUpperCase(),
    entidadRuc: "20148174415",
    entidadGerencia: "GERENCIA DE DESARROLLO URBANO E INFRAESTRUCTURA",
    entidadSubgerencia: "SUBGERENCIA DE OBRAS PÚBLICAS Y CATASTRO",

    destinatarioNombre: "Ing. Carlos Mendoza Pinedo",
    destinatarioCargo: "Gerente de Desarrollo Urbano e Infraestructura",
    destinatarioEntidad: entidad,

    remitenteNombre: "Ing. Vanessa Dávila Ruiz",
    remitenteCargo: "Especialista en Valorizaciones y Liquidaciones de Obra",
    remitenteCip: "CIP 198421",
    remitenteDni: "46890112",

    supervisorNombre: obra.jefeSupervision || obra.supervisor || "Ing. Wilson Tafur Vargas",
    supervisorCip: obra.cipJefeSupervision || "CIP 218904",
    supervisorEmpresa: obra.supervisor || "Consorcio Supervisor Alto Mayo",
    supervisorCartaNumero: `CARTA N° 0${numVal + 12}-${year}-SO/MPR`,
    supervisorCartaFecha: dateNow,

    contratistaRazonSocial: (obra.contratista || "CONSORCIO VIAL RIOJA").toUpperCase(),
    contratistaRuc: obra.rucContratista || "20608912341",
    residenteNombre: obra.residente || "Ing. Jhon Franklin Rojas Silva",
    residenteCip: obra.cipResidente || "CIP 184512",
    residenteCartaNumero: `CARTA N° 0${numVal + 6}-${year}-RO/CVR`,
    residenteCartaFecha: val.fechaPresentacion || dateNow,

    cui: obra.cui || "2489102",
    nombreObra: (obra.nombre || "MEJORAMIENTO Y AMPLIACIÓN DE LOS SERVICIOS DE TRANSITABILIDAD URBANA EN EL DISTRITO DE RIOJA - SAN MARTÍN").toUpperCase(),
    contratoNumero: obra.numeroDocumentoContratista || `CONTRATO N° 018-${year}-MPR/GM`,
    fechaFirmaContrato: obra.fechaSuscripcionContratista || "08/01/2025",
    procesoSeleccion: "LICITACIÓN PÚBLICA N° 002-2025-MPR/CS - PRIMERA CONVOCATORIA",
    sistemaContratacion: obra.sistemaContratacion || "A Precios Unitarios",
    plazoContractualDias: obra.plazoDias || 180,
    fechaEntregaTerreno: obra.fechaInicio || "15/01/2025",
    fechaInicioPlazo: obra.fechaInicio || "16/01/2025",
    fechaFinContractual: obra.fechaFinProgramada || "14/07/2025",
    fechaFinReprogramada: obra.fechaFinReprogramada || obra.fechaFinProgramada || "14/07/2025",
    montoContratoOriginal: obra.montoContractual || 4580250,
    montoAdicionalesAprobados: 0,
    montoDeductivosAprobados: 0,
    montoContratoVigente: obra.montoContractual || 4580250,

    numeroValorizacion: numVal,
    mesPeriodo: val.mesPeriodo || `Mes ${numVal}`,
    periodoInicio: `01/${String(numVal).padStart(2, "0")}/${year}`,
    periodoFin: `30/${String(numVal).padStart(2, "0")}/${year}`,

    montoProgramadoMes: mProgramadoMes,
    porcentajeProgramadoMes: Number(pProgramadoMes.toFixed(2)),
    montoEjecutadoMes: mEjecutadoMes,
    porcentajeEjecutadoMes: Number(pEjecutadoMes.toFixed(2)),

    montoProgramadoAcumulado: mProgAcum,
    porcentajeProgramadoAcumulado: Number(pProgAcum.toFixed(2)),
    montoEjecutadoAcumulado: mEjecAcum,
    porcentajeEjecutadoAcumulado: Number(pEjecAcum.toFixed(2)),

    valorizacionBruta: mEjecutadoMes,
    factorKReajuste: factorK,
    reajusteMontoK: reajusteMonto,
    deduccionReajusteNoCorresponde: deduccionReajuste,
    reajusteNeto: reajusteNeto,

    adelantoDirectoOtorgado: obra.adelantoDirectoOtorgado || 0,
    amortizacionAdelantoDirectoMes: amortDirecto,
    amortizacionAdelantoDirectoAcumulada: amortDirecto * numVal,
    saldoAdelantoDirecto: Math.max(0, (obra.adelantoDirectoOtorgado || 0) - (amortDirecto * numVal)),

    adelantoMaterialesOtorgado: obra.adelantoMaterialesOtorgado || 0,
    amortizacionMaterialesMes: amortMateriales,
    amortizacionMaterialesAcumulada: amortMateriales * numVal,
    saldoAdelantoMateriales: Math.max(0, (obra.adelantoMaterialesOtorgado || 0) - (amortMateriales * numVal)),

    retencionFondoGarantiaMes: retGarantia,
    penalidadesMora: 0,
    otrasPenalidades: 0,

    montoNetoAPagar: subtotalNeto,
    igv18Pct: igv,
    totalFacturarCancelar: totalCancelar,
    montoTotalLetras: letras,

    controlCalidadDetalle: "Conforme. Certificados de rotura de probetas de concreto f'c=210 kg/cm2 y densidades de campo validados por el Laboratorio de Suelos acreditado.",
    controlSSTDetalle: "Conforme. Registro de cumplimiento al 100% de la Norma Técnica G.050 y protocolos de seguridad vial en la ciudad de Rioja.",
    controlCuadernoObraDetalle: `Conforme. Asientos digitales registrados puntualmente en la plataforma del COD correspondiente al periodo valorizado N° ${numVal}.`,
    controlPersonalClaveDetalle: "Conforme. Residente de Obra y especialistas mantuvieron permanencia a tiempo completo en el proyecto sin observaciones.",

    asuntoTexto: `APROBACIÓN, CONFORMIDAD TÉCNICA Y TRÁMITE DE PAGO DE LA VALORIZACIÓN N° ${numFormatted} (${val.mesPeriodo}) DEL CONTRATO DE EJECUCIÓN DE OBRA N° ${obra.numeroDocumentoContratista || `018-${year}-MPR/GM`} - CUI N° ${obra.cui || "2489102"}`,
    referenciaTexto: `a) ${obra.numeroDocumentoContratista || "Contrato de Obra"}\nb) Carta de la Supervisión de Obra N° 0${numVal + 12}-${year}-SO\nc) Carta del Contratista Ejecutor N° 0${numVal + 6}-${year}-RO\nd) Artículos 194, 195 y 198 del D.S. N° 344-2018-EF`,
    conclusiones: [
      `Se otorga la CONFORMIDAD TÉCNICA Y FINANCIERA a la Valorización N° ${numFormatted} (${val.mesPeriodo}), por un monto ejecutado bruto de ${formatPEN(mEjecutadoMes)}.`,
      `El avance acumulado ejecutado de la obra alcanza el ${pEjecAcum.toFixed(2)}%, frente al ${pProgAcum.toFixed(2)}% programado, encontrándose dentro del marco de normalidad técnica y cumplimiento legal del umbral del 80% (Art. 198 RLCE).`,
      `El importe neto a favor del contratista asciende a ${formatPEN(subtotalNeto)}, y con el Impuesto General a las Ventas (18%) totaliza la suma de ${formatPEN(totalCancelar)} (${letras}).`,
    ],
    recomendaciones: [
      `APROBAR formalmente la Valorización N° ${numFormatted} por el importe total de ${formatPEN(totalCancelar)} (incluido IGV).`,
      `DERIVAR con carácter de MUY URGENTE a la Gerencia de Administración y Finanzas, Subgerencia de Contabilidad y Tesorería de la Municipalidad Provincial de Rioja para el devengado y pago antes de vencer el plazo legal del Art. 194.5 del RLCE.`,
      `NOTIFICAR a la Supervisión y al Contratista para el registro contable y control en el Sistema de Información de Obras Públicas (INFOBRAS).`,
    ],
  };
}
