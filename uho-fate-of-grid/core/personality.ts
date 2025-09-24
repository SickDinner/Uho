import type { EntityId, StatKey } from './types.ts';

// Personality trait system
export interface PersonalityTraits {
  // Big Five personality model adapted for criminal context
  openness: number;      // 0-100: Willingness to try new crimes/methods
  conscientiousness: number; // 0-100: Organization, planning ability
  extraversion: number;  // 0-100: Social, talkative vs introverted
  agreeableness: number; // 0-100: Cooperative vs hostile/suspicious
  neuroticism: number;   // 0-100: Anxious, unstable vs calm
  
  // Criminal-specific traits
  greed: number;         // 0-100: Motivation by money
  violence: number;      // 0-100: Willingness to use violence
  loyalty: number;       // 0-100: Loyalty to faction/friends
  paranoia: number;      // 0-100: Distrust of others
  impulsiveness: number; // 0-100: Acting without thinking
  willpower: number;     // 0-100: Mental strength, resistance to influence
  intelligence: number;  // 0-100: Reasoning ability, pattern recognition
}

// Background archetypes for Finnish criminal underground
export interface NPCBackground {
  id: string;
  name: string;           // Finnish name for the background
  description: string;    // Background story
  startingSkills: Partial<Record<string, number>>;
  personalityTendencies: Partial<PersonalityTraits>;
  startingReputation: Record<string, number>; // Faction reputations
  startingInventory: Array<{ itemId: string; quantity: number }>;
  startingCash: { min: number; max: number };
  criminalSpecialty: string[];
  socialStatus: 'low' | 'mid' | 'high';
  riskTolerance: number; // 0-100
}

