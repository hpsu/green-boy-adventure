var DeathEvent = new Class({
	Extends:Mob
	,stage:0
	,acDelta:0
	,acTimerDelta:0
	,msPerFrame: 30
	,lastUpdateTime:0
	,direction:0
	,choice:0
	,palette: 0
	,sprite:'Link'
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
		this.palettes = env.palettes['main'];
		Array.each(rooms.getCurrentRoom().MOBs, function(mob) {
			mob.isActive=false;
		});
		env.player.isActive=false;
		this.direction=90;
		this.parent(this.x,this.y);
	}
	,move: function() {
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		var frame = 'Link';
		switch(this.stage) {
			case 0: // Spin palette
				if(this.acTimerDelta > 1000) {
					this.acTimerDelta = 0;
					this.stage = 1;
					this.palette = 0;
					this.background = this.colors[0].bg;
					paintRoom([0, 168, 0], this.colors[0].tiles);
				}
				else if(this.acDelta > 50) {
					this.acDelta=0;
					if(++this.palette > env.palettes['main'].length-1)
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
					this.direction = (90+this.direction)%360;
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
						this.background = this.colors[this.frame].bg;
						paintRoom([0, 168, 0], this.colors[this.frame].tiles);
					}
				}
				break;
			case 3: // Tint player white 
				this.palette=0;
				if(this.acDelta > 2000) {
					this.stage = 4;
					this.acDelta = 0;
				}
				else if(this.acDelta > 900) {
					this.sprite = null;
				}
				else if(this.acDelta > 600) {
					this.animFrame = 1;
				}
				else if(this.acDelta > 300) {
					this.sprite='Death';
					this.animFrame = 0;
				}
				this.palettes = this.deathPalette;
				break;
			case 4:
				if(this.acDelta > 1500) {
					this.stage=5;
				}
				break;
			case 5:
				frame = 22;
				this.sprite = 'FullHeart';
				
				if(env.keyStates['up']) {
					if(--this.choice < 0) this.choice=2;
					this.acDelta = 0;
					env.keyStates['up'] = false;
				}
				else if(env.keyStates['down']) {
					if(++this.choice >= 3) this.choice=0;
					this.acDelta = 0;
					env.keyStates['down'] = false;
				}
				else if(env.keyStates['enter']) {
					env.keyStates['enter'] = false;

					switch(this.choice) {
					}
					continueGame();
					this.destroy();
				}
				this.x = 4*SPRITESIZE;
				this.y = (5+this.choice*1.5)*SPRITESIZE;
				this.direction = 0;
				this.palette = 2;
				break;
		}
		this.acDelta += delta;
		this.acTimerDelta += delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		this.parent();
		$('background').setStyle('background', this.background);
		switch(this.stage) {
			case 4:
				writeText("game over", 6*SPRITESIZE, 9*SPRITESIZE);
				break;
			case 5:
				filledRectangle(0, 0, 16*SPRITESIZE, 4*SPRITESIZE, '#000');
				writeText("continue", 5*SPRITESIZE, 5*SPRITESIZE);
				writeText("save", 5*SPRITESIZE, (6*SPRITESIZE)+HALFSPRITE);
				writeText("retry", 5*SPRITESIZE, 8*SPRITESIZE);
				break;
		}
	}
});

var Event = new Class({
	initialize: function(room, noMovingPlayer) {
		room.tmpX = env.player.x;
		room.tmpY = env.player.y;
		room.addEvent('leave', function() {
			if(!noMovingPlayer) {
				env.player.y = this.tmpY;
				env.player.x = this.tmpX;
			}
			for(var i=0; i < this.MOBs.length; i++) {
				var mob = this.MOBs[i];
				if(mob.name !== 'Door' && mob.name !== 'BombHole'){
					room.MOBs.splice(i--,1);
					mob.destroy();
				}
			}
			room.removeEvents('leave');
			room.addEvent('leave',  room.onLeave);
		});
		
		if(!noMovingPlayer) {
			env.player.y = (11+4-1)*SPRITESIZE;
			env.player.x = SPRITESIZE*7;
			env.player.direction=270;
		}
		new Fire((SPRITESIZE*4.5), SPRITESIZE*8, room);
		new Fire((SPRITESIZE*10.5), SPRITESIZE*8, room);
		
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
			room.guy = new StaticSprite((SPRITESIZE*7.5), SPRITESIZE*8, room, 'OldMan');
			room.sword = new puSword((SPRITESIZE*7.5), (SPRITESIZE*9.5), room);
			room.pickupfunc = room.sword.pickup;
			room.sword.pickup=function(that){
				if(room.pickupfunc.bind(this).pass(that)()) room.guy.fade();
			};

			new TextContainer(SPRITESIZE*3, (SPRITESIZE*6.5), room, "it's dangerous to go\n  alone! take this.", true);
		}
	}
});

