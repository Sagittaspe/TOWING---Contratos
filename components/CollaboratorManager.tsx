
import React, { useState, useRef, useEffect } from 'react';
import { Collaborator, Specialty } from '../types';
import { UserPlus, Edit2, Hammer, Wrench, User, X, Archive, ArchiveRestore, Trash2, Lock } from 'lucide-react';

interface CollaboratorManagerProps {
  collaborators: Collaborator[];
  onAdd: (name: string, specialty: Specialty) => void;
  onUpdate: (id: string, name: string, specialty: Specialty) => void;
  onDelete: (id: string) => void;
  onToggleArchive: (id: string) => void;
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
          <div className="bg-blue-600 p-2 rounded-lg"><Lock className="w-5 h-5 text-white" /></div>
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
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl font-bold transition-colors">Cancelar</button>
            <button onClick={handleConfirm} className="flex-1 px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold shadow-md transition-all active:scale-95">Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CollaboratorManager: React.FC<CollaboratorManagerProps> = ({ collaborators, onAdd, onUpdate, onDelete, onToggleArchive }) => {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState<Specialty>(Specialty.MARCENARIA);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const [passModal, setPassModal] = useState({ isOpen: false, type: '' as 'submit' | 'delete', targetId: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setPassModal({ isOpen: true, type: 'submit', targetId: '' });
  };

  const handlePassConfirm = () => {
    if (passModal.type === 'submit') {
      if (editingId) {
        onUpdate(editingId, name.trim(), specialty);
        setEditingId(null);
      } else {
        onAdd(name.trim(), specialty);
      }
      setName('');
      setSpecialty(Specialty.MARCENARIA);
    } else if (passModal.type === 'delete') {
      onDelete(passModal.targetId);
    }
    setPassModal({ isOpen: false, type: 'submit', targetId: '' });
  };

  const startEdit = (c: Collaborator) => {
    setEditingId(c.id);
    setName(c.name);
    setSpecialty(c.specialty);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <PasswordModal 
        isOpen={passModal.isOpen} 
        onConfirm={handlePassConfirm} 
        onCancel={() => setPassModal({ isOpen: false, type: 'submit', targetId: '' })} 
      />

      <div className={`bg-white p-5 sm:p-6 rounded-2xl shadow-sm border ${editingId ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-200'} transition-all`}>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-blue-600 p-2 rounded-lg shrink-0">{editingId ? <Edit2 className="w-5 h-5 text-white" /> : <UserPlus className="w-5 h-5 text-white" />}</div>
            <span className="truncate">{editingId ? 'Editar Equipe' : 'Novo Membro'}</span>
          </div>
          {editingId && <button onClick={() => { setEditingId(null); setName(''); }} className="text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600 transition-colors shrink-0">Cancelar</button>}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Nome Completo</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 bg-white text-slate-900 font-medium transition-all" placeholder="Digite o nome..." />
          </div>
          <div className="w-full sm:w-56">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Setor de Atuação</label>
            <select value={specialty} onChange={e => setSpecialty(e.target.value as Specialty)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 font-bold cursor-pointer outline-none focus:ring-2 focus:ring-blue-100">
              <option value={Specialty.MARCENARIA}>Marcenaria</option>
              <option value={Specialty.SERRALHERIA}>Serralheria</option>
            </select>
          </div>
          <button type="submit" className="h-[46px] mt-auto bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-lg font-bold shadow-md transition-all active:scale-95 disabled:opacity-50" disabled={!name.trim()}>Salvar</button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {collaborators.filter(c => !c.isArchived).map(c => (
          <CollaboratorCard 
            key={c.id} c={c} isEditing={editingId === c.id} 
            onEdit={() => startEdit(c)} 
            onArchive={() => onToggleArchive(c.id)}
            onDelete={() => setPassModal({ isOpen: true, type: 'delete', targetId: c.id })}
          />
        ))}
        {collaborators.filter(c => !c.isArchived).length === 0 && (
          <div className="sm:col-span-2 text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <User className="w-10 h-10 mx-auto mb-2 opacity-10" />
            <p className="text-xs font-bold uppercase tracking-tight">Nenhum membro ativo</p>
          </div>
        )}
      </div>
      
      <div className="pt-4 border-t border-slate-200 flex flex-col items-center">
        <button onClick={() => setShowArchived(!showArchived)} className="text-slate-500 font-medium flex items-center gap-2 hover:text-slate-800 transition-colors text-sm">
          <Archive className="w-4 h-4" /> {showArchived ? 'Ocultar Arquivados' : 'Exibir Arquivados'}
        </button>
        {showArchived && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 w-full animate-in fade-in slide-in-from-bottom-2">
            {collaborators.filter(c => c.isArchived).map(c => (
              <CollaboratorCard key={c.id} c={c} isEditing={false} onEdit={() => startEdit(c)} onArchive={() => onToggleArchive(c.id)} onDelete={() => setPassModal({ isOpen: true, type: 'delete', targetId: c.id })} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CollaboratorCard: React.FC<{
  c: Collaborator;
  isEditing: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}> = ({ c, isEditing, onEdit, onArchive, onDelete }) => (
  <div className={`bg-white p-3 sm:p-4 rounded-xl border flex items-center justify-between group transition-all ${isEditing ? 'border-blue-400 ring-1 ring-blue-50 shadow-md' : 'border-slate-200'} hover:border-blue-300 ${c.isArchived ? 'opacity-70 grayscale-[0.2]' : ''}`}>
    <div className="flex items-center gap-3 min-w-0">
      <div className={`p-2.5 rounded-lg shrink-0 transition-colors ${c.specialty === Specialty.MARCENARIA ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
        {c.specialty === Specialty.MARCENARIA ? <Hammer className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
      </div>
      <div className="min-w-0">
        <h3 className="font-bold text-slate-800 leading-tight truncate">{c.name}</h3>
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{c.specialty}</p>
      </div>
    </div>
    <div className="flex items-center gap-0.5 shrink-0">
      <button onClick={onEdit} className="p-2 text-slate-400 hover:text-blue-600 transition-all" title="Editar"><Edit2 className="w-4 h-4" /></button>
      <button onClick={onArchive} className="p-2 text-slate-400 hover:text-amber-600 transition-all" title={c.isArchived ? 'Desarquivar' : 'Arquivar'}>{c.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}</button>
      <button onClick={onDelete} className="p-2 text-slate-300 hover:text-red-500 transition-all" title="Excluir"><Trash2 className="w-4 h-4" /></button>
    </div>
  </div>
);

export default CollaboratorManager;
