import React from "react";
import {
  FileDown,
  Printer,
  FileText,
  FileSpreadsheet,
  X,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  exportReportToPDF,
  exportReportToMarkdown,
  exportFrequencyTableToCSV,
  type ReportExportData,
} from "../lib/reportExportEngine";

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: ReportExportData;
}

export default function ReportExportModal({
  isOpen,
  onClose,
  reportData,
}: ReportExportModalProps) {
  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    exportReportToPDF(reportData);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    exportReportToMarkdown(reportData);
  };

  const handleDownloadCSV = () => {
    exportFrequencyTableToCSV(reportData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-paper border border-hairline rounded-cards shadow-2xl max-w-xl w-full p-6 space-y-5 text-ink relative">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-mid-gray hover:text-ink rounded-full hover:bg-surface-alt transition-colors"
          title="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado del modal */}
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-inputs bg-ink text-paper">
              <FileDown className="w-4 h-4" />
            </span>
            <h3 className="text-base font-semibold tracking-tight uppercase">
              Exportar Informe Integral de Analítica
            </h3>
          </div>
          <p className="text-xs text-mid-gray">
            Descarga el reporte académico completo que integra automáticamente todos los temas y criterios del curso.
          </p>
        </div>

        {/* Ficha resumen del reporte a generar */}
        <div className="p-3.5 rounded-inputs bg-surface-alt border border-hairline space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-mid-gray font-mono uppercase text-[10px]">Base de Datos:</span>
            <span className="font-semibold text-ink">{reportData.dataset.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-mid-gray font-mono uppercase text-[10px]">Variable Analizada:</span>
            <span className="font-mono font-semibold text-ink">
              "{reportData.variableName}" [{reportData.unit || "Adimensional"}]
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-mid-gray font-mono uppercase text-[10px]">Tipo & Agrupación:</span>
            <span className="text-ink">
              Cuantitativa {reportData.variableType} • {reportData.isGrouped ? "Agrupados (Sturges)" : "No Agrupados"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-mid-gray font-mono uppercase text-[10px]">Muestra Evaluada:</span>
            <span className="font-mono text-ink">N = {reportData.numericData.length} observaciones</span>
          </div>
        </div>

        {/* Módulos incluidos en el reporte */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono uppercase text-mid-gray tracking-wider block">
            Contenido Completo Incluido en el Documento:
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-mid-gray">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-ink" />
              <span>01. Ficha Técnica y Metadatos</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-ink" />
              <span>02. Tabla Frecuencias & Verificación</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-ink" />
              <span>03. Tendencia Central & Asimetría</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-ink" />
              <span>04. Cuartiles, Deciles & Percentiles</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-ink" />
              <span>05. Dispersión & Atípicos (Tukey)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-ink" />
              <span>06. Síntesis Oficial (4 Párrafos)</span>
            </span>
          </div>
        </div>

        {/* Opciones de descarga */}
        <div className="space-y-2 pt-2 border-t border-hairline">
          {/* Opción 1: Descargar PDF Oficial Vectorial */}
          <button
            onClick={handleDownloadPDF}
            className="w-full p-3 rounded-buttons bg-ink hover:bg-ink-soft text-paper text-xs font-semibold tracking-tight shadow flex items-center justify-between transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <FileDown className="w-4 h-4 text-paper" />
              <div className="text-left">
                <span className="block font-bold">Descargar Reporte en PDF Oficial (.pdf)</span>
                <span className="text-[10px] text-neutral-300 font-normal">
                  Documento vectorizado de alta fidelidad con encabezados, tablas y formatos reglamentarios
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/20">
              Recomendado
            </span>
          </button>

          {/* Opción 2: Imprimir / Guardar como PDF del Navegador */}
          <button
            onClick={handlePrint}
            className="w-full p-2.5 rounded-buttons bg-surface-alt hover:bg-neutral-200 border border-hairline text-xs font-medium tracking-tight flex items-center justify-between transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <Printer className="w-4 h-4 text-ink" />
              <div className="text-left">
                <span className="block text-ink font-semibold">Imprimir / Guardar como PDF (Navegador)</span>
                <span className="text-[10px] text-mid-gray">
                  Abre el diálogo de impresión con la vista de impresión optimizada @media print
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-mid-gray">Ctrl + P</span>
          </button>

          {/* Opciones secundarias: Markdown y CSV */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleDownloadMarkdown}
              className="p-2.5 rounded-buttons bg-surface-alt hover:bg-neutral-200 border border-hairline text-xs font-medium text-ink flex items-center justify-center gap-2 transition-all active:scale-95"
              title="Descargar texto estructurado en Markdown"
            >
              <FileText className="w-3.5 h-3.5 text-mid-gray" />
              <span>Reporte Markdown (.md)</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="p-2.5 rounded-buttons bg-surface-alt hover:bg-neutral-200 border border-hairline text-xs font-medium text-ink flex items-center justify-center gap-2 transition-all active:scale-95"
              title="Descargar tabla de frecuencias en formato CSV / Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-mid-gray" />
              <span>Tabla en CSV (.csv)</span>
            </button>
          </div>
        </div>

        {/* Footer informativo */}
        <div className="flex items-center gap-2 text-[10px] text-mid-gray pt-1 border-t border-hairline">
          <ShieldCheck className="w-3.5 h-3.5 text-ink shrink-0" />
          <span>
            Los cálculos son generados por el motor de inferencia matemática respetando las reglas estrictas del curso FUP.
          </span>
        </div>
      </div>
    </div>
  );
}
