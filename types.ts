
export enum Specialty {
  MARCENARIA = 'Marcenaria',
  SERRALHERIA = 'Serralheria'
}

export enum ActivityStatus {
  ANDAMENTO = 'Andamento',
  INTERROMPIDO = 'Interrompido'
}

export type ProgressLevel = 25 | 50 | 75 | 100 | 0;

export interface Collaborator {
  id: string;
  name: string;
  specialty: Specialty;
  isArchived: boolean;
}

export interface Activity {
  id: string;
  description: string;
  startDate: string;
  endDate: string;
  progress: ProgressLevel;
  status: ActivityStatus;
  notes: string;
}

export interface Contract {
  id: string;
  number: string;
  startDate: string;
  endDate: string;
  collaboratorIds: string[];
  activities: Activity[];
  isArchived: boolean;
}

export type TabType = 'contratos' | 'agenda' | 'colaboradores';
