import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Trabajos from './components/Trabajos';
import Equipos from './components/Equipos';
import Clientes from './components/Clientes';
import ValoresTrabajos from './components/ValoresTrabajos';
import { Download, Upload } from 'lucide-react';
import './styles/Common.css';

const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [trabajos, setTrabajos] = useState([]);
  const [equiposNuevos, setEquiposNuevos] = useState([]);
  const [equiposRetirados, setEquiposRetirados] = useState([]);
  const [equiposMalos, setEquiposMalos] = useState([]);
  const [clientes, setClientes] = useState([]);
  
  // Lista actualizada de empresas - NO se sobrescribirá con el backup
  const [empresas] = useState(['Location World', 'UGPS']);
  
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState('Location World');
  const [mesSeleccionado, setMesSeleccionado] = useState('Octubre 2025');

  // Cargar datos del localStorage con migración
  useEffect(() => {
    const loadData = () => {
      const storedTrabajos = localStorage.getItem('trabajos');
      const storedEquiposNuevos = localStorage.getItem('equiposNuevos');
      const storedEquiposRetirados = localStorage.getItem('equiposRetirados');
      const storedEquiposMalos = localStorage.getItem('equiposMalos');
      const storedClientes = localStorage.getItem('clientes');

      // MIGRACIÓN: Agregar empresa a equipos sin ella
      const migrateEquipos = (equipos, defaultEmpresa = 'Location World') => {
        if (!equipos) return [];
        return equipos.map(equipo => ({
          ...equipo,
          empresa: equipo.empresa || defaultEmpresa
        }));
      };

      // Migrar trabajos
      if (storedTrabajos) {
        const trabajosData = JSON.parse(storedTrabajos);
        setTrabajos(migrateEquipos(trabajosData, 'Location World'));
      }
      
      // Migrar equipos nuevos
      if (storedEquiposNuevos) {
        const equiposData = JSON.parse(storedEquiposNuevos);
        setEquiposNuevos(migrateEquipos(equiposData, 'Location World'));
      }
      
      // Migrar equipos retirados
      if (storedEquiposRetirados) {
        const equiposData = JSON.parse(storedEquiposRetirados);
        setEquiposRetirados(migrateEquipos(equiposData, 'Location World'));
      }
      
      // Migrar equipos malos
      if (storedEquiposMalos) {
        const equiposData = JSON.parse(storedEquiposMalos);
        setEquiposMalos(migrateEquipos(equiposData, 'Location World'));
      }
      
      if (storedClientes) setClientes(JSON.parse(storedClientes));
    };
    loadData();
  }, []);

  // Guardar datos en localStorage
  useEffect(() => {
    localStorage.setItem('trabajos', JSON.stringify(trabajos));
  }, [trabajos]);

  useEffect(() => {
    localStorage.setItem('equiposNuevos', JSON.stringify(equiposNuevos));
  }, [equiposNuevos]);

  useEffect(() => {
    localStorage.setItem('equiposRetirados', JSON.stringify(equiposRetirados));
  }, [equiposRetirados]);

  useEffect(() => {
    localStorage.setItem('equiposMalos', JSON.stringify(equiposMalos));
  }, [equiposMalos]);

  useEffect(() => {
    localStorage.setItem('clientes', JSON.stringify(clientes));
  }, [clientes]);

  // ========== SISTEMA DE BACKUP MEJORADO ==========
  
  // Exportar solo los datos del usuario (NO las configuraciones del sistema)
  const exportarBackup = () => {
    const backup = {
      version: '2.0',
      fecha: new Date().toISOString(),
      datos: {
        trabajos,
        equiposNuevos,
        equiposRetirados,
        equiposMalos,
        clientes,
        empresaSeleccionada,
        mesSeleccionado
      }
    };

    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-gps-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert('✓ Backup exportado correctamente. Guarda este archivo en un lugar seguro.');
  };

  // Importar datos SOLO del usuario (preservando configuraciones del sistema)
  const importarBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        
        if (!backup.datos) {
          alert('❌ Archivo de backup inválido');
          return;
        }

        // Confirmar antes de importar
        const mensaje = `⚠️ ¿Deseas restaurar este backup?\n\n` +
          `Fecha del backup: ${new Date(backup.fecha).toLocaleString('es-CL')}\n` +
          `Versión: ${backup.version || '1.0'}\n\n` +
          `Esto reemplazará:\n` +
          `• Trabajos registrados\n` +
          `• Equipos GPS\n` +
          `• Clientes\n\n` +
          `Las configuraciones del sistema (lista de empresas) se mantendrán actualizadas.`;

        if (window.confirm(mensaje)) {
          // Función de validación y migración de empresas
          const validarYMigrarEmpresa = (item) => {
            // Si no tiene empresa, asignar Location World por defecto
            if (!item.empresa) {
              return { ...item, empresa: 'Location World' };
            }
            
            // Si la empresa existe en la lista actual, mantenerla
            if (empresas.includes(item.empresa)) {
              return item;
            }
            
            // Si la empresa no existe, asignar Location World y notificar
            console.warn(`Empresa "${item.empresa}" no encontrada, migrando a Location World`);
            return { ...item, empresa: 'Location World' };
          };

          // Restaurar trabajos con validación estricta
          if (backup.datos.trabajos) {
            const trabajosValidados = backup.datos.trabajos.map(validarYMigrarEmpresa);
            setTrabajos(trabajosValidados);
          }
          
          // Restaurar equipos nuevos con validación estricta
          if (backup.datos.equiposNuevos) {
            const equiposValidados = backup.datos.equiposNuevos.map(validarYMigrarEmpresa);
            setEquiposNuevos(equiposValidados);
          }
          
          // Restaurar equipos retirados con validación estricta
          if (backup.datos.equiposRetirados) {
            const equiposValidados = backup.datos.equiposRetirados.map(validarYMigrarEmpresa);
            setEquiposRetirados(equiposValidados);
          }
          
          // Restaurar equipos malos con validación estricta
          if (backup.datos.equiposMalos) {
            const equiposValidados = backup.datos.equiposMalos.map(validarYMigrarEmpresa);
            setEquiposMalos(equiposValidados);
          }
          
          if (backup.datos.clientes) setClientes(backup.datos.clientes);
          
          // Restaurar selecciones (opcional)
          if (backup.datos.empresaSeleccionada && empresas.includes(backup.datos.empresaSeleccionada)) {
            setEmpresaSeleccionada(backup.datos.empresaSeleccionada);
          }
          if (backup.datos.mesSeleccionado) setMesSeleccionado(backup.datos.mesSeleccionado);

          alert(`✓ Backup restaurado correctamente\n\nFecha del backup: ${new Date(backup.fecha).toLocaleString('es-CL')}\n\nSe han restaurado tus datos y se mantiene la lista actualizada de empresas.`);
        }
      } catch (error) {
        console.error('Error al importar backup:', error);
        alert('❌ Error al leer el archivo de backup. Verifica que sea un archivo válido.');
      }
    };
    reader.readAsText(file);
    
    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    event.target.value = '';
  };

  return (
    <div className="font-sans">
      {/* Botones de Backup (visibles en todas las vistas) */}
      {currentView !== 'home' && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '15px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          fontSize: '0.85em',
          zIndex: 1000
        }}>
          <button
            onClick={exportarBackup}
            className="btn btn-success"
            style={{
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}
            title="Exportar backup de todos los datos"
          >
            <Download size={12} /> Backup
          </button>
          
          <label
            className="btn btn-primary"
            style={{
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer'
            }}
            title="Importar backup"
          >
            <Upload size={12} /> Restaurar
            <input
              type="file"
              accept=".json"
              onChange={importarBackup}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

      {currentView === 'home' && <Home setCurrentView={setCurrentView} />}
      
      {currentView === 'trabajos' && (
        <Trabajos 
          setCurrentView={setCurrentView}
          trabajos={trabajos}
          setTrabajos={setTrabajos}
          empresas={empresas}
          empresaSeleccionada={empresaSeleccionada}
          setEmpresaSeleccionada={setEmpresaSeleccionada}
          mesSeleccionado={mesSeleccionado}
          setMesSeleccionado={setMesSeleccionado}
          equiposNuevos={equiposNuevos}
          setEquiposNuevos={setEquiposNuevos}
          equiposRetirados={equiposRetirados}
          setEquiposRetirados={setEquiposRetirados}
        />
      )}
      
      {currentView === 'equipos' && (
        <Equipos 
          setCurrentView={setCurrentView}
          equiposNuevos={equiposNuevos}
          setEquiposNuevos={setEquiposNuevos}
          equiposRetirados={equiposRetirados}
          setEquiposRetirados={setEquiposRetirados}
          equiposMalos={equiposMalos}
          setEquiposMalos={setEquiposMalos}
          empresas={empresas}
          empresaSeleccionada={empresaSeleccionada}
          setEmpresaSeleccionada={setEmpresaSeleccionada}
        />
      )}
      
      {currentView === 'clientes' && (
        <Clientes 
          setCurrentView={setCurrentView}
          clientes={clientes}
          setClientes={setClientes}
          empresas={empresas}
        />
      )}

      {currentView === 'valores' && (
        <ValoresTrabajos 
          setCurrentView={setCurrentView}
        />
      )}
    </div>
  );
};

export default App;