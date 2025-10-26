import MenuScene from '/src/scene/MenuScene.js';
import GameScene from '/src/scene/GameScene.js';

const GAME_WIDTH = 540;
const GAME_HEIGHT = 960;

const config = {
  type: Phaser.AUTO,
  backgroundColor: '#000000',
  pixelArt: true,
  roundPixels: true,
  physics: { default: 'arcade', arcade: { debug: false, gravity: { y: 0 } } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: GAME_WIDTH, height: GAME_HEIGHT },
  scene: [MenuScene, GameScene]
};

// evita juegos duplicados en móviles al rehidratar
if (window.__CRAY_GAME__) {
  try { window.__CRAY_GAME__.destroy(true); } catch {}
}
window.__CRAY_GAME__ = new Phaser.Game(config);

// iOS: evita zoom por gesto
window.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });

