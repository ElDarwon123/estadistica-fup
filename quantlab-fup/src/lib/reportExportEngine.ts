import { jsPDF } from "jspdf";
import {
  formatCourseNumber,
  type FrequencyTableResult,
  type CentralTendencyResult,
  type DispersionResult,
  type PositionMeasureProcedure,
  computePositionMeasure,
} from "./statisticsEngine";
import type { DatasetMeta } from "../data/defaultDatasets";

export interface ReportExportData {
  dataset: DatasetMeta;
  variableName: string;
  unit: string;
  variableType: "Discreta" | "Continua";
  variableJustification: string;
  isGrouped: boolean;
  numericData: number[];
  freqTable: FrequencyTableResult;
  centralTendency: CentralTendencyResult;
  dispersion: DispersionResult;
  interpretation: {
    paragraph1: string;
    paragraph2: string;
    paragraph3: string;
    paragraph4: string;
  };
}

/**
 * 1. EXPORTADOR DE REPORTE OFICIAL EN PDF (Vía jsPDF)
 * Genera un documento PDF académico institucional de alta resolución
 * con todas las secciones, tablas, fórmulas y diagnósticos metodológicos.
 */
export function exportReportToPDF(data: ReportExportData): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const u = data.unit ? ` ${data.unit}` : "";
  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm
  let curY = 16;

  const checkAddPage = (neededHeight: number) => {
    if (curY + neededHeight > pageHeight - 16) {
      doc.addPage();
      curY = 16;
      drawPageHeader();
    }
  };

  const drawPageHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(115, 115, 115);
    doc.text("QUANTLAB FUP • MOTOR DE ANALÍTICA ESTADÍSTICA CUANTITATIVA", marginX, 10);
    doc.setFont("helvetica", "normal");
    doc.text(`Variable: ${data.variableName} | N = ${data.numericData.length}`, pageWidth - marginX, 10, { align: "right" });
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(marginX, 12, pageWidth - marginX, 12);
  };

  // ENCABEZADO INSTITUCIONAL PRINCIPAL (PÁGINA 1)
  doc.setFillColor(10, 10, 10);
  doc.rect(marginX, curY, contentWidth, 22, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("FUNDACIÓN UNIVERSITARIA DE POPAYÁN", marginX + 6, curY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(220, 220, 220);
  doc.text("FACULTAD DE INGENIERÍA • CURSO DE ESTADÍSTICA DESCRIPTIVA & PROBABILIDAD", marginX + 6, curY + 14);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(`QUANTLAB FUP v2.4 • Generado: ${new Date().toLocaleString("es-CO")}`, marginX + 6, curY + 19);

  curY += 27;

  // TÍTULO DEL INFORME
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(10, 10, 10);
  doc.text(`INFORME TÉCNICO INTEGRAL: VARIABLE "${data.variableName.toUpperCase()}"`, marginX, curY);
  curY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Base de Datos: "${data.dataset.name}" (N = ${data.numericData.length} registros válidos) | Unidad: [${data.unit || "Adimensional"}]`,
    marginX,
    curY
  );
  curY += 8;

  // SECCIÓN 1: FICHA TÉCNICA Y CLASIFICACIÓN METODOLÓGICA (Altura dinámica sin solapamientos)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const justLines = doc.splitTextToSize(`• Justificación Teórica: ${data.variableJustification}`, contentWidth - 8);
  const critText = `• Criterio de Agrupación del Curso: ${
    data.isGrouped
      ? `Datos Agrupados (N ≥ 40). Regla de Sturges: k = ${data.freqTable.sturgesK}, Rango = ${formatCourseNumber(
          data.freqTable.rangeR
        )}${u}, Amplitud A = ${formatCourseNumber(data.freqTable.amplitudeA)}${u}.`
      : "Datos No Agrupados (N < 40). Análisis exacto sobre valores individuales observados."
  }`;
  const critLines = doc.splitTextToSize(critText, contentWidth - 8);
  const sec1H = 14 + justLines.length * 3.8 + critLines.length * 3.8 + 4;

  checkAddPage(sec1H + 4);
  doc.setFillColor(245, 245, 245);
  doc.rect(marginX, curY, contentWidth, sec1H, "F");
  doc.setDrawColor(210, 210, 210);
  doc.rect(marginX, curY, contentWidth, sec1H, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(10, 10, 10);
  doc.text("1. FICHA TÉCNICA Y CLASIFICACIÓN DE VARIABLE", marginX + 4, curY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);
  doc.text(`• Clasificación Metodológica: Cuantitativa ${data.variableType}`, marginX + 4, curY + 11.5);
  doc.text(justLines, marginX + 4, curY + 16);
  doc.text(critLines, marginX + 4, curY + 16 + justLines.length * 3.8 + 1.5);

  curY += sec1H + 6;

  // SECCIÓN 2: TABLA DE DISTRIBUCIÓN DE FRECUENCIAS
  checkAddPage(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(10, 10, 10);
  doc.text("2. TABLA DE DISTRIBUCIÓN DE FRECUENCIAS Y VERIFICACIÓN", marginX, curY);
  curY += 5;

  // Cabecera de la tabla
  const colWidths = [12, 42, 22, 18, 18, 24, 24, 22]; // Total = 182mm
  const headers = [
    "i",
    data.isGrouped ? "Intervalo [Li, Ls)" : "Variable (xi)",
    data.isGrouped ? "Marca (xi)" : "xi",
    "fi",
    "Fi",
    "hi",
    "% (hi×100)",
    "Grados (°)",
  ];

  doc.setFillColor(20, 20, 20);
  doc.rect(marginX, curY, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  let curX = marginX;
  headers.forEach((h, idx) => {
    doc.text(h, curX + colWidths[idx] / 2, curY + 4.8, { align: "center" });
    curX += colWidths[idx];
  });
  curY += 7;

  // Filas de la tabla
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  data.freqTable.rows.forEach((row, rIdx) => {
    checkAddPage(6);
    if (rIdx % 2 === 1) {
      doc.setFillColor(248, 248, 248);
      doc.rect(marginX, curY, contentWidth, 5.5, "F");
    }

    doc.setTextColor(20, 20, 20);
    let rx = marginX;

    // i
    doc.text(row.index.toString(), rx + colWidths[0] / 2, curY + 3.8, { align: "center" });
    rx += colWidths[0];

    // Intervalo / xi
    const labelCol = data.isGrouped ? `[${row.lowerLimit}, ${row.upperLimit})` : formatCourseNumber(row.classMark);
    doc.text(labelCol, rx + colWidths[1] / 2, curY + 3.8, { align: "center" });
    rx += colWidths[1];

    // xi
    doc.text(formatCourseNumber(row.classMark), rx + colWidths[2] / 2, curY + 3.8, { align: "center" });
    rx += colWidths[2];

    // fi
    doc.text(row.absoluteFrequency.toString(), rx + colWidths[3] / 2, curY + 3.8, { align: "center" });
    rx += colWidths[3];

    // Fi
    doc.text(row.cumulativeFrequency.toString(), rx + colWidths[4] / 2, curY + 3.8, { align: "center" });
    rx += colWidths[4];

    // hi
    doc.text(formatCourseNumber(row.relativeFrequency), rx + colWidths[5] / 2, curY + 3.8, { align: "center" });
    rx += colWidths[5];

    // %
    doc.text(`${formatCourseNumber(row.percentage)}%`, rx + colWidths[6] / 2, curY + 3.8, { align: "center" });
    rx += colWidths[6];

    // Grados
    doc.text(`${formatCourseNumber(row.degrees)}°`, rx + colWidths[7] / 2, curY + 3.8, { align: "center" });

    // Línea separadora horizontal sutil
    doc.setDrawColor(235, 235, 235);
    doc.line(marginX, curY + 5.5, marginX + contentWidth, curY + 5.5);
    curY += 5.5;
  });

  // Fila de totales y validación
  checkAddPage(10);
  doc.setFillColor(235, 235, 235);
  doc.rect(marginX, curY, contentWidth, 6.5, "F");
  doc.setDrawColor(180, 180, 180);
  doc.rect(marginX, curY, contentWidth, 6.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(10, 10, 10);

  let tx = marginX;
  doc.text("TOTALES:", tx + (colWidths[0] + colWidths[1] + colWidths[2]) / 2, curY + 4.5, { align: "center" });
  tx += colWidths[0] + colWidths[1] + colWidths[2];

  doc.text(`Σ fi = ${data.freqTable.sumAbsolute}`, tx + colWidths[3] / 2, curY + 4.5, { align: "center" });
  tx += colWidths[3] + colWidths[4];

  doc.text(`Σ hi = ${formatCourseNumber(data.freqTable.sumRelative)}`, tx + colWidths[5] / 2, curY + 4.5, { align: "center" });
  tx += colWidths[5];

  doc.text(`Σ % = ${formatCourseNumber(data.freqTable.sumPercentage)}%`, tx + colWidths[6] / 2, curY + 4.5, { align: "center" });
  tx += colWidths[6];

  doc.text(`Σ ° = ${formatCourseNumber(data.freqTable.sumDegrees)}°`, tx + colWidths[7] / 2, curY + 4.5, { align: "center" });

  curY += 10;

  // SECCIÓN 3: MEDIDAS DE TENDENCIA CENTRAL & ASIMETRÍA
  const cardW = (contentWidth - 6) / 3;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);

  const tcCards = [
    {
      title: "Media Aritmética (x̄)",
      val: `${formatCourseNumber(data.centralTendency.mean)}${u}`,
      subLines: doc.splitTextToSize(data.centralTendency.meanCalculationSteps || "", cardW - 6),
    },
    {
      title: "Mediana (Me - 50%)",
      val: `${formatCourseNumber(data.centralTendency.median)}${u}`,
      subLines: doc.splitTextToSize(data.centralTendency.medianCalculationSteps || "", cardW - 6),
    },
    {
      title: `Moda (Mo) • ${data.centralTendency.modeType}`,
      val: (data.centralTendency.modes || []).map((m) => `${formatCourseNumber(m)}${u}`).join(", ") || "Amodal",
      subLines: doc.splitTextToSize(data.centralTendency.modeExplanation || "", cardW - 6),
    },
  ];

  const maxTcH = Math.max(24, ...tcCards.map((c) => 17 + c.subLines.length * 3.1 + 3));
  checkAddPage(maxTcH + 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(10, 10, 10);
  doc.text("3. MEDIDAS DE TENDENCIA CENTRAL Y FORMA DE LA DISTRIBUCIÓN", marginX, curY);
  curY += 5;

  tcCards.forEach((c, idx) => {
    const cx = marginX + idx * (cardW + 3);
    doc.setFillColor(250, 250, 250);
    doc.rect(cx, curY, cardW, maxTcH, "F");
    doc.setDrawColor(220, 220, 220);
    doc.rect(cx, curY, cardW, maxTcH, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(c.title, cx + 3, curY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(10, 10, 10);
    doc.text(c.val, cx + 3, curY + 11.5, { maxWidth: cardW - 6 });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(70, 70, 70);
    doc.text(c.subLines, cx + 3, curY + 16.5);
  });

  curY += maxTcH + 4;

  // Asimetría / Sesgo (altura dinámica)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const skewLines = doc.splitTextToSize(data.centralTendency.skewnessExplanation || "", contentWidth - 8);
  const skewH = 8 + skewLines.length * 3.4 + 3;
  checkAddPage(skewH + 4);

  doc.setFillColor(245, 245, 245);
  doc.rect(marginX, curY, contentWidth, skewH, "F");
  doc.setDrawColor(210, 210, 210);
  doc.rect(marginX, curY, contentWidth, skewH, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(10, 10, 10);
  doc.text(`Diagnóstico de Asimetría: Distribución ${data.centralTendency.skewness}`, marginX + 4, curY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(skewLines, marginX + 4, curY + 9.5);

  curY += skewH + 6;

  // SECCIÓN 4: MEDIDAS DE POSICIÓN (CUARTILES, DECILES Y PERCENTILES)
  const q1 = computePositionMeasure(data.numericData, 1, 4, "Q");
  const q2 = computePositionMeasure(data.numericData, 2, 4, "Q");
  const q3 = computePositionMeasure(data.numericData, 3, 4, "Q");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  const qCards = [
    {
      title: "Cuartil 1 (Q1 - 25%)",
      val: `${formatCourseNumber(q1.value)}${u}`,
      descLines: doc.splitTextToSize(q1.procedureText || "", cardW - 6),
    },
    {
      title: "Cuartil 2 (Q2 - 50% = Me)",
      val: `${formatCourseNumber(q2.value)}${u}`,
      descLines: doc.splitTextToSize(q2.procedureText || "", cardW - 6),
    },
    {
      title: "Cuartil 3 (Q3 - 75%)",
      val: `${formatCourseNumber(q3.value)}${u}`,
      descLines: doc.splitTextToSize(q3.procedureText || "", cardW - 6),
    },
  ];

  const maxQH = Math.max(22, ...qCards.map((c) => 16.5 + c.descLines.length * 3.1 + 3));
  checkAddPage(maxQH + 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(10, 10, 10);
  doc.text("4. MEDIDAS DE POSICIÓN (CUARTILES, DECILES Y PERCENTILES)", marginX, curY);
  curY += 5;

  qCards.forEach((c, idx) => {
    const cx = marginX + idx * (cardW + 3);
    doc.setFillColor(250, 250, 250);
    doc.rect(cx, curY, cardW, maxQH, "F");
    doc.setDrawColor(220, 220, 220);
    doc.rect(cx, curY, cardW, maxQH, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(c.title, cx + 3, curY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(10, 10, 10);
    doc.text(c.val, cx + 3, curY + 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(70, 70, 70);
    doc.text(c.descLines, cx + 3, curY + 15.5);
  });

  curY += maxQH + 5;

  // Deciles y percentiles complementarios
  const d1 = computePositionMeasure(data.numericData, 1, 10, "D");
  const d5 = computePositionMeasure(data.numericData, 5, 10, "D");
  const d9 = computePositionMeasure(data.numericData, 9, 10, "D");
  const p95 = computePositionMeasure(data.numericData, 95, 100, "P");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  doc.text(
    `Deciles de Referencia: D1 = ${formatCourseNumber(d1.value)}${u} | D5 = ${formatCourseNumber(
      d5.value
    )}${u} | D9 = ${formatCourseNumber(d9.value)}${u} | P95 = ${formatCourseNumber(p95.value)}${u}`,
    marginX,
    curY
  );
  curY += 8;

  // SECCIÓN 5: MEDIDAS DE DISPERSIÓN & ATÍPICOS (TUKEY)
  const dispCols = (contentWidth - 9) / 4;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);

  const dispCards = [
    { title: "Rango Total (R)", val: `${formatCourseNumber(data.dispersion.rangeR)}${u}`, subLines: [] as string[] },
    { title: "Varianza Muestral (s²)", val: `${formatCourseNumber(data.dispersion.varianceSample)}`, subLines: [] as string[] },
    { title: "Desviación Estándar (s)", val: `${formatCourseNumber(data.dispersion.stdDevSample)}${u}`, subLines: [] as string[] },
    {
      title: "Coef. Variación (CV)",
      val: `${formatCourseNumber(data.dispersion.coefficientOfVariation)}%`,
      subLines: doc.splitTextToSize(data.dispersion.homogeneityLabel || "", dispCols - 6),
    },
  ];

  const maxDispH = Math.max(18, ...dispCards.map((c) => (c.subLines.length > 0 ? 15 + c.subLines.length * 3 + 2.5 : 18)));
  checkAddPage(maxDispH + 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(10, 10, 10);
  doc.text("5. MEDIDAS DE DISPERSIÓN Y ANÁLISIS DE ATÍPICOS (CRITERIO DE TUKEY)", marginX, curY);
  curY += 5;

  dispCards.forEach((c, idx) => {
    const cx = marginX + idx * (dispCols + 3);
    doc.setFillColor(250, 250, 250);
    doc.rect(cx, curY, dispCols, maxDispH, "F");
    doc.setDrawColor(220, 220, 220);
    doc.rect(cx, curY, dispCols, maxDispH, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(c.title, cx + 3, curY + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(10, 10, 10);
    doc.text(c.val, cx + 3, curY + 10.5, { maxWidth: dispCols - 6 });

    if (c.subLines.length > 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6.5);
      doc.setTextColor(40, 120, 50);
      doc.text(c.subLines, cx + 3, curY + 15);
    }
  });

  curY += maxDispH + 4;

  // Límites de Tukey y Outliers (altura dinámica)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  const tukeyTitleLines = doc.splitTextToSize(
    `Criterio de Tukey (1.5 × RIC): RIC = ${formatCourseNumber(data.dispersion.iqr)}${u} | Límite Inferior LI = ${formatCourseNumber(
      data.dispersion.lowerFenceLI
    )}${u} | Límite Superior LS = ${formatCourseNumber(data.dispersion.upperFenceLS)}${u}`,
    contentWidth - 8
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const outlierText =
    data.dispersion.outliers.length === 0
      ? "Estado: Sin valores atípicos detectados en el colectivo analizado. Distribución consistente."
      : `Valores Atípicos Detectados (${data.dispersion.outliers.length}): ${data.dispersion.outliers
          .map((o) => `${formatCourseNumber(o)}${u}`)
          .join(", ")}`;
  const outlierLines = doc.splitTextToSize(outlierText, contentWidth - 8);
  const tukeyH = 4 + tukeyTitleLines.length * 3.6 + 2 + outlierLines.length * 3.6 + 3;

  checkAddPage(tukeyH + 4);
  doc.setFillColor(248, 248, 248);
  doc.rect(marginX, curY, contentWidth, tukeyH, "F");
  doc.setDrawColor(210, 210, 210);
  doc.rect(marginX, curY, contentWidth, tukeyH, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(10, 10, 10);
  doc.text(tukeyTitleLines, marginX + 4, curY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(outlierLines, marginX + 4, curY + 5 + tukeyTitleLines.length * 3.6 + 1.5);

  curY += tukeyH + 6;

  // SECCIÓN 6: INTERPRETACIÓN OFICIAL DEL CURSO (4 PÁRRAFOS)
  checkAddPage(50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(10, 10, 10);
  doc.text("6. SÍNTESIS DE INTERPRETACIÓN OFICIAL (DIRECTRICES METODOLÓGICAS FUP)", marginX, curY);
  curY += 5;

  const paragraphs = [
    data.interpretation.paragraph1,
    data.interpretation.paragraph2,
    data.interpretation.paragraph3,
    data.interpretation.paragraph4,
  ];

  paragraphs.forEach((p) => {
    checkAddPage(16);
    doc.setFillColor(252, 252, 252);
    const splitText = doc.splitTextToSize(p, contentWidth - 8);
    const boxHeight = splitText.length * 3.8 + 5;

    doc.rect(marginX, curY, contentWidth, boxHeight, "F");
    doc.setDrawColor(225, 225, 225);
    doc.rect(marginX, curY, contentWidth, boxHeight, "S");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(20, 20, 20);
    doc.text(splitText, marginX + 4, curY + 4);

    curY += boxHeight + 3;
  });

  // SECCIÓN 7: PROBABILIDAD EMPÍRICA Y CONTEO
  checkAddPage(22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(10, 10, 10);
  doc.text("7. RESUMEN DE PROBABILIDAD EMPÍRICA Y ANÁLISIS COMBINATORIO", marginX, curY);
  curY += 5;

  const n = data.numericData.length;
  const greaterMeanCount = data.numericData.filter((x) => x > data.centralTendency.mean).length;
  const pGreaterMean = greaterMeanCount / (n || 1);

  const withinIQRCount = data.numericData.filter((x) => x >= data.dispersion.q1 && x <= data.dispersion.q3).length;
  const pWithinIQR = withinIQRCount / (n || 1);

  doc.setFillColor(248, 248, 248);
  doc.rect(marginX, curY, contentWidth, 14, "F");
  doc.setDrawColor(220, 220, 220);
  doc.rect(marginX, curY, contentWidth, 14, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);
  doc.text(
    `• Probabilidad de valores superiores a la media P(X > x̄): ${greaterMeanCount}/${n} = ${formatCourseNumber(
      pGreaterMean
    )} (${formatCourseNumber(pGreaterMean * 100)}%)`,
    marginX + 4,
    curY + 5
  );
  doc.text(
    `• Probabilidad en rango intercuartílico P(Q1 ≤ X ≤ Q3): ${withinIQRCount}/${n} = ${formatCourseNumber(
      pWithinIQR
    )} (${formatCourseNumber(pWithinIQR * 100)}%)`,
    marginX + 4,
    curY + 10
  );

  curY += 18;

  // PIE DE PÁGINA FINAL EN CADA HOJA
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `QUANTLAB FUP • Reporte Integral de Analítica • Página ${p} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  // DESCARGA DEL ARCHIVO
  const safeVar = data.variableName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeDs = data.dataset.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`Reporte_Integral_${safeDs}_${safeVar}.pdf`);
}

