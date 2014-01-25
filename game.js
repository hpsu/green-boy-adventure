//@TODO: Separate canvas contexts for background + header with lower update rate

// Global vars
var ctx = null
	,ctxBg = null
	,WIDTH = 256
	,HEIGHT = 240
	,SCALE = 1
	,TILESIZE = 16
	,HALFTILE = 8
	,SPRITESIZE = 16
	,YOFF = 0
	,solidObjects = []
	,env = {
		keyStates: {}
		,pauseScreen: null
		,paused: false
		,spriteSheet: new Image()
		,bossSpriteSheet: new Image()
		,palettes: [
			 [[128, 208,  16], [200,  76,  12], [252, 152,  56]] // green, orange, brown (link)
			,[[  0,   0,   0], [216,  40,   0], [  0, 128, 136]] // black, red, blue
			,[[216,  40,   0], [252, 252, 252], [252, 152,  56]] // red, white, orange
			,[[  0,   0, 168], [252, 252, 252], [ 92, 148, 252]] // dark blue, white, light blue
		]
	};

window.collisionDebug = false;
window.spriteDebug = false;
window.godMode = false;

var TintCache = {
	cache: {}
	,get: function(color, tile) {
		if(Array.isArray(color)) color = color.rgbToHex();
		if(this.cache[color] && this.cache[color][tile])
			return this.cache[color][tile];
		return false;
	}
	,set: function(color, tile, data) {
		if(Array.isArray(color)) color = color.rgbToHex();
		if(!this.cache[color]) this.cache[color] = {};
		this.cache[color][tile] = data;
	}
};

env.spriteSheet.src='sprites.png';
env.bossSpriteSheet.src = 'boss_sprites.png';
window.addEvent('load', function () {
    ctx = $('screen').getContext('2d');
    ctxBg = $('background').getContext('2d');
	ctx.webkitImageSmoothingEnabled=false;
	ctxBg.webkitImageSmoothingEnabled=false;
	env.player = new Link(WIDTH/2, HEIGHT/2);
	env.pauseScreen = new PauseScreen();
	paintRoom();
	
	$('screen').addEventListener("touchstart", handleStart, false);
	$('screen').addEventListener("touchend", handleEnd, false);
	//$('screen').addEventListener("touchcancel", handleCancel, false);
	//$('screen').addEventListener("touchleave", handleEnd, false);
	//$('screen').addEventListener("touchmove", handleMove, false);	
	
	window.requestAnimationFrame(animate);
});

// Basic touch support
function handleStart(evt) {
	var touches = evt.changedTouches;	
	for (var i=0; i < touches.length; i++) {
		if(touches[i].pageY < (HEIGHT/2) && touches[i].pageY > 4*TILESIZE) {
			env.keyStates['up'] = true;
		}
		else {
			env.keyStates['down'] = true;
		}
	}
}

function handleEnd(evt) {
	var touches = evt.changedTouches;	
	for (var i=0; i < touches.length; i++) {
		if(touches[i].pageY < (HEIGHT/2) && touches[i].pageY > 4*TILESIZE) {
			env.keyStates['up'] = false;
		}
		else {
			env.keyStates['down'] = false;
		}
	}	
}

// Record keypresses
window.addEvent('keydown', function(e) { 
	if(env.keyStates[e.key] !== null) env.keyStates[e.key] = true;
	if(e.control && e.key == 'p') {
		e.preventDefault();
		if(env.optionscreen) {
			env.optionscreen.destroy();
			delete env.optionscreen;
		}
		else {
			env.optionscreen = new OptionScreen();
		}
	}
});
window.addEvent('keyup', function(e) { 
	env.keyStates[e.key] = false; 
});

/*
 * Base skeleton class for all Mobile OBjects
 */
