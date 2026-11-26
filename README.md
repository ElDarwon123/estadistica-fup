# Proyectos de Estadística y Probabilidad

Este espacio de trabajo contiene dos aplicaciones web profesionales, científicas e interactivas diseñadas para la enseñanza, simulación y análisis riguroso de la **Teoría de la Probabilidad** y la **Estadística Descriptiva Cuantitativa**.

---

## Estructura del Espacio de Trabajo

```
c:\MyProject\Estadistica\
├── royale-probability-3d/    # PROYECTO 1: Simulador Probabilístico 3D ("Royale Probability 3D")
└── quantlab-fup/             # PROYECTO 2: Suite de Analítica Estadística Cuantitativa ("QuantLab FUP")
```

---

## PROYECTO 1: ROYALE PROBABILITY 3D
> **Simulador Probabilístico 3D Maximalista de Casino VIP**

### 1. Descripción
Aplicación web interactiva con estética de **Casino VIP** que funciona como simulador formal de la Teoría de la Probabilidad empleando una **Ruleta Europea 3D procedural** con 37 casillas (números del 0 al 36) y física de desaceleración angular para la bola cromada.

### 2. Stack Tecnológico
- **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS.
- **Motor 3D:** Three.js con `@react-three/fiber` y `@react-three/drei`.
- **Efectos y Audio:** Web Audio API procedural (clics mecánicos y chimes de victoria) + `canvas-confetti`.
- **UI:** Lucide React + Directrices Mobile-First & Don Norman (Touch targets ≥ 44px).

### 3. Características Principales
- **Lienzo Central 3D:** Rueda procedural de caoba barnizada con rotor metálico dorado, 37 casillas con colores reglamentarios (0 verde, 1-36 rojo/negro), bola cromada con trayectoria helicoidal y control de cámara orbital (`perspective`, `top`, `closeup`).
- **Constructor de Eventos ($\Omega$):** Configuración simultánea de eventos $A$ y $B$ mediante chips de presets (Rojo, Negro, Verde, Par, Impar, Primos $\{2,3,5,7,11,13,17,19,23,29,31\}$, Docenas 1-3, Mayores/Menores) y selector manual de casillas.
- **Tapete de Apuestas Oficial (Felt):** Resaltado visual en tiempo real de $A$ (halo oro), $B$ (halo cian) y la intersección $A \cap B$ (halo magenta).
- **Motor Matemático en Tiempo Real:**
  - Probabilidad de Laplace: $P(A)$, $P(B)$, Complemento $P(A^c) = 1 - P(A)$, Unión $P(A \cup B)$, Intersección $P(A \cap B)$.
  - Clasificador automático de eventos: Compatibles ($A \cap B \neq \emptyset$), Incompatibles ($A \cap B = \emptyset$), Seguro ($\Omega$), Imposible ($\emptyset$).
  - Probabilidad Condicional: $P(A \mid B) = \frac{|A \cap B|}{|B|}$ con explicación formal en lenguaje natural.
  - Simulador Monte Carlo: Giros individuales 3D, lotes de 100 y 1,000 giros instantáneos con gráfico en vivo de convergencia hacia la probabilidad teórica (Ley Débil de los Grandes Números).
- **Regla de Formato:** Enteros exactos sin decimales, 1-3 decimales exactos completos, y más de 3 decimales redondeados estrictamente a 3 dígitos.

### 4. Cómo Ejecutar Proyecto 1
```bash
cd royale-probability-3d
pnpm dev
# Abrir en el navegador: http://localhost:3000
```

---

## PROYECTO 2: QUANTLAB FUP
> **Suite de Analítica Estadística y Probabilística Cuantitativa**

### 1. Descripción
Plataforma analítica científica para procesar y analizar bases de datos cuantitativas (`.csv`, `.xlsx` o predeterminadas) aplicando todos los temas del semestre de Estadística Descriptiva y Probabilidad, con estricto apego a las reglas metodológicas universitarias.

