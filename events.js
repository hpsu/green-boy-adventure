var DeathEvent = new Class({
	Extends:Mob
	,stage:0
	,acDelta:0
	,acTimerDelta:0
	,msPerFrame: 100
	,lastUpdateTime:0
	,direction:0
	,choice:0
	,colors: [
		{bg: '#d82800', tiles: [200, 76, 12]}
		,{bg: '#c84c0c', tiles: [164, 0, 0]}
		,{bg: '#a40000', tiles: [124, 8, 0]}
		,{bg: '#7c0800', tiles: [0, 0, 0]}
		,{bg: '#000000', tiles: [0, 0, 0]}
	]
	,deathPalette: [[[188,188,188], [116,116,116], [252,252,252]]]
	,frame:0
	,initialize: function(){
		this.x = env.player.x;
		this.y = env.player.y;
		this.palettes = env.palettes;
		Array.each(rooms.getCurrentRoom().MOBs, function(mob) {
			mob.isActive=false;
		});
		env.player.isActive=false;
		this.direction=90;
		this.parent(this.x,this.y);
	}
	,draw: function() {
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		var frame = env.player.frames[this.direction].normal[0];
		switch(this.stage) {
			case 0: // Spin palette
				if(this.acTimerDelta > 1000) {
					this.acTimerDelta = 0;
					this.stage = 1;
					this.palette=0;
					$('background').setStyle('background', this.colors[0].bg);
					paintRoom([0, 168, 0], this.colors[0].tiles);
				}
				else if(this.acDelta > 50) {
					this.acDelta=0;
					if(++this.palette > env.palettes.length-1)
						this.palette=0;
				}
				break;
			case 1: // Spin player
				if(this.acTimerDelta > 2000 && this.direction == 90) {
					this.acTimerDelta = 0;
					this.stage=2;
				}
				if(this.acDelta > 100) {
					this.acDelta = 0;
					this.direction = (90+this.direction%360);
					if(this.direction == 360) this.direction=0;
				}
				break;
			case 2: // Successively tint darker tiles and bg
				if(this.acDelta > 400) {
					this.acDelta = 0;
					this.frame++;
					if(this.frame >= this.colors.length) {
						this.stage = 3;
					}
					else {
						$('background').setStyle('background', this.colors[this.frame].bg);
						paintRoom([0, 168, 0], this.colors[this.frame].tiles);
					}
				}
				break;
			case 3: // Tint player white 
				this.palette=0;
				if(this.acDelta > 2000) {
					this.stage = 4;
					frame = null;
					this.acDelta = 0;
				}
				else if(this.acDelta > 900) {
					frame = null;
				}
				else if(this.acDelta > 600) {
					frame = 121;
				}
				else if(this.acDelta > 300) {
					frame = 120;
				}
				this.palettes = this.deathPalette;
				break;
			case 4:
				if(this.acDelta > 1500) {
					this.stage=5;
				}
				frame = null;
				writeText("game over", 6*TILESIZE, 9*TILESIZE);
				break;
			case 5:
				filledRectangle(0, 0, 16*TILESIZE, 4*TILESIZE, '#000');
				frame = 22;
				
				if(this.acDelta > 250 && env.keyStates['up']) {
					if(--this.choice < 0) this.choice=2;
					this.acDelta = 0;
				}
				else if(this.acDelta > 250 && env.keyStates['down']) {
					if(++this.choice >= 3) this.choice=0;
					this.acDelta = 0;
				}
				else if(this.acDelta > 250 && env.keyStates['enter']) {
					switch(this.choice) {
					}
					continueGame();
					this.destroy();
				}
				
				
				
				writeText("continue", 5*TILESIZE, 5*TILESIZE);
				writeText("save", 5*TILESIZE, (6*TILESIZE)+HALFTILE);
				writeText("retry", 5*TILESIZE, 8*TILESIZE);
				break;
			

		}
		if(frame) {
			if(frame == 22) {
				ctx.drawImage(env.spriteSheet, (22*TILESIZE), 0, HALFTILE, HALFTILE, 4*TILESIZE, (5*TILESIZE)+(this.choice*1.5*TILESIZE), HALFTILE, HALFTILE); // Heart
			}
			else {
				placeTile(frame, this.x,this.y);
			}
		}
		this.changePalette(null, this.palettes);
		
		this.acDelta += delta;
		this.acTimerDelta += delta;
		this.lastUpdateTime = Date.now();
	}
});

