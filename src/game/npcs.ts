export type NPCType = 'flirt' | 'hostile' | 'boss';
export type BossAbility = 'steam' | 'capitalism' | 'hypnosis';

export interface NPC {
  id: string;
  name: string;
  zoneId: string;
  x: number;
  y: number;
  icon: string;
  color: string;
  type: NPCType;
  hp: number;
  maxHp: number;
  charm: number;
  shame: number;
  groove: number;
  tolerance: number;
  riceArmor: number;
  attackName: string;
  description: string;
  dialogues?: string[];
  bossAbility?: BossAbility;
  flirtDifficulty?: number;
  loot?: {
    riceGrenades?: number;
    pill?: boolean;
  };
  alive: boolean;
}

interface NPCBlueprint extends Omit<NPC, 'hp' | 'maxHp' | 'alive'> {
  hp: number;
  maxHp?: number;
}

const npcBlueprints: NPCBlueprint[] = [
  {
    id: 'sirpa-klaani',
    name: 'Sirpa Särky-Klaani',
    zoneId: 'torkyturpa-bar',
    x: 12,
    y: 6,
    icon: '♀',
    color: '#ff85d8',
    type: 'flirt',
    hp: 6,
    charm: 5,
    shame: 4,
    groove: 5,
    tolerance: 3,
    riceArmor: 1,
    attackName: 'slinging karaoke insults',
    description: 'Neon leopard print and a voice like gravelled champagne.',
    dialogues: [
      "Hei baby, buy me a lonkero or I report your aura.",
      "Sing me TenderSatan and maybe I lend you my lipstick."
    ],
    flirtDifficulty: 4,
    loot: { pill: true }
  },
  {
    id: 'matti-vanha',
    name: 'Matti Vanha-Disko',
    zoneId: 'torkyturpa-bar',
    x: 20,
    y: 11,
    icon: '♂',
    color: '#7fd3ff',
    type: 'flirt',
    hp: 6,
    charm: 4,
    shame: 3,
    groove: 6,
    tolerance: 4,
    riceArmor: 1,
    attackName: 'spraying cologne',
    description: 'He wears more gold than the Finnish reserves.',
    dialogues: [
      "My mixtape cured my priest. Wanna taste?",
      "I dance like a municipal budget crisis." 
    ],
    flirtDifficulty: 5,
    loot: { pill: true }
  },
  {
    id: 'dj-klamydia',
    name: 'DJ Klamydia-Katja',
    zoneId: 'torkyturpa-bar',
    x: 28,
    y: 8,
    icon: '♪',
    color: '#f9ff6b',
    type: 'flirt',
    hp: 7,
    charm: 6,
    shame: 4,
    groove: 7,
    tolerance: 4,
    riceArmor: 2,
    attackName: 'dropping cursed beats',
    description: 'Her turntables are built from old Nokia phones.',
    dialogues: [
      "Spin me a compliment, pill-boy.",
      "I can auto-tune your therapy sessions."
    ],
    flirtDifficulty: 6,
    loot: { riceGrenades: 1 }
  },
  {
    id: 'condom-golem',
    name: 'Condom Golem',
    zoneId: 'karpas-alley',
    x: 18,
    y: 5,
    icon: 'Ж',
    color: '#ffb6c1',
    type: 'hostile',
    hp: 10,
    charm: 2,
    shame: 6,
    groove: 3,
    tolerance: 4,
    riceArmor: 2,
    attackName: 'slapping with latex',
    description: 'A towering mass of municipal prophylactics.',
    dialogues: ["You slipped on me once, nyt maksat!"]
  },
  {
    id: 'fly-pimp',
    name: 'Kärpänen Pimp-Lord',
    zoneId: 'karpas-alley',
    x: 25,
    y: 10,
    icon: 'Ʃ',
    color: '#adff2f',
    type: 'hostile',
    hp: 9,
    charm: 3,
    shame: 5,
    groove: 5,
    tolerance: 3,
    riceArmor: 1,
    attackName: 'buzzing debt collectors',
    description: 'Wings embroidered with court dates.',
    dialogues: ["Pay buzz-tax or I sting your self-esteem."]
  },
  {
    id: 'korppi-commandant',
    name: 'Korppi Commandant',
    zoneId: 'korppi-sauna',
    x: 25,
    y: 8,
    icon: '🐦',
    color: '#ff7043',
    type: 'boss',
    hp: 18,
    maxHp: 18,
    charm: 4,
    shame: 8,
    groove: 4,
    tolerance: 6,
    riceArmor: 3,
    attackName: 'steam flogging',
    description: 'A raven in leather apron wielding a ladle like a bayonet.',
    dialogues: [
      "The steam cleanses your groove. Or I scrub it off!",
      "Sauna discipline is the only discipline." 
    ],
    bossAbility: 'steam',
    loot: { riceGrenades: 1, pill: true }
  },
  {
    id: 'raven-grunt',
    name: 'Raven Heat Grunt',
    zoneId: 'korppi-sauna',
    x: 18,
    y: 10,
    icon: 'r',
    color: '#ffa07a',
    type: 'hostile',
    hp: 11,
    charm: 3,
    shame: 5,
    groove: 4,
    tolerance: 5,
    riceArmor: 2,
    attackName: 'throwing scalding birch',
    description: 'A sauna soldier with eucalyptus grenades.',
    dialogues: ["The löyly will flay your rhythm!"]
  },
  {
    id: 'widow-ordnance',
    name: 'Widow Ordnance',
    zoneId: 'hautajais-church',
    x: 15,
    y: 7,
    icon: 'ω',
    color: '#ffffff',
    type: 'hostile',
    hp: 10,
    charm: 4,
    shame: 6,
    groove: 3,
    tolerance: 4,
    riceArmor: 1,
    attackName: 'hurling rice wreaths',
    description: 'Veil soaked in salty tears and explosives.',
    dialogues: ["Rice is for vengeance, not weddings."]
  },
  {
    id: 'ankkel-penssi',
    name: 'Ankkel Penssi™',
    zoneId: 'hautajais-church',
    x: 24,
    y: 4,
    icon: '🦆',
    color: '#ffd500',
    type: 'boss',
    hp: 20,
    maxHp: 20,
    charm: 8,
    shame: 7,
    groove: 6,
    tolerance: 5,
    riceArmor: 4,
    attackName: 'capitalism aura',
    description: 'A duck in a suit emanating dividend smog.',
    dialogues: ["Quackonomics dictates your downfall."],
    bossAbility: 'capitalism',
    loot: { pill: true, riceGrenades: 1 }
  },
  {
    id: 'teekeri-the-tiger',
    name: 'Teekeri the Tiger',
    zoneId: 'teekeri-den',
    x: 25,
    y: 8,
    icon: '🐅',
    color: '#ffa500',
    type: 'boss',
    hp: 24,
    maxHp: 24,
    charm: 7,
    shame: 6,
    groove: 8,
    tolerance: 7,
    riceArmor: 3,
    attackName: 'hypnotic tea ceremony',
    description: 'A tiger guru swirling kombucha galaxies.',
    dialogues: [
      "Your shame will steep for three eternities.",
      "Confucius said: clap on the beat or perish." 
    ],
    bossAbility: 'hypnosis',
    loot: { pill: true, riceGrenades: 2 }
  }
];