/**
 * 2. EXPORTADOR DE REPORTE COMPLETO EN MARKDOWN (.md)
 * Permite al estudiante o docente copiar el informe en formato Markdown listo para entrega.
 */
export function exportReportToMarkdown(data: ReportExportData): void {
  const u = data.unit ? ` ${data.unit}` : "";
  const n = data.numericData.length;

  const q1 = computePositionMeasure(data.numericData, 1, 4, "Q");
  const q2 = computePositionMeasure(data.numericData, 2, 4, "Q");
  const q3 = computePositionMeasure(data.numericData, 3, 4, "Q");

  const lines: string[] = [
    `# INFORME TÉCNICO INTEGRAL DE ANALÍTICA ESTADÍSTICA`,
    `**Institución:** Fundación Universitaria de Popayán (FUP)  `,
    `**Curso:** Estadística Descriptiva y Probabilidad  `,
    `**Software:** QUANTLAB FUP v2.4 (Clinical Blueprint)  `,
    `**Fecha de Generación:** ${new Date().toLocaleString("es-CO")}  `,
    ``,
    `---`,
    ``,
    `## 1. Ficha Técnica y Metadatos`,
    `- **Base de Datos Seleccionada:** ${data.dataset.name} (${data.dataset.description})`,
    `- **Tamaño de Muestra (N):** ${n} observaciones válidas`,
    `- **Variable Analizada:** \`${data.variableName}\``,
    `- **Unidad de Medida:** [${data.unit || "Adimensional"}]`,
    `- **Tipo de Variable:** Cuantitativa ${data.variableType}`,
    `- **Justificación:** ${data.variableJustification}`,
    `- **Criterio Metodológico de Agrupación:** ${
      data.isGrouped
        ? `Datos Agrupados en Intervalos (Regla de Sturges: k = ${data.freqTable.sturgesK}, Rango R = ${formatCourseNumber(
            data.freqTable.rangeR
          )}${u}, Amplitud A = ${formatCourseNumber(data.freqTable.amplitudeA)}${u})`
        : "Datos No Agrupados (Valores individuales exactos N < 40)"
    }`,
    ``,
    `---`,
    ``,
    `## 2. Tabla de Distribución de Frecuencias`,
    ``,
    `| i | ${data.isGrouped ? "Intervalo [Li, Ls)" : "Variable (xi)"} | Marca de Clase (xi) | Frec. Absoluta (fi) | Frec. Acumulada (Fi) | Frec. Relativa (hi) | Frec. Rel. Acum. (Hi) | Porcentaje (%) | Grados (°) |`,
    `|---|---|---|---|---|---|---|---|---|`,
  ];

  data.freqTable.rows.forEach((r) => {
    const label = data.isGrouped ? `[${r.lowerLimit}, ${r.upperLimit})` : formatCourseNumber(r.classMark);
    lines.push(
      `| ${r.index} | ${label} | ${formatCourseNumber(r.classMark)} | ${r.absoluteFrequency} | ${r.cumulativeFrequency} | ${formatCourseNumber(
        r.relativeFrequency
      )} | ${formatCourseNumber(r.cumulativeRelativeFrequency)} | ${formatCourseNumber(r.percentage)}% | ${formatCourseNumber(r.degrees)}° |`
    );
  });

  lines.push(
    `| **TOTAL** | — | — | **${data.freqTable.sumAbsolute}** | — | **${formatCourseNumber(
      data.freqTable.sumRelative
    )}** | — | **${formatCourseNumber(data.freqTable.sumPercentage)}%** | **${formatCourseNumber(
      data.freqTable.sumDegrees
    )}°** |`
  );

  lines.push(
    ``,
    `**Validación de Consistencia:** Σ fi = N (${data.freqTable.sumAbsolute} = ${n}) ✓ | Σ hi = 1.000 ✓ | Σ % = 100% ✓ | Σ ° = 360° ✓`,
    ``,
    `---`,
    ``,
    `## 3. Medidas de Tendencia Central y Asimetría`,
    `- **Media Aritmética (x̄):** ${formatCourseNumber(data.centralTendency.mean)}${u}`,
    `  - Procedimiento: ${data.centralTendency.meanCalculationSteps}`,
    `- **Mediana (Me):** ${formatCourseNumber(data.centralTendency.median)}${u}`,
    `  - Procedimiento: ${data.centralTendency.medianCalculationSteps}`,
    `- **Moda (Mo):** ${(data.centralTendency.modes || []).map((m) => formatCourseNumber(m) + u).join(", ") || "Amodal"} (${data.centralTendency.modeType})`,
    `  - ${data.centralTendency.modeExplanation}`,
    `- **Asimetría de la Distribución:** ${data.centralTendency.skewness}`,
    `  - ${data.centralTendency.skewnessExplanation}`,
    ``,
    `---`,
    ``,
    `## 4. Medidas de Posición (Cuartiles, Deciles, Percentiles)`,
    `- **Primer Cuartil (Q1 - 25%):** ${formatCourseNumber(q1.value)}${u} — ${q1.procedureText}`,
    `- **Segundo Cuartil (Q2 - 50% = Me):** ${formatCourseNumber(q2.value)}${u} — ${q2.procedureText}`,
    `- **Tercer Cuartil (Q3 - 75%):** ${formatCourseNumber(q3.value)}${u} — ${q3.procedureText}`,
    `- **Rango Intercuartílico (RIC = Q3 - Q1):** ${formatCourseNumber(data.dispersion.iqr)}${u}`,
    ``,
    `---`,
    ``,
    `## 5. Medidas de Dispersión y Valores Atípicos (Regla de Tukey)`,
    `- **Rango Total (R = máx - mín):** ${formatCourseNumber(data.dispersion.rangeR)}${u} (Mín: ${formatCourseNumber(
      data.dispersion.minVal
    )}${u}, Máx: ${formatCourseNumber(data.dispersion.maxVal)}${u})`,
    `- **Varianza Poblacional (σ²):** ${formatCourseNumber(data.dispersion.variancePop)}`,
    `- **Varianza Muestral (s²):** ${formatCourseNumber(data.dispersion.varianceSample)}`,
    `- **Desviación Estándar Poblacional (σ):** ${formatCourseNumber(data.dispersion.stdDevPop)}${u}`,
    `- **Desviación Estándar Muestral (s):** ${formatCourseNumber(data.dispersion.stdDevSample)}${u}`,
    `- **Coeficiente de Variación (CV):** ${formatCourseNumber(data.dispersion.coefficientOfVariation)}%`,
    `  - **Diagnóstico de Homogeneidad:** "${data.dispersion.homogeneityLabel}" (${
      data.dispersion.coefficientOfVariation <= 20
        ? "Datos homogéneos; la media es altamente representativa."
        : "Datos heterogéneos; se recomienda prudencia al usar únicamente la media."
    })`,
    `- **Límites de Control de Tukey (1.5 × RIC):**`,
    `  - Límite Inferior (LI = Q1 - 1.5×RIC): ${formatCourseNumber(data.dispersion.lowerFenceLI)}${u}`,
    `  - Límite Superior (LS = Q3 + 1.5×RIC): ${formatCourseNumber(data.dispersion.upperFenceLS)}${u}`,
    `  - **Valores Atípicos Detectados:** ${
      data.dispersion.outliers.length === 0
        ? "Ninguno (distribución sin anomalías extremas)."
        : `${data.dispersion.outliers.length} valores: ${data.dispersion.outliers
            .map((o) => formatCourseNumber(o) + u)
            .join(", ")}`
    }`,
    ``,
    `---`,
    ``,
    `## 6. Síntesis de Interpretación Oficial (4 Párrafos Académicos)`,
    `### 6.1. Comportamiento Típico y Tendencia Central`,
    `${data.interpretation.paragraph1}`,
    ``,
    `### 6.2. Dispersión y Homogeneidad de los Datos`,
    `${data.interpretation.paragraph2}`,
    ``,
    `### 6.3. Posición y Cortes de Distribución Acumulada`,
    `${data.interpretation.paragraph3}`,
    ``,
    `### 6.4. Diagnóstico de Valores Atípicos`,
    `${data.interpretation.paragraph4}`,
    ``,
    `---`,
    `*Informe generado automáticamente por QUANTLAB FUP • Fundación Universitaria de Popayán*`
  );

  const content = lines.join("\n");
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeVar = data.variableName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeDs = data.dataset.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  a.href = url;
  a.download = `Reporte_Integral_${safeDs}_${safeVar}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 3. EXPORTADOR DE TABLA DE FRECUENCIAS Y MÉTRICAS EN CSV
 */
export function exportFrequencyTableToCSV(data: ReportExportData): void {
  const lines: string[] = [];

  // Metadatos
  lines.push(`"REPORTE ESTADÍSTICO INTEGRAL QUANTLAB FUP"`);
  lines.push(`"Base de Datos";"${data.dataset.name}"`);
  lines.push(`"Variable";"${data.variableName}"`);
  lines.push(`"Unidad";"${data.unit || "Adimensional"}"`);
  lines.push(`"Tipo de Variable";"Cuantitativa ${data.variableType}"`);
  lines.push(`"Muestra N";${data.numericData.length}`);
  lines.push(``);

  // Cabecera tabla
  lines.push(
    `"i";"Intervalo_o_Valor";"Marca_Clase_xi";"Frec_Absoluta_fi";"Frec_Acumulada_Fi";"Frec_Relativa_hi";"Frec_Rel_Acum_Hi";"Porcentaje";"Grados"`
  );

  data.freqTable.rows.forEach((r) => {
    const label = data.isGrouped ? `[${r.lowerLimit}; ${r.upperLimit})` : formatCourseNumber(r.classMark);
    lines.push(
      `${r.index};"${label}";${formatCourseNumber(r.classMark)};${r.absoluteFrequency};${r.cumulativeFrequency};${formatCourseNumber(
        r.relativeFrequency
      )};${formatCourseNumber(r.cumulativeRelativeFrequency)};${formatCourseNumber(r.percentage)};${formatCourseNumber(r.degrees)}`
    );
  });

  lines.push(
    `"TOTAL";"";"";${data.freqTable.sumAbsolute};"";${formatCourseNumber(
      data.freqTable.sumRelative
    )};"";${formatCourseNumber(data.freqTable.sumPercentage)};${formatCourseNumber(data.freqTable.sumDegrees)}`
  );

  lines.push(``);
  lines.push(`"MÉTRICAS PRINCIPALES"`);
  lines.push(`"Media Aritmética";${formatCourseNumber(data.centralTendency.mean)}`);
  lines.push(`"Mediana";${formatCourseNumber(data.centralTendency.median)}`);
  lines.push(`"Moda";"${(data.centralTendency.modes || []).map((m) => formatCourseNumber(m)).join(", ") || "Amodal"}"`);
  lines.push(`"Rango Total";${formatCourseNumber(data.dispersion.rangeR)}`);
  lines.push(`"Desviación Estándar Muestral";${formatCourseNumber(data.dispersion.stdDevSample)}`);
  lines.push(`"Coeficiente de Variación (%)";${formatCourseNumber(data.dispersion.coefficientOfVariation)}`);
  lines.push(`"Diagnóstico Homogeneidad";"${data.dispersion.homogeneityLabel}"`);

  const content = lines.join("\n");
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeVar = data.variableName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeDs = data.dataset.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  a.href = url;
  a.download = `Tabla_Frecuencias_${safeDs}_${safeVar}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
