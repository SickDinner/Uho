import { Component } from './ecs.ts';
import type { EntityId } from './types.ts';

// Individual relationship tracking
export interface Relationship {
  entityId: EntityId;
  trust: number;        // 0-100: How much they trust you
  respect: number;      // 0-100: How much they respect your power/skills
  fear: number;         // 0-100: How much they fear you
  attraction: number;   // 0-100: Romantic/sexual attraction
  debt: number;         // Positive = they owe you, negative = you owe them
  
  // Relationship history
  interactions: number; // Total number of interactions
  lastInteraction: number; // Timestamp
  favorsDone: string[]; // Favors you've done for them
  favorsOwed: string[]; // Favors they owe you
  
  // Relationship status
  status: 'stranger' | 'acquaintance' | 'friend' | 'ally' | 'enemy' | 'rival' | 'lover';
  secretsKnown: string[]; // Secrets you know about them
  secretsShared: string[]; // Secrets they know about you
}

// Faction reputation system
export interface FactionReputation {
  factionId: string;
  reputation: number;   // -100 to 100
  rank: number;         // 0-10: Rank within faction (if member)
  isMember: boolean;    // Are you a member?
  joinDate?: number;    // When you joined (timestamp)
  
  // Faction-specific data
  territoriesControlled: string[];
  protectionOffered: boolean;
  monthlyTribute: number; // Money you pay/receive monthly
  
  // Recent actions affecting reputation
  recentActions: Array<{
    action: string;
    reputationChange: number;
    timestamp: number;
  }>;
}

// Social status and influence
export interface SocialStatus {
  overallReputation: number; // -100 to 100: General reputation
  notoriety: number;        // 0-100: How well known you are
  influence: number;        // 0-100: Your social power/connections
  
  // Street cred categories
  streetCred: {
    violence: number;     // Reputation for being dangerous
    business: number;     // Reputation for reliability in deals
    leadership: number;   // Reputation for leadership skills
    connections: number;  // Known for having good contacts
  };
  
  // Social circles you're known in
  knownIn: string[]; // e.g., ['drug_scene', 'high_society', 'police_contacts']
  
  // Bounties and contracts
  bounties: Array<{
    amount: number;
    reason: string;
    issuedBy: string;
    isActive: boolean;
  }>;
}

// Component for tracking relationships and reputation
export class SocialProfile extends Component {
  public relationships: Map<EntityId, Relationship> = new Map();
  public factionReputations: Map<string, FactionReputation> = new Map();
  public socialStatus: SocialStatus;
  
  constructor(entityId: EntityId) {
    super(entityId);
    
    this.socialStatus = {
      overallReputation: 0,
      notoriety: 0,
      influence: 0,
      streetCred: {
        violence: 0,
        business: 0,
        leadership: 0,
        connections: 0
      },
      knownIn: [],
      bounties: []
    };
  }
  
  // Get relationship with specific entity
  getRelationship(targetId: EntityId): Relationship | null {
    return this.relationships.get(targetId) || null;
  }
  
  // Initialize new relationship
  initializeRelationship(targetId: EntityId): Relationship {
    const relationship: Relationship = {
      entityId: targetId,
      trust: 50,
      respect: 50,
      fear: 0,
      attraction: 50,
      debt: 0,
      interactions: 0,
      lastInteraction: Date.now(),
      favorsDone: [],
      favorsOwed: [],
      status: 'stranger',
      secretsKnown: [],
      secretsShared: []
    };
    
    this.relationships.set(targetId, relationship);
    return relationship;
  }
  
  // Modify relationship values
  modifyRelationship(targetId: EntityId, changes: Partial<Omit<Relationship, 'entityId'>>): void {
    let relationship = this.getRelationship(targetId);
    if (!relationship) {
      relationship = this.initializeRelationship(targetId);
    }
    
    // Apply changes with bounds checking
    if (changes.trust !== undefined) {
      relationship.trust = Math.max(0, Math.min(100, relationship.trust + changes.trust));
    }
    if (changes.respect !== undefined) {
      relationship.respect = Math.max(0, Math.min(100, relationship.respect + changes.respect));
    }
    if (changes.fear !== undefined) {
      relationship.fear = Math.max(0, Math.min(100, relationship.fear + changes.fear));
    }
    if (changes.attraction !== undefined) {
      relationship.attraction = Math.max(0, Math.min(100, relationship.attraction + changes.attraction));
    }
    if (changes.debt !== undefined) {
      relationship.debt += changes.debt;
    }
    
    // Update interaction count and timestamp
    relationship.interactions++;
    relationship.lastInteraction = Date.now();
    
    // Update relationship status based on values
    this.updateRelationshipStatus(relationship);
  }
  
