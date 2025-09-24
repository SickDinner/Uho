import { Component } from './ecs.ts';
import type { EntityId, SkillKey } from './types.ts';

// Skill tree node definition
export interface SkillNode {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  baseSkill: SkillKey;         // Which base skill this belongs to
  
  // Requirements
  prerequisites: {
    skills?: Partial<Record<SkillKey, number>>;
    nodes?: string[];          // Other skill tree nodes required
    stats?: Record<string, number>;
    reputation?: Record<string, number>;
  };
  
  // Benefits per level
  benefits: {
    stats?: Record<string, number>;    // Stat bonuses per level
    skills?: Partial<Record<SkillKey, number>>; // Skill bonuses per level
    unlocks?: string[];               // Actions/dialogue unlocked
    special?: string[];               // Special abilities
  };
  
  // Learning requirements
  trainingCost: number;         // XP cost per level
  moneyRequired?: number;       // Money cost per level
  trainer?: string;             // Required trainer type
  location?: string;            // Required location
}

// Skill specialization trees
export const SKILL_TREES: Record<string, SkillNode[]> = {
  
  // THEFT specialization tree
  theft: [
    {
      id: 'pickpocketing_basic',
      name: 'Taskuvarkaus',
      description: 'Perusvalmiudet taskujen tyhjentämiseen huomaamatta.',
      maxLevel: 5,
      baseSkill: 'theft',
      prerequisites: { skills: { theft: 10 } },
      benefits: {
        skills: { theft: 2, evasion: 1 },
        unlocks: ['pickpocket_money', 'pickpocket_items']
      },
      trainingCost: 50
    },
    {
      id: 'lockpicking_expert',
      name: 'Lukkojen Avaaminen',
      description: 'Erikoisosaaminen lukkojen avaamisessa ilman avainta.',
      maxLevel: 5,
      baseSkill: 'theft',
      prerequisites: { skills: { theft: 25 }, nodes: ['pickpocketing_basic'] },
      benefits: {
        skills: { lockpicking: 3, theft: 1 },
        unlocks: ['open_complex_locks', 'silent_entry']
      },
      trainingCost: 75,
      trainer: 'experienced_thief'
    },
    {
      id: 'burglary_master',
      name: 'Murto-osaaminen',
      description: 'Ammattitaitoista murtautumista ja varastamista.',
      maxLevel: 3,
      baseSkill: 'theft',
      prerequisites: { 
        skills: { theft: 40, lockpicking: 30 },
        nodes: ['lockpicking_expert']
      },
      benefits: {
        skills: { theft: 3, evasion: 2, lockpicking: 1 },
        unlocks: ['plan_heist', 'disable_security', 'fence_stolen_goods'],
        special: ['reduced_noise_penalty']
      },
      trainingCost: 150,
      moneyRequired: 500,
      trainer: 'master_thief'
    }
  ],
  
  // BRAWLING specialization tree
  brawling: [
    {
      id: 'street_fighting',
      name: 'Katutappelu',
      description: 'Katu-osaamista taistelussa ilman sääntöjä.',
      maxLevel: 5,
      baseSkill: 'brawling',
      prerequisites: { skills: { brawling: 15 } },
      benefits: {
        skills: { brawling: 2 },
        stats: { strength: 1, endurance: 1 },
        unlocks: ['dirty_fighting', 'use_improvised_weapons']
      },
      trainingCost: 60
    },
    {
      id: 'intimidation_presence',
      name: 'Pelottava Läsnäolo',
      description: 'Kyky pelottaa vastustajia pelkällä olemuksella.',
      maxLevel: 4,
      baseSkill: 'brawling',
      prerequisites: { 
        skills: { brawling: 30 },
        stats: { cunning: 25 },
        nodes: ['street_fighting']
      },
      benefits: {
        skills: { brawling: 1 },
        stats: { cunning: 2 },
        unlocks: ['intimidate_before_combat', 'reputation_bonus'],
        special: ['fear_aura']
      },
      trainingCost: 100,
      trainer: 'gang_enforcer'
    },
    {
      id: 'torture_techniques',
      name: 'Kidutusmetodit',
      description: 'Taidot tiedon pakottamiseen väkivalloin.',
      maxLevel: 3,
      baseSkill: 'torture',
      prerequisites: {
        skills: { brawling: 35, torture: 25 },
        reputation: { organized_crime: 30 },
        nodes: ['intimidation_presence']
      },
      benefits: {
        skills: { torture: 4, lying: 1 },
        unlocks: ['extract_information', 'break_resistance', 'interrogate'],
        special: ['increased_fear_generation']
      },
      trainingCost: 200,
      moneyRequired: 1000,
      trainer: 'professional_torturer',
      location: 'underground_facility'
    }
  ],
  
  // LYING/DECEPTION specialization tree
  lying: [
    {
      id: 'smooth_talker',
      name: 'Suulas Puhuja',
      description: 'Kyky puhua itsensä ulos vaikeista tilanteista.',
      maxLevel: 5,
      baseSkill: 'lying',
      prerequisites: { skills: { lying: 20 } },
      benefits: {
        skills: { lying: 2, negotiation: 1 },
        stats: { charisma: 1 },
        unlocks: ['fast_talk', 'excuse_generation']
      },
      trainingCost: 40
    },
    {
      id: 'master_manipulator',
      name: 'Manipuloinnin Mestari',
      description: 'Syvällinen ihmispsykologian ymmärtäminen manipulointiin.',
      maxLevel: 4,
      baseSkill: 'lying',
      prerequisites: {
        skills: { lying: 40, negotiation: 30 },
        stats: { intelligence: 40, cunning: 35 },
        nodes: ['smooth_talker']
      },
      benefits: {
        skills: { lying: 3, negotiation: 2 },
        stats: { cunning: 2, intelligence: 1 },
        unlocks: ['complex_manipulation', 'long_term_influence', 'turn_allies'],
        special: ['manipulation_resistance']
      },
      trainingCost: 150,
      trainer: 'master_manipulator'
    },
    {
      id: 'identity_forger',
      name: 'Identiteetinväärentäjä',
      description: 'Kyky luoda ja ylläpitää vääriä identiteettejä.',
      maxLevel: 3,
      baseSkill: 'lying',
      prerequisites: {
        skills: { lying: 50, technical: 30 },
        nodes: ['master_manipulator']
      },
      benefits: {
        skills: { lying: 2, technical: 2, evasion: 2 },
        unlocks: ['create_fake_id', 'assume_identity', 'document_forgery'],
        special: ['heat_reduction', 'background_fabrication']
      },
      trainingCost: 250,
      moneyRequired: 2000,
      trainer: 'document_forger',
      location: 'underground_print_shop'
    }
  ],
  
  // NEGOTIATION specialization tree  
  negotiation: [
    {
      id: 'deal_maker',
      name: 'Sopimusten Tekijä',
      description: 'Taitava neuvottelija liiketoimissa.',
      maxLevel: 5,
      baseSkill: 'negotiation',
      prerequisites: { skills: { negotiation: 15 } },
      benefits: {
        skills: { negotiation: 2 },
        stats: { charisma: 1, intelligence: 1 },
        unlocks: ['better_prices', 'bulk_discounts']
      },
      trainingCost: 50
    },
    {
      id: 'network_builder',
      name: 'Verkostojen Rakentaja',
      description: 'Kyky luoda ja ylläpitää laajoja kontaktiverkostoja.',
      maxLevel: 4,
      baseSkill: 'negotiation',
      prerequisites: {
        skills: { negotiation: 35, lying: 25 },
        stats: { charisma: 30 },
        nodes: ['deal_maker']
      },
      benefits: {
        skills: { negotiation: 2, lying: 1 },
        stats: { charisma: 2 },
        unlocks: ['contact_network', 'information_trading', 'favor_system'],
        special: ['reputation_multiplier']
      },
      trainingCost: 120,
      trainer: 'connected_businessman'
    },
    {
      id: 'crime_boss',
      name: 'Rikospomo',
      description: 'Johtamiskykyä ja organisaation hallintaa.',
      maxLevel: 3,
      baseSkill: 'negotiation',
      prerequisites: {
        skills: { negotiation: 60, brawling: 40 },
        stats: { cunning: 50, charisma: 45 },
        reputation: { organized_crime: 60 },
        nodes: ['network_builder', 'intimidation_presence']
      },
      benefits: {
        skills: { negotiation: 3, brawling: 1 },
        stats: { cunning: 3, charisma: 2 },
        unlocks: ['recruit_gang_members', 'territory_control', 'protection_rackets', 'gang_warfare'],
        special: ['leadership_bonus', 'organization_management']
      },
      trainingCost: 300,
      moneyRequired: 5000,
      trainer: 'established_crime_boss',
      location: 'criminal_headquarters'
    }
  ],
  
  // CHEMISTRY specialization tree
  chemistry: [
    {
      id: 'basic_synthesis',
      name: 'Perussynteesi',
      description: 'Yksinkertaisten kemikaalien ja aineiden valmistus.',
      maxLevel: 5,
      baseSkill: 'chemistry',
      prerequisites: { skills: { chemistry: 20, technical: 15 } },
      benefits: {
        skills: { chemistry: 2, technical: 1 },
        unlocks: ['synthesize_basic_drugs', 'create_explosives']
      },
      trainingCost: 80
    },
    {
      id: 'advanced_lab_tech',
      name: 'Edistynyt Laboratoriotekniikka',
      description: 'Monimutkaisten laboratorioprosessien hallinta.',
      maxLevel: 4,
      baseSkill: 'chemistry',
      prerequisites: {
        skills: { chemistry: 45, technical: 35 },
        nodes: ['basic_synthesis']
      },
      benefits: {
        skills: { chemistry: 3, technical: 2 },
        unlocks: ['high_purity_synthesis', 'quality_control', 'batch_production'],
        special: ['reduced_production_costs']
      },
      trainingCost: 150,
      moneyRequired: 1000,
      trainer: 'chemistry_professor',
      location: 'professional_lab'
    },
    {
      id: 'master_chemist',
      name: 'Kemian Mestari',
      description: 'Huippuluokan kemiantutkijan taidot.',
      maxLevel: 3,
      baseSkill: 'chemistry',
      prerequisites: {
        skills: { chemistry: 70, technical: 60 },
        stats: { intelligence: 60 },
        nodes: ['advanced_lab_tech']
      },
      benefits: {
        skills: { chemistry: 4, technical: 3 },
        stats: { intelligence: 2 },
        unlocks: ['designer_drugs', 'chemical_weapons', 'pharmaceutical_production'],
        special: ['innovation_bonus', 'formula_creation']
      },
      trainingCost: 400,
      moneyRequired: 10000,
      trainer: 'underground_scientist'
    }
  ],
  
  // ADULT specialization tree
  adult: [
    {
      id: 'seduction_basics',
      name: 'Viettelytaidot',
      description: 'Perusvalmiudet viettelyn taiteessa.',
      maxLevel: 5,
      baseSkill: 'adult',
      prerequisites: { 
        skills: { adult: 15 },
        stats: { charisma: 25 }
      },
      benefits: {
        skills: { adult: 2, lying: 1 },
        stats: { charisma: 1 },
        unlocks: ['seduction_dialogue', 'attraction_bonus']
      },
      trainingCost: 60
    },
    {
      id: 'high_class_services',
      name: 'Korkealuokkaiset Palvelut',
      description: 'Vaativien asiakkaiden palveleminen elegantisti.',
      maxLevel: 4,
      baseSkill: 'adult',
      prerequisites: {
        skills: { adult: 40, lying: 30, negotiation: 25 },
        stats: { charisma: 40, intelligence: 30 },
        nodes: ['seduction_basics']
      },
      benefits: {
        skills: { adult: 3, negotiation: 2, lying: 1 },
        stats: { charisma: 2 },
        unlocks: ['high_end_clients', 'information_gathering', 'elite_networking'],
        special: ['reputation_protection', 'client_loyalty']
      },
      trainingCost: 200,
      moneyRequired: 2000,
      trainer: 'experienced_escort'
    },
    {
      id: 'social_manipulation',
      name: 'Sosiaalinen Manipulaatio',
      description: 'Intiimiuden käyttäminen vaikutusvallan välineenä.',
      maxLevel: 3,
      baseSkill: 'adult',
      prerequisites: {
        skills: { adult: 60, lying: 50 },
        stats: { cunning: 50, charisma: 45 },
        nodes: ['high_class_services', 'master_manipulator']
      },
      benefits: {
        skills: { adult: 2, lying: 3, negotiation: 2 },
        stats: { cunning: 3 },
        unlocks: ['intimate_blackmail', 'influence_through_seduction', 'secret_extraction'],
        special: ['social_immunity', 'elite_access']
      },
      trainingCost: 300,
      trainer: 'master_seductress'
    }
  ]
};