var Mob = new Class({
	acDelta: 0
	,acImpactMove: 0
	,frames: []
	,health: 0.5
	,height: TILESIZE
	,inSpaceTime: true
	,isActive: true
	,isFriendly: false
	,isImmune: false
	,lastUpdatedTime: 0
	,lastUpdateTime: 0
	,msPerFrame: 100
	,palette: 0
	,spawning: true
	,width: TILESIZE
	,initialize: function(x,y,room){
		x = sc(x);
		y = sc(y);
		if(room)
			this.currentRoom = room
		else
			this.currentRoom = rooms.getCurrentRoom();

		this.currentRoom.MOBs.unshift(this);
		
		this.moveToRandomNonSolidTile(x,y);
	}
	,moveToRandomNonSolidTile: function(x, y) {
		if(x && y) {
			this.x = x;
			this.y = y;
		}
		else {
			var infCnt = 0;
			do{
				if(x)  {
					xTile = Math.round(x/TILESIZE)
					this.x = x;
				}
				else
					xTile = Number.random(1, this.currentRoom.roomWidth-2);
				if(y) {
					yTile = Math.round(y/TILESIZE)-4; // -4 is accounting for the header
					this.y = y;
				}
				else
					yTile = Number.random(1, this.currentRoom.roomHeight-2);

				if(!x) this.x = xTile*TILESIZE;
				if(!y) this.y = (yTile+4)*TILESIZE;

				if(window.collisionDebug) filledRectangle(xTile*TILESIZE, (yTile+4)*TILESIZE, this.width, this.height, "#f0f");
				if(++infCnt >100)
					return false;

			} while(this.currentRoom.getTile(yTile, xTile).sprite !== null || this.collidesWith(env.player));
			return true;
		}
	}
	,changePalette: function(fromPalette, palettes) {
		if(!palettes) palettes = env.palettes;
		if(!fromPalette) fromPalette = 0;
		
		if(!palettes[this.palette]) { 
			console.log('There is no palette',this.palette);
			return;
		}
		if(this.palette != fromPalette || palettes != env.palettes) {
			map = ctx.getImageData(this.x, this.y, this.width, this.height);
			imdata = map.data;
			for(var p = 0, len = imdata.length; p < len; p+=4) {
				r = imdata[p]
				g = imdata[p+1];
				b = imdata[p+2];
				Array.each([0,1,2], function(i){
					j = i;
					if(r == env.palettes[fromPalette][i][0] && g == env.palettes[fromPalette][i][1] && b == env.palettes[fromPalette][i][2]) {
						imdata[p] = palettes[this.palette][j][0];
						imdata[p+1] = palettes[this.palette][j][1];
						imdata[p+2] = palettes[this.palette][j][2];
					}
				},this);
			}
			ctx.putImageData(map, this.x, this.y);
		}
	}
	,collidesWith: function(that, tx, ty) {
		if(typeof tx == 'undefined') tx = this.x;
		if(typeof ty == 'undefined') ty = this.y;
		var  ax1 = tx
			,ax2 = tx+this.width
			,ay1 = ty
			,ay2 = ty+this.height
			,bx1 = that.x
			,bx2 = that.x+that.width
			,by1 = that.y
			,by2 = that.y+that.height;
		return (ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1);

	}
	,impact: function(damage, direction) {
		if(this.isImmune)
			return true;
		this.impactDirection = direction;
		this.acImpactMove = 0;
		this.health -= damage;
		if(this.health <= 0)
			this.die();
		this.isImmune = true;
		(function(){this.isImmune=false}).delay(1000, this);
		return true;
	}
	,die: function() {
	}
	,destroy: function() {
		this.isActive = false;
		for(var i=0; i < this.currentRoom.MOBs.length; i++) {
			if(this.currentRoom.MOBs[i] == this)	{
				this.currentRoom.MOBs.splice(i,1);
				delete this;
				break;
			}
		}
	}
	,move: function() {}
	,draw: function() {
		placeTile(this.sprite, this.x, this.y);
	}
});

var OptionScreen = new Class({
	Extends:Mob
	,width: 256
	,height: 241
	,isFriendly: true
	,inSpaceTime: false
	,state: 'closed'
	,choice: 0
	,options: [
		['collisionDebug', 'Debug collisions', 'boolean']
		,['spriteDebug', 'Debug sprites', 'boolean']
		,['godMode', 'Passthru solid tiles', 'boolean']
	]
	,initialize: function(){
		this.x=0;
		this.y=0;
		
		solidObjects.push(this);
		env.paused = true;
	}
	,destroy: function() {
		this.isActive = false;
		solidObjects.erase(this);
		env.paused = false;
		paintRoom();

	}
	,move: function() {
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		if(env.keyStates['up'] || env.keyStates['down'] || env.keyStates['space'] || env.keyStates['right']) {
			if(this.acDelta < 150) return;
			else this.acDelta = 0;
		}
		switch(true) {
			case env.keyStates['up']:
				if(--this.choice < 0) this.choice=this.options.length-1;
				break;
			case env.keyStates['down']:
				if(++this.choice >= this.options.length) this.choice=0;
				break;
			case env.keyStates['space']:
				var o = this.options[this.choice];
				if(o[2] == 'boolean') {
					window[o[0]] = !window[o[0]];
				}
				break;
		}
		this.acDelta += delta;
		this.lastUpdateTime = Date.now();

	}
	,draw: function() {
		filledRectangle(this.x, Math.ceil(this.y), this.width, this.height, "#000");
		drawBorder(this.x+HALFTILE, this.y+TILESIZE, 30, 27);
		writeText('developer options', this.x+TILESIZE, this.y+(HALFTILE), [216, 40, 0]);

		for(var i=0; i<this.options.length; i++) {
			var o = this.options[i];
			writeText(o[1], this.x+TILESIZE*3, this.y+(TILESIZE*(i+2)));
			filledRectangle(this.x+TILESIZE*2, this.y+(TILESIZE*(i+2)), HALFTILE, HALFTILE, "#fff", ctx, !window[o[0]]);
		}

		ctx.drawImage(env.spriteSheet, (22*TILESIZE), 0, HALFTILE, HALFTILE, 1*TILESIZE, (2*TILESIZE)+(this.choice*TILESIZE), HALFTILE, HALFTILE); // Heart
	}

});