  // Update relationship status based on current values
  private updateRelationshipStatus(relationship: Relationship): void {
    const trust = relationship.trust;
    const respect = relationship.respect;
    const fear = relationship.fear;
    
    if (fear > 70 && trust < 30) {
      relationship.status = 'enemy';
    } else if (trust > 80 && respect > 60) {
      if (relationship.attraction > 70) {
        relationship.status = 'lover';
      } else {
        relationship.status = 'ally';
      }
    } else if (trust > 60) {
      relationship.status = 'friend';
    } else if (trust < 20 && respect > 40) {
      relationship.status = 'rival';
    } else if (relationship.interactions > 5) {
      relationship.status = 'acquaintance';
    }
  }
  
  // Get faction reputation
  getFactionReputation(factionId: string): FactionReputation | null {
    return this.factionReputations.get(factionId) || null;
  }
  
  // Initialize faction reputation
  initializeFactionReputation(factionId: string): FactionReputation {
    const reputation: FactionReputation = {
      factionId,
      reputation: 0,
      rank: 0,
      isMember: false,
      territoriesControlled: [],
      protectionOffered: false,
      monthlyTribute: 0,
      recentActions: []
    };
    
    this.factionReputations.set(factionId, reputation);
    return reputation;
  }
  
  // Modify faction reputation
  modifyFactionReputation(factionId: string, change: number, reason: string): void {
    let faction = this.getFactionReputation(factionId);
    if (!faction) {
      faction = this.initializeFactionReputation(factionId);
    }
    
    faction.reputation = Math.max(-100, Math.min(100, faction.reputation + change));
    
    // Record the action
    faction.recentActions.push({
      action: reason,
      reputationChange: change,
      timestamp: Date.now()
    });
    
    // Keep only recent actions (last 10)
    if (faction.recentActions.length > 10) {
      faction.recentActions = faction.recentActions.slice(-10);
    }
    
    // Update overall reputation
    this.updateOverallReputation();
  }
  
  // Calculate overall reputation from all faction reputations
  private updateOverallReputation(): void {
    let totalRep = 0;
    let factionCount = 0;
    
    for (const faction of this.factionReputations.values()) {
      totalRep += faction.reputation;
      factionCount++;
    }
    
    if (factionCount > 0) {
      this.socialStatus.overallReputation = totalRep / factionCount;
    }
  }
  
  // Add favor/debt
  addFavor(targetId: EntityId, favor: string, isOwed: boolean): void {
    let relationship = this.getRelationship(targetId);
    if (!relationship) {
      relationship = this.initializeRelationship(targetId);
    }
    
    if (isOwed) {
      relationship.favorsOwed.push(favor);
    } else {
      relationship.favorsDone.push(favor);
      // Doing favors builds trust
      this.modifyRelationship(targetId, { trust: 5, respect: 2 });
    }
  }
  
  // Learn a secret about someone
  learnSecret(targetId: EntityId, secret: string): void {
    let relationship = this.getRelationship(targetId);
    if (!relationship) {
      relationship = this.initializeRelationship(targetId);
    }
    
    if (!relationship.secretsKnown.includes(secret)) {
      relationship.secretsKnown.push(secret);
      // Learning secrets can be used for leverage but reduces trust if discovered
      this.socialStatus.influence += 1;
    }
  }
  
  // Share a secret with someone
  shareSecret(targetId: EntityId, secret: string): void {
    let relationship = this.getRelationship(targetId);
    if (!relationship) {
      relationship = this.initializeRelationship(targetId);
    }
    
    if (!relationship.secretsShared.includes(secret)) {
      relationship.secretsShared.push(secret);
      // Sharing secrets builds trust but makes you vulnerable
      this.modifyRelationship(targetId, { trust: 10 });
    }
  }
  
