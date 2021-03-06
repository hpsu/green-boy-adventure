/******************
 * Weapon classes *
 ******************/

var CandleFire = new Class({
	Extends: Mob
	,msShown: 2000
	,flip: 0
	,msPerFrame: 50
	,msPerOther: 20
	,acShove:0
	,acShown:0
	,movementRate: 1
	,sprite: 'Fire'
	,accuAdd: 1
	,lockRotation: true
	,initialize: function(ancestor) {
		this.name = 'CandleFire';
		this.ancestor = ancestor;
		this.parent(ancestor.x, ancestor.y);
		this.direction = this.ancestor.direction;
		this.origX = this.ancestor.x;
		this.origY = this.ancestor.y;
	}
	,move: function() {
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		if(this.acShown > this.msShown) {
			this.ancestor.candle = null;
			var xTile = Math.round((this.x)/SPRITESIZE);
			var yTile = Math.round((this.y)/SPRITESIZE)-4;

			if(xTile < 0) xTile = 0;
			if(yTile < 0) yTile = 0;
			if(xTile > this.currentRoom.roomWidth-1) xTile=this.currentRoom.roomWidth-1;
			if(yTile > this.currentRoom.roomHeight-1) yTile=this.currentRoom.roomHeight-1;

			this.currentRoom.getTile(yTile,xTile).fire();
			this.destroy();
		}

		if(this.acShove > this.msPerOther) {
			this.acShove = 0;
			if(this.accuAdd < 2) {
				this.accuAdd += 0.1;
			}
		}
		this.x = this.origX + (Math.cos(this.direction * Math.PI/180) * (this.accuAdd*SPRITESIZE));
		this.y = this.origY + (Math.sin(this.direction * Math.PI/180) * (this.accuAdd*SPRITESIZE));
		if(this.acDelta > this.msPerFrame) {
			this.ancestor.usingItem = false;
			this.acDelta = 0;
			this.flip = this.flip ? null : 'x';
		}
		this.acShove+=delta;
		this.acDelta+=delta;
		this.acShown+=delta;
		this.acTotalDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

var Bomb = new Class({
	Extends: Mob
	,msShown: 200
	,msBlowup: 2000
	,isFriendly: true
	,sprite: 'Bomb'
	,lockRotation: true
	,width: 8
	,initialize: function(ancestor) {
		this.ancestor = ancestor;
		this.parent(ancestor.x, ancestor.y);
		this.rePosition();
		ancestor.addBombs(-1);
	}
	,destroy: function() {
		new Detonation(this.x, this.y, this.currentRoom, this);
		this.parent();
	}
	,rePosition: function() {
		this.x = this.ancestor.x;
		this.y = this.ancestor.y;
		this.direction = this.ancestor.direction;
		switch(this.direction) {
			case 0:
				this.x += this.ancestor.width + (HALFSPRITE/4);
				break;
			case 180:
				this.x -= this.width + (HALFSPRITE/4);
				break;
			case 270:
				this.y -= this.height + (HALFSPRITE/4);
				this.x += this.width/2;
				break;
			case 90:
				this.y += this.ancestor.height + (HALFSPRITE/4);
				this.x += this.width/2;
				break;
		}
	}
	,move: function() {
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		if(this.acDelta > this.msBlowup) {
			this.ancestor.bomb = null;
			this.destroy();
		}
		else if(this.acDelta > this.msShown) {
			this.ancestor.usingItem = false;
		} 
		this.acDelta+=delta;
		this.acTotalDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});


var Detonation = new Class({
	Extends: Mob
	,isFriendly: true
	,frame: 0
	,damage: 1
	,msPerFrame: 20
	,width:SPRITESIZE*2+12
	,height:SPRITESIZE*2+12
	,acTileSwitchDelta: 0
	,animFrame: 0
	,sprite: 'EnemySpawn'
	,offsetx: 14
	,offsety: 14
	,initialize: function(x,y,room,ancestor){
		this.direction = ancestor.direction;
		this.parent(x,y,room);
		this.x -= this.offsetx+(HALFSPRITE/2);
		this.y -= this.offsety;
	}
	,move: function() {
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);

		Array.each(rooms.getCurrentRoom().MOBs, function(that){
			if(that != this && !that.isFriendly && this.collidesWith(that)) {
				that.impact(this.damage, (180+that.direction)%360, 'bomb');
			}
		},this);

		var xTile = Math.floor((this.x+this.offsetx+(SPRITESIZE/2))/SPRITESIZE);
		var yTile = Math.floor(((this.y+this.offsety+(SPRITESIZE/2))/SPRITESIZE))-4;

		if(xTile < 0) xTile = 0;
		if(yTile < 0) yTile = 0;
		if(xTile > this.currentRoom.roomWidth-1) xTile=this.currentRoom.roomWidth-1;
		if(yTile > this.currentRoom.roomHeight-1) yTile=this.currentRoom.roomHeight-1;
		
		tmp = this.currentRoom.getTile(yTile,xTile);

		//filledRectangle(xTile*SPRITESIZE, (yTile+4)*SPRITESIZE, SPRITESIZE, SPRITESIZE, "#00f", ctxBg);
		//filledRectangle(this.x+this.offsetx+(SPRITESIZE/2), this.y+this.offsety+(SPRITESIZE/2), 1, 1, "#f00", ctxBg);


		this.currentRoom.getTile(yTile,xTile).bomb();
		if(this.acTileSwitchDelta > 600) {
			this.destroy();
		}
		else if(this.acTileSwitchDelta > 300) {
			this.sprite = 'EnemySpawn';
			this.animFrame = 1;
		}
		if(this.acDelta > this.msPerFrame) {
			this.acDelta=0;
			if(++this.frame > 1) this.frame=0;
		}
		this.acDelta += delta;
		this.acTileSwitchDelta += delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		var params = {animFrame: this.animFrame}
			,x = this.x+this.offsetx
			,y = this.y+this.offsety;
		
		SpriteCatalog.draw(this.sprite, x, y, params);

		if(this.frame == 0) {
			SpriteCatalog.draw(this.sprite, x-8, y-14, params);
			SpriteCatalog.draw(this.sprite, x+8, y+14, params);
			SpriteCatalog.draw(this.sprite, x+14, y, params);
		}
		else {
			SpriteCatalog.draw(this.sprite, x+8, y-14, params);
			SpriteCatalog.draw(this.sprite, x-8, y+14, params);
			SpriteCatalog.draw(this.sprite, x-14, y, params);
		}
	}

});(this.x, this.y);


var Sword = new Class({
	Extends: Mob
	,damage: 0.5
	,msShown: 200
	,sprite: 'Sword'
	,width: 16
	,height: 16
	,direction: 0
	,movementRate: 5
	,isFriendly: true
	,fullPower: false
	,palette: 0
	,initialize: function(ancestor) {
		this.name = 'Sword';
		this.ancestor = ancestor;
		this.parent(ancestor.x, ancestor.y);
		this.fullPower = this.ancestor.health == this.ancestor.items.hearts;
		this.rePosition();
		switch(ancestor.items.sword) {
			case 2:
				this.palette = 3;
				break;
		}
	}
	,rePosition: function() {
		this.x = this.ancestor.x;
		this.y = this.ancestor.y;
		this.direction = this.ancestor.direction;
		switch(this.direction) {
			case 0:
				this.x += 11;
				this.y += 1;
				break;
			case 180:
				this.x -= 11;
				break;
			case 270:
				this.y -= 11;
				break;
			case 90:
				this.y += 11;
				break;
		}
	}
	,move: function() {
		Array.each(rooms.getCurrentRoom().MOBs, function(that){
			if(that != this && this.collidesWith(that)) {
				if(!that.isFriendly)
					that.impact(this.damage, this.direction);
				else if(that.pickup) {
					that.pickup(this.ancestor);
				}
			}
		},this);

		xAdd = 0;
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		if(this.acDelta > this.msShown) {
			this.ancestor.usingItem = false;
			this.destroy();
		} 
		this.rePosition();
		if (this.acDelta > this.msPerFrame) {
			//@TODO: Link should animate when subtracting the sword (walking frames from right to left)
		}
		this.acDelta+=delta;
		this.acTotalDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

var SwordRipplePart = new Class({
	Extends: Mob
	,sprite: 'SwordRipple'
	,angle: 0
	,palette: 0
	,moveRate: 1.3
	,iterable:0
	,isFriendly: true
	,initialize: function(x,y,angle) {
		this.name = 'SwordRipplePart';
		this.parent(x,y);
		this.angle=angle;
	}
	,move: function() {
		this.iterable += this.moveRate;
		if(this.iterable > SPRITESIZE*2) {
			return this.destroy();
		}
		this.x += Math.cos(this.angle * Math.PI/180) * this.moveRate;
		this.y += Math.sin(this.angle * Math.PI/180) * this.moveRate;
		if(++this.palette > env.palettes['main'].length-1)
			this.palette=0;

		switch(this.angle) {
			case 45:
				this.flip = 'y';
				break;
			case 135:
				this.flip = 'xy';
				break;
			case 225:
				this.flip = 'x';
				break;
		}

	}
});

var SwordThrow = new Class({
	Extends: Sword
	,name: 'SwordThrow'
	,damage: 0.5
	,msPerFrame: 10
	,palette: 0
	,defaultPalette: 0
	,acImpactMove: 0
	,movementRate:3
	,destroy: function() {
		(function(ancestor){ancestor.swordThrow = null;}).pass(this.ancestor).delay(300);
		this.swordRipple();
		this.parent();
	}
	,swordRipple: function() {
		new SwordRipplePart(this.x,this.y,45);
		new SwordRipplePart(this.x,this.y,135);
		new SwordRipplePart(this.x,this.y,225);
		new SwordRipplePart(this.x,this.y,315);
	}
	,move: function() {
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);

		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			this.x += Math.cos(this.direction * Math.PI/180) * this.movementRate;
			this.y += Math.sin(this.direction * Math.PI/180) * this.movementRate;

			Array.each(this.currentRoom.MOBs, function(that){
				if(that != this &&  !that.isFriendly && this.collidesWith(that)) {
					if(that.impact(this.damage, this.direction))
						this.destroy();
				}
			},this);

			
			if(this.x > (this.currentRoom.roomWidth*SPRITESIZE)-(SPRITESIZE*1.5)
			|| this.y < SPRITESIZE*4
			|| this.x < (SPRITESIZE/2)
			|| this.y > SPRITESIZE*14) {
				this.destroy();
			}
			if(++this.palette > env.palettes['main'].length-1)
				this.palette=0;
		}
		
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();

	}
});

/***************
 * Pickupables *
 ***************/

var puHeartContainer = new Class({
	Extends: Mob
	,name: 'puHeartContainer'
	,sprite: 'HeartContainer'
	,isFriendly: true
	,pickup: function(that) {
		that.addHearts(1);
		that.addHealth(1);
		new LinkGainItem(this.sprite);
		this.destroy();
	}
});

var puRedPotion = new Class({
	Extends: Mob
	,name: 'puRedPotionContainer'
	,width:HALFSPRITE
	,sprite: 'Potion'
	,isFriendly: true
	,pickup: function(that) {
		that.items.potions =2;
		new LinkGainItem(this.sprite);
		this.destroy();
	}
});

var puBracelet = new Class({
	Extends: Mob
	,name: 'puBracelet'
	,width:HALFSPRITE
	,sprite: 'Bracelet'
	,isFriendly: true
	,pickup: function(that) {
		that.items.bracelet = 1;
		this.destroy();
	}
});

var puSword = new Class({
	Extends: Mob
	,name: 'puSword'
	,sprite: 'Sword'
	,direction: 270
	,isFriendly: true
	,type: 1
	,pickup: function(that) {
		that.items.sword = this.type;
		new LinkGainItem(this.sprite, {direction: this.direction});
		this.destroy();
		return true;
	}
});

var puWhiteSword = new Class({
	Extends: puSword
	,palette: 3
	,type: 2
});


var puShield = new Class({
	Extends: Mob
	,name: 'puShield'
	,price: 160
	,width: 8
	,sprite: 'Shield'
	,isFriendly: true
	,pickup: function(that) {
		if(this.price) {
			if(that.getRupees() < this.price) return false;
			new RupeeCountEvent(that, -this.price);
		}
		that.items.shield = 2;
		new LinkGainItem(this.sprite);
		this.destroy();
		return true;
	}
	,draw: function() {
		this.parent();
		if(!this.isFading)
			writeText((String(this.price).length < 3 ? ' ' : '') + String(this.price), this.x-SPRITESIZE+4, this.y+1.5*SPRITESIZE);

	}
});

var puCompass = new Class({
	Extends: Mob
	,sprite: 'Compass'
	,isFriendly: true
	,pickup: function(that) {
		rooms.hasCompass=true;
		this.destroy();
	}
});

var puMap = new Class({
	Extends: Mob
	,sprite: 'Map'
	,isFriendly: true
	,pickup: function(that) {
		rooms.hasMap=true;
		this.destroy();
	}
});

var puBoomerang = new Class({
	Extends: Mob
	,sprite: 'Boomerang'
	,isFriendly: true
});

var puBlueBoomerang = new Class({
	Extends: puBoomerang
	,palette:3
});

var puTriforce = new Class({
	Extends: Mob
	,sprite: 'Triforce'
	,isFriendly: true
	,move: function() {
		var delta = Date.now() - this.lastUpdateTime;
	
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			this.palette = this.palette == 2 ? 3 : 2;
		}

		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

var puMagicalSword = new Class({
	Extends: Mob
	,sprite: 'MagicalSword'
	,isFriendly: true
});
var puKey = new Class({
	Extends: Mob
	,name: 'puKey'
	,price: 100
	,width: 8
	,sprite: 'Key'
	,isFriendly: true
	,initialize: function(x,y,room,price) {
		this.parent(x,y,room);
		if(typeof price != undefined) this.price = price;
	}
	,pickup: function(that) {
		if(this.price) {
			if(that.getRupees() < this.price) return false;
			that.addRupees(-this.price);
		}
		that.items.keys++;
		
		this.destroy();
		if(this.price) {
			new LinkGainItem(this.sprite);
			this.currentRoom.killSprites();
		}
	}
	,draw: function() {
		this.parent();
		if(this.price) writeText(String(this.price), this.x-SPRITESIZE+8, this.y+1.5*SPRITESIZE);
	}
});

var puBone = new Class({
	Extends: Mob
	,name: 'puBone'
	,width:HALFSPRITE
	,sprite: 'Bone'
	,price: 100
	,isFriendly: true
	,pickup: function(that) {
		if(this.price) {
			if(that.getRupees() < this.price) return false;
			that.addRupees(-this.price);
		}
		that.items.bone = 1;
		this.currentRoom.killSprites();
		new LinkGainItem(this.sprite);
		this.destroy();
	}
	,draw: function() {
		this.parent();
		writeText(String(this.price), this.x-SPRITESIZE+8, this.y+1.5*SPRITESIZE);
	}
});


var puCandle = new Class({
	Extends: Mob
	,name: 'puCandle'
	,price: 60
	,width: 8
	,sprite: 'Candle'
	,isFriendly: true
	,pickup: function(that) {
		if(this.price) {
			if(that.getRupees() < this.price) return false;
			that.addRupees(-this.price);
		}
		that.items.candle = 1;
		new LinkGainItem(this.sprite);
		this.currentRoom.killSprites();
	}
	,draw: function() {
		this.parent();
		writeText(String(this.price), this.x-SPRITESIZE+4+HALFSPRITE, this.y+1.5*SPRITESIZE);
	}

});


var LakeFairy = new Class({
	Extends: Mob
	,name: 'LakeFairy'
	,sprite: 'Fairy'
	,animFrame: 0
	,width: 8
	,height: 8
	,isFriendly:true
	,msPerFrame: 50
	,heartCount: 0
	,msPerHeart: 250
	,acHeartDelta: 0
	,hearts: []
	,healthMode: false
	,animFrame: 0
	,initialize: function(x, y, room) {
		this.parent(x,y,room);
		this.centerY = Math.floor(this.y-(3.25*SPRITESIZE));
		this.centerX = Math.floor(this.x);
		//this.x = this.centerX;
		//this.y = this.centerY;
	}
	,move: function() {
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(++this.animFrame > 1) this.animFrame = 0;
		}
		if(this.healthMode && this.acHeartDelta >= this.msPerHeart) {
			this.acHeartDelta = 0;
			env.player.addHealth(0.5);
			if(this.heartCount == 16) {
				Array.each(this.hearts, function(x){
					x.destroy();
				});
			}
			if(this.heartCount++ <8)
				this.hearts.push(new LakeHeart(this.x, this.y));
		}
		this.acDelta+=delta;
		this.acHeartDelta += delta;
		this.lastUpdateTime = Date.now();
	}
	,pickup: function() {
		this.healthMode=true;
	}
});

var LakeHeart = new Class({
	Extends: Mob
	,sprite: 'FullHeart'
	,radius: 3.5*SPRITESIZE
	,angle: 180
	,orgX: 0
	,orgY: 0
	,initialize: function(x,y,room) {
		this.parent(x,y,room);
		this.orgX = x;
		this.orgY = y;
	}
	,move: function() {
		this.y = this.radius*Math.cos(this.angle) + this.orgY;
		this.x = this.radius*Math.sin(this.angle) + this.orgX;
		this.angle+=0.05;
	}
});

var LakeFairyTrigger = new Class({
	Extends: Mob
	,isFriendly:true
	,name: 'LakeFairy'
	,sprite: 'EmptyHeart'
	,width: 8
	,height: 8
	,pickup: function(){
		this.currentRoom.fairy.pickup();
	}
	,draw: function(){}
});

var puFairy = new Class({
	Extends: Mob
	,name: 'Fairy'
	,width: 8
	,height: 16
	,msPerFrame: 10
	,isFriendly: true
	,sprite: 'Fairy'
	,acDirDelta: 0
	,lockRotation: true
	,width: HALFSPRITE
	,moveRate: 1
	,direction: 0
	,height: SPRITESIZE
	,animFrame: 0
	,initialize: function(x,y) {
		this.parent(x,y);
		this.randomDirection();
		(function(){this.destroy();}).delay(20000, this);
	}
	,pickup: function(that) {
		that.health = that.items.hearts;
		this.destroy();
	}
	,randomDirection: function() {
		directions = [0, 45, 90, 135, 180, 225, 270, 315];
		this.direction = directions[Number.random(0,directions.length-1)];
	}
	,move: function() {
		var delta = Date.now() - this.lastUpdateTime;


		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(++this.animFrame > 1) this.animFrame = 0;

			if(this.acDirDelta > this.msPerFrame*Number.random(64,256)) {
				this.acDirDelta = 0;
				this.randomDirection();
			}

			this.x += Math.cos(this.direction * Math.PI/180) * this.moveRate;
			this.y += Math.sin(this.direction * Math.PI/180) * this.moveRate;

			if(this.x > (this.currentRoom.roomWidth*SPRITESIZE)-SPRITESIZE-HALFSPRITE
			|| this.y < SPRITESIZE*4
			|| this.x < HALFSPRITE
			|| this.y > SPRITESIZE*14) {
				this.x -= Math.cos(this.direction * Math.PI/180) * this.moveRate;
				this.y -= Math.sin(this.direction * Math.PI/180) * this.moveRate;
				this.randomDirection();
			}
		}
		this.acDelta+=delta;
		this.acDirDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

var puRupee = new Class({
	Extends: Mob
	,name: 'Rupee'
	,acDelta: 0
	,palette: 2
	,width: 16
	,height: 16
	,sprite: 'Rupee'
	,msPerFrame: 120
	,isFriendly: true
	,paletteFrames: [2,3]
	,palettePosition: 0
	,lastUpdateTime: 0
	,expiry: 10000
	,worth: 1
	,initialize: function(x,y,room) {
		this.parent(x,y,room);
		this.isFriendly = true;
		if(this.expiry)
			(function(){this.destroy();}).delay(10000, this);
	}
	,pickup: function(that) {
		that.addRupees(this.worth);
		this.destroy();
	}
	,move: function() {
		var delta = Date.now() - this.lastUpdateTime;
	
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(this.palettePosition >= this.paletteFrames.length) this.palettePosition=0;
			this.palette = this.paletteFrames[this.palettePosition++];
		}
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();

	}
});

var mmgRupee = new Class({
	Extends: puRupee
	,worth: 10
	,cost: 10
	,text: '-10'
	,static: false
	,width: HALFSPRITE
	,expiry: null
	,initialize: function(x,y,room,static,cost){
		if(typeof cost != undefined) this.cost = cost;
		if(static) {
			this.static = true;
			this.pickup = (function(){});
			this.text = 'x';
		}
		else if(this.cost) {
			this.text = '-'+Number(this.cost);
		}
		else this.text = '';
		this.parent(x,y,room);
	}
	,reveal: function(){
		this.text = '';
		if (this.worth != 0)
			this.text = (this.worth > 0 ? '+' : '') + String(this.worth);
		this.pickup = (function(){});
	}
	,pickup: function(that) {
		if(that.getRupees() < this.cost) return;
		Array.each(this.currentRoom.rupees, function(o) {
			o.reveal();
		});
		
		new RupeeCountEvent(that, this.worth);
	}
	,draw: function() {
		this.parent();
		if(this.static) {
			writeText(this.text, this.x+(HALFSPRITE*1.5), this.y+(HALFSPRITE/2));
		}
		else {
			writeText(this.text, this.x-HALFSPRITE-(HALFSPRITE/2)+(this.text.length < 3 ? HALFSPRITE : 0), this.y+SPRITESIZE+HALFSPRITE);
		}
	}
});

var puMidRupee = new Class({
	Extends: puRupee
	,name: 'MidRupee'
	,paletteFrames: [3]
	,worth: 5
});

var puHeart = new Class({
	Extends: Mob
	,name: 'Heart'
	,acDelta: 0
	,palette: 2
	,width: HALFSPRITE
	,height: HALFSPRITE
	,msPerFrame: 150
	,sprite:'FullHeart'
	,isFriendly: true
	,price: null
	,defaultPalette: 2
	,expire: 10000
	,lastUpdateTime: 0
	,initialize: function(x,y,room,expire,price) {
		this.parent(x,y,room);
		if(typeof expire != undefined) this.expire = expire;
		if(typeof price != undefined) this.price = price;
		this.isFriendly = true;
		if(this.expire) (function(){this.destroy();}).delay(this.expire, this);
	}
	,pickup: function(that) {
		if(this.price) {
			if(that.getRupees() < this.price) return false;
			that.addRupees(-this.price);
		}

		that.addHealth(1);
		this.destroy();
		return true;
	}
	,move: function() {
		var delta = Date.now() - this.lastUpdateTime;
	
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			this.palette = this.palette == 2 ? 3 : 2;
		}

		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		this.parent();
		if(this.price) {
			writeText(String(this.price), this.x-(HALFSPRITE), this.y+SPRITESIZE+HALFSPRITE);
		}
	}
});

var puBomb = new Class({
	Extends: Mob
	,name: 'Bomb'
	,sprite: 'Bomb'
	,palette: 2
	,width: HALFSPRITE
	,height: 16
	,worth: 1
	,price: null
	,expire: 10000
	,isFriendly: true
	,initialize: function(x,y,room,expire, worth, price) {
		this.parent(x,y,room);
		if(expire != undefined) this.expire = expire
		if(worth != undefined) this.worth = worth
		if(price != undefined) this.price = price
		
		if(this.expire)
			(function(){this.destroy();}).delay(this.expire, this);
	}
	,pickup: function(that) {
		if(this.price) {
			if(that.getRupees() < this.price) return false;
			new RupeeCountEvent(that, -this.price);
		}
		that.addBombs(this.worth);
		this.destroy();
		return true;
	}
	,draw: function() {
		this.parent();
		if(this.price && !this.isFading) {
			writeText(' '+String(this.price), this.x-(HALFSPRITE*1.5), this.y+SPRITESIZE+HALFSPRITE);
		}
	}
});

var puArrow = new Class({
	Extends: Mob
	,name: 'Arrow'
	,sprite: 'Arrow'
	,palette: 0
	,width: 5
	,height: 16
	,worth: 1
	,direction: 270
	,price: 80
	,expire: null
	,isFriendly: true
	,initialize: function(x,y,room,expire, worth, price) {
		this.parent(x,y,room);
		if(expire != undefined) this.expire = expire
		if(worth != undefined) this.worth = worth
		if(price != undefined) this.price = price
		
		if(this.expire)
			(function(){this.destroy();}).delay(this.expire, this);
	}
	,pickup: function(that) {
		if(this.price) {
			if(that.getRupees() < this.price) return false;
			new RupeeCountEvent(that, -this.price);
			new LinkGainItem('Arrow', {direction: 270, palette: this.palette});
		}
		that.items.arrow=1;
		this.destroy();
		return true;
	}
	,draw: function() {
		this.parent();
		if(!this.isFading)
			writeText(' '+String(this.price), this.x-(HALFSPRITE)-6, this.y+SPRITESIZE+HALFSPRITE);
	}
});

var puBow = new Class({
	Extends: Mob
	,name: 'Bow'
	,sprite: 'Bow'
	,width: HALFSPRITE
});

var puRaft = new Class({
	Extends: Mob
	,name: 'Raft'
	,sprite: 'Raft'
	,width: SPRITESIZE
});

var movableBlock = new Class({
	Extends: Mob
	,sprite: 'MovableBlock'
	,direction: 0
	,isFriendly: true
	,wasMoved: false
	,canPassThru: function(that, tx, ty) {
		var curDistance = Math.sqrt(Math.pow(this.x-that.x,2) + Math.pow(this.y-that.y,2))
			newDistance = Math.sqrt(Math.pow(this.x-tx,2) + Math.pow(this.y-ty,2));
		if(this.collidesWith(that) && newDistance < curDistance-1) {
			if(!this.wasMoved && (this.direction == '*' || this.direction == that.direction)) {
				this.x += Math.cos(that.direction * Math.PI/180)*SPRITESIZE;
				this.y += Math.sin(that.direction * Math.PI/180)*SPRITESIZE;
				this.wasMoved = true;
				this.onMove();
			}
			return false;
		}
		return true;
	}
	,onMove: function(){

	}
});

var Door = new Class({
	Extends: Mob
	,isFriendly: true
	,name: 'Door'
	,x: 0
	,y: 0
	,direction: 0
	,sprite: 298
	,state: 'Open'
	,paletteType: 'dungeon'
	,defaultPalette: 0
	,palette: 0

	,initialize: function(x,y,room) {
		var xPost = {0: 14*SPRITESIZE, 90: 7.5*SPRITESIZE, 180: 1*SPRITESIZE, 270: 7.5*SPRITESIZE}
			,yPost = {0: 9*SPRITESIZE, 90: 13*SPRITESIZE, 180: 9*SPRITESIZE, 270: 5*SPRITESIZE};

		if(!room.doors) room.doors = {};
		room.doors[this.direction] = this;
		this.x = xPost[this.direction];
		this.y = yPost[this.direction];

		this.parent(this.x,this.y,room);
	}
	,canPassThru: function(that, tx, ty) {
		this.unlock(that);
		return this.state == 'Open';
	}
	,unlock: function(that) {
		if(this.state == 'Locked' && that.items.keys > 0) {
			that.items.keys -= 1; 
			this.state = 'Open';
		}
	}
	,draw: function() {
		if(typeof rooms.palette != 'undefined') {
			this.palette = rooms.palette;
		}
		this.sprite = 'Door'+this.state;
		this.parent();
	}
});

var DoorEast = new Class({
	Extends: Door
	,direction: 0
	,canPassThru: function(that, tx, ty) {
		if(tx < this.x-that.width+1 || tx < that.x) return true;

		if(!this.parent(that, tx, ty)) return false;

		if(ty < this.y-5 || ty+that.height > this.y+this.height+5) return false;
		if(tx > this.x) {
			if(!rooms.exists(that.currentRoom.row, that.currentRoom.col+1)) {console.log('Room not found');return false;}
			that.currentRoom = switchRoom(that.currentRoom.row, that.currentRoom.col+1);
			that.x = SPRITESIZE;
			return false;

		}
		return this.state == 'Open';
	}
});

var LockedDoorEast = new Class({
	Extends: DoorEast
	,state: 'Locked'
});

var ShutDoorEast = new Class({
	Extends: DoorEast
	,state: 'Shut'
});

var DoorSouth = new Class({
	Extends: Door
	,direction: 90
	,canPassThru: function(that, tx, ty) {
		if(ty < this.y-that.height+1 || ty < that.y) return true;

		if(!this.parent(that, tx, ty)) return false;

		if(tx < this.x-5 || tx+that.width > this.x+this.width+5) return false;
		if(ty > this.y) {
			if(!rooms.exists(that.currentRoom.row+1, that.currentRoom.col)) {console.log('Room not found');return false;}
			that.currentRoom = switchRoom(that.currentRoom.row+1, that.currentRoom.col);
			that.y = 5*SPRITESIZE;
			return false;
		}

		return this.state == 'Open';
	}
});

var LockedDoorSouth = new Class({
	Extends: DoorSouth
	,state: 'Locked'
});

var ShutDoorSouth = new Class({
	Extends: DoorSouth
	,state: 'Shut'
});

var DoorWest = new Class({
	Extends: Door
	,direction: 180
	,canPassThru: function(that, tx, ty) {
		if(tx > this.x + this.width-1 || tx > that.x) return true;

		if(!this.parent(that, tx, ty)) return false;

		if(ty < this.y-5 || ty+that.height > this.y+this.height+5) return false;

		if(tx < this.x) {
			if(!rooms.exists(that.currentRoom.row, that.currentRoom.col-1)) {console.log('Room not found');return false;}
			that.currentRoom = switchRoom(that.currentRoom.row, that.currentRoom.col-1);
			that.x = (that.currentRoom.roomWidth-1)*SPRITESIZE-SPRITESIZE;
			return false;

		}
		return this.state == 'Open';
	}
});

var LockedDoorWest = new Class({
	Extends: DoorWest
	,state: 'Locked'
});
var ShutDoorWest = new Class({
	Extends: DoorWest
	,state: 'Shut'
});

var DoorNorth = new Class({
	Extends: Door
	,direction: 270
	,canPassThru: function(that, tx, ty) {
		if(ty > this.y + this.height-1 || ty > that.y) return true;

		if(!this.parent(that, tx, ty)) return false;

		if(tx < this.x-5 || tx+that.width > this.x+this.width+5) return false;
		if(ty < this.y) {
			if(!rooms.exists(that.currentRoom.row-1, that.currentRoom.col)) {console.log('Room not found');return false;}
			that.currentRoom = switchRoom(that.currentRoom.row-1, that.currentRoom.col);
			that.y = (that.currentRoom.roomHeight+4-1)*SPRITESIZE-SPRITESIZE;
			return false;
		}

		return this.state == 'Open';
	}
});
var LockedDoorNorth = new Class({
	Extends: DoorNorth
	,state: 'Locked'
});
var ShutDoorNorth = new Class({
	Extends: DoorNorth
	,state: 'Shut'
});

var BombHole = new Class({
	Extends: Mob
	,name: 'BombHole'
	,isFriendly: false
	,x: 0
	,y: 0
	,sprite: 'BombHole'
	,direction: 0
	,hasBeenBombed: false
	,initialize: function(x,y,room) {
		var xPost = {0: 14*SPRITESIZE, 90: 7.5*SPRITESIZE, 180: 1*SPRITESIZE, 270: 7.5*SPRITESIZE}
			,yPost = {0: 9*SPRITESIZE, 90: 13*SPRITESIZE, 180: 9*SPRITESIZE, 270: 5*SPRITESIZE};
		this.x = xPost[this.direction];
		this.y = yPost[this.direction];

		this.parent(this.x,this.y,room);
	}
	,canPassThru: function(that, tx, ty) {
		if(!that.collidesWith(this, tx, ty)) return false;
		return this.hasBeenBombed;
	}
	,impact: function(that, damage, type) {
		this.hasBeenBombed = true;
		this.isFriendly = true;
	}
	,draw: function() {
		if(this.hasBeenBombed) {
			this.parent();
		}
	}
});
var BombHoleNorth = new Class({
	Extends: BombHole
	,direction: 270
	,canPassThru: function(that, tx, ty) {
		if(!this.parent(that, tx, ty)) return false;

		if(tx < this.x-5 || tx+that.width > this.x+this.width+5) return false;
		if(ty < this.y) {
			if(!rooms.exists(that.currentRoom.row-1, that.currentRoom.col)) {console.log('Room not found');return false;}
			that.currentRoom = switchRoom(that.currentRoom.row-1, that.currentRoom.col);
			that.y = (that.currentRoom.roomHeight+4-1)*SPRITESIZE-SPRITESIZE;
			return false;
		}

		return this.hasBeenBombed;
	}
});

var BombHoleSouth = new Class({
	Extends: BombHole
	,direction: 90
	,canPassThru: function(that, tx, ty) {
		if(!this.parent(that, tx, ty)) return false;

		if(tx < this.x-5 || tx+that.width > this.x+this.width+5) return false;
		if(ty > this.y) {
			if(!rooms.exists(that.currentRoom.row+1, that.currentRoom.col)) {console.log('Room not found');return false;}
			that.currentRoom = switchRoom(that.currentRoom.row+1, that.currentRoom.col);
			that.y = 5*SPRITESIZE;
			return false;
		}

		return this.hasBeenBombed;
	}
});

var BombHoleEast = new Class({
	Extends: BombHole
	,direction: 0
	,canPassThru: function(that, tx, ty) {
		if(tx < this.x-that.width+1 || tx < that.x) return true;

		if(!this.parent(that, tx, ty)) return false;


		if(ty < this.y-5 || ty+that.height > this.y+this.height+5) return false;
		if(tx > this.x) {
			if(!rooms.exists(that.currentRoom.row, that.currentRoom.col+1)) {console.log('Room not found');return false;}
			that.currentRoom = switchRoom(that.currentRoom.row, that.currentRoom.col+1);
			that.x = SPRITESIZE;
			return false;

		}
		return this.hasBeenBombed;
	}
});

var BombHoleWest = new Class({
	Extends: BombHole
	,direction: 180
	,canPassThru: function(that, tx, ty) {
		if(tx > this.x + this.width-1 || tx > that.x) return true;

		if(!this.parent(that, tx, ty)) return false;

		if(ty < this.y-5 || ty+that.height > this.y+this.height+5) return false;

		if(tx < this.x) {
			if(!rooms.exists(that.currentRoom.row, that.currentRoom.col-1)) {console.log('Room not found');return false;}
			that.currentRoom = switchRoom(that.currentRoom.row, that.currentRoom.col-1);
			that.x = (that.currentRoom.roomWidth-1)*SPRITESIZE-SPRITESIZE;
			return false;

		}
		return this.hasBeenBombed;
	}
});