// Criminal background definitions
export const CRIMINAL_BACKGROUNDS: Record<string, NPCBackground> = {
  street_dealer: {
    id: 'street_dealer',
    name: 'Katukauppias',
    description: 'Pienkauppias joka myy huumeita kadunkulmauksissa. Elää päivä kerrallaan ja välttää poliisia.',
    startingSkills: { 
      lying: 25, 
      evasion: 30, 
      chemistry: 15, 
      negotiation: 20 
    },
    personalityTendencies: { 
      paranoia: 60, 
      greed: 70, 
      violence: 30, 
      impulsiveness: 50,
      neuroticism: 65
    },
    startingReputation: { 
      'police': -20, 
      'street_gangs': 10, 
      'civilians': -10 
    },
    startingInventory: [
      { itemId: 'kannabis', quantity: 5 },
      { itemId: 'nikotiini', quantity: 10 }
    ],
    startingCash: { min: 50, max: 200 },
    criminalSpecialty: ['drug_dealing', 'small_theft'],
    socialStatus: 'low',
    riskTolerance: 40
  },

  gang_enforcer: {
    id: 'gang_enforcer',
    name: 'Jengin Pakottaja',
    description: 'Lihasten mies joka huolehtii velkojen perinnästä ja järjestyksen ylläpitämisestä.',
    startingSkills: { 
      brawling: 40, 
      torture: 30, 
      debt: 35, 
      lying: 20 
    },
    personalityTendencies: { 
      violence: 80, 
      loyalty: 70, 
      conscientiousness: 60, 
      agreeableness: 20,
      extraversion: 45
    },
    startingReputation: { 
      'police': -30, 
      'organized_crime': 30, 
      'civilians': -25 
    },
    startingInventory: [
      { itemId: 'brass_knuckles', quantity: 1 },
      { itemId: 'alkoholi', quantity: 2 }
    ],
    startingCash: { min: 200, max: 800 },
    criminalSpecialty: ['debt_collection', 'protection_racket', 'intimidation'],
    socialStatus: 'mid',
    riskTolerance: 60
  },

  high_class_escort: {
    id: 'high_class_escort',
    name: 'Korkealuokkainen Saattonainen',
    description: 'Koulutettu ja viehättävä henkilö joka tarjoaa seuraa varakkaalle asiakaskunnalle.',
    startingSkills: { 
      adult: 50, 
      lying: 35, 
      negotiation: 45, 
      evasion: 25 
    },
    personalityTendencies: { 
      extraversion: 75, 
      openness: 60, 
      agreeableness: 45, 
      greed: 55,
      conscientiousness: 70
    },
    startingReputation: { 
      'police': -5, 
      'high_society': 15, 
      'organized_crime': 5 
    },
    startingInventory: [
      { itemId: 'luxury_items', quantity: 3 },
      { itemId: 'birth_control', quantity: 10 }
    ],
    startingCash: { min: 500, max: 2000 },
    criminalSpecialty: ['escort_services', 'information_gathering', 'social_manipulation'],
    socialStatus: 'high',
    riskTolerance: 30
  },

  street_thief: {
    id: 'street_thief',
    name: 'Katuvarkaat',
    description: 'Ketterä rikollinen joka elää taskuvarkauksista ja pienistä murroista.',
    startingSkills: { 
      theft: 45, 
      lockpicking: 35, 
      evasion: 50, 
      lying: 30 
    },
    personalityTendencies: { 
      impulsiveness: 70, 
      paranoia: 55, 
      greed: 80, 
      violence: 25,
      agreeableness: 30
    },
    startingReputation: { 
      'police': -15, 
      'street_gangs': 5, 
      'fences': 20 
    },
    startingInventory: [
      { itemId: 'lockpicks', quantity: 1 },
      { itemId: 'stolen_goods', quantity: 3 }
    ],
    startingCash: { min: 20, max: 150 },
    criminalSpecialty: ['pickpocketing', 'burglary', 'fencing'],
    socialStatus: 'low',
    riskTolerance: 50
  },

  drug_chemist: {
    id: 'drug_chemist',
    name: 'Huumekemisti',
    description: 'Entinen opiskelija tai tutkija joka valmistaa synteettisiä huumeita kotikeittossa.',
    startingSkills: { 
      chemistry: 65, 
      lying: 25, 
      negotiation: 30, 
      technical: 45 
    },
    personalityTendencies: { 
      openness: 80, 
      conscientiousness: 75, 
      neuroticism: 50, 
      paranoia: 70,
      extraversion: 25
    },
    startingReputation: { 
      'police': -25, 
      'drug_networks': 35, 
      'academics': -30 
    },
    startingInventory: [
      { itemId: 'lab_equipment', quantity: 1 },
      { itemId: 'amfetamiini', quantity: 3 },
      { itemId: 'chemicals', quantity: 5 }
    ],
    startingCash: { min: 300, max: 1200 },
    criminalSpecialty: ['drug_manufacturing', 'chemical_supply', 'lab_management'],
    socialStatus: 'mid',
    riskTolerance: 35
  },

  gang_leader: {
    id: 'gang_leader',
    name: 'Jengijohtaja',
    description: 'Kokenut rikollinen joka johtaa omaa jengiä ja hallitsee aluetta.',
    startingSkills: { 
      negotiation: 55, 
      lying: 45, 
      debt: 40, 
      brawling: 35,
      torture: 25
    },
    personalityTendencies: { 
      extraversion: 70, 
      conscientiousness: 80, 
      loyalty: 60, 
      violence: 60,
      greed: 75
    },
    startingReputation: { 
      'police': -40, 
      'organized_crime': 50, 
      'street_gangs': 70,
      'civilians': -20
    },
    startingInventory: [
      { itemId: 'luxury_items', quantity: 2 },
      { itemId: 'protection_money', quantity: 5 }
    ],
    startingCash: { min: 1000, max: 5000 },
    criminalSpecialty: ['gang_management', 'territory_control', 'organized_crime'],
    socialStatus: 'high',
    riskTolerance: 45
  },

  corrupt_official: {
    id: 'corrupt_official',
    name: 'Korruptoitunut Virkamies',
    description: 'Virkamies joka käyttää asemaansa hyväksi lahjusten ja palvelusten kautta.',
    startingSkills: { 
      lying: 60, 
      negotiation: 65, 
      evasion: 40, 
      technical: 35 
    },
    personalityTendencies: { 
      greed: 80, 
      conscientiousness: 70, 
      paranoia: 60, 
      agreeableness: 50,
      extraversion: 55
    },
    startingReputation: { 
      'police': 10, 
      'government': 20, 
      'organized_crime': 25,
      'civilians': 5
    },
    startingInventory: [
      { itemId: 'official_documents', quantity: 3 },
      { itemId: 'bribe_money', quantity: 2 }
    ],
    startingCash: { min: 800, max: 3000 },
    criminalSpecialty: ['bribery', 'document_forgery', 'insider_trading'],
    socialStatus: 'high',
    riskTolerance: 25
  },

  freelance_muscle: {
    id: 'freelance_muscle',
    name: 'Freelance Lihakset',
    description: 'Riippumaton tappaja/pakottaja joka myy väkivaltapalveluita korkeimmalle tarjoajalle.',
    startingSkills: { 
      brawling: 50, 
      torture: 40, 
      evasion: 35, 
      negotiation: 25 
    },
    personalityTendencies: { 
      violence: 85, 
      greed: 70, 
      loyalty: 30, 
      paranoia: 65,
      conscientiousness: 45
    },
    startingReputation: { 
      'police': -35, 
      'organized_crime': 15, 
      'mercenaries': 40 
    },
    startingInventory: [
      { itemId: 'weapons', quantity: 2 },
      { itemId: 'body_armor', quantity: 1 }
    ],
    startingCash: { min: 300, max: 1000 },
    criminalSpecialty: ['contract_violence', 'intimidation', 'bodyguard'],
    socialStatus: 'mid',
    riskTolerance: 70
  }
};