### 2. Stack Tecnológico
- **Framework:** Astro (arquitectura de islas) + React + TypeScript + Tailwind CSS.
- **Procesamiento de Archivos:** `papaparse` (CSV) y `xlsx` (SheetJS) ejecutados 100% en cliente sin subir datos a servidores.
- **Visualización:** Recharts (Histogramas, Diagramas de Barras, Gráficos Circulares) y Boxplot SVG nativo.
- **Exportación:** Impresión optimizada `@media print` para generar informes PDF listos para entrega.

### 3. Módulos Funcionales
1. **Módulo 1: Ingesta y Clasificación de Variables:**
   - Carga Drag & Drop para CSV/Excel y selector de 2 datasets precargados: *Rendimiento Académico N=30* (No agrupados) y *Registro Empresarial N=120* (Agrupados).
   - Detección automática de columnas numéricas y clasificación automática en **Cuantitativa Discreta** o **Continua** con justificación teórica.
2. **Módulo 2: Tabla de Distribución de Frecuencias y Gráficos:**
   - Tabla con columnas: Intervalo / $x_i$, $f_i$, $F_i$, $h_i$, $H_i$, $\%$ y grados $^\circ$.
   - Fila de verificación con badge verde: $\sum f_i = N, \sum h_i = 1, \sum \% = 100\%, \sum ^\circ = 360^\circ$.
   - Criterio de Sturges $k = \text{round}(1 + 3.322 \log_{10}(N))$ y amplitud $A = \lceil R / k \rceil$ para $N \ge 40$, con ajuste manual.
   - Histograma/Barras y Gráfico Circular interactivos.
3. **Módulo 3: Medidas de Tendencia Central:**
   - Media Aritmética ($\bar{x}$) con desglose paso a paso.
   - Mediana ($\text{Me}$) con posiciones centrales o fórmula interpolada agrupada.
   - Moda ($\text{Mo}$) etiquetando *Unimodal, Bimodal, Multimodal o Amodal*.
   - Diagnóstico visual de simetría / sesgo ($\bar{x}$ vs $\text{Me}$).
4. **Módulo 4: Medidas de Posición Interactivas:**
   - Cuartiles ($Q_1, Q_2, Q_3$) y Deciles ($D_1 \dots D_9$).
   - Calculadora de Percentiles ($P_1$ a $P_{99}$) con el procedimiento formal de 2 pasos (Localización e Interpolación lineal) y equivalencias ($P_{25}=Q_1, P_{50}=Q_2=D_5=\text{Me}, P_{75}=Q_3$).
5. **Módulo 5: Medidas de Dispersión, Tabla de Desviaciones y Atípicos:**
   - Rango ($R$), $RIC$, Varianza Poblacional ($\sigma^2$), Desviación Estándar ($\sigma$) y Coeficiente de Variación ($CV$).
   - Acordeón con la **tabla de desviaciones de 3 columnas** ($x_i$, $x_i - \bar{x}$, $(x_i - \bar{x})^2$) y sumatoria total.
   - Detector de Atípicos (Tukey $1.5 \times RIC$) con límites $LI$ y $LS$, lista de registros atípicos y diagrama de Boxplot.
6. **Módulo 6: Redactor de Interpretación Automática:**
   - Generación de los 4 párrafos reglamentarios de clase (Comportamiento típico, dispersión y homogeneidad, cortes de distribución acumulada, diagnóstico de atípicos) con botón de copiado.
7. **Módulo 7: Probabilidad Empírica y Técnicas de Conteo sobre la DB:**
   - Filtros de eventos $A$ y $B$ ($>, \ge, <, \le, =, \text{entre}$) sobre columnas de la base de datos con cálculo de $P(A), P(B), P(A^c), P(A \cup B), P(A \cap B)$ y $P(A \mid B)$.
   - Técnicas de Conteo: Muestreo de tamaño $r$ con Combinaciones $C(N, r)$ y Permutaciones $P(N, r)$ mediante aritmética BigInt.

### 4. Cómo Ejecutar Proyecto 2
```bash
cd quantlab-fup
pnpm dev
# Abrir en el navegador: http://localhost:4321
```

