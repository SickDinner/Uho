import type { EntityId, StatKey, SkillKey } from './types.ts';
import type { PersonalityTraits } from './personality.ts';
import type { Relationship, SocialProfile } from './reputation.ts';

// Dialogue option with conditions and effects
export interface DialogueOption {
  id: string;
  text: string;
  requirements?: {
    stats?: Partial<Record<StatKey, number>>;
    skills?: Partial<Record<SkillKey, number>>;
    reputation?: Record<string, number>;
    relationship?: {
      trust?: number;
      fear?: number;
      respect?: number;
      attraction?: number;
    };
    items?: string[];
    flags?: Record<string, boolean>;
    mood?: string;
    money?: number;
  };
  effects?: {
    relationship?: {
      trust?: number;
      fear?: number;
      respect?: number;
      attraction?: number;
    };
    reputation?: Record<string, number>;
    stats?: Partial<Record<StatKey, number>>;
    money?: number;
    items?: Array<{ id: string; quantity: number; give: boolean }>; // give = true means you give to them
    flags?: Record<string, any>;
    mood?: string; // Change NPC mood
  };
  nextNode?: string;
  isExit?: boolean;
  skillCheck?: {
    skill: SkillKey;
    difficulty: number;
    successNode: string;
    failureNode: string;
    successText: string;
    failureText: string;
  };
}

// Dialogue node with context-aware responses
export interface DialogueNode {
  id: string;
  speaker: string;    // 'player' or NPC name
  text: string;
  options: DialogueOption[];
  conditions?: {
    relationship?: {
      status?: string[];
      trust?: { min?: number; max?: number };
      fear?: { min?: number; max?: number };
    };
    mood?: string[];
    timesSeen?: number; // Only show after X previous conversations
    randomChance?: number; // 0-1 probability
  };
  effects?: {
    relationship?: Partial<Omit<Relationship, 'entityId'>>;
    mood?: string;
    flags?: Record<string, any>;
  };
}

// Complete dialogue tree for an NPC
export interface DialogueTree {
  npcId: string;
  name: string;
  rootNode: string;
  nodes: Record<string, DialogueNode>;
  globalConditions?: {
    firstMeeting?: string; // Node ID for first meeting
    relationship?: Record<string, string>; // Relationship status -> node ID
    mood?: Record<string, string>; // Mood -> node ID
    faction?: Record<string, string>; // Player faction reputation -> node ID
  };
}

// Context for dialogue resolution
export interface DialogueContext {
  playerId: EntityId;
  npcId: EntityId;
  playerStats: Record<StatKey, number>;
  playerSkills: Record<SkillKey, number>;
  playerSocial: SocialProfile;
  npcPersonality: PersonalityTraits;
  npcMood: string;
  location: string;
  gameFlags: Record<string, any>;
  conversationHistory: string[];
}

// Dynamic dialogue generator for different NPC types
export class DialogueManager {
  private dialogueTrees: Map<string, DialogueTree> = new Map();
  private activeDialogues: Map<string, { npcId: EntityId; currentNode: string; context: DialogueContext }> = new Map();

  constructor() {
    this.initializeDialogueTrees();
  }

