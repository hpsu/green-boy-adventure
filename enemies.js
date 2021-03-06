var Enemy = new Class({
	Extends: Mob
	,animFrame: 0
	,acDelta: 0
	,lastUpdateTime:0
	,initialize: function(x,y,room) {
		this.mobSprite = this.sprite;
		this.parent(x,y,room);
	}
	,die: function() {
		new EnemyDeath(this.x, this.y);
		this.destroy();
	}
	,spawn: function() {
		this.sprite = 'EnemySpawn';
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		if(this.acDelta > (this.animFrame == 0 ? 800 : 100)) {
			if(++this.animFrame >= 3) {
				this.spawning = false; 
				return false;
			}
			this.acDelta = 0;

		}
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
		return true;
	}
	,move: function() {
		if(this.spawning) {
			return this.spawn();
		} else {
			this.sprite = this.mobSprite;
			return false;
		}
	}
});

/**
 * Mob Projectile - Base Projectile class
 ****************************************
 * 
 */
var Projectile = new Class({
	Extends: Mob
	,movementRate: 3.5
	,rotatePalette: false
	,initialize: function(ancestor) {
		this.ancestor = ancestor;
		this.x = ancestor.x;
		this.y = ancestor.y;
		this.parent(this.x,this.y,ancestor.currentRoom);
		this.x += (ancestor.width-this.width)/2;
		this.y += (ancestor.height-this.height)/2;
		this.direction = ancestor.direction;
	}
	,impact: function() {return false;}
	,move: function() {
		if(rooms.getCurrentRoom() != this.currentRoom) return;

		this.x += Math.cos(this.direction * Math.PI/180) * this.movementRate;
		this.y += Math.sin(this.direction * Math.PI/180) * this.movementRate;
		
		var xTile = this.x/SPRITESIZE;
		var yTile = (this.y/SPRITESIZE)-4; // -4 is accounting for the header
		switch(this.direction) {
			case 0: // right
				xTile = Math.ceil(xTile);
				yTile = Math.round(yTile)
				break;
			case 180: // left
				xTile = Math.floor(xTile);
				yTile = Math.round(yTile);
				break;
			case 90: // down
				xTile = Math.round(xTile);
				yTile = Math.ceil(yTile);
				break;
			case 270:
				xTile = Math.round(xTile);
				yTile = Math.floor(yTile);
				break;
			default: 
				xTile = Math.round(xTile);
				yTile = Math.round(yTile);
		}

		if(xTile < 1 || xTile > this.currentRoom.roomWidth-2 
		|| yTile < 1 || yTile > this.currentRoom.roomHeight-2
		|| (this.tileBlock && this.currentRoom.getTile(yTile,xTile).isSolid)) {
			this.destroy();
		}

		Array.each(solidObjects, function(that){
			if(that != this && that.isFriendly && this.collidesWith(that)) {
				that.impact(this.damage, this.direction);
				this.destroy();
			}
		},this);


		if(this.rotatePalette && ++this.palette > env.palettes['main'].length-1)
			this.palette=0;
	}
});


/**
 * Mob FireBall - A fireball spat by RiverZora
 *********************************************
 * Aims for player. Isn't destroyed on tile impact. Cannot be absorbed by standard shield
 * @TODO: Magical shield can deflect these
 * @TODO: Stupify angle. It shouldn't hit dead center every time
 * 
 */
var FireBall = new Class({
	Extends: Projectile
	,damage: 0.5
	,movementRate: 1.5
	,sprite: 'Fireball'
	,lockRotation: true
	,tileBlock: false
	,width:8
	,palette: 0
	,height: 10
	,rotatePalette: true
	,initialize: function(ancestor, offsetY) {
		if(!offsetY) offsetY = 0;
		this.parent(ancestor);
		this.direction = Math.round(Math.atan2(env.player.y - offsetY - this.y, env.player.x - this.x) * 180 / Math.PI);
	}
});


/**
 * Mob RockProjectile - Rock spat by Octorok
 *********************************************
 * Destroyed on tile collision
 */

var RockProjectile = new Class({
	Extends: Projectile
	,sprite: 'RockProjectile'
	,width:8
	,height: 10
	,damage: 0.5
	,lockRotation: true
	,tileBlock: true
});

/**
 * Mob MagicProjectile - Thingy shot by Wizzrobe
 *********************************************
 * Destroyed on tile collision
 */
var MagicProjectile = new Class({
	Extends: Projectile
	,damage: 3
	,sprite: 'MagicProjectile'
	,defaultPalette: 2
	,palette: 2
	,rotatePalette: true
});

/**
 * Mob ArrowProjectile - Arrow shot by Moblin
 ********************************************
 * Not bothered by tile collision
 * Creates ArrowWake on destruction
 */
