
import React, { useState, useMemo } from 'react';
import { Contract, Collaborator, Specialty, ActivityStatus } from '../types';
import { format, startOfWeek, addDays, parseISO, isSameDay, isBefore, startOfDay, isAfter, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Filter, FileDown, Calendar as CalendarIcon, User, Inbox, AlertTriangle, Clock, ChevronDown, ChevronUp, Users, MessageCircle } from 'lucide-react';
import { generateWeeklyPDF } from '../utils/pdfGenerator';

interface CalendarViewProps {
  contracts: Contract[];
  collaborators: Collaborator[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ contracts, collaborators }) => {
  const [sectorFilter, setSectorFilter] = useState<'Todos' | Specialty>('Todos');
  const [selectedColabIds, setSelectedColabIds] = useState<string[]>([]);
  const [isDelayedExpanded, setIsDelayedExpanded] = useState(true);
  
  const today = useMemo(() => startOfDay(new Date()), []);
  const monday = useMemo(() => startOfWeek(today, { weekStartsOn: 1 }), [today]);
  
  const weekDays = useMemo(() => {
    // Retorna apenas de segunda (0) a sábado (5)
    return [0, 1, 2, 3, 4, 5].map(offset => addDays(monday, offset));
  }, [monday]);

  const activeCollaborators = useMemo(() => 
    collaborators.filter(c => !c.isArchived), 
  [collaborators]);

  const toggleColabFilter = (id: string) => {
    setSelectedColabIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredContracts = useMemo(() => contracts.filter(c => !c.isArchived), [contracts]);

  const applyFilters = (activities: any[]) => {
    return activities.filter(act => {
      // Filtro por Setor
      const actColabs = collaborators.filter(c => act.colabIds.includes(c.id));
      const matchesSector = sectorFilter === 'Todos' || actColabs.some(c => c.specialty === sectorFilter);
      
      // Filtro por Colaboradores Específicos
      const matchesColab = selectedColabIds.length === 0 || act.colabIds.some(id => selectedColabIds.includes(id));

      return matchesSector && matchesColab;
    });
  };

  const delayedActivities = useMemo(() => {
    const rawDelayed = filteredContracts.flatMap(contract => 
      contract.activities
        .filter(act => isBefore(parseISO(act.endDate), monday) && act.progress < 100)
        .map(act => ({ 
          ...act, 
          contractNumber: contract.number, 
          colabIds: contract.collaboratorIds 
        }))
    );
    return applyFilters(rawDelayed);
  }, [filteredContracts, monday, sectorFilter, selectedColabIds, collaborators]);

  const handleShareWhatsApp = (day: Date, activities: any[]) => {
    if (activities.length === 0) return;

    const dayLabel = format(day, "EEEE, dd 'de' MMMM", { locale: ptBR });
    let message = `*🚢 TOWING - Agenda de ${dayLabel.toUpperCase()}*\n\n`;
    message += `📋 *ATIVIDADES PENDENTES DO DIA:*\n\n`;

    activities.forEach(act => {
      const colabs = collaborators.filter(c => act.colabIds.includes(c.id)).map(c => c.name).join(', ');
      const isDelayed = isAfter(day, parseISO(act.endDate)) && act.progress < 100;
      
      message += `🔹 *CONTRATO #${act.contractNumber}*\n`;
      message += `${isDelayed ? '⚠️ *[ATRASADO]* ' : '✅ '}${act.description}\n`;
      message += `📊 Progresso: ${act.progress}%\n`;
      message += `👥 Equipe: ${colabs || 'Nenhum designado'}\n`;
      message += `\n`;
    });

    message += `---\n_Gerado por TOWING Assessoria Naval_`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header com Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-[4.5rem] md:top-24 z-40 space-y-5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="bg-blue-600 p-2 rounded-lg shadow-md shrink-0">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 leading-tight">Agenda Semanal</h2>
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Fluxo de Trabalho</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Filtro de Setor em Botões */}
            <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200">
              <button
                onClick={() => setSectorFilter('Todos')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                  sectorFilter === 'Todos'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSectorFilter(Specialty.MARCENARIA)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                  sectorFilter === Specialty.MARCENARIA
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Marcenaria
              </button>
              <button
                onClick={() => setSectorFilter(Specialty.SERRALHERIA)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                  sectorFilter === Specialty.SERRALHERIA
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Serralheria
              </button>
            </div>
            
            <button
              onClick={() => generateWeeklyPDF(contracts.filter(c => !c.isArchived), collaborators, new Date())}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold shadow-md transition-all flex-grow lg:flex-grow-0 justify-center"
            >
              <FileDown className="w-4 h-4 shrink-0" />
              <span>PDF Agenda</span>
            </button>
          </div>
        </div>

        {/* Filtro de Colaboradores (Botões) */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar por Equipe</span>
            {selectedColabIds.length > 0 && (
              <button 
                onClick={() => setSelectedColabIds([])}
                className="text-[9px] font-bold text-blue-600 hover:text-blue-700 ml-auto"
              >
                Limpar seleção
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
            {activeCollaborators.map(c => (
              <button
                key={c.id}
                onClick={() => toggleColabFilter(c.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                  selectedColabIds.includes(c.id)
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-white'
                }`}
              >
                <User className={`w-3 h-3 ${selectedColabIds.includes(c.id) ? 'text-blue-100' : 'text-slate-400'}`} />
                {c.name}
              </button>
            ))}
            {activeCollaborators.length === 0 && (
              <p className="text-[10px] text-slate-400 italic">Nenhum colaborador ativo para filtrar.</p>
            )}
          </div>
        </div>
      </div>

      {/* Atividades Vencidas */}
      {delayedActivities.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
              <h3 className="text-base sm:text-lg font-black text-orange-700 uppercase tracking-tight">Vencidos ({delayedActivities.length})</h3>
            </div>
            <button 
              onClick={() => setIsDelayedExpanded(!isDelayedExpanded)}
              className="p-1.5 hover:bg-orange-100 rounded-lg transition-colors text-orange-600"
            >
              {isDelayedExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          
          {isDelayedExpanded && (
            <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              {delayedActivities.map((act) => {
                const actColabs = collaborators.filter(c => act.colabIds.includes(c.id));
                return (
                  <div 
                    key={act.id} 
                    className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-black bg-orange-200 text-orange-800 px-2 py-0.5 rounded uppercase shrink-0">Atrasado</span>
                        <span className="text-[9px] font-bold text-slate-500 shrink-0">#{act.contractNumber}</span>
                        <h4 className="text-sm font-bold text-slate-800 truncate break-words max-w-full">{act.description}</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {actColabs.map(c => (
                          <span key={c.id} className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            selectedColabIds.includes(c.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white/50 border-slate-200 text-slate-500'
                          }`}>
                            <User className="w-2.5 h-2.5 opacity-60" />
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-6 shrink-0 border-t md:border-0 border-orange-200 pt-3 md:pt-0">
                      <div className="flex flex-col items-start md:items-center gap-1">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider border shadow-sm ${
                          act.status === ActivityStatus.INTERROMPIDO ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {act.status}
                        </span>
                        <span className="text-[8px] font-black text-orange-700 bg-white px-1.5 py-0.5 rounded border border-orange-200 uppercase whitespace-nowrap">
                          {format(parseISO(act.endDate), 'dd/MM/yy')}
                        </span>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                         <div className="w-24 sm:w-32 bg-orange-200 h-2 rounded-full overflow-hidden border border-orange-300">
                          <div className="h-full bg-orange-600 transition-all duration-700" style={{ width: `${act.progress}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-orange-700">{act.progress}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Cascata Semanal */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Clock className="w-5 h-5 text-slate-400 shrink-0" />
          <h3 className="text-base sm:text-lg font-black text-slate-700 uppercase tracking-tight">Cascata Semanal</h3>
        </div>
        
        <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-8 sm:before:left-12 before:w-0.5 before:bg-slate-200 before:block">
          {weekDays.map((day, index) => {
            const rawDayActivities = filteredContracts.flatMap(contract => 
              contract.activities
                .filter(act => {
                  // Filtro principal: Remove atividades com 100% de progresso
                  if (act.progress === 100) return false;

                  const start = parseISO(act.startDate);
                  const end = parseISO(act.endDate);
                  const isWithin = isWithinInterval(day, { start, end });
                  const isOverdue = isAfter(day, end);
                  return isWithin || isOverdue;
                })
                .map(act => ({ 
                  ...act, 
                  contractNumber: contract.number, 
                  colabIds: contract.collaboratorIds 
                }))
            );

            const filteredDayActivities = applyFilters(rawDayActivities);
            const isToday = isSameDay(day, today);

            return (
              <div 
                key={day.toString()} 
                className={`flex gap-3 sm:gap-4 group animate-in slide-in-from-left-4 duration-300 ${isToday ? 'relative' : ''}`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div className={`w-16 sm:w-24 shrink-0 flex flex-col items-center justify-center border rounded-xl shadow-sm py-2 transition-all z-10 ${isToday ? 'bg-blue-600 border-blue-600 scale-105 shadow-blue-200' : 'bg-white border-slate-200'}`}>
                  <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-blue-100' : 'text-slate-400'}`}>{format(day, 'EEE', { locale: ptBR })}</span>
                  <span className={`text-xl sm:text-2xl font-black leading-none my-0.5 ${isToday ? 'text-white' : 'text-slate-800'}`}>{format(day, 'dd')}</span>
                  <span className={`text-[8px] sm:text-[10px] font-bold ${isToday ? 'text-blue-200' : 'text-slate-400'}`}>{format(day, 'MMM', { locale: ptBR })}</span>
                  
                  {filteredDayActivities.length > 0 && (
                    <button 
                      onClick={() => handleShareWhatsApp(day, filteredDayActivities)}
                      className={`mt-3 p-1.5 rounded-full transition-all border ${
                        isToday 
                          ? 'bg-white/20 text-white border-white/40 hover:bg-white/40' 
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 shadow-sm'
                      }`}
                      title="Compartilhar pelo WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex-grow space-y-2 min-w-0">
                  {filteredDayActivities.length > 0 ? (
                    filteredDayActivities.map(act => {
                      const actColabs = collaborators.filter(c => act.colabIds.includes(c.id));
                      const isDelayedHere = isAfter(day, parseISO(act.endDate)) && act.progress < 100;
                      
                      return (
                        <div key={act.id} className={`border rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${isDelayedHere ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                          <div className="space-y-1.5 min-w-0 flex-grow">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isDelayedHere && <span className="text-[8px] font-black bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded border border-orange-300 uppercase shrink-0">Atrasado</span>}
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border shrink-0 ${isDelayedHere ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>#{act.contractNumber}</span>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-800 break-words leading-tight">{act.description}</h4>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {actColabs.map(c => (
                                <span key={c.id} className={`inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                                  selectedColabIds.includes(c.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white/60 border-slate-100 text-slate-500'
                                }`}>
                                  <User className="w-2.5 h-2.5 opacity-60" />
                                  {c.name}
                                </span>
                              ))}
                              {!isDelayedHere && (
                                <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1 ml-auto">
                                  {format(parseISO(act.endDate), 'dd/MM')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-0 border-slate-100 pt-2 md:pt-0">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase border shadow-sm ${
                              act.status === ActivityStatus.INTERROMPIDO ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                              {act.status}
                            </span>
                            <div className="flex flex-col items-end gap-1">
                               <div className="w-20 h-1.5 rounded-full overflow-hidden border bg-slate-100 border-slate-200">
                                <div 
                                  className={`h-full transition-all duration-700 ${act.progress === 100 ? 'bg-emerald-500' : isDelayedHere ? 'bg-orange-600' : 'bg-blue-500'}`} 
                                  style={{ width: `${act.progress}%` }}
                                />
                              </div>
                              <span className="text-[8px] font-black text-slate-600">{act.progress}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full min-h-[48px] flex items-center bg-slate-50/50 border border-slate-200 border-dashed rounded-xl px-4 transition-colors">
                      <p className="text-[10px] text-slate-400 font-medium italic">
                        {selectedColabIds.length > 0 ? 'Nenhuma tarefa pendente para selecionados' : 'Dia livre'}
                      </p>
                    </div>
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

export default CalendarView;