  // Add bounty
  addBounty(amount: number, reason: string, issuedBy: string): void {
    this.socialStatus.bounties.push({
      amount,
      reason,
      issuedBy,
      isActive: true
    });
    
    // Bounties increase notoriety
    this.socialStatus.notoriety += Math.min(10, amount / 100);
  }
  
  // Get relationship description for UI
  getRelationshipDescription(targetId: EntityId): string {
    const rel = this.getRelationship(targetId);
    if (!rel) return 'Tuntematon';
    
    const status = rel.status;
    const trust = rel.trust;
    const fear = rel.fear;
    
    let description = '';
    
    switch (status) {
      case 'stranger': description = 'Tuntematon'; break;
      case 'acquaintance': description = 'Tuttu'; break;
      case 'friend': description = 'Ystävä'; break;
      case 'ally': description = 'Liittolainen'; break;
      case 'enemy': description = 'Vihollinen'; break;
      case 'rival': description = 'Kilpailija'; break;
      case 'lover': description = 'Rakastaja'; break;
    }
    
    // Add modifiers
    const modifiers = [];
    if (trust > 80) modifiers.push('luottavainen');
    else if (trust < 20) modifiers.push('epäluuloinen');
    
    if (fear > 60) modifiers.push('peloissaan');
    if (rel.debt > 100) modifiers.push('velkaa sinulle');
    else if (rel.debt < -100) modifiers.push('sinä olet velkaa');
    
    if (modifiers.length > 0) {
      description += ` (${modifiers.join(', ')})`;
    }
    
    return description;
  }
  
  // Get faction status description
  getFactionDescription(factionId: string): string {
    const faction = this.getFactionReputation(factionId);
    if (!faction) return 'Ei tunneta';
    
    const rep = faction.reputation;
    let status = '';
    
    if (rep >= 80) status = 'Sankari';
    else if (rep >= 60) status = 'Arvostettu';
    else if (rep >= 40) status = 'Hyväksytty';
    else if (rep >= 20) status = 'Tuttu';
    else if (rep >= -20) status = 'Neutraali';
    else if (rep >= -40) status = 'Epäilty';
    else if (rep >= -60) status = 'Ei-toivottu';
    else if (rep >= -80) status = 'Vihollinen';
    else status = 'Kuolemantuomio';
    
    if (faction.isMember) {
      status += ` (Jäsen, taso ${faction.rank})`;
    }
    
    return status;
  }
}

// Faction definitions
export interface FactionDef {
  id: string;
  name: string;
  description: string;
  type: 'gang' | 'organization' | 'government' | 'business' | 'underground';
  territories: string[];
  enemies: string[];
  allies: string[];
  activities: string[];
  memberBenefits: string[];
  joinRequirements: {
    reputation: number;
    skills?: Record<string, number>;
    completion?: string[]; // Quests or actions required
  };
}

