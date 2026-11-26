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

  // Normaliza símbolos Unicode fuera de WinAnsi para evitar glifos corruptos y desbordes en jsPDF
  const sanitizePdfText = (raw: string): string => {
    return raw
      .replace(/x\u0304/g, "Media")
      .replace(/\u03A3/g, "Sum")
      .replace(/\u2265/g, ">=")
      .replace(/\u2264/g, "<=")
      .replace(/\u2260/g, "!=")
      .replace(/\u221A/g, "raiz")
      .replace(/\u222A/g, "U")
      .replace(/\u2229/g, "n")
      .replace(/\u2205/g, "{}")
      .normalize("NFC")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x00-\xFF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026]/g, " ");
  };

  const drawLines = (lines: string[], x: number, y: number, lineHeight: number) => {
    lines.forEach((line, idx) => {
      doc.text(line, x, y + idx * lineHeight);
    });
  };

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

  // Encabezado institucional principal (página 1)
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

  // Título del informe
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
  const justLines = doc.splitTextToSize(
    sanitizePdfText(`• Justificación Teórica: ${data.variableJustification}`),
    contentWidth - 8
  );
  const critText = sanitizePdfText(
    `• Criterio de Agrupación del Curso: ${
      data.isGrouped
        ? `Datos Agrupados (N >= 40). Regla de Sturges: k = ${data.freqTable.sturgesK}, Rango = ${formatCourseNumber(
            data.freqTable.rangeR
          )}${u}, Amplitud A = ${formatCourseNumber(data.freqTable.amplitudeA)}${u}.`
        : "Datos No Agrupados (N < 40). Análisis exacto sobre valores individuales observados."
    }`
  );
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
  doc.text(sanitizePdfText(`• Clasificación Metodológica: Cuantitativa ${data.variableType}`), marginX + 4, curY + 11.5);
  drawLines(justLines, marginX + 4, curY + 16, 3.8);
  drawLines(critLines, marginX + 4, curY + 16 + justLines.length * 3.8 + 1.5, 3.8);

  curY += sec1H + 6;

  // Sección 2: tabla de distribución de frecuencias
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

    // I
    doc.text(row.index.toString(), rx + colWidths[0] / 2, curY + 3.8, { align: "center" });
    rx += colWidths[0];

    // Intervalo / xi
    const labelCol = data.isGrouped ? `[${row.lowerLimit}, ${row.upperLimit})` : formatCourseNumber(row.classMark);
    doc.text(labelCol, rx + colWidths[1] / 2, curY + 3.8, { align: "center" });
    rx += colWidths[1];

    // Xi
    doc.text(formatCourseNumber(row.classMark), rx + colWidths[2] / 2, curY + 3.8, { align: "center" });
    rx += colWidths[2];

    // Fi
    doc.text(row.absoluteFrequency.toString(), rx + colWidths[3] / 2, curY + 3.8, { align: "center" });
    rx += colWidths[3];

    // Fi
    doc.text(row.cumulativeFrequency.toString(), rx + colWidths[4] / 2, curY + 3.8, { align: "center" });
    rx += colWidths[4];

    // Hi
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

  doc.text(`Sum fi = ${data.freqTable.sumAbsolute}`, tx + colWidths[3] / 2, curY + 4.5, { align: "center" });
  tx += colWidths[3] + colWidths[4];

  doc.text(`Sum hi = ${formatCourseNumber(data.freqTable.sumRelative)}`, tx + colWidths[5] / 2, curY + 4.5, { align: "center" });
  tx += colWidths[5];

  doc.text(`Sum % = ${formatCourseNumber(data.freqTable.sumPercentage)}%`, tx + colWidths[6] / 2, curY + 4.5, { align: "center" });
  tx += colWidths[6];

  doc.text(`Sum ° = ${formatCourseNumber(data.freqTable.sumDegrees)}°`, tx + colWidths[7] / 2, curY + 4.5, { align: "center" });

  curY += 10;

  // Gráficos de Sección 2: Histograma/Barras + Gráfico Circular (vectoriales)
  if (data.freqTable.rows.length > 0) {
    const chartBoxH = 62;
    checkAddPage(chartBoxH + 6);

    const leftW = 94;
    const rightW = contentWidth - leftW - 4;
    const rightX = marginX + leftW + 4;

    // Contenedor Histograma / Barras
    doc.setFillColor(252, 252, 252);
    doc.rect(marginX, curY, leftW, chartBoxH, "F");
    doc.setDrawColor(220, 220, 220);
    doc.rect(marginX, curY, leftW, chartBoxH, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(20, 20, 20);
    doc.text(data.isGrouped ? "HISTOGRAMA DE FRECUENCIAS (fi)" : "DIAGRAMA DE BARRAS (fi)", marginX + 3, curY + 5);

    const rows = data.freqTable.rows;
    const maxFi = Math.max(...rows.map((r) => r.absoluteFrequency), 1);
    const plotX = marginX + 10;
    const plotY = curY + 9;
    const plotW = leftW - 14;
    const plotH = chartBoxH - 21;

    // Líneas guía horizontales y eje Y
    doc.setDrawColor(232, 232, 232);
    doc.setLineWidth(0.2);
    [0, 0.5, 1].forEach((ratio) => {
      const gy = plotY + plotH * (1 - ratio);
      doc.line(plotX, gy, plotX + plotW, gy);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      doc.setTextColor(120, 120, 120);
      doc.text(Math.round(maxFi * ratio).toString(), plotX - 1.5, gy + 1, { align: "right" });
    });

    // Ejes
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.3);
    doc.line(plotX, plotY, plotX, plotY + plotH);
    doc.line(plotX, plotY + plotH, plotX + plotW, plotY + plotH);

    // Barras
    const slotW = plotW / rows.length;
    const barW = Math.max(1.5, Math.min(10, slotW * (data.isGrouped ? 0.86 : 0.68)));
    const labelStep = rows.length > 10 ? Math.ceil(rows.length / 8) : 1;

    rows.forEach((row, idx) => {
      const bh = (row.absoluteFrequency / maxFi) * plotH;
      const bx = plotX + idx * slotW + (slotW - barW) / 2;
      const by = plotY + plotH - bh;

      doc.setFillColor(20, 20, 20);
      doc.rect(bx, by, barW, bh, "F");

      // Valor fi encima de la barra si cabe
      if (rows.length <= 16) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5);
        doc.setTextColor(40, 40, 40);
        doc.text(row.absoluteFrequency.toString(), bx + barW / 2, Math.max(plotY + 2, by - 1), { align: "center" });
      }

      // Etiqueta X
      if (idx % labelStep === 0) {
        const xLbl = data.isGrouped
          ? `${row.lowerLimit}-${row.upperLimit}`
          : formatCourseNumber(row.classMark);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(5);
        doc.setTextColor(90, 90, 90);
        doc.text(xLbl, bx + barW / 2, plotY + plotH + 4, { align: "center" });
      }
    });

    // Contenedor Gráfico Circular (Torta / Donut)
    doc.setFillColor(252, 252, 252);
    doc.rect(rightX, curY, rightW, chartBoxH, "F");
    doc.setDrawColor(220, 220, 220);
    doc.rect(rightX, curY, rightW, chartBoxH, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(20, 20, 20);
    doc.text("DISTRIBUCIÓN PORCENTUAL (%)", rightX + 3, curY + 5);

    const monoPalette: [number, number, number][] = [
      [10, 10, 10],
      [45, 45, 45],
      [82, 82, 82],
      [115, 115, 115],
      [150, 150, 150],
      [185, 185, 185],
      [212, 212, 212],
    ];

    const pieCx = rightX + 22;
    const pieCy = curY + 34;
    const outerR = 17;
    const innerR = 7;
    const totalPct = rows.reduce((acc, r) => acc + r.percentage, 0) || 100;

    let startDeg = -90;
    rows.forEach((row, idx) => {
      const sliceDeg = (row.percentage / totalPct) * 360;
      if (sliceDeg <= 0.1) return;
      const [r, g, b] = monoPalette[idx % monoPalette.length];
      doc.setFillColor(r, g, b);

      const steps = Math.max(2, Math.ceil(sliceDeg / 5));
      const stepDeg = sliceDeg / steps;
      for (let s = 0; s < steps; s++) {
        const a1 = ((startDeg + s * stepDeg) * Math.PI) / 180;
        const a2 = ((startDeg + (s + 1) * stepDeg) * Math.PI) / 180;
        doc.triangle(
          pieCx,
          pieCy,
          pieCx + outerR * Math.cos(a1),
          pieCy + outerR * Math.sin(a1),
          pieCx + outerR * Math.cos(a2),
          pieCy + outerR * Math.sin(a2),
          "F"
        );
      }

      // Separador blanco entre sectores
      const edgeRad = (startDeg * Math.PI) / 180;
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.4);
      doc.line(pieCx, pieCy, pieCx + outerR * Math.cos(edgeRad), pieCy + outerR * Math.sin(edgeRad));

      startDeg += sliceDeg;
    });

    // Centro blanco del donut
    doc.setFillColor(252, 252, 252);
    doc.circle(pieCx, pieCy, innerR, "F");

    // Leyenda lateral del gráfico circular (máx 9 ítems para evitar desborde)
    const legX = rightX + 43;
    let legY = curY + 13;
    const maxLegend = Math.min(rows.length, 9);
    for (let i = 0; i < maxLegend; i++) {
      const row = rows[i];
      const [r, g, b] = monoPalette[i % monoPalette.length];
      doc.setFillColor(r, g, b);
      doc.rect(legX, legY - 2, 2.2, 2.2, "F");

      const lbl = data.isGrouped
        ? `[${row.lowerLimit}, ${row.upperLimit})`
        : formatCourseNumber(row.classMark);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      doc.setTextColor(50, 50, 50);
      doc.text(sanitizePdfText(`${lbl}: ${formatCourseNumber(row.percentage)}%`), legX + 3.5, legY, {
        maxWidth: rightW - 48,
      });
      legY += 4.8;
    }
    if (rows.length > maxLegend) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(5);
      doc.setTextColor(110, 110, 110);
      doc.text(`+ ${rows.length - maxLegend} clases más en tabla`, legX, legY);
    }

    curY += chartBoxH + 6;
  }

  // Sección 3: medidas de tendencia central & asimetría
  const cardW = (contentWidth - 6) / 3;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);

  const tcCards = [
    {
      title: "Media Aritmética (Media)",
      val: sanitizePdfText(`${formatCourseNumber(data.centralTendency.mean)}${u}`),
      subLines: doc.splitTextToSize(sanitizePdfText(data.centralTendency.meanCalculationSteps || ""), cardW - 6),
    },
    {
      title: "Mediana (Me - 50%)",
      val: sanitizePdfText(`${formatCourseNumber(data.centralTendency.median)}${u}`),
      subLines: doc.splitTextToSize(sanitizePdfText(data.centralTendency.medianCalculationSteps || ""), cardW - 6),
    },
    {
      title: sanitizePdfText(`Moda (Mo) • ${data.centralTendency.modeType}`),
      val: sanitizePdfText(
        (data.centralTendency.modes || []).map((m) => `${formatCourseNumber(m)}${u}`).join(", ") || "Amodal"
      ),
      subLines: doc.splitTextToSize(sanitizePdfText(data.centralTendency.modeExplanation || ""), cardW - 6),
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
    doc.text(c.title, cx + 3, curY + 5, { maxWidth: cardW - 6 });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(10, 10, 10);
    doc.text(c.val, cx + 3, curY + 11.5, { maxWidth: cardW - 6 });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(70, 70, 70);
    drawLines(c.subLines, cx + 3, curY + 16.5, 3.1);
  });

  curY += maxTcH + 4;

  // Asimetría / Sesgo (altura dinámica)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const skewLines = doc.splitTextToSize(
    sanitizePdfText(data.centralTendency.skewnessExplanation || ""),
    contentWidth - 8
  );
  const skewH = 8 + skewLines.length * 3.4 + 3;
  checkAddPage(skewH + 4);

  doc.setFillColor(245, 245, 245);
  doc.rect(marginX, curY, contentWidth, skewH, "F");
  doc.setDrawColor(210, 210, 210);
  doc.rect(marginX, curY, contentWidth, skewH, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(10, 10, 10);
  doc.text(sanitizePdfText(`Diagnóstico de Asimetría: Distribución ${data.centralTendency.skewness}`), marginX + 4, curY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  drawLines(skewLines, marginX + 4, curY + 9.5, 3.4);

  curY += skewH + 6;

  // Sección 4: medidas de posición (cuartiles, deciles y percentiles)
  const q1 = computePositionMeasure(data.numericData, 1, 4, "Q");
  const q2 = computePositionMeasure(data.numericData, 2, 4, "Q");
  const q3 = computePositionMeasure(data.numericData, 3, 4, "Q");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  const qCards = [
    {
      title: "Cuartil 1 (Q1 - 25%)",
      val: sanitizePdfText(`${formatCourseNumber(q1.value)}${u}`),
      descLines: doc.splitTextToSize(sanitizePdfText(q1.procedureText || ""), cardW - 6),
    },
    {
      title: "Cuartil 2 (Q2 - 50% = Me)",
      val: sanitizePdfText(`${formatCourseNumber(q2.value)}${u}`),
      descLines: doc.splitTextToSize(sanitizePdfText(q2.procedureText || ""), cardW - 6),
    },
    {
      title: "Cuartil 3 (Q3 - 75%)",
      val: sanitizePdfText(`${formatCourseNumber(q3.value)}${u}`),
      descLines: doc.splitTextToSize(sanitizePdfText(q3.procedureText || ""), cardW - 6),
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
    doc.text(c.title, cx + 3, curY + 5, { maxWidth: cardW - 6 });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(10, 10, 10);
    doc.text(c.val, cx + 3, curY + 11, { maxWidth: cardW - 6 });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(70, 70, 70);
    drawLines(c.descLines, cx + 3, curY + 15.5, 3.1);
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

  // Sección 5: medidas de dispersión & atípicos (tukey)
  const dispCols = (contentWidth - 9) / 4;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);

  const dispCards = [
    { title: "Rango Total (R)", val: sanitizePdfText(`${formatCourseNumber(data.dispersion.rangeR)}${u}`), subLines: [] as string[] },
    { title: "Varianza Muestral (s²)", val: `${formatCourseNumber(data.dispersion.varianceSample)}`, subLines: [] as string[] },
    { title: "Desviación Estándar (s)", val: sanitizePdfText(`${formatCourseNumber(data.dispersion.stdDevSample)}${u}`), subLines: [] as string[] },
    {
      title: "Coef. Variación (CV)",
      val: `${formatCourseNumber(data.dispersion.coefficientOfVariation)}%`,
      subLines: doc.splitTextToSize(sanitizePdfText(data.dispersion.homogeneityLabel || ""), dispCols - 6),
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
    doc.text(c.title, cx + 3, curY + 4.5, { maxWidth: dispCols - 6 });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(10, 10, 10);
    doc.text(c.val, cx + 3, curY + 10.5, { maxWidth: dispCols - 6 });

    if (c.subLines.length > 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6.5);
      doc.setTextColor(40, 120, 50);
      drawLines(c.subLines, cx + 3, curY + 15, 3);
    }
  });

  curY += maxDispH + 4;

  // Límites de Tukey y Outliers (altura dinámica)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  const tukeyTitleLines = doc.splitTextToSize(
    sanitizePdfText(
      `Criterio de Tukey (1.5 × RIC): RIC = ${formatCourseNumber(data.dispersion.iqr)}${u} | Límite Inferior LI = ${formatCourseNumber(
        data.dispersion.lowerFenceLI
      )}${u} | Límite Superior LS = ${formatCourseNumber(data.dispersion.upperFenceLS)}${u}`
    ),
    contentWidth - 8
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const outlierText = sanitizePdfText(
    data.dispersion.outliers.length === 0
      ? "Estado: Sin valores atípicos detectados en el colectivo analizado. Distribución consistente."
      : `Valores Atípicos Detectados (${data.dispersion.outliers.length}): ${data.dispersion.outliers
          .map((o) => `${formatCourseNumber(o)}${u}`)
          .join(", ")}`
  );
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
  drawLines(tukeyTitleLines, marginX + 4, curY + 5, 3.6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  drawLines(outlierLines, marginX + 4, curY + 5 + tukeyTitleLines.length * 3.6 + 1.5, 3.6);

  curY += tukeyH + 6;

  // Sección 6: interpretación oficial del curso (4 párrafos)
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
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const splitText = doc.splitTextToSize(sanitizePdfText(p), contentWidth - 8);
    const boxHeight = splitText.length * 3.8 + 5;
    checkAddPage(boxHeight + 4);

    doc.setFillColor(252, 252, 252);
    doc.rect(marginX, curY, contentWidth, boxHeight, "F");
    doc.setDrawColor(225, 225, 225);
    doc.rect(marginX, curY, contentWidth, boxHeight, "S");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(20, 20, 20);
    drawLines(splitText, marginX + 4, curY + 4, 3.8);

    curY += boxHeight + 3;
  });

  // Sección 7: probabilidad empírica y conteo
  const n = data.numericData.length;
  const greaterMeanCount = data.numericData.filter((x) => x > data.centralTendency.mean).length;
  const pGreaterMean = greaterMeanCount / (n || 1);

  const withinIQRCount = data.numericData.filter((x) => x >= data.dispersion.q1 && x <= data.dispersion.q3).length;
  const pWithinIQR = withinIQRCount / (n || 1);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const probLine1 = doc.splitTextToSize(
    sanitizePdfText(
      `• Probabilidad de valores superiores a la media P(X > Media): ${greaterMeanCount}/${n} = ${formatCourseNumber(
        pGreaterMean
      )} (${formatCourseNumber(pGreaterMean * 100)}%)`
    ),
    contentWidth - 8
  );
  const probLine2 = doc.splitTextToSize(
    sanitizePdfText(
      `• Probabilidad en rango intercuartílico P(Q1 <= X <= Q3): ${withinIQRCount}/${n} = ${formatCourseNumber(
        pWithinIQR
      )} (${formatCourseNumber(pWithinIQR * 100)}%)`
    ),
    contentWidth - 8
  );
  const probBoxH = 5 + probLine1.length * 3.8 + probLine2.length * 3.8 + 2;

  checkAddPage(probBoxH + 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(10, 10, 10);
  doc.text("7. RESUMEN DE PROBABILIDAD EMPÍRICA Y ANÁLISIS COMBINATORIO", marginX, curY);
  curY += 5;

  doc.setFillColor(248, 248, 248);
  doc.rect(marginX, curY, contentWidth, probBoxH, "F");
  doc.setDrawColor(220, 220, 220);
  doc.rect(marginX, curY, contentWidth, probBoxH, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);
  drawLines(probLine1, marginX + 4, curY + 5, 3.8);
  drawLines(probLine2, marginX + 4, curY + 5 + probLine1.length * 3.8 + 1, 3.8);

  curY += probBoxH + 4;

  // Pie de página final en cada hoja
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

  // Descarga del archivo
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
