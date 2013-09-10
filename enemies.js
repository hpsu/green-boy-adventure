var Enemy = new Class({
	Extends: Mob
	,initialize: function(x,y) {
		this.parent(x,y);
	}
	,die: function() {
		new EnemyDeath(this.x, this.y);
		this.destroy();
	}
	,draw: function() {}
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
	,rotate: true
	,initialize: function(ancestor) {
		this.ancestor = ancestor;
		this.x = ancestor.x;
		this.y = ancestor.y;
		this.parent(this.x,this.y,ancestor.currentRoom);
		this.direction = ancestor.direction;
	}
	,impact: function() {return false;}
	,move: function() {
		if(rooms.getCurrentRoom() != this.currentRoom) return;

		this.x += Math.cos(this.direction * Math.PI/180) * this.movementRate;
		this.y += Math.sin(this.direction * Math.PI/180) * this.movementRate;
		
		var xTile = this.x/TILESIZE;
		var yTile = (this.y/TILESIZE)-4; // -4 is accounting for the header
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
		if(window.collisionDebug) filledRectangle(xTile*TILESIZE, (yTile+4)*TILESIZE, TILESIZE, TILESIZE, '#00f');

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


		if(this.rotatePalette && ++this.palette > env.palettes.length-1)
			this.palette=0;
	}
	,draw: function() {
		placeTile(this.tile, this.x, this.y, null, null, this.rotate ? (90+this.direction%360)/180 : null);
		if(this.rotatePalette) this.changePalette();
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
	,tile: 80
	,tileBlock: false
	,rotate: false
	,rotatePalette: true
	,initialize: function(ancestor) {
		this.parent(ancestor);
		this.direction = Math.atan2(env.player.y - this.y, env.player.x - this.x) * 180 / Math.PI;
	}
});


/**
 * Mob RockProjectile - Rock spat by Octorok
 *********************************************
 * Destroyed on tile collision
 */

var RockProjectile = new Class({
	Extends: Projectile
	,damage: 0.5
	,tile: 63
	,tileBlock: true
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
	,tile: 94
	,tileBlock: false
	,destroy: function() {
		new ArrowWake(this.x, this.y);
		this.parent();
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
	,tile: 12
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
	,impact: function() {return false;}
	,initialize: function(x,y) {
		this.parent(x,y);
		(function(o){o.destroy();}).pass(this).delay(100);
	}
	,draw: function() {
		placeTile(95, this.x, this.y);
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
	,sprite: 86
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
			this.targetY = this.y+Number.random(-TILESIZE,TILESIZE);
		} while((this.targetY <= 4*TILESIZE || this.targetY >= 14*TILESIZE) && ++infCnt <100 );

		if(infCnt >= 100) {
			this.targetY = this.startY;
		}

		this.sprite = 87;
		if(Number.random(0,1) == 1) {
			this.velocityX *= -1;
		}
	}
	,stopJump: function() {
		this.velocityY = 0;
		this.isJumping=false;
		this.sprite = 86;
		(function(ob){ob.jump();}).pass(this).delay(Number.random(100,1000));
	}
	,move: function() {
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
			else if(this.x > sc((this.currentRoom.roomWidth*TILESIZE)-TILESIZE-HALFTILE)
			|| this.x < sc(HALFTILE)) {
				this.y -= this.velocityY;
				this.x -= this.velocityX;
				this.stopJump();
			}
			Array.each(solidObjects, function(that){
				if(that != this && that.isFriendly && this.collidesWith(that)) {
					//@TODO: fix impact direction
					that.impact(this.damage, null);
				}
			},this);
		}
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		placeTile(this.sprite, this.x, this.y);
		if(this.isImmune || this.defaultPalette != 0) this.changePalette(2);

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
	,health: 1
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
	,defaultPalette: 0
	,msPerFrame: 50
	,msPerPalette: 30
	,movementRate: .5
	,acPaletteDelta: 0
	,acDirDelta: 0
	,acBurrowDelta: 0
	,state: 'upDive'
	,mode: 'follow'
	,direction: 0
	,frames: {
		upDive: [76,77,76,77,81,81]
		,downDive: [81,81,81,81,76,77,76,77]
		,normal: [82,83]
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
					this.animFrame=-1;
					this.acBurrowDelta = 0;
					this.state='downDive';
					this.frameCount = -1;
				}
				if(this.acDirDelta > this.msPerFrame*Number.random(16,32)) { //@TODO: This randomization should be done elsewhere ofc
					this.acDirDelta = 0;
					this.randomDirection();
				}
			}
			if(this.isImmune && this.impactDirection !== null && this.acImpactMove < 2*TILESIZE) {
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

			xTile = this.x/TILESIZE;
			yTile = (this.y/TILESIZE)-4; // -4 is accounting for the header
			
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
			if(window.collisionDebug) filledRectangle(xTile*TILESIZE, (yTile+4)*TILESIZE, TILESIZE, TILESIZE, '#00f');
			
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
					this.animFrame=-1;
					this.state='downDive';
					this.frameCount = -1;
				}
				else this.randomDirection();
			}
		}

		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(typeof this.frames[this.state][++this.animFrame] == 'undefined') {
				this.animFrame=0;
			}
			
			if(this.state == 'upDive' && this.frameCount >= 4) {
				this.state='normal';
				this.animFrame=-1;
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
				this.animFrame=-1;
			}

			this.frameCount++;

		}
		if(this.acPaletteDelta > this.msPerPalette) {
			if(this.isImmune){
				if(++this.palette > 3) this.palette = 0;
			}
			else this.palette = this.defaultPalette;
		}
		this.acDelta+=delta;
		this.acPaletteDelta += delta;
		this.acDirDelta += delta;
		this.acBurrowDelta += delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		if(!this.state) return;
		frame = this.frames[this.state][this.animFrame];
		placeTile(frame, this.x, this.y);
		//if(this.isImmune || this.state != 'normal' || this.defaultPalette > 0)
		if(this.isImmune || (this.defaultPalette > 0 && ![76,77].contains(this.frames[this.state][this.animFrame]))) {
			this.changePalette(2);
		}
	
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
	,palette: 3
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
	,state: 'upDive'
	,frames: {
		upDive: [76,77]
		,downDive: [76,77]
		,down: [79]
		,up: [78]
	}
	,frameCount: 0
	,initialize: function() {
		this.parent(0,0);
		this.moveToRandomWaterTile();
	}
	,impact: function(damage, direction) {
		if(['up','down'].contains(this.state)) {
			return this.parent(damage, direction);
		}
		return false;
	}
	,moveToRandomWaterTile: function() {
		var infCnt = 0;
		do{
			xTile = Number.random(1, this.currentRoom.roomWidth-2);
			yTile = Number.random(1, this.currentRoom.roomHeight-2);
			if(window.collisionDebug) filledRectangle(xTile*TILESIZE, (yTile+4)*TILESIZE, this.width, this.height, "#f0f");
			if(++infCnt >100)
				return false;
		} while(![34, 35, 36, 37, 38, 39, 40, 41, 42].contains(this.currentRoom.getTile(yTile, xTile).sprite));
		this.x = xTile*TILESIZE;
		this.y = (yTile+4)*TILESIZE;
	}
	,move: function() {
		var delta = Date.now() - this.lastUpdateTime;

		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(typeof this.frames[this.state][++this.animFrame] == 'undefined') {
				this.animFrame=0;
			}
			
			if(this.state == 'upDive' && this.frameCount >= 4) {
				this.state = (env.player.y >= this.y ? 'down' : 'up');
				this.frameCount = -1;
				new FireBall(this);
			}
			else if(this.state == 'downDive' && this.frameCount >= 8) {
				this.moveToRandomWaterTile();
				this.state = 'upDive';
				this.frameCount = -1;
			}
			else if((this.state == 'down' || this.state == 'up') && this.frameCount >= 16) {
				this.state = 'downDive';
				this.frameCount = -1;
			}
			this.frameCount++;
			if(this.isImmune && ['up','down'].contains(this.state)) {
				if(++this.palette > 3) this.palette = 0;
			}
			else {
				this.palette = 3;
			}
		}
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		frame = this.frames[this.state][this.animFrame];
		placeTile(frame, this.x, this.y);
		if(this.isImmune || [76,77].contains(frame))
			this.changePalette(['up','down'].contains(this.state) ? 1 : 2);
	
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
	,frames: [88,89]
	,msPerPalette: 50
	,acPaletteDelta: 0
	,acDirDelta: 0
	,direction: 0
	,animFrame: 0
	,moveRate: 1
	,stateFrame: 0
	,msSpeed:0
	,accelAdd: 1.5
	,state: 0 // Acceleration, flight, deceleration, rest
	,initialize: function(x,y) {
		this.parent(x,y);
		this.randomDirection();
	}
	,impact: function(damage, direction) {
		if(this.state == 3) {
			this.parent(damage,direction);
		}
	}
	,randomDirection: function() {
		directions = [0, 45, 90, 135, 180, 225, 270, 315];
		this.direction = directions[Number.random(0,directions.length-1)];
	}
	,move: function() {
		var delta = Date.now() - this.lastUpdateTime;

		if(this.isImmune && this.acPaletteDelta > this.msPerPalette) {
			this.acPaletteDelta = 0;
			if(++this.palette > 3) this.palette = 0;
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
						console.log('entering state 1');
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
						console.log('entering state 2');
						this.state = 2;
						this.stateFrame = 0;
					}
					break;
				case 2:
					if(this.msSpeed < 0) {
						console.log('entering state 3');
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
						console.log('entering state 0');
						this.state = 0;
						this.stateFrame = 0;
					}
					break;
			}
			if(this.state != 3) {
				if(typeof this.frames[++this.animFrame] == 'undefined') this.animFrame=0;
				this.x += Math.cos(this.direction * Math.PI/180) * this.moveRate;
				this.y += Math.sin(this.direction * Math.PI/180) * this.moveRate;
			}

			if(this.x > sc((this.currentRoom.roomWidth*TILESIZE)-TILESIZE-HALFTILE)
			|| this.y < sc(TILESIZE*4)
			|| this.x < sc(HALFTILE)
			|| this.y > sc(TILESIZE*14)) {
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
	,draw: function() {
		frame = this.frames[this.animFrame];
		placeTile(frame, this.x, this.y);
		if(this.isImmune)
			this.changePalette(2);

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
	,acDelta: 0
	,movementRate: 0.5
	,dirDelta: 0
	,rockDelta: 0
	,defaultPalette: 0
	,direction: 90
	,move: function() {
		var delta = Date.now() - this.lastUpdateTime;

		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(++this.animFrame >= this.maxAnimFrames) this.animFrame=0;
			if(this.isImmune) {
				if(++this.palette > 3) this.palette = 0;
			}
			else 
				this.palette = this.defaultPalette;

		}

		if(rooms.getCurrentRoom() != this.currentRoom) return;
		var delta = Date.now() - this.lastUpdateTime;

		if(this.dirDelta > this.msPerFrame*Number.random(16,32)) {
			this.dirDelta = 0;
			this.randomDirection();
		}
		
		if(this.projectile && this.rockDelta > this.msPerFrame*Number.random(32,64)) {
			this.rockDelta = 0;
			new this.projectile(this);
		}

		this.x += Math.cos(this.direction * Math.PI/180) * this.movementRate;
		this.y += Math.sin(this.direction * Math.PI/180) * this.movementRate;

		var xTile = this.x/TILESIZE;
		var yTile = (this.y/TILESIZE)-4; // -4 is accounting for the header
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
		if(window.collisionDebug) filledRectangle(xTile*TILESIZE, (yTile+4)*TILESIZE, TILESIZE, TILESIZE, '#00f');

		if(xTile < 1 || xTile > this.currentRoom.roomWidth-2 
		|| yTile < 1 || yTile > this.currentRoom.roomHeight-2
		|| this.currentRoom.getTile(yTile,xTile).isSolid) {
			this.randomDirection();
		}

		Array.each(solidObjects, function(that){
			if(that != this && that.isFriendly && this.collidesWith(that)) {
				that.impact(this.damage, this.direction);
			}
		},this);

		this.dirDelta += delta;
		this.rockDelta += delta;
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,randomDirection: function() {
		directions = [0, 90, 180, 270];
		this.direction = directions[Number.random(0,3)];
	}
	,draw: function() {
		frame = this.frames[this.animFrame];
		placeTile(frame, this.x, this.y, null, null, (270+this.direction%360)/180);
		if(this.isImmune || this.defaultPalette != 0) this.changePalette(2);
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
	,frames: [61,62]
	,projectile: RockProjectile
	,draw: function() {
		frame = this.frames[this.animFrame];
		placeTile(frame, this.x, this.y, null, null, (270+this.direction%360)/180);
		if(this.isImmune || this.defaultPalette != 0) this.changePalette(2);
	}
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
	,projectile: ArrowProjectile
	,damage: 0.5
	,health: 1
	,frames: {
		 0:		{sprites: [90,91], flip: ['x','x']}
		,90:	{sprites: [92,92], flip: [null,'x']}
		,180:	{sprites: [90,91], flip: [null,null]}
		,270:	{sprites: [93,93], flip: [null,'x']}
	}
	,draw: function() {
		frame = this.frames[this.direction]['sprites'][this.animFrame];
		flip = this.frames[this.direction]['flip'][this.animFrame];
		placeTile(frame, this.x, this.y, null, null, null, flip);
		if(this.isImmune || this.defaultPalette != 0) this.changePalette(2);
	}
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
	,projectile: SwordProjectile
	,damage: 1
	,health: 2
	,frames: {
		 0:		{sprites: [96,97], flip: ['x','x']}
		,90:	{sprites: [98,98], flip: [null,'x']}
		,180:	{sprites: [96,97], flip: [null,null]}
		,270:	{sprites: [99,99], flip: [null,'x']}
	}
	,draw: function() {
		frame = this.frames[this.direction]['sprites'][this.animFrame];
		flip = this.frames[this.direction]['flip'][this.animFrame];
		placeTile(frame, this.x, this.y, null, null, null, flip);
		if(this.isImmune || this.defaultPalette != 0) this.changePalette(2);
	}
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
	,health: 4.5
	,frames: {
		 0:		{sprites: [100], flip: ['x']}
		,90:	{sprites: [100], flip: [null]}
		,180:	{sprites: [100], flip: [null]}
		,270:	{sprites: [101], flip: [null]}
	}
	,draw: function() {
		frame = this.frames[this.direction]['sprites'][0];
		flip = this.frames[this.direction]['flip'][this.animFrame];
		placeTile(frame, this.x, this.y, null, null, null, flip);
		if(this.isImmune || this.defaultPalette != 0) this.changePalette(2);
	}
});
