import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import readXlsxFile from 'read-excel-file/browser'
import {
  CalendarClock,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  Search,
  Upload,
} from 'lucide-react'
import './App.css'

type Status = 'Pendiente' | 'En curso' | 'Bloqueado' | 'Listo'

type Task = {
  id: string
  title: string
  phase: string
  owner: string
  start: string
  end: string
  dependency: string
  progress: number
  status: Status
  cadence?: string
  source: string
}

const todayIso = '2026-07-12'
const storageKey = 'ir21-gantt-live-v2'

const initialTasks: Task[] = [
  { id: '0.1', title: 'Comité Ejecutivo', phase: '0 Gestión', owner: 'Comité', start: '2026-04-21', end: '2026-10-16', dependency: '', progress: 55, status: 'En curso', cadence: 'Quincenal', source: '0_Gestion' },
  { id: '0.2', title: 'Comité Táctico', phase: '0 Gestión', owner: 'Comité', start: '2026-04-21', end: '2026-10-16', dependency: '', progress: 55, status: 'En curso', cadence: 'Quincenal', source: '0_Gestion' },
  { id: '0.3', title: 'Mesa Técnica', phase: '0 Gestión', owner: 'Equipo técnico', start: '2026-04-21', end: '2026-10-16', dependency: '', progress: 58, status: 'En curso', cadence: 'Semanal', source: '0_Gestion' },
  { id: '0.4', title: 'Gestión de Riesgos y Dependencias', phase: '0 Gestión', owner: 'PMO', start: '2026-04-21', end: '2026-10-16', dependency: '', progress: 52, status: 'En curso', cadence: 'Semanal', source: '0_Gestion' },
  { id: '0.5', title: 'Seguimiento de Accesos e Infraestructura', phase: '0 Gestión', owner: 'PMO', start: '2026-04-21', end: '2026-10-16', dependency: '', progress: 48, status: 'En curso', cadence: 'Semanal', source: '0_Gestion' },
  { id: '0.6', title: 'Reporte Estado Proyecto', phase: '0 Gestión', owner: 'PMO', start: '2026-04-21', end: '2026-10-16', dependency: '', progress: 55, status: 'En curso', cadence: 'Semanal', source: '0_Gestion' },
  { id: '0.7', title: 'Presentación Ejecutiva', phase: '0 Gestión', owner: 'PMO', start: '2026-04-21', end: '2026-10-16', dependency: '', progress: 42, status: 'En curso', cadence: 'Quincenal', source: '0_Gestion' },
  { id: '0.8', title: 'Gestión de Stakeholders', phase: '0 Gestión', owner: 'PMO', start: '2026-04-21', end: '2026-10-16', dependency: '', progress: 56, status: 'En curso', cadence: 'Continua', source: '0_Gestion' },
  { id: '0.9', title: 'Coordinación Entel – Intellicore', phase: '0 Gestión', owner: 'Entel + Intellicore', start: '2026-04-21', end: '2026-10-16', dependency: '', progress: 57, status: 'En curso', cadence: 'Continua', source: '0_Gestion' },
  { id: '1.1', title: 'Reunión Levantamiento Inicial Core O&M', phase: '1 Levantamiento', owner: 'Entel + Intellicore', start: '2026-04-21', end: '2026-04-21', dependency: '', progress: 100, status: 'Listo', source: '1_Levantamiento' },
  { id: '1.2', title: 'Reunión Levantamiento Core Voz', phase: '1 Levantamiento', owner: 'Entel + Intellicore', start: '2026-05-07', end: '2026-05-07', dependency: '1.1', progress: 100, status: 'Listo', source: '1_Levantamiento' },
  { id: '1.3', title: 'Reunión Definición Automatización Core', phase: '1 Levantamiento', owner: 'Entel + Intellicore', start: '2026-05-14', end: '2026-05-14', dependency: '1.2', progress: 100, status: 'Listo', source: '1_Levantamiento' },
  { id: '1.4', title: 'Revisión Arquitectura y Gobierno', phase: '1 Levantamiento', owner: 'Entel + Intellicore', start: '2026-06-01', end: '2026-06-01', dependency: '1.3', progress: 100, status: 'Listo', source: '1_Levantamiento' },
  { id: '1.5', title: 'Revisión Stack Tecnológico', phase: '1 Levantamiento', owner: 'Entel + Intellicore', start: '2026-06-02', end: '2026-06-02', dependency: '1.4', progress: 100, status: 'Listo', source: '1_Levantamiento' },
  { id: '1.6', title: 'Definición Capacidades Plataforma', phase: '1 Levantamiento', owner: 'Entel + Intellicore', start: '2026-06-03', end: '2026-06-03', dependency: '1.5', progress: 100, status: 'Listo', source: '1_Levantamiento' },
  { id: '1.7', title: 'Revisión Integraciones y Observabilidad', phase: '1 Levantamiento', owner: 'Entel + Intellicore', start: '2026-06-04', end: '2026-06-04', dependency: '1.6', progress: 100, status: 'Listo', source: '1_Levantamiento' },
  { id: '1.8', title: 'Revisión Backlog y Casos de Uso', phase: '1 Levantamiento', owner: 'Entel + Intellicore', start: '2026-06-05', end: '2026-06-05', dependency: '1.7', progress: 100, status: 'Listo', source: '1_Levantamiento' },
  { id: '1.9', title: 'Revisión Modelo Operativo', phase: '1 Levantamiento', owner: 'Entel + Intellicore', start: '2026-06-09', end: '2026-06-09', dependency: '1.8', progress: 100, status: 'Listo', source: '1_Levantamiento' },
  { id: '1.10', title: 'Reunión Tecnologías Disponibles', phase: '1 Levantamiento', owner: 'Entel + Intellicore', start: '2026-06-11', end: '2026-06-11', dependency: '1.9', progress: 100, status: 'Listo', source: '1_Levantamiento' },
  { id: '1.11', title: 'Reunión Integración OSVI', phase: '1 Levantamiento', owner: 'Entel + Intellicore', start: '2026-06-12', end: '2026-06-12', dependency: '1.10', progress: 100, status: 'Listo', source: '1_Levantamiento' },
  { id: '1.12', title: 'Reunión PSG', phase: '1 Levantamiento', owner: 'Entel + Intellicore', start: '2026-06-15', end: '2026-06-15', dependency: '1.11', progress: 100, status: 'Listo', source: '1_Levantamiento' },
  { id: '1.13', title: 'Revisión GitLab / Bitbucket', phase: '1 Levantamiento', owner: 'Entel + Intellicore', start: '2026-06-22', end: '2026-06-22', dependency: '1.12', progress: 100, status: 'Listo', source: '1_Levantamiento' },
  { id: 'H-01', title: 'Hito: Levantamiento Finalizado', phase: '1 Levantamiento', owner: 'PMO', start: '2026-06-22', end: '2026-06-22', dependency: '1.13', progress: 100, status: 'Listo', source: '1_Levantamiento' },
  { id: '2.1', title: 'Definir Modelo de Gobernanza', phase: '2 Arquitectura', owner: 'Entel + Intellicore', start: '2026-06-23', end: '2026-06-26', dependency: 'H-01', progress: 100, status: 'Listo', source: '2_a_8_Fases' },
  { id: '2.2', title: 'Confirmar Responsable de Aprobación PR', phase: '2 Arquitectura', owner: 'Entel', start: '2026-06-29', end: '2026-07-01', dependency: '2.1', progress: 100, status: 'Listo', source: '2_a_8_Fases' },
  { id: '2.3', title: 'Definir Rol Administrador Entel', phase: '2 Arquitectura', owner: 'Entel', start: '2026-06-29', end: '2026-07-01', dependency: '2.1', progress: 100, status: 'Listo', source: '2_a_8_Fases' },
  { id: '2.4', title: 'Validar Estructura Repositorio Centralizado', phase: '2 Arquitectura', owner: 'Entel + Intellicore', start: '2026-07-02', end: '2026-07-06', dependency: '2.3', progress: 80, status: 'En curso', source: '2_a_8_Fases' },
  { id: '2.5', title: 'Definir Stack Tecnológico', phase: '2 Arquitectura', owner: 'Entel + Intellicore', start: '2026-07-07', end: '2026-07-09', dependency: '2.4', progress: 65, status: 'En curso', source: '2_a_8_Fases' },
  { id: '2.6', title: 'Arquitectura HLD', phase: '2 Arquitectura', owner: 'Intellicore', start: '2026-07-10', end: '2026-07-15', dependency: '2.5', progress: 30, status: 'En curso', source: '2_a_8_Fases' },
  { id: '2.7', title: 'Validación Arquitectura Entel', phase: '2 Arquitectura', owner: 'Entel', start: '2026-07-16', end: '2026-07-17', dependency: '2.6', progress: 0, status: 'Pendiente', source: '2_a_8_Fases' },
  { id: 'H-02', title: 'Hito: Arquitectura Aprobada', phase: '2 Arquitectura', owner: 'PMO', start: '2026-07-17', end: '2026-07-17', dependency: '2.7', progress: 0, status: 'Pendiente', source: '2_a_8_Fases' },
  { id: '3.1', title: 'Acceso a Servidor', phase: '3 Infraestructura', owner: 'Entel', start: '2026-07-20', end: '2026-07-24', dependency: 'H-02', progress: 0, status: 'Pendiente', source: '2_a_8_Fases' },
  { id: '3.12', title: 'Cuentas Sistémicas PAM', phase: '3 Infraestructura', owner: 'Entel', start: '2026-07-27', end: '2026-07-31', dependency: '3.7', progress: 0, status: 'Bloqueado', source: '2_a_8_Fases' },
  { id: 'H-03', title: 'Hito: Infraestructura y Accesos Disponibles', phase: '3 Infraestructura', owner: 'PMO', start: '2026-07-31', end: '2026-07-31', dependency: '3.12', progress: 0, status: 'Pendiente', source: '2_a_8_Fases' },
  { id: '4.7', title: 'Definición MVP', phase: '4 MVP', owner: 'PO + Entel', start: '2026-08-03', end: '2026-08-07', dependency: '4.6', progress: 0, status: 'Bloqueado', source: '2_a_8_Fases' },
  { id: 'H-04', title: 'Hito: MVP Definido', phase: '4 MVP', owner: 'PMO', start: '2026-08-07', end: '2026-08-07', dependency: '4.7', progress: 0, status: 'Pendiente', source: '2_a_8_Fases' },
  { id: '5.9', title: 'Definir uso de n8n', phase: '5 Plataforma', owner: 'Intellicore', start: '2026-08-10', end: '2026-08-21', dependency: '5.4', progress: 0, status: 'Bloqueado', source: '2_a_8_Fases' },
  { id: 'H-05', title: 'Hito: Plataforma Base Disponible', phase: '5 Plataforma', owner: 'PMO', start: '2026-08-21', end: '2026-08-21', dependency: '5.9', progress: 0, status: 'Pendiente', source: '2_a_8_Fases' },
  { id: '6.9', title: 'Piloto Operacional', phase: '6 Piloto', owner: 'Entel + Intellicore', start: '2026-08-24', end: '2026-09-04', dependency: '6.8', progress: 0, status: 'Bloqueado', source: '2_a_8_Fases' },
  { id: 'H-06', title: 'Hito: Piloto Aprobado', phase: '6 Piloto', owner: 'PMO', start: '2026-09-04', end: '2026-09-04', dependency: '6.9', progress: 0, status: 'Pendiente', source: '2_a_8_Fases' },
  { id: '7.12', title: 'Definir Plan Formal de Capacitación', phase: '7 Capacitación', owner: 'Intellicore', start: '2026-09-07', end: '2026-09-18', dependency: '7.11', progress: 0, status: 'Bloqueado', source: '2_a_8_Fases' },
  { id: 'H-07', title: 'Hito: Capacitación Finalizada', phase: '7 Capacitación', owner: 'PMO', start: '2026-09-18', end: '2026-09-18', dependency: '7.12', progress: 0, status: 'Pendiente', source: '2_a_8_Fases' },
  { id: '8.5', title: 'Paso a Producción', phase: '8 Producción', owner: 'Entel + Intellicore', start: '2026-09-21', end: '2026-10-02', dependency: '8.4', progress: 0, status: 'Bloqueado', source: '2_a_8_Fases' },
  { id: 'H-08', title: 'Hito: Proyecto Operativo', phase: '8 Producción', owner: 'PMO', start: '2026-10-02', end: '2026-10-02', dependency: '8.5', progress: 0, status: 'Pendiente', source: '2_a_8_Fases' },
]