var MoneyMakingGameEvent = new Class({
	Extends: Event
	,initialize: function(room) {
		this.parent(room);
		
		new TextContainer(SPRITESIZE*3.5, (SPRITESIZE*6)+HALFSPRITE, room, "let's play money\nmaking game.", true);
		new StaticSprite((SPRITESIZE*7)+HALFSPRITE, SPRITESIZE*8, room, 'OldMan');
		room.rupees = [];
		room.rupees[0] = new mmgRupee((SPRITESIZE*5)+(HALFSPRITE*1.5), (SPRITESIZE*10)-HALFSPRITE, room, false, 10);
		room.rupees[1] = new mmgRupee((SPRITESIZE*7)+(HALFSPRITE*1.5), (SPRITESIZE*10)-HALFSPRITE, room, false, 10);
		room.rupees[2] = new mmgRupee((SPRITESIZE*9)+(HALFSPRITE*1.5), (SPRITESIZE*10)-HALFSPRITE, room, false, 10);
		room.winningRupee = Number.random(0,2);
		room.priceRupee = Number.random(0,2);
		
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
		
		new mmgRupee((SPRITESIZE*3), (SPRITESIZE*11)-4, room, true);
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
		
		room.txtcnt = new TextContainer(SPRITESIZE*3, (SPRITESIZE*6)+HALFSPRITE, room, "pay me and i'll talk.", true);
		new StaticSprite((SPRITESIZE*7)+HALFSPRITE, SPRITESIZE*8, room, 'OldWoman');

		room.rupees = [
			new mmgRupee((SPRITESIZE*5)+(HALFSPRITE*1.5), (SPRITESIZE*10)-HALFSPRITE, room, false, this.prices[0])
			,new mmgRupee((SPRITESIZE*7)+(HALFSPRITE*1.5), (SPRITESIZE*10)-HALFSPRITE, room, false, this.prices[1])
			,new mmgRupee((SPRITESIZE*9)+(HALFSPRITE*1.5), (SPRITESIZE*10)-HALFSPRITE, room, false, this.prices[2])
		];

		room.staticRupee = new mmgRupee((SPRITESIZE*3)+(HALFSPRITE/2), (SPRITESIZE*11)-4, room, true);
		
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
				room.staticRupee.destroy();
				new RupeeCountEvent(that, -this.cost);//that.addRupees(-this.cost);
				room.txtcnt.destroy();
				room.txtcnt = new TextContainer(SPRITESIZE*this.xoff, (SPRITESIZE*6)+HALFSPRITE, room, this.msg, false);
			};
		}
	}
});

var RupeeCountEvent = new Class({
	Extends: Mob
	,sprite: null
	,msPerFrame: 30
	,initialize: function(player, amount) {
		this.player = player;
		this.amount = amount;
		this.modifier = amount / Math.abs(amount);
		this.parent();
	}
	,move: function() {
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			this.player.addRupees(this.modifier);
			this.amount -= this.modifier;
			if(this.amount == 0) this.destroy();
		}
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
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
		
		new StaticSprite((SPRITESIZE*7)+HALFSPRITE, SPRITESIZE*8, room, 'OldWoman');
		new TextContainer(SPRITESIZE*4, (SPRITESIZE*6)+HALFSPRITE, room, "meet the old man\n  at the grave.");
	}
});

