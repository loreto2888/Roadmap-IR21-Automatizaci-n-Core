import { Fragment, startTransition, useDeferredValue, useEffect, useState } from 'react'
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
  resource?: string
  start: string
  end: string
  duration?: string
  dependency: string
  progress: number
  status: Status
  cadence?: string
  source: string
}

const todayIso = '2026-07-12'
const storageKey = 'ir21-gantt-live-v4'

function statusFromDates(start: string, end: string): Status {
  if (toDate(end) < toDate(todayIso)) return 'Listo'
  if (toDate(start) <= toDate(todayIso)) return 'En curso'
  return 'Pendiente'
}

function projectTask(
  id: string,
  title: string,
  phase: string,
  duration: string,
  start: string,
  end: string,
  dependency = '',
  resource = '',
): Task {
  return {
    id,
    title,
    phase,
    owner: '',
    resource,
    start,
    end,
    duration,
    dependency,
    progress: statusFromDates(start, end) === 'Listo' ? 100 : statusFromDates(start, end) === 'En curso' ? 40 : 0,
    status: statusFromDates(start, end),
    source: 'Proyecto IR21',
  }
}

const initialTasks: Task[] = [
  projectTask('2', 'Gestión, seguimiento y control del proyecto', '0. Gestión y Gobierno del Proyecto', '98 días', '2026-07-13', '2026-11-30', '', 'Intellicore-Entel'),
  projectTask('3', 'Gobernanza, riesgos, dependencias y comités', '0. Gestión y Gobierno del Proyecto', '101 días', '2026-07-08', '2026-11-30', '', 'Intellicore-Entel'),
  projectTask('4', '◆ Hito: Gobernanza Operativa', '0. Gestión y Gobierno del Proyecto', '0 días', '2026-11-30', '2026-11-30', '2;3', 'Intellicore-Entel'),
  projectTask('7', 'Kickoff, alcance y levantamiento de requerimientos', '1. Inicio y Planificación', '52 días', '2026-04-13', '2026-06-23', '', 'Intellicore-Entel'),
  projectTask('8', 'Planificación, backlog, roadmap y cronograma', '1. Inicio y Planificación', '21 días', '2026-06-11', '2026-07-10', '', 'Intellicore-Entel'),
  projectTask('9', '◆ Hito: Plan del Proyecto Aprobado', '1. Inicio y Planificación', '1 día', '2026-07-13', '2026-07-13', '7;8', 'Intellicore-Entel'),
  projectTask('11', 'Diseño HLD y arquitectura de la solución', '2. Arquitectura y Diseño', '30 días', '2026-04-20', '2026-05-29', '', 'Intellicore'),
  projectTask('12', 'Validaciones técnicas y arquitectura objetivo', '2. Arquitectura y Diseño', '30 días', '2026-06-01', '2026-07-13', '11', 'Intellicore'),
  projectTask('13', '◆ Hito: Arquitectura y solución validada', '2. Arquitectura y Diseño', '0 días', '2026-07-13', '2026-07-13', '11;12', 'Intellicore-Entel'),
  projectTask('15', 'Entrega VM', '3. Infraestructura y Accesos', '40 días', '2026-04-27', '2026-06-19', '', 'Entel'),
  projectTask('16', 'Implementación de infraestructura, red y almacenamiento', '3. Infraestructura y Accesos', '30 días', '2026-06-22', '2026-08-04', '15', 'Intellicore-Entel'),
  projectTask('17', '◆ Hito: Infraestructura disponible', '3. Infraestructura y Accesos', '0 días', '2026-08-04', '2026-08-04', '15;16', 'Intellicore-Entel'),
  projectTask('19', 'Desarrollo de integración IR21–OSVI', '4. Integración IR21 – OSVI / PSG / Firewall', '10 días', '2026-08-05', '2026-08-18', '14', 'Intellicore'),
  projectTask('20', 'Desarrollo de integración IR21–PSG', '4. Integración IR21 – OSVI / PSG / Firewall', '10 días', '2026-08-19', '2026-09-01', '19', 'Intellicore'),
  projectTask('21', 'Desarrollo de integración IR21–Firewall', '4. Integración IR21 – OSVI / PSG / Firewall', '15 días', '2026-09-02', '2026-09-23', '20', 'Intellicore'),
  projectTask('22', '◆ Hito: Integración Implementada IR21', '4. Integración IR21 – OSVI / PSG / Firewall', '0 días', '2026-09-23', '2026-09-23', '19;20;21', 'Intellicore-Entel'),
  projectTask('24', 'Configuración de Splunk y monitoreo', '5. Observabilidad y Monitoreo', '10 días', '2026-09-02', '2026-09-15', '20', 'Intellicore'),
  projectTask('25', 'Dashboards, alertas e indicadores', '5. Observabilidad y Monitoreo', '15 días', '2026-09-16', '2026-10-07', '24', 'Intellicore'),
  projectTask('26', '◆ Hito: Observabilidad Operativa', '5. Observabilidad y Monitoreo', '0 días', '2026-06-26', '2026-06-26', '', 'Intellicore'),
  projectTask('28', 'Pruebas funcionales, técnicas e integración', '6. Pruebas y Validaciones', '10 días', '2026-10-08', '2026-10-22', '18;23', 'Intellicore'),
  projectTask('29', 'Corrección de incidencias y UAT', '6. Pruebas y Validaciones', '15 días', '2026-10-23', '2026-11-12', '28', 'Intellicore'),
  projectTask('30', '◆ Hito: UAT Aprobada', '6. Pruebas y Validaciones', '0 días', '2026-11-12', '2026-11-12', '28;29', 'Intellicore-Entel'),
  projectTask('32', 'Documentación técnica, operativa y manuales', '7. Documentación y Transferencia', '10 días', '2026-10-08', '2026-10-22', '23', 'Intellicore'),
  projectTask('33', 'Capacitación y transferencia al equipo operativo', '7. Documentación y Transferencia', '5 días', '2026-10-23', '2026-10-29', '32', 'Intellicore'),
  projectTask('34', '◆ Hito: Documentación Aprobada', '7. Documentación y Transferencia', '0 días', '2026-10-22', '2026-10-22', '32', 'Intellicore-Entel'),
  projectTask('36', 'Despliegue y Go Live', '8. Implementación Productiva', '2 días', '2026-11-13', '2026-11-16', '27', 'Entel'),
  projectTask('37', 'Estabilización y soporte post implementación', '8. Implementación Productiva', '2 días', '2026-11-17', '2026-11-18', '36', 'Intellicore-Entel'),
  projectTask('38', 'Marcha Blanca', '8. Implementación Productiva', '5 días', '2026-11-19', '2026-11-25', '36;37', 'Entel'),
  projectTask('39', '◆ Hito: Go Live Exitoso', '8. Implementación Productiva', '0 días', '2026-11-25', '2026-11-25', '36;37;38'),
  projectTask('41', 'Cierre administrativo y técnico', '9. Cierre del Proyecto', '2 días', '2026-11-26', '2026-11-27', '39', 'Entel'),
  projectTask('42', 'Aceptación formal', '9. Cierre del Proyecto', '1 día', '2026-11-30', '2026-11-30', '41', 'Entel'),
  projectTask('43', '◆ Hito: Proyecto Cerrado', '9. Cierre del Proyecto', '0 días', '2026-11-30', '2026-11-30', '41;42', 'Entel'),
]