const statusOptions: Status[] = ['Pendiente', 'En curso', 'Bloqueado', 'Listo']

const oneDay = 24 * 60 * 60 * 1000

function toDate(iso: string) {
  return new Date(`${iso}T00:00:00`)
}

function toIso(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(iso: string, days: number) {
  const date = toDate(iso)
  date.setDate(date.getDate() + days)
  return toIso(date)
}

function diffDays(start: string, end: string) {
  return Math.max(0, Math.round((toDate(end).getTime() - toDate(start).getTime()) / oneDay))
}

function parseDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toIso(value)
  }

  const text = String(value ?? '').trim()
  const match = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (!match) return ''

  const [, day, month, year] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function formatExcelDate(iso: string) {
  const [year, month, day] = iso.split('-')
  return `${day}-${month}-${year}`
}

function durationLabel(start: string, end: string) {
  const days = diffDays(start, end)
  return `${days} ${days === 1 ? 'día' : 'días'}`
}

function getThirdLabel(task: Task) {
  if (task.source.includes('Gestion') || task.phase === '0 Gestión') return 'Tipo'
  if (task.source.includes('Levantamiento') || task.phase === '1 Levantamiento') return 'Fecha'
  return 'Responsable'
}

function getThirdValue(task: Task) {
  const label = getThirdLabel(task)
  if (label === 'Tipo') return task.cadence ?? ''
  if (label === 'Fecha') return formatExcelDate(task.start)
  return task.owner
}

