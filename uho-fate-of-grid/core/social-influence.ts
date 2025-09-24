import type { EntityId, StatKey, SkillKey } from './types.ts';
import type { PersonalityTraits } from './personality.ts';
import type { Relationship, SocialProfile } from './reputation.ts';

// Social influence action types
export type InfluenceType = 'intimidate' | 'persuade' | 'seduce' | 'manipulate' | 'bribe' | 'threaten';

// Influence attempt configuration
export interface InfluenceAttempt {
  type: InfluenceType;
  target: EntityId;
  initiator: EntityId;
  
  // Context
  location: string;
  witnesses: EntityId[];
  
  // Approach
  approach: 'subtle' | 'direct' | 'aggressive';
  argument?: string;           // What you're trying to convince them of
  offer?: {                   // Bribe or incentive
    money?: number;
    items?: Array<{ id: string; quantity: number }>;
    services?: string[];
    information?: string[];
  };
  threat?: {                  // What you're threatening with
    violence?: boolean;
    exposure?: string;         // Secret you'll reveal
    consequences?: string;     // Other bad outcomes
  };
}

// Result of influence attempt
export interface InfluenceResult {
  success: boolean;
  degree: number;              // -100 to 100, how successful
  consequences: InfluenceConsequence[];
  relationshipChanges: {
    trust?: number;
    respect?: number;
    fear?: number;
    attraction?: number;
  };
  reputationChanges: Record<string, number>;
  
  // Special outcomes
  information?: string[];      // Information gained
  favors?: string[];          // Favors owed to you
  services?: string[];        // Services provided
  items?: Array<{ id: string; quantity: number }>; // Items given
}

// Consequences of influence attempts
export interface InfluenceConsequence {
  type: 'relationship' | 'reputation' | 'heat' | 'witness' | 'retaliation' | 'opportunity';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  entities: EntityId[];       // Who is affected
  delayed?: number;           // Delay in seconds before consequence occurs
}

// Social influence calculator
export class SocialInfluence {
  
  // Main influence attempt method
  static attemptInfluence(
    attempt: InfluenceAttempt,
    initiatorStats: Record<StatKey, number>,
    initiatorSkills: Record<SkillKey, number>,
    initiatorSocial: SocialProfile,
    targetPersonality: PersonalityTraits,
    targetStats: Record<StatKey, number>,
    relationship: Relationship | null,
    context: { 
      heatLevel: number; 
      location: string; 
      timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
      publicPlace: boolean;
    }
  ): InfluenceResult {
    
    let baseChance = 0.3; // 30% base success chance
    let modifiers: number[] = [];
    let consequences: InfluenceConsequence[] = [];
    
    // Calculate base chance based on influence type
    switch (attempt.type) {
      case 'intimidate':
        baseChance = this.calculateIntimidationChance(attempt, initiatorStats, initiatorSkills, targetPersonality, relationship);
        break;
      case 'persuade':
        baseChance = this.calculatePersuasionChance(attempt, initiatorStats, initiatorSkills, targetPersonality, relationship);
        break;
      case 'seduce':
        baseChance = this.calculateSeductionChance(attempt, initiatorStats, initiatorSkills, targetPersonality, relationship);
        break;
      case 'manipulate':
        baseChance = this.calculateManipulationChance(attempt, initiatorStats, initiatorSkills, targetPersonality, relationship);
        break;
      case 'bribe':
        baseChance = this.calculateBriberyChance(attempt, initiatorStats, initiatorSkills, targetPersonality, relationship);
        break;
      case 'threaten':
        baseChance = this.calculateThreatChance(attempt, initiatorStats, initiatorSkills, targetPersonality, relationship);
        break;
    }
    
    // Apply contextual modifiers
    modifiers.push(...this.getContextualModifiers(context, attempt.type, targetPersonality));
    
    // Apply relationship modifiers
    if (relationship) {
      modifiers.push(...this.getRelationshipModifiers(relationship, attempt.type));
    }
    
    // Calculate final success chance
    const totalModifier = modifiers.reduce((sum, mod) => sum + mod, 0);
    const finalChance = Math.max(0.05, Math.min(0.95, baseChance + totalModifier));
    
    // Determine success
    const roll = Math.random();
    const success = roll < finalChance;
    const degree = success ? (1 - roll / finalChance) * 100 : -(roll - finalChance) / (1 - finalChance) * 100;
    
    // Calculate consequences
    consequences.push(...this.calculateConsequences(attempt, success, degree, context, targetPersonality));
    
    // Calculate relationship changes
    const relationshipChanges = this.calculateRelationshipChanges(attempt, success, degree, targetPersonality);
    
    // Calculate reputation changes
    const reputationChanges = this.calculateReputationChanges(attempt, success, degree, context);
    
    // Determine special outcomes
    const specialOutcomes = this.determineSpecialOutcomes(attempt, success, degree, targetPersonality);
    
    return {
      success,
      degree,
      consequences,
      relationshipChanges,
      reputationChanges,
      ...specialOutcomes
    };
  }
  
