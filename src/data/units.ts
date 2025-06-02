import { type Unit, UnitType } from '../types';

export const GAME_UNITS: Record<string, Unit> = {
  // Infantry Units (Build times in minutes - Call of War accurate timings)
  militia: {
    id: 'militia',
    name: 'Militia',
    type: UnitType.INFANTRY,
    buildTime: 90, // 1.5h
    resources: { manpower: 1000, money: 500 },
    icon: '🥾'
  },
  infantry: {
    id: 'infantry',
    name: 'Infantry',
    type: UnitType.INFANTRY,
    buildTime: 120, // 2h
    resources: { manpower: 2000, money: 1000, metal: 500 },
    icon: '🪖'
  },
  motorized_infantry: {
    id: 'motorized_infantry',
    name: 'Motorized Infantry',
    type: UnitType.INFANTRY,
    buildTime: 300, // 5h
    resources: { manpower: 2500, money: 2000, oil: 1000, metal: 1000 },
    icon: '🚛'
  },
  mechanized_infantry: {
    id: 'mechanized_infantry',
    name: 'Mechanized Infantry',
    type: UnitType.INFANTRY,
    buildTime: 420, // 7h
    resources: { manpower: 3000, money: 3000, oil: 2000, metal: 2000 },
    icon: '🛡️'
  },
  commandos: {
    id: 'commandos',
    name: 'Commandos',
    type: UnitType.INFANTRY,
    buildTime: 2160, // 36h (from research)
    resources: { manpower: 2000, money: 5000, oil: 1000, metal: 2000 },
    icon: '🗡️'
  },
  paratroopers: {
    id: 'paratroopers',
    name: 'Paratroopers',
    type: UnitType.INFANTRY,
    buildTime: 360, // 6h
    resources: { manpower: 2500, money: 4000, oil: 1000, metal: 1500 },
    icon: '🪂'
  },
  
  // Armor Units (Call of War accurate timings)
  armored_car: {
    id: 'armored_car',
    name: 'Armored Car',
    type: UnitType.ARMOR,
    buildTime: 540, // 9h
    resources: { manpower: 500, money: 1500, oil: 1000, metal: 1500 },
    icon: '🚗'
  },
  light_tank: {
    id: 'light_tank',
    name: 'Light Tank',
    type: UnitType.ARMOR,
    buildTime: 195, // 3.25h
    resources: { manpower: 1000, money: 3000, oil: 2000, metal: 3000 },
    icon: '🎯'
  },
  medium_tank: {
    id: 'medium_tank',
    name: 'Medium Tank',
    type: UnitType.ARMOR,
    buildTime: 435, // 7.25h
    resources: { manpower: 1500, money: 5000, oil: 3000, metal: 5000 },
    icon: '🎖️'
  },
  heavy_tank: {
    id: 'heavy_tank',
    name: 'Heavy Tank',
    type: UnitType.ARMOR,
    buildTime: 525, // 8.75h
    resources: { manpower: 2000, money: 8000, oil: 5000, metal: 8000, rareMetals: 2000 },
    icon: '⚔️'
  },
  tank_destroyer: {
    id: 'tank_destroyer',
    name: 'Tank Destroyer',
    type: UnitType.ARMOR,
    buildTime: 390, // 6.5h
    resources: { manpower: 1200, money: 4000, oil: 2000, metal: 4000 },
    icon: '🎱'
  },
  super_heavy_tank: {
    id: 'super_heavy_tank',
    name: 'Super Heavy Tank',
    type: UnitType.ARMOR,
    buildTime: 720, // 12h
    resources: { manpower: 3000, money: 12000, oil: 8000, metal: 12000, rareMetals: 4000 },
    icon: '🛡️'
  },
  
  // Artillery Units (Call of War accurate timings)
  artillery: {
    id: 'artillery',
    name: 'Artillery',
    type: UnitType.ARTILLERY,
    buildTime: 300, // 5h
    resources: { manpower: 1000, money: 3000, metal: 3000 },
    icon: '💥'
  },
  anti_tank: {
    id: 'anti_tank',
    name: 'Anti-Tank',
    type: UnitType.ARTILLERY,
    buildTime: 240, // 4h
    resources: { manpower: 500, money: 2000, metal: 2000 },
    icon: '🎯'
  },
  anti_air: {
    id: 'anti_air',
    name: 'Anti-Air',
    type: UnitType.ARTILLERY,
    buildTime: 210, // 3.5h
    resources: { manpower: 750, money: 2500, metal: 2500 },
    icon: '🔫'
  },
  rocket_artillery: {
    id: 'rocket_artillery',
    name: 'Rocket Artillery',
    type: UnitType.ARTILLERY,
    buildTime: 480, // 8h
    resources: { manpower: 2000, money: 7000, oil: 3000, metal: 5000, rareMetals: 1000 },
    icon: '🚀'
  },
  railgun: {
    id: 'railgun',
    name: 'Railgun',
    type: UnitType.ARTILLERY,
    buildTime: 4320, // 72h (from research)
    resources: { manpower: 3000, money: 15000, oil: 5000, metal: 10000, rareMetals: 3000 },
    icon: '🚂'
  },
  sp_artillery: {
    id: 'sp_artillery',
    name: 'Self-Propelled Artillery',
    type: UnitType.ARTILLERY,
    buildTime: 420, // 7h
    resources: { manpower: 1500, money: 5000, oil: 2000, metal: 4000 },
    icon: '🛞'
  },
  sp_anti_air: {
    id: 'sp_anti_air',
    name: 'Self-Propelled Anti-Air',
    type: UnitType.ARTILLERY,
    buildTime: 1440, // 24h (from research)
    resources: { manpower: 1200, money: 4500, oil: 1800, metal: 3500 },
    icon: '🛡️'
  },
  
  // Air Force Units (Call of War accurate timings)
  interceptor: {
    id: 'interceptor',
    name: 'Interceptor',
    type: UnitType.AIR_FORCE,
    buildTime: 240, // 4h
    resources: { manpower: 500, money: 4000, oil: 2000, metal: 3000 },
    icon: '✈️'
  },
  fighter: {
    id: 'fighter',
    name: 'Fighter',
    type: UnitType.AIR_FORCE,
    buildTime: 270, // 4.5h
    resources: { manpower: 600, money: 4500, oil: 2500, metal: 3500 },
    icon: '🛩️'
  },
  tactical_bomber: {
    id: 'tactical_bomber',
    name: 'Tactical Bomber',
    type: UnitType.AIR_FORCE,
    buildTime: 330, // 5.5h
    resources: { manpower: 1000, money: 6000, oil: 4000, metal: 4000 },
    icon: '💣'
  },
  strategic_bomber: {
    id: 'strategic_bomber',
    name: 'Strategic Bomber',
    type: UnitType.AIR_FORCE,
    buildTime: 540, // 9h
    resources: { manpower: 1500, money: 10000, oil: 6000, metal: 6000, rareMetals: 2000 },
    icon: '🛩️'
  },
  naval_bomber: {
    id: 'naval_bomber',
    name: 'Naval Bomber',
    type: UnitType.AIR_FORCE,
    buildTime: 390, // 6.5h
    resources: { manpower: 1200, money: 7000, oil: 4000, metal: 4500 },
    icon: '🎯'
  },
  jet_fighter: {
    id: 'jet_fighter',
    name: 'Jet Fighter',
    type: UnitType.AIR_FORCE,
    buildTime: 360, // 6h
    resources: { manpower: 1000, money: 8000, oil: 5000, metal: 5000, rareMetals: 2000 },
    icon: '🚀'
  },
  nuclear_bomber: {
    id: 'nuclear_bomber',
    name: 'Nuclear Bomber',
    type: UnitType.AIR_FORCE,
    buildTime: 1440, // 24h
    resources: { manpower: 2000, money: 20000, oil: 10000, metal: 10000, rareMetals: 5000 },
    icon: '☢️'
  },
  fighter_bomber: {
    id: 'fighter_bomber',
    name: 'Fighter-Bomber',
    type: UnitType.AIR_FORCE,
    buildTime: 1080, // 18h (from research)
    resources: { manpower: 800, money: 5500, oil: 3000, metal: 4000 },
    icon: '🛩️'
  },
  
  // Navy Units (Call of War accurate timings)
  submarine: {
    id: 'submarine',
    name: 'Submarine',
    type: UnitType.NAVY,
    buildTime: 720, // 12h
    resources: { manpower: 1000, money: 5000, oil: 2000, metal: 5000 },
    icon: '🤿'
  },
  destroyer: {
    id: 'destroyer',
    name: 'Destroyer',
    type: UnitType.NAVY,
    buildTime: 960, // 16h
    resources: { manpower: 2000, money: 8000, oil: 4000, metal: 8000 },
    icon: '🚢'
  },
  cruiser: {
    id: 'cruiser',
    name: 'Cruiser',
    type: UnitType.NAVY,
    buildTime: 1200, // 20h
    resources: { manpower: 3000, money: 12000, oil: 6000, metal: 10000, rareMetals: 2000 },
    icon: '⚓'
  },
  battleship: {
    id: 'battleship',
    name: 'Battleship',
    type: UnitType.NAVY,
    buildTime: 1440, // 24h
    resources: { manpower: 5000, money: 20000, oil: 10000, metal: 15000, rareMetals: 5000 },
    icon: '🛳️'
  },
  aircraft_carrier: {
    id: 'aircraft_carrier',
    name: 'Aircraft Carrier',
    type: UnitType.NAVY,
    buildTime: 4320, // 72h (from research)
    resources: { manpower: 6000, money: 25000, oil: 12000, metal: 18000, rareMetals: 7000 },
    icon: '🛫'
  },
  
  // Secret/Special Units (Call of War accurate timings)
  rocket: {
    id: 'rocket',
    name: 'Rocket',
    type: UnitType.SUPPORT,
    buildTime: 2160, // 36h (from research)
    resources: { manpower: 1500, money: 8000, oil: 3000, metal: 6000, rareMetals: 3000 },
    icon: '🚀'
  },
  nuclear_rocket: {
    id: 'nuclear_rocket',
    name: 'Nuclear Rocket',
    type: UnitType.SUPPORT,
    buildTime: 4320, // 72h (from research)
    resources: { manpower: 2000, money: 40000, oil: 10000, metal: 20000, rareMetals: 15000 },
    icon: '☢️'
  },
  atomic_bomb: {
    id: 'atomic_bomb',
    name: 'Atomic Bomb',
    type: UnitType.SUPPORT,
    buildTime: 5760, // 96h (from research)
    resources: { manpower: 3000, money: 50000, oil: 15000, metal: 25000, rareMetals: 20000 },
    icon: '💣'
  }
};