function getDependencyLabel(task: Task) {
  return task.source.includes('Gestion') || task.phase === '0 Gestión' ? 'Dependencia' : 'Predecesora'
}

function getDependencyValue(task: Task) {
  if (task.dependency) return task.dependency
  return getDependencyLabel(task) === 'Dependencia' ? 'Sin dependencia' : '-'
}

function normalizePhase(id: string, source: string) {
  if (source.includes('Gestion') || id.startsWith('0.')) return '0 Gestión'
  if (source.includes('Levantamiento') || id.startsWith('1.') || id === 'H-01') return '1 Levantamiento'
  if (id.startsWith('2.') || id === 'H-02') return '2 Arquitectura'
  if (id.startsWith('3.') || id === 'H-03') return '3 Infraestructura'
  if (id.startsWith('4.') || id === 'H-04') return '4 MVP'
  if (id.startsWith('5.') || id === 'H-05') return '5 Plataforma'
  if (id.startsWith('6.') || id === 'H-06') return '6 Piloto'
  if (id.startsWith('7.') || id === 'H-07') return '7 Capacitación'
  if (id.startsWith('8.') || id === 'H-08') return '8 Producción'
  return source.replaceAll('_', ' ')
}

function inferStatus(progress: number, dependency: string) {
  if (progress >= 100) return 'Listo'
  if (dependency && !initialTasks.some((task) => task.id === dependency)) return 'Bloqueado'
  if (progress > 0) return 'En curso'
  return 'Pendiente'
}

