function solid(scene,key,color,w,h){
  if(scene.textures.exists(key)) return;
  const g=scene.make.graphics({x:0,y:0,add:false});
  g.fillStyle(color,1).fillRect(0,0,w,h);
  g.generateTexture(key,w,h);
  g.destroy();
}

// Ajustes
const ROAD_SPEED=240, PLAYER_Y_FROM_BOTTOM=260;
const SCALE_PLAYER=2.3, SCALE_ENEMY=2.1, SCALE_OBST=2.1, SCALE_BULLET=1.6;
const DMG_OBSTACLE=2, DMG_ENEMY_BULLET=3, IFRAME_MS=800;
const ENEMY_SPEED=150, OBST_SPEED=170, BULLET_SPEED=520, ENEMY_BULLET_SPEED=320;
const SPAWN_EVERY_MS=900, ENEMY_FIRE_MIN=1300, ENEMY_FIRE_MAX=1800;
const MUSIC_VOLUME=0.25;

export default class GameScene extends Phaser.Scene{
  constructor(){ super({key:'GameScene'}); }

  preload(){
    this.load.setPath('/assets/'); // ruta absoluta para producción
    this.load.image('player','player.png');
    this.load.image('police','police.png');
    this.load.image('obst','obst.png');
    this.load.image('bullet','bullet.png');
    this.load.image('enemyBullet','enemyBullet.png');
    this.load.image('line','line.png');
    this.load.audio('music','music.wav');
  }

  create(){
    // Oculta overlay de GO si quedó abierto y habilita canvas
    const go=document.getElementById('go'); if(go) go.style.display='none';
    this.sys.game.canvas.style.pointerEvents='auto';

    // Fallbacks (por si falta algún PNG)
    solid(this,'player',0xff6a00,26,20);
    solid(this,'police',0x3fa9f5,26,20);
    solid(this,'obst',0xffcc00,28,18);
    solid(this,'bullet',0xffffff,4,8);
    solid(this,'enemyBullet',0xff5252,4,8);
    solid(this,'line',0xffdd00,6,56);

    // Música en bucle
    this.music=this.sound.add('music',{loop:true,volume:MUSIC_VOLUME});
    if(!this.sound.locked) this.music.play();
    else this.sound.once(Phaser.Sound.Events.UNLOCKED,()=>this.music.play());

    // Controles HTML visibles en juego
    const touch=document.getElementById('touch');
    if(touch){
      touch.style.display='block';
      touch.style.pointerEvents='none';
      touch.querySelectorAll('.btn').forEach(b=>b.style.pointerEvents='auto');
    }

    // Dimensiones / carretera
    const W=this.scale.width,H=this.scale.height,CX=W/2;
    this.W=W; this.H=H; this.CX=CX;

    this.add.rectangle(CX,H/2,W,H,0x000000);
    const roadW=Math.min(W*0.78,980);
    this.add.rectangle(CX,H/2,roadW,H,0x555555).setDepth(0);
    this.road=this.add.group();
    for(let y=-80;y<H+80;y+=80) this.road.add(this.add.image(CX,y,'line').setDepth(1));
    this.roadSpeed=ROAD_SPEED;

    const gap=roadW/3;
    this.lanes=[CX-gap,CX,CX+gap];

    // Jugador
    this.playerLane=1;
    this.player=this.physics.add.image(this.lanes[1],H-PLAYER_Y_FROM_BOTTOM,'player')
      .setDepth(10).setScale(SCALE_PLAYER).setImmovable(true);
    this.player.body.setSize(this.player.width,this.player.height,true);

    // Estado / HUD
    this.hp=100; this.score=0; this.kills=0; this._noHitUntil=0; this.gameOver=false;
    const fs=Math.round(Math.max(W,H)*0.018);
    this.hScore=this.add.text(12,12,'Score: 0',{fontFamily:'Courier',fontSize:fs+'px',color:'#fff'}).setDepth(99);
    this.hKills=this.add.text(12,12+fs,'Kills: 0',{fontFamily:'Courier',fontSize:fs+'px',color:'#fff'}).setDepth(99);
    this.hHP   =this.add.text(12,12+fs*3,'Vida: 100',{fontFamily:'Courier',fontSize:fs+'px',color:'#ff6666'}).setDepth(99);

    // Grupos
    this.obstacles=this.physics.add.group();
    this.cops=this.physics.add.group();
    this.bullets=this.physics.add.group();
    this.enemyBullets=this.physics.add.group();

    // Controles
    this.cursors=this.input.keyboard.createCursorKeys();
    this.keys=this.input.keyboard.addKeys('A,D,SPACE');
    const bind=(id,cb)=>{
      const el=document.getElementById(id); if(!el) return;
      const down=e=>{e.preventDefault();cb(true);};
      const up=e=>{e.preventDefault();cb(false);};
      el.addEventListener('touchstart',down,{passive:false});
      el.addEventListener('touchend',up,{passive:false});
      el.addEventListener('mousedown',down);
      el.addEventListener('mouseup',up);
    };
    bind('left',v=>this._left=v);
    bind('right',v=>this._right=v);
    bind('fire',v=>{ if(v) this.shoot(); });
    this.input.keyboard.on('keydown-SPACE',()=>this.shoot());

    // Colisiones
    this.physics.add.overlap(this.player,this.obstacles,()=>this.hit(DMG_OBSTACLE));
    this.physics.add.overlap(this.player,this.enemyBullets,()=>this.hit(DMG_ENEMY_BULLET));
    this.physics.add.overlap(this.bullets,this.cops,(b,e)=>{ b.destroy(); e.health-=50; if(e.health<=0){ this.kills++; e.destroy(); }});

    // Spawns
    this.spawnTimer=this.time.addEvent({delay:SPAWN_EVERY_MS,loop:true,callback:()=>this.spawnWave()});
    for(let i=0;i<2;i++) this.spawnWave();

    this.events.once('shutdown',()=>this._cleanup());
    this.events.once('destroy', ()=>this._cleanup());
    this.last=this.time.now;
  }

