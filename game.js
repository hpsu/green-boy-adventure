// Global vars
var canvas = null
	,ctx = null
	,WIDTH
	,HEIGHT
	,TILESIZE = 16
	,HALFTILE = 8
	,solidObjects = []
	,img = new Image()
	,keyStates = {};


img.src='sprites.png';

window.addEvent('load', function () {
    canvas = document.getElementById("screen");
    ctx = canvas.getContext("2d");
    ctx.webkitImageSmoothingEnabled = false;
    ctx.scale(2,2);
   
	WIDTH = 256;
	HEIGHT = 240;
	
	new Link(WIDTH/2, HEIGHT/2);
	
	window.requestAnimationFrame(animate);
});

// Record keypresses
window.addEvent('keydown', function(e) { keyStates[e.key] = true; });
window.addEvent('keyup', function(e) { keyStates[e.key] = false; });


/*
 * Base skeleton class for all Mobile OBjects
 */
var Mob = new Class({
	initialize: function(x,y){
		solidObjects.unshift(this);
		this.x = x ? x : Math.floor((Math.random()*WIDTH)+1);
		this.y = y ? y : Math.floor((Math.random()*HEIGHT)+1);
	}
	,move: function() {
		this.draw();
	},draw: function() {}
});


var Link = new Class({
	Extends: Mob,
	initialize: function(x,y) {
		this.parent(x,y);
		this.animFrame = 0;
		this.lastUpdateTime = 0;
		this.msPerFrame = 100;
		this.acDelta = 0;
		this.moving = false
		this.direction = 'up';
		this.frames = {
			left: [0, 1]
			,right: [2, 3]
			,up: [4, 5]
			,down: [6, 7]		
			,leftItem: [8]
			,rightItem: [9]
			,upItem: [10]
			,downItem: [11]
		};
		this.usingItem = false;
	}
	,move: function() {
		switch(true) {
			case this.usingItem != false:
				break;
			case keyStates['space'] && this.usingItem == false:
				this.usingItem = new Sword(this);
				break;
			case keyStates['down']: case keyStates['s']:
				this.y = this.y+1.3;
				this.moving = true;
				this.direction = 'down';
				break;
			case keyStates['up']: case keyStates['w']:
				this.y = this.y-1.3;
				this.moving = true;
				this.direction = 'up';
				break;

			case keyStates['right']: case keyStates['d']:
				this.x = this.x+1.3;
				this.moving = true;
				this.direction = 'right';
				break;
			case keyStates['left']: case keyStates['a']:
				this.x = this.x-1.3;
				this.moving = true;
				this.direction = 'left';
				break;
				

		}
		
		this.draw();		
	}
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;
		if(this.usingItem) {
			//@TODO: Link should animate when subtracting the sword (walking frames from right to left)
			this.acDelta = 0;
			this.usingItem.draw();
			this.animFrame = 0;
		}		
		else if(this.moving && this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(typeof this.frames[this.direction][++this.animFrame] == 'undefined') this.animFrame=0;
		}
		frame = this.frames[this.direction+(this.usingItem?'Item':'')][this.animFrame];
		ctx.drawImage(img, (frame*TILESIZE), 0,TILESIZE, TILESIZE, this.x, this.y, TILESIZE, TILESIZE);
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
		this.moving = false;
	}
	
});