function clampProgress(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)))
}

function getStoredTasks() {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return initialTasks
    const parsed = JSON.parse(stored) as Task[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialTasks
  } catch {
    return initialTasks
  }
}

function valueAt(row: unknown[], index: number) {
  return String(row[index] ?? '').trim()
}

async function parseWorkbook(file: File) {
  const sheets = await readXlsxFile(file)
  const tasks: Task[] = []
  const byId = new Map<string, Task>()
  let rollingStart = '2026-04-21'

  for (const sheet of sheets) {
    const sheetName = sheet.sheet
    const rows = sheet.data as unknown[][]
    const dataRows = rows.slice(1).filter((row) => valueAt(row, 0) && valueAt(row, 1))

    dataRows.forEach((row, index) => {
      const id = valueAt(row, 0)
      const title = valueAt(row, 1)
      const third = row[2]
      const fourth = valueAt(row, 3).replace(/^Sin dependencia$/i, '')
      const explicitDate = parseDate(third)
      const phase = normalizePhase(id, sheetName)
      const isMilestone = id.startsWith('H-') || title.toLowerCase().includes('hito')
      const dependencyTask = fourth ? byId.get(fourth) : undefined
      const dependencyStart = dependencyTask ? addDays(dependencyTask.end, 1) : rollingStart
      const start = explicitDate || (index === 0 && phase !== '0 Gestión' ? dependencyStart : addDays(dependencyStart, index > 0 ? 1 : 0))
      const end = explicitDate || (isMilestone ? start : addDays(start, phase === '0 Gestión' ? 178 : 4))
      const progress = toDate(end) < toDate(todayIso) ? 100 : toDate(start) <= toDate(todayIso) ? 40 : 0
      const task: Task = {
        id,
        title,
        phase,
        owner: sheetName.includes('Gestion') || sheetName.includes('Levantamiento') ? '' : String(third || ''),
        start,
        end,
        dependency: fourth,
        progress,
        status: inferStatus(progress, fourth),
        cadence: sheetName.includes('Gestion') ? String(third || '') : undefined,
        source: sheetName,
      }

      tasks.push(task)
      byId.set(id, task)
      rollingStart = task.end
    })
  }

  return tasks.length > 0 ? tasks : initialTasks
}