export const FACTIONS: Record<string, FactionDef> = {
  police: {
    id: 'police',
    name: 'Poliisi',
    description: 'Lainvalvontaviranomainen joka pyrkii pitämään järjestystä yllä.',
    type: 'government',
    territories: ['police_station', 'government_district'],
    enemies: ['organized_crime', 'street_gangs'],
    allies: ['government'],
    activities: ['law_enforcement', 'investigation', 'patrol'],
    memberBenefits: ['legal_immunity', 'weapon_access', 'information_network'],
    joinRequirements: {
      reputation: 40,
      skills: { lying: 30 }, // You need to be able to lie to be corrupt
      completion: ['corrupt_official_contact']
    }
  },
  
  organized_crime: {
    id: 'organized_crime',
    name: 'Järjestäytynyt Rikollisuus',
    description: 'Hierarkkinen rikollisorganisaatio joka hallitsee suurinta osaa laittomasta toiminnasta.',
    type: 'gang',
    territories: ['downtown', 'docks', 'warehouse_district'],
    enemies: ['police', 'rival_gangs'],
    allies: ['corrupt_officials'],
    activities: ['protection_racket', 'drug_trade', 'money_laundering'],
    memberBenefits: ['protection', 'steady_income', 'criminal_network'],
    joinRequirements: {
      reputation: 30,
      skills: { brawling: 25, lying: 30 },
      completion: ['prove_loyalty', 'complete_initiation']
    }
  },
  
  street_gangs: {
    id: 'street_gangs',
    name: 'Katujengit',
    description: 'Löysästi järjestäytyneet paikallisjengit jotka hallitsevat pieniä alueita.',
    type: 'gang',
    territories: ['suburbs', 'industrial_area'],
    enemies: ['organized_crime', 'police'],
    allies: ['street_dealers'],
    activities: ['small_crimes', 'territory_wars', 'drug_dealing'],
    memberBenefits: ['backup', 'territory_access', 'cheap_drugs'],
    joinRequirements: {
      reputation: 10,
      skills: { brawling: 20 },
      completion: ['street_fight_victory']
    }
  },
  
  high_society: {
    id: 'high_society',
    name: 'Korkea Seurapiiri',
    description: 'Varakkaat ja vaikutusvaltaiset henkilöt jotka hallitsevat laillista ekonomiaa.',
    type: 'business',
    territories: ['uptown', 'business_district'],
    enemies: [],
    allies: ['government', 'corrupt_officials'],
    activities: ['business_deals', 'political_influence', 'money_laundering'],
    memberBenefits: ['clean_money', 'political_connections', 'legal_protection'],
    joinRequirements: {
      reputation: 60,
      skills: { negotiation: 50, lying: 40 },
      completion: ['accumulate_wealth', 'social_connections']
    }
  },
  
  drug_networks: {
    id: 'drug_networks',
    name: 'Huumeverkostot',
    description: 'Epävirallinen verkosto kauppiaita, valmistajia ja kuljettajia.',
    type: 'underground',
    territories: ['industrial_area', 'abandoned_buildings'],
    enemies: ['police'],
    allies: ['street_gangs', 'chemists'],
    activities: ['drug_manufacturing', 'smuggling', 'distribution'],
    memberBenefits: ['cheap_drugs', 'supply_access', 'chemistry_knowledge'],
    joinRequirements: {
      reputation: 20,
      skills: { chemistry: 30 },
      completion: ['successful_drug_deal']
    }
  },
  
  mercenaries: {
    id: 'mercenaries',
    name: 'Palkkasoturit',
    description: 'Riippumattomat ammattilaiset jotka tarjoavat väkivaltapalveluita.',
    type: 'underground',
    territories: [],
    enemies: ['police'],
    allies: ['organized_crime'],
    activities: ['contract_killing', 'intimidation', 'bodyguard_services'],
    memberBenefits: ['high_pay_jobs', 'weapon_access', 'protection_contracts'],
    joinRequirements: {
      reputation: 25,
      skills: { brawling: 40, torture: 20 },
      completion: ['complete_contract', 'prove_reliability']
    }
  }
};

// Calculate reputation impact based on action
export function calculateReputationImpact(action: string, targetFaction: string, currentReputation: number = 0): number {
  const faction = FACTIONS[targetFaction];
  if (!faction) return 0;
  
  let impact = 0;
  
  // Base action impacts
  const actionImpacts: Record<string, number> = {
    'help_member': 5,
    'complete_mission': 10,
    'betray_member': -20,
    'attack_member': -15,
    'police_interaction': -10, // For criminal factions
    'arrest_made': 15,        // For police
    'successful_deal': 5,
    'failed_deal': -5,
    'territory_defense': 8,
    'territory_loss': -12
  };
  
  impact = actionImpacts[action] || 0;
  
  // Faction-specific modifiers
  if (targetFaction === 'police') {
    if (action.includes('crime') || action.includes('drug')) {
      impact = Math.abs(impact) * -1; // Reverse for police
    }
  }
  
  // Diminishing returns for very high reputation
  if (currentReputation > 70 && impact > 0) {
    impact *= 0.5;
  }
  
  return Math.round(impact);
}

// Get all relationships of a certain status
export function getRelationshipsByStatus(profile: SocialProfile, status: Relationship['status']): Relationship[] {
  return Array.from(profile.relationships.values()).filter(rel => rel.status === status);
}

// Get most trusted/feared/respected NPCs
export function getTopRelationships(profile: SocialProfile, type: 'trust' | 'fear' | 'respect', count: number = 5): Relationship[] {
  return Array.from(profile.relationships.values())
    .sort((a, b) => b[type] - a[type])
    .slice(0, count);
}