// Component for tracking skill progression
export class SkillProgression extends Component {
  public skillXP: Partial<Record<SkillKey, number>> = {}; // XP per skill
  public nodeProgress: Record<string, number> = {}; // Progress per skill tree node
  public unlockedNodes: string[] = []; // Unlocked skill tree nodes
  public availableXP: number = 0; // Available XP to spend
  
  // Training history
  public trainingSessions: Array<{
    nodeId: string;
    trainer: string;
    cost: number;
    timestamp: number;
  }> = [];
  
  constructor(entityId: EntityId) {
    super(entityId);
    
    // Initialize skill XP
    const skills: SkillKey[] = ['theft', 'lying', 'torture', 'debt', 'brawling', 'lockpicking', 'evasion', 'adult', 'driving', 'chemistry', 'negotiation'];
    skills.forEach(skill => {
      this.skillXP[skill] = 0;
    });
  }
  
  // Add XP to a skill
  addSkillXP(skill: SkillKey, amount: number): void {
    this.skillXP[skill] = (this.skillXP[skill] || 0) + amount;
    this.availableXP += amount;
  }
  
  // Check if node requirements are met
  canLearnNode(nodeId: string): boolean {
    const node = this.findNode(nodeId);
    if (!node) return false;
    
    // Check skill requirements
    if (node.prerequisites.skills) {
      for (const [skill, required] of Object.entries(node.prerequisites.skills)) {
        if ((this.skillXP[skill as SkillKey] || 0) < required) return false;
      }
    }
    
    // Check prerequisite nodes
    if (node.prerequisites.nodes) {
      for (const requiredNode of node.prerequisites.nodes) {
        if (!this.unlockedNodes.includes(requiredNode)) return false;
      }
    }
    
    // Check if already maxed
    const currentLevel = this.nodeProgress[nodeId] || 0;
    if (currentLevel >= node.maxLevel) return false;
    
    return true;
  }
  