var Event = new Class({
	initialize: function(room) {
		//@TODO: Freeze player movement during event
		room.tmpX = env.player.x;
		room.tmpY = env.player.y;
		room.addEvent('leave', function() {
			env.player.y = this.tmpY;
			env.player.x = this.tmpX;
			for(var i=0; i < this.MOBs.length; i++) {
				var mob = this.MOBs[i];
				this.MOBs.splice(i);
				mob.destroy();
			}
			room.removeEvents('leave');
			room.addEvent('leave',  room.onLeave);
		});
		env.player.y = (11+4-1)*TILESIZE;
		env.player.x = TILESIZE*7;
		env.player.direction=270;
		new Fire((TILESIZE*5)-HALFTILE, TILESIZE*8, room);
		new Fire((TILESIZE*10)+HALFTILE, TILESIZE*8, room);
		
		Array.each(room.tiles[4], function(tile) {
			tile.isSolid = true;
		});
	}
	,tmpX: null
	,tmpY: null
});

var SwordEvent = new Class({
	Extends: Event
	,initialize: function(room) {
		this.parent(room);
		
		if(env.player.items.sword == 0) {
			new StaticSprite((TILESIZE*7)+HALFTILE, TILESIZE*8, room, 85);
			new puSword((TILESIZE*7)+HALFTILE, (TILESIZE*10)-HALFTILE, room);
			new TextContainer(TILESIZE*3, (TILESIZE*6)+HALFTILE, room, "it's dangerous to go\n  alone! take this.");
		}
	}
});

var MoneyMakingGameEvent = new Class({
	Extends: Event
	,initialize: function(room) {
		this.parent(room);
		
		new TextContainer(TILESIZE*3.5, (TILESIZE*6)+HALFTILE, room, "let's play money\nmaking game.");
		new StaticSprite((TILESIZE*7)+HALFTILE, TILESIZE*8, room, 85);
		room.rupees = [];
		room.rupees[0] = new mmgRupee((TILESIZE*5)+HALFTILE, (TILESIZE*10)-HALFTILE, room, false, 10);
		room.rupees[1] = new mmgRupee((TILESIZE*7)+HALFTILE, (TILESIZE*10)-HALFTILE, room, false, 10);
		room.rupees[2] = new mmgRupee((TILESIZE*9)+HALFTILE, (TILESIZE*10)-HALFTILE, room, false, 10);
		room.winningRupee = Number.random(0,2);
		room.priceRupee = Number.random(0,2);
		//new TextContainer(TILESIZE*4, (TILESIZE*11), room, "x -10 -10 -10");
		
		var values = [20,50];
		var devalues = [-10, -40, -50]
		var rupeeWorth = [values[Number.random(0,values.length-1)], devalues[Number.random(0,devalues.length-1)], -10];
		
	   for (var i = 2; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var temp = rupeeWorth[i];
			rupeeWorth[i] = rupeeWorth[j];
			rupeeWorth[j] = temp;
		}
		
		room.rupees[0].worth = rupeeWorth[0];
		room.rupees[1].worth = rupeeWorth[1];
		room.rupees[2].worth = rupeeWorth[2];
		
		new mmgRupee((TILESIZE*3), (TILESIZE*11)-4, room, true);
	}
});