  // Initialize dialogue trees for different NPC types
  private initializeDialogueTrees(): void {
    // Street Dealer dialogue
    this.registerDialogueTree({
      npcId: 'street_dealer',
      name: 'Katukauppias',
      rootNode: 'greeting',
      globalConditions: {
        firstMeeting: 'first_meeting',
        relationship: {
          enemy: 'hostile_greeting',
          ally: 'friendly_greeting',
          lover: 'intimate_greeting'
        },
        mood: {
          paranoid: 'paranoid_greeting',
          desperate: 'desperate_greeting',
          drunk: 'drunk_greeting'
        }
      },
      nodes: {
        first_meeting: {
          id: 'first_meeting',
          speaker: 'Katukauppias',
          text: 'Hei, en ole nähnyt sua täällä ennen. Oot varma että tää on sun paikka?',
          options: [
            {
              id: 'introduce_self',
              text: 'Olen [NIMI]. Etsin erityisiä palveluita.',
              requirements: { skills: { lying: 15 } },
              effects: { 
                relationship: { trust: 5, respect: 5 },
                reputation: { drug_networks: 2 }
              },
              nextNode: 'interested'
            },
            {
              id: 'act_tough',
              text: 'Älä kysy kysymyksiä. Onko sulla tavaraa vai ei?',
              requirements: { stats: { cunning: 30 } },
              effects: { relationship: { fear: 10, respect: 8 } },
              nextNode: 'impressed'
            },
            {
              id: 'be_polite',
              text: 'Anteeksi häirintä. Voin lähteä jos haluat.',
              effects: { relationship: { trust: 3 } },
              nextNode: 'softened'
            }
          ]
        },

        greeting: {
          id: 'greeting',
          speaker: 'Katukauppias',
          text: 'Morjens. Mitä tänään?',
          options: [
            {
              id: 'buy_drugs',
              text: 'Tarvitsen tavaraa.',
              nextNode: 'show_inventory'
            },
            {
              id: 'ask_info',
              text: 'Mitä kuuluu kaduilla?',
              requirements: { relationship: { trust: 20 } },
              nextNode: 'street_info'
            },
            {
              id: 'leave',
              text: 'Ei mitään tällä kertaa.',
              isExit: true
            }
          ]
        },

        hostile_greeting: {
          id: 'hostile_greeting',
          speaker: 'Katukauppias',
          text: 'Vittu, miksi sä oot täällä? Vedä vittuun!',
          conditions: { relationship: { status: ['enemy'] } },
          options: [
            {
              id: 'apologize',
              text: 'Kuule, voitaisiinko unohtaa vanhat jutut?',
              skillCheck: {
                skill: 'negotiation',
                difficulty: 40,
                successNode: 'grudging_acceptance',
                failureNode: 'rejected',
                successText: 'Kauppias harkitsee hetken...',
                failureText: 'Kauppias kääntyy pois halveksuen.'
              }
            },
            {
              id: 'threaten',
              text: 'Älä puhu mulle noin tai joudut katumaan.',
              requirements: { stats: { cunning: 50 }, skills: { brawling: 30 } },
              effects: { relationship: { fear: 20 } },
              nextNode: 'intimidated'
            },
            {
              id: 'leave_angry',
              text: 'Hyvä on, lähden.',
              isExit: true,
              effects: { relationship: { respect: -5 } }
            }
          ]
        },

        paranoid_greeting: {
          id: 'paranoid_greeting',
          speaker: 'Katukauppias',
          text: 'Sä... sä et oo poliisi vai? Katsot jotenkin oudosti.',
          conditions: { mood: ['paranoid'] },
          options: [
            {
              id: 'calm_down',
              text: 'Rauhoitu, olen vaan asiakas.',
              skillCheck: {
                skill: 'lying',
                difficulty: 25,
                successNode: 'calmed',
                failureNode: 'more_paranoid',
                successText: 'Kauppias rentoutuu hieman.',
                failureText: 'Kauppias näyttää entistäkin epäluuloisemmalta.'
              }
            },
            {
              id: 'show_understanding',
              text: 'Ymmärrän varovaisuuden. Täällä pitää olla tarkkana.',
              requirements: { skills: { evasion: 20 } },
              effects: { relationship: { trust: 8 } },
              nextNode: 'understanding'
            }
          ]
        },

        show_inventory: {
          id: 'show_inventory',
          speaker: 'Katukauppias',
          text: 'Katso mitä mulla on. Hinnat riippuu siitä kuinka hyvin tunnen sut.',
          options: [
            {
              id: 'buy_cannabis',
              text: 'Kannabista (20€)',
              requirements: { money: 20 },
              effects: { 
                money: -20,
                items: [{ id: 'kannabis', quantity: 1, give: false }],
                relationship: { trust: 2 }
              },
              nextNode: 'transaction_complete'
            },
            {
              id: 'buy_alcohol',
              text: 'Alkoholia (15€)',
              requirements: { money: 15 },
              effects: { 
                money: -15,
                items: [{ id: 'alkoholi', quantity: 1, give: false }]
              },
              nextNode: 'transaction_complete'
            },
            {
              id: 'negotiate_price',
              text: 'Hinnat on liian korkeita.',
              skillCheck: {
                skill: 'negotiation',
                difficulty: 30,
                successNode: 'discount_offered',
                failureNode: 'no_discount',
                successText: 'Kauppias harkitsee...',
                failureText: 'Kauppias pudistaa päätään.'
              }
            },
            {
              id: 'back_to_greeting',
              text: 'Anna mun miettiä.',
              nextNode: 'greeting'
            }
          ]
        }
      }
    });

    // Gang Enforcer dialogue
    this.registerDialogueTree({
      npcId: 'gang_enforcer',
      name: 'Jengin Pakottaja',
      rootNode: 'sizing_up',
      nodes: {
        sizing_up: {
          id: 'sizing_up',
          speaker: 'Jengin Pakottaja',
          text: 'No niin... mitäs meillä tässä on?',
          options: [
            {
              id: 'show_respect',
              text: 'Hyvää päivää. Kuulin että te kontrolloitte tätä aluetta.',
              requirements: { stats: { charisma: 25 } },
              effects: { relationship: { respect: 5 } },
              nextNode: 'respectful_response'
            },
            {
              id: 'act_defiant',
              text: 'Kuka sä luulet olevasi?',
              requirements: { stats: { willpower: 40 } },
              effects: { relationship: { respect: 10, fear: -5 } },
              nextNode: 'challenged'
            },
            {
              id: 'try_to_leave',
              text: 'Anteeksi, väärä käänös.',
              effects: { relationship: { respect: -3 } },
              nextNode: 'not_so_fast'
            }
          ]
        },

        respectful_response: {
          id: 'respectful_response',
          speaker: 'Jengin Pakottaja',
          text: 'Hyvä. Ainakin sä ymmärrät miten tää toimii. Mitä sä haluat?',
          options: [
            {
              id: 'ask_protection',
              text: 'Tarvitsen suojaa. Voinko maksaa sinulle?',
              requirements: { money: 100 },
              effects: { 
                money: -100,
                reputation: { organized_crime: 5 }
              },
              nextNode: 'protection_arranged'
            },
            {
              id: 'ask_work',
              text: 'Etsin töitä. Onko teillä mitään?',
              requirements: { skills: { brawling: 25 } },
              nextNode: 'work_available'
            }
          ]
        }
      }
    });

    // High Class Escort dialogue
    this.registerDialogueTree({
      npcId: 'high_class_escort',
      name: 'Korkealuokkainen Saattonainen',
      rootNode: 'elegant_greeting',
      nodes: {
        elegant_greeting: {
          id: 'elegant_greeting',
          speaker: 'Korkealuokkainen Saattonainen',
          text: 'Hyvää iltaa. En ole nähnyt sinua näissä piireissä aiemmin.',
          options: [
            {
              id: 'flirt',
              text: 'Sellaisessa seurassa kuin sinä, ymmärrän miksi.',
              requirements: { stats: { charisma: 40 } },
              effects: { relationship: { attraction: 10 } },
              nextNode: 'flattered'
            },
            {
              id: 'business_inquiry',
              text: 'Kuulin että tarjoat... erikoispalveluita.',
              requirements: { stats: { intelligence: 30 } },
              nextNode: 'business_discussion'
            },
            {
              id: 'nervous_response',
              text: 'Olen uusi täällä. En oikein tiedä miten...',
              nextNode: 'understanding_smile'
            }
          ]
        },

        business_discussion: {
          id: 'business_discussion',
          speaker: 'Korkealuokkainen Saattonainen',
          text: 'Tarjoan seurustelua sivistyneille herrasmiehille. Hintani alkaa 500 eurosta illalta.',
          options: [
            {
              id: 'accept_price',
              text: 'Se sopii minulle.',
              requirements: { money: 500 },
              effects: { 
                money: -500,
                relationship: { attraction: 15, trust: 5 },
                flags: { escort_service: true }
              },
              nextNode: 'service_arranged'
            },
            {
              id: 'negotiate',
              text: 'Hinta on hieman kova.',
              skillCheck: {
                skill: 'negotiation',
                difficulty: 50,
                successNode: 'price_reduced',
                failureNode: 'no_negotiation',
                successText: 'Hän hymyilee hienovaraisesti.',
                failureText: 'Hän kohottaa kulmakarvaansa.'
              }
            },
            {
              id: 'ask_other_services',
              text: 'Entäs muita palveluita?',
              requirements: { relationship: { trust: 30 } },
              nextNode: 'special_services'
            }
          ]
        }
      }
    });
  }

