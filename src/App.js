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
  const [empresas, setEmpresas] = useState(['Location World', 'UGPS', 'Entel', 'IntelTrack', 'TrackChile']);
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
      const storedEmpresas = localStorage.getItem('empresas');

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
      if (storedEmpresas) setEmpresas(JSON.parse(storedEmpresas));
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

  useEffect(() => {
    localStorage.setItem('empresas', JSON.stringify(empresas));
  }, [empresas]);

  // ========== SISTEMA DE BACKUP ==========
  
  // Exportar todos los datos a un archivo JSON
  const exportarBackup = () => {
    const backup = {
      version: '1.0',
      fecha: new Date().toISOString(),
      datos: {
        trabajos,
        equiposNuevos,
        equiposRetirados,
        equiposMalos,
        clientes,
        empresas,
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

  // Importar datos desde un archivo JSON
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
        if (window.confirm('⚠️ ¿Deseas restaurar este backup? Esto reemplazará todos los datos actuales.')) {
          // Restaurar datos
          if (backup.datos.trabajos) setTrabajos(backup.datos.trabajos);
          if (backup.datos.equiposNuevos) setEquiposNuevos(backup.datos.equiposNuevos);
          if (backup.datos.equiposRetirados) setEquiposRetirados(backup.datos.equiposRetirados);
          if (backup.datos.equiposMalos) setEquiposMalos(backup.datos.equiposMalos);
          if (backup.datos.clientes) setClientes(backup.datos.clientes);
          if (backup.datos.empresas) setEmpresas(backup.datos.empresas);
          if (backup.datos.empresaSeleccionada) setEmpresaSeleccionada(backup.datos.empresaSeleccionada);
          if (backup.datos.mesSeleccionado) setMesSeleccionado(backup.datos.mesSeleccionado);

          alert(`✓ Backup restaurado correctamente\nFecha del backup: ${new Date(backup.fecha).toLocaleString('es-CL')}`);
        }
      } catch (error) {
        console.error('Error al importar backup:', error);
        alert('❌ Error al leer el archivo de backup');
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