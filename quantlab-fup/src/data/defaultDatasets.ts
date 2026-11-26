/**
 * DATASETS POR DEFECTO DEL CURSO
 * 1. Rendimiento Académico (N=30) -> Criterio Datos No Agrupados (N < 40)
 * 2. Registro Empresarial (N=120) -> Criterio Datos Agrupados (N >= 40, Regla de Sturges)
 */

export interface DatasetMeta {
  id: string;
  name: string;
  description: string;
  n: number;
  expectedGrouping: "No Agrupados (N < 40)" | "Agrupados (N ≥ 40, Sturges)";
  defaultVariable: string;
  defaultUnit: string;
  data: Record<string, any>[];
}

// Generamos los 30 estudiantes con datos realistas
const academicData = [
  { id: 1, estudiante: "Estudiante 01", promedio: 3.8, horas_estudio: 14, materias_aprobadas: 5, edad: 19 },
  { id: 2, estudiante: "Estudiante 02", promedio: 4.2, horas_estudio: 18, materias_aprobadas: 6, edad: 20 },
  { id: 3, estudiante: "Estudiante 03", promedio: 3.5, horas_estudio: 12, materias_aprobadas: 4, edad: 18 },
  { id: 4, estudiante: "Estudiante 04", promedio: 4.8, horas_estudio: 24, materias_aprobadas: 6, edad: 21 },
  { id: 5, estudiante: "Estudiante 05", promedio: 2.9, horas_estudio: 8, materias_aprobadas: 3, edad: 22 },
  { id: 6, estudiante: "Estudiante 06", promedio: 3.7, horas_estudio: 15, materias_aprobadas: 5, edad: 19 },
  { id: 7, estudiante: "Estudiante 07", promedio: 4.0, horas_estudio: 16, materias_aprobadas: 5, edad: 20 },
  { id: 8, estudiante: "Estudiante 08", promedio: 3.3, horas_estudio: 10, materias_aprobadas: 4, edad: 19 },
  { id: 9, estudiante: "Estudiante 09", promedio: 4.5, horas_estudio: 22, materias_aprobadas: 6, edad: 23 },
  { id: 10, estudiante: "Estudiante 10", promedio: 3.9, horas_estudio: 15, materias_aprobadas: 5, edad: 20 },
  { id: 11, estudiante: "Estudiante 11", promedio: 3.6, horas_estudio: 13, materias_aprobadas: 5, edad: 18 },
  { id: 12, estudiante: "Estudiante 12", promedio: 4.1, horas_estudio: 17, materias_aprobadas: 6, edad: 21 },
  { id: 13, estudiante: "Estudiante 13", promedio: 3.0, horas_estudio: 9, materias_aprobadas: 3, edad: 22 },
  { id: 14, estudiante: "Estudiante 14", promedio: 4.6, horas_estudio: 23, materias_aprobadas: 6, edad: 20 },
  { id: 15, estudiante: "Estudiante 15", promedio: 3.8, horas_estudio: 14, materias_aprobadas: 5, edad: 19 },
  { id: 16, estudiante: "Estudiante 16", promedio: 3.4, horas_estudio: 11, materias_aprobadas: 4, edad: 18 },
  { id: 17, estudiante: "Estudiante 17", promedio: 4.3, horas_estudio: 19, materias_aprobadas: 6, edad: 21 },
  { id: 18, estudiante: "Estudiante 18", promedio: 3.7, horas_estudio: 15, materias_aprobadas: 5, edad: 20 },
  { id: 19, estudiante: "Estudiante 19", promedio: 3.1, horas_estudio: 9, materias_aprobadas: 4, edad: 22 },
  { id: 20, estudiante: "Estudiante 20", promedio: 4.7, horas_estudio: 25, materias_aprobadas: 6, edad: 21 },
  { id: 21, estudiante: "Estudiante 21", promedio: 3.9, horas_estudio: 16, materias_aprobadas: 5, edad: 19 },
  { id: 22, estudiante: "Estudiante 22", promedio: 3.5, horas_estudio: 12, materias_aprobadas: 4, edad: 18 },
  { id: 23, estudiante: "Estudiante 23", promedio: 4.4, horas_estudio: 20, materias_aprobadas: 6, edad: 20 },
  { id: 24, estudiante: "Estudiante 24", promedio: 3.8, horas_estudio: 15, materias_aprobadas: 5, edad: 19 },
  { id: 25, estudiante: "Estudiante 25", promedio: 2.7, horas_estudio: 6, materias_aprobadas: 3, edad: 24 }, // valor bajo
  { id: 26, estudiante: "Estudiante 26", promedio: 4.0, horas_estudio: 16, materias_aprobadas: 5, edad: 20 },
  { id: 27, estudiante: "Estudiante 27", promedio: 3.6, horas_estudio: 13, materias_aprobadas: 5, edad: 18 },
  { id: 28, estudiante: "Estudiante 28", promedio: 4.2, horas_estudio: 18, materias_aprobadas: 6, edad: 21 },
  { id: 29, estudiante: "Estudiante 29", promedio: 3.7, horas_estudio: 14, materias_aprobadas: 5, edad: 19 },
  { id: 30, estudiante: "Estudiante 30", promedio: 5.0, horas_estudio: 28, materias_aprobadas: 6, edad: 22 }, // valor alto
];

