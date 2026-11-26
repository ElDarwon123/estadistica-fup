import React, { useState, useMemo } from "react";
import { PRELOADED_DATASETS, type DatasetMeta } from "../data/defaultDatasets";
import {
  computeFrequencyTable,
  computeCentralTendency,
  computePositionMeasure,
  computeDispersion,
  generateCourseInterpretation,
} from "../lib/statisticsEngine";
import Module1Ingestion from "./Module1Ingestion";
import Module2Frequencies from "./Module2Frequencies";
import Module3CentralTendency from "./Module3CentralTendency";
import Module4PositionMeasures from "./Module4PositionMeasures";
import Module5Dispersion from "./Module5Dispersion";
import Module6Interpretation from "./Module6Interpretation";
import Module7ProbabilityCounting from "./Module7ProbabilityCounting";
import FullReportDocument from "./FullReportDocument";
import ReportExportModal from "./ReportExportModal";
import type { ReportExportData } from "../lib/reportExportEngine";
import {
  Database,
  Table,
  Target,
  Compass,
  Activity,
  FileText,
  Sparkles,
  FileDown,
  Printer,
  SlidersHorizontal,
  Layers,
} from "lucide-react";

export default function QuantLabDashboard() {
  // Estado del Dataset Activo
  const [currentDataset, setCurrentDataset] = useState<DatasetMeta>(PRELOADED_DATASETS[0]);
  const [selectedColumn, setSelectedColumn] = useState<string>(PRELOADED_DATASETS[0].defaultVariable);
  const [unitOfMeasure, setUnitOfMeasure] = useState<string>(PRELOADED_DATASETS[0].defaultUnit);

  // Módulo activo con soporte para query param (?tab=2, ?tab=3, etc.)
  const [activeTab, setActiveTab] = useState<number>(1);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        const tabNum = parseInt(tabParam, 10);
        if (!isNaN(tabNum) && tabNum >= 1 && tabNum <= 7) {
          setActiveTab(tabNum);
        }
      }
    }
  }, []);

  const handleTabChange = (newTab: number) => {
    setActiveTab(newTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", newTab.toString());
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Columnas numéricas del dataset
  const numericColumns = useMemo(() => {
    if (!currentDataset || currentDataset.data.length === 0) return [];
    const firstRow = currentDataset.data[0];
    return Object.keys(firstRow).filter((key) => {
      return currentDataset.data.some((r) => typeof r[key] === "number" && !isNaN(r[key]));
    });
  }, [currentDataset]);

  // Vector de datos numéricos limpios para la columna seleccionada
  const numericData = useMemo(() => {
    if (!currentDataset) return [];
    return currentDataset.data
      .map((row) => row[selectedColumn])
      .filter((v): v is number => typeof v === "number" && !isNaN(v) && isFinite(v));
  }, [currentDataset, selectedColumn]);

  const totalN = numericData.length;

  // Clasificación de la variable: Discreta vs Continua
  const { variableType, variableJustification } = useMemo(() => {
    if (numericData.length === 0) {
      return { variableType: "Discreta" as const, variableJustification: "Sin observaciones numéricas." };
    }
    const hasDecimals = numericData.some((val) => !Number.isInteger(val));
    if (hasDecimals) {
      return {
        variableType: "Continua" as const,
        variableJustification:
          "La variable admite valores fraccionarios o decimales continuos dentro de un intervalo real continuo.",
      };
    } else {
      return {
        variableType: "Discreta" as const,
        variableJustification:
          "La variable toma exclusivamente valores enteros procedentes de un proceso de conteo o enumeración discreta.",
      };
    }
  }, [numericData]);

  // Criterio de agrupación del curso (N < 40 no agrupados, N >= 40 agrupados)
  const defaultIsGrouped = totalN >= 40;
  const [isGrouped, setIsGrouped] = useState<boolean>(defaultIsGrouped);
  const [customK, setCustomK] = useState<number>(() => Math.max(3, Math.round(1 + 3.322 * Math.log10(totalN || 1))));
  const [customA, setCustomA] = useState<number>(1);

  // Inferencia automática de unidad de medida según el nombre de la variable
  const inferUnitForVariable = (colName: string, fallback = ""): string => {
    const key = colName.toLowerCase();
    if (/(salario|sueldo|ingreso|precio|costo|venta|monto|usd)/.test(key)) return "USD";
    if (/(hora|horas|tiempo|duracion)/.test(key)) return "horas";
    if (/(minuto|minutos)/.test(key)) return "min";
    if (/(segundo|segundos)/.test(key)) return "seg";
    if (/(antiguedad|anos|años|edad)/.test(key)) return "años";
    if (/(materia|materias)/.test(key)) return "materias";
    if (/(promedio|nota|calificacion|puntuacion|desempeno|puntaje)/.test(key)) return "puntos";
    if (/(peso|masa|kg)/.test(key)) return "kg";
    if (/(altura|estatura|cm)/.test(key)) return "cm";
    if (/(porcentaje|tasa|pct)/.test(key)) return "%";
    if (key === "id") return "unidades";
    return fallback;
  };

  // Cuando cambia el dataset, sincronizar parámetros
  const handleSelectDataset = (ds: DatasetMeta) => {
    setCurrentDataset(ds);
    setSelectedColumn(ds.defaultVariable);
    setUnitOfMeasure(ds.defaultUnit || inferUnitForVariable(ds.defaultVariable));
    const n = ds.data.length;
    const grouped = n >= 40;
    setIsGrouped(grouped);
    setCustomK(Math.max(3, Math.round(1 + 3.322 * Math.log10(n || 1))));
  };

  // Cuando cambia la variable analizada, actualizar automáticamente la unidad coherente
  const handleSelectColumn = (col: string) => {
    setSelectedColumn(col);
    setUnitOfMeasure(
      col === currentDataset.defaultVariable
        ? currentDataset.defaultUnit
        : inferUnitForVariable(col, "")
    );
  };

  // Motor Matemático del Curso
  const freqTable = useMemo(() => {
    return computeFrequencyTable(numericData, isGrouped, customK, customA);
  }, [numericData, isGrouped, customK, customA]);

  const centralTendency = useMemo(() => {
    return computeCentralTendency(numericData, freqTable);
  }, [numericData, freqTable]);

  const dispersion = useMemo(() => {
    return computeDispersion(numericData, centralTendency.mean);
  }, [numericData, centralTendency.mean]);

  const p10 = useMemo(() => computePositionMeasure(numericData, 1, 10, "D").value, [numericData]);
  const p90 = useMemo(() => computePositionMeasure(numericData, 9, 10, "D").value, [numericData]);

  const courseInterpretation = useMemo(() => {
    return generateCourseInterpretation(
      selectedColumn,
      unitOfMeasure,
      centralTendency,
      dispersion,
      freqTable,
      p10,
      p90
    );
  }, [selectedColumn, unitOfMeasure, centralTendency, dispersion, freqTable, p10, p90]);

  // Datos estructurados del reporte para exportación integral
  const reportData: ReportExportData = useMemo(() => {
    return {
      dataset: currentDataset,
      variableName: selectedColumn,
      unit: unitOfMeasure,
      variableType,
      variableJustification,
      isGrouped,
      numericData,
      freqTable,
      centralTendency,
      dispersion,
      interpretation: courseInterpretation,
    };
  }, [
    currentDataset,
    selectedColumn,
    unitOfMeasure,
    variableType,
    variableJustification,
    isGrouped,
    numericData,
    freqTable,
    centralTendency,
    dispersion,
    courseInterpretation,
  ]);

  const navItems = [
    { id: 1, label: "01 Ingesta & Variables", icon: Database },
    { id: 2, label: "02 Frecuencias & Gráficos", icon: Table },
    { id: 3, label: "03 Tendencia Central", icon: Target },
    { id: 4, label: "04 Medidas de Posición", icon: Compass },
    { id: 5, label: "05 Dispersión & Atípicos", icon: Activity },
    { id: 6, label: "06 Interpretación Oficial", icon: FileText },
    { id: 7, label: "07 Probabilidad & Conteo", icon: Sparkles },
  ];

  return (
    <>
      {/* ============================================================== */}
      {/* 1. APLICACIÓN INTERACTIVA EN PANTALLA (OCULTA AL IMPRIMIR)    */}
      {/* ============================================================== */}
      <div className="min-h-[100dvh] flex flex-col bg-canvas text-ink font-geist selection:bg-ink selection:text-paper print:hidden">
        {/* HEADER INSTITUCIONAL */}
        <header className="bg-paper/95 backdrop-blur-md border-b border-hairline sticky top-0 z-30 shadow-subtle">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-inputs bg-ink text-paper flex items-center justify-center font-mono font-bold text-sm tracking-tighter">
                QL
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold tracking-tighter text-ink uppercase">
                    QuantLab FUP
                  </h1>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-badges font-mono text-mid-gray bg-surface-alt border border-hairline">
                    v2.4 • Clinical Blueprint
                  </span>
                </div>
                <p className="text-[12px] text-mid-gray hidden sm:block font-normal">
                  Laboratorio Cuantitativo de Estadística Descriptiva & Cálculo Probabilístico
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Status indicator pill */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-badges bg-surface-alt border border-hairline text-xs font-mono text-mid-gray">
                <span className="w-1.5 h-1.5 rounded-full bg-ink animate-pulse" />
                <span className="text-ink font-medium truncate max-w-[140px]">
                  {currentDataset.name}
                </span>
                <span className="text-mid-gray font-normal">| N = {totalN}</span>
              </div>

              {/* Botón principal de Descarga de Reporte Completo */}
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="min-h-[38px] px-4 py-2 rounded-buttons bg-ink hover:bg-ink-soft text-paper font-semibold text-xs tracking-tight shadow-sm transition-all active:scale-95 flex items-center gap-2"
                title="Descargar o imprimir informe completo del estudio"
              >
                <FileDown className="w-4 h-4 text-paper" />
                <span className="hidden sm:inline font-medium">Descargar Reporte Completo</span>
                <span className="sm:hidden font-medium">Reporte</span>
              </button>
            </div>
          </div>
        </header>

        {/* BARRA DE NAVEGACIÓN MONOCROMÁTICA */}
        <nav className="bg-paper border-b border-hairline sticky top-16 z-20 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1.5 min-w-max py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-buttons text-xs font-medium tracking-tight flex items-center gap-2 transition-all active:scale-95 ${
                    isActive
                      ? "bg-ink text-paper shadow-sm"
                      : "text-mid-gray hover:text-ink hover:bg-surface-alt"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-paper" : "text-mid-gray"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* CONTENEDOR PRINCIPAL */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
          {/* Banner de Contexto de Estudio Clínico */}
          <div className="p-4 sm:p-5 rounded-cards bg-paper border border-hairline shadow-subtle flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-mid-gray">
                Variable Analizada:
              </span>
              <span className="text-sm font-semibold tracking-tight text-ink font-mono">
                "{selectedColumn}"
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-badges bg-surface-alt text-ink border border-hairline font-mono">
                Cuantitativa {variableType}
              </span>
              <span className="text-[11px] text-mid-gray font-mono">
                Unidad: [{unitOfMeasure || "adimensional"}]
              </span>
            </div>

            <div className="text-[11px] font-mono text-mid-gray flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-ink" />
              <span>Criterio Metodológico:</span>
              <strong className="text-ink font-semibold">
                {freqTable.isGrouped ? "Datos Agrupados (Sturges)" : "Datos No Agrupados"}
              </strong>
            </div>
          </div>

          {/* CONTENIDO DEL MÓDULO ACTIVO */}
          {activeTab === 1 && (
            <Module1Ingestion
              currentDataset={currentDataset}
              onSelectDataset={handleSelectDataset}
              selectedColumn={selectedColumn}
              onSelectColumn={handleSelectColumn}
              unitOfMeasure={unitOfMeasure}
              onChangeUnit={setUnitOfMeasure}
              variableType={variableType}
              variableJustification={variableJustification}
              numericColumns={numericColumns}
              totalRows={totalN}
            />
          )}

          {activeTab === 2 && (
            <Module2Frequencies
              freqTable={freqTable}
              isGrouped={isGrouped}
              onToggleGrouped={setIsGrouped}
              customK={customK}
              onChangeK={setCustomK}
              customA={customA}
              onChangeA={setCustomA}
              unit={unitOfMeasure}
            />
          )}

          {activeTab === 3 && (
            <Module3CentralTendency ct={centralTendency} unit={unitOfMeasure} />
          )}

          {activeTab === 4 && (
            <Module4PositionMeasures data={numericData} unit={unitOfMeasure} />
          )}

          {activeTab === 5 && (
            <Module5Dispersion disp={dispersion} mean={centralTendency.mean} unit={unitOfMeasure} />
          )}

          {activeTab === 6 && (
            <Module6Interpretation
              paragraphs={courseInterpretation}
              varName={selectedColumn}
              onOpenExport={() => setIsExportModalOpen(true)}
            />
          )}

          {activeTab === 7 && (
            <Module7ProbabilityCounting
              rawData={currentDataset.data}
              numericColumns={numericColumns}
              totalN={totalN}
            />
          )}
        </main>

        {/* FOOTER CIENTÍFICO */}
        <footer className="mt-auto border-t border-hairline bg-paper py-5 px-6 text-center text-xs text-mid-gray">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[11px]">
            <p>
              QUANTLAB FUP • Motor de Estadística Descriptiva e Inferencia Cuantitativa • Fundación Universitaria de Popayán
            </p>
            <p className="text-mid-gray">
              Regla de Sturges | Interpolación Continua | Regla de Tukey 1.5×RIC | Combinatoria BigInt
            </p>
          </div>
        </footer>
      </div>

      {/* ============================================================== */}
      {/* 2. DOCUMENTO DE REPORTE COMPLETO (SOLO VISIBLE EN IMPRESIÓN/PDF)*/}
      {/* ============================================================== */}
      <FullReportDocument
        dataset={currentDataset}
        variableName={selectedColumn}
        unit={unitOfMeasure}
        variableType={variableType}
        variableJustification={variableJustification}
        isGrouped={isGrouped}
        numericData={numericData}
        freqTable={freqTable}
        centralTendency={centralTendency}
        dispersion={dispersion}
        interpretation={courseInterpretation}
      />

      {/* ============================================================== */}
      {/* 3. MODAL INTERACTIVO DE DESCARGA Y EXPORTACIÓN INTEGRAL       */}
      {/* ============================================================== */}
      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportData={reportData}
      />
    </>
  );
}