// Mood system for dynamic NPC behavior
export interface NPCMood {
  current: string;
  intensity: number; // 0-100
  duration: number;  // seconds remaining
  modifiers: {
    stats: Partial<Record<StatKey, number>>;
    social: {
      aggression: number;
      cooperation: number;
      chattiness: number;
    };
  };
}

export const MOOD_TYPES: Record<string, Omit<NPCMood, 'intensity' | 'duration'>> = {
  angry: {
    current: 'vihainen',
    modifiers: {
      stats: { willpower: -10, charisma: -15 },
      social: { aggression: 30, cooperation: -40, chattiness: -20 }
    }
  },
  paranoid: {
    current: 'vainoharhakinen',
    modifiers: {
      stats: { perception: 15, stress: 20 },
      social: { aggression: 10, cooperation: -30, chattiness: -30 }
    }
  },
  greedy: {
    current: 'ahne',
    modifiers: {
      stats: { cunning: 10, charisma: -5 },
      social: { aggression: 5, cooperation: -15, chattiness: 10 }
    }
  },
  confident: {
    current: 'itsevarma',
    modifiers: {
      stats: { charisma: 15, willpower: 10 },
      social: { aggression: 5, cooperation: 10, chattiness: 20 }
    }
  },
  desperate: {
    current: 'epätoivoinen',
    modifiers: {
      stats: { stress: 25, willpower: -10 },
      social: { aggression: 15, cooperation: 20, chattiness: 15 }
    }
  },
  drunk: {
    current: 'humalassa',
    modifiers: {
      stats: { agility: -20, intelligence: -15, charisma: 5 },
      social: { aggression: 20, cooperation: 5, chattiness: 30 }
    }
  },
  high: {
    current: 'päihtyneenä',
    modifiers: {
      stats: { perception: -10, stress: -15 },
      social: { aggression: -10, cooperation: 15, chattiness: 25 }
    }
  }
};

// Generate personality based on background
export function generatePersonality(backgroundId?: string): PersonalityTraits {
  const base: PersonalityTraits = {
    openness: 40 + Math.random() * 20,
    conscientiousness: 40 + Math.random() * 20,
    extraversion: 40 + Math.random() * 20,
    agreeableness: 40 + Math.random() * 20,
    neuroticism: 40 + Math.random() * 20,
    greed: 40 + Math.random() * 20,
    violence: 30 + Math.random() * 15,
    loyalty: 40 + Math.random() * 20,
    paranoia: 30 + Math.random() * 20,
    impulsiveness: 40 + Math.random() * 20,
    willpower: 40 + Math.random() * 20,
    intelligence: 40 + Math.random() * 20
  };

  if (backgroundId && CRIMINAL_BACKGROUNDS[backgroundId]) {
    const background = CRIMINAL_BACKGROUNDS[backgroundId];
    
    // Apply background tendencies with variation
    for (const [trait, tendency] of Object.entries(background.personalityTendencies)) {
      if (tendency !== undefined) {
        const variation = Math.random() * 20 - 10; // ±10 variation
        base[trait as keyof PersonalityTraits] = Math.max(0, Math.min(100, tendency + variation));
      }
    }
  }

  return base;
}

