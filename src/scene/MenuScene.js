import { getName, setName, getHighScore } from '/src/storage.js';
import { fetchTop } from '/src/supabaseClient.js';

export default class MenuScene extends Phaser.Scene {
  constructor(){ super('MenuScene'); }

  async create(){
    const touch=document.getElementById('touch'); if(touch) touch.style.display='none';
    const go=document.getElementById('go'); if(go) go.style.display='none';
    this.sys.game.canvas.style.pointerEvents='auto';

    const W=this.scale.width, H=this.scale.height, CX=W/2;
    this.add.rectangle(CX,H/2,W,H,0x000000);

    this.add.text(CX,H*0.22,'CRAY LDR – GTA Las Viñas',{
      fontFamily:'Courier',fontStyle:'bold',fontSize:Math.round(W*0.06)+'px',color:'#ffcc00'
    }).setOrigin(0.5);
    this.add.text(CX,H*0.29,'by La Zeta Music',{
      fontFamily:'Courier',fontSize:Math.round(W*0.03)+'px',color:'#bbb'
    }).setOrigin(0.5);

    const name=getName(), hi=getHighScore();
    const info=this.add.text(CX,H*0.37,`Jugador: ${name}\nRécord: ${hi}`,{
      fontFamily:'Courier',fontSize:Math.round(W*0.033)+'px',color:'#ffee99',align:'center'
    }).setOrigin(0.5);

    const makeBigButton=(y,label,cb)=>{
      const f=Math.round(W*0.05);
      const btnW=Math.max(W*0.72, 280);
      const btnH=Math.max(f+28, 64);

      const bg=this.add.rectangle(CX,y,btnW,btnH,0xffffff,1)
        .setStrokeStyle(2,0x222222,0.3)
        .setInteractive({ useHandCursor:true });

      const t=this.add.text(CX,y,label,{
        fontFamily:'Courier',fontStyle:'bold',fontSize:f+'px',color:'#000'
      }).setOrigin(0.5);

      let armed=false;
      bg.on('pointerdown', ()=> armed=true);
      bg.on('pointerup',   ()=> { if(armed) cb(); armed=false; });
      bg.on('pointerout',  ()=> { armed=false; });
      return { bg, t };
    };

    makeBigButton(H*0.52,'▶ JUGAR', ()=> this.scene.start('GameScene'));

    makeBigButton(H*0.64,'👤 CAMBIAR NOMBRE', ()=>{
      const n=prompt('Tu nombre:', getName());
      if(n){ setName(n); info.setText(`Jugador: ${n}\nRécord: ${getHighScore()}`); this.renderTop(); }
    });

    // Caja de leaderboard
    const boxW = Math.max(W*0.78, 300);
    const boxH = Math.max(H*0.22, 170);
    const boxY = H*0.80;
    const boardBG = this.add.rectangle(CX, boxY, boxW, boxH, 0x111111, 0.65)
      .setStrokeStyle(2, 0xffffff, 0.15);
    this.add.text(CX, boxY - boxH/2 + 22, '🏆 TOP 10 GLOBAL', {
      fontFamily:'Courier', fontStyle:'bold', fontSize:Math.round(W*0.04)+'px', color:'#fff'
    }).setOrigin(0.5);

    this.topText = this.add.text(CX, boxY, 'Cargando...', {
      fontFamily:'Courier', fontSize:Math.round(W*0.032)+'px', color:'#ddd', align:'center'
    }).setOrigin(0.5);

    const { bg:refreshBtn } = makeBigButton(boxY + boxH/2 - 28, '↻ ACTUALIZAR', ()=> this.renderTop());
    refreshBtn.setFillStyle(0xeeeeee, 1);

    // Primera carga de Top 10
    await this.renderTop();
  }

  async renderTop(){
    try{
      const rows = await fetchTop(10);
      if (!rows || !rows.length) {
        this.topText.setText('Sin puntuaciones aún. ¡Sé el primero!');
        return;
      }
      const lines = rows.map((r,i)=> {
        const n = (r.name || 'Anon').toString().slice(0, 12);
        const s = r.score ?? 0;
        return `${String(i+1).padStart(2,'0')}. ${n.padEnd(12,' ')}  ${s}`;
      });
      this.topText.setText(lines.join('\n'));
    }catch(e){
      this.topText.setText('No se pudo cargar el ranking.\nPulsa “↻ ACTUALIZAR”.');
      console.error('fetchTop error', e);
    }
  }
}
