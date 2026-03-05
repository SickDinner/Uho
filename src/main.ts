import { GeniusLifeApp } from './genius-life-app.ts';

document.addEventListener('DOMContentLoaded', () => {
  const app = new GeniusLifeApp();
  app.start();

  window.addEventListener('beforeunload', () => app.stop());

  (window as any).lifeApp = app;
  console.log('🧠 Genius Life App käynnissä. NeoKylä simuloi elämää ikkunassa.');
  console.log('⌨️ Pikanäppäimet: Space = pause, F = speed, D = overlay, S = new seed, 1/2/3 = mode, R = reset.');
});