var PauseScreen = new Class({
	Extends:Mob
	,width: 256
	,height: 241-(4*TILESIZE)
	,isFriendly: true
	,inSpaceTime: false
	,state: 'closed'
	,initialize: function(){
		this.x=0;
		this.y=-this.height;
		
		solidObjects.push(this);

		//this.parent(this.x, this.y);
	}
	,open: function() {
		env.paused = true;
		this.state='opening';
	}
	,close: function() {
		this.state='closing';
	}
	,toggle: function() {
		if(this.state == 'open')
			this.close();
		else if(this.state == 'closed')
			this.open();
	}
	,move: function() {
		switch(this.state) {
			case 'opening':
				if(YOFF < this.height) {
					YOFF+=1.5;
				} else this.state='open';
			break;
			case 'closing':
				if(YOFF > 0) {
					YOFF-=1.5;
				} else {
					this.state='closed';
					env.paused = false;
				}
			break;
			default:
				if(env.keyStates['enter']) {
					env.pauseScreen.toggle();
				}
		}
	}
	,draw: function() {
		if(this.state=='closed') return;
		filledRectangle(this.x, Math.ceil(YOFF+this.y), this.width, this.height, "#000");
		writeText('inventory', this.x+(2*TILESIZE), YOFF+this.y+(1.5*TILESIZE), [216, 40, 0]);
		writeText('use b button\n  for this', this.x+(1*TILESIZE), YOFF+this.y+(4.5*TILESIZE));
		drawBorder(this.x+(3.5*TILESIZE), YOFF+this.y+(2.5*TILESIZE), 4, 4);
		drawBorder(this.x+(7.5*TILESIZE), YOFF+this.y+(2.5*TILESIZE), 13, 6);
		writeText('triforce', this.x+(6*TILESIZE), YOFF+this.y+(10*TILESIZE),[216, 40, 0]);

		//if(env.player.items.bombs > 0) {
			ctx.drawImage(env.spriteSheet, (69*TILESIZE)+(TILESIZE/4), 0, HALFTILE, TILESIZE, Math.floor(this.x+(10*TILESIZE)-(TILESIZE/4)), Math.floor(YOFF+this.y+(3*TILESIZE)), HALFTILE, TILESIZE);
		//}
		//if(env.player.items.candle == 1) {
			ctx.drawImage(env.spriteSheet, (106*TILESIZE)+HALFTILE, 0, HALFTILE, TILESIZE, Math.floor(this.x+(13*TILESIZE)-(TILESIZE/4)), Math.floor(YOFF+this.y+(3*TILESIZE)), HALFTILE, TILESIZE);
		//}
		//if(env.player.items.potions > 0) {
			ctx.drawImage(env.spriteSheet, (108*TILESIZE), 0, HALFTILE, TILESIZE, Math.floor(this.x+(11.5*TILESIZE)-(TILESIZE/4)), Math.floor(YOFF+this.y+(4*TILESIZE)), HALFTILE, TILESIZE);
		//}




		//if(env.player.items.bracelet > 0) {
			ctx.drawImage(env.spriteSheet, (132*TILESIZE), 0, HALFTILE, TILESIZE, Math.floor(this.x+(13*TILESIZE)), Math.floor(YOFF+this.y+(1.5*TILESIZE)), HALFTILE, TILESIZE);
		//}
		


/*			for(var io=0; io<10; io++) {
				for(var i=0; i<16; i++) {
					ctx.beginPath();
					ctx.strokeStyle='#f0f';
					ctx.rect(Math.floor(this.x+(i*TILESIZE)), Math.floor(YOFF+this.y+(io*TILESIZE)), TILESIZE, TILESIZE);
					ctx.stroke();
				}
			}
*/
		ctx.beginPath();
		ctx.strokeStyle="#fcbcb0";
		ctx.moveTo((5*TILESIZE), YOFF+this.y+(9.5*TILESIZE));
		ctx.lineTo((11*TILESIZE), YOFF+this.y+(9.5*TILESIZE));
		ctx.lineTo((8*TILESIZE), YOFF+this.y+(6.5*TILESIZE));
		ctx.lineTo((5*TILESIZE), YOFF+this.y+(9.5*TILESIZE));

		ctx.moveTo((6*TILESIZE), YOFF+this.y+(9*TILESIZE));
		ctx.lineTo((10*TILESIZE), YOFF+this.y+(9*TILESIZE));
		ctx.lineTo((8*TILESIZE), YOFF+this.y+(7*TILESIZE));
		ctx.lineTo((6*TILESIZE), YOFF+this.y+(9*TILESIZE));


		ctx.stroke();

		paintRoom();
		paintHeader();
	}
	
});