  // Intimidation calculation
  private static calculateIntimidationChance(
    attempt: InfluenceAttempt,
    stats: Record<StatKey, number>,
    skills: Record<SkillKey, number>,
    targetPersonality: PersonalityTraits,
    relationship: Relationship | null
  ): number {
    let chance = 0.2;
    
    // Initiator factors
    chance += (stats.cunning || 0) / 200;       // Max +0.5
    chance += (stats.strength || 0) / 250;     // Max +0.4
    chance += (skills.brawling || 0) / 200;    // Max +0.5
    chance += (skills.torture || 0) / 300;     // Max +0.33
    
    // Target resistance
    chance -= (targetPersonality.willpower || 50) / 200; // Max -0.5
    chance -= (targetPersonality.violence || 30) / 300;  // Violence breeds defiance
    
    // Fear vs courage
    if (targetPersonality.neuroticism > 60) {
      chance += 0.1; // Anxious people intimidate easier
    }
    
    // Existing relationship
    if (relationship && relationship.fear > 50) {
      chance += 0.15; // Already scared
    }
    
    return Math.max(0.05, Math.min(0.85, chance));
  }
  
  // Persuasion calculation
  private static calculatePersuasionChance(
    attempt: InfluenceAttempt,
    stats: Record<StatKey, number>,
    skills: Record<SkillKey, number>,
    targetPersonality: PersonalityTraits,
    relationship: Relationship | null
  ): number {
    let chance = 0.3;
    
    // Initiator factors
    chance += (stats.charisma || 0) / 150;        // Max +0.67
    chance += (stats.intelligence || 0) / 200;    // Max +0.5
    chance += (skills.negotiation || 0) / 150;    // Max +0.67
    chance += (skills.lying || 0) / 300;          // Max +0.33 (persuasion uses some deception)
    
    // Target openness
    chance += (targetPersonality.openness || 50) / 200;      // Max +0.5
    chance += (targetPersonality.agreeableness || 50) / 150; // Max +0.67
    
    // Existing relationship
    if (relationship) {
      chance += (relationship.trust || 0) / 200;  // Max +0.5
      chance += (relationship.respect || 0) / 300; // Max +0.33
    }
    
    return Math.max(0.1, Math.min(0.9, chance));
  }
  
  // Seduction calculation
  private static calculateSeductionChance(
    attempt: InfluenceAttempt,
    stats: Record<StatKey, number>,
    skills: Record<SkillKey, number>,
    targetPersonality: PersonalityTraits,
    relationship: Relationship | null
  ): number {
    let chance = 0.15; // Lower base chance
    
    // Initiator factors
    chance += (stats.charisma || 0) / 125;      // Max +0.8
    chance += (stats.agility || 0) / 300;       // Physical attractiveness
    chance += (skills.adult || 0) / 150;        // Seduction skills
    chance += (skills.lying || 0) / 400;        // Subtle manipulation
    
    // Target receptiveness
    chance += (targetPersonality.openness || 50) / 200;
    chance += (targetPersonality.extraversion || 50) / 250;
    
    // Existing attraction
    if (relationship && relationship.attraction > 50) {
      chance += (relationship.attraction - 50) / 100; // Max +0.5
    }
    
    // Reduced by high willpower or loyalty
    chance -= (targetPersonality.willpower || 50) / 300;
    chance -= (targetPersonality.loyalty || 50) / 400;
    
    return Math.max(0.02, Math.min(0.7, chance));
  }
  
