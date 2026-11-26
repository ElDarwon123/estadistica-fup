import React, { useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { PRELOADED_DATASETS, type DatasetMeta } from "../data/defaultDatasets";
import { UploadCloud, FileSpreadsheet, CheckCircle2, Info, Database } from "lucide-react";

interface Module1IngestionProps {
  currentDataset: DatasetMeta | null;
  onSelectDataset: (dataset: DatasetMeta) => void;
  selectedColumn: string;
  onSelectColumn: (col: string) => void;
  unitOfMeasure: string;
  onChangeUnit: (unit: string) => void;
  variableType: "Discreta" | "Continua";
  variableJustification: string;
  numericColumns: string[];
  totalRows: number;
}

export default function Module1Ingestion({
  currentDataset,
  onSelectDataset,
  selectedColumn,
  onSelectColumn,
  unitOfMeasure,
  onChangeUnit,
  variableType,
  variableJustification,
  numericColumns,
  totalRows,
}: Module1IngestionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Procesamiento de archivos locales CSV y XLSX
  const handleFileUpload = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          processParsedData(file.name, results.data as Record<string, any>[]);
        },
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
        processParsedData(file.name, json);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const processParsedData = (filename: string, rawData: Record<string, any>[]) => {
    if (!rawData || rawData.length === 0) return;

    // Detectar columnas que tengan al menos 1 valor numérico
    const keys = Object.keys(rawData[0]);
    const detectedNumeric: string[] = [];

    keys.forEach((k) => {
      const hasNumber = rawData.some((row) => typeof row[k] === "number" && !isNaN(row[k]));
      if (hasNumber) detectedNumeric.push(k);
    });

    const firstCol = detectedNumeric.length > 0 ? detectedNumeric[0] : keys[0];
    const n = rawData.length;

    const newDataset: DatasetMeta = {
      id: `uploaded-${Date.now()}`,
      name: filename,
      description: `Archivo cargado por el usuario con ${n} registros y ${detectedNumeric.length} variables numéricas detectadas.`,
      n,
      expectedGrouping: n >= 40 ? "Agrupados (N ≥ 40, Sturges)" : "No Agrupados (N < 40)",
      defaultVariable: firstCol,
      defaultUnit: "unidades",
      data: rawData,
    };

    onSelectDataset(newDataset);
  };

  return (
    <div className="space-y-6">
      {/* 1. Selector de Datasets Precargados */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-ink" />
          <h3 className="text-sm font-semibold tracking-tight text-ink uppercase">
            01. Bases de Datos de Muestra Metodológica
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRELOADED_DATASETS.map((ds) => {
            const isSelected = currentDataset?.id === ds.id;
            return (
              <button
                key={ds.id}
                onClick={() => onSelectDataset(ds)}
                className={`p-5 rounded-cards border text-left transition-all active:scale-[0.99] flex flex-col justify-between shadow-subtle ${
                  isSelected
                    ? "bg-surface-alt border-ink ring-1 ring-ink/20"
                    : "bg-paper border-hairline hover:border-mid-gray"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-ink text-sm tracking-tight">
                      {ds.name}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-badges font-mono bg-canvas text-ink border border-hairline">
                      {ds.expectedGrouping}
                    </span>
                  </div>
                  <p className="text-xs text-mid-gray leading-relaxed mb-4">
                    {ds.description}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-hairline text-[11px] text-mid-gray font-mono">
                  <span>Muestra: N = {ds.n}</span>
                  <span>Variable por defecto: {ds.defaultVariable}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Zona Drag & Drop para Cargar CSV o XLSX */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        className="p-8 sm:p-10 border-2 border-dashed border-hairline rounded-cards bg-surface-alt flex flex-col items-center justify-center text-center transition-all hover:border-ink shadow-subtle"
      >
        <div className="w-12 h-12 rounded-inputs bg-paper border border-hairline flex items-center justify-center mb-3 text-ink shadow-sm">
          <UploadCloud className="w-5 h-5 text-ink" />
        </div>
        <h4 className="text-sm font-semibold tracking-tight text-ink mb-1">
          Cargar Archivo de Datos (.CSV o .XLSX / Excel)
        </h4>
        <p className="text-xs text-mid-gray max-w-md mb-4 leading-relaxed">
          Arrastra tu dataset aquí o haz clic en examinar. Procesamiento 100% en memoria local y privado sin enviar datos a servidores externos.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="min-h-[40px] px-5 py-2 rounded-buttons bg-ink hover:bg-ink-soft text-paper font-medium text-xs tracking-tight shadow-sm transition-all active:scale-95 flex items-center gap-2"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Examinar Archivos Locales</span>
        </button>
      </div>

      {/* 3. Configuración de la Variable Seleccionada y Unidad de Medida */}
      <div className="p-6 rounded-cards bg-paper border border-hairline shadow-subtle space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-hairline">
          <CheckCircle2 className="w-4 h-4 text-ink" />
          <h4 className="text-sm font-semibold tracking-tight text-ink uppercase">
            02. Variable Cuantitativa y Parámetros del Experimento
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Selector de Variable */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-medium text-mid-gray uppercase tracking-wider">
              Columna Cuantitativa a Analizar:
            </label>
            <select
              value={selectedColumn}
              onChange={(e) => onSelectColumn(e.target.value)}
              className="min-h-[42px] px-3.5 py-2 rounded-inputs border border-hairline bg-surface-alt text-ink font-mono text-xs focus:outline-none focus:border-ink transition-colors"
            >
              {numericColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Unidad de Medida */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-medium text-mid-gray uppercase tracking-wider">
              Unidad de Medida (ej. horas, años, kg, USD, puntos):
            </label>
            <input
              type="text"
              value={unitOfMeasure}
              onChange={(e) => onChangeUnit(e.target.value)}
              placeholder="ej. horas, USD, puntos"
              className="min-h-[42px] px-3.5 py-2 rounded-inputs border border-hairline bg-surface-alt text-ink font-mono text-xs focus:outline-none focus:border-ink transition-colors"
            />
          </div>
        </div>

        {/* Clasificación Automática de la Variable */}
        <div className="p-4 rounded-nested bg-surface-alt border border-hairline flex items-start gap-3">
          <Info className="w-4 h-4 text-ink flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-mid-gray">
                Clasificación Formal:
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-badges font-mono font-semibold bg-ink text-paper">
                Cuantitativa {variableType}
              </span>
            </div>
            <p className="text-xs text-mid-gray leading-relaxed font-sans">
              {variableJustification}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
