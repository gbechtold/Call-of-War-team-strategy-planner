import { type Unit, UnitType } from '../types';

export const GAME_UNITS: Record<string, Unit> = {
  // Infantry Units
  militia: {
    id: 'militia',
    name: 'Militia',
    type: UnitType.INFANTRY,
    buildTime: 6,
    resources: { manpower: 1000, money: 500 },
    icon: '🥾'
  },
  infantry: {
    id: 'infantry',
    name: 'Infantry',
    type: UnitType.INFANTRY,
    buildTime: 12,
    resources: { manpower: 2000, money: 1000, metal: 500 },
    icon: '🪖'
  },
  motorized_infantry: {
    id: 'motorized_infantry',
    name: 'Motorized Infantry',
    type: UnitType.INFANTRY,
    buildTime: 18,
    resources: { manpower: 2500, money: 2000, oil: 1000, metal: 1000 },
    icon: '🚛'
  },
  mechanized_infantry: {
    id: 'mechanized_infantry',
    name: 'Mechanized Infantry',
    type: UnitType.INFANTRY,
    buildTime: 24,
    resources: { manpower: 3000, money: 3000, oil: 2000, metal: 2000 },
    icon: '🛡️'
  },
  
  // Armor Units
  armored_car: {
    id: 'armored_car',
    name: 'Armored Car',
    type: UnitType.ARMOR,
    buildTime: 12,
    resources: { manpower: 500, money: 1500, oil: 1000, metal: 1500 },
    icon: '🚗'
  },
  light_tank: {
    id: 'light_tank',
    name: 'Light Tank',
    type: UnitType.ARMOR,
    buildTime: 18,
    resources: { manpower: 1000, money: 3000, oil: 2000, metal: 3000 },
    icon: '🎯'
  },
  medium_tank: {
    id: 'medium_tank',
    name: 'Medium Tank',
    type: UnitType.ARMOR,
    buildTime: 24,
    resources: { manpower: 1500, money: 5000, oil: 3000, metal: 5000 },
    icon: '🎖️'
  },
  heavy_tank: {
    id: 'heavy_tank',
    name: 'Heavy Tank',
    type: UnitType.ARMOR,
    buildTime: 36,
    resources: { manpower: 2000, money: 8000, oil: 5000, metal: 8000, rareMetals: 2000 },
    icon: '⚔️'
  },
  
  // Artillery Units
  anti_tank: {
    id: 'anti_tank',
    name: 'Anti-Tank',
    type: UnitType.ARTILLERY,
    buildTime: 12,
    resources: { manpower: 500, money: 2000, metal: 2000 },
    icon: '🎯'
  },
  artillery: {
    id: 'artillery',
    name: 'Artillery',
    type: UnitType.ARTILLERY,
    buildTime: 18,
    resources: { manpower: 1000, money: 3000, metal: 3000 },
    icon: '💥'
  },
  sp_artillery: {
    id: 'sp_artillery',
    name: 'SP Artillery',
    type: UnitType.ARTILLERY,
    buildTime: 24,
    resources: { manpower: 1500, money: 5000, oil: 2000, metal: 4000 },
    icon: '🚀'
  },
  rocket_artillery: {
    id: 'rocket_artillery',
    name: 'Rocket Artillery',
    type: UnitType.ARTILLERY,
    buildTime: 30,
    resources: { manpower: 2000, money: 7000, oil: 3000, metal: 5000, rareMetals: 1000 },
    icon: '🚀'
  },
  
  // Air Force Units
  interceptor: {
    id: 'interceptor',
    name: 'Interceptor',
    type: UnitType.AIR_FORCE,
    buildTime: 18,
    resources: { manpower: 500, money: 4000, oil: 2000, metal: 3000 },
    icon: '✈️'
  },
  tactical_bomber: {
    id: 'tactical_bomber',
    name: 'Tactical Bomber',
    type: UnitType.AIR_FORCE,
    buildTime: 24,
    resources: { manpower: 1000, money: 6000, oil: 4000, metal: 4000 },
    icon: '💣'
  },
  strategic_bomber: {
    id: 'strategic_bomber',
    name: 'Strategic Bomber',
    type: UnitType.AIR_FORCE,
    buildTime: 36,
    resources: { manpower: 1500, money: 10000, oil: 6000, metal: 6000, rareMetals: 2000 },
    icon: '🛩️'
  },
  
  // Navy Units
  submarine: {
    id: 'submarine',
    name: 'Submarine',
    type: UnitType.NAVY,
    buildTime: 24,
    resources: { manpower: 1000, money: 5000, oil: 2000, metal: 5000 },
    icon: '🤿'
  },
  destroyer: {
    id: 'destroyer',
    name: 'Destroyer',
    type: UnitType.NAVY,
    buildTime: 36,
    resources: { manpower: 2000, money: 8000, oil: 4000, metal: 8000 },
    icon: '🚢'
  },
  cruiser: {
    id: 'cruiser',
    name: 'Cruiser',
    type: UnitType.NAVY,
    buildTime: 48,
    resources: { manpower: 3000, money: 12000, oil: 6000, metal: 10000, rareMetals: 2000 },
    icon: '⚓'
  },
  battleship: {
    id: 'battleship',
    name: 'Battleship',
    type: UnitType.NAVY,
    buildTime: 72,
    resources: { manpower: 5000, money: 20000, oil: 10000, metal: 15000, rareMetals: 5000 },
    icon: '🛳️'
  }
};

export const getUnitsByType = (type: UnitType): Unit[] => {
  return Object.values(GAME_UNITS).filter(unit => unit.type === type);
};

export const getUnitBuildDuration = (unit: Unit): number => {
  // Convert hours to days (rounded up)
  return Math.ceil(unit.buildTime / 24);
};