var Link = new Class({
	Extends: Mob
	,isFriendly: true
	,paletteFrame: 0
	,animFrame: 0
	,health: 3
	,direction: 270
	,isMoving: false
	,movementRate: 1.3
	,impactDirection: null
	,swordThrow: null
	,bomb: null
	,impacted: false
	,immobilized: false
	,getRupees: function() {
		return this.items.rupees;
	}
	,addHearts: function(worth) {
		this.items.hearts+=worth;
	}
	,addHealth: function(worth) {
		this.health+=worth;
		if(this.health > this.items.hearts)
			this.health = this.items.hearts;
	}
	,addKeys: function(worth) {
		this.items.keys+=worth;
		if(this.items.keys < 0)
			this.items.keys = 0;
	}
	,addRupees: function(worth) {
		this.items.rupees+=worth;
		if(this.items.rupees <0) this.items.rupees = 0;
		else if(this.items.rupees >255) this.items.rupees = 255;			
	}
	,addBombs: function(worth) {
		this.items.bombs+=worth;
		if(this.items.bombs <0) this.items.bombs = 0;
		else if(this.items.bombs >8) this.items.bombs = 8;
	}
	,items: {
		 sword: 0
		,shield: 1
		,boomerang: 0
		,bow: 0
		,keys: 0
		,rupees: 0
		,bombs: 0
		,hearts: 3
	}
	,initialize: function(x,y) {
		this.currentRoom = rooms.getCurrentRoom();
		this.x=x;
		this.y=y;
		solidObjects.unshift(this);
		this.moveDelta = 1.3;
		this.frames = {
			 0:		{normal: [2, 3], item: [9]}		// Right
			,90:	{normal: [6, 7], item: [11]}	// Down
			,180:	{normal: [0, 1], item: [8]}		// Left
			,270:	{normal: [4, 5], item: [10]}	// Up
		};
		this.usingItem = false;
	}
	,impact: function(damage, direction) {
		this.impacted=true;
		if(this.isMoving) {
			direction = (180+this.direction)%360;
		}
		this.parent(damage, direction);
	}
	,die: function() {
		new DeathEvent(this.x, this.y);
		this.destroy();
	}
	,destroy: function() {
		this.isActive = false;
		solidObjects.erase(this);
	}
	,flytta: function(direction, showDirection) {
		var tx = this.x + (Math.cos(direction * Math.PI/180) * this.movementRate);
		var ty = this.y + (Math.sin(direction * Math.PI/180) * this.movementRate);

		var currentRoom = rooms.getCurrentRoom();
		if(direction == null) direction = this.direction;
		else if(showDirection) this.direction = direction;
		if(showDirection) this.isMoving=true;

		var xTile =(tx/TILESIZE);
		var yTile =((ty/TILESIZE)-4); // -4 is accounting for the header

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
			default:
				console.log('unknown angle'+direction);
				xTile = Math.round(xTile);
				yTile = Math.round(yTile);

		}
		var pass 		= false
			hasPtObj 	= false;
		Array.each(rooms.getCurrentRoom().MOBs, function(that){
			if(that != this && this.collidesWith(that, tx, ty) && that.isFriendly && that.canPassThru) {
				hasPtObj = true;
				if(that.canPassThru(this, tx, ty)) 	pass = true;
			}
		},this);

		switch(true) {
			case xTile < 0:
				if(this.isMoving) {
					if(!rooms.exists(this.currentRoom.row, this.currentRoom.col-1)) {console.log('Room not found');return false;}
					this.currentRoom = switchRoom(this.currentRoom.row, this.currentRoom.col-1);
					this.x = (this.currentRoom.roomWidth-1)*TILESIZE;
				}
				return;
			case xTile > this.currentRoom.roomWidth-1:
				if(this.isMoving) {
					if(!rooms.exists(this.currentRoom.row, this.currentRoom.col+1)) {console.log('Room not found');return false;}
					this.currentRoom = switchRoom(this.currentRoom.row, this.currentRoom.col+1);
					this.x = 0;
				}
				return;
			case yTile < 0:
				if(this.isMoving) {
					if(!rooms.exists(this.currentRoom.row-1, this.currentRoom.col)) {console.log('Room not found');return false;}
					this.currentRoom = switchRoom(this.currentRoom.row-1, this.currentRoom.col);
					this.y = (this.currentRoom.roomHeight+4-1)*TILESIZE;
				}
				return;
			case yTile > this.currentRoom.roomHeight-1:
				if(this.isMoving) {
					if(rooms == underworld) {
						this.currentRoom = switchRoom(this.currentRoom.row, this.currentRoom.col, overworld);
					}
					else {
						if(!rooms.exists(this.currentRoom.row+1, this.currentRoom.col)) {console.log('Room not found');return false;}
						this.currentRoom = switchRoom(this.currentRoom.row+1, this.currentRoom.col);
						this.y = 4*TILESIZE;
					}
				}
				return;
			case hasPtObj && !pass: // Stop moving through "solid" MOBs
				return false;
			case !pass && this.currentRoom.getTile(yTile,xTile).isSolid && !window.godMode:
				this.currentRoom.getTile(yTile,xTile).touch();
				return false;

		}

		// No obstacles found, move along

		this.x = tx;
		this.y = ty;

		this.currentRoom.getTile(yTile,xTile).fireEvent('enter');

		Array.each(rooms.getCurrentRoom().MOBs, function(that){
			if(that != this && that.isFriendly && this.collidesWith(that)) {
				if(that.pickup)
					that.pickup(this);
			}
		},this);
	}
	,move: function() {
		this.impacted = false;
		if(this.immobilized) return;
		var delta = Date.now() - this.lastUpdateTime;

		if(this.usingItem) {
			//@TODO: Link should animate when subtracting the sword (walking frames from right to left)
			this.acDelta = 0;
			if(this.health == this.items.hearts && this.swordThrow) {
				this.swordThrow.draw();
			}
			this.animFrame = 0;
		}		
		else if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(this.isImmune) {
				if(++this.palette > 3) this.palette = 0;
			}
			if(this.isMoving)
				if(typeof this.frames[this.direction]['normal'][++this.animFrame] == 'undefined') this.animFrame=0;
		}

		if(this.isImmune && this.impactDirection !== null && this.acImpactMove < 3*HALFTILE) {
			if(!isNaN(this.impactDirection)) {
				for(var i=0; i<4; i++) {
					this.flytta(this.impactDirection, false);
					this.acImpactMove += this.movementRate;
				}
			}
			else {
				console.log('Failed to skuffa', this.impactDirection);
			}
		}
		
		switch(true) {
			case this.usingItem != false:
				break;
			case env.keyStates['z'] && this.usingItem == false && this.bomb == null:
				if(this.items.bombs >0) 
					this.bomb = this.usingItem = new Bomb(this);
				env.keyStates['z']=null;
				break;
			case env.keyStates['x'] && this.usingItem == false && this.candle == null:
				if(this.items.candle == 1) 
					this.candle = this.usingItem = new CandleFire(this);
				env.keyStates['x']=null;
				break;
			case env.keyStates['space'] && this.usingItem == false:
				if(this.items.sword > 0) {
					this.usingItem = new Sword(this);
					if(this.health == this.items.hearts && this.swordThrow == null) {
						this.swordThrow = new SwordThrow(this);
					}
				}
				env.keyStates['space']=null;
				break;
			case env.keyStates['down']: case env.keyStates['s']:
				this.isMoving=true;
				this.flytta(90, true);
				break;
			case env.keyStates['up']: case env.keyStates['w']:
				this.isMoving=true;
				this.flytta(270, true);
				break;
			case env.keyStates['right']: case env.keyStates['d']:
				this.isMoving=true;
				this.flytta(0, true);
				break;
			case env.keyStates['left']: case env.keyStates['a']:
				this.isMoving=true;
				this.flytta(180, true);
				break;
			default:
				this.isMoving=false
		}
		
		this.acDelta += delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		frame = this.frames[this.direction][(this.usingItem?'item':'normal')][this.animFrame];
		if(window.collisionDebug) filledRectangle(this.x, this.y, this.width, this.height, this.impacted ? "#ff0": "#0f0");
		placeTile(frame, this.x, this.y);
	 	if(this.isImmune) {
			this.changePalette();
		}
	}
	
});

