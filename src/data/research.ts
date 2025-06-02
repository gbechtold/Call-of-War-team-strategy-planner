import { type Research, ResearchCategory } from '../types';

export const GAME_RESEARCH: Record<string, Research> = {
  // Infantry Research
  infantry_weapons: {
    id: 'infantry_weapons',
    name: 'Infantry Weapons',
    category: ResearchCategory.INFANTRY,
    duration: 72, // 3 days
    prerequisites: [],
    effects: ['Unlocks Infantry production', 'Improves infantry attack +10%']
  },
  motorization: {
    id: 'motorization',
    name: 'Motorization',
    category: ResearchCategory.INFANTRY,
    duration: 96, // 4 days
    prerequisites: ['infantry_weapons'],
    effects: ['Unlocks Motorized Infantry', 'Improves infantry speed +25%']
  },
  mechanized_warfare: {
    id: 'mechanized_warfare',
    name: 'Mechanized Warfare',
    category: ResearchCategory.INFANTRY,
    duration: 120, // 5 days
    prerequisites: ['motorization'],
    effects: ['Unlocks Mechanized Infantry', 'Improves armor coordination +15%']
  },
  airborne_forces: {
    id: 'airborne_forces',
    name: 'Airborne Forces',
    category: ResearchCategory.INFANTRY,
    duration: 144, // 6 days
    prerequisites: ['mechanized_warfare'],
    effects: ['Unlocks Paratroopers', 'Enables air drops behind enemy lines']
  },

  // Armor Research
  armored_vehicles: {
    id: 'armored_vehicles',
    name: 'Armored Vehicles',
    category: ResearchCategory.ARMOR,
    duration: 72,
    prerequisites: [],
    effects: ['Unlocks Armored Car production', 'Basic armor tactics +10%']
  },
  tank_development: {
    id: 'tank_development',
    name: 'Tank Development',
    category: ResearchCategory.ARMOR,
    duration: 96,
    prerequisites: ['armored_vehicles'],
    effects: ['Unlocks Light Tank', 'Tank reliability +20%']
  },
  advanced_armor: {
    id: 'advanced_armor',
    name: 'Advanced Armor',
    category: ResearchCategory.ARMOR,
    duration: 120,
    prerequisites: ['tank_development'],
    effects: ['Unlocks Medium Tank', 'Armor protection +25%']
  },
  heavy_armor: {
    id: 'heavy_armor',
    name: 'Heavy Armor',
    category: ResearchCategory.ARMOR,
    duration: 144,
    prerequisites: ['advanced_armor'],
    effects: ['Unlocks Heavy Tank', 'Breakthrough tactics +30%']
  },
  tank_destroyers: {
    id: 'tank_destroyers',
    name: 'Tank Destroyers',
    category: ResearchCategory.ARMOR,
    duration: 108,
    prerequisites: ['advanced_armor'],
    effects: ['Unlocks Tank Destroyer', 'Anti-tank effectiveness +40%']
  },

  // Air Force Research
  aviation: {
    id: 'aviation',
    name: 'Aviation',
    category: ResearchCategory.AIR_FORCE,
    duration: 72,
    prerequisites: [],
    effects: ['Unlocks Interceptor production', 'Basic air tactics +10%']
  },
  fighter_aircraft: {
    id: 'fighter_aircraft',
    name: 'Fighter Aircraft',
    category: ResearchCategory.AIR_FORCE,
    duration: 96,
    prerequisites: ['aviation'],
    effects: ['Unlocks Fighter', 'Air superiority +20%']
  },
  bomber_aircraft: {
    id: 'bomber_aircraft',
    name: 'Bomber Aircraft',
    category: ResearchCategory.AIR_FORCE,
    duration: 108,
    prerequisites: ['aviation'],
    effects: ['Unlocks Tactical Bomber', 'Ground attack +25%']
  },
  naval_aviation: {
    id: 'naval_aviation',
    name: 'Naval Aviation',
    category: ResearchCategory.AIR_FORCE,
    duration: 120,
    prerequisites: ['bomber_aircraft'],
    effects: ['Unlocks Naval Bomber', 'Anti-ship attacks +35%']
  },
  strategic_bombing: {
    id: 'strategic_bombing',
    name: 'Strategic Bombing',
    category: ResearchCategory.AIR_FORCE,
    duration: 144,
    prerequisites: ['bomber_aircraft'],
    effects: ['Unlocks Strategic Bomber', 'Infrastructure damage +50%']
  },
  jet_engines: {
    id: 'jet_engines',
    name: 'Jet Engines',
    category: ResearchCategory.AIR_FORCE,
    duration: 192,
    prerequisites: ['fighter_aircraft', 'strategic_bombing'],
    effects: ['Unlocks Jet Fighter', 'Air speed +100%']
  },

  // Navy Research
  naval_engineering: {
    id: 'naval_engineering',
    name: 'Naval Engineering',
    category: ResearchCategory.NAVY,
    duration: 72,
    prerequisites: [],
    effects: ['Unlocks Corvette and Submarine', 'Naval construction +10%']
  },
  destroyer_technology: {
    id: 'destroyer_technology',
    name: 'Destroyer Technology',
    category: ResearchCategory.NAVY,
    duration: 96,
    prerequisites: ['naval_engineering'],
    effects: ['Unlocks Destroyer', 'Anti-submarine warfare +25%']
  },
  cruiser_technology: {
    id: 'cruiser_technology',
    name: 'Cruiser Technology',
    category: ResearchCategory.NAVY,
    duration: 120,
    prerequisites: ['destroyer_technology'],
    effects: ['Unlocks Cruiser', 'Naval firepower +30%']
  },
  battleship_technology: {
    id: 'battleship_technology',
    name: 'Battleship Technology',
    category: ResearchCategory.NAVY,
    duration: 168,
    prerequisites: ['cruiser_technology'],
    effects: ['Unlocks Battleship', 'Capital ship supremacy +50%']
  },
  nuclear_propulsion: {
    id: 'nuclear_propulsion',
    name: 'Nuclear Propulsion',
    category: ResearchCategory.NAVY,
    duration: 192,
    prerequisites: ['battleship_technology'],
    effects: ['Unlocks Atomic Submarine', 'Unlimited naval range']
  },

  // Industry Research
  production_efficiency: {
    id: 'production_efficiency',
    name: 'Production Efficiency',
    category: ResearchCategory.INDUSTRY,
    duration: 96,
    prerequisites: [],
    effects: ['Reduces all build times by 10%', 'Resource efficiency +15%']
  },
  advanced_manufacturing: {
    id: 'advanced_manufacturing',
    name: 'Advanced Manufacturing',
    category: ResearchCategory.INDUSTRY,
    duration: 120,
    prerequisites: ['production_efficiency'],
    effects: ['Reduces build times by 20%', 'Factory output +25%']
  },
  industrial_complex: {
    id: 'industrial_complex',
    name: 'Industrial Complex',
    category: ResearchCategory.INDUSTRY,
    duration: 144,
    prerequisites: ['advanced_manufacturing'],
    effects: ['Massive production bonus +40%', 'Parallel unit production']
  },

  // Secret Weapons Research
  rocket_technology: {
    id: 'rocket_technology',
    name: 'Rocket Technology',
    category: ResearchCategory.SECRET_WEAPONS,
    duration: 168,
    prerequisites: ['advanced_manufacturing'],
    effects: ['Unlocks Rocket Artillery', 'Long-range bombardment']
  },
  nuclear_physics: {
    id: 'nuclear_physics',
    name: 'Nuclear Physics',
    category: ResearchCategory.SECRET_WEAPONS,
    duration: 240,
    prerequisites: ['rocket_technology', 'jet_engines'],
    effects: ['Unlocks Nuclear Bomber', 'City destruction capability']
  },
  ballistic_missiles: {
    id: 'ballistic_missiles',
    name: 'Ballistic Missiles',
    category: ResearchCategory.SECRET_WEAPONS,
    duration: 288,
    prerequisites: ['nuclear_physics'],
    effects: ['Unlocks Ballistic Missile', 'Intercontinental strike capability']
  },
  super_heavy_armor: {
    id: 'super_heavy_armor',
    name: 'Super Heavy Armor',
    category: ResearchCategory.SECRET_WEAPONS,
    duration: 216,
    prerequisites: ['heavy_armor', 'advanced_manufacturing'],
    effects: ['Unlocks Super Heavy Tank', 'Fortress breakthrough +75%']
  }
};

export const getResearchByCategory = (category: ResearchCategory): Research[] => {
  return Object.values(GAME_RESEARCH).filter(research => research.category === category);
};

export const getResearchPrerequisites = (researchId: string): Research[] => {
  const research = GAME_RESEARCH[researchId];
  if (!research || !research.prerequisites) return [];
  
  return research.prerequisites.map(prereqId => GAME_RESEARCH[prereqId]).filter(Boolean);
};

export const isResearchAvailable = (researchId: string, completedResearch: string[]): boolean => {
  const research = GAME_RESEARCH[researchId];
  if (!research) return false;
  
  return research.prerequisites?.every(prereq => completedResearch.includes(prereq)) ?? true;
};

export const getResearchDuration = (research: Research): number => {
  // Convert research time from hours to days, with a minimum of 1 day
  const days = Math.max(1, Math.ceil(research.duration / 24));
  return days;
};