  // Learn/upgrade a skill tree node
  learnNode(nodeId: string): boolean {
    if (!this.canLearnNode(nodeId)) return false;
    
    const node = this.findNode(nodeId);
    if (!node) return false;
    
    const currentLevel = this.nodeProgress[nodeId] || 0;
    const cost = node.trainingCost * (currentLevel + 1);
    
    if (this.availableXP < cost) return false;
    
    // Pay the cost
    this.availableXP -= cost;
    this.nodeProgress[nodeId] = currentLevel + 1;
    
    // Add to unlocked if first level
    if (currentLevel === 0) {
      this.unlockedNodes.push(nodeId);
    }
    
    return true;
  }
  
  // Get current level of a node
  getNodeLevel(nodeId: string): number {
    return this.nodeProgress[nodeId] || 0;
  }
  
  // Get all skill bonuses from skill tree
  getSkillBonuses(): Record<SkillKey, number> {
    const bonuses: Record<SkillKey, number> = {} as Record<SkillKey, number>;
    
    for (const nodeId of this.unlockedNodes) {
      const node = this.findNode(nodeId);
      const level = this.getNodeLevel(nodeId);
      
      if (node && node.benefits.skills) {
        for (const [skill, bonus] of Object.entries(node.benefits.skills)) {
          bonuses[skill as SkillKey] = (bonuses[skill as SkillKey] || 0) + (bonus * level);
        }
      }
    }
    
    return bonuses;
  }
  