  _cleanup(){
    if(this.music){ this.music.stop(); this.music.destroy(); this.music=null; }
    if(this.spawnTimer){ this.spawnTimer.remove(false); this.spawnTimer=null; }
    this.cops.clear(true,true); this.obstacles.clear(true,true);
    this.bullets.clear(true,true); this.enemyBullets.clear(true,true);
    const go=document.getElementById('go'); if(go) go.style.display='none';
    this.sys.game.canvas.style.pointerEvents='auto';
  }

  shoot(){
    const b=this.bullets.create(this.player.x,this.player.y-26,'bullet')
      .setDepth(8).setScale(SCALE_BULLET);
    b.body.setSize(b.width,b.height,true);
    b.setVelocityY(-BULLET_SPEED);
  }

  hit(d){
    if(this.time.now<this._noHitUntil) return;
    this._noHitUntil=this.time.now+IFRAME_MS;
    this.hp-=d;
    this.player.setTintFill(0xff4444);
    this.time.delayedCall(120,()=>this.player.clearTint());
    if(this.hp<=0 && !this.gameOver) this.endRun();
  }

  _spawnEnemy(x,y){
    const e=this.cops.create(x,y,'police').setDepth(6).setScale(SCALE_ENEMY);
    e.health=100; e.setVelocityY(ENEMY_SPEED);
    e.body.setSize(e.width,e.height,true);
    e._fireEvt=this.time.addEvent({
      delay:Phaser.Math.Between(ENEMY_FIRE_MIN,ENEMY_FIRE_MAX),loop:true,
      callback:()=>{
        if(!e.active||e.y<40||e.y>this.H) return;
        const eb=this.enemyBullets.create(e.x,e.y+20,'enemyBullet').setScale(SCALE_BULLET);
        eb.body.setSize(eb.width,eb.height,true);
        eb.setVelocityY(ENEMY_BULLET_SPEED);
      }
    });
    e.on('destroy',()=>{ if(e._fireEvt) e._fireEvt.remove(false); });
  }

  _spawnObst(x,y){
    const o=this.obstacles.create(x,y,'obst').setDepth(5).setScale(SCALE_OBST);
    o.setVelocityY(OBST_SPEED);
    o.body.setSize(o.width,o.height,true);
  }

  spawnWave(){
    const n=Phaser.Math.Between(1,2);
    for(let i=0;i<n;i++){
      const lane=Phaser.Math.Between(0,2);
      const x=this.lanes[lane], y=-Phaser.Math.Between(60,160);
      if(Math.random()<0.6) this._spawnEnemy(x,y); else this._spawnObst(x,y);
    }
  }

