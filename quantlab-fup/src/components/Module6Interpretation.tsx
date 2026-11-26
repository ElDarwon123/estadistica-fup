import React, { useState } from "react";
import { Copy, Check, FileText, FileDown } from "lucide-react";

interface Module6InterpretationProps {
  paragraphs: {
    paragraph1: string;
    paragraph2: string;
    paragraph3: string;
    paragraph4: string;
  };
  varName: string;
  onOpenExport?: () => void;
}

export default function Module6Interpretation({
  paragraphs,
  varName,
  onOpenExport,
}: Module6InterpretationProps) {
  const [copied, setCopied] = useState(false);

  const fullReportText = [
    `INFORME DE INTERPRETACIÓN ESTADÍSTICA: VARIABLE "${varName.toUpperCase()}"`,
    "================================================================================",
    paragraphs.paragraph1,
    "",
    paragraphs.paragraph2,
    "",
    paragraphs.paragraph3,
    "",
    paragraphs.paragraph4,
  ].join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(fullReportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-cards bg-paper border border-hairline shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-hairline gap-3">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-ink" />
            <div>
              <h4 className="text-sm font-semibold tracking-tight text-ink uppercase">
                Redactor de Interpretación Oficial (4 Párrafos Estructurados)
              </h4>
              <p className="text-xs text-mid-gray">
                Síntesis analítica redactada automáticamente conforme a las directrices metodológicas del curso FUP.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenExport && (
              <button
                onClick={onOpenExport}
                className="flex-1 sm:flex-initial min-h-[38px] px-4 py-2 rounded-buttons bg-ink hover:bg-ink-soft text-paper text-xs font-semibold tracking-tight flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                title="Abrir opciones de descarga del reporte completo (PDF, Markdown, CSV)"
              >
                <FileDown className="w-3.5 h-3.5 text-paper" />
                <span>Descargar Reporte Completo</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial min-h-[38px] px-3.5 py-2 rounded-buttons bg-surface-alt hover:bg-neutral-200 border border-hairline text-ink text-xs font-medium tracking-tight flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-ink" /> : <Copy className="w-3.5 h-3.5 text-mid-gray" />}
              <span>{copied ? "Copiado" : "Copiar Texto"}</span>
            </button>
          </div>
        </div>

        {/* 4 Párrafos Clínicos Estructurados */}
        <div className="space-y-4 text-xs sm:text-sm text-ink leading-relaxed">
          {/* Párrafo 1 */}
          <div className="p-5 rounded-nested bg-surface-alt border border-hairline space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-mid-gray block">
              Párrafo 1 • Tendencia Central y Comportamiento Típico
            </span>
            <p className="text-justify font-sans">{paragraphs.paragraph1}</p>
          </div>

          {/* Párrafo 2 */}
          <div className="p-5 rounded-nested bg-surface-alt border border-hairline space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-mid-gray block">
              Párrafo 2 • Dispersión y Homogeneidad de los Datos
            </span>
            <p className="text-justify font-sans">{paragraphs.paragraph2}</p>
          </div>

          {/* Párrafo 3 */}
          <div className="p-5 rounded-nested bg-surface-alt border border-hairline space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-mid-gray block">
              Párrafo 3 • Cortes de Distribución Acumulada
            </span>
            <p className="text-justify font-sans">{paragraphs.paragraph3}</p>
          </div>

          {/* Párrafo 4 */}
          <div className="p-5 rounded-nested bg-surface-alt border border-hairline space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-mid-gray block">
              Párrafo 4 • Diagnóstico de Valores Atípicos (Criterio de Tukey)
            </span>
            <p className="text-justify font-sans">{paragraphs.paragraph4}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