function drawMapFromRooms(rooms, xOff, yOff) {
	sizeX = (4*TILESIZE)/16; // Total levels 8
	sizeY = (2*TILESIZE)/8; // Total rooms 16
	sizeX = sizeX*2;
	currentRoom = rooms.getCurrentRoom();

	for(var i = 0; i < rooms.rooms.length; i++) {
		if(typeof rooms.rooms[i] !== 'undefined') {
			for(var j = 0; j < rooms.rooms[i].length; j++) {
				if(typeof rooms.rooms[i][j] !== 'undefined') {
					var thisRoom = rooms.rooms[i][j];
					if(rooms.hasMap) filledRectangle((xOff+(sizeX*thisRoom.col))-(TILESIZE*2), yOff+(sizeY*thisRoom.row), sizeX-1, sizeY-1, "#2038ec");
					if(rooms.hasCompass && rooms.rooms[i][j].triforceRoom)
						filledRectangle(xOff+(sizeX*thisRoom.col)-(TILESIZE*2)+(sizeX/4), yOff+(sizeY*thisRoom.row), sizeX/2-1, sizeY-1, "#d82800");
				}
			}
		}
	}
	filledRectangle(xOff+(sizeX*currentRoom.col)-(TILESIZE*2)+(sizeX/4), yOff+(sizeY*currentRoom.row), sizeX/2-1, sizeY-1, "#80d010");

	writeText(rooms.name, TILESIZE, yOff-HALFTILE);
}

/* 
 * Header related code
 * 
 * */

