// UHO: Fate of the Grid - Pelin käynnistin
// Lataa ja käynnistää koko UHO-pelin integroidulla järjestelmällä

import { IntegratedGame } from './game-integrated.ts';

// Lataa peli kun DOM on valmis
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Käynnistetään UHO: Fate of the Grid...');
  console.log('📍 Versio: Täysi integroitu peli + päävalikko');
  
  try {
    // Luo ja käynnistä integroitu peli (menulla)
    const game = new IntegratedGame();
    await game.start();
    
    // Tallenna globaalisti debuggausta varten
    (window as any).integratedGame = game;
    
    console.log('✅ UHO integroitu peli käynnistetty onnistuneesti!');
    console.log('');
    console.log('🎮 PÄÄVALIKKO-OHJEET:');
    console.log('   Nuolinäppäimet / WASD = Navigoi valikossa');
    console.log('   Enter = Valitse vaihtoehto');
    console.log('   ESC = Takaisin / Poistu');
    console.log('');
    console.log('🎮 PELIOHJEET (kun peli alkaa):');
    console.log('   WASD / Nuolinäppäimet = Liiku');
    console.log('   E = Vuorovaikuta');
    console.log('   F = Keskustele NPCien kanssa');
    console.log('   I = Inventaario');
    console.log('   T = Lepää');
    console.log('   ESC = Pelin valikko');
    console.log('');
    console.log('🎨 GRAFIIKKA-TESTIT (pelissä):');
    console.log('   1 = Toggle tilastot');
    console.log('   2 = Toggle Mode7-efekti');
    console.log('   3 = Toggle CRT-efekti');
    console.log('   4 = Arcade-preset');
    console.log('');
    console.log('🌍 MAAILMA:');
    console.log('   Pelaaja näkyy realistisilla sprite-grafiikoilla');
    console.log('   NPCt, rakennukset ja maasto käyttävät roguelike-assetteja');
    console.log('   Äänet ja musiikki reagoivat pelin tilanteisiin');
    console.log('');
    console.log('🎯 Aloita valitsemalla "Uusi Peli" päävalikosta!');
    
  } catch (error) {
    console.error('❌ Virhe pelin käynnistämisessä:', error);
    alert('Pelin käynnistämisessä tapahtui virhe. Tarkista konsoli lisätietoja varten.');
  }
});

// Varmista että peli sammuu kun sivu sulkeutuu
window.addEventListener('beforeunload', () => {
  const game = (window as any).integratedGame as IntegratedGame;
  if (game) {
    game.stop();
  }
});
