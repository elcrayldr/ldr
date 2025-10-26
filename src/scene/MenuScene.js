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

    const makeBtn=(y,label,cb)=>{
      const f=Math.round(W*0.05), w=Math.max(W*0.72,280), h=Math.max(f+28,64);
      const bg=this.add.rectangle(CX,y,w,h,0xffffff,1).setStrokeStyle(2,0x222222,0.3)
        .setInteractive({useHandCursor:true});
      const t=this.add.text(CX,y,label,{fontFamily:'Courier',fontStyle:'bold',fontSize:f+'px',color:'#000'}).setOrigin(0.5);
      let armed=false;
      bg.on('pointerdown',()=>armed=true);
      bg.on('pointerup',()=>{if(armed)cb();armed=false;});
      bg.on('pointerout',()=>armed=false);
      return bg;
    };

    makeBtn(H*0.52,'▶ JUGAR',()=>this.scene.start('GameScene'));
    makeBtn(H*0.64,'👤 CAMBIAR NOMBRE',()=>{
      const n=prompt('Tu nombre:', name);
      if(n){ setName(n); info.setText(`Jugador: ${n}\nRécord: ${hi}`); this.renderTop(); }
    });

    const boxY=H*0.8;
    this.topText=this.add.text(CX,boxY,'Cargando ranking...',{
      fontFamily:'Courier',fontSize:Math.round(W*0.032)+'px',color:'#ddd',align:'center'
    }).setOrigin(0.5);

    try { await this.renderTop(); } catch(e){ console.warn('Leaderboard error', e); }
  }

  async renderTop(){
    const data=await fetchTop(10);
    if(!data.length){ this.topText.setText('Sin puntuaciones aún.'); return; }
    const lines=data.map((r,i)=>`${String(i+1).padStart(2,'0')}. ${(r.name||'Anon').slice(0,10)}  ${r.score}`);
    this.topText.setText(lines.join('\n'));
  }
}