export const getUnitsByType = (type: UnitType): Unit[] => {
  return Object.values(GAME_UNITS).filter(unit => unit.type === type);
};

export const getUnitBuildDuration = (unit: Unit): number => {
  // Convert build time from minutes to hours for timeline planning
  // Call of War units now use realistic hour-based timings
  const hours = Math.max(1, Math.ceil(unit.buildTime / 60)); // Convert minutes to hours, minimum 1 hour
  return hours;
};

// Get units that require specific research to unlock
export const getUnitResearchRequirements = (unitId: string): string[] => {
  const researchRequirements: Record<string, string[]> = {
    // Infantry
    'infantry': ['infantry_weapons'],
    'motorized_infantry': ['motorization'],
    'mechanized_infantry': ['mechanized_warfare'],
    'commandos': ['special_forces'],
    'paratroopers': ['airborne_forces'],
    
    // Armor
    'armored_car': ['armored_vehicles'],
    'light_tank': ['tank_development'],
    'medium_tank': ['advanced_armor'],
    'heavy_tank': ['heavy_armor'],
    'tank_destroyer': ['tank_destroyers'],
    'super_heavy_tank': ['super_heavy_armor'],
    
    // Air Force
    'interceptor': ['aviation'],
    'fighter': ['fighter_aircraft'],
    'tactical_bomber': ['bomber_aircraft'],
    'naval_bomber': ['naval_aviation'],
    'strategic_bomber': ['strategic_bombing'],
    'fighter_bomber': ['fighter_aircraft'],
    'jet_fighter': ['jet_propulsion'],
    'nuclear_bomber': ['nuclear_physics', 'strategic_bombing'],
    
    // Navy
    'submarine': ['naval_engineering'],
    'destroyer': ['destroyer_technology'],
    'cruiser': ['cruiser_technology'],
    'battleship': ['battleship_technology'],
    'aircraft_carrier': ['carrier_technology'],
    
    // Artillery
    'artillery': ['artillery_research'],
    'anti_tank': ['anti_tank_weapons'],
    'anti_air': ['anti_air_weapons'],
    'rocket_artillery': ['rocket_technology'],
    'railgun': ['railgun_technology'],
    'sp_artillery': ['self_propelled_artillery'],
    'sp_anti_air': ['self_propelled_anti_air'],
    
    // Support/Secret Weapons
    'rocket': ['rocket_technology'],
    'nuclear_rocket': ['nuclear_physics', 'rocket_technology'],
    'atomic_bomb': ['nuclear_physics']
  };
  
  return researchRequirements[unitId] || [];
};