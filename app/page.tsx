"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { format, addDays, startOfMonth, endOfMonth, parse, differenceInHours, differenceInMinutes, getDaysInMonth, startOfWeek, endOfWeek, isSameMonth, isBefore, isAfter } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, Clock, AlertCircle, Lock } from "lucide-react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { createHash } from 'crypto'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type AñoFestivo = "2024" | "2025" | "2026" | "2027" | "2028" | "2029" | "2030" | "2031" | "2032" | "2033" | "2034" | "2035" | "2036" | "2037" | "2038" | "2039" | "2040"

type Festivos = Record<AñoFestivo, string[]>

// Interfaz para los datos de un día
interface DiaData {
  entrada1: string
  salida1: string
  entrada2: string
  salida2: string
  total: string
  isHoliday: boolean
  isSunday: boolean
}

// Interfaz para los cálculos de horas
interface CalculoHoras {
  horasNormales: number
  horasNocturnasLV: number
  horasDiurnasFestivos: number
  horasNocturnasFestivos: number
  horasExtDiurnasLV: number
  horasExtNocturnasLV: number
  horasExtDiurnasFestivos: number
  horasExtNocturnasFestivos: number
}

// Interfaz para el evento de cambio
interface ChangeEvent<T = Element> {
  target: EventTarget & T
}

interface EventTarget {
  value: string
}

// Utilidad para validar hora en formato HH:mm
const esHoraValida = (valor: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(valor)

// Function to format number with space as thousands separator and period as decimal
const formatNumberWithSpace = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) {
    return "0";
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) {
      return "0";
  }
  // Use toLocaleString with a locale that uses a comma for decimal and then replace
  // the comma with a period and the thousands separator (which is a period in many locales) with a space.
  // This might not be the most robust for all locales, but works for the requested format.
  // A more robust solution would involve manual string manipulation based on regex.
  // Let's try a simple approach first. Using 'en-US' which uses comma for thousands and period for decimal.
  // Then swap them. This is still not ideal.
  // Let's stick to es-CO and manually replace. es-CO uses '.' for thousands and ',' for decimals
  // So we want to replace '.' with ' ' and ',' with '.'

  const parts = num.toFixed(2).split('.'); // Split by the default decimal separator
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' '); // Add space as thousands separator
  const decimalPart = parts[1];

  return `${integerPart}.${decimalPart}`; // Join with period as decimal separator
};

