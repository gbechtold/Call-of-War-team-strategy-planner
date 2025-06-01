export interface Unit {
  id: string;
  name: string;
  type: UnitType;
  buildTime: number; // in hours
  resources: Resources;
  icon?: string;
}

export enum UnitType {
  INFANTRY = 'INFANTRY',
  ARMOR = 'ARMOR',
  ARTILLERY = 'ARTILLERY',
  AIR_FORCE = 'AIR_FORCE',
  NAVY = 'NAVY',
  SUPPORT = 'SUPPORT'
}

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

export enum ResearchCategory {
  INFANTRY = 'INFANTRY',
  ARMOR = 'ARMOR',
  AIR_FORCE = 'AIR_FORCE',
  NAVY = 'NAVY',
  INDUSTRY = 'INDUSTRY',
  SECRET_WEAPONS = 'SECRET_WEAPONS'
}

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

export enum TaskType {
  UNIT_PRODUCTION = 'UNIT_PRODUCTION',
  RESEARCH = 'RESEARCH',
  MOVEMENT = 'MOVEMENT',
  ATTACK = 'ATTACK',
  DEFENSE = 'DEFENSE',
  CONSTRUCTION = 'CONSTRUCTION',
  DIPLOMACY = 'DIPLOMACY',
  CUSTOM = 'CUSTOM'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Player {
  id: string;
  name: string;
  nation: string;
  color: string;
  role: PlayerRole;
}

export enum PlayerRole {
  COMMANDER = 'COMMANDER',
  OFFICER = 'OFFICER',
  MEMBER = 'MEMBER'
}

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