  // Register a new dialogue tree
  registerDialogueTree(tree: DialogueTree): void {
    this.dialogueTrees.set(tree.npcId, tree);
  }

  // Start dialogue with an NPC
  startDialogue(playerId: EntityId, npcId: EntityId, context: DialogueContext): DialogueNode | null {
    const npcType = this.getNPCType(npcId);
    const tree = this.dialogueTrees.get(npcType);
    if (!tree) return null;

    // Determine starting node based on conditions
    const startNode = this.determineStartingNode(tree, context);
    const node = tree.nodes[startNode];
    if (!node) return null;

    // Store active dialogue
    const dialogueKey = `${playerId}_${npcId}`;
    this.activeDialogues.set(dialogueKey, {
      npcId,
      currentNode: startNode,
      context
    });

    // Apply node effects
    this.applyNodeEffects(node, context);

    return this.processDialogueNode(node, context);
  }

  // Process dialogue option selection
  selectDialogueOption(playerId: EntityId, npcId: EntityId, optionId: string): DialogueNode | null {
    const dialogueKey = `${playerId}_${npcId}`;
    const activeDialogue = this.activeDialogues.get(dialogueKey);
    if (!activeDialogue) return null;

    const npcType = this.getNPCType(npcId);
    const tree = this.dialogueTrees.get(npcType);
    if (!tree) return null;

    const currentNode = tree.nodes[activeDialogue.currentNode];
    const selectedOption = currentNode.options.find(opt => opt.id === optionId);
    if (!selectedOption) return null;

    // Check requirements
    if (!this.meetsRequirements(selectedOption, activeDialogue.context)) {
      return null;
    }

    // Apply option effects
    this.applyOptionEffects(selectedOption, activeDialogue.context);

    // Handle skill check
    if (selectedOption.skillCheck) {
      const success = this.performSkillCheck(selectedOption.skillCheck, activeDialogue.context);
      const nextNodeId = success ? selectedOption.skillCheck.successNode : selectedOption.skillCheck.failureNode;
      return this.continueDialogue(playerId, npcId, nextNodeId);
    }

    // Handle exit
    if (selectedOption.isExit) {
      this.endDialogue(playerId, npcId);
      return null;
    }

    // Continue to next node
    if (selectedOption.nextNode) {
      return this.continueDialogue(playerId, npcId, selectedOption.nextNode);
    }

    return null;
  }