  update(){
    if(this.gameOver) return;
    const now=this.time.now,dt=(now-(this.last||now))/1000; this.last=now;

    this.score+=dt*10;
    this.hScore.setText('Score: '+Math.floor(this.score));
    this.hKills.setText('Kills: '+this.kills);
    this.hHP.setText('Vida: '+Math.max(0,Math.floor(this.hp)));

    this.road.getChildren().forEach(n=>{
      n.y+=this.roadSpeed*dt;
      if(n.y>this.H+80) n.y-=(Math.ceil((this.H+160)/80))*80;
    });

    const L=this.cursors.left.isDown||this.keys.A.isDown||this._left;
    const R=this.cursors.right.isDown||this.keys.D.isDown||this._right;
    if(!this._moveCooldown){
      if(L&&this.playerLane>0){ this.playerLane--; this._moveCooldown=1; }
      else if(R&&this.playerLane<2){ this.playerLane++; this._moveCooldown=1; }
      if(this._moveCooldown) this.time.delayedCall(140,()=>this._moveCooldown=0);
    }
    this.player.x+=(this.lanes[this.playerLane]-this.player.x)*0.5;

    this.cops.children.each(e=>{ if(e.y>this.H+40) e.destroy(); });
    this.obstacles.children.each(o=>{ if(o.y>this.H+40) o.destroy(); });
    this.bullets.children.each(b=>{ if(b.y<-20) b.destroy(); });
    this.enemyBullets.children.each(b=>{ if(b.y>this.H+20) b.destroy(); });
  }

  // === GAME OVER con overlay HTML + recarga de seguridad ===
  endRun(){
    if (this.gameOver) return;
    this.gameOver = true;

    this.physics.pause();
    this.player.setTint(0x550000);
    if(this.music) this.music.stop();

    const touch=document.getElementById('touch');
    if(touch) touch.style.display='none';

    const go=document.getElementById('go');
    const goScore=document.getElementById('goScore');
    const btnMenu=document.getElementById('goMenu');
    const btnRetry=document.getElementById('goRetry');

    if(!go||!goScore||!btnMenu||!btnRetry){
      const score=Math.floor(this.score);
      this.time.delayedCall(300,()=>{
        if(confirm(`Tu score: ${score}\n¿Volver al menú?`)) this.scene.start('MenuScene');
        else this.scene.restart();
      });
      return;
    }

    goScore.textContent=`Puntuación: ${Math.floor(this.score)}`;
    go.style.display='flex';
    this.sys.game.canvas.style.pointerEvents='none';

    const safeSceneChange=(fn)=>{
      const tryOnce=()=>{
        try{
          this.sys.game.canvas.style.pointerEvents='auto';
          go.style.display='none';
          this._cleanup();
          fn();
        }catch(e){
          requestAnimationFrame(()=>{
            try{ fn(); }
            catch(e2){
              setTimeout(()=>location.replace(location.pathname+'?v='+Date.now()),100);
            }
          });
        }
      };
      tryOnce(); setTimeout(tryOnce,60);
    };

    // elimina listeners previos y añade nuevos una sola vez
    btnMenu.replaceWith(btnMenu.cloneNode(true));
    btnRetry.replaceWith(btnRetry.cloneNode(true));
    const m=document.getElementById('goMenu');
    const r=document.getElementById('goRetry');
    m.addEventListener('click',ev=>{ev.preventDefault();safeSceneChange(()=>this.scene.start('MenuScene'));},{once:true});
    r.addEventListener('click',ev=>{ev.preventDefault();safeSceneChange(()=>this.scene.restart());},{once:true});

    // respaldo: zonas gigantes (izquierda = menú, derecha = reintentar)
    const leftZ=this.add.zone(this.W*0.25,this.H*0.5,this.W*0.5,this.H*0.9).setOrigin(0.5).setDepth(9999).setInteractive();
    const rightZ=this.add.zone(this.W*0.75,this.H*0.5,this.W*0.5,this.H*0.9).setOrigin(0.5).setDepth(9999).setInteractive();
    leftZ.once('pointerdown',()=>safeSceneChange(()=>this.scene.start('MenuScene')));
    rightZ.once('pointerdown',()=>safeSceneChange(()=>this.scene.restart()));

    // teclado (PC)
    this.input.keyboard.once('keydown-ESC',()=>safeSceneChange(()=>this.scene.start('MenuScene')));
    this.input.keyboard.once('keydown-ENTER',()=>safeSceneChange(()=>this.scene.restart()));
    this.input.keyboard.once('keydown-SPACE',()=>safeSceneChange(()=>this.scene.restart()));
  }
}
