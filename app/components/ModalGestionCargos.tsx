import React, { useState, useEffect, KeyboardEvent, ChangeEvent, FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Cargo {
  id: number;
  nombre: string;
  salario: number;
}

interface ModalGestionCargosProps {
  onClose: () => void;
}

const ModalGestionCargos: React.FC<ModalGestionCargosProps> = ({ onClose }) => {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [editandoCargo, setEditandoCargo] = useState<string | null>(null);
  const [valorEditando, setValorEditando] = useState("");
  const [editandoSalario, setEditandoSalario] = useState("");
  const [nuevoCargoInput, setNuevoCargoInput] = useState("");
  const [nuevoSalarioInput, setNuevoSalarioInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleGuardarEdicion = async (cargoId: number): Promise<void> => {
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
        throw new Error('Error al actualizar cargo');
      }

      const cargosActualizados = cargos.map(cargo => 
        cargo.id === cargoId 
          ? { ...cargo, nombre: valorEditando, salario: Number(editandoSalario) }
          : cargo
      );
      setCargos(cargosActualizados);
      
      setEditandoCargo(null);
      setValorEditando("");
      setEditandoSalario("");
      setError(null);
    } catch (err) {
      console.error('Error al actualizar cargo:', err);
      setError('Error al actualizar el cargo');
    }
  };

  useEffect(() => {
    const cargarCargos = async () => {
      try {
        const res = await fetch('/api/cargos');
        const data = await res.json();
        setCargos(data.cargos || []);
      } catch (err) {
        console.error('Error al cargar cargos:', err);
        setError('Error al cargar los cargos');
      }
    };
    cargarCargos();
  }, []);

  const handleSubmitCargo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!nuevoCargoInput.trim() || !nuevoSalarioInput) {
        setError('El nombre y salario son requeridos');
        return;
      }

      const res = await fetch('/api/cargos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: nuevoCargoInput, 
          salario: Number(nuevoSalarioInput) 
        })
      });

      if (!res.ok) {
        throw new Error('Error al crear cargo');
      }

      const nuevoCargo = await res.json();
      setCargos([...cargos, nuevoCargo]);
      setNuevoCargoInput("");
      setNuevoSalarioInput("");
      setError(null);
    } catch (err) {
      console.error('Error al agregar cargo:', err);
      setError('Error al agregar el cargo');
    }
  };

  const handleEliminarCargo = async (cargoId: number) => {
    try {
      const res = await fetch(`/api/cargos/${cargoId}`, { 
        method: 'DELETE' 
      });

      if (!res.ok) {
        throw new Error('Error al eliminar cargo');
      }

      setCargos(cargos.filter(cargo => cargo.id !== cargoId));
      setError(null);
    } catch (err) {
      console.error('Error al eliminar cargo:', err);
      setError('Error al eliminar el cargo');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-900">Gestión de Cargos</h2>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmitCargo} className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="nuevoCargo">Nuevo Cargo</Label>
              <Input
                id="nuevoCargo"
                value={nuevoCargoInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNuevoCargoInput(e.target.value)}
                placeholder="Ingrese el nombre del cargo"
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="nuevoSalario">Salario Base</Label>
              <Input
                id="nuevoSalario"
                type="number"
                value={nuevoSalarioInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNuevoSalarioInput(e.target.value)}
                placeholder="Ingrese el salario base"
                className="w-full"
              />
            </div>
          </div>
          <Button type="submit" className="w-full md:w-auto">
            Agregar Cargo
          </Button>
        </form>

        <div className="space-y-4">
          {cargos.map((cargo) => (
            <Card key={cargo.id} className="p-4">
              {editandoCargo === cargo.id.toString() ? (
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor={`editCargo-${cargo.id}`}>Nombre</Label>
                    <Input
                      id={`editCargo-${cargo.id}`}
                      value={valorEditando}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setValorEditando(e.target.value)}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleGuardarEdicion(cargo.id);
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`editSalario-${cargo.id}`}>Salario</Label>
                    <Input
                      id={`editSalario-${cargo.id}`}
                      type="number"
                      value={editandoSalario}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEditandoSalario(e.target.value)}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleGuardarEdicion(cargo.id);
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2 mt-4 md:mt-0">
                    <Button
                      onClick={() => handleGuardarEdicion(cargo.id)}
                      className="flex-1"
                    >
                      Guardar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditandoCargo(null);
                        setValorEditando("");
                        setEditandoSalario("");
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{cargo.nombre}</h3>
                    <p className="text-gray-600">Salario Base: ${cargo.salario.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditandoCargo(cargo.id.toString());
                        setValorEditando(cargo.nombre);
                        setEditandoSalario(cargo.salario.toString());
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleEliminarCargo(cargo.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModalGestionCargos; 