// Modal de gestión de cargos
const ModalGestionCargos = ({ onClose, cargos, fetchCargos, cargoSeleccionado }: { onClose: () => void; cargos: Array<{ id: number; nombre: string; salario: number }>; fetchCargos: () => Promise<void>; cargoSeleccionado: string }) => {
  const [editandoCargo, setEditandoCargo] = useState<string | null>(null);
  const [valorEditando, setValorEditando] = useState("");
  const [editandoSalario, setEditandoSalario] = useState("");
  const [nuevoCargo, setNuevoCargo] = useState("");
  const [nuevoSalario, setNuevoSalario] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleNuevoCargoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Nuevo Cargo input changed:', e.target.value);
    const value = e.target.value.toUpperCase()
    setNuevoCargo(value)
  };

  const handleNuevoSalarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Nuevo Salario input changed:', e.target.value);
    const value = e.target.value.replace(/[^0-9]/g, '')
    setNuevoSalario(value)
  };

  const handleGuardarEdicion = async (cargoId: number) => {
    try {
      if (!valorEditando.trim() || !editandoSalario) {
        setError('El nombre y salario son requeridos');
        return;
      }

      const res = await fetch(`/api/cargos/${cargoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: valorEditando, 
          salario: Number(editandoSalario) 
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorMessage = errorData?.error || 'Error al actualizar cargo';
        throw new Error(errorMessage);
      }

      setEditandoCargo(null);
      setValorEditando("");
      setEditandoSalario("");
      setError(null);

      fetchCargos();

    } catch (err: any) {
      console.error('Error al actualizar cargo:', err);
      setError(err.message || 'Error al actualizar el cargo');
    }
  };

  const handleEliminarCargo = async (cargoId: number) => {
    try {
      const res = await fetch(`/api/cargos/${cargoId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorMessage = errorData?.error || 'Error al eliminar cargo';
        throw new Error(errorMessage);
      }

      setError(null);

      fetchCargos();

    } catch (err: any) {
      console.error('Error al eliminar cargo:', err);
      setError(err.message || 'Error al eliminar el cargo');
    }
  };

  const handleSubmitCargo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!nuevoCargo.trim() || !nuevoSalario) {
        setError('El nombre y salario son requeridos');
        return;
      }

      const res = await fetch('/api/cargos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: nuevoCargo, 
          salario: Number(nuevoSalario) 
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorMessage = errorData?.error || 'Error al crear cargo';
        throw new Error(errorMessage);
      }

      setNuevoCargo("");
      setNuevoSalario("");
      setError(null);
      fetchCargos();
      onClose();

    } catch (err: any) {
      console.error('Error al agregar cargo:', err);
      setError(err.message || 'Error al agregar el cargo');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-3xl relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-bomberored-800 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Gestión de Cargos
          </h2>
          <button
            className="text-gray-500 hover:text-bomberored-700 transition-colors"
            onClick={() => onClose()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <form
          className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200"
          onSubmit={handleSubmitCargo}
        >
          <div className="flex-1">
            <Label
              htmlFor="nuevoCargo"
              className="text-sm font-medium text-gray-700 mb-1 block"
            >
              Nuevo Cargo
            </Label>
            <input
              id="nuevoCargo"
              type="text"
              placeholder="Ingrese el nombre del cargo"
              value={nuevoCargo}
              onChange={handleNuevoCargoChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bomberored-700"
              required
              autoComplete="off"
              spellCheck="false"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  document.getElementById("nuevoSalario")?.focus();
                }
              }}
            />
          </div>
          <div className="w-full md:w-48">
            <Label
              htmlFor="nuevoSalario"
              className="text-sm font-medium text-gray-700 mb-1 block"
            >
              Salario
            </Label>
            <input
              id="nuevoSalario"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Salario"
              value={nuevoSalario}
              onChange={handleNuevoSalarioChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bomberored-700"
              required
              autoComplete="off"
              spellCheck="false"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full md:w-auto bg-bomberored-700 hover:bg-bomberored-800"
            >
              Agregar Cargo
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 font-bold text-sm text-gray-500 border-b border-gray-200 pb-2">
            <div className="col-span-4">CARGO</div>
            <div className="col-span-3">SALARIO</div>
            <div className="col-span-5 text-center">ACCIONES</div>
          </div>
          {Array.isArray(cargos) && cargos.map((cargo) => {
            console.log('Rendering cargo:', cargo);
            return (
              <div
                key={cargo.id}
                className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100"
              >
                <div className="col-span-4">
                  {editandoCargo === cargo.id.toString() ? (
                    <input
                      type="text"
                      value={valorEditando}
                      onChange={(e) =>
                        setValorEditando(e.target.value.toUpperCase())
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bomberored-700"
                      autoComplete="off"
                      spellCheck="false"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleGuardarEdicion(cargo.id);
                        }
                      }}
                    />
                  ) : (
                    <span className="font-medium text-gray-900">
                      {cargo.nombre}
                    </span>
                  )}
                </div>
                <div className="col-span-3 flex items-center relative">
                  {editandoCargo === cargo.id.toString() ? (
                     <input
                       type="text"
                       inputMode="numeric"
                       pattern="[0-9]*"
                       value={editandoSalario}
                       onChange={(e) => setEditandoSalario(e.target.value.replace(/[^0-9]/g, ''))}
                       className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bomberored-700"
                       autoComplete="off"
                       spellCheck="false"
                       onKeyDown={(e) => {
                         if (e.key === "Enter") {
                           e.preventDefault();
                           handleGuardarEdicion(cargo.id);
                         }
                       }}
                     />
                  ) : (
                    <div className="text-gray-900 overflow-hidden text-ellipsis">
                      $ {cargo.salario ? formatNumberWithSpace(cargo.salario) : "0.00"}
                    </div>
                  )}
                </div>
                <div className="col-span-5 flex items-center justify-end gap-2">
                  {editandoCargo === cargo.id.toString() ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGuardarEdicion(cargo.id)}
                      >
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditandoCargo(null);
                          setValorEditando("");
                          setEditandoSalario("");
                          setError(null);
                        }}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditandoCargo(cargo.id.toString());
                          setValorEditando(cargo.nombre);
                          // Reset salario editing when editing name
                          setEditandoSalario("");
                        }}
                      >
                        Editar Nombre
                      </Button>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => {
                           setEditandoCargo(cargo.id.toString());
                           setValorEditando(cargo.nombre);
                           setEditandoSalario(cargo.salario.toString());
                         }}
                       >
                         Editar Salario
                       </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          handleEliminarCargo(cargo.id);
                        }}
                        disabled={cargo.nombre === cargoSeleccionado}
                      >
                        Eliminar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function ControlHorasExtras() {
  const [fechaInicio, setFechaInicio] = useState<Date>(startOfMonth(new Date()))
  const [festivos, setFestivos] = useState<{ fecha: string; nombre: string; tipo: 'FIJO' | 'MOVIL' }[]>([])
  const [diasMes, setDiasMes] = useState<{ [key: string]: DiaData }>({})
  const [cargoSeleccionado, setCargoSeleccionado] = useState("BOMBERO")
  const [salarioMensual, setSalarioMensual] = useState(2054865)
  const [totalHorasMes, setTotalHorasMes] = useState(0)
  const [totalRecargos, setTotalRecargos] = useState(0)
  const [totalHorasExtras, setTotalHorasExtras] = useState(0)
  const [totalAPagar, setTotalAPagar] = useState(0)
  const [tiempoCompensatorio, setTiempoCompensatorio] = useState(0)
  const [calculoHoras, setCalculoHoras] = useState<CalculoHoras>({
    horasNormales: 0,
    horasNocturnasLV: 0,
    horasDiurnasFestivos: 0,
    horasNocturnasFestivos: 0,
    horasExtDiurnasLV: 0,
    horasExtNocturnasLV: 0,
    horasExtDiurnasFestivos: 0,
    horasExtNocturnasFestivos: 0,
  })
  const [semanaActual, setSemanaActual] = useState(0)
  const [mostrarModalCargos, setMostrarModalCargos] = useState(false)
  const [mostrarModalAuth, setMostrarModalAuth] = useState(false)
  const [cargosState, setCargosState] = useState<{ id: number; nombre: string; salario: number }[]>([])
  const [accessLogs, setAccessLogs] = useState<Array<{ id: number; ip: string; fecha: string }>>([]);
  const [editando, setEditando] = useState<string | null>(null)
  const [focusedInput, setFocusedInput] = useState<'cargo' | 'salario' | null>(null)
  const inputCargoRef = useRef<HTMLInputElement>(null)
  const inputSalarioRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'registro' | 'calculos'>('registro')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [topeFecha, setTopeFecha] = useState<string | null>(null)
  const [topeHora, setTopeHora] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [errorAuth, setErrorAuth] = useState("")
  const passwordRef = useRef<HTMLInputElement>(null)
  const [fetchedFestivosState, setFetchedFestivosState] = useState<any[]>([])

  useEffect(() => {
    console.log('Registering access...');
    fetch('/api/registrar-acceso', { method: 'POST' });
  }, []);

  const fetchCargos = useCallback(async () => {
    console.log('Attempting to fetch cargos...');
    try {
      const res = await fetch('/api/cargos');
      if (!res.ok) {
        console.error('Error fetching cargos: HTTP status', res.status);
        // You might want to throw an error or handle this case
        return; 
      }
      const data = await res.json();
      console.log('Fetched cargos data:', data);
      if (data && Array.isArray(data.cargos)) {
         setCargosState(data.cargos);
         console.log('Cargos state updated with:', data.cargos);
      } else {
         console.error('Fetched data is not an array or does not contain a cargos array:', data);
         setCargosState([]); // Set to empty array if data is not as expected
      }
    } catch (err) {
      console.error('Error al obtener cargos:', err);
    }
  }, [setCargosState]);

  useEffect(() => {
    console.log('useEffect in ControlHorasExtras triggered.');
    fetchCargos();
  }, [fetchCargos]);

  // Function to fetch access logs
  const fetchAccessLogs = useCallback(async () => {
    console.log('Attempting to fetch access logs...');
    try {
      const res = await fetch('/api/accesos');
      if (!res.ok) {
        console.error('Error fetching access logs: HTTP status', res.status);
        return;
      }
      const data = await res.json();
      console.log('Fetched access logs data:', data);
      if (data && Array.isArray(data.accesos)) {
        setAccessLogs(data.accesos);
        console.log('Access logs state updated with:', data.accesos);
      } else {
        console.error('Fetched data is not an array or does not contain an accesos array:', data);
        setAccessLogs([]); // Set to empty array if data is not as expected
      }
    } catch (err) {
      console.error('Error al obtener logs de acceso:', err);
    }
  }, [setAccessLogs]);

  // Fetch access logs when the component mounts
  useEffect(() => {
    console.log('useEffect for fetching access logs triggered.');
    fetchAccessLogs();
  }, [fetchAccessLogs]);

  // Función para formatear minutos a horas:minutos
  const formatTime = (minutos: number) => {
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // Calcular las semanas del mes
  const semanasDelMes = (() => {
    const semanas = []
    const primerDia = startOfMonth(fechaInicio)
    const ultimoDia = endOfMonth(fechaInicio)
    let inicio = startOfWeek(primerDia, { weekStartsOn: 1 })
    while (inicio <= ultimoDia) {
      const fin = endOfWeek(inicio, { weekStartsOn: 1 })
      semanas.push({ inicio: new Date(inicio), fin: new Date(fin) })
      inicio = addDays(fin, 1)
    }
    return semanas
  })()

  // Verificar si una fecha es festivo
  const esDiaFestivo = (fecha: Date, fetchedFestivos: any[]): boolean => {
    const fechaStr = format(fecha, "yyyy-MM-dd")
    return fetchedFestivos.some(f => f.fecha === fechaStr);
  }

  // Obtener los días de la semana actual
  const diasSemanaActual = (() => {
    const semana = semanasDelMes[semanaActual]
    const dias: Date[] = []
    if (!semana) {
      console.log('Semana object is undefined, returning empty days array.'); // Log si semana es undefined
      return dias; // Retornar array vacío si semana no está definida
    }
    console.log(`Generating days for week starting: ${semana.inicio}`); // Log inicio de semana
    for (let i = 0; i < 7; i++) {
      const fecha = addDays(semana.inicio, i)
      dias.push(fecha)
      const fechaStr = format(fecha, "yyyy-MM-dd");
      const esFestivo = esDiaFestivo(fecha, fetchedFestivosState);
      console.log(`Date: ${fechaStr}, isHoliday: ${esFestivo}`); // Log si el día se identifica como festivo
    }
    return dias
  })()

  // Inicializar los días del mes
  useEffect(() => {
    const nuevoDiasMes: { [key: string]: DiaData } = {}
    const primerDia = startOfMonth(fechaInicio)
    const ultimoDia = endOfMonth(fechaInicio)
    const diasEnMes = getDaysInMonth(fechaInicio)

    for (let i = 0; i < diasEnMes; i++) {
      const fecha = addDays(primerDia, i)
      const fechaStr = format(fecha, "yyyy-MM-dd")
      const isHoliday = esDiaFestivo(fecha, fetchedFestivosState);

      nuevoDiasMes[fechaStr] = {
        entrada1: "",
        salida1: "",
        entrada2: "",
        salida2: "",
        total: "",
        isHoliday: isHoliday,
        isSunday: fecha.getDay() === 0,
      }
    }

    setDiasMes(nuevoDiasMes)
  }, [fechaInicio, fetchedFestivosState])

  // Manejar cambio de cargo
  const handleCambiarCargo = (valor: string) => {
    if (valor === 'default') return;
    setCargoSeleccionado(valor);
    const cargo = cargosState.find((c) => c.nombre === valor);
    if (cargo) {
      setSalarioMensual(cargo.salario);
    }
  }

  // Manejar cambio de entrada/salida para ambos turnos
  const handleCambioHora = (fecha: string, tipo: "entrada1" | "salida1" | "entrada2" | "salida2", valor: string) => {
    setDiasMes((prev) => {
      const nuevoDiasMes = { ...prev }
      nuevoDiasMes[fecha] = {
        ...nuevoDiasMes[fecha],
        [tipo]: valor,
      }

      // Solo calcular total si ambos valores son válidos
      let totalMinutos = 0
      try {
        // Primer turno
        if (esHoraValida(nuevoDiasMes[fecha].entrada1) && esHoraValida(nuevoDiasMes[fecha].salida1)) {
          const horaEntrada1 = parse(nuevoDiasMes[fecha].entrada1, "HH:mm", new Date())
          let horaSalida1 = parse(nuevoDiasMes[fecha].salida1, "HH:mm", new Date())
          let minutos1 = differenceInMinutes(horaSalida1, horaEntrada1)
          if (minutos1 < 0) minutos1 = minutos1 + 24 * 60 // Ajustar si pasa a otro día
          totalMinutos += minutos1
        }
        // Segundo turno
        if (esHoraValida(nuevoDiasMes[fecha].entrada2) && esHoraValida(nuevoDiasMes[fecha].salida2)) {
          const horaEntrada2 = parse(nuevoDiasMes[fecha].entrada2, "HH:mm", new Date())
          let horaSalida2 = parse(nuevoDiasMes[fecha].salida2, "HH:mm", new Date())
          let minutos2 = differenceInMinutes(horaSalida2, horaEntrada2)
          if (minutos2 < 0) minutos2 = minutos2 + 24 * 60 // Ajustar si pasa a otro día
          totalMinutos += minutos2
        }
        // Convertir minutos totales a horas y minutos
        const horas = Math.floor(totalMinutos / 60)
        const minutos = totalMinutos % 60
        nuevoDiasMes[fecha].total = totalMinutos > 0 ? `${horas}:${minutos.toString().padStart(2, '0')}` : ""
      } catch (error) {
        nuevoDiasMes[fecha].total = "Error"
      }

      return nuevoDiasMes
    })
  }

  // Manejar cambio de fecha
  const handleCambioFecha = (fecha: string) => {
    const nuevaFecha = new Date(fecha)
    setFechaInicio(startOfMonth(nuevaFecha))
  }

  // Calcular todas las horas y recargos
  const calcularHorasYRecargos = () => {
    let totalMinutos = 0
    let recNocturno = 0 // L-S (18:00-06:00) hasta 190h
    let recDomNoct = 0  // Dom/fest (18:00-06:00) hasta 190h
    let recDomDia = 0   // Dom/fest (06:00-18:00) hasta 190h
    let extDia = 0      // L-S (06:00-18:00) desde 191h
    let extNoct = 0     // L-S (18:00-06:00) desde 191h
    let extDomDia = 0   // Dom/fest (06:00-18:00) desde 191h
    let extDomNoct = 0  // Dom/fest (18:00-06:00) desde 191h
    let topeAlcanzado = false
    let topeFechaLocal: string | null = null
    let topeHoraLocal: string | null = null
    const valorHora = salarioMensual / 190
    const valorMinuto = valorHora / 60
    const topeMaximo = salarioMensual * 0.5
    let dineroExtrasAcumulado = 0
    let excedente = 0
    let minutosCompensar = 0

    // Procesar cada día con datos
    Object.entries(diasMes).forEach(([fecha, dia]) => {
      if (dia.total === "Error") return
      const fechaDate = parse(fecha, "yyyy-MM-dd", new Date())
      const esFestivo = esDiaFestivo(fechaDate, fetchedFestivosState);
      const esFestivoODomingo = esFestivo || dia.isSunday; // Combine holiday and Sunday check
      // Procesar ambos turnos
      const turnos = [
        { entrada: dia.entrada1, salida: dia.salida1 },
        { entrada: dia.entrada2, salida: dia.salida2 },
      ]
      turnos.forEach(({ entrada, salida }) => {
        if (!entrada || !salida) return
        let horaEntrada = parse(entrada, "HH:mm", fechaDate)
        let horaSalida = parse(salida, "HH:mm", fechaDate)
        if (horaSalida < horaEntrada) horaSalida = addDays(horaSalida, 1)
        let horaActual = new Date(horaEntrada)
        while (horaActual < horaSalida) {
          const horaFin = new Date(horaActual)
          horaFin.setMinutes(horaFin.getMinutes() + 1)
          const h = horaActual.getHours()
          const esNocturno = h >= 18 || h < 6
          const esDiurno = h >= 6 && h < 18
          totalMinutos++

          if (totalMinutos <= 190 * 60) {
            // RECARGOS
            if (!esFestivoODomingo && esNocturno) recNocturno++ // L-S (18:00-06:00) 35%
            if (esFestivoODomingo && esNocturno) recDomNoct++   // Dom/fest (18:00-06:00) 235%
            if (esFestivoODomingo && esDiurno) recDomDia++      // Dom/fest (06:00-18:00) 200%
          } else {
            // HORAS EXTRAS
            let valorEsteMinuto = 0
            if (!esFestivoODomingo && esDiurno) { extDia++; valorEsteMinuto = valorMinuto * 1.25 } // L-S (06:00-18:00) 125%
            if (!esFestivoODomingo && esNocturno) { extNoct++; valorEsteMinuto = valorMinuto * 1.75 } // L-S (18:00-06:00) 175%
            if (esFestivoODomingo && esDiurno) { extDomDia++; valorEsteMinuto = valorMinuto * 2.25 } // Dom/fest (06:00-18:00) 225%
            if (esFestivoODomingo && esNocturno) { extDomNoct++; valorEsteMinuto = valorMinuto * 2.75 } // Dom/fest (18:00-06:00) 275%
            if (dineroExtrasAcumulado < topeMaximo) {
              dineroExtrasAcumulado += valorEsteMinuto
              if (dineroExtrasAcumulado >= topeMaximo && !topeAlcanzado) {
                topeAlcanzado = true
                topeFechaLocal = format(horaActual, 'yyyy-MM-dd')
                topeHoraLocal = format(horaActual, 'HH:mm')
                excedente = dineroExtrasAcumulado - topeMaximo
              }
            } else {
              // Excedente para compensatorio
              minutosCompensar++
            }
          }
          horaActual = horaFin
        }
      })
    })

    // Calcular valores monetarios
    const valorRecargoNocturnoLV = valorMinuto * recNocturno * 0.35
    const valorRecargoNocturnoFestivo = valorMinuto * recDomNoct * 2.35
    const valorRecargoDiurnoFestivo = valorMinuto * recDomDia * 2.0
    const valorExtraDiurnaLV = valorMinuto * extDia * 1.25
    const valorExtraNocturnaLV = valorMinuto * extNoct * 1.75
    const valorExtraDiurnaFestivo = valorMinuto * extDomDia * 2.25
    const valorExtraNocturnaFestivo = valorMinuto * extDomNoct * 2.75

    const totalRecargosCalculado = valorRecargoNocturnoLV + valorRecargoNocturnoFestivo + valorRecargoDiurnoFestivo
    const totalExtrasCalculado = valorExtraDiurnaLV + valorExtraNocturnaLV + valorExtraDiurnaFestivo + valorExtraNocturnaFestivo

    // Tope: solo aplica a extras
    let pagoExtras = totalExtrasCalculado
    let horasCompensatorias = 0
    if (dineroExtrasAcumulado > topeMaximo) {
      pagoExtras = topeMaximo
      // Convertir el excedente a tiempo compensatorio (en minutos)
      horasCompensatorias = minutosCompensar > 0 ? Math.floor(minutosCompensar / 60) : 0
    }

    setTotalHorasMes(totalMinutos)
    setTotalRecargos(totalRecargosCalculado)
    setTotalHorasExtras(pagoExtras)
    setTotalAPagar(totalRecargosCalculado + pagoExtras)
    setTiempoCompensatorio(horasCompensatorias)
    setTopeFecha(topeFechaLocal)
    setTopeHora(topeHoraLocal)
    setCalculoHoras({
      horasNormales: Math.min(totalMinutos, 190 * 60) - recNocturno - recDomNoct - recDomDia,
      horasNocturnasLV: recNocturno,
      horasDiurnasFestivos: recDomDia,
      horasNocturnasFestivos: recDomNoct,
      horasExtDiurnasLV: extDia,
      horasExtNocturnasLV: extNoct,
      horasExtDiurnasFestivos: extDomDia,
      horasExtNocturnasFestivos: extDomNoct,
    })
  }

  // Navegar al mes anterior
  const irMesAnterior = () => {
    const nuevoMes = new Date(fechaInicio)
    nuevoMes.setMonth(nuevoMes.getMonth() - 1)
    setFechaInicio(startOfMonth(nuevoMes))
  }

  // Navegar al mes siguiente
  const irMesSiguiente = () => {
    const nuevoMes = new Date(fechaInicio)
    nuevoMes.setMonth(nuevoMes.getMonth() + 1)
    setFechaInicio(startOfMonth(nuevoMes))
  }

  // Limpiar todos los datos
  const limpiarTodo = () => {
    const nuevoDiasMes = { ...diasMes }
    Object.keys(nuevoDiasMes).forEach((fecha) => {
      nuevoDiasMes[fecha] = {
        ...nuevoDiasMes[fecha],
        entrada1: "",
        salida1: "",
        entrada2: "",
        salida2: "",
        total: "",
      }
    })
    setDiasMes(nuevoDiasMes)
  }

  // Función para generar hash de la contraseña
  const generateHash = (text: string) => {
    return createHash('sha256').update(text).digest('hex')
  }

  // Función para manejar la autenticación
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    const hashedPassword = generateHash(password)
    const correctHash = generateHash("AdminBomberos2025")
    
    if (hashedPassword === correctHash) {
      setMostrarModalAuth(false)
      setMostrarModalCargos(true)
      setPassword("")
      setErrorAuth("")
    } else {
      setErrorAuth("Contraseña incorrecta")
    }
  }

  // Modal de autenticación
  const ModalAuth = () => {
    useEffect(() => {
      if (mostrarModalAuth) {
        setTimeout(() => {
          passwordRef.current?.focus()
        }, 0)
      }
    }, [mostrarModalAuth])

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-bomberored-800 flex items-center gap-2">
              <Lock className="w-6 h-6" />
              Autenticación
            </h2>
            <button 
              className="text-gray-500 hover:text-bomberored-700 transition-colors"
              onClick={() => {
                setMostrarModalAuth(false)
                setPassword("")
                setErrorAuth("")
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1 block">
                Contraseña
              </Label>
              <Input
                ref={passwordRef}
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                placeholder="Ingrese la contraseña"
                required
                autoComplete="off"
              />
              {errorAuth && (
                <p className="text-red-500 text-sm mt-1">{errorAuth}</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-bomberored-700 hover:bg-bomberored-800">
              Acceder
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // Calcula los valores monetarios individuales para cada tipo de recargo y hora extra justo antes del return
  const valorHora = salarioMensual / 190
  const valorMinuto = valorHora / 60
  const valorRecargoNocturnoLV = valorMinuto * calculoHoras.horasNocturnasLV * 0.35
  const valorRecargoNocturnoFestivo = valorMinuto * calculoHoras.horasNocturnasFestivos * 2.35
  const valorRecargoDiurnoFestivo = valorMinuto * calculoHoras.horasDiurnasFestivos * 2.0
  const valorExtraDiurnaLV = valorMinuto * calculoHoras.horasExtDiurnasLV * 1.25
  const valorExtraNocturnaLV = valorMinuto * calculoHoras.horasExtNocturnasLV * 1.75
  const valorExtraDiurnaFestivo = valorMinuto * calculoHoras.horasExtDiurnasFestivos * 2.25
  const valorExtraNocturnaFestivo = valorMinuto * calculoHoras.horasExtNocturnasFestivos * 2.75

  useEffect(() => {
    const loadFestivos = async () => {
      try {
        console.log('Fetching holidays from /api/festivos...'); // Log de inicio de fetch
        const res = await fetch('/api/festivos');
        if (!res.ok) {
          console.error('Error fetching holidays: HTTP status', res.status);
          return;
        }
        const data = await res.json();
        console.log('Fetched raw data:', data); // Log datos crudos
        if (data && Array.isArray(data.festivos)) {
          // Formatear la fecha de cada festivo a "yyyy-MM-dd"
          const formattedFestivos = data.festivos.map((f: { fecha: string | Date; nombre: string; tipo: 'FIJO' | 'MOVIL' }) => {
            // Use parse to correctly interpret the date string in the local timezone
            const dateObj = parse(f.fecha as string, "yyyy-MM-dd", new Date()); 
            const formattedDate = format(dateObj, "yyyy-MM-dd"); // Format to string
            console.log(`Original date: ${f.fecha}, Date object (parsed): ${dateObj}, Formatted date: ${formattedDate}`); // Update log
            return {
              ...f,
              fecha: formattedDate
            };
          });
          setFetchedFestivosState(formattedFestivos);
          console.log('Fetched and formatted holidays:', formattedFestivos); // Add this line
          console.log('Holidays loaded successfully. Total:', formattedFestivos.length); // Log success and quantity
        } else {
          console.error('Fetched data does not contain a festivos array or is not an array:', data); // Log error en formato
          setFestivos([]);
        }
      } catch (err) {
        console.error('Error loading holidays:', err);
        setFestivos([]); // Asegurarse de que festivos sea un array vacío en caso de error
      }
    };
    loadFestivos();
  }, []); // Este efecto se ejecuta solo una vez al montar el componente

  return (
    <div className="container mx-auto py-8 flex flex-col gap-8">
      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 w-fit mx-auto mb-4">
        <button
          className={`px-8 py-2 rounded-md font-bold transition-colors ${tab === 'registro' ? 'bg-white text-black shadow' : 'text-gray-500'}`}
          onClick={() => setTab('registro')}
        >
          Registro de Horas
        </button>
        <button
          className={`px-8 py-2 rounded-md font-bold transition-colors ${tab === 'calculos' ? 'bg-white text-black shadow' : 'text-gray-500'}`}
          onClick={() => setTab('calculos')}
        >
          Cálculos y Reportes
        </button>
      </div>
      {/* Registro de Horas */}
      {tab === 'registro' && (
        <>
          {mostrarModalAuth && <ModalAuth />}
          {mostrarModalCargos && (
            <ModalGestionCargos
              onClose={() => setMostrarModalCargos(false)}
              cargos={cargosState}
              fetchCargos={fetchCargos}
              cargoSeleccionado={cargoSeleccionado}
            />
          )}
          {/* Selección de mes */}
          <section className="bg-white rounded-2xl shadow-md p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-100">
            <div className="flex flex-col gap-2 w-fit">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-7 w-7 text-red-500" />
                <span className="text-2xl font-bold text-black">Seleccionar Mes</span>
              </div>
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-5 py-2 text-lg font-medium text-gray-700 shadow-sm hover:bg-gray-100 focus:ring-2 focus:ring-red-300 transition"
                  onClick={() => setShowDatePicker(true)}
                >
                  <Calendar className="flex items-center justify-center h-5 w-5 text-gray-400" />
                  <span>{format(fechaInicio, "MMMM 'de' yyyy", { locale: es })}</span>
                </button>
                {showDatePicker && (
                  <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-lg z-30">
                    <DatePicker
                      selected={fechaInicio}
                      onChange={(date: Date | null) => {
                        if (date) {
                          setFechaInicio(startOfMonth(date))
                        }
                        setShowDatePicker(false)
                      }}
                      onClickOutside={() => setShowDatePicker(false)}
                      dateFormat="MMMM yyyy"
                      showMonthYearPicker
                      inline
                      locale={es}
                    />
                  </div>
                )}
              </div>
            </div>
            <div>
              <button
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2 rounded-lg shadow-sm border border-red-500 transition-colors text-lg"
                onClick={limpiarTodo}
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar Todo
              </button>
            </div>
          </section>

          {/* Navegación de semanas */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
            <button
              className="bg-white border border-gray-300 text-black font-bold px-6 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              onClick={() => setSemanaActual((s) => Math.max(0, s - 1))}
              disabled={semanaActual === 0}
              type="button"
            >
              <span className="text-lg">&#8592;</span> Semana anterior
            </button>
            <div className="font-bold text-lg text-black text-center flex-1">
              Semana {semanaActual + 1} de {semanasDelMes.length}
            </div>
            <button
              className="bg-white border border-gray-300 text-black font-bold px-6 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 justify-end"
              onClick={() => setSemanaActual((s) => Math.min(semanasDelMes.length - 1, s + 1))}
              disabled={semanaActual === semanasDelMes.length - 1}
              type="button"
            >
              Semana siguiente <span className="text-lg">&#8594;</span>
            </button>
          </section>

          {/* Tabla de días (solo semana actual) */}
          <section className="bg-white rounded-lg shadow p-6">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-7 gap-4 font-bold mb-2 text-center text-black">
                  <div className="text-left">DÍA</div>
                  <div>ENTRADA 1</div>
                  <div>SALIDA 1</div>
                  <div>ENTRADA 2</div>
                  <div>SALIDA 2</div>
                  <div>TOTAL</div>
                  <div>FESTIVOS</div>
                </div>
                {diasSemanaActual.map((fechaDate, idx) => {
                  const fechaStr = format(fechaDate, "yyyy-MM-dd")
                  const nombreDia = format(fechaDate, "EEEE", { locale: es }).toUpperCase()
                  const fechaFormateada = format(fechaDate, "dd/MM/yyyy")
                  const esDelMes = isSameMonth(fechaDate, fechaInicio)
                  const dia = diasMes[fechaStr] || { entrada1: "", salida1: "", entrada2: "", salida2: "", total: "", isHoliday: false, isSunday: false }
                  const rowBg = idx % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]"
                  return (
                    <div
                      key={fechaStr}
                      className={cn(
                        "grid grid-cols-7 gap-4 mb-0 items-center rounded-lg border-b border-gray-200 py-2",
                        rowBg,
                        !esDelMes && "bg-gray-100 opacity-60"
                      )}
                    >
                      <div>
                        <div className="font-bold text-black text-sm">{nombreDia}</div>
                        <div className="text-gray-500 text-xs">{fechaFormateada}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={dia.entrada1}
                          onChange={(e) => handleCambioHora(fechaStr, "entrada1", e.target.value)}
                          readOnly={!esDelMes}
                          className={cn(
                            "text-center rounded-md px-2 py-1 text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bomberored-700 w-full",
                            !esDelMes ? "bg-[#FEF2F2] text-gray-400" : "bg-white"
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={dia.salida1}
                          onChange={(e) => handleCambioHora(fechaStr, "salida1", e.target.value)}
                          readOnly={!esDelMes}
                          className={cn(
                            "text-center rounded-md px-2 py-1 text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bomberored-700 w-full",
                            !esDelMes ? "bg-[#FEF2F2] text-gray-400" : "bg-white"
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={dia.entrada2}
                          onChange={(e) => handleCambioHora(fechaStr, "entrada2", e.target.value)}
                          readOnly={!esDelMes}
                          className={cn(
                            "text-center rounded-md px-2 py-1 text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bomberored-700 w-full",
                            !esDelMes ? "bg-[#FEF2F2] text-gray-400" : "bg-white"
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={dia.salida2}
                          onChange={(e) => handleCambioHora(fechaStr, "salida2", e.target.value)}
                          readOnly={!esDelMes}
                          className={cn(
                            "text-center rounded-md px-2 py-1 text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bomberored-700 w-full",
                            !esDelMes ? "bg-[#FEF2F2] text-gray-400" : "bg-white"
                          )}
                        />
                      </div>
                      <div className="text-center font-bold text-blue-900 text-base">
                        {dia.total || "0:00"}
                      </div>
                      <div className="flex justify-center">
                        {dia.isHoliday ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F44E4E] text-white font-bold text-sm">
                            <AlertCircle className="w-4 h-4" />
                            Festivo
                          </span>
                        ) : dia.isSunday ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500 text-white font-bold text-sm">
                            Domingo
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        </>
      )}
      {/* Cálculos y Reportes */}
      {tab === 'calculos' && (
        <>
          {mostrarModalAuth && <ModalAuth />}
          {mostrarModalCargos && (
            <ModalGestionCargos
              onClose={() => setMostrarModalCargos(false)}
              cargos={cargosState}
              fetchCargos={fetchCargos}
              cargoSeleccionado={cargoSeleccionado}
            />
          )}
          {/* Resumen y cálculos */}
          <section className="flex flex-col items-center gap-8 w-full">
            <div className="w-full flex flex-col md:flex-row gap-6">
              <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-2 min-w-[400px] md:min-w-[500px]">
                <div className="uppercase text-gray-500 font-bold text-sm mb-2">Total trabajo mensual</div>
                <div className="flex flex-row gap-4 justify-between">
                  <div>
                    <div className="text-xs text-gray-500 font-bold">Tiempo total</div>
                    <div className="text-2xl font-bold text-black">{formatTime(totalHorasMes)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold">Recargos</div>
                    <div className="text-2xl font-bold text-red-500 whitespace-nowrap">${formatNumberWithSpace(totalRecargos)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold">Horas Extras</div>
                    <div className="text-2xl font-bold text-red-500 whitespace-nowrap">${formatNumberWithSpace(totalHorasExtras)}</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4 min-w-[260px]">
                <div className="uppercase text-gray-500 font-bold text-sm mb-2">Calcular precio horas extras</div>
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-1">Cargo</div>
                  <Select value={cargoSeleccionado || 'default'} onValueChange={handleCambiarCargo}>
                    <SelectTrigger id="cargo">
                      <SelectValue placeholder="Seleccionar cargo" />
                    </SelectTrigger>
                    <SelectContent className="bg-white shadow-lg border border-gray-200 z-50">
                      {Array.isArray(cargosState) && cargosState.map((cargo) => (
                        <SelectItem key={cargo.id} value={cargo.nombre || 'default'}>
                          {cargo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-1">Salario mensual</div>
                  <div className="text-2xl font-bold text-black">$ {formatNumberWithSpace(salarioMensual)}</div>
                </div>
                <Button
                  id="btn-gestionar-cargos"
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium flex items-center justify-center gap-2"
                  type="button"
                  onClick={() => {
                    setMostrarModalAuth(true)
                    setPassword("")
                    setErrorAuth("")
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Gestionar Cargos
                </Button>
              </div>
              <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-2 min-w-[260px]">
                <div className="uppercase text-gray-500 font-bold text-sm mb-2">Resumen</div>
                <div className="flex flex-row gap-8 justify-between">
                  <div>
                    <div className="text-xs text-gray-500 font-bold">Total recargos y horas extras</div>
                    <div className="text-2xl font-bold text-red-500">${formatNumberWithSpace(totalAPagar)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold">Tiempo compensatorio</div>
                    <div className="text-2xl font-bold text-black">{tiempoCompensatorio} Horas</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 w-full justify-center mt-2">
              <button className="bg-red-500 hover:bg-red-500 text-white w-full md:w-auto px-10 py-4 text-lg font-bold rounded-lg shadow flex items-center gap-2 justify-center transition-colors" onClick={calcularHorasYRecargos} type="button">
                <Clock className="w-5 h-5" />
                CALCULAR HORAS Y RECARGOS
              </button>
            </div>
            <section className="w-full mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recargos */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
                <div className="uppercase text-bomberored-700 font-bold text-base mb-2">Recargos</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Nocturnas L-V</span>
                    <span>{formatTime(calculoHoras.horasNocturnasLV)} <span className="text-gray-400">(${formatNumberWithSpace(valorRecargoNocturnoLV)})</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Diurnas Festivo</span>
                    <span>{formatTime(calculoHoras.horasDiurnasFestivos)} <span className="text-gray-400">(${formatNumberWithSpace(valorRecargoDiurnoFestivo)})</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nocturnas Festivo</span>
                    <span>{formatTime(calculoHoras.horasNocturnasFestivos)} <span className="text-gray-400">(${formatNumberWithSpace(valorRecargoNocturnoFestivo)})</span></span>
                  </div>
                </div>
                <div className="font-bold text-right mt-2">Total Recargos: <span className="text-bomberored-700">${formatNumberWithSpace(totalRecargos)}</span></div>
              </div>

              {/* Horas Extras */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
                <div className="uppercase text-bomberored-700 font-bold text-base mb-2">Horas Extras</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Extra Diurna L-V</span>
                    <span>{formatTime(calculoHoras.horasExtDiurnasLV)} <span className="text-gray-400">(${formatNumberWithSpace(valorExtraDiurnaLV)})</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Extra Nocturna L-V</span>
                    <span>{formatTime(calculoHoras.horasExtNocturnasLV)} <span className="text-gray-400">(${formatNumberWithSpace(valorExtraNocturnaLV)})</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Extra Diurna Festivo</span>
                    <span>{formatTime(calculoHoras.horasExtDiurnasFestivos)} <span className="text-gray-400">(${formatNumberWithSpace(valorExtraDiurnaFestivo)})</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Extra Nocturna Festivo</span>
                    <span>{formatTime(calculoHoras.horasExtNocturnasFestivos)} <span className="text-gray-400">(${formatNumberWithSpace(valorExtraNocturnaFestivo)})</span></span>
                  </div>
                </div>
                <div className="font-bold text-right mt-2">Total Extras: <span className="text-bomberored-700">${formatNumberWithSpace(totalHorasExtras)}</span></div>
              </div>
            </section>
            {/* Resumen final */}
            <div className="w-full text-right mt-4 font-bold text-lg">
              Total recargos y horas extras: <span className="text-bomberored-800">${formatNumberWithSpace(totalAPagar)}</span>
            </div>
            {topeFecha && topeHora && (
              <div className="w-full text-right mt-2 font-medium text-base text-gray-700">
                Tope del 50% alcanzado el <span className="font-bold">{format(parse(topeFecha, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')}</span> a las <span className="font-bold">{topeHora}</span>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