function paintHeader() {
	var yOff = YOFF+(TILESIZE*1.5),
		xOff = TILESIZE;

	// Background
	filledRectangle(0, YOFF, 16*TILESIZE, 4*TILESIZE, "#000");

	if(window.spriteDebug) {
		for(var io=0; io<2; io++) {
			for(var i=0; i<16; i++) {
				ctx.beginPath();
				ctx.strokeStyle='#090';
				ctx.rect((i*TILESIZE), yOff+(io*TILESIZE), TILESIZE, TILESIZE);
				ctx.stroke();
			}
		}
	}
	
	// Map
	
	if(rooms == overworld) { // Overworld map
		filledRectangle(xOff, yOff, 4*TILESIZE, 2*TILESIZE, "#747474");
		
		sizeX = (4*TILESIZE)/16; // Total levels 8
		sizeY = (2*TILESIZE)/8; // Total rooms 16
		currentRoom = rooms.getCurrentRoom();
		filledRectangle(xOff+(sizeX*currentRoom.col), yOff+(sizeY*currentRoom.row), sizeX, sizeY, "#80d010");
	}
	else {
		drawMapFromRooms(rooms, xOff, yOff);
	}
	
	
	// Rupees
	ctx.drawImage(env.spriteSheet, (21*TILESIZE), 0,HALFTILE, HALFTILE, xOff+(4*TILESIZE)+HALFTILE, yOff, HALFTILE, HALFTILE); // Rupee
	writeText((env.player.getRupees() <= 99 ? 'X' : '')+env.player.items.rupees, xOff+(4*TILESIZE)+TILESIZE, yOff); 

	// Keys
	ctx.drawImage(env.spriteSheet, (21*TILESIZE)+HALFTILE, 0,HALFTILE, HALFTILE, xOff+(4*TILESIZE)+HALFTILE, yOff+(TILESIZE), HALFTILE, HALFTILE); // Key
	writeText('X'+env.player.items.keys, xOff+(4*TILESIZE)+TILESIZE, yOff+TILESIZE); 

	// Bombs
	ctx.drawImage(env.spriteSheet, (21*TILESIZE)+HALFTILE, HALFTILE, HALFTILE, HALFTILE, xOff+(4*TILESIZE)+HALFTILE, yOff+(TILESIZE*1.5), HALFTILE, HALFTILE); // Bomb
	writeText('X'+env.player.items.bombs, xOff+(4*TILESIZE)+TILESIZE, yOff+(HALFTILE*3)); 

	drawBorder(xOff+(6*TILESIZE)+HALFTILE, yOff, 3, 4);
	writeText('B', xOff+(6*TILESIZE)+TILESIZE, yOff); 
	drawBorder(xOff+(8*TILESIZE), yOff, 3, 4);
	writeText('A', xOff+(8*TILESIZE)+HALFTILE, yOff); 
	if(env.player.items.sword > 0) {
		placeTile(12, xOff+(8*TILESIZE)+(HALFTILE/2), yOff+HALFTILE);
	}

	writeText('-LIFE-', xOff+(10*TILESIZE)+HALFTILE, yOff, [216, 40, 0]); 
	
	tmpLife = env.player.health;
	var yPos = (TILESIZE*1.5);
	var xPos = 0;
	for(var i=0; i < env.player.items.hearts; i++) {
		if(tmpLife >= 1) {
			xAdd = 0;
			yAdd = 0;
		} else if(tmpLife >= 0.5) {
			xAdd = 1;
			yAdd = 0;
		}
		else {
			xAdd = 0;
			yAdd = 1;
		}
		
		if(xPos==8) {
			yPos -= 0.5*TILESIZE;
			xPos = 0;
		}
		
		ctx.drawImage(env.spriteSheet, (22*TILESIZE)+(xAdd*HALFTILE), yAdd*HALFTILE, HALFTILE, HALFTILE, xOff+(10*TILESIZE)+(xPos++*HALFTILE), yOff+yPos, HALFTILE, HALFTILE); // Heart
		tmpLife--;
	}
}

/**************************
 * Paint helper functions *
 **************************/

function paintRoom(tintFrom, tintTo){
	var room = rooms.getCurrentRoom();
	ctxBg.clearRect(0,0,WIDTH,HEIGHT);

	if(room.bgRect) {
		filledRectangle(room.bgRect[0]*TILESIZE, (room.bgRect[1]*TILESIZE)+4*TILESIZE, room.bgRect[2]*TILESIZE, room.bgRect[3]*TILESIZE,room.bgRect[4],ctxBg);

	}

	y = 4, x = 0;
	var tileset = room.tileset;
	
	Array.each(room.getTiles(), function(row) {
		x = 0;
		Array.each(row, function(tile) {
			if(tile.sprite) {
				placeTile(tile.sprite, x*(TILESIZE/SCALE), YOFF+y*(TILESIZE/SCALE), tintFrom ? tintFrom : tile.tintFrom, tintTo ? tintTo : tile.tintTo, null, tile.flip, ctxBg);
			}
			if(window.spriteDebug) {
				ctxBg.beginPath();
				ctxBg.strokeStyle="#f0f";
				ctxBg.rect(x*TILESIZE, y*TILESIZE, TILESIZE, TILESIZE);
				ctxBg.stroke();
			}
			x++;
		});
		y++;
	});
}