function instantiateBlueprint(blueprint: NPCBlueprint): NPC {
  return {
    ...blueprint,
    maxHp: blueprint.maxHp ?? blueprint.hp,
    hp: blueprint.maxHp ?? blueprint.hp,
    alive: true
  };
}

export class NPCManager {
  private zoneNPCs = new Map<string, NPC[]>();

  getNPCsForZone(zoneId: string): NPC[] {
    if (!this.zoneNPCs.has(zoneId)) {
      const generated = npcBlueprints
        .filter((npc) => npc.zoneId === zoneId && npc.id !== 'ankkel-penssi')
        .map((blueprint) => instantiateBlueprint(blueprint));
      this.zoneNPCs.set(zoneId, generated);
    }

    return this.zoneNPCs.get(zoneId) ?? [];
  }

  findNPC(zoneId: string, x: number, y: number): NPC | undefined {
    return this.getNPCsForZone(zoneId).find((npc) => npc.alive && npc.x === x && npc.y === y);
  }

  reviveOrSpawnAnkkel(): NPC {
    const zoneId = 'hautajais-church';
    const zoneNPCs = this.getNPCsForZone(zoneId);
    let npc = zoneNPCs.find((candidate) => candidate.id === 'ankkel-penssi');
    if (npc) {
      npc.alive = true;
      npc.hp = npc.maxHp;
      return npc;
    }

    const blueprint = npcBlueprints.find((candidate) => candidate.id === 'ankkel-penssi');
    if (!blueprint) {
      throw new Error('Ankkel Penssi blueprint missing');
    }

    npc = instantiateBlueprint(blueprint);
    zoneNPCs.push(npc);
    return npc;
  }

  markDefeated(npc: NPC): void {
    npc.alive = false;
  }

  grantLoot(npc: NPC, award: (loot: NonNullable<NPC['loot']>) => void): void {
    if (!npc.loot) {
      return;
    }
    award(npc.loot);
  }
}