var PayMeAndIllTalkEvent = new Class({
	Extends: Event
	,prices: [10, 30, 50]
	,texts: [
		"this ain't enough\n     to talk."
		,"go north,west,south,\nwest to the forest\nof maze."
		,"boy, you're rich!"
	]
	,xoff: [3.5, 3, 4]
	,initialize: function(room) {
		this.parent(room);
		
		room.txtcnt = new TextContainer(TILESIZE*3, (TILESIZE*6)+HALFTILE, room, "pay me and i'll talk.");
		new StaticSprite((TILESIZE*7)+HALFTILE, TILESIZE*8, room, 103);

		room.rupees = [
			new mmgRupee((TILESIZE*5)+HALFTILE, (TILESIZE*10)-HALFTILE, room, false, this.prices[0])
			,new mmgRupee((TILESIZE*7)+HALFTILE, (TILESIZE*10)-HALFTILE, room, false, this.prices[1])
			,new mmgRupee((TILESIZE*9)+HALFTILE, (TILESIZE*10)-HALFTILE, room, false, this.prices[2])
		];
		
		
		for(var i=0; i<3; i++) {
			room.rupees[i].worth = 0;
			room.rupees[i].id = i;
			room.rupees[i].msg = this.texts[i];
			room.rupees[i].xoff = this.xoff[i];
			room.rupees[i].pickup = function(that) {
				if(that.getRupees() < this.cost) return;
				Array.each(this.currentRoom.rupees, function(o) {
					o.reveal();
				});
				that.addRupees(-this.cost);
				room.txtcnt.destroy();
				room.txtcnt = new TextContainer(TILESIZE*this.xoff, (TILESIZE*6)+HALFTILE, room, this.msg);
			};
			
		}
	}
	
});

var PayMeAndIllTalkEvent2 = new Class({
	Extends: PayMeAndIllTalkEvent
	,prices: [5, 10, 20]
	,texts: [
		"this ain't enough\n     to talk."
		,"this ain't enough\n     to talk."
		,"    go up,up,\nthe mountain ahead."

	]
	,xoff: [3.5, 3.5, 3.5]
});


var OldManGraveEvent = new Class({
	Extends: Event
	,initialize: function(room) {
		this.parent(room);
		
		new StaticSprite((TILESIZE*7)+HALFTILE, TILESIZE*8, room, 103);
		new TextContainer(TILESIZE*4, (TILESIZE*6)+HALFTILE, room, "meet the old man\n  at the grave.");
	}
});

var PotionShopEvent = new Class({
	// @TODO: Finish actual potionshop. Need to have found letter from old man and shown to the old woman
	Extends: Event
	,initialize: function(room) {
		this.parent(room);
		//new StaticSprite((TILESIZE*7)+HALFTILE, TILESIZE*8, room, 103);
		//new TextContainer(TILESIZE*4, (TILESIZE*6)+HALFTILE, room, "meet the old man\n  at the grave.");
	}
});

var LinkGainItem = new Class({
	Extends: Mob
	,shownMs: 2000
	,acDelta: 0
	,initialize: function(itemsprite, halfspritepos, quarterspritepos){
		this.itemsprite = itemsprite
		this.halfspritepos = halfspritepos
		this.quarterspritepos = quarterspritepos
		env.player.isActive=false;
		this.x = env.player.x;
		this.y = env.player.y;
		this.parent(this.x,this.y,rooms.getCurrentRoom());
	}
	,destroy: function() {
		env.player.isActive=true;
		this.parent();
	}
	,move: function() {
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		if(this.acDelta > this.shownMs) {
			this.destroy();
		}
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		placeTile(109, this.x, this.y);
		if(this.halfspritepos != undefined) {
			ctx.drawImage(env.spriteSheet, (this.itemsprite*TILESIZE)+(this.halfspritepos*HALFTILE), (this.quarterspritepos != undefined ? this.quarterspritepos : 0), HALFTILE, (this.quarterspritepos != undefined ? HALFTILE : TILESIZE), Math.floor(this.x), Math.floor(this.y-TILESIZE), HALFTILE, (this.quarterspritepos != undefined ? HALFTILE : TILESIZE));
		}
		else {
			placeTile(this.itemsprite, this.x, this.y-TILESIZE);
		}
	}
});