var PotionShopEvent = new Class({
	// @TODO: Finish actual potionshop. Need to have found letter from old man and shown to the old woman
	Extends: Event
	,initialize: function(room) {
		this.parent(room);
		//new StaticSprite((SPRITESIZE*7)+HALFSPRITE, SPRITESIZE*8, room, 103);
		//new TextContainer(SPRITESIZE*4, (SPRITESIZE*6)+HALFSPRITE, room, "meet the old man\n  at the grave.");
	}
});

var LinkGainItem = new Class({
	Extends: Mob
	,shownMs: 1500
	,acDelta: 0
	,initialize: function(itemsprite, params){
		this.sprite = itemsprite;
		if(params) {
			if(typeof(params['palette']) != 'undefined') this.palette=params['palette'];
			if(typeof(params['direction']) != 'direction') this.direction=params['direction'];
		}
		env.player.isActive=false;
		var dim = SpriteCatalog.getDimensions(this.sprite, this.direction);
		this.x = env.player.x;
		this.y = env.player.y - dim.h;
		this.height=dim.h;
		this.width=dim.w;

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
		SpriteCatalog.draw('LinkGainItem', env.player.x, env.player.y);
		this.parent();
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

		new StaticSprite((SPRITESIZE*7.5), SPRITESIZE*8, room, 'OldMan');
		new TextContainer(SPRITESIZE*2.5, (SPRITESIZE*6.5), room, "take any one you want.");
	
		room.potion = new puRedPotion((SPRITESIZE*6)-4, (SPRITESIZE*9.5), room);
		room.heart = new puHeartContainer((SPRITESIZE*10)-4, (SPRITESIZE*9.5), room);

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
			this.guy.fade();
			this.txtNode.destroy();
			this.rupee.destroy();
			this.item1.fade();
			this.item2.fade();
			this.item3.fade();
		};
		room.guy = new StaticSprite((SPRITESIZE*7)+HALFSPRITE, SPRITESIZE*8, room, 'YoungMan');
		room.txtNode = new TextContainer(SPRITESIZE*2+HALFSPRITE, (SPRITESIZE*6)+HALFSPRITE, room, text ? text : "buy somethin' will ya!", true);
		
		room.rupee = new mmgRupee((SPRITESIZE*3)+(HALFSPRITE/2), (SPRITESIZE*11)-4, room, true);

	}
});

var CandleShieldKeyStoreEvent = new Class({
	Extends: StoreEvent
	,initialize: function(room) {
		this.parent(room);
		
		room.item1 = new puShield((SPRITESIZE*6)-4, (SPRITESIZE*10)-HALFSPRITE, room);
		room.item2 = new puKey((SPRITESIZE*8)-4, (SPRITESIZE*10)-HALFSPRITE, room, 100);
		room.item3 = new puCandle((SPRITESIZE*10)-4, (SPRITESIZE*10)-HALFSPRITE, room);
	}
});

var ShieldBombArrowEvent = new Class({
	Extends: StoreEvent
	,initialize: function(room) {
		this.parent(room);
		
		room.item1 = new puShield((SPRITESIZE*6)-4, (SPRITESIZE*10)-HALFSPRITE, room);
		room.item2 = new puBomb((SPRITESIZE*8)-4, (SPRITESIZE*10)-HALFSPRITE, room, 0, 4, 20);
		room.item3 = new puArrow((SPRITESIZE*10)-2, (SPRITESIZE*10)-HALFSPRITE, room);
		room.item1.price = 130;

		for(var i=1; i<=3; i++) {
			room['item'+i].tmpPickup = room['item'+i].pickup;
			room['item'+i].pickup = function(that) {
				if(this.tmpPickup.bind(this).pass(that)())
					room.killSprites();
			};
		}
	}
});

var ShieldBoneHeartStore = new Class({
	Extends: StoreEvent
	,initialize: function(room) {
		this.parent(room,"    boy, this is\n  really expensive!");
		
		room.item1 = new puShield((SPRITESIZE*6)-4, (SPRITESIZE*10)-HALFSPRITE, room);
		room.item1.price = 90;
		room.item2 = new puBone((SPRITESIZE*8)-4, (SPRITESIZE*10)-HALFSPRITE, room);
		room.item3 = new puHeart((SPRITESIZE*10)-4, (SPRITESIZE*10)-HALFSPRITE, room, null, 10);

		room.tmpHeartFunc = room.item3.pickup;
		room.item3.pickup = function(that) {
			if(room.tmpHeartFunc.bind(this).pass(that)()){
				room.killSprites();
				new LinkGainItem(this.sprite);
			}
		};
	}
});

