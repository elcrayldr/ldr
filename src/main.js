import MenuScene from '/src/scene/MenuScene.js';
import GameScene from '/src/scene/GameScene.js';

// Config base
const config = {
  type: Phaser.AUTO,
  backgroundColor: '#000',
  pixelArt: true,
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 540, height: 960 },
  scene: [MenuScene, GameScene]
};

if (window.__CRAY_GAME__) { try { window.__CRAY_GAME__.destroy(true); } catch {} }
window.__CRAY_GAME__ = new Phaser.Game(config);

window.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });




