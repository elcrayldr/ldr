import { getName, setHighScore } from '/src/storage.js';
import { submitScore } from '/src/supabaseClient.js';

export default class GameScene extends Phaser.Scene {
  constructor(){super('GameScene');}

  // ... (mantén tu código de preload, create, update igual que el actual)

  async endRun(){
    if(this.gameOver) return;
    this.gameOver=true;
    this.physics.pause();

    const score=Math.floor(this.score);
    setHighScore(score);

    try {
      const name=getName();
      await submitScore(name,score);
      console.log('Score enviado a Supabase:', name, score);
    } catch(e) {
      console.warn('Error enviando score:', e.message);
    }

    const go=document.getElementById('go');
    const goScore=document.getElementById('goScore');
    const btnMenu=document.getElementById('goMenu');
    const btnRetry=document.getElementById('goRetry');

    if(go&&goScore&&btnMenu&&btnRetry){
      goScore.textContent=`Puntuación: ${score}`;
      go.style.display='flex';
      this.sys.game.canvas.style.pointerEvents='none';
      const change=(fn)=>{try{this.sys.game.canvas.style.pointerEvents='auto';go.style.display='none';fn();}catch{location.reload();}};
      btnMenu.onclick=()=>change(()=>this.scene.start('MenuScene'));
      btnRetry.onclick=()=>change(()=>this.scene.restart());
    } else {
      if(confirm(`Tu score: ${score}\n¿Volver al menú?`)) this.scene.start('MenuScene');
      else this.scene.restart();
    }
  }
}