var HeartContainerEvent515 = new Class({
	Extends: Event
	,initialize: function(room) {
		if(!room.heartContainer)
			room.heartContainer = new puHeartContainer(12*SPRITESIZE,9*SPRITESIZE,room);
	}
});

var LakeFairyEvent = new Class({
	Extends: Event
	,initialize: function(room) {
		if(!room.fairy) {
			room.fairy = new LakeFairy(8*SPRITESIZE-(HALFSPRITE/2),8.25*SPRITESIZE,room);
			new LakeFairyTrigger(8*SPRITESIZE-(HALFSPRITE/2),11*SPRITESIZE,room)
		}
	}
});

var SecretToEverybody = new Class({
	Extends: Event
	,initialize: function(room) {
		this.parent(room);

		if(room.eventDone) return;
		room.guy = new StaticSprite((SPRITESIZE*7)+HALFSPRITE, SPRITESIZE*8, room, 'Moblin', {direction:90});
		room.txtNode = new TextContainer(SPRITESIZE*4+HALFSPRITE, (SPRITESIZE*6)+HALFSPRITE, room, "it's a secret\nto everybody.");
		
		room.rupees = [new mmgRupee((SPRITESIZE*8)-HALFSPRITE, (SPRITESIZE*10)-HALFSPRITE, room, false, 0)];
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

		room.guy = new StaticSprite((SPRITESIZE*7)+HALFSPRITE, SPRITESIZE*8, room, 'OldMan');
		room.txtNode = new TextContainer(SPRITESIZE*3, (SPRITESIZE*6)+HALFSPRITE, room, "pay me for the door\n   repair charge.");
		
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

		room.guy = new StaticSprite((SPRITESIZE*7)+HALFSPRITE, SPRITESIZE*8, room, 'OldMan');
		room.txtNode = new TextContainer(SPRITESIZE*3, (SPRITESIZE*6)+HALFSPRITE, room, "master using it and\n you can have this.");

		room.whiteSword = new puWhiteSword(SPRITESIZE*7.5, SPRITESIZE*9.5, room);
		room.whiteSword.pickup = function(that){
			if(that.items.hearts < 5)
				return;
			that.items.sword=2;
			this.destroy();
			room.guy.destroy();
			room.txtNode.destroy();
			new LinkGainItem(this.sprite, {direction: 270, palette: 3});
			room.eventDone=true;
		};
		
	}
});