var TakeOneEvent = new Class({
	Extends: Event
	,initialize: function(room) {
		this.parent(room);
		
		if(room.eventDone) return;
		
		room.killSprites = function(){
			this.potion.destroy();
			this.heart.destroy();
			room.eventDone = true;
		};

		new StaticSprite((TILESIZE*7)+HALFTILE, TILESIZE*8, room, 85);
		new TextContainer(TILESIZE*2+HALFTILE, (TILESIZE*6)+HALFTILE, room, "take any one you want.");
	
		room.potion = new puRedPotion((TILESIZE*6)-4, (TILESIZE*10)-HALFTILE, room);
		room.heart = new puHeartContainer((TILESIZE*10)-4, (TILESIZE*10)-HALFTILE, room);

		room.tmpPotFunc = room.potion.pickup;
		room.potion.pickup = function(that) {
			room.tmpPotFunc.bind(this).pass(that)();
			this.currentRoom.killSprites();
		};

		room.tmpHeartFunc = room.heart.pickup;
		room.heart.pickup = function(that) {
			room.tmpHeartFunc.bind(this).pass(that)();
			this.currentRoom.killSprites();
		};

	
	}
});

var StoreEvent = new Class({
	Extends: Event
	,initialize: function(room,text) {
		this.parent(room);
		
		room.killSprites = function(){
			this.guy.destroy();
			this.txtNode.destroy();
			this.rupee.destroy();
			this.item1.destroy();
			this.item2.destroy();
			this.item3.destroy();
		};
		room.guy = new StaticSprite((TILESIZE*7)+HALFTILE, TILESIZE*8, room, 104);
		room.txtNode = new TextContainer(TILESIZE*2+HALFTILE, (TILESIZE*6)+HALFTILE, room, text ? text : "buy somethin' will ya!");
		
		room.rupee = new mmgRupee((TILESIZE*3), (TILESIZE*11)-4, room, true);
	}
});

var CandleShieldKeyStoreEvent = new Class({
	Extends: StoreEvent
	,initialize: function(room) {
		this.parent(room);
		
		room.item1 = new puShield((TILESIZE*6)-4, (TILESIZE*10)-HALFTILE, room);
		room.item2 = new puKey((TILESIZE*8)-4, (TILESIZE*10)-HALFTILE, room);
		room.item3 = new puCandle((TILESIZE*10)-4, (TILESIZE*10)-HALFTILE, room);
	}
});

var ShieldBombArrowEvent = new Class({
	Extends: StoreEvent
	,initialize: function(room) {
		this.parent(room);
		
		room.item1 = new puShield((TILESIZE*6)-4, (TILESIZE*10)-HALFTILE, room);
		room.item2 = new puBomb((TILESIZE*8)-4, (TILESIZE*10)-HALFTILE, room, 0, 4, 20);
		room.item3 = new puArrow((TILESIZE*10)-4, (TILESIZE*10)-HALFTILE, room);
		room.item1.price = 130;

		room.tmpBombFunc = room.item2.pickup;
		room.item2.pickup = function(that) {
			if(room.tmpBombFunc.bind(this).pass(that)())
				room.killSprites();
		};

	}
});

var ShieldBoneHeartStore = new Class({
	Extends: StoreEvent
	,initialize: function(room) {
		this.parent(room,"    boy, this is\n  really expensive!");
		
		room.item1 = new puShield((TILESIZE*6)-4, (TILESIZE*10)-HALFTILE, room);
		room.item1.price = 90;
		room.item2 = new puBone((TILESIZE*8)-4, (TILESIZE*10)-HALFTILE, room);
		room.item3 = new puHeart((TILESIZE*10)-4, (TILESIZE*10)-HALFTILE, room, null, 10);

		room.tmpHeartFunc = room.item3.pickup;
		room.item3.pickup = function(that) {
			if(room.tmpHeartFunc.bind(this).pass(that)()){
				room.killSprites();
				new LinkGainItem(this.sprite, 0, 0);
			}
		};

	}
});


var HeartContainerEvent515 = new Class({
	Extends: Event
	,initialize: function(room) {
		if(!room.heartContainer)
			room.heartContainer = new puHeartContainer(12*TILESIZE,9*TILESIZE,room);
	}
	
});

var LakeFairyEvent = new Class({
	Extends: Event
	,initialize: function(room) {
		if(!room.fairy) {
			room.fairy = new LakeFairy(8*TILESIZE-(HALFTILE/2),11*TILESIZE,room);
			//new LakeFairyTrigger(8*TILESIZE-(HALFTILE/2),11*TILESIZE,room)
		}
			
	}
	
});