// Generador determinista para Registro Empresarial (N=120)
function generateEnterpriseData(): Record<string, any>[] {
  const records: Record<string, any>[] = [];
  const baseSalaries = [
    1800, 1950, 2100, 2200, 2350, 2500, 2600, 2750, 2800, 2950,
    3000, 3100, 3250, 3400, 3500, 3650, 3800, 4000, 4200, 4500,
    4800, 5100, 5500, 6000, 6800, 7500, 8900
  ];

  for (let i = 1; i <= 120; i++) {
    // Generación determinista coherente
    const seed = (i * 9301 + 49297) % 233280;
    const rnd = seed / 233280;
    
    // Salario: log-normal aproximado en USD
    const salIndex = Math.floor(rnd * baseSalaries.length);
    let salario = baseSalaries[salIndex] + Math.round((rnd - 0.5) * 200);
    if (i === 119) salario = 10500; // Valor atípico superior
    if (i === 120) salario = 11200; // Valor atípico superior

    const antiguedad = Math.round((1 + rnd * 14) * 10) / 10; // 1 a 15 años
    const capacitacion = Math.round(10 + rnd * 70); // 10 a 80 horas
    const desempeno = Math.round((60 + rnd * 39) * 10) / 10; // 60 a 99 puntos

    records.push({
      id: i,
      empleado: `EMP-${i.toString().padStart(3, "0")}`,
      salario_mensual: salario,
      antiguedad_anos: antiguedad,
      horas_capacitacion: capacitacion,
      puntuacion_desempeno: desempeno,
    });
  }
  return records;
}

export const PRELOADED_DATASETS: DatasetMeta[] = [
  {
    id: "academico-30",
    name: "Rendimiento Académico (N = 30)",
    description: "Evaluación semestral de 30 estudiantes universitarios con promedios, horas de estudio y materias aprobadas.",
    n: 30,
    expectedGrouping: "No Agrupados (N < 40)",
    defaultVariable: "promedio",
    defaultUnit: "puntos",
    data: academicData,
  },
  {
    id: "empresarial-120",
    name: "Registro Empresarial de Nómina (N = 120)",
    description: "Muestra corporativa de 120 colaboradores con salarios, antigüedad laboral, horas de capacitación y puntaje de desempeño.",
    n: 120,
    expectedGrouping: "Agrupados (N ≥ 40, Sturges)",
    defaultVariable: "salario_mensual",
    defaultUnit: "USD",
    data: generateEnterpriseData(),
  },
];

