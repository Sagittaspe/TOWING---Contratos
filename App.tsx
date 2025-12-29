
import React, { useState, useEffect } from 'react';
import { TabType, Contract, Collaborator, Specialty } from './types';
import ContractManager from './components/ContractManager';
import CalendarView from './components/CalendarView';
import CollaboratorManager from './components/CollaboratorManager';
import { generateContractsPDF } from './utils/pdfGenerator';
import { FileDown, Ship, Users, Calendar, LayoutDashboard, Contrast } from 'lucide-react';

// Utilitário de ID global e seguro
export const generateSafeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('contratos');
  
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

  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('towing_contrast') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('towing_contracts', JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem('towing_collaborators', JSON.stringify(collaborators));
  }, [collaborators]);

  useEffect(() => {
    localStorage.setItem('towing_contrast', isHighContrast.toString());
    if (isHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  const addContract = (newContract: Omit<Contract, 'id' | 'activities' | 'isArchived' | 'collaboratorIds'>) => {
    const contract: Contract = {
      ...newContract,
      id: generateSafeId(),
      activities: [],
      isArchived: false,
      collaboratorIds: [],
    };
    setContracts(prev => [...prev, contract]);
  };

  const updateContract = (id: string, updates: Partial<Contract>) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteContract = (id: string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
  };

  const addCollaborator = (name: string, specialty: Specialty) => {
    const colab: Collaborator = {
      id: generateSafeId(),
      name,
      specialty,
      isArchived: false
    };
    setCollaborators(prev => [...prev, colab]);
  };

  const updateCollaborator = (id: string, name: string, specialty: Specialty) => {
    setCollaborators(prev => prev.map(c => c.id === id ? { ...c, name, specialty } : c));
  };

  const deleteCollaborator = (id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
    setContracts(prev => prev.map(contract => ({
      ...contract,
      collaboratorIds: contract.collaboratorIds.filter(cid => cid !== id)
    })));
  };

  const toggleArchiveCollaborator = (id: string) => {
    setCollaborators(prev => prev.map(c => c.id === id ? { ...c, isArchived: !c.isArchived } : c));
  };

  const toggleContrast = () => setIsHighContrast(!isHighContrast);

  return (
    <div className={`min-h-screen flex flex-col ${isHighContrast ? 'bg-black' : 'bg-slate-50'}`}>
      <header className={`${isHighContrast ? 'bg-zinc-900 border-b border-yellow-400' : 'bg-slate-900'} text-white shadow-lg sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`${isHighContrast ? 'bg-yellow-400 text-black' : 'bg-blue-600'} p-2 rounded-lg shrink-0`}>
              <Ship className="w-8 h-8" />
            </div>
            <div className="min-w-0">
              <h1 className={`text-2xl font-bold tracking-tight truncate ${isHighContrast ? 'text-yellow-400' : 'text-white'}`}>TOWING</h1>
              <p className={`${isHighContrast ? 'text-white' : 'text-blue-400'} text-sm font-medium truncate`}>Assessoria Naval</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={toggleContrast}
              className={`flex-1 md:flex-none p-2 rounded-md transition-colors flex items-center justify-center gap-2 text-sm font-semibold border ${
                isHighContrast 
                  ? 'bg-yellow-400 text-black border-yellow-400' 
                  : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Contrast className="w-4 h-4" />
              <span>Contraste</span>
            </button>
            <button
              onClick={() => generateContractsPDF(contracts.filter(c => !c.isArchived), collaborators)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 ${
                isHighContrast 
                  ? 'bg-white text-black hover:bg-yellow-400' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors px-4 py-2 rounded-md text-sm font-semibold`}
            >
              <FileDown className="w-4 h-4" />
              <span>Gerar PDF</span>
            </button>
          </div>
        </div>

        <nav className={`max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 border-t ${isHighContrast ? 'border-yellow-400' : 'border-slate-800'}`}>
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-stretch">
            <button
              onClick={() => setActiveTab('contratos')}
              className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-all text-center sm:text-left ${
                activeTab === 'contratos' 
                  ? (isHighContrast ? 'border-yellow-400 text-yellow-400' : 'border-blue-500 text-blue-400') 
                  : (isHighContrast ? 'border-transparent text-white hover:bg-zinc-800' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800')
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="leading-tight">Contratos</span>
            </button>
            <button
              onClick={() => setActiveTab('agenda')}
              className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-all text-center sm:text-left ${
                activeTab === 'agenda' 
                  ? (isHighContrast ? 'border-yellow-400 text-yellow-400' : 'border-blue-500 text-blue-400') 
                  : (isHighContrast ? 'border-transparent text-white hover:bg-zinc-800' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800')
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="leading-tight">Agenda</span>
            </button>
            <button
              onClick={() => setActiveTab('colaboradores')}
              className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-all text-center sm:text-left ${
                activeTab === 'colaboradores' 
                  ? (isHighContrast ? 'border-yellow-400 text-yellow-400' : 'border-blue-500 text-blue-400') 
                  : (isHighContrast ? 'border-transparent text-white hover:bg-zinc-800' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800')
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="leading-tight">Equipe</span>
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'contratos' && (
          <ContractManager 
            contracts={contracts} 
            collaborators={collaborators}
            onAddContract={addContract}
            onUpdateContract={updateContract}
            onDeleteContract={deleteContract}
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
            onAdd={addCollaborator}
            onUpdate={updateCollaborator}
            onDelete={deleteCollaborator}
            onToggleArchive={toggleArchiveCollaborator}
          />
        )}
      </main>

      <footer className={`${isHighContrast ? 'bg-zinc-900 text-white border-yellow-400' : 'bg-slate-200 text-slate-500 border-slate-300'} border-t py-6 mt-auto`}>
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="text-sm font-bold tracking-wide">Administrador: Diego Silva</p>
          <p className="text-[10px] opacity-75 uppercase tracking-tighter">&copy; {new Date().getFullYear()} TOWING Assessoria Naval - Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