  // Continue dialogue to specific node
  private continueDialogue(playerId: EntityId, npcId: EntityId, nodeId: string): DialogueNode | null {
    const dialogueKey = `${playerId}_${npcId}`;
    const activeDialogue = this.activeDialogues.get(dialogueKey);
    if (!activeDialogue) return null;

    const npcType = this.getNPCType(npcId);
    const tree = this.dialogueTrees.get(npcType);
    if (!tree) return null;

    const node = tree.nodes[nodeId];
    if (!node) return null;

    // Update current node
    activeDialogue.currentNode = nodeId;

    // Apply node effects
    this.applyNodeEffects(node, activeDialogue.context);

    return this.processDialogueNode(node, activeDialogue.context);
  }

  // End dialogue
  endDialogue(playerId: EntityId, npcId: EntityId): void {
    const dialogueKey = `${playerId}_${npcId}`;
    this.activeDialogues.delete(dialogueKey);
  }

  // Determine starting node based on conditions
  private determineStartingNode(tree: DialogueTree, context: DialogueContext): string {
    if (!tree.globalConditions) return tree.rootNode;

    // Check if first meeting
    const relationship = context.playerSocial.getRelationship(context.npcId);
    if (!relationship || relationship.interactions === 0) {
      return tree.globalConditions.firstMeeting || tree.rootNode;
    }

    // Check relationship-based nodes
    if (tree.globalConditions.relationship && relationship.status in tree.globalConditions.relationship) {
      return tree.globalConditions.relationship[relationship.status];
    }

    // Check mood-based nodes
    if (tree.globalConditions.mood && context.npcMood in tree.globalConditions.mood) {
      return tree.globalConditions.mood[context.npcMood];
    }

    // Check faction reputation
    if (tree.globalConditions.faction) {
      for (const [faction, nodeId] of Object.entries(tree.globalConditions.faction)) {
        const reputation = context.playerSocial.getFactionReputation(faction);
        if (reputation && reputation.reputation > 50) {
          return nodeId;
        }
      }
    }

    return tree.rootNode;
  }

  // Process dialogue node with context
  private processDialogueNode(node: DialogueNode, context: DialogueContext): DialogueNode {
    // Filter options based on conditions
    const availableOptions = node.options.filter(option => 
      this.meetsRequirements(option, context)
    );

    // Create processed node
    return {
      ...node,
      options: availableOptions,
      text: this.processText(node.text, context)
    };
  }

