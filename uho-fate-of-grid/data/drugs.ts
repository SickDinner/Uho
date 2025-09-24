import type { Drug } from '@core/types.ts';

// Finnish drug data with fictional, abstract effects
export const DRUGS: Drug[] = [
  {
    id: 'alkoholi',
    name: 'Alkoholi',
    desc: 'Vahva viina. Nostaa rohkeutta, heikentää havainnointikykyä.',
    effects: {
      charisma: 2,
      perception: -2,
      reflex: -1,
      stress: 1,
      thirst: -10,
      pain: -2
    },
    risk: {
      tolerance: 0.02,
      addiction: 0.01,
      overdose: 0.005
    },
    duration: 12,
    withdrawal: {
      charisma: -1,
      willpower: -2,
      stress: -3,
      pain: 2,
      sleep: -5
    }
  },
  {
    id: 'kannabis',
    name: 'Kannabis',
    desc: 'Rauhoittava kasvi. Vähentää stressiä ja kipua.',
    effects: {
      stress: 3,
      pain: -3,
      hunger: -15,
      perception: -1,
      reflex: -1
    },
    risk: {
      tolerance: 0.015,
      addiction: 0.005,
      overdose: 0.001
    },
    duration: 8,
    withdrawal: {
      stress: -2,
      sleep: -3,
      hunger: 5
    }
  },
  {
    id: 'amfetamiini',
    name: 'Amfetamiini',
    desc: 'Piristävä aine. Lisää energiaa ja valppautta.',
    effects: {
      agility: 3,
      perception: 2,
      endurance: 2,
      sleep: -20,
      hunger: -10,
      thirst: -5
    },
    risk: {
      tolerance: 0.03,
      addiction: 0.02,
      overdose: 0.01
    },
    duration: 6,
    withdrawal: {
      agility: -2,
      endurance: -3,
      sleep: 10,
      hunger: 10
    }
  },
  {
    id: 'opioidi',
    name: 'Opioidi',
    desc: 'Voimakas kipulääke. Poistaa kipua tehokkaasti.',
    effects: {
      pain: -8,
      stress: 2,
      perception: -2,
      reflex: -2
    },
    risk: {
      tolerance: 0.04,
      addiction: 0.03,
      overdose: 0.015
    },
    duration: 4,
    withdrawal: {
      pain: 8,
      stress: -4,
      agility: -2,
      sleep: -5
    }
  },
  {
    id: 'bentsodiatsepiini',
    name: 'Bentsodiatsepiini',
    desc: 'Rauhoittava lääke. Vähentää ahdistusta.',
    effects: {
      stress: 4,
      willpower: -1,
      reflex: -2,
      sleep: 5
    },
    risk: {
      tolerance: 0.025,
      addiction: 0.015,
      overdose: 0.008
    },
    duration: 10,
    withdrawal: {
      stress: -5,
      willpower: -3,
      sleep: -8
    }
  },
  {
    id: 'lsd',
    name: 'LSD',
    desc: 'Psykedeelinen aine. Vaikuttaa havainnointiin.',
    effects: {
      perception: -3,
      intelligence: 2,
      cunning: 1,
      stress: -2
    },
    risk: {
      tolerance: 0.01,
      addiction: 0.002,
      overdose: 0.003
    },
    duration: 15,
    withdrawal: {
      perception: 1,
      stress: 2
    }
  },
  {
    id: 'psilosybiini',
    name: 'Psilosybiini',
    desc: 'Sienet. Muuttaa ajattelua ja näkemystä.',
    effects: {
      perception: -2,
      intelligence: 1,
      social: 2,
      stress: -1
    },
    risk: {
      tolerance: 0.008,
      addiction: 0.001,
      overdose: 0.002
    },
    duration: 12,
    withdrawal: {
      social: -1,
      stress: 1
    }
  },
  {
    id: 'nikotiini',
    name: 'Nikotiini',
    desc: 'Tupakka. Lyhytaikainen piristys.',
    effects: {
      stress: 1,
      perception: 1,
      reflex: 1
    },
    risk: {
      tolerance: 0.01,
      addiction: 0.008,
      overdose: 0.001
    },
    duration: 2,
    withdrawal: {
      stress: -2,
      perception: -1,
      reflex: -1
    }
  },
  {
    id: 'kofeiini',
    name: 'Kofeiini',
    desc: 'Kahvi tai energiajuoma. Pitää vireänä.',
    effects: {
      agility: 1,
      perception: 1,
      sleep: -5
    },
    risk: {
      tolerance: 0.005,
      addiction: 0.003,
      overdose: 0.002
    },
    duration: 4,
    withdrawal: {
      agility: -1,
      perception: -1,
      sleep: 3
    }
  }
];

export function getDrug(id: string): Drug | undefined {
  return DRUGS.find(drug => drug.id === id);
}

export function getAllDrugs(): Drug[] {
  return [...DRUGS];
}