var SecretToEverybody = new Class({
	Extends: Event
	,initialize: function(room) {
		this.parent(room);

		if(room.eventDone) return;
		room.guy = new StaticSprite((TILESIZE*7)+HALFTILE, TILESIZE*8, room, 92);
		room.txtNode = new TextContainer(TILESIZE*4+HALFTILE, (TILESIZE*6)+HALFTILE, room, "it's a secret\nto everybody.");
		
		room.rupees = [new mmgRupee((TILESIZE*8)-HALFTILE, (TILESIZE*10)-HALFTILE, room, false, 0)];
		room.rupees[0].worth=30;
	
		room.tmpRupeeFunc = room.rupees[0].pickup;
		room.rupees[0].pickup = function(that) {
			room.tmpRupeeFunc.bind(this).pass(that)();
			room.eventDone=true;
		};
	
	}
});

var DoorRepairEvent = new Class({
	Extends: Event
	,initialize: function(room) {
		this.parent(room);
		if(room.eventDone) return;

		room.guy = new StaticSprite((TILESIZE*7)+HALFTILE, TILESIZE*8, room, 85);
		room.txtNode = new TextContainer(TILESIZE*3, (TILESIZE*6)+HALFTILE, room, "pay me for the door\n   repair charge.");
		
		env.player.addRupees(-20);
		room.eventDone=true;
		//@TODO: Animate countdown of rupees
	}
});

var WhiteSwordEvent = new Class({
	Extends: Event
	,initialize: function(room) {
		this.parent(room);
		if(room.eventDone) return;

		room.guy = new StaticSprite((TILESIZE*7)+HALFTILE, TILESIZE*8, room, 85);
		room.txtNode = new TextContainer(TILESIZE*3, (TILESIZE*6)+HALFTILE, room, "master using it and\n you can have this.");

		room.whiteSword = new puWhiteSword(TILESIZE*7.5, TILESIZE*9.5, room);
		room.whiteSword.pickup = function(that){
			if(that.items.hearts < 5)
				return;
			that.items.sword=2;
			this.destroy();
			room.guy.destroy();
			room.txtNode.destroy();
			new LinkGainItem(this.sprite);
			room.eventDone=true;
		};
		
	}
});