var MagicalSwordEvent = new Class({
	Extends: Event
	,initialize: function(room) {
		this.parent(room);
		if(room.eventDone) return;

		room.guy = new StaticSprite((SPRITESIZE*7)+HALFSPRITE, SPRITESIZE*8, room, 'OldMan');
		room.txtNode = new TextContainer(SPRITESIZE*3, (SPRITESIZE*6)+HALFSPRITE, room, "master using it and\n you can have this.");

		room.whiteSword = new puMagicalSword(SPRITESIZE*7.5, SPRITESIZE*9.5, room);
		room.whiteSword.pickup = function(that){
			if(that.items.hearts < 12)
				return;
			that.items.sword=3;
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
	,initialize: function(x, y, room, text, halt) {
		this.parent(x,y,room)
		this.x = x;
		this.y = y;
		this.animFrame=0;
		this.text = text;
		if(typeof halt != 'undefined' && halt) {
			this.immobilize = true;
			env.player.immobilized = true;
		}
	}
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(["\n"," "].contains(this.text[this.animFrame])) this.animFrame++;
			if(++this.animFrame > this.text.length) {
				this.animFrame = this.text.length;
				if(this.immobilize) {
					env.player.immobilized = false;
				}
			}
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
		SpriteCatalog.draw('Fire', this.x, this.y, {flip: (this.flip ? 'x' : null)});
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

var StaticSprite = new Class({
	Extends: Mob
	,spriteParams: {}
	,initialize: function(x,y,room,sprite, spriteParams) {
		this.sprite = sprite;
		this.parent(x,y,room);
		if(typeof spriteParams != 'undefined' && typeof spriteParams['direction'] != 'undefined')
			this.direction = spriteParams['direction'];
	}
});

var EnemyDeath = new Class({
	Extends: Mob
	,acDelta: 0
	,lastUpdateTime: 0
	,animFrame: 0
	,msPerFrame: 30
	,defaultPalette: 0
	,frames: [0, 0, 0, 1, 1, 1, 0, 0, 0, 0]
	,palette: 0
	,sprite: 'Death'
	,animCnt: 0
	,move: function() {
		var delta = Date.now() - this.lastUpdateTime;
	
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(typeof this.frames[this.animCnt++] == 'undefined') {
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
			this.animFrame = this.frames[this.animCnt];
			if(++this.palette >= env.palettes['main'].length)
				this.palette=0;
		}

		this.acDelta+=delta; 
		this.lastUpdateTime = Date.now();
	}
});

var BraceletEvent = Class({
	initialize: function(room) {
		if(this.isInitialized) return false;
		room.tiles[4][14].addEvent('touch', function(){
			this.armos.spawnCallback = function() {
				new puBracelet(14*SPRITESIZE, 8*SPRITESIZE, room);
			}
		});
		this.isInitialized = true;
	}
});

function doStuffOnKilledMOBs(room, mobName, item, door){
	// spawn key when all mobs are destroyed
	Array.each(room.MOBs, function(mob){
		if(mob.name != mobName || mob.tmpFunc) return;
		mob.tmpFunc = mob.destroy;
		mob.destroy = function() {
			this.tmpFunc();
			var mobCnt = 0;
			Array.each(room.MOBs, function(mab) {
				if(mab.name == mobName)
					mobCnt++;
			});
			if(mobCnt == 0) {
				if(typeof item !== 'undefined') new item(8*SPRITESIZE,9*SPRITESIZE,room,0);
				if(typeof door !== 'undefined') room.doors[door].state = 'Open';

			}
		};
	}, room);
}

var d1r0_0 = new Class({
	initialize: function(room) {
		Array.each([[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13],[7,2],[7,4],[7,5],[7,6],[7,7],[7,8],[7,9],[7,10],[7,12],[7,13]], function(tile) {
			room.tiles[tile[0]][tile[1]].isSolid=true;
		});
		new puBow(8*SPRITESIZE, 9*SPRITESIZE, room);
		env.player.x = 3*SPRITESIZE;
		env.player.y = 5*SPRITESIZE;
		env.player.direction = 90;
		room.tiles[0][3].enter = function() {
			switchRoom(2,6,dungeon1);
			env.player.x=6*SPRITESIZE;
			env.player.y=11*SPRITESIZE;
			env.player.direction = 90;
		};
	}
});

var d1r2_6 = new Class({
	initialize: function(room) {
		block = new movableBlock(6*SPRITESIZE, 9*SPRITESIZE, room);
		block.direction='*';
		if(!room.isInitialized) {
			new BladeTrap(2*SPRITESIZE,6*SPRITESIZE,room);
			new BladeTrap(13*SPRITESIZE,6*SPRITESIZE,room);

			new BladeTrap(2*SPRITESIZE,12*SPRITESIZE,room);
			new BladeTrap(13*SPRITESIZE,12*SPRITESIZE,room);
			room.isInitialized = true;
		}

		room.addEvent('leave', function() {
			block.destroy();
			room.removeEvents('leave');
			room.addEvent('leave',  room.onLeave);
		});
	}	
});

var d1r3_9 = new Class({
	initialize: function(room) {
		if(!room.isInitialized) {
		console.log('boooyaaa');
			room.aqua = new Aquamentus(10*SPRITESIZE, 8*SPRITESIZE, room);
			room.isInitialized = true;
			room.aqua.die = function() {
				new puHeartContainer(12*SPRITESIZE,9*SPRITESIZE, room);
				room.doors[0].state = 'Open';
				new EnemyDeath(this.x, this.y);
				this.destroy();
			};
		}
	}
});

var d1r3_10 = new Class({
	initialize: function(room) {
		new puTriforce(7.5*SPRITESIZE, 9*SPRITESIZE,room);
	}
});

var d1r4_5 = new Class({
	Extends: Event
	,initialize: function(room) {
		this.parent(room, true);
		
		new StaticSprite((SPRITESIZE*7)+HALFSPRITE, SPRITESIZE*8, room, 'OldMan');
		new TextContainer(SPRITESIZE*3, (SPRITESIZE*6)+HALFSPRITE, room, "eastmost penninsula\n   is the secret.");
	}
});

var d1r4_6 = new Class({
	initialize: function(room) {
		block = new movableBlock(7*SPRITESIZE, 9*SPRITESIZE, room);
		block.direction = '*';
		room.doors[180].state = 'Shut';
		block.onMove = function() {
			room.doors[180].state = 'Open';
		}
		room.addEvent('leave', function() {
			block.destroy();
			room.removeEvents('leave');
			room.addEvent('leave',  room.onLeave);
		});

	}	
});

var d1r4_7 = new Class({
	initialize: function(room) {
		new puMap(12*SPRITESIZE, 9*SPRITESIZE+1,room);
	}
});

var d1r4_8 = new Class({
	initialize: function(room) {
		// spawn key when all mobs are destroyed
		Array.each(room.MOBs, function(mob){
			mob.tmpFunc = mob.destroy;
			mob.destroy = function() {
				this.tmpFunc();
				var mobCnt = 0;
				Array.each(room.MOBs, function(mab) {
					if(mab.name == 'Goriya')
						mobCnt++;
				});
				if(mobCnt == 0) {
					new puBoomerang(8*SPRITESIZE,7*SPRITESIZE,room,0);
				}
			};
			
		}, this);
	}
});

var d1r4_9 = new Class({
	initialize: function(room) {
		new puKey(10*SPRITESIZE+4, 12*SPRITESIZE,room);
	}
});

var d1r5_6 = new Class({
	initialize: function(room) {
		// Open east door when all mobs are destroyed
		room.doors[0].state = 'Shut';

		var staflosCnt = 0;
		Array.each(room.MOBs, function(mab) {
			if(mab.name == 'Keese')
				staflosCnt++;
		});
		if(staflosCnt == 0) {
			room.doors[0].state = 'Open';
		}

		Array.each(room.MOBs, function(mob){
			mob.tmpFunc = mob.destroy;
			mob.destroy = function() {
				this.tmpFunc();
				var staflosCnt = 0;
				Array.each(room.MOBs, function(mab) {
					if(mab.name == 'Keese')
						staflosCnt++;
				});
				if(staflosCnt == 0) {
					room.doors[0].state = 'Open';
				}
			};
			
		}, this);
	}
});

var d1r5_7 = new Class({
	initialize: function(room) {
		// spawn key when all mobs are destroyed
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
					new puKey(8*SPRITESIZE,7*SPRITESIZE,room,0);
				}
			};
			
		}, this);
	}
});
var d1r5_8 = new Class({
	initialize: function(room) {
		new puCompass(12*SPRITESIZE, 9*SPRITESIZE,room);
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
					new puKey(10*SPRITESIZE,12*SPRITESIZE,room,0);
				}
			};
			
		}, this);
	}
	
});