// Calculate personality compatibility between two NPCs
export function calculateCompatibility(personality1: PersonalityTraits, personality2: PersonalityTraits): number {
  // Simple compatibility based on trait differences and complements
  const factors = [];
  
  // Similar extraversion levels work well together
  const extraversionDiff = Math.abs(personality1.extraversion - personality2.extraversion);
  factors.push(100 - extraversionDiff);
  
  // High agreeableness generally improves compatibility
  factors.push((personality1.agreeableness + personality2.agreeableness) / 2);
  
  // Low combined neuroticism is better
  factors.push(100 - (personality1.neuroticism + personality2.neuroticism) / 2);
  
  // Paranoid people don't trust each other easily
  const combinedParanoia = (personality1.paranoia + personality2.paranoia) / 2;
  factors.push(Math.max(0, 100 - combinedParanoia * 1.5));
  
  // High loyalty on both sides helps
  factors.push((personality1.loyalty + personality2.loyalty) / 2);
  
  return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
}

// Generate random mood based on personality and circumstances
export function generateMood(personality: PersonalityTraits, stress: number = 0, recent_events: string[] = []): NPCMood {
  const moodOptions = Object.keys(MOOD_TYPES);
  let weights: Record<string, number> = {};
  
  // Base weights
  moodOptions.forEach(mood => weights[mood] = 10);
  
  // Personality influences
  if (personality.neuroticism > 60) {
    weights.paranoid += 20;
    weights.angry += 10;
  }
  
  if (personality.greed > 70) {
    weights.greedy += 25;
    weights.desperate += 10;
  }
  
  if (personality.violence > 60) {
    weights.angry += 15;
  }
  
  if (personality.paranoia > 70) {
    weights.paranoid += 30;
  }
  
  // Stress influences
  if (stress > 60) {
    weights.angry += 15;
    weights.desperate += 20;
    weights.paranoid += 10;
  }
  
  // Recent events influence
  for (const event of recent_events) {
    if (event.includes('police') || event.includes('heat')) {
      weights.paranoid += 15;
      weights.angry += 10;
    }
    if (event.includes('money') || event.includes('debt')) {
      weights.greedy += 15;
      weights.desperate += 10;
    }
    if (event.includes('drug') || event.includes('alcohol')) {
      weights.drunk += 20;
      weights.high += 15;
    }
  }
  
  // Select mood based on weights
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (const [mood, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      const moodTemplate = MOOD_TYPES[mood];
      return {
        ...moodTemplate,
        intensity: 30 + Math.random() * 40,
        duration: 60 + Math.random() * 300 // 1-6 minutes
      };
    }
  }
  
  // Fallback to confident mood
  return {
    ...MOOD_TYPES.confident,
    intensity: 50,
    duration: 180
  };
}

export function getPersonalityDescription(personality: PersonalityTraits): string {
  const descriptions: string[] = [];
  
  if (personality.extraversion > 70) descriptions.push("puhelias");
  else if (personality.extraversion < 30) descriptions.push("hiljainen");
  
  if (personality.agreeableness > 70) descriptions.push("ystävällinen");
  else if (personality.agreeableness < 30) descriptions.push("vihamielinen");
  
  if (personality.conscientiousness > 70) descriptions.push("järjestelmällinen");
  else if (personality.conscientiousness < 30) descriptions.push("kaoottinen");
  
  if (personality.neuroticism > 70) descriptions.push("hermostunut");
  else if (personality.neuroticism < 30) descriptions.push("rauhallinen");
  
  if (personality.greed > 80) descriptions.push("erittäin ahne");
  else if (personality.greed > 60) descriptions.push("rahanhimoinen");
  
  if (personality.violence > 80) descriptions.push("väkivaltainen");
  else if (personality.violence > 60) descriptions.push("aggressiivinen");
  
  if (personality.paranoia > 80) descriptions.push("erittäin epäluuloinen");
  else if (personality.paranoia > 60) descriptions.push("varovainen");
  
  if (personality.loyalty > 80) descriptions.push("erittäin uskollinen");
  else if (personality.loyalty < 30) descriptions.push("petturi");
  
  return descriptions.length > 0 ? descriptions.join(", ") : "tavallisen oloinen";
}