const phaseSummaries: Record<string, { duration: string; start: string; end: string }> = {
  '0. Gestión y Gobierno del Proyecto': { duration: '101 días', start: '2026-07-08', end: '2026-11-30' },
  '1. Inicio y Planificación': { duration: '65 días', start: '2026-04-13', end: '2026-07-13' },
  '2. Arquitectura y Diseño': { duration: '60 días', start: '2026-04-20', end: '2026-07-13' },
  '3. Infraestructura y Accesos': { duration: '70 días', start: '2026-04-27', end: '2026-08-04' },
  '4. Integración IR21 – OSVI / PSG / Firewall': { duration: '35 días', start: '2026-08-05', end: '2026-09-23' },
  '5. Observabilidad y Monitoreo': { duration: '71 días', start: '2026-06-26', end: '2026-10-07' },
  '6. Pruebas y Validaciones': { duration: '25 días', start: '2026-10-08', end: '2026-11-12' },
  '7. Documentación y Transferencia': { duration: '15 días', start: '2026-10-08', end: '2026-10-29' },
  '8. Implementación Productiva': { duration: '9 días', start: '2026-11-13', end: '2026-11-25' },
  '9. Cierre del Proyecto': { duration: '3 días', start: '2026-11-26', end: '2026-11-30' },
}

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

function formatProjectDate(iso: string) {
  const weekdays = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
  const date = toDate(iso)
  const [year, month, day] = iso.split('-')
  return `${weekdays[date.getDay()]} ${day}-${month}-${year}`
}