var d1r7_7 = new Class({
	initialize: function(room) {
		room.doorOpened = false;
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

var d2r0_7 = new Class({
	initialize: function(room) {
		new puTriforce(7.5*SPRITESIZE, 9*SPRITESIZE,room);
	}
});

var d2r1_9 = new Class({
	Extends: Event
	,initialize: function(room) {
		this.parent(room, true);
		
		new StaticSprite((SPRITESIZE*7)+HALFSPRITE, SPRITESIZE*8, room, 'OldMan');
		new TextContainer(SPRITESIZE*2.5, (SPRITESIZE*6)+HALFSPRITE, room, "dodongo dislikes smoke.");
	}
});

var d2r3_9 = Class({
	initialize: function(room) {
		if(!room.isInitialized) {
			new BladeTrap(2*SPRITESIZE,6*SPRITESIZE,room);
			new BladeTrap(13*SPRITESIZE,6*SPRITESIZE,room);

			new BladeTrap(2*SPRITESIZE,12*SPRITESIZE,room);
			new BladeTrap(13*SPRITESIZE,12*SPRITESIZE,room);
			var bomb = new puBomb(8*SPRITESIZE, 9*SPRITESIZE,room);
			bomb.worth = 4;
			room.isInitialized = true;
		}
	}
});

var d2r4_8 = Class({
	initialize: function(room) {
		doStuffOnKilledMOBs(room, 'Rope', puKey, 90);
	}
});
var d2r4_9 = Class({
	initialize: function(room) {
		if(room.roomInitialized) return;
		doStuffOnKilledMOBs(room, 'BlueGoriya', puBlueBoomerang);
		new StoneStatue(2*SPRITESIZE, 6*SPRITESIZE, room);
		new StoneStatue(13*SPRITESIZE, 6*SPRITESIZE, room);

		new StoneStatue(2*SPRITESIZE, 12*SPRITESIZE, room);
		new StoneStatue(13*SPRITESIZE, 12*SPRITESIZE, room);
		room.roomInitialized=true;
	}
});
var d2r5_9 = Class({
	initialize: function(room) {
		new puMap(8*SPRITESIZE, 9*SPRITESIZE,room);
	}
});
var d2r6_6 = Class({
	initialize: function(room) {
		new puKey(8*SPRITESIZE, 9*SPRITESIZE,room);
	}
});
var d2r6_7 = Class({
	initialize: function(room) {
		room.doors[180].state = 'Shut';

		var staflosCnt = 0;
		Array.each(room.MOBs, function(mab) {
			if(mab.name == 'Rope')
				staflosCnt++;
		});
		if(staflosCnt == 0) {
			room.doors[180].state = 'Open';
		}

		Array.each(room.MOBs, function(mob){
			mob.tmpFunc = mob.destroy;
			mob.destroy = function() {
				this.tmpFunc();
				var staflosCnt = 0;
				Array.each(room.MOBs, function(mab) {
					if(mab.name == 'Rope')
						staflosCnt++;
				});
				if(staflosCnt == 0) {
					room.doors[180].state = 'Open';
				}
			};
			
		}, this);
	}
});
var d2r6_9 = Class({
	initialize: function(room) {
		new puCompass(13*SPRITESIZE, 6*SPRITESIZE,room);
	}
});

var d2r7_8 = Class({
	initialize: function(room) {
		// spawn key when all mobs are destroyed
		Array.each(room.MOBs, function(mob){
			if(mob.name != 'Rope' || mob.tmpFunc) return;
			mob.tmpFunc = mob.destroy;
			mob.destroy = function() {
				this.tmpFunc();
				var keeseCnt = 0;
				Array.each(room.MOBs, function(mab) {
					if(mab.name == 'Rope')
						keeseCnt++;
				});
				if(keeseCnt == 0) {
					new puKey(8*SPRITESIZE,9*SPRITESIZE,room,0);
				}
			};
			
		}, this);
	}
});

var d3r0_0 = new Class({
	initialize: function(room) {
		Array.each([[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13],[7,2],[7,4],[7,5],[7,6],[7,7],[7,8],[7,9],[7,10],[7,12],[7,13]], function(tile) {
			room.tiles[tile[0]][tile[1]].isSolid=true;
		});
		new puRaft(8*SPRITESIZE, 9*SPRITESIZE, room);
		env.player.x = 3*SPRITESIZE;
		env.player.y = 5*SPRITESIZE;
		env.player.direction = 90;
		room.tiles[0][3].enter = function() {
			switchRoom(6,4,dungeon3);
			env.player.x=6*SPRITESIZE;
			env.player.y=9*SPRITESIZE;
			env.player.direction = 90;
		};
	}
});

var d3r2_6 = new Class({
	// @TODO: Questionmark doesn't show?
	Extends: Event
	,initialize: function(room) {
		this.parent(room, true);
		
		new StaticSprite((SPRITESIZE*7)+HALFSPRITE, SPRITESIZE*8, room, 'OldMan');
		new TextContainer(SPRITESIZE*2.5, (SPRITESIZE*6)+HALFSPRITE, room, "did you get the sword\nfrom the old man on\ntop of the waterfall?");
	}
});