  // Get all stat bonuses from skill tree
  getStatBonuses(): Record<string, number> {
    const bonuses: Record<string, number> = {};
    
    for (const nodeId of this.unlockedNodes) {
      const node = this.findNode(nodeId);
      const level = this.getNodeLevel(nodeId);
      
      if (node && node.benefits.stats) {
        for (const [stat, bonus] of Object.entries(node.benefits.stats)) {
          bonuses[stat] = (bonuses[stat] || 0) + (bonus * level);
        }
      }
    }
    
    return bonuses;
  }
  
  // Get all unlocked actions
  getUnlockedActions(): string[] {
    const actions: string[] = [];
    
    for (const nodeId of this.unlockedNodes) {
      const node = this.findNode(nodeId);
      
      if (node && node.benefits.unlocks) {
        actions.push(...node.benefits.unlocks);
      }
    }
    
    return [...new Set(actions)]; // Remove duplicates
  }
  
  // Get all special abilities
  getSpecialAbilities(): string[] {
    const abilities: string[] = [];
    
    for (const nodeId of this.unlockedNodes) {
      const node = this.findNode(nodeId);
      
      if (node && node.benefits.special) {
        abilities.push(...node.benefits.special);
      }
    }
    
    return [...new Set(abilities)];
  }
  
  // Find a node by ID across all skill trees
  private findNode(nodeId: string): SkillNode | null {
    for (const tree of Object.values(SKILL_TREES)) {
      const node = tree.find(n => n.id === nodeId);
      if (node) return node;
    }
    return null;
  }
  
