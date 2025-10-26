function solid(scene,key,color,w,h){
  if(scene.textures.exists(key))return;
  const g=scene.make.graphics({x:0,y:0,add:false});
  g.fillStyle(color,1).fillRect(0,0,w,h);
  g.generateTexture(key,w,h); g.destroy();
}

// Balance más fácil
const PLAYER_MAX_HP = 150;         // antes 100
const IFRAME_MS     = 1200;        // antes 800 (invulnerable un poco más tras golpe)

const DMG = { obst: 8, enemyBullet: 10 };  // antes 2 y 3

const SPEED = {
  road: 220,        // antes 240
  enemy: 140,       // antes 150
  obst: 160,        // antes 170
  bullet: 520,
  enemyBullet: 300  // antes 320
};

const ENEMY_FIRE_MIN = 1600;       // antes 1300
const ENEMY_FIRE_MAX = 2200;       // antes 1800
const SPAWN_MS       = 1000;       // antes 900

const SCALE={player:2.3,enemy:2.1,obst:2.1,bullet:1.6};
const MUSIC_VOL=0.25;

export default class GameScene extends Phaser.Scene{
  constructor(){super('GameScene');}

  preload(){
    this.load.setPath('/assets/');
    ['player','police','obst','bullet','enemyBullet','line'].forEach(i=>this.load.image(i,`${i}.png`));
    this.load.audio('music','music.wav');
  }

  create(){
    const go=document.getElementById('go'); if(go) go.style.display='none';
    this.sys.game.canvas.style.pointerEvents='auto';

    // fallbacks por si falta alguna imagen
    solid(this,'player',0xff6a00,26,20);
    solid(this,'police',0x3fa9f5,26,20);
    solid(this,'obst',0xffcc00,28,18);
    solid(this,'bullet',0xffffff,4,8);
    solid(this,'enemyBullet',0xff5252,4,8);
    solid(this,'line',0xffdd00,6,56);

    this.music=this.sound.add('music',{loop:true,volume:MUSIC_VOL});
    if(!this.sound.locked)this.music.play();
    else this.sound.once(Phaser.Sound.Events.UNLOCKED,()=>this.music.play());

    const touch=document.getElementById('touch');
    if(touch){touch.style.display='block';touch.style.pointerEvents='none';
      touch.querySelectorAll('.btn').forEach(b=>b.style.pointerEvents='auto');}

    const W=this.scale.width,H=this.scale.height,CX=W/2;
    this.W=W;this.H=H;

    this.add.rectangle(CX,H/2,W,H,0x000);
    const roadW=Math.min(W*0.78,980);
    this.add.rectangle(CX,H/2,roadW,H,0x555555);
    this.road=this.add.group();
    for(let y=-80;y<H+80;y+=80)this.road.add(this.add.image(CX,y,'line'));
    this.roadSpeed=SPEED.road;

    const gap=roadW/3; this.lanes=[CX-gap,CX,CX+gap];

    this.playerLane=1;
    this.player=this.physics.add.image(this.lanes[1],H-260,'player')
      .setScale(SCALE.player).setImmovable(true);

    this.hp=PLAYER_MAX_HP; this.score=0; this.kills=0; this._noHitUntil=0; this.gameOver=false;

    const fs=Math.round(Math.max(W,H)*0.018);
    this.hScore=this.add.text(12,12,'Score: 0',{fontFamily:'Courier',fontSize:fs+'px',color:'#fff'});
    this.hHP   =this.add.text(12,12+fs,'Vida: '+PLAYER_MAX_HP,{fontFamily:'Courier',fontSize:fs+'px',color:'#f66'});

    this.obstacles=this.physics.add.group();
    this.cops=this.physics.add.group();
    this.bullets=this.physics.add.group();
    this.enemyBullets=this.physics.add.group();

    this.cursors=this.input.keyboard.createCursorKeys();
    this.keys=this.input.keyboard.addKeys('A,D,SPACE');

    const bind=(id,cb)=>{
      const el=document.getElementById(id); if(!el)return;
      const fn=(down)=>e=>{e.preventDefault();cb(down);};
      el.addEventListener('mousedown',fn(true));
      el.addEventListener('mouseup',fn(false));
      el.addEventListener('touchstart',fn(true),{passive:false});
      el.addEventListener('touchend',fn(false),{passive:false});
    };
    bind('left',v=>this._left=v);
    bind('right',v=>this._right=v);
    bind('fire',v=>{ if(v) this.shoot(); });
    this.input.keyboard.on('keydown-SPACE',()=>this.shoot());

    // Colisiones
    this.physics.add.overlap(this.player,this.obstacles,()=>this.hit(DMG.obst));
    this.physics.add.overlap(this.player,this.enemyBullets,()=>this.hit(DMG.enemyBullet));
    this.physics.add.overlap(this.bullets,this.cops,(b,e)=>{
      b.destroy(); e.health-=50; if(e.health<=0){ this.kills++; e.destroy(); }
    });

    // Spawns más relajados
    this.time.addEvent({delay:SPAWN_MS,loop:true,callback:()=>this.spawnWave()});
  }