  // Manipulation calculation
  private static calculateManipulationChance(
    attempt: InfluenceAttempt,
    stats: Record<StatKey, number>,
    skills: Record<SkillKey, number>,
    targetPersonality: PersonalityTraits,
    relationship: Relationship | null
  ): number {
    let chance = 0.25;
    
    // Initiator factors
    chance += (stats.cunning || 0) / 150;        // Max +0.67
    chance += (stats.intelligence || 0) / 200;   // Max +0.5
    chance += (skills.lying || 0) / 125;         // Max +0.8
    chance += (skills.negotiation || 0) / 250;   // Max +0.4
    
    // Target vulnerability
    chance += (targetPersonality.neuroticism || 50) / 200; // Anxious people easier to manipulate
    chance -= (targetPersonality.intelligence || 50) / 200; // Smart people resist
    chance -= (targetPersonality.paranoia || 30) / 150;   // Paranoid people suspicious
    
    // Trust makes manipulation easier
    if (relationship && relationship.trust > 60) {
      chance += 0.2;
    }
    
    return Math.max(0.05, Math.min(0.85, chance));
  }
  
  // Bribery calculation
  private static calculateBriberyChance(
    attempt: InfluenceAttempt,
    stats: Record<StatKey, number>,
    skills: Record<SkillKey, number>,
    targetPersonality: PersonalityTraits,
    relationship: Relationship | null
  ): number {
    let chance = 0.4; // Relatively high base chance
    
    // Money talks
    if (attempt.offer?.money) {
      chance += Math.min(0.3, attempt.offer.money / 1000); // Max +0.3 for 1000+ euros
    }
    
    // Target greed
    chance += (targetPersonality.greed || 40) / 200; // Max +0.5
    
    // Reduce if high loyalty or willpower
    chance -= (targetPersonality.loyalty || 50) / 300;
    chance -= (targetPersonality.willpower || 50) / 400;
    
    // Initiator negotiation skills
    chance += (skills.negotiation || 0) / 300; // Max +0.33
    
    return Math.max(0.1, Math.min(0.9, chance));
  }
  
  // Threat calculation
  private static calculateThreatChance(
    attempt: InfluenceAttempt,
    stats: Record<StatKey, number>,
    skills: Record<SkillKey, number>,
    targetPersonality: PersonalityTraits,
    relationship: Relationship | null
  ): number {
    let chance = 0.3;
    
    // Similar to intimidation but more specific
    chance += (stats.cunning || 0) / 200;
    chance += (skills.lying || 0) / 200; // Need to make threat credible
    
    // Target fear of consequences
    chance += (targetPersonality.neuroticism || 50) / 200;
    chance -= (targetPersonality.willpower || 50) / 200;
    
    // Existing fear relationship
    if (relationship && relationship.fear > 40) {
      chance += 0.2;
    }
    
    // Credibility of threat matters
    if (attempt.threat?.violence && (skills.brawling || 0) < 20) {
      chance -= 0.2; // Empty threat
    }
    
    return Math.max(0.05, Math.min(0.8, chance));
  }
  
