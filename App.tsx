
import React, { useState, useEffect, useRef } from 'react';
import { TabType, Contract, Collaborator, Specialty } from './types';
import ContractManager from './components/ContractManager';
import CalendarView from './components/CalendarView';
import CollaboratorManager from './components/CollaboratorManager';
import { generateContractsPDF } from './utils/pdfGenerator';
import { FileDown, Ship, Users, Calendar, LayoutDashboard, Download, Upload, AlertTriangle, X } from 'lucide-react';

// Utilitário de ID global e seguro
export const generateSafeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

// Modal de Confirmação Local para Restauração
const ConfirmRestoreModal: React.FC<{
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center space-y-4">
          <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-slate-900 font-black text-xl">Restaurar Dados?</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Esta ação <strong>substituirá permanentemente</strong> todos os contratos e colaboradores atuais pelos dados do arquivo. Deseja continuar?
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={onCancel} 
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={onConfirm} 
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md active:scale-95"
            >
              Sim, Restaurar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('contratos');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [contracts, setContracts] = useState<Contract[]>(() => {
    try {
      const saved = localStorage.getItem('towing_contracts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Erro ao carregar contratos:", e);
      return [];
    }
  });

  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => {
    try {
      const saved = localStorage.getItem('towing_collaborators');
      const data = saved ? JSON.parse(saved) : [];
      return data.map((c: any) => ({ ...c, isArchived: c.isArchived ?? false }));
    } catch (e) {
      console.error("Erro ao carregar colaboradores:", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('towing_contracts', JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem('towing_collaborators', JSON.stringify(collaborators));
  }, [collaborators]);

  const handleExportData = () => {
    const backup = {
      contracts,
      collaborators,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    
    link.href = url;
    link.download = `BACKUP_TOWING_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.contracts || data.collaborators) {
          setPendingData(data);
          setShowRestoreModal(true);
        } else {
          alert("Arquivo inválido ou sem dados compatíveis.");
        }
      } catch (err) {
        alert("Erro ao ler o arquivo JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmRestore = () => {
    if (pendingData) {
      if (pendingData.contracts) setContracts(pendingData.contracts);
      if (pendingData.collaborators) setCollaborators(pendingData.collaborators);
      setShowRestoreModal(false);
      setPendingData(null);
      alert("Dados restaurados com sucesso!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <ConfirmRestoreModal 
        isOpen={showRestoreModal} 
        onConfirm={confirmRestore} 
        onCancel={() => setShowRestoreModal(false)} 
      />
      
      <input 
        type="file" 
        accept=".json" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />

      {/* CABEÇALHO */}
      <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="bg-blue-600 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shadow-lg rotate-3">
              <Ship className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tighter leading-none">TOWING</h1>
              <p className="text-[7px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mt-0.5 sm:mt-1">Assessoria Naval</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button 
              onClick={handleExportData}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all bg-white/5 border border-white/10"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Backup</span>
              <span className="xs:hidden">Salvar</span>
            </button>
            <button 
              onClick={handleImportClick}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all bg-white/5 border border-white/10"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Importar</span>
              <span className="xs:hidden">Abrir</span>
            </button>

            <button 
              onClick={() => generateContractsPDF(contracts, collaborators)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-black shadow-lg shadow-blue-900/20 transition-all active:scale-95 shrink-0 ml-1"
            >
              <FileDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO SUPERIOR (VISÍVEL APENAS EM DESKTOP) */}
        <div className="hidden md:block bg-slate-800/80 backdrop-blur-md border-t border-white/5 shadow-inner">
          <div className="max-w-7xl mx-auto flex">
            <button 
              onClick={() => setActiveTab('contratos')} 
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === 'contratos' ? 'text-blue-400 bg-blue-400/5 border-blue-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" /> 
              Contratos
            </button>
            <button 
              onClick={() => setActiveTab('agenda')} 
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === 'agenda' ? 'text-blue-400 bg-blue-400/5 border-blue-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
            >
              <Calendar className="w-4 h-4 shrink-0" /> 
              Agenda Semanal
            </button>
            <button 
              onClick={() => setActiveTab('colaboradores')} 
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === 'colaboradores' ? 'text-blue-400 bg-blue-400/5 border-blue-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
            >
              <Users className="w-4 h-4 shrink-0" /> 
              Gestão de Equipe
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 pb-24 md:pb-10">
        <div className="min-w-0">
          {activeTab === 'contratos' && (
            <ContractManager 
              contracts={contracts} 
              collaborators={collaborators}
              onAddContract={(c) => {
                // Novos contratos no TOPO da lista (unshift logic)
                setContracts([{ ...c, id: generateSafeId(), collaboratorIds: [], activities: [], isArchived: false }, ...contracts]);
              }}
              onUpdateContract={(id, updates) => setContracts(contracts.map(c => c.id === id ? { ...c, ...updates } : c))}
              onDeleteContract={(id) => setContracts(contracts.filter(c => c.id !== id))}
            />
          )}

          {activeTab === 'agenda' && (
            <CalendarView 
              contracts={contracts} 
              collaborators={collaborators} 
            />
          )}

          {activeTab === 'colaboradores' && (
            <CollaboratorManager 
              collaborators={collaborators}
              onAdd={(name, specialty) => setCollaborators([{ id: generateSafeId(), name, specialty, isArchived: false }, ...collaborators])}
              onUpdate={(id, name, specialty) => setCollaborators(collaborators.map(c => c.id === id ? { ...c, name, specialty } : c))}
              onDelete={(id) => setCollaborators(collaborators.filter(c => c.id !== id))}
              onToggleArchive={(id) => setCollaborators(collaborators.map(c => c.id === id ? { ...c, isArchived: !c.isArchived } : c))}
            />
          )}
        </div>
      </main>

      {/* RODAPÉ DESKTOP */}
      <footer className="hidden md:block bg-slate-100 border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-50">
            <Ship className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">TOWING Assessoria Naval</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
            © {new Date().getFullYear()} - Sistema de Gestão Interna - v1.0.2
          </p>
          <div className="flex gap-4">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-blue-500/20 pb-0.5">Admin: Diego Silva</span>
          </div>
        </div>
      </footer>

      {/* RODAPÉ MOBILE (NAVEGAÇÃO FIXA) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex justify-around items-stretch h-16">
          <button 
            onClick={() => setActiveTab('contratos')} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${activeTab === 'contratos' ? 'text-blue-400' : 'text-slate-400'}`}
          >
            <LayoutDashboard className={`w-5 h-5 transition-transform ${activeTab === 'contratos' ? 'scale-110' : ''}`} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Contratos</span>
            {activeTab === 'contratos' && <div className="absolute bottom-0 w-8 h-1 bg-blue-400 rounded-t-full" />}
          </button>
          
          <button 
            onClick={() => setActiveTab('agenda')} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${activeTab === 'agenda' ? 'text-blue-400' : 'text-slate-400'}`}
          >
            <Calendar className={`w-5 h-5 transition-transform ${activeTab === 'agenda' ? 'scale-110' : ''}`} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Agenda</span>
            {activeTab === 'agenda' && <div className="absolute bottom-0 w-8 h-1 bg-blue-400 rounded-t-full" />}
          </button>
          
          <button 
            onClick={() => setActiveTab('colaboradores')} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${activeTab === 'colaboradores' ? 'text-blue-400' : 'text-slate-400'}`}
          >
            <Users className={`w-5 h-5 transition-transform ${activeTab === 'colaboradores' ? 'scale-110' : ''}`} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Equipe</span>
            {activeTab === 'colaboradores' && <div className="absolute bottom-0 w-8 h-1 bg-blue-400 rounded-t-full" />}
          </button>
        </div>
      </nav>

      <style>{`
        @media (max-width: 480px) {
          .xs\\:hidden { display: block; }
          .xs\\:inline { display: none; }
        }
        @media (min-width: 481px) {
          .xs\\:hidden { display: none; }
          .xs\\:inline { display: inline; }
        }
      `}</style>
    </div>
  );
};

export default App;