function exportJson(tasks: Task[]) {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'roadmap-ir21-gantt.json'
  link.click()
  URL.revokeObjectURL(url)
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(getStoredTasks)
  const [selectedId, setSelectedId] = useState(tasks[0]?.id ?? '')
  const [phaseFilter, setPhaseFilter] = useState('Todas')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('Datos iniciales cargados desde Gantt_IR21_Core_Proyecto_20260624.xlsx')
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(tasks))
  }, [tasks])

  const phases = ['Todas', ...Array.from(new Set(tasks.map((task) => task.phase)))]
  const statuses = ['Todos', ...statusOptions]
  const owners = Array.from(new Set(tasks.filter((task) => getThirdLabel(task) === 'Responsable').map((task) => task.owner).filter(Boolean)))
  const selectedTask = tasks.find((task) => task.id === selectedId) ?? tasks[0]
  const visibleTasks = tasks.filter((task) => {
    const haystack = `${task.id} ${task.title} ${task.owner} ${task.phase} ${getThirdValue(task)} ${getDependencyValue(task)}`.toLowerCase()
    const matchesQuery = haystack.includes(deferredQuery.toLowerCase())
    const matchesPhase = phaseFilter === 'Todas' || task.phase === phaseFilter
    const matchesStatus = statusFilter === 'Todos' || task.status === statusFilter
    return matchesQuery && matchesPhase && matchesStatus
  })
  const groupedTasks = Array.from(new Set(visibleTasks.map((task) => task.phase))).map((phase) => ({
    phase,
    tasks: visibleTasks.filter((task) => task.phase === phase),
  }))
  const minStart = tasks.reduce((min, task) => (toDate(task.start) < toDate(min) ? task.start : min), tasks[0]?.start ?? todayIso)
  const maxEnd = tasks.reduce((max, task) => (toDate(task.end) > toDate(max) ? task.end : max), tasks[0]?.end ?? todayIso)
  const timelineStart = addDays(minStart, -3)
  const timelineEnd = addDays(maxEnd, 7)
  const totalDays = Math.max(1, diffDays(timelineStart, timelineEnd))
  const completed = Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / Math.max(tasks.length, 1))
  const blocked = tasks.filter((task) => task.status === 'Bloqueado').length
  const milestones = tasks.filter((task) => task.id.startsWith('H-')).length
  const todayOffset = (diffDays(timelineStart, todayIso) / totalDays) * 100

  function updateTask(id: string, patch: Partial<Task>) {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== id) return task
        const next = { ...task, ...patch }
        if (toDate(next.end) < toDate(next.start)) next.end = next.start
        return next
      }),
    )
  }

  function handleFilter(next: string, setter: (value: string) => void) {
    startTransition(() => setter(next))
  }

  function updateThirdColumn(task: Task, value: string) {
    const label = getThirdLabel(task)
    if (label === 'Tipo') {
      updateTask(task.id, { cadence: value })
      return
    }

    if (label === 'Responsable') {
      updateTask(task.id, { owner: value })
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const importedTasks = await parseWorkbook(file)
      setTasks(importedTasks)
      setSelectedId(importedTasks[0]?.id ?? '')
      setMessage(`${file.name} importado: ${importedTasks.length} tareas disponibles`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo leer el Excel')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow"><CalendarClock size={16} /> Roadmap IR21 Core</span>
          <h1>Gantt en tiempo real</h1>
          <p>{message}</p>
        </div>
        <div className="top-actions">
          <label className="icon-button" title="Importar Excel">
            <Upload size={18} />
            <span>Importar</span>
            <input type="file" accept=".xlsx,.xls" onChange={handleFile} />
          </label>
          <button type="button" className="icon-button" onClick={() => exportJson(tasks)} title="Exportar JSON">
            <Download size={18} />
            <span>Exportar</span>
          </button>
          <button
            type="button"
            className="icon-button quiet"
            onClick={() => {
              setTasks(initialTasks)
              setSelectedId(initialTasks[0].id)
              setMessage('Datos iniciales restaurados desde el Excel del proyecto')
            }}
            title="Restaurar datos base"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      <section className="kpis" aria-label="Resumen del proyecto">
        <article>
          <span>Tareas</span>
          <strong>{tasks.length}</strong>
        </article>
        <article>
          <span>Avance promedio</span>
          <strong>{completed}%</strong>
        </article>
        <article>
          <span>Bloqueadas</span>
          <strong>{blocked}</strong>
        </article>
        <article>
          <span>Hitos</span>
          <strong>{milestones}</strong>
        </article>
      </section>

      <section className="workspace">
        <div className="board-panel">
          <div className="toolbar">
            <label className="search-field">
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar ID, tarea, tipo, fecha o responsable" />
            </label>
            <label className="select-field">
              <Filter size={18} />
              <select value={phaseFilter} onChange={(event) => handleFilter(event.target.value, setPhaseFilter)}>
                {phases.map((phase) => (
                  <option key={phase}>{phase}</option>
                ))}
              </select>
            </label>
            <label className="select-field">
              <CheckCircle2 size={18} />
              <select value={statusFilter} onChange={(event) => handleFilter(event.target.value, setStatusFilter)}>
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="timeline-meta">
            <span>{timelineStart}</span>
            <span>{timelineEnd}</span>
          </div>

          <div className="gantt" style={{ '--today-left': `${todayOffset}%` } as React.CSSProperties}>
            <div className="today-line" aria-hidden="true" />
            <div className="project-header">
              <span>Nombre de tarea</span>
              <span>Duración</span>
              <span>Comienzo</span>
              <span>Fin</span>
              <span>Predecesoras</span>
              <span>Cronograma</span>
            </div>
            {groupedTasks.map((group) => (
              <section className="phase-group" key={group.phase}>
                <div className="phase-summary">
                  <span>▸ {group.phase}</span>
                  <span>{durationLabel(group.tasks[0].start, group.tasks[group.tasks.length - 1].end)}</span>
                  <span>{formatExcelDate(group.tasks[0].start)}</span>
                  <span>{formatExcelDate(group.tasks[group.tasks.length - 1].end)}</span>
                  <span />
                  <span />
                </div>
                {group.tasks.map((task) => {
                  const left = (diffDays(timelineStart, task.start) / totalDays) * 100
                  const width = Math.max(0.8, (Math.max(1, diffDays(task.start, task.end) + 1) / totalDays) * 100)
                  const isSelected = selectedTask?.id === task.id

                  return (
                    <button
                      type="button"
                      key={task.id}
                      className={`gantt-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedId(task.id)}
                    >
                      <span className="task-copy">
                        <b>{task.id}</b>
                        <span>{task.title}</span>
                      </span>
                      <span className="duration-meta">{durationLabel(task.start, task.end)}</span>
                      <span className="date-meta">{formatExcelDate(task.start)}</span>
                      <span className="date-meta">{formatExcelDate(task.end)}</span>
                      <span className="predecessor-meta">{getDependencyValue(task)}</span>
                      <span className="rail">
                        <span
                          className={`bar ${task.status.toLowerCase().replace(' ', '-')}`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                        >
                          <span style={{ width: `${task.progress}%` }} />
                        </span>
                      </span>
                    </button>
                  )
                })}
              </section>
            ))}
          </div>
        </div>

        {selectedTask && (
          <aside className="editor-panel">
            <div className="panel-title">
              <FileSpreadsheet size={20} />
              <div>
                <span>{selectedTask.id}</span>
                <h2>{selectedTask.title}</h2>
              </div>
            </div>

            <label>
              Tarea
              <input value={selectedTask.title} onChange={(event) => updateTask(selectedTask.id, { title: event.target.value })} />
            </label>
            <label>
              {getThirdLabel(selectedTask)}
              <input
                list={getThirdLabel(selectedTask) === 'Responsable' ? 'owners' : undefined}
                readOnly={getThirdLabel(selectedTask) === 'Fecha'}
                value={getThirdValue(selectedTask)}
                onChange={(event) => updateThirdColumn(selectedTask, event.target.value)}
              />
              <datalist id="owners">
                {owners.map((owner) => (
                  <option key={owner} value={owner} />
                ))}
              </datalist>
            </label>
            <div className="field-grid">
              <label>
                Inicio
                <input type="date" value={selectedTask.start} onChange={(event) => updateTask(selectedTask.id, { start: event.target.value })} />
              </label>
              <label>
                Fin
                <input type="date" value={selectedTask.end} onChange={(event) => updateTask(selectedTask.id, { end: event.target.value })} />
              </label>
            </div>
            <label>
              Estado
              <select value={selectedTask.status} onChange={(event) => updateTask(selectedTask.id, { status: event.target.value as Status })}>
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <label>
              Avance {selectedTask.progress}%
              <input
                type="range"
                min="0"
                max="100"
                value={selectedTask.progress}
                onChange={(event) => updateTask(selectedTask.id, { progress: clampProgress(Number(event.target.value)) })}
              />
            </label>
            <label>
              {getDependencyLabel(selectedTask)}
              <input
                placeholder={getDependencyValue(selectedTask)}
                value={selectedTask.dependency}
                onChange={(event) => updateTask(selectedTask.id, { dependency: event.target.value })}
              />
            </label>
            <div className="detail-strip">
              <span>{selectedTask.phase}</span>
              <span>{diffDays(selectedTask.start, selectedTask.end) + 1} días</span>
              {selectedTask.cadence && <span>{selectedTask.cadence}</span>}
            </div>
          </aside>
        )}
      </section>
    </main>
  )
}

export default App
