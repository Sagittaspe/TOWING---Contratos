
import React, { useState, useRef, useEffect } from 'react';
import { Contract, Activity, Collaborator, ProgressLevel, ActivityStatus, ActivityNote } from '../types';
import { Plus, Trash2, Edit2, Archive, ArchiveRestore, MessageSquare, Calendar, Camera, Loader2, X, Lock, AlertTriangle, ChevronDown, ChevronUp, Ship, Check } from 'lucide-react';
import { format, isAfter, parseISO, startOfDay } from 'date-fns';
import { GoogleGenAI } from "@google/genai";
import { generateSafeId } from '../App';

interface ContractManagerProps {
  contracts: Contract[];
  collaborators: Collaborator[];
  onAddContract: (c: { number: string; startDate: string; endDate: string }) => void;
  onUpdateContract: (id: string, updates: Partial<Contract>) => void;
  onDeleteContract: (id: string) => void;
}

const ADMIN_PASSWORD = "85988106362";

const PasswordModal: React.FC<{
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, onConfirm, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (password === ADMIN_PASSWORD) {
      onConfirm();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-slate-900 p-4 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-white font-bold">Segurança TOWING</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-slate-600 text-sm font-medium">Senha necessária para esta ação:</p>
          <div className="relative">
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all bg-white text-slate-900 ${error ? 'border-red-500 bg-red-50 ring-2 ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
              placeholder="Digite a senha..."
            />
            {error && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-wider">Senha incorreta</p>}
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold transition-all shadow-md active:scale-95"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SimpleConfirmModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xs overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 text-center space-y-3">
          <div className="bg-amber-100 text-amber-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-slate-900 font-bold text-lg">{title}</h3>
          <p className="text-slate-500 text-sm">{message}</p>
          <div className="flex gap-2 pt-2">
            <button onClick={onCancel} className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Não</button>
            <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md">Sim</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotesPopup: React.FC<{
  isOpen: boolean;
  notes: ActivityNote[];
  onSave: (notes: ActivityNote[]) => void;
  onClose: () => void;
}> = ({ isOpen, notes, onSave, onClose }) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes, isOpen]);

  if (!isOpen) return null;

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const newNote: ActivityNote = {
      id: generateSafeId(),
      text: newNoteText.trim(),
      createdAt: format(new Date(), "dd/MM/yy HH:mm")
    };
    onSave([...notes, newNote]);
    setNewNoteText('');
  };

  const handleUpdateNote = (id: string) => {
    if (!editingText.trim()) return;
    const updated = notes.map(n => n.id === id ? { ...n, text: editingText.trim() } : n);
    onSave(updated);
    setEditingNoteId(null);
  };

  const removeNote = (id: string) => {
    onSave(notes.filter(n => n.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
        <div className="bg-slate-100 p-4 flex items-center justify-between border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Histórico de Observações</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div ref={scrollRef} className="p-5 overflow-y-auto space-y-4 flex-grow bg-slate-50/50">
          {notes.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-10" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-300">Sem observações</p>
              <p className="text-[10px] mt-2 italic">Adicione uma nota no campo inferior</p>
            </div>
          ) : (
            notes.map((note) => (
              <div 
                key={note.id} 
                className={`bg-white p-4 rounded-xl border shadow-sm group animate-in slide-in-from-bottom-2 relative transition-all ${editingNoteId === note.id ? 'border-blue-500 ring-2 ring-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex justify-between items-start gap-4">
                  {editingNoteId === note.id ? (
                    <div className="flex-grow flex flex-col gap-2">
                      <textarea
                        autoFocus
                        className="w-full p-3 text-sm font-bold border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100 resize-none h-24"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUpdateNote(note.id); }
                          if (e.key === 'Escape') setEditingNoteId(null);
                        }}
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingNoteId(null)} className="px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg uppercase">Cancelar</button>
                        <button onClick={() => handleUpdateNote(note.id)} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase shadow-md flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-grow">
                        <p 
                          onDoubleClick={() => { setEditingNoteId(note.id); setEditingText(note.text); }}
                          className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed break-words cursor-text selection:bg-blue-100"
                        >
                          {note.text}
                        </p>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1 block">
                          {note.createdAt}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-2 shrink-0">
                        <button 
                          onClick={() => { setEditingNoteId(note.id); setEditingText(note.text); }}
                          className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-200 shadow-sm"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => removeNote(note.id)}
                          className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-200 shadow-sm"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-white border-t shrink-0">
          <div className="flex gap-2">
            <textarea
              className="flex-grow p-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none font-bold text-xs sm:text-sm h-20"
              placeholder="Digite uma nova observação..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
            />
            <button 
              onClick={handleAddNote}
              disabled={!newNoteText.trim()}
              className="w-14 h-14 self-end bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContractManager: React.FC<ContractManagerProps> = ({ 
  contracts, collaborators, onAddContract, onUpdateContract, onDeleteContract 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState({ number: '', startDate: '', endDate: '' });

  const [passModal, setPassModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'edit_number' | '';
    targetId: string;
  }>({ isOpen: false, type: '', targetId: '' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9\W_]+$/.test(form.number)) {
      alert("O número do contrato deve conter apenas números e caracteres especiais.");
      return;
    }

    if (editingId) {
      const originalContract = contracts.find(c => c.id === editingId);
      if (originalContract && originalContract.number !== form.number) {
        setPassModal({ isOpen: true, type: 'edit_number', targetId: editingId });
        return;
      }
      onUpdateContract(editingId, form);
      setEditingId(null);
    } else {
      onAddContract(form);
    }
    setForm({ number: '', startDate: '', endDate: '' });
    setIsAdding(false);
  };

  const toggleArchived = (id: string) => {
    const contract = contracts.find(c => c.id === id);
    if (contract) {
      onUpdateContract(id, { isArchived: !contract.isArchived });
    }
  };

  const handlePassConfirm = () => {
    if (passModal.type === 'delete') {
      onDeleteContract(passModal.targetId);
    } else if (passModal.type === 'edit_number') {
      onUpdateContract(passModal.targetId, form);
      setEditingId(null);
    }
    setPassModal({ isOpen: false, type: '', targetId: '' });
    setForm({ number: '', startDate: '', endDate: '' });
    setIsAdding(false);
  };

  const activeContracts = contracts.filter(c => !c.isArchived);
  const archivedContracts = contracts.filter(c => c.isArchived);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PasswordModal 
        isOpen={passModal.isOpen} 
        onConfirm={handlePassConfirm} 
        onCancel={() => setPassModal({ isOpen: false, type: '', targetId: '' })} 
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">Gerenciamento de Contratos</h2>
        <button
          onClick={() => { setIsAdding(true); setEditingId(null); setForm({ number: '', startDate: '', endDate: '' }); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Criar Novo Contrato
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Número do Contrato</label>
              <input
                required
                type="text"
                value={form.number}
                onChange={e => setForm({ ...form, number: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800"
                placeholder="Ex: 001/2024"
              />
            </div>
            <div className="grid grid-cols-2 md:contents gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Data Início</label>
                <input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800 text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Data Final</label>
                <input
                  required
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800 text-xs sm:text-sm"
                />
              </div>
            </div>
            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md font-bold shadow-sm transition-all"
              >
                {editingId ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {activeContracts.length === 0 && !isAdding && (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
            Nenhum contrato ativo no momento.
          </div>
        )}
        {activeContracts.map(contract => (
          <ContractCard 
            key={contract.id} 
            contract={contract} 
            collaborators={collaborators}
            onUpdate={onUpdateContract}
            onEdit={() => {
              setEditingId(contract.id);
              setForm({ number: contract.number, startDate: contract.startDate, endDate: contract.endDate });
            }}
            onArchive={() => toggleArchived(contract.id)}
            onDelete={() => setPassModal({ isOpen: true, type: 'delete', targetId: contract.id })}
          />
        ))}
      </div>

      <div className="mt-12 border-t pt-8">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mx-auto font-medium"
        >
          <Archive className="w-4 h-4" />
          {showArchived ? 'Ocultar Arquivados' : 'Exibir Contratos Arquivados'}
        </button>

        {showArchived && (
          <div className="grid grid-cols-1 gap-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {archivedContracts.length === 0 ? (
              <p className="text-center text-slate-400 text-sm italic">Nenhum contrato arquivado.</p>
            ) : (
              archivedContracts.map(contract => (
                <ContractCard 
                  key={contract.id} 
                  contract={contract} 
                  collaborators={collaborators}
                  onUpdate={onUpdateContract}
                  onEdit={() => {
                    setEditingId(contract.id);
                    setForm({ number: contract.number, startDate: contract.startDate, endDate: contract.endDate });
                  }}
                  onArchive={() => toggleArchived(contract.id)}
                  onDelete={() => setPassModal({ isOpen: true, type: 'delete', targetId: contract.id })}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ContractCard: React.FC<{
  contract: Contract;
  collaborators: Collaborator[];
  onUpdate: (id: string, updates: Partial<Contract>) => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}> = ({ contract, collaborators, onUpdate, onEdit, onArchive, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [actForm, setActForm] = useState({ description: '', startDate: '', endDate: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const newActivity: Activity = {
      id: generateSafeId(),
      description: actForm.description,
      startDate: actForm.startDate,
      endDate: actForm.endDate,
      progress: 0,
      status: ActivityStatus.ANDAMENTO,
      notes: []
    };
    onUpdate(contract.id, { activities: [...contract.activities, newActivity] });
    setActForm({ description: '', startDate: '', endDate: '' });
    setIsAddingActivity(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { inlineData: { data: base64, mimeType: file.type } },
              { text: "Você é um assistente naval. Extraia as atividades listadas neste contrato físico. Retorne EXCLUSIVAMENTE um JSON com este formato: { \"activities\": [ { \"description\": string, \"startDate\": string (YYYY-MM-DD), \"endDate\": string (YYYY-MM-DD) } ] }." }
            ]
          }
        ],
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{"activities":[]}');
      const newActivities: Activity[] = (result.activities || []).map((a: any) => ({
        id: generateSafeId(),
        description: a.description || 'Nova Atividade',
        startDate: a.startDate || new Date().toISOString().split('T')[0],
        endDate: a.endDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        progress: 0,
        status: ActivityStatus.ANDAMENTO,
        notes: []
      }));

      if (newActivities.length > 0) {
        onUpdate(contract.id, { activities: [...contract.activities, ...newActivities] });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsScanning(false);
    }
  };

  const updateActivity = (actId: string, updates: Partial<Activity>) => {
    const updated = contract.activities.map(a => a.id === actId ? { ...a, ...updates } : a);
    onUpdate(contract.id, { activities: updated });
  };

  const deleteActivity = (actId: string) => {
    onUpdate(contract.id, { activities: contract.activities.filter(a => a.id !== actId) });
  };

  const toggleCollaborator = (colabId: string) => {
    const current = contract.collaboratorIds;
    const updated = current.includes(colabId) ? current.filter(id => id !== colabId) : [...current, colabId];
    onUpdate(contract.id, { collaboratorIds: updated });
  };

  const today = startOfDay(new Date());
  const isContractOverdue = isAfter(today, parseISO(contract.endDate)) && contract.activities.some(a => a.progress < 100);

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all relative ${contract.isArchived ? 'opacity-80 grayscale-[0.3]' : 'hover:shadow-md'}`}>
      {isScanning && (
        <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
          <p className="text-blue-600 font-bold uppercase text-xs tracking-widest">Processando...</p>
        </div>
      )}
      
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-3 sm:p-4 border-b flex justify-between items-center gap-2 cursor-pointer transition-colors ${isContractOverdue ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 hover:bg-slate-100'}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-grow">
          <div className={`p-1.5 sm:p-2 rounded-lg ${isContractOverdue ? 'bg-orange-600' : 'bg-blue-600'} text-white shadow-sm shrink-0`}>
             <Ship className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-lg font-black text-slate-900 truncate">Contrato #{contract.number}</h3>
            {isExpanded && (
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider animate-in fade-in duration-300">
                Vigência: {format(parseISO(contract.startDate), 'dd/MM/yy')} — {format(parseISO(contract.endDate), 'dd/MM/yy')}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <div className="flex items-center gap-1 sm:mr-2" onClick={(e) => e.stopPropagation()}>
            <button onClick={onEdit} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all border border-blue-100 shadow-sm" title="Editar"><Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
            <button onClick={onArchive} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-all border border-amber-100 shadow-sm" title={contract.isArchived ? "Desarquivar" : "Arquivar"}>{contract.isArchived ? <ArchiveRestore className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}</button>
            <button onClick={onDelete} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all border border-red-100 shadow-sm" title="Excluir"><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
          {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-5 animate-in slide-in-from-top-2 duration-300 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
             <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2 tracking-wider">Equipe Designada</label>
                <div className="flex flex-wrap gap-2">
                  {collaborators.filter(c => !c.isArchived || contract.collaboratorIds.includes(c.id)).map(c => (
                    <button
                      key={c.id}
                      onClick={() => toggleCollaborator(c.id)}
                      className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold border transition-all ${
                        contract.collaboratorIds.includes(c.id) ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-400'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
             </div>
             
             <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso Geral</span>
                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                   <div 
                    className="h-full bg-blue-600 transition-all duration-700" 
                    style={{ width: `${contract.activities.length > 0 ? (contract.activities.reduce((acc, a) => acc + a.progress, 0) / contract.activities.length) : 0}%` }} 
                   />
                </div>
             </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atividades</label>
              {!contract.isArchived && (
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  <button onClick={() => fileInputRef.current?.click()} className="text-[10px] text-amber-600 font-black flex items-center gap-1.5 hover:text-amber-700 transition-colors uppercase">
                    <Camera className="w-3.5 h-3.5" /> Usar foto
                  </button>
                  <button onClick={() => setIsAddingActivity(true)} className="text-[10px] text-blue-600 font-black flex items-center gap-1.5 hover:text-blue-700 transition-colors uppercase ml-auto sm:ml-0">
                    <Plus className="w-3.5 h-3.5" /> Nova Atividade
                  </button>
                </div>
              )}
            </div>
            
            {isAddingActivity && (
              <form onSubmit={addActivity} className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-in fade-in">
                <input required className="sm:col-span-2 px-3 py-2 border border-slate-300 rounded-md text-sm outline-none bg-white text-slate-900 focus:ring-2 focus:ring-blue-100" placeholder="Descrição..." value={actForm.description} onChange={e => setActForm({ ...actForm, description: e.target.value })} />
                <input required type="date" className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900 outline-none" value={actForm.startDate} onChange={e => setActForm({ ...actForm, startDate: e.target.value })} />
                <input required type="date" className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900 outline-none" value={actForm.endDate} onChange={e => setActForm({ ...actForm, endDate: e.target.value })} />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors">Criar</button>
                  <button type="button" onClick={() => setIsAddingActivity(false)} className="px-3 py-2 bg-red-50 text-red-600 rounded-md border border-red-100 hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {contract.activities.map(activity => (
                <ActivityRow 
                  key={activity.id} 
                  activity={activity} 
                  contractEndDate={contract.endDate}
                  onUpdate={(up) => updateActivity(activity.id, up)}
                  onDelete={() => deleteActivity(activity.id)}
                  disabled={contract.isArchived}
                />
              ))}
              {contract.activities.length === 0 && !isAddingActivity && (
                <p className="text-center py-4 text-xs text-slate-400 italic">Nenhuma atividade cadastrada.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ActivityRow: React.FC<{
  activity: Activity;
  contractEndDate: string;
  onUpdate: (u: Partial<Activity>) => void;
  onDelete: () => void;
  disabled: boolean;
}> = ({ activity, contractEndDate, onUpdate, onDelete, disabled }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNotesPopup, setShowNotesPopup] = useState(false);
  const [isHoveringNotes, setIsHoveringNotes] = useState(false);
  const [editForm, setEditForm] = useState({ description: activity.description, startDate: activity.startDate, endDate: activity.endDate });

  const today = startOfDay(new Date());
  const isOverdue = (isAfter(today, parseISO(activity.endDate)) || isAfter(today, parseISO(contractEndDate))) && activity.progress < 100;

  const safeNotes = Array.isArray(activity.notes) ? activity.notes : [];

  if (isEditing) {
    return (
      <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <textarea className="sm:col-span-2 px-3 py-1.5 border border-slate-300 rounded-md text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-100" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
          <input type="date" className="px-3 py-1.5 border border-slate-300 rounded-md text-sm bg-white text-slate-900 outline-none" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} />
          <input type="date" className="px-3 py-1.5 border border-slate-300 rounded-md text-sm bg-white text-slate-900 outline-none" value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={() => { onUpdate(editForm); setIsEditing(false); }} className="flex-1 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 transition-colors">OK</button>
            <button onClick={() => setIsEditing(false)} className="px-3 bg-white border border-slate-300 rounded-md text-slate-500"><X className="w-3 h-3" /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg border flex flex-col lg:flex-row justify-between gap-3 ${isOverdue ? 'bg-orange-50 border-orange-300 shadow-sm' : 'bg-white border-slate-200'}`}>
      <SimpleConfirmModal 
        isOpen={showDeleteConfirm}
        title="Excluir Atividade?"
        message="Esta ação removerá permanentemente esta atividade do contrato."
        onConfirm={() => { onDelete(); setShowDeleteConfirm(false); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <NotesPopup 
        isOpen={showNotesPopup}
        notes={safeNotes}
        onSave={(newNotes) => onUpdate({ notes: newNotes })}
        onClose={() => setShowNotesPopup(false)}
      />
      
      <div className="flex items-start gap-2 flex-grow min-w-0">
        <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded-full border transition-colors ${activity.progress === 100 ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`} />
        <span className={`text-xs sm:text-sm font-bold break-words leading-snug ${activity.progress === 100 ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
          {activity.description}
        </span>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 pt-1 lg:pt-0 border-t lg:border-0 border-slate-100">
        <div className="relative">
          <button 
            disabled={disabled}
            onMouseEnter={() => setIsHoveringNotes(true)}
            onMouseLeave={() => setIsHoveringNotes(false)}
            onClick={() => setShowNotesPopup(true)}
            className={`p-2 rounded-lg transition-all border shrink-0 ${safeNotes.length > 0 ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:border-blue-400 hover:text-blue-600'}`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          
          {isHoveringNotes && safeNotes.length > 0 && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-[1px] pointer-events-none transition-all duration-300">
              <div className="w-[calc(100vw-3rem)] max-w-md bg-white p-5 rounded-3xl shadow-2xl border-2 border-slate-200 animate-in fade-in zoom-in-90 slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prévia de Observações</h4>
                </div>
                <div className="space-y-4">
                  {safeNotes.map((note) => (
                    <div key={note.id} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug break-words">
                          {note.text}
                        </p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-right mt-2 italic">
                          {note.createdAt}
                        </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded shrink-0">
          <Calendar className="w-3 h-3" /> {format(parseISO(activity.endDate), 'dd/MM/yy')}
        </div>
        
        <select 
          disabled={disabled} 
          value={activity.status} 
          onChange={e => onUpdate({ status: e.target.value as ActivityStatus })} 
          className="text-[9px] sm:text-[10px] font-bold border border-slate-300 rounded px-1.5 py-1 bg-white outline-none shrink-0"
        >
          <option value={ActivityStatus.ANDAMENTO}>Andamento</option>
          <option value={ActivityStatus.INTERROMPIDO}>Pausado</option>
        </select>
        
        <div className="flex items-center gap-0.5 shrink-0">
          {[25, 50, 75, 100].map(level => (
            <button 
              key={level} 
              disabled={disabled} 
              onClick={() => onUpdate({ progress: activity.progress === level ? 0 : level as ProgressLevel })} 
              className={`w-7 sm:w-8 h-6 text-[8px] sm:text-[9px] font-black border rounded transition-all ${activity.progress >= level ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300'}`}
            >
              {level}%
            </button>
          ))}
        </div>
        
        {!disabled && (
          <div className="flex items-center gap-1 ml-auto lg:ml-2">
            <button onClick={() => setIsEditing(true)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all border border-blue-100 shadow-sm" title="Editar"><Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
            <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all border border-red-100 shadow-sm" title="Excluir"><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractManager;