var room = [
	 [16,16,16,16,16,16,16,-1,-1,16,16,16,16,16,16,16]
	,[16,16,16,16,-1,16,18,-1,-1,16,16,16,16,16,16,16]
	,[16,16,16,18,-1,-1,-1,-1,-1,16,16,16,16,16,16,16]
	,[16,16,18,-1,-1,-1,-1,-1,-1,16,16,16,16,16,16,16]
	,[16,18,-1,-1,-1,-1,-1,-1,-1,17,16,16,16,16,16,16]
	,[]
	,[19,20,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,19,19]
	,[16,16,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,16,16]
	,[16,16,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,16,16]
	,[16,16,19,19,19,19,19,19,19,19,19,19,19,19,16,16]
	,[16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
];


function paintRoom(){
	y = 4, x = 0;
	Array.each(room, function(row) {
		x = 0;
		Array.each(row, function(column) {
			if(column > -1) {
				ctx.drawImage(img, (column*TILESIZE), 0,TILESIZE, TILESIZE, x*TILESIZE, y*TILESIZE, TILESIZE, TILESIZE);
			}
			x++;
		});
		y++;
	});
}

/* 
 * Header related code
 * 
 * */

function filledRectangle(x, y, w, h, c) {
	ctx.beginPath();
	ctx.fillStyle=c;
	ctx.rect(x, y, w, h);
	ctx.fill();
}

function paintHeader() {
	var yOff = TILESIZE*1.5,
		xOff = TILESIZE;

	// Background
	filledRectangle(0, 0, 16*TILESIZE, 4*TILESIZE, "#000");

	for(var io=0; io<2; io++) {
	for(var i=0; i<16; i++) {
		ctx.beginPath();
		ctx.strokeStyle='#f00';
		ctx.rect((i*TILESIZE), yOff+(io*TILESIZE), TILESIZE, TILESIZE);
		ctx.stroke();
	}
	}

	
	// Map
	filledRectangle(xOff, yOff, 4*TILESIZE, 2*TILESIZE, "#747474");
	
	// Rupees
	ctx.drawImage(img, (21*TILESIZE), 0,HALFTILE, HALFTILE, xOff+(4*TILESIZE)+HALFTILE, yOff, HALFTILE, HALFTILE); // Rupee
	writeText('X0', xOff+(4*TILESIZE)+HALFTILE, yOff); 

	// Keys
	ctx.drawImage(img, (21*TILESIZE)+HALFTILE, 0,HALFTILE, HALFTILE, xOff+(4*TILESIZE)+HALFTILE, yOff+(TILESIZE), HALFTILE, HALFTILE); // Key
	writeText('X0', xOff+(4*TILESIZE)+HALFTILE, yOff+TILESIZE); 

	// Bombs
	ctx.drawImage(img, (21*TILESIZE)+HALFTILE, HALFTILE, HALFTILE, HALFTILE, xOff+(4*TILESIZE)+HALFTILE, yOff+(TILESIZE*1.5), HALFTILE, HALFTILE); // Bomb
	writeText('X0', xOff+(4*TILESIZE)+HALFTILE, yOff+(HALFTILE*3)); 




	writeText('B', xOff+(6*TILESIZE)+HALFTILE, yOff); 
	writeText('A', xOff+(8*TILESIZE), yOff); 

	writeText('-LIFE-', xOff+(10*TILESIZE), yOff); 
	data = ctx.getImageData(xOff+(10*TILESIZE), yOff, HALFTILE*6, HALFTILE);
	//console.log(data);
	
}


var font = {
	 a: [ 0, 0],b: [ 1, 0],e: [ 2, 0],f: [ 3, 0],i: [ 4, 0],j: [ 5, 0],m: [ 6, 0],n: [ 7, 0],q: [ 8, 0],r: [ 9, 0],u: [10, 0],v: [11, 0],  y: [12, 0],  z: [13, 0],',': [14, 0],'!': [15, 0],'.': [16, 0],0: [17, 0],3: [18, 0],4: [19, 0],7: [20, 0],8: [21, 0]
	,c: [ 0, 1],d: [ 1, 1],g: [ 2, 1],h: [ 3, 1],k: [ 4, 1],l: [ 5, 1],o: [ 6, 1],p: [ 7, 1],s: [ 8, 1],t: [ 9, 1],w: [10, 1],x: [11, 1],'-': [12, 1],'.': [13, 1],"'": [14, 1],'&': [15, 1],  1: [16, 1],2: [17, 1],5: [18, 1],6: [19, 1],9: [20, 1]
};

function writeText(string, x, y) {
	var xOff = 0;
	Array.each(string.toLowerCase(), function(c){
		char = font[c];
		if(char) ctx.drawImage(
			img, 
			(23*TILESIZE)+(char[0]*HALFTILE), 
			char[1]*HALFTILE, 
			HALFTILE, 
			HALFTILE, 
			x+(xOff*HALFTILE)+HALFTILE, 
			y, 
			HALFTILE, 
			HALFTILE);
		xOff++;
	});
}

/*
 * Main animation loop
 */
function animate() {
	ctx.clearRect(0,0,WIDTH,HEIGHT);
	paintRoom();
	paintHeader();
	Array.each(solidObjects, function(o){
		o.move();
	});

	window.requestAnimationFrame(animate);
}