  // Get available nodes for learning
  getAvailableNodes(): SkillNode[] {
    const available: SkillNode[] = [];
    
    for (const tree of Object.values(SKILL_TREES)) {
      for (const node of tree) {
        if (this.canLearnNode(node.id) && this.getNodeLevel(node.id) < node.maxLevel) {
          available.push(node);
        }
      }
    }
    
    return available;
  }
}

// XP gain events
export const XP_GAINS: Record<string, Partial<Record<SkillKey, number>>> = {
  'successful_theft': { theft: 10, evasion: 5 },
  'successful_lockpicking': { lockpicking: 15, theft: 5 },
  'successful_negotiation': { negotiation: 8, lying: 3 },
  'won_fight': { brawling: 12 },
  'intimidated_npc': { brawling: 5, lying: 3 },
  'successful_lie': { lying: 6 },
  'complex_manipulation': { lying: 15, negotiation: 8 },
  'synthesized_drug': { chemistry: 20, technical: 10 },
  'seduction_success': { adult: 12, lying: 4 },
  'evaded_police': { evasion: 15, driving: 8 },
  'completed_torture': { torture: 25, brawling: 10 },
  'paid_debt': { debt: 8, negotiation: 3 },
  'successful_driving': { driving: 5 }
};

// Training cost calculator
export function calculateTrainingCost(node: SkillNode, currentLevel: number): { xp: number; money: number } {
  return {
    xp: node.trainingCost * (currentLevel + 1),
    money: (node.moneyRequired || 0) * (currentLevel + 1)
  };
}

// Get skill tree recommendations based on build
export function getRecommendedNodes(skillLevels: Record<SkillKey, number>, playStyle: 'criminal' | 'social' | 'technical' | 'combat'): string[] {
  const recommendations: Record<string, string[]> = {
    criminal: ['pickpocketing_basic', 'lockpicking_expert', 'smooth_talker', 'deal_maker'],
    social: ['smooth_talker', 'seduction_basics', 'deal_maker', 'network_builder'],
    technical: ['basic_synthesis', 'advanced_lab_tech', 'identity_forger'],
    combat: ['street_fighting', 'intimidation_presence', 'torture_techniques']
  };
  
  return recommendations[playStyle] || [];
}

// Get skill tree visualization data
export function getSkillTreeVisualization(treeType: string): any {
  const tree = SKILL_TREES[treeType];
  if (!tree) return null;
  
  return {
    name: treeType,
    nodes: tree.map(node => ({
      id: node.id,
      name: node.name,
      description: node.description,
      maxLevel: node.maxLevel,
      prerequisites: node.prerequisites,
      cost: node.trainingCost
    })),
    connections: tree.reduce((connections: any[], node) => {
      if (node.prerequisites.nodes) {
        for (const prereq of node.prerequisites.nodes) {
          connections.push({ from: prereq, to: node.id });
        }
      }
      return connections;
    }, [])
  };
}