  // Get contextual modifiers
  private static getContextualModifiers(
    context: { heatLevel: number; location: string; timeOfDay: string; publicPlace: boolean },
    influenceType: InfluenceType,
    targetPersonality: PersonalityTraits
  ): number[] {
    const modifiers: number[] = [];
    
    // Heat level affects everything
    modifiers.push(-(context.heatLevel / 100) * 0.1); // Max -0.1
    
    // Public place considerations
    if (context.publicPlace) {
      if (influenceType === 'intimidate' || influenceType === 'threaten') {
        modifiers.push(-0.1); // Harder to intimidate in public
      } else if (influenceType === 'seduce') {
        modifiers.push(-0.15); // Much harder to seduce in public
      }
    }
    
    // Time of day
    if (context.timeOfDay === 'night') {
      if (influenceType === 'intimidate' || influenceType === 'threaten') {
        modifiers.push(0.1); // Scarier at night
      }
      if (influenceType === 'seduce') {
        modifiers.push(0.05); // Slightly more romantic
      }
    }
    
    // Paranoid people are harder to influence at night
    if (context.timeOfDay === 'night' && targetPersonality.paranoia > 60) {
      modifiers.push(-0.1);
    }
    
    return modifiers;
  }
  
  // Get relationship-based modifiers
  private static getRelationshipModifiers(relationship: Relationship, influenceType: InfluenceType): number[] {
    const modifiers: number[] = [];
    
    // Trust generally helps all influence except intimidation
    if (relationship.trust > 50 && influenceType !== 'intimidate' && influenceType !== 'threaten') {
      modifiers.push((relationship.trust - 50) / 250); // Max +0.2
    }
    
    // Fear helps intimidation and threats
    if (relationship.fear > 30 && (influenceType === 'intimidate' || influenceType === 'threaten')) {
      modifiers.push((relationship.fear - 30) / 200); // Max +0.35
    }
    
    // Attraction helps seduction
    if (relationship.attraction > 50 && influenceType === 'seduce') {
      modifiers.push((relationship.attraction - 50) / 150); // Max +0.33
    }
    
    // Respect helps persuasion
    if (relationship.respect > 50 && influenceType === 'persuade') {
      modifiers.push((relationship.respect - 50) / 300); // Max +0.17
    }
    
    return modifiers;
  }
  
  // Calculate consequences of influence attempt
  private static calculateConsequences(
    attempt: InfluenceAttempt,
    success: boolean,
    degree: number,
    context: any,
    targetPersonality: PersonalityTraits
  ): InfluenceConsequence[] {
    const consequences: InfluenceConsequence[] = [];
    
    // Failed intimidation/threats can lead to retaliation
    if (!success && (attempt.type === 'intimidate' || attempt.type === 'threaten')) {
      if (targetPersonality.violence > 50) {
        consequences.push({
          type: 'retaliation',
          severity: 'moderate',
          description: 'Kohde saattaa kostaa epäonnistuneesta uhkailusta.',
          entities: [attempt.target],
          delayed: Math.random() * 3600 // 0-1 hour delay
        });
      }
    }
    
    // Witnesses can spread word
    if (attempt.witnesses.length > 0) {
      const severity = context.publicPlace ? 'major' : 'minor';
      consequences.push({
        type: 'reputation',
        severity,
        description: `Todistajat saattavat levittää sanaa ${attempt.type === 'intimidate' ? 'uhkailusta' : 'vaikuttamisyrityksestä'}.`,
        entities: attempt.witnesses
      });
    }
    
    // Successful manipulation might create future opportunities
    if (success && attempt.type === 'manipulate' && degree > 50) {
      consequences.push({
        type: 'opportunity',
        severity: 'moderate',
        description: 'Onnistunut manipulointi avaa uusia mahdollisuuksia.',
        entities: [attempt.target]
      });
    }
    
    return consequences;
  }
  
