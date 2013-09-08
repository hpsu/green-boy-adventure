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

var FireBall = new Class({
	Extends: Mob
	,damage: 0.5
	,moveRate: 1.5
	,acDelta: 0
	,palette: 0
	,msPerFrame:20
	,lastUpdateTime: 0
	,initialize: function(ancestor) {
		this.ancestor = ancestor;
		this.x = ancestor.x;
		this.y = ancestor.y;
		this.parent(this.x,this.y,ancestor.currentRoom);
		this.direction = Math.atan2(env.player.y - this.y, env.player.x - this.x) * 180 / Math.PI;
		this.target = {
			x: env.player.x
			,y: env.player.y
		};
		
		switch(this.direction) {
			case 'left':
				this.x -= 11;
				break;
			case 'right':
				this.x += 11;
				break;
			case 'up':
				this.y -= 11;
				break;
			case 'down':
				this.y += 11;
				break;
		}
	}
	,move: function() {
		this.x += Math.cos(this.direction * Math.PI/180) * this.moveRate;
		this.y += Math.sin(this.direction * Math.PI/180) * this.moveRate;

		var xTile = Math.round(this.x/TILESIZE)
			yTile = Math.round(this.y/TILESIZE)-4; // -4 is accounting for the header

		if(xTile < 1 || xTile > this.currentRoom.roomWidth-2 || yTile < 1 || yTile > this.currentRoom.roomHeight - 2) {
			this.destroy();
		}

		Array.each(solidObjects, function(that){
			if(that != this && that.isFriendly && this.collidesWith(that)) {
				that.impact(this.damage, this.direction);
				this.destroy();
			}
		},this);

		this.draw();
	}
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;

		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(++this.palette > env.palettes.length-1)
				this.palette=0;
		}
		placeTile(80, this.x, this.y, null, null);
		this.changePalette();
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}	
});

var RockProjectile = new Class({
	Extends: Mob
	,damage: 0.5
	,movementRate: 3.5
	,initialize: function(ancestor) {
		this.ancestor = ancestor;
		this.x = ancestor.x;
		this.y = ancestor.y;
		this.parent(this.x,this.y,ancestor.currentRoom);
		this.direction = ancestor.direction;
	}
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
		|| this.currentRoom.getTile(yTile,xTile).isSolid) {
			this.destroy();
		}

		Array.each(solidObjects, function(that){
			if(that != this && that.isFriendly && this.collidesWith(that)) {
				that.impact(this.damage, this.direction);
				this.destroy();
			}
		},this);
		
		this.draw();
	}
	,draw: function() {
		placeTile(63, this.x, this.y);
	}	
});

var Octorock = new Class({
	Extends: Enemy
	,animFrame: 0
	,lastUpdateTime: 0
	,msPerFrame: 110
	,acDelta: 0
	,damage: 0.5
	,health: 0.5
	,movementRate: 0.5
	,dirDelta: 0
	,rockDelta: 0
	,defaultPalette: 0
	,direction: 90
	,frames: [61,62]
	,move: function() {
		if(rooms.getCurrentRoom() != this.currentRoom) return;
		var delta = Date.now() - this.lastUpdateTime;

		if(this.dirDelta > this.msPerFrame*Number.random(16,32)) {
			this.dirDelta = 0;
			this.randomDirection();
		}
		
		if(this.rockDelta > this.msPerFrame*Number.random(32,64)) {
			this.rockDelta = 0;
			new RockProjectile(this);
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
		this.draw();
		this.lastUpdateTime = Date.now();
	}
	,randomDirection: function() {
		directions = [0, 90, 180, 270];
		this.direction = directions[Number.random(0,3)];
	}
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;

		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(typeof this.frames[++this.animFrame] == 'undefined') this.animFrame=0;
			if(this.isImmune) {
				if(++this.palette > 3) this.palette = 0;
			}
			else 
				this.palette = this.defaultPalette;

		}

		frame = this.frames[this.animFrame];
		rotation = null;
		switch(this.direction) {
			case 180:
				rotation = 0.5;
				break;
			case 0:
				rotation = 1.5;
				break;
			case 270:
				rotation = 1.0;
				break;
		}
		placeTile(frame, this.x, this.y, null, null, rotation);
		if(this.isImmune || this.defaultPalette != 0) this.changePalette(2);
		
		this.acDelta+=delta;
	}
});

var BlueOctorock = new Class({
	Extends: Octorock
	,health: 1
	,defaultPalette: 3
});