  shoot(){
    const b=this.bullets.create(this.player.x,this.player.y-26,'bullet')
      .setScale(SCALE.bullet).setVelocityY(-SPEED.bullet);
  }

  hit(dmg){
    if(this.time.now < this._noHitUntil) return;
    this._noHitUntil = this.time.now + IFRAME_MS;
    this.hp -= dmg;
    this.player.setTintFill(0xff4444);
    this.time.delayedCall(120,()=>this.player.clearTint());
    if(this.hp <= 0) this.endRun();
  }

  spawnWave(){
    // Solo 1 a la vez, a veces obstáculo, a veces policía
    const lane=Phaser.Math.Between(0,2);
    const x=this.lanes[lane], y=-Phaser.Math.Between(70,170);
    if(Math.random()<0.55) this.spawnEnemy(x,y); else this.spawnObst(x,y);
  }

  spawnEnemy(x,y){
    const e=this.cops.create(x,y,'police').setScale(SCALE.enemy);
    e.health=100; e.setVelocityY(SPEED.enemy);

    // Dispara solo si está bien dentro de la pantalla para evitar “snipes” instantáneos
    e._fireEvt=this.time.addEvent({
      delay:Phaser.Math.Between(ENEMY_FIRE_MIN,ENEMY_FIRE_MAX), loop:true,
      callback:()=>{
        if(!e.active) return;
        if(e.y < 80 || e.y > this.H-40) return;   // evita disparo fuera de zona visible útil
        const b=this.enemyBullets.create(e.x,e.y+20,'enemyBullet').setScale(SCALE.bullet);
        b.setVelocityY(SPEED.enemyBullet);
      }
    });
    e.on('destroy',()=>{ if(e._fireEvt) e._fireEvt.remove(false); });
  }

  spawnObst(x,y){
    this.obstacles.create(x,y,'obst').setScale(SCALE.obst).setVelocityY(SPEED.obst);
  }

  update(){
    if(this.gameOver) return;

    this.score += 0.14;  // algo más lento
    this.hScore.setText('Score: '+Math.floor(this.score));
    this.hHP.setText('Vida: '+Math.max(0,Math.floor(this.hp)));

    this.road.children.each(n=>{
      n.y += this.roadSpeed/60;
      if(n.y > this.H+80) n.y -= (Math.ceil((this.H+160)/80))*80;
    });

    const L=this.cursors.left.isDown||this.keys.A.isDown||this._left;
    const R=this.cursors.right.isDown||this.keys.D.isDown||this._right;

    if(!this._cd){
      if(L && this.playerLane>0) this.playerLane--;
      else if(R && this.playerLane<2) this.playerLane++;
      this._cd=true; this.time.delayedCall(130,()=>this._cd=false);
    }
    this.player.x += (this.lanes[this.playerLane]-this.player.x)*0.5;

    this.bullets.children.each(b=>{ if(b.y<-20) b.destroy(); });
    this.enemyBullets.children.each(b=>{ if(b.y>this.H+20) b.destroy(); });
    this.cops.children.each(e=>{ if(e.y>this.H+40) e.destroy(); });
    this.obstacles.children.each(o=>{ if(o.y>this.H+40) o.destroy(); });
  }

  endRun(){
    if(this.gameOver) return; this.gameOver=true;
    this.physics.pause(); if(this.music) this.music.stop();

    const go=document.getElementById('go'), score=Math.floor(this.score);
    const goScore=document.getElementById('goScore');
    const btnMenu=document.getElementById('goMenu');
    const btnRetry=document.getElementById('goRetry');

    if(go && goScore && btnMenu && btnRetry){
      goScore.textContent=`Puntuación: ${score}`;
      go.style.display='flex';
      this.sys.game.canvas.style.pointerEvents='none';

      const change=(fn)=>{
        try{
          this.sys.game.canvas.style.pointerEvents='auto';
          go.style.display='none';
          fn();
        }catch{
          location.replace(location.pathname+'?v='+Date.now());
        }
      };

      btnMenu.replaceWith(btnMenu.cloneNode(true));
      btnRetry.replaceWith(btnRetry.cloneNode(true));
      document.getElementById('goMenu').addEventListener('click',()=>change(()=>this.scene.start('MenuScene')), { once:true });
      document.getElementById('goRetry').addEventListener('click',()=>change(()=>this.scene.restart()), { once:true });
    }else{
      // Fallback
      if(confirm(`Tu score: ${score}\n¿Volver al menú?`)) this.scene.start('MenuScene');
      else this.scene.restart();
    }
  }
}