  // Calculate relationship changes
  private static calculateRelationshipChanges(
    attempt: InfluenceAttempt,
    success: boolean,
    degree: number,
    targetPersonality: PersonalityTraits
  ): any {
    const changes: any = {};
    
    const successMultiplier = success ? 1 : -0.5;
    const degreeMultiplier = Math.abs(degree) / 100;
    
    switch (attempt.type) {
      case 'intimidate':
      case 'threaten':
        changes.fear = Math.round((5 + degree / 10) * successMultiplier);
        changes.trust = Math.round(-3 * successMultiplier);
        changes.respect = success ? Math.round(2 * degreeMultiplier) : -2;
        break;
        
      case 'persuade':
        changes.trust = Math.round(3 * successMultiplier);
        changes.respect = Math.round(2 * successMultiplier);
        break;
        
      case 'seduce':
        if (success) {
          changes.attraction = Math.round(8 * degreeMultiplier);
          changes.trust = Math.round(1 * degreeMultiplier);
        } else {
          changes.attraction = -5;
          changes.respect = -3;
        }
        break;
        
      case 'manipulate':
        // Manipulation often goes unnoticed if successful
        if (!success) {
          changes.trust = -8;
          changes.respect = -5;
        } else if (degree < 30) {
          // Barely successful manipulation might be noticed
          changes.trust = -2;
        }
        break;
        
      case 'bribe':
        changes.trust = success ? -2 : -5; // Bribery always reduces trust somewhat
        changes.respect = success ? 3 : -3;
        break;
    }
    
    return changes;
  }
  
  // Calculate reputation changes
  private static calculateReputationChanges(
    attempt: InfluenceAttempt,
    success: boolean,
    degree: number,
    context: any
  ): Record<string, number> {
    const changes: Record<string, number> = {};
    
    // Public influence attempts affect street reputation
    if (context.publicPlace || attempt.witnesses.length > 2) {
      if (attempt.type === 'intimidate' && success) {
        changes.street_gangs = 2;
        changes.civilians = -3;
      }
      
      if (attempt.type === 'bribe' && !success) {
        changes.police = -5; // Failed bribery looks bad
        changes.high_society = -3;
      }
    }
    
    return changes;
  }
  
  // Determine special outcomes
  private static determineSpecialOutcomes(
    attempt: InfluenceAttempt,
    success: boolean,
    degree: number,
    targetPersonality: PersonalityTraits
  ): any {
    const outcomes: any = {};
    
    if (success) {
      // Information gathering
      if (attempt.type === 'seduce' || attempt.type === 'manipulate') {
        if (degree > 60) {
          outcomes.information = ['Henkilökohtainen salaisuus', 'Liiketoiminnan yksityiskohta'];
        }
      }
      
      // Services provided
      if (attempt.type === 'intimidate' && degree > 50) {
        outcomes.services = ['Suojelupalvelu', 'Informaatio'];
      }
      
      // Favors owed
      if (attempt.type === 'persuade' && degree > 70) {
        outcomes.favors = ['Palvelus tulevaisuudessa'];
      }
    }
    
    return outcomes;
  }
}

// Helper functions for UI and game integration
export function getInfluenceActionDescription(type: InfluenceType): string {
  const descriptions = {
    intimidate: 'Pelottele',
    persuade: 'Vakuuta',
    seduce: 'Viettele',
    manipulate: 'Manipuloi',
    bribe: 'Lahjo',
    threaten: 'Uhkaile'
  };
  return descriptions[type];
}

export function getInfluenceResultDescription(result: InfluenceResult): string {
  if (result.success) {
    if (result.degree > 70) return 'Täydellinen onnistuminen';
    if (result.degree > 40) return 'Hyvä onnistuminen';
    return 'Kohtalainen onnistuminen';
  } else {
    if (result.degree < -70) return 'Katastrofaalinen epäonnistuminen';
    if (result.degree < -40) return 'Paha epäonnistuminen';
    return 'Lievä epäonnistuminen';
  }
}

export function getRequiredSkillsForInfluence(type: InfluenceType): { primary: SkillKey; secondary?: SkillKey } {
  const skillMap = {
    intimidate: { primary: 'brawling' as SkillKey, secondary: 'torture' as SkillKey },
    persuade: { primary: 'negotiation' as SkillKey, secondary: 'lying' as SkillKey },
    seduce: { primary: 'adult' as SkillKey, secondary: 'lying' as SkillKey },
    manipulate: { primary: 'lying' as SkillKey, secondary: 'negotiation' as SkillKey },
    bribe: { primary: 'negotiation' as SkillKey },
    threaten: { primary: 'lying' as SkillKey, secondary: 'brawling' as SkillKey }
  };
  
  return skillMap[type];
}