var TextContainer = new Class({
	Extends: Mob
	,msPerFrame: 80
	,initialize: function(x, y, room, text) {
		this.parent(x,y,room)
		this.x = x;
		this.y = y;
		this.animFrame=0;
		this.text = text;
	}
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(["\n"," "].contains(this.text[this.animFrame])) this.animFrame++;
			if(++this.animFrame > this.text.length) this.animFrame = this.text.length;
		}
		writeText(this.text.substr(0,this.animFrame), this.x, this.y);
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

var Fire = new Class({
	Extends: Mob
	,flip: 0
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			this.flip = this.flip ? 0 : 1;
		}
		var rotation = this.flip ? 0.5 : null;
		placeTile(84, this.x, this.y, null, null, null, (this.flip ? 'x' : null));
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

var StaticSprite = new Class({
	Extends: Mob
	,initialize: function(x,y,room,sprite) {
		this.sprite = sprite;
		this.parent(x,y,room);
	}
	,draw: function() {
		placeTile(this.sprite, this.x, this.y);
	}
});

var EnemyDeath = new Class({
	Extends: Mob
	,acDelta: 0
	,lastUpdateTime: 0
	,animFrame: 0
	,msPerFrame: 30
	,frames: [120, 120, 120, 121, 121, 121, 120, 120, 120, 120]
	,palette: 0
	,changePalette: function() {
		if(this.palette > 0) {
			map = ctx.getImageData(this.x, this.y, TILESIZE, TILESIZE);
			imdata = map.data;
			for(var p = 0, len = imdata.length; p < len; p+=4) {
				r = imdata[p]
				g = imdata[p+1];
				b = imdata[p+2];
				Array.each([1,2], function(i){
					j = i;
					if(r == env.palettes[0][i][0] && g == env.palettes[0][i][1] && b == env.palettes[0][i][2]) {
						if(i == 1) j = 2;
						if(i == 2) j = 1;
						imdata[p] = env.palettes[this.palette][j][0];
						imdata[p+1] = env.palettes[this.palette][j][1];
						imdata[p+2] = env.palettes[this.palette][j][2];
					}
				},this);
			}
			ctx.putImageData(map, this.x, this.y);
		}
	}
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;
	
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(typeof this.frames[++this.animFrame] == 'undefined') {
				this.destroy();
				if(Number.random(1,5) == 5) {
					if(Number.random(1,10) == 5)
						new puFairy(this.x, this.y);
					else if(Number.random(1,5) == 5)
						new puBomb(this.x, this.y);
					else if(Number.random(1,5) == 5)
						new puMidRupee(this.x, this.y);
					else if(env.player.health < env.player.items.hearts && Number.random(1,2) == 2)
						new puHeart(this.x, this.y);
					else 
						new puRupee(this.x, this.y);
				}
			}
			if(++this.palette > env.palettes.length-1)
				this.palette=0;
		}

		placeTile(this.frames[this.animFrame-1], this.x, this.y, null, null);
		this.changePalette();

		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

var d1r7_6 = new Class({
	initialize: function(room) {
		// spawn key when all mobs are destroyed
		Array.each(room.MOBs, function(mob){
			if(mob.name != 'Keese' || mob.tmpFunc) return;
			mob.tmpFunc = mob.destroy;
			mob.destroy = function() {
				this.tmpFunc();
				var keeseCnt = 0;
				Array.each(room.MOBs, function(mab) {
					if(mab.name == 'Keese')
						keeseCnt++;
				});
				if(keeseCnt == 0) {
					new puKey(10*TILESIZE,12*TILESIZE,room,0);
				}
			};
			
		}, this);
	}
	
});

var d1r7_8 = new Class({
	initialize: function(room) {
		// spawn key on one staflos and make it follow him
		if(!room.keystaflos) {
			console.log('creating keystaflos');
			room.keystaflos = new KeyStaflos(null,null,room);
		}
	}
});

var d1r5_6 = new Class({
	initialize: function(room) {
		room.doorOpened = false;
		
		room.tiles[5][14].sprite=295;
		
		room.tiles[1][7].touch = room.tiles[1][8].touch = function() {
			if(env.player.items.keys < 1 || room.doorOpened) return;
			room.tiles[1][7].sprite=291;
			room.tiles[1][8].sprite=292;
			room.tiles[1][7].isSolid = false;
			room.tiles[1][8].isSolid = false;
			env.player.addKeys(-1);
			room.doorOpened = true;
			paintRoom();
		};
	}
});

var DungeonBombHole = new Class({
	Extends: Mob
	,sprite: 297
	
});
var d1r5_7 = new Class({
	initialize: function(room) {
		// spawn key when all mobs are destroyed
		new DungeonBombHole(7.5*TILESIZE, 5*TILESIZE,room);
		Array.each(room.MOBs, function(mob){
			mob.tmpFunc = mob.destroy;
			mob.destroy = function() {
				this.tmpFunc();
				var staflosCnt = 0;
				Array.each(room.MOBs, function(mab) {
					if(mab.name == 'Staflos')
						staflosCnt++;
				});
				if(staflosCnt == 0) {
					new puKey(8*TILESIZE,7*TILESIZE,room,0);
				}
			};
			
		}, this);
	}
});
var d1r5_8 = new Class({
	initialize: function(room) {
		new puCompass(12*TILESIZE, 9*TILESIZE,room);
	}
});

var d1r7_7 = new Class({
	initialize: function(room) {
		room.doorOpened = false;
		room.tiles[1][7].touch = room.tiles[1][8].touch = function() {
			if(env.player.items.keys < 1 || room.doorOpened) return;
			room.tiles[1][7].sprite=291;
			room.tiles[1][8].sprite=292;
			room.tiles[1][7].isSolid = false;
			room.tiles[1][8].isSolid = false;
			env.player.addKeys(-1);
			room.doorOpened = true;
			paintRoom();
		};
	}	
});