function placeTile(frame, x, y, tintFrom, tintTo, rotate, flip, tCtx) {
	if(!tCtx) tCtx = ctx;
	x = Math.round(x*SCALE);
	y = Math.round(y*SCALE);
	tmpX = x; tmpY = y;
	if(tintTo && TintCache.get(tintTo, frame)) {
		return tCtx.putImageData(TintCache.get(tintTo, frame), x, y);
	}
	if(rotate || flip) {
		tmpY = 16/-2;
		tmpX = 16/-2;;
		rotate = rotate*Math.PI;
		tCtx.save(); 
		tCtx.translate(x+8, y+8);
		if(rotate)
			tCtx.rotate(rotate);
		if(flip)
			tCtx.scale((flip.contains('x') ? -1 : 1), (flip.contains('y') ? -1 : 1));
	}
	tCtx.drawImage(env.spriteSheet
		,(frame*SPRITESIZE)
		,0
		,SPRITESIZE, SPRITESIZE, tmpX, tmpY, TILESIZE, TILESIZE);
	if(rotate || flip) {
		tCtx.restore();
	}

	if(tintTo) {
		map = tCtx.getImageData(x, y, TILESIZE, TILESIZE);
		imdata = map.data;
		for(var p = 0, len = imdata.length; p < len; p+=4) {
			r = imdata[p]
			g = imdata[p+1];
			b = imdata[p+2];
			
			if(tintFrom[0] instanceof Array) {
				for(var i=0;i<tintFrom.length;i++) {
					if(r == tintFrom[i][0] && g == tintFrom[i][1] && b == tintFrom[i][2]) {
						imdata[p] = tintTo[i][0];
						imdata[p+1] = tintTo[i][1];
						imdata[p+2] = tintTo[i][2];
					}
				}
			}
			else {
				if(r == tintFrom[0] && g == tintFrom[1] && b == tintFrom[2]) {
					imdata[p] = tintTo[0];
					imdata[p+1] = tintTo[1];
					imdata[p+2] = tintTo[2];
				}
			}
		}
		TintCache.set(tintTo, frame, map);
		return tCtx.putImageData(map, x, y);
	}
}

function filledRectangle(x, y, w, h, c, tCtx, stroked) {
	if(!tCtx) tCtx = ctx;
	tCtx.beginPath();
	if(stroked === true)
		tCtx.strokeStyle=c;
	else
		tCtx.fillStyle=c;
	tCtx.rect(x, y, w, h);
	if(stroked === true)
		tCtx.stroke();
	else
		tCtx.fill();
}


function writeText(string, x, y, color, tCtx) {
	if(!tCtx) tCtx = ctx;
	var xOff = 0;
	Array.each(string.toLowerCase(), function(c){
		if(c == "\n") {
			y+= HALFTILE;
			xOff = 0;
			return;
		}
		char = font[c];
		if(char) {
			tCtx.drawImage(
				env.spriteSheet, 
				(23*TILESIZE)+(char[0]*HALFTILE), 
				char[1]*HALFTILE, 
				HALFTILE, 
				HALFTILE, 
				(x+(xOff*HALFTILE)), 
				y, 
				HALFTILE, 
				HALFTILE);
			if(color) {
				map = tCtx.getImageData(x+(xOff*HALFTILE), y, HALFTILE, HALFTILE);
				imdata = map.data;
				for(var p = 0, len = imdata.length; p < len; p+=4) {
					r = imdata[p]
					g = imdata[p+1];
					b = imdata[p+2];
					
					if(r == 252 && g == 252 && b == 252) {
						imdata[p] = color[0];
						imdata[p+1] = color[1];
						imdata[p+2] = color[2];
					}
					
				}
				tCtx.putImageData(map, x+(xOff*HALFTILE), y);
				
			}
		}
		xOff++;
	});
}

function drawBorder(x, y, w, h) {
	if(w < 2 || h < 2) { console.error('Too small border size specified'); return false;}
	
	var totalRows = h-2,
		totalCols = w-2
		currentCol = 0,
		currentRow = 0;

	// Top 
	ctx.drawImage(env.spriteSheet
		,(50*TILESIZE)
		,0
		,HALFTILE, HALFTILE
		,x+(currentCol++*HALFTILE)
		,y
		,HALFTILE, HALFTILE);
		
	for(var i=0; i<totalCols; i++) {
		ctx.drawImage(env.spriteSheet
			,(51*TILESIZE)+0
			,0
			,HALFTILE, HALFTILE
			,x+(currentCol++*HALFTILE) 
			,y
			,HALFTILE, HALFTILE);
	}
	ctx.drawImage(env.spriteSheet
		,(50*TILESIZE)+HALFTILE
		,0
		,HALFTILE, HALFTILE
		,x+(currentCol++*HALFTILE) 
		,y
		,HALFTILE, HALFTILE);

	currentRow++;

	//Sides  
	for(var i=0; i<totalRows; i++) {
		ctx.drawImage(env.spriteSheet
			,(51*TILESIZE)+HALFTILE
			,0
			,HALFTILE, HALFTILE
			,x
			,y+(currentRow*HALFTILE)
			,HALFTILE, HALFTILE);
		ctx.drawImage(env.spriteSheet
			,(51*TILESIZE)+HALFTILE
			,0
			,HALFTILE, HALFTILE
			,x+HALFTILE+(HALFTILE*totalCols)
			,y+(currentRow++*HALFTILE)
			,HALFTILE, HALFTILE);
	}

	// Bottom
	currentCol=0;
	ctx.drawImage(env.spriteSheet
		,(50*TILESIZE)+0
		,HALFTILE
		,HALFTILE, HALFTILE
		,x+(currentCol++*HALFTILE)
		,y+(currentRow*HALFTILE)
		,HALFTILE, HALFTILE);
	for(var i=0; i<totalCols; i++) {
		ctx.drawImage(env.spriteSheet
			,(51*TILESIZE)+0
			,0
			,HALFTILE, HALFTILE
			,x+(currentCol++*HALFTILE) 
			,y+(currentRow*HALFTILE)
			,HALFTILE, HALFTILE);
	}
	ctx.drawImage(env.spriteSheet
		,(50*TILESIZE)+HALFTILE
		,HALFTILE
		,HALFTILE, HALFTILE
		,x+(currentCol++*HALFTILE)
		,y+(currentRow*HALFTILE)
		,HALFTILE, HALFTILE);

}