var ArrowProjectile = new Class({
	Extends: Projectile
	,damage: 0.5
	,sprite: 'Arrow'
	,width: 16
	,height: 5
	,tileBlock: false
	,initialize: function(ancestor) {
		if(ancestor.direction % 180) {
			this.width = 5;
			this.height = 16;
		}
		this.parent(ancestor);
	}
	,destroy: function() {
		new ArrowWake(this.x, this.y);
		this.parent();
	}
});

/**
 * Mob BoomerangProjectile - Boomerang shot by Gorya
 ***************************************************
 * Changes to opposite direction about half way through and returns to caster
 */
var BoomerangProjectile = new Class({
	Extends: Projectile
	,movementRate: 2
	,damage: 1
	,sprite: 'Boomerang'
	,acDelta: 0
	,rotation: 0
	,turnCount: 0
	,tileBlock: false
	,destroy: function() {
		if(this.turnCount) {
			this.ancestor.passive=false;
			this.parent();
		}
		else {
			new ArrowWake(this.x, this.y);
			this.direction = 180 + this.direction % 360;
			this.turnCount++;
		}
	 }
	,move: function() {
		var delta = Date.now() - this.lastUpdateTime;
		this.parent();
		if(this.turnCount && this.collidesWith(this.ancestor)) this.destroy();
		else if(!this.turnCount && Math.sqrt(Math.pow(this.x-this.ancestor.x,2) + Math.pow(this.y-this.ancestor.y,2)) > SPRITESIZE*5 ) {
			this.direction = 180 + this.direction % 360;
			this.turnCount++;
		}
		if(this.acDelta > 50) {
			this.acDelta = 0;
			this.rotation = (30 + this.rotation % 360);
		}

		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});


/**
 * Mob SwordProjectile - Sword thrown by Lynel
 ********************************************
 * Not bothered by tile collision
  */
var SwordProjectile = new Class({
	Extends: Projectile
	,damage: 2
	,sprite: 'Sword'
	,palette: 0
	,rotatePalette: true
	,tileBlock: false
});


/**
 * Mob ArrowWake - Tiny impact visual
 ************************************
 * Not bothered by tile collision
 * Creates ArrowWake on destruction
 */
var ArrowWake = new Class({
	Extends: Mob
	,sprite: 'ArrowWake'
	,impact: function() {return false;}
	,initialize: function(x,y) {
		this.parent(x,y);
		(function(o){o.destroy();}).pass(this).delay(100);
	}
});

/**
 * Enemy Tektite
 *******************************************
 * Jumps randomly left or right, landing 
 * Not bothered by tile collision
 * Can land at different y positions than the jump started
 * @TODO: BUGFIX Seems to randomly jump outside of the top part of the screen
 */
var Tektite = new Class({
	Extends: Enemy
	,velocityX: 1.0
	,velocityY: 0.0
	,msPerFrame: 10
	,gravity: 0.5
	,damage: 0.5
	,health: 0.5
	,startY: 0
	,targetY: 0
	,sprite: 'Tektite'
	,animFrame:0
	,defaultPalette: 2
	,isJumping: false
	,initialize: function(x,y) {
		this.parent(x,y);
		this.palette = this.defaultPalette;
		this.jump();
	}
	,jump: function() {
		this.isJumping = true;
		this.velocityY = -5.0;
		var infCnt = 0
		this.startY = this.y;

		do {
			this.targetY = this.y+Number.random(-SPRITESIZE,SPRITESIZE);
		} while((this.targetY <= 4*SPRITESIZE || this.targetY >= 14*SPRITESIZE) && ++infCnt <100 );

		if(infCnt >= 100) {
			this.targetY = this.startY;
		}

		this.animFrame=1;
		if(Number.random(0,1) == 1) {
			this.velocityX *= -1;
		}
	}
	,stopJump: function() {
		this.velocityY = 0;
		this.isJumping=false;
		this.animFrame=0;
		(function(ob){ob.jump();}).pass(this).delay(Number.random(100,1000));
	}
	,move: function() {
		if(this.parent()) return;
		var delta = Date.now() - this.lastUpdateTime;
		if(this.isJumping && this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			this.velocityY += this.gravity;
			this.y += this.velocityY;
			this.x += this.velocityX;
			
			if(this.y >= this.targetY && this.velocityY >0) {
				this.y = this.targetY;
				this.stopJump();
			}
			else if(this.x > (this.currentRoom.roomWidth*SPRITESIZE)-SPRITESIZE-(SPRITESIZE/2)
			|| this.x <HALFSPRITE) {
				this.y -= this.velocityY;
				this.x -= this.velocityX;
				this.stopJump();
			}
		}
		Array.each(solidObjects, function(that){
			if(that != this && that.isFriendly && this.collidesWith(that)) {
				var direction = (360+Math.floor( Math.atan2(env.player.y - this.y, env.player.x - this.x) * 180 / Math.PI /90 )*90)%360;

				that.impact(this.damage, direction);
			}
		},this);
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

/**
 * Tektite BlueTektite
 *******************************************
 * Works exactly the same as regular Tektite
 * @TODO: Different loot-table?
 */
var BlueTektite = new Class({
	Extends: Tektite
	,defaultPalette: 3
});


/**
 * Enemy Leever
 *******************************************
 * Follows player on either x or y axis
 * Reverses direction on impact with player
 * Burrows on impact with tiles
 */
var Leever = new Class({
	Extends: Enemy
	,animFrame: 0
	,damage: 0.5
	,health: 1
	,defaultPalette: 2
	,msPerFrame: 50
	,msPerPalette: 30
	,movementRate: .5
	,acPaletteDelta: 0
	,acDirDelta: 0
	,acBurrowDelta: 0
	,lockRotation: true
	,state: 'upDive'
	,mode: 'follow'
	,direction: 0
	,sprite: 'LeeverDive'
	,frames: {
		upDive: [0,1,0,1,2,2]
		,downDive: [2,2,2,2,1,0,1,0]
		,normal: [0,1]
	}
	,frameCount: 0
	,initialize: function(x,y) {
		if(this.mode == 'follow') {
			if(!x) x = (Number.random(0,1) == 1 ? env.player.x : null);
			if(!y) y = x ? null : env.player.y;
			this.parent(x,y);
			this.findPlayerDirection(x,y);
		}
		else {
			this.parent(x,y);
			this.randomDirection();
		}
	}
	,findPlayerDirection: function(x,y) {
		this.direction = Math.atan2(env.player.y - y, env.player.x - x) * 180 / Math.PI;
	}
	,randomDirection: function() {
		this.direction = [0, 90, 180, 270][Number.random(0,3)];
	}
	,impact: function(damage, direction) {
		if(this.state == 'normal') {
			this.parent(damage, direction);
			if(![this.direction,(180+this.direction)%360].contains(direction))
				this.impactDirection = null;
		}
	}
	,move: function() {
		var delta = Date.now() - this.lastUpdateTime;

		if(this.state == 'normal') {
			if(this.mode=='random') {
				if(this.acBurrowDelta > this.msPerFrame*Number.random(128,256)) { //@TODO: This randomization should be done elsewhere ofc
					this.acBurrowDelta = 0;
					this.state='downDive';
					this.frameCount = -1;
				}
				if(this.acDirDelta > this.msPerFrame*Number.random(16,32)) { //@TODO: This randomization should be done elsewhere ofc
					this.acDirDelta = 0;
					this.randomDirection();
				}
			}
			if(this.isImmune && this.impactDirection !== null && this.acImpactMove < 2*SPRITESIZE) {
				if(!isNaN(this.impactDirection)) {
					this.x += Math.cos(this.impactDirection * Math.PI/180) * (this.movementRate*3);
					this.y += Math.sin(this.impactDirection * Math.PI/180) * (this.movementRate*3);
					this.acImpactMove += this.movementRate;
				}
			}
			else {
				this.x += Math.cos(this.direction * Math.PI/180) * this.movementRate;
				this.y += Math.sin(this.direction * Math.PI/180) * this.movementRate;
			}

			xTile = this.x/SPRITESIZE;
			yTile = (this.y/SPRITESIZE)-4; // -4 is accounting for the header
			
			switch(this.direction) {
				case 0: // right
					xTile = Math.ceil(xTile);
					yTile = Math.round(yTile)
					break;
				case 180: // left
					xTile = Math.floor(xTile);
					yTile = Math.round(yTile);
					break;
				case 90: // down
					xTile = Math.round(xTile);
					yTile = Math.ceil(yTile);
					break;
				case 270:
				case -90: // up
					xTile = Math.round(xTile);
					yTile = Math.floor(yTile);
					break;
			}

			if(window.collisionDebug) filledRectangle(this.x, this.y, this.width, this.height, '#f00');
			if(window.collisionDebug) filledRectangle(xTile*SPRITESIZE, (yTile+4)*SPRITESIZE, SPRITESIZE, SPRITESIZE, '#00f');
			
			Array.each(solidObjects, function(that){
				if(that != this && that.isFriendly && this.collidesWith(that)) {
					that.impact(this.damage, this.direction);
					if(this.mode == 'follow')
						this.direction = (180 + this.direction) % 360;
				}
			},this);
			
			
			if(xTile < 1 || xTile > this.currentRoom.roomWidth-2 
			|| yTile < 1 || yTile > this.currentRoom.roomHeight-2
			|| this.currentRoom.getTile(yTile,xTile).isSolid) {
				if(this.mode == 'follow') {
					this.state='downDive';
					this.frameCount = -1;
				}
				else this.randomDirection();
			}
		}

		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			
			if(this.state == 'upDive' && this.frameCount >= 4) {
				this.state='normal';
				this.frameCount = -1;
			}
			else if(this.state == 'downDive' && this.frameCount >= 7) {
				if(this.mode == 'follow') {
					var x = (Number.random(0,1) == 1 ? env.player.x : null);
					var y = x ? null : env.player.y;
					if(!this.moveToRandomNonSolidTile(x,y)) return;
					this.direction = Math.atan2(env.player.y - this.y, env.player.x - this.x) * 180 / Math.PI;
				}
				else {
					this.randomDirection();
				}
				this.state = 'upDive';
				this.frameCount = -1;
			}

			this.frameCount++;
			this.animFrame = this.frames[this.state][this.frameCount%this.frames[this.state].length];
			this.sprite = this.state == 'normal' ? 'Leever' : 'LeeverDive';

		}
		if(this.acPaletteDelta > this.msPerPalette) {
			if(this.isImmune){
				if(++this.palette >= env.palettes['main'].length) this.palette = 0;
			}
			else this.palette = this.defaultPalette;
		}
		this.acDelta+=delta;
		this.acPaletteDelta += delta;
		this.acDirDelta += delta;
		this.acBurrowDelta += delta;
		this.lastUpdateTime = Date.now();


	}
});
/**
 * Leever BlueLeever
 *******************************************
 * Moves just like Octorok
 * Takes double damage from regular Leever
 * Changes direction on impact with tiles
 * @TODO: Stay burrowed longer
 */
var BlueLeever = new Class({
	Extends: Leever
	,health: 2
	,damage: 1
	,mode: 'random'
	,defaultPalette: 3
});


/**
 * Enemy RiverZora
 *******************************************
 * Appears on random water tile
 * Shoots FireBall directed at player
 * Dives to avoid damage
 */
var RiverZora = new Class({
	Extends: Enemy
	,animFrame: 0
	,msPerFrame: 110
	,damage: 0.5
	,health: 2
	,direction: 90
	,state: 'upDive'
	,frames: {
		upDive: [76,77]
		,downDive: [76,77]
		,down: [79]
		,up: [78]
	}
	,sprite: 'Dive'
	,frameCount: 0
	,initialize: function() {
		this.parent(0,0);
		this.moveToRandomWaterTile();
	}
	,impact: function(damage, direction) {
		if(this.state == 'normal') {
			return this.parent(damage, direction);
		}
		return false;
	}
	,moveToRandomWaterTile: function() {
		var infCnt = 0;
		do{
			xTile = Number.random(1, this.currentRoom.roomWidth-2);
			yTile = Number.random(1, this.currentRoom.roomHeight-2);
			if(window.collisionDebug) filledRectangle(xTile*SPRITESIZE, (yTile+4)*SPRITESIZE, this.width, this.height, "#f0f");
			if(++infCnt >100)
				return false;
		} while(![34, 35, 36, 37, 38, 39, 40, 41, 42].contains(this.currentRoom.getTile(yTile, xTile).sprite));
		this.x = xTile*SPRITESIZE;
		this.y = (yTile+4)*SPRITESIZE;
	}
	,move: function() {

		var delta = Date.now() - this.lastUpdateTime;

		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(this.state == 'normal' || ++this.animFrame >= 2) {
				this.animFrame = 0;
			}
			
			if(this.state == 'upDive' && this.frameCount >= 4) {
				this.state = 'normal';
				this.direction = env.player.y >= this.y ? 90 : 270;
				this.frameCount = -1;
				new FireBall(this);
			}
			else if(this.state == 'downDive' && this.frameCount >= 8) {
				this.moveToRandomWaterTile();
				this.state = 'upDive';
				this.frameCount = -1;
			}
			else if(this.state == 'normal' && this.frameCount >= 16) {
				this.state = 'downDive';
				this.frameCount = -1;
			}
			this.frameCount++;
			if(this.isImmune && this.state == 'normal') {
				if(++this.palette > 3) this.palette = 0;
			}
			else {
				this.palette = 1;
			}

			if(this.state == 'normal') {
				this.sprite = 'Zora';
				this.lockRotation = false;
			}
			else {
				this.sprite = 'Dive';
				this.lockRotation = true;
			}
		}
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

/**
 * Enemy Peahat
 *******************************************
 * Moves freely, not bothering with tile collision
 * Randomly changes direction in 45 degree increments
 * Alters speed, only killable when still
 */
var Peahat = new Class({
	Extends: Enemy
	,health: 1
	,damage:0.5
	,sprite: 'Peahat'
	,msPerPalette: 50
	,killableOnMove: false
	,acPaletteDelta: 0
	,acDirDelta: 0
	,defaultPalette: 2
	,palette: 2
	,direction: 0
	,animFrame: 0
	,moveRate: 1
	,stateFrame: 0
	,msSpeed:0
	,lockRotation: true
	,accelAdd: 1.5
	,state: 0 // Acceleration, flight, deceleration, rest
	,initialize: function(x,y,room) {
		this.parent(x,y,room);
		this.randomDirection();
	}
	,impact: function(damage, direction) {
		if(this.state == 3 || this.killableOnMove) {
			this.parent(damage,direction);
		}
	}
	,randomDirection: function() {
		directions = [0, 45, 90, 135, 180, 225, 270, 315];
		this.direction = directions[Number.random(0,directions.length-1)];
	}
	,move: function() {
		if(this.parent()) return;
		var delta = Date.now() - this.lastUpdateTime;

		if(this.isImmune && this.acPaletteDelta > this.msPerPalette) {
			this.acPaletteDelta = 0;
			if(++this.palette > 3) this.palette = 0;
		}
		if(!this.isImmune) {
			this.palette = this.defaultPalette;
		}

		if(this.acDirDelta > this.msPerFrame*Number.random(64,256)) { // @TODO: Random somewhere else
			this.acDirDelta = 0;
			this.randomDirection();
		}

		if(this.acDelta > this.msPerFrame-this.msSpeed) {
			this.acDelta = 0;
			switch(this.state) {
				case 0:
					if(this.msSpeed >= 90) {
						this.state = 1;
						this.stateFrame = 0;
						this.stateTime = Number.random(0, 5000)
					}
					else {
						this.msSpeed+=this.accelAdd;
					}
					break;
				case 1:
					if(this.stateFrame >= this.stateTime) {
						this.state = 2;
						this.stateFrame = 0;
					}
					break;
				case 2:
					if(this.msSpeed < 0) {
						this.state = 3;
						this.stateFrame = 0
						this.stateTime = Number.random(0, 5000)
					}
					else {
						this.msSpeed-=this.accelAdd;
					}
					break;
				case 3:
					if(this.stateFrame >= this.stateTime) {
						this.state = 0;
						this.stateFrame = 0;
					}
					break;
			}
			if(this.state != 3) {
				if(++this.animFrame >= 2) this.animFrame=0;
				this.x += Math.cos(this.direction * Math.PI/180) * this.moveRate;
				this.y += Math.sin(this.direction * Math.PI/180) * this.moveRate;
			}

			if(this.x > (this.currentRoom.roomWidth*SPRITESIZE)-SPRITESIZE-HALFSPRITE
			|| this.y < SPRITESIZE*4
			|| this.x < HALFSPRITE
			|| this.y > SPRITESIZE*14) {
				this.x -= Math.cos(this.direction * Math.PI/180) * this.moveRate;
				this.y -= Math.sin(this.direction * Math.PI/180) * this.moveRate;
				this.randomDirection();
			}
		}

		Array.each(solidObjects, function(that){
			if(that.isFriendly && this.collidesWith(that)) {
				that.impact(this.damage, this.direction);
			}
		},this);

		this.stateFrame+=delta;
		this.acDelta+=delta;
		this.acDirDelta+=delta;
		this.acPaletteDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

/**
 * Enemy RandomMob - Standard arguments 
 */
var RandomMob = new Class({
	Extends: Enemy
	,animFrame: 0
	,lastUpdateTime: 0
	,msPerFrame: 110
	,msPerPalette: 20
	,acPaletteDelta: 0
	,acDelta: 0
	,projectile: null
	,movementRate: 0.5
	,passiveToProjectileDeath: false
	,dirDelta: 0
	,passive: false
	,rockDelta: 0
	,defaultPalette: 0
	,direction: 90
	,palette: 0
	,impact: function(damage, direction) {
		direction = (direction == this.direction || this.direction == 180-direction ? direction : null);
		this.parent(damage, direction);
	}
	,flytta: function(direction) {
		var tx = this.x + Math.cos(direction * Math.PI/180) * this.movementRate;
		var ty = this.y + Math.sin(direction * Math.PI/180) * this.movementRate;

		var xTile = tx/SPRITESIZE;
		var yTile = (ty/SPRITESIZE)-4; // -4 is accounting for the header
		switch(direction) {
			case 0: // right
				xTile = Math.ceil(xTile);
				yTile = Math.round(yTile)
				break;
			case 180: // left
				xTile = Math.floor(xTile);
				yTile = Math.round(yTile);
				break;
			case 90: // down
				xTile = Math.round(xTile);
				yTile = Math.ceil(yTile);
				break;
			case 270:
			case -90: // up
				xTile = Math.round(xTile);
				yTile = Math.floor(yTile);
				break;
		}

		if(xTile < 1 || xTile > this.currentRoom.roomWidth-2 
		|| yTile < 1 || yTile > this.currentRoom.roomHeight-2
		|| this.currentRoom.getTile(yTile,xTile).isSolid) {
			this.randomDirection();
			return;
		}

		this.x = tx;
		this.y = ty;

		Array.each(solidObjects, function(that){
			if(that != this && that.isFriendly && this.collidesWith(that)) {
				that.impact(this.damage, direction);
			}
		},this);

	}
	,move: function() {
		if(this.parent()) return;
		var delta = Date.now() - this.lastUpdateTime;

		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;

			if(++this.animFrame >= this.maxAnimFrames) this.animFrame=0;
		}

		if(this.isImmune) {
			if(this.acPaletteDelta > this.msPerPalette) {
				this.acPaletteDelta = 0;
				if(++this.palette > 3) this.palette = 0;
			}
		}
		else 
			this.palette = this.defaultPalette;


		if(!this.passive && this.dirDelta > this.msPerFrame*Number.random(16,32)) {
			this.dirDelta = 0;
			this.randomDirection();
		}
		
		if(this.projectile && this.rockDelta > this.msPerFrame*Number.random(32,64)) {
			this.rockDelta = 0;
			this.passive=true;
			if(!this.passiveToProjectileDeath)
				(function(o){o.passive=false}).pass(this).delay(500);
			new this.projectile(this);
		}

		//skuffa
		if(this.isImmune && this.impactDirection !== null && this.acImpactMove < 2*SPRITESIZE) {
			if(!isNaN(this.impactDirection)) {
				for(var i=0; i<6; i++) {
					this.flytta(this.impactDirection);
					this.acImpactMove += this.movementRate;
				}
			}
			else {
				console.log('Failed to skuffa', this.impactDirection);
			}
		}

		if(!this.passive)
			this.flytta(this.direction);

		this.dirDelta += delta;
		this.rockDelta += delta;
		this.acDelta+=delta;
		this.acPaletteDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,randomDirection: function() {
		directions = [0, 90, 180, 270];
		this.direction = directions[Number.random(0,3)];
	}
});

/**
 * Enemy Octorok
 *******************************************
 * Changes direction randomly or at tile collision. 
 * Regular shield can stop theier RockProjectils
 */
var Octorok = new Class({
	Extends: RandomMob
	,damage: 0.5
	,health: 0.5
	,maxAnimFrames: 2
	,sprite: 'Octorok'
	,defaultPalette: 2
	,projectile: RockProjectile
});

/**
 * Octorok BlueOctorok
 *******************************************
 * Same as regular Octorok but with double health
 */
var BlueOctorok = new Class({
	Extends: Octorok
	,health: 1
	,defaultPalette: 3
});

/**
 * Enemy Moblin
 *******************************************
 * Moves just like Octorok
 * Shoots arrows
 */
var Moblin = new Class({
	Extends: RandomMob
	,maxAnimFrames: 2
	,msPerFrame: 100
	,sprite: 'Moblin'
	,projectile: ArrowProjectile
	,damage: 0.5
	,defaultPalette: 2
	,health: 1
});

/**
 * Moblin BlueMoblin
 *******************************************
 * Same as regular Moblin but with .5 more health
 */
var BlueMoblin= new Class({
	Extends: Moblin
	,health: 1.5
	,defaultPalette: 1
});

/**
 * Enemy Lynel
 *******************************************
 * Moves just like Octorok, Moblin
 * Shoots swords
 */
var Lynel = new Class({
	Extends: RandomMob
	,maxAnimFrames: 2
	,defaultPalette: 2
	,projectile: SwordProjectile
	,damage: 1
	,health: 2
	,sprite: 'Lynel'
});

/**
 * Moblin BlueLynel
 *******************************************
 * Same as regular Lynel but with .5 more health
 */
var BlueLynel= new Class({
	Extends: Lynel
	,health: 3
	,damage: 2
	,defaultPalette: 3
});

/**
 * Enemy Ghini
 *******************************************
 * Moves just like Octorok, Moblin, Lynel
 */
var Ghini = new Class({
	Extends: RandomMob
	,maxAnimFrames: 1
	,projectile: null
	,damage: 1
	,defaultPalette: 3
	,health: 4.5
	,sprite: 'Ghini'
});

/**
 * Enemy Armos
 *******************************************
 * Solid statue that turns alive when touched
 * Randomly spawns with faster movement rate
 */
var Armos = new Class({
	Extends: RandomMob
	,isSolid: true
	,spawnCallback: null
	,tile: null
	,palette: 2
	,acFrameDelta: 0
	,sprite: 'Armos'
	,defaultPalette: 2
	,maxAnimFrames: 2
	,projectile: null
	,damage: 1
	,health: 1.5
	,initialize: function(x,y,room,tile, spawnCallback) {
		if(Number.random(0,3) == 3) {
			this.movementRate = 1.5;
		}
		if(tile) this.tile = tile;
		if(spawnCallback) this.spawnCallback = spawnCallback;
		this.parent(x,y,room);
	}
	,spawn: function() {
		this.isSolid = true;
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		if(this.acDelta > 40) {
			this.acDelta = 0;
			this.sprite = this.sprite == 'Armos' ? null : 'Armos';
		}
		if(this.acFrameDelta > (this.animFrame == 0 ? 800 : 100)) {
			if(++this.animFrame >= 3) {
				this.spawning = false; 
				this.isSolid = false;
				this.sprite = 'Armos';
				if(this.tile) {
					this.tile.sprite = -1;
					paintRoom();
				}
				if(this.spawnCallback) this.spawnCallback();
			}
			this.acFrameDelta = 0;

		}
		this.acFrameDelta+=delta;
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
		return true;

	}
});

/**
 * Enemy Staflos
 *******************************************
 */
var Staflos = new Class({
	Extends: RandomMob
	,maxAnimFrames: 2
	,projectile: null
	,damage: 0.5
	,name: "Staflos"
	,width:8
	,lockRotation: true
	,sprite: 'Staflos'
	,health: 1
	,defaultPalette: 2
});

/**
 * Enemy KeyStaflos
 *******************************************
 * Variant of the Staflos that carries a visible key
 * @TODO: Make key (all drops) immune for a while so that the sword does not instantly pick it up
 */
var KeyStaflos = new Class({
	Extends: Staflos
	,name: "KeyStaflos"
	,destroy: function() {
		this.parent();
		new puKey(Math.round(this.x+(HALFSPRITE/2)), Math.round(this.y),0);
	}
	,draw: function() {
		SpriteCatalog.draw('Key', Math.round(this.x+(HALFSPRITE/2)), Math.round(this.y));
		this.parent();
	}
});

var Keese = new Class({ 
	Extends: Peahat
	,name: "Keese"
	,health: 0.5
	,killableOnMove: true
	,sprite: 'Keese'
	,defaultPalette: 3
	,lockRotation: true
});

var Wizzrobe = new Class({
	Extends: RandomMob
	,damage: 1
	,health: 1.5
	,projectile: MagicProjectile
	,name: "Wizzrobe"
	,maxAnimFrames: 1
	,sprite: 'Wizzrobe'
	,defaultPalette: 2
	//,move: @TODO: Spawns like Red Leever but blinks instead of dive. Does not move
});

var Zol = new Class({
	//@TODO: slight movement pause between tiles
	//@TODO: Splits to two Gel() on 0.5 health
	Extends: RandomMob
	,damage: 1
	,health: 1
	,paletteType: 'dungeon'
	,defaultPalette: 2
	,name: 'Zol'
	,maxAnimFrames: 2
	,sprite: 'Zol'
	,lockRotation: true
	,initialize: function(x,y,room) {
		this.parent(x,y,room);
		this.palette = this.defaultPalette;
	}
	,move: function() {
		var delta = Date.now() - this.lastUpdateTime;

		if(typeof rooms.palette != 'undefined') this.defaultPalette = rooms.palette;

		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;

			if(++this.animFrame >= this.maxAnimFrames) this.animFrame=0;
		}

		if(this.isImmune) {
			if(this.acPaletteDelta > this.msPerPalette) {
				this.acPaletteDelta = 0;
				if(++this.palette > 3) this.palette = 0;
			}
		}
		else 
			this.palette = this.defaultPalette;


		if(this.dirDelta > this.msPerFrame*Number.random(16,32)) {
			this.dirDelta = 0;
			this.randomDirection();
		}
		
		if(this.projectile && this.rockDelta > this.msPerFrame*Number.random(32,64)) {
			this.rockDelta = 0;
			this.passive=true;
			(function(o){o.passive=false}).pass(this).delay(500);
			new this.projectile(this);
		}

		//skuffa
		if(this.isImmune && this.impactDirection !== null && this.acImpactMove < 4*HALFSPRITE) {
			if(!isNaN(this.impactDirection)) {
				for(var i=0; i<6; i++) {
					this.flytta(this.impactDirection);
					this.acImpactMove += this.movementRate;
				}
			}
			else {
				console.log('Failed to skuffa', this.impactDirection);
			}
		}

		if(!this.passive)
		this.flytta(this.direction);

		this.dirDelta += delta;
		this.rockDelta += delta;
		this.acDelta+=delta;
		this.acPaletteDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

var Gel = new Class({
	//@TODO: slight movement pause between tiles
	Extends: Zol
	,health: 0.5
	,damage: 0.5
	,msPerFrame: 55
	,name: 'Gel'
	,width: HALFSPRITE
	,height: 9
	,sprite: 'Gel'
});

/**
 *
 */
var Goriya = new Class({
	Extends: RandomMob
	,maxAnimFrames: 2
	,projectile: BoomerangProjectile
	,passiveToProjectileDeath: true
	,name: 'Goriya'
	,sprite: 'Goriya'
	,damage: 0.5
	,health: 1.5
	,defaultPalette: 2
});

var BlueGoriya = new Class({
	Extends: Goriya
	,name: 'BlueGoriya'
	,health: 2.5
	,damage: 1
	,defaultPalette: 3
});


var Wallmaster = new Class({
	// @TODO: Only swawn when near walls
	// @TODO: Can swallow you and bring your to start dungeon room
	Extends: RandomMob
	,maxAnimFrames: 2
	,name: 'Wallmaster'
	,damage: 0.5
	,health: 1.0
	,sprite: 'Wallmaster'
	,state: 'idle'
	,initialize: function(x, y, room) {
		this.parent(x,y,room);
	}
	,move: function(){
		this.parent();
	}
});

var BladeTrap = new Class({
	Extends: Enemy
	,sprite: 'BladeTrap'
	,movementRate: 2
	,damage: 1
	,direction: null
	,maxDistX: 5*SPRITESIZE
	,maxDistY: 3*SPRITESIZE
	,turnCount: 0
	,accuDistX: 0
	,accuDistY: 0
	,origX: 0
	,origY: 0
	,initialize: function(x,y,room){
		this.parent(x,y,room);
		this.origX = this.x;
		this.origY = this.y;
	}
	,move: function() {
		if(this.direction !== null){
			this.accuDistX += Math.cos(this.direction * Math.PI/180) * this.movementRate;
			this.accuDistY += Math.sin(this.direction * Math.PI/180) * this.movementRate;
			
			if(
				Math.abs(this.accuDistY) >= this.maxDistY 
				|| Math.abs(this.accuDistX) >= this.maxDistX
			) {
				this.accuDistX = 0;
				this.accuDistY = 0;
				if(this.turnCount++ == 0) {
					this.direction = (180 + this.direction) % 360;
					this.movementRate = 1;
				}
				else if(this.turnCount > 0) {
					this.direction = null;
					this.turnCount = 0;
					this.movementRate = 2;
				}
			} else {
				this.x += Math.cos(this.direction * Math.PI/180) * this.movementRate;
				this.y += Math.sin(this.direction * Math.PI/180) * this.movementRate;
				Array.each(solidObjects, function(that){
					if(that != this && that.isFriendly && this.collidesWith(that)) {
						that.impact(this.damage, this.direction);
					}
				},this);

			}
		} else {
			if(Math.round(this.x/10) == Math.round(env.player.x/10)) {
				if(this.y < env.player.y)
					this.direction = 90;
				else
					this.direction = 270;
			}
			else if (Math.round(this.y/10) == Math.round(env.player.y/10)){
				if(this.x < env.player.x)
					this.direction = 0;
				else
					this.direction = 180;
			}
		}
	}
});

var Rope = new Class({
	//@TODO: Move faster when in same x or y lane as Link
	Extends: RandomMob
	,maxAnimFrames: 2
	,msPerFrame: 200
	,defaultPalette: 2
	,name: 'Rope'
	,damage: 0.5
	,health: 0.5
	,sprite: 'Rope'
});

var StoneStatue = new Class({
	Extends: Mob
	,acDelta: 0
	,lastUpdateTime:0
	,msBetweenShots: 4000
	,move: function() {
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		if(this.acDelta > this.msBetweenShots) {
			new FireBall(this);
			this.acDelta = 0;
		}
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function(){}
});

var Aquamentus = new Class({
	Extends: RandomMob
	,width: 24
	,height: 32
	,maxAnimFrames: 2
	,msPerFrame: 200
	,movementRate: 0.15
	,name: 'Aquamentus'
	,damage: 1
	,acDirDelta: 0
	,health: 3
	,sprite: 'Aquamentus'
	,direction: 0
	,acProjectileDelta: 0
	,lockRotation: true

	,initialize: function(x,y,room) {
		this.parent(x,y,room);
		this.initialX  = x;
	}
	,randomDirection: function() {
		directions = [0, 180];
		this.direction = directions[Number.random(0,1)];
	}
	,move: function() {
		var delta = Date.now() - this.lastUpdateTime;

		if(this.x > 12*SPRITESIZE || this.x < 10*SPRITESIZE)
			this.direction = 180+this.direction%360;
		else if(!this.passive && this.acDirDelta > this.msPerFrame*Number.random(8,16)) {
			this.acDirDelta = 0;
			this.randomDirection();
		}
		else if(!this.passive && this.acProjectileDelta > this.msPerFrame*Number.random(16,32)) {
			this.acProjectileDelta = 0;
			new FireBall(this,0);
			new FireBall(this,20);
			new FireBall(this,40);
		}

		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;

			if(++this.animFrame >= this.maxAnimFrames) this.animFrame=0;
		}

		if(this.isImmune) {
			if(this.acPaletteDelta > this.msPerPalette) {
				this.acPaletteDelta = 0;
				if(++this.palette > 3) this.palette = 0;
			}
		}
		else 
			this.palette = this.defaultPalette;


		if(!this.passive)
			this.x = this.x + Math.cos(this.direction * Math.PI/180) * this.movementRate;

		Array.each(solidObjects, function(that){
			if(that != this && that.isFriendly && this.collidesWith(that)) {
				that.impact(this.damage, this.direction);
			}
		},this);

		this.acDelta += delta;
		this.acDirDelta += delta;
		this.acPaletteDelta += delta;
		this.acProjectileDelta += delta;

		this.lastUpdateTime = Date.now();
	}
});

var Dodongo = new Class({
	Extends: RandomMob
	,maxAnimFrames: 2
	,name: 'Dodongo'
	,damage: 1
	,health: 1
	,sprite: 'Dodongo'
	,move: function() {
		this.parent();
		if([0,180].contains(this.direction)) {
			//TODO: This isn't quite right when flipped.
			this.width = 28;
		}
		else {
			this.width = 15;
		}
	}
	,impact: function() {
		//@TODO: Takes damage when it walks in the path of a non-exploded bomb
		return false;
	}
});