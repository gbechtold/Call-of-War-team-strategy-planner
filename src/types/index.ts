export interface Unit {
  id: string;
  name: string;
  type: UnitType;
  buildTime: number; // in hours
  resources: Resources;
  icon?: string;
}

export const UnitType = {
  INFANTRY: 'INFANTRY',
  ARMOR: 'ARMOR',
  ARTILLERY: 'ARTILLERY',
  AIR_FORCE: 'AIR_FORCE',
  NAVY: 'NAVY',
  SUPPORT: 'SUPPORT'
} as const;

export type UnitType = typeof UnitType[keyof typeof UnitType];

export interface Resources {
  manpower?: number;
  oil?: number;
  metal?: number;
  rareMetals?: number;
  money?: number;
}

export interface Research {
  id: string;
  name: string;
  category: ResearchCategory;
  duration: number; // in hours
  prerequisites?: string[];
  effects: string[];
}

export const ResearchCategory = {
  INFANTRY: 'INFANTRY',
  ARMOR: 'ARMOR',
  AIR_FORCE: 'AIR_FORCE',
  NAVY: 'NAVY',
  INDUSTRY: 'INDUSTRY',
  SECRET_WEAPONS: 'SECRET_WEAPONS'
} as const;

export type ResearchCategory = typeof ResearchCategory[keyof typeof ResearchCategory];

export interface Task {
  id: string;
  name: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  category?: string;
  startDate: Date;
  endDate: Date;
  strategyId: string;
  assignedPlayers: string[];
  dependencies: string[];
  priority: number;
  progress?: number;
  color?: string;
  unitId?: string;
  researchId?: string;
}

export const TaskType = {
  UNIT_PRODUCTION: 'UNIT_PRODUCTION',
  RESEARCH: 'RESEARCH',
  MOVEMENT: 'MOVEMENT',
  ATTACK: 'ATTACK',
  DEFENSE: 'DEFENSE',
  CONSTRUCTION: 'CONSTRUCTION',
  DIPLOMACY: 'DIPLOMACY',
  CUSTOM: 'CUSTOM'
} as const;

export type TaskType = typeof TaskType[keyof typeof TaskType];

export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export interface Player {
  id: string;
  name: string;
  nation: string;
  color: string;
  role: PlayerRole;
}

export const PlayerRole = {
  COMMANDER: 'COMMANDER',
  OFFICER: 'OFFICER',
  MEMBER: 'MEMBER'
} as const;

export type PlayerRole = typeof PlayerRole[keyof typeof PlayerRole];

export interface Strategy {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  tasks: string[];
  players: string[];
  createdAt: Date;
  updatedAt: Date;
  version?: string;
}

export interface GanttRow {
  id: string;
  playerId: string;
  tasks: Task[];
}