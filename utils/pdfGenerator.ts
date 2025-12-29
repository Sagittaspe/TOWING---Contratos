
import { Contract, Activity, Collaborator } from '../types';
import { format, startOfWeek, isWithinInterval, parseISO, isAfter, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

declare const jspdf: any;

export const generateContractsPDF = (contracts: Contract[], collaborators: Collaborator[]) => {
  // Orientação Paisagem (landscape)
  const doc = new jspdf.jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cabeçalho Compacto
  doc.setFontSize(14);
  doc.setTextColor(0, 51, 102);
  doc.setFont(undefined, 'bold');
  doc.text('TOWING - Assessoria Naval', 14, 15);
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont(undefined, 'normal');
  doc.text(`Relatório Geral de Contratos | Emissão: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - 14, 15, { align: 'right' });

  // Linha divisória do cabeçalho
  doc.setDrawColor(200);
  doc.line(14, 18, pageWidth - 14, 18);

  let currentY = 25;

  contracts.forEach((contract) => {
    // Verificação de espaço para o bloco do contrato
    if (currentY > 180) {
      doc.addPage();
      currentY = 20;
    }

    // Título do Contrato (Compacto)
    doc.setFontSize(11);
    doc.setTextColor(0, 51, 102);
    doc.setFont(undefined, 'bold');
    doc.text(`CONTRATO #${contract.number}`, 14, currentY);
    
    // Detalhes em uma única linha (Compacto)
    const contractColabs = collaborators
      .filter(c => contract.collaboratorIds.includes(c.id))
      .map(c => c.name)
      .join(', ');
    
    doc.setFontSize(8);
    doc.setTextColor(80);
    doc.setFont(undefined, 'normal');
    const details = `Vigência: ${format(parseISO(contract.startDate), 'dd/MM/yyyy')} a ${format(parseISO(contract.endDate), 'dd/MM/yyyy')}  |  Equipe: ${contractColabs || 'Nenhum designado'}`;
    doc.text(details, 14, currentY + 5);
    
    currentY += 8;

    if (contract.activities.length > 0) {
      const tableData = contract.activities.map(act => [
        act.description,
        `${format(parseISO(act.startDate), 'dd/MM')} - ${format(parseISO(act.endDate), 'dd/MM')}`,
        `${act.progress}%`,
        act.status,
        act.notes || '-'
      ]);

      doc.autoTable({
        startY: currentY,
        head: [['Atividade', 'Período', 'Progresso', 'Status', 'Observações']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 51, 102], fontSize: 8, halign: 'center' },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 80 }, // Descrição
          1: { cellWidth: 30, halign: 'center' }, // Período
          2: { cellWidth: 20, halign: 'center' }, // Progresso
          3: { cellWidth: 30, halign: 'center' }, // Status
          4: { cellWidth: 'auto' } // Notas
        },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 12;
    } else {
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Nenhuma atividade registrada neste contrato.', 20, currentY + 2);
      currentY += 12;
    }
  });

  // Rodapé com numeração de páginas
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount} - TOWING Assessoria Naval`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  doc.save(`TOWING_Relatorio_Geral_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const generateWeeklyPDF = (contracts: Contract[], collaborators: Collaborator[], referenceDate: Date = new Date()) => {
  const doc = new jspdf.jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  const today = startOfDay(referenceDate);
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const sunday = addDays(monday, 6);
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Compacto Paisagem
  doc.setFontSize(18);
  doc.setTextColor(0, 51, 102);
  doc.text('TOWING - Agenda Semanal', 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Período: ${format(monday, 'dd/MM/yyyy')} a ${format(sunday, 'dd/MM/yyyy')} | Emitido: ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth - 14, 15, { align: 'right' });

  let currentY = 22;
  
  const weekDays = [0, 1, 2, 3, 4, 5, 6].map(offset => addDays(monday, offset));

  weekDays.forEach((day) => {
    if (currentY > 180) {
      doc.addPage();
      currentY = 20;
    }

    const dayName = format(day, 'EEEE', { locale: ptBR }).toUpperCase();
    const dayLabel = `${dayName} - ${format(day, 'dd/MM')}`;

    doc.setFontSize(10);
    doc.setTextColor(0, 51, 102);
    doc.setFont(undefined, 'bold');
    doc.text(dayLabel, 14, currentY);
    doc.setFont(undefined, 'normal');
    currentY += 4;

    const dayActivities = contracts.flatMap(contract => 
      contract.activities
        .filter(act => {
          const start = parseISO(act.startDate);
          const end = parseISO(act.endDate);
          const isWithin = isWithinInterval(day, { start, end });
          const isOverdue = isAfter(day, end) && act.progress < 100;
          return isWithin || isOverdue;
        })
        .map(act => ({ ...act, contractNumber: contract.number, colabIds: contract.collaboratorIds }))
    );

    if (dayActivities.length > 0) {
      const tableData = dayActivities.map(act => {
        const colabs = collaborators.filter(c => act.colabIds.includes(c.id)).map(c => c.name).join(', ');
        const isDelayed = isAfter(day, parseISO(act.endDate)) && act.progress < 100;
        return [
          `#${act.contractNumber}`,
          isDelayed ? `[ATRASADO] ${act.description}` : act.description,
          colabs || '-',
          `${act.progress}%`,
          act.status,
          act.notes || '-'
        ];
      });

      doc.autoTable({
        startY: currentY,
        head: [['Contrato', 'Atividade', 'Equipe', 'Progresso', 'Status', 'Observações']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [70, 70, 70], fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 20 }, // Contrato
          1: { cellWidth: 60 }, // Atividade
          2: { cellWidth: 40 }, // Equipe
          3: { cellWidth: 20, halign: 'center' }, // Progresso
          4: { cellWidth: 25, halign: 'center' }, // Status
          5: { cellWidth: 'auto' } // Observações
        },
        margin: { left: 14, right: 14 },
        didParseCell: (data: any) => {
           if (data.section === 'body' && data.column.index === 1 && data.cell.raw.includes('[ATRASADO]')) {
             data.cell.styles.textColor = [200, 80, 0];
             data.cell.styles.fontStyle = 'bold';
           }
        }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Livre de atividades', 20, currentY + 2);
      currentY += 10;
    }
  });

  doc.save(`Agenda_Towing_${format(referenceDate, 'yyyyMMdd')}.pdf`);
};
