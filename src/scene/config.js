// Ajustes de juego
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;
export const LANES = [320, 480, 640]; // 3 carriles
export const ROAD_SPEED = 220;
export const BASE_SPAWN_MS = 1050;
export const PLAYER_MOVE_DELAY_MS = 120;
export const PLAYER_BULLET_SPEED = 760;
export const ENEMY_BULLET_SPEED = 520;
export const PLAYER_MAX_HP = 100;
export const DMG_OBSTACLE = 15;
export const DMG_BULLET   = 10;
export const IFRAME_MS    = 500;
export const PLAYER_FIRE_DELAY = 150;
export const ENEMY_FIRE_BASE_MS = 1100;
export const ENEMY_FIRE_MIN_MS  = 350;
export const SCORE_PER_KILL = 10;
export const SCORE_PER_SECOND = 1;

export function starsFromKills(k){
  if(k < 10) return 0;
  if(k < 25) return 1;
  if(k < 50) return 2;
  if(k < 100) return 3;
  if(k < 200) return 4;
  return 5;
}
export function spawnInterval(base,kills,stars){
  const factor = Math.max(0.35, 1 - stars*0.12 - Math.log(1 + kills)*0.03);
  return base * factor;
}
export function downSpeed(stars,kills){
  return 240 * (1 + stars*0.10 + kills/200);
}
export function enemyFireMs(stars){
  return Math.max(ENEMY_FIRE_MIN_MS, ENEMY_FIRE_BASE_MS - stars*120);
}