/*********************
 * Utility functions *
 *********************/
function drawPalettes() {
	Array.each(env.palettes, function(palette) {
		new Element('div', {
			styles:{
				 height:'16px'
				,float:'left'
			}}).set('text', 'Palette').inject(document.body);
		Array.each(palette, function(color) {
			new Element('div', {
				styles:{
					 height:'16px'
					,width:'16px'
					,float:'left'
					,background:color.rgbToHex()
				}}).inject(document.body);
		});
	});
}

function drawNumberedTiles() {
	for(var i = 0; i < Math.ceil(env.spriteSheet.width/TILESIZE); i++) {
		var x = new Element('canvas', {width: 24, height: 24, styles: {border:'1px dotted magenta',margin:'1px'}}).inject(document.body);
		tCtx = x.getContext('2d');
		tCtx.drawImage(env.spriteSheet
			,(i*TILESIZE)
			,0
			,TILESIZE, TILESIZE
			,4
			,0
			,TILESIZE, TILESIZE);
		t = i.toString();
		writeText(i.toString(), (t.length == 1 ? HALFTILE/2 : 0), TILESIZE, null, tCtx);
	}
}

function isPaused(o) {
	return env.paused && o.inSpaceTime;
}

/***********************
 * Main animation loop *
 ***********************/
function animate() {
	//if(!env.paused) {
	Array.each(solidObjects, function(o){
		if(!isPaused(o) && o.isActive)
			o.move();
	});
	Array.each(rooms.getCurrentRoom().MOBs, function(o){
		if(!isPaused(o) && o.isActive)
			o.move();
	});
	//}
	ctx.clearRect(0,0,WIDTH,HEIGHT);
	paintHeader();
	Array.each(rooms.getCurrentRoom().MOBs, function(o){
		if(o.isActive) {
			//if(window.collisionDebug) filledRectangle(xTile*TILESIZE, (yTile+4)*TILESIZE, TILESIZE, TILESIZE, '#00f');
			if(window.collisionDebug) filledRectangle(o.x, o.y, o.width, o.height, '#f00');
			o.draw();
		}
	});
	Array.each(solidObjects, function(o){
		if(o.isActive)
			o.draw();
	});

	window.requestAnimationFrame(animate);
}

function changeScale(scale) {
	new Element('canvas', {id: 'background', width: 256*scale, height: 240*scale}).replaces($('background'));
	new Element('canvas', {id: 'screen', width: 256*scale, height: 240*scale}).replaces($('screen'));
	ctxBg = $('background').getContext('2d');
	ctxBg.webkitImageSmoothingEnabled=false;
	ctx = $('screen').getContext('2d');
	ctx.webkitImageSmoothingEnabled=false;
	SCALE = scale
	TILESIZE = 16*SCALE;
	HALFTILE = TILESIZE/2;
	WIDTH = 256*SCALE;
	HEIGHT = 240*SCALE;
	paintRoom();
	paintHeader();
}

function sc(inp) {
	return inp*SCALE;
}

function continueGame() {
	switchRoom(7,7,overworld);
	var save = Object.clone(env.player.items);
	env.player.destroy();
	console.log(save);
	env.player = new Link(WIDTH/2, HEIGHT/2);
	env.player.items = save;
}

function loadGame() {
	if(localStorage['items_bombs']) env.player.items.bombs = Number(localStorage['items_bombs']);
	if(localStorage['items_rupees']) env.player.items.rupees = Number(localStorage['items_rupees']);
	if(localStorage['items_keys']) env.player.items.keys = Number(localStorage['items_keys']);
	if(localStorage['items_hearts']) env.player.items.hearts = Number(localStorage['items_hearts']);
	if(localStorage['items_sword']) env.player.items.sword = Number(localStorage['items_sword']);
}

function tintWorld() {
	var deathPalette = [[188,188,188], [116,116,116], [252,252,252]];
	palette = deathPalette;
	var clrs = [[0,168,0], [200,76,12]];
	map = ctxBg.getImageData(0, 0, WIDTH, HEIGHT);
	imdata = map.data;
	for(var p = 0, len = imdata.length; p < len; p+=4) {
		r = imdata[p]
		g = imdata[p+1];
		b = imdata[p+2];
		Array.each(clrs, function(i) {
			//Array.each(fromPalette, function(i, k){
				if(r == i[0] && g == i[1] && b == i[2]) {
					imdata[p] = palette[0][0];
					imdata[p+1] = palette[0][1];
					imdata[p+2] = palette[0][2];
				}
			//});
		});
	}
	ctxBg.putImageData(map, 0, 0);
}