  // Check if requirements are met
  private meetsRequirements(option: DialogueOption, context: DialogueContext): boolean {
    if (!option.requirements) return true;

    // Check stats
    if (option.requirements.stats) {
      for (const [stat, required] of Object.entries(option.requirements.stats)) {
        if (context.playerStats[stat as StatKey] < required) return false;
      }
    }

    // Check skills  
    if (option.requirements.skills) {
      for (const [skill, required] of Object.entries(option.requirements.skills)) {
        if (context.playerSkills[skill as SkillKey] < required) return false;
      }
    }

    // Check relationship
    if (option.requirements.relationship) {
      const relationship = context.playerSocial.getRelationship(context.npcId);
      if (!relationship) return false;

      const req = option.requirements.relationship;
      if (req.trust && relationship.trust < req.trust) return false;
      if (req.fear && relationship.fear < req.fear) return false;
      if (req.respect && relationship.respect < req.respect) return false;
    }

    // Check reputation
    if (option.requirements.reputation) {
      for (const [faction, required] of Object.entries(option.requirements.reputation)) {
        const rep = context.playerSocial.getFactionReputation(faction);
        if (!rep || rep.reputation < required) return false;
      }
    }

    // Check mood
    if (option.requirements.mood) {
      if (context.npcMood !== option.requirements.mood) return false;
    }

    return true;
  }

  // Apply option effects
  private applyOptionEffects(option: DialogueOption, context: DialogueContext): void {
    if (!option.effects) return;

    // Apply relationship changes
    if (option.effects.relationship) {
      context.playerSocial.modifyRelationship(context.npcId, option.effects.relationship);
    }

    // Apply reputation changes
    if (option.effects.reputation) {
      for (const [faction, change] of Object.entries(option.effects.reputation)) {
        context.playerSocial.modifyFactionReputation(faction, change, 'dialogue_choice');
      }
    }

    // Set flags
    if (option.effects.flags) {
      Object.assign(context.gameFlags, option.effects.flags);
    }
  }

  // Apply node effects
  private applyNodeEffects(node: DialogueNode, context: DialogueContext): void {
    if (!node.effects) return;

    // Apply relationship changes
    if (node.effects.relationship) {
      context.playerSocial.modifyRelationship(context.npcId, node.effects.relationship);
    }

    // Set flags
    if (node.effects.flags) {
      Object.assign(context.gameFlags, node.effects.flags);
    }
  }

  // Perform skill check
  private performSkillCheck(skillCheck: DialogueOption['skillCheck'], context: DialogueContext): boolean {
    if (!skillCheck) return false;

    const playerSkill = context.playerSkills[skillCheck.skill];
    const difficulty = skillCheck.difficulty;

    // Base chance based on skill vs difficulty
    let chance = (playerSkill / difficulty) * 0.7; // 70% max base chance

    // Personality modifiers
    if (skillCheck.skill === 'lying' && context.npcPersonality.paranoia > 60) {
      chance *= 0.8; // Paranoid NPCs are harder to lie to
    }

    if (skillCheck.skill === 'negotiation' && context.npcPersonality.greed > 60) {
      chance *= 1.2; // Greedy NPCs are more open to negotiation
    }

    // Relationship modifiers
    const relationship = context.playerSocial.getRelationship(context.npcId);
    if (relationship) {
      if (relationship.trust > 60) chance *= 1.1;
      if (relationship.fear > 60) chance *= 1.2;
    }

    return Math.random() < Math.min(0.95, chance);
  }

  // Process text with variable substitution
  private processText(text: string, context: DialogueContext): string {
    // Replace [NIMI] with player name or generic term
    text = text.replace(/\[NIMI\]/g, 'kaveri');
    
    // Add other text processing as needed
    return text;
  }

  // Get NPC type from entity ID (this would need to be implemented based on your NPC system)
  private getNPCType(npcId: EntityId): string {
    // This is a placeholder - you'd implement this based on your NPC component system
    return 'street_dealer';
  }
}

// Dialogue response for UI
export interface DialogueResponse {
  speaker: string;
  text: string;
  options: Array<{
    id: string;
    text: string;
    available: boolean;
    skillCheck?: string | undefined;
  }>;
}

// Create dialogue response for UI consumption
export function createDialogueResponse(node: DialogueNode, context: DialogueContext): DialogueResponse {
  return {
    speaker: node.speaker,
    text: node.text,
    options: node.options.map(option => ({
      id: option.id,
      text: option.text,
      available: true, // Already filtered in processDialogueNode
      skillCheck: option.skillCheck ? `${option.skillCheck.skill} (${option.skillCheck.difficulty})` : undefined
    }))
  };
}