var Tektike = new Class({
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
		this.draw();
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		placeTile(this.sprite, this.x, this.y);
	}
});


var Leever = new Class({
	Extends: Enemy
	,animFrame: 0
	,damage: 0.5
	,health: 1
	,msPerFrame: 50
	,movementRate: .5
	,direction: 'upDive'
	,frames: {
		upDive: [76,77,76,77,81,81]
		,downDive: [81,81,81,81,76,77,76,77]
		,normal: [82,83]
	}
	,frameCount: 0
	,initialize: function(x,y) {
		if(!x) x = (Number.random(0,1) == 1 ? env.player.x : null);
		if(!y) y = x ? null : env.player.y;
		this.parent(x,y);
		this.dir = Math.atan2(env.player.y - this.y, env.player.x - this.x) * 180 / Math.PI;
	}
	,move: function() {
		var delta = Date.now() - this.lastUpdateTime;
		if(this.direction == 'normal') {
			this.x += Math.cos(this.dir * Math.PI/180) * this.movementRate;
			this.y += Math.sin(this.dir * Math.PI/180) * this.movementRate;

			xTile = this.x/TILESIZE;
			yTile = (this.y/TILESIZE)-4; // -4 is accounting for the header
			
			switch(this.dir) {
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
					this.dir = (180 + this.dir) % 360;
				}
			},this);
			
			
			if(xTile < 1 || xTile > this.currentRoom.roomWidth-2 
			|| yTile < 1 || yTile > this.currentRoom.roomHeight 
			|| this.currentRoom.getTile(yTile,xTile).isSolid) {
				this.animFrame=-1;
				this.direction='downDive';
				this.frameCount = -1;
			}
		}

		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(typeof this.frames[this.direction][++this.animFrame] == 'undefined') {
				this.animFrame=0;
			}
			
			if(this.direction == 'upDive' && this.frameCount >= 4) {
				this.direction='normal';
				this.animFrame=-1;
				this.frameCount = -1;
			}
			else if(this.direction == 'downDive' && this.frameCount >= 7) {
					var x = (Number.random(0,1) == 1 ? env.player.x : null);
					var y = x ? null : env.player.y;
					if(!this.moveToRandomNonSolidTile(x,y)) return;
					this.dir = Math.atan2(env.player.y - this.y, env.player.x - this.x) * 180 / Math.PI;
					this.direction = 'upDive';
					this.frameCount = -1;
					this.animFrame=-1;
			}

			this.frameCount++;

			if(this.isImmune)
				if(++this.palette > 3) this.palette = 0;
		}
		this.draw();
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		if(!this.direction) return;
		frame = this.frames[this.direction][this.animFrame];
		placeTile(frame, this.x, this.y);
		if(this.isImmune || this.direction != 'normal') 
			this.changePalette(this.direction == 'normal' ? 2 : 1);
	
	}
});

var Zola = new Class({
	Extends: Enemy
	,animFrame: 0
	,msPerFrame: 110
	,damage: 0.5
	,health: 2
	,direction: 'upDive'
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
			if(typeof this.frames[this.direction][++this.animFrame] == 'undefined') {
				this.animFrame=0;
			}
			
			if(this.direction == 'upDive' && this.frameCount >= 4) {
				this.direction = (env.player.y >= this.y ? 'down' : 'up');
				this.frameCount = -1;
				new FireBall(this);
			}
			else if(this.direction == 'downDive' && this.frameCount >= 8) {
				this.moveToRandomWaterTile();
				this.direction = 'upDive';
				this.frameCount = -1;
			}
			else if((this.direction == 'down' || this.direction == 'up') && this.frameCount >= 16) {
				this.direction = 'downDive';
				this.frameCount = -1;
			}
			this.frameCount++;
			if(++this.palette > 3) this.palette = 0;
		}
		this.draw();
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		frame = this.frames[this.direction][this.animFrame];
		placeTile(frame, this.x, this.y);
		if(this.isImmune)
			this.changePalette(1);
	
	}
});

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

		if(this.acDirDelta > this.msPerFrame*Number.random(64,256)) {
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

		this.draw();
		this.stateFrame+=delta;
		this.acDelta+=delta;
		this.acDirDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;

		if(this.isImmune && this.acPaletteDelta > this.msPerPalette) {
			this.acPaletteDelta = 0;
			if(++this.palette > 3) this.palette = 0;
		}

		frame = this.frames[this.animFrame];
		placeTile(frame, this.x, this.y);
		if(this.isImmune)
			this.changePalette(2);

		this.acPaletteDelta+=delta;
	}
});