function durationLabel(start: string, end: string) {
  const days = diffDays(start, end)
  return `${days} ${days === 1 ? 'día' : 'días'}`
}

function taskDuration(task: Task) {
  return task.duration ?? durationLabel(task.start, task.end)
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
  return ''
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
    const haystack = `${task.id} ${task.title} ${task.resource ?? ''} ${task.owner} ${task.phase} ${getThirdValue(task)} ${getDependencyValue(task)}`.toLowerCase()
    const matchesQuery = haystack.includes(deferredQuery.toLowerCase())
    const matchesPhase = phaseFilter === 'Todas' || task.phase === phaseFilter
    const matchesStatus = statusFilter === 'Todos' || task.status === statusFilter
    return matchesQuery && matchesPhase && matchesStatus
  })
  const overdueTasks = visibleTasks.filter((task) => toDate(task.end) < toDate(todayIso))
  const regularTasks = visibleTasks.filter((task) => toDate(task.end) >= toDate(todayIso))
  const overdueStart = overdueTasks.reduce((min, task) => (toDate(task.start) < toDate(min) ? task.start : min), overdueTasks[0]?.start ?? todayIso)
  const overdueEnd = overdueTasks.reduce((max, task) => (toDate(task.end) > toDate(max) ? task.end : max), overdueTasks[0]?.end ?? todayIso)
  const groupedTasks = Array.from(new Set(regularTasks.map((task) => task.phase))).map((phase) => ({
    phase,
    tasks: regularTasks.filter((task) => task.phase === phase),
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
              <span>Nombres de los recursos</span>
              <span>Cronograma</span>
            </div>
            {overdueTasks.length > 0 && (
              <section className="phase-group overdue-group">
                <div className="phase-summary overdue-summary">
                  <span>▸ Atrasadas</span>
                  <span>{overdueTasks.length} tareas</span>
                  <span>{formatProjectDate(overdueStart)}</span>
                  <span>{formatProjectDate(overdueEnd)}</span>
                  <span />
                  <span />
                  <span />
                </div>
                {overdueTasks.map((task) => {
                  const left = (diffDays(timelineStart, task.start) / totalDays) * 100
                  const width = Math.max(0.8, (Math.max(1, diffDays(task.start, task.end) + 1) / totalDays) * 100)
                  const isSelected = selectedTask?.id === task.id

                  return (
                    <button
                      type="button"
                      key={`overdue-${task.id}`}
                      className={`gantt-row overdue-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedId(task.id)}
                    >
                      <span className="task-copy">
                        <span>{task.title}</span>
                      </span>
                      <span className="duration-meta">{taskDuration(task)}</span>
                      <span className="date-meta">{formatProjectDate(task.start)}</span>
                      <span className="date-meta">{formatProjectDate(task.end)}</span>
                      <span className="predecessor-meta">{getDependencyValue(task)}</span>
                      <span className="resource-meta">{task.resource ?? ''}</span>
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
            )}
            {groupedTasks.map((group) => (
              <Fragment key={group.phase}>
                {group.phase === '1. Inicio y Planificación' && (
                  <div className="phase-summary parent-summary">
                    <span>▸ Desarrollo IR21</span>
                    <span>162 días</span>
                    <span>{formatProjectDate('2026-04-13')}</span>
                    <span>{formatProjectDate('2026-11-30')}</span>
                    <span />
                    <span />
                    <span />
                  </div>
                )}
                <section className="phase-group">
                  <div className="phase-summary">
                    <span>▸ {group.phase}</span>
                    <span>{phaseSummaries[group.phase]?.duration ?? durationLabel(group.tasks[0].start, group.tasks[group.tasks.length - 1].end)}</span>
                    <span>{formatProjectDate(phaseSummaries[group.phase]?.start ?? group.tasks[0].start)}</span>
                    <span>{formatProjectDate(phaseSummaries[group.phase]?.end ?? group.tasks[group.tasks.length - 1].end)}</span>
                    <span />
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
                          <span>{task.title}</span>
                        </span>
                        <span className="duration-meta">{taskDuration(task)}</span>
                        <span className="date-meta">{formatProjectDate(task.start)}</span>
                        <span className="date-meta">{formatProjectDate(task.end)}</span>
                        <span className="predecessor-meta">{getDependencyValue(task)}</span>
                        <span className="resource-meta">{task.resource ?? ''}</span>
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
              </Fragment>
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
