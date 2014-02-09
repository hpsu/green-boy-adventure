window.addEvent('load', function(){
	env.currentSprite = 16;
	env.spriteOffset = 8;
	env.spritesPerPage = 14;
	env.spritePage = 0;
	env.spriteCount = env.spriteSheet.width/SPRITESIZE;
	env.spritePageCount = Math.ceil(env.spriteCount/env.spritesPerPage);
	env.background = '#fcd8a8';

	ctxBg = $('background').getContext('2d');
	ctx = $('screen').getContext('2d');
	
	$('screen').addEvents({
		'mousemove': paintTile
		,'mousedown': paintTile
		,'contextmenu': function(e) { if(!e.shift) e.preventDefault(); }
	});
	env.clickables = [];
	
	// Next page button
	new clickableTile('Triforce', HALFSPRITE*18.5, 1, 10, 10, {
		direction: 90
		,click: nextPage
		,palette: 3
		,mouseover: function() {this.palette=2;}
		,mouseout: function() {this.palette=3;}
	});

	// Previous page button
	new clickableTile('Triforce', HALFSPRITE*0.5, 1, 10, 10, {
		direction: 270
		,click: prevPage
		,palette: 3
		,mouseover: function() {this.palette=2;}
		,mouseout: function() {this.palette=3;}
	});

	setCanvasSize();
	repaint();
});

function nextPage() {
	if(env.spritePage < env.spritePageCount) {
		env.spritePage++;
		repaint();
	}
}
function prevPage() {
	if(env.spritePage > 0) {
		env.spritePage--;
		repaint();
	}
}

function drawClickables(e) {
	for(var i=0; i<env.clickables.length;i++) {
		env.clickables[i].draw(e);
	}
}

function paintTile(e) {
	var pos = getMouseTile(e);
	ctx.clearRect(0,0,WIDTH,HEIGHT);

	if(pos.yTile >= 4) {
		if(e.event.which) {
			var room = rooms.getCurrentRoom();
			var tile = room.tiles[pos.yTile-4][pos.xTile];
			if(e.rightClick) {
				tile.sprite = -1;
			}
			else 
				tile.sprite = env.currentSprite;
			repaint();

		}
		ctx.globalAlpha = 0.3;
		filledRectangle(pos.xTile*SPRITESIZE,pos.yTile*SPRITESIZE,SPRITESIZE,SPRITESIZE, "rgba(255,255,240,0.9)");
		placeTile(env.currentSprite, pos.xTile*SPRITESIZE,pos.yTile*SPRITESIZE);
	}
	else {
		drawClickables(e);
		ctx.globalAlpha = 1;
		xOff = SPRITESIZE*0.75;
		yOff = SPRITESIZE*1.125;
		if(pos.x > xOff+HALFTILE && pos.x < xOff+(HALFTILE*17.5) && pos.y > yOff*SCALE && pos.y < ((yOff*SCALE) + (2.125*TILESIZE))) {
			xTile = Math.floor(((0.75*TILESIZE) + pos.x) / (TILESIZE * 1.25));
			yTile = Math.round(((1.125*TILESIZE) + pos.y) / (TILESIZE * 1.25));

			if(e.type=='mousedown') {
				env.currentSprite = (env.spritePage * env.spritesPerPage) + (yTile-2)*(env.spritesPerPage/2) + (xTile-1);
				repaint();
			}
			x = (xTile * (SPRITESIZE * 1.25))-8;
			y = (yTile * (SPRITESIZE * 1.25))-(1.25*SPRITESIZE)-2;

			filledRectangle(x, y, SPRITESIZE, SPRITESIZE, "rgba(255,255,240,0.8)");
		}
	}
}

var clickableTile = new Class({
	 x: 0
	,y: 0
	,w: 0
	,h: 0
	,direction: 0
	,sprite: 0
	,initialize: function(s,x,y,w,h,params) {
		this.sprite = s;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		if(typeof params != 'undefined') {
			if(typeof params['direction'] != 'undefined') {
				this.direction = params['direction'];
			}
			if(typeof params['click'] != 'undefined') {
				this.click = params['click'];
			}
			if(typeof params['palette'] != 'undefined') {
				this.palette = params['palette'];
			}
			if(typeof params['mouseover'] != 'undefined') {
				this.mouseover = params['mouseover'];
			}
			if(typeof params['mouseout'] != 'undefined') {
				this.mouseout = params['mouseout'];
			}
		}
		env.clickables.push(this);
		this.draw();
	}
	,click: function() {
		console.log('Someone clicked me!');
	}
	,mouseover: function() {
		filledRectangle(this.x, this.y, this.w, this.h, "rgba(255,0,240,0.5)", ctx);
	}
	,mouseout: function() {

	}
	,mouseInBox: function(e) {
		if(!e) return false;
		var pos = getMouseTile(e);
		pos.x /= SCALE;
		pos.y /= SCALE;
		var  ax1 = this.x
			,ax2 = this.x+this.w
			,ay1 = this.y
			,ay2 = this.y+this.h
			,bx1 = pos.x
			,bx2 = pos.x+1
			,by1 = pos.y
			,by2 = pos.y+1;

		return (ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1);
	}
	,draw: function(e) {
		if(isNaN(this.sprite)) {
			var params = {ctx: ctxBg};
			if(this.direction) params['direction'] = this.direction;
			if(this.palette) params['palette'] = this.palette;
			SpriteCatalog.draw(this.sprite, this.x, this.y, params);
		}
		else
			placeTile(this.sprite, this.x, this.y, null, null, null, null, ctxBg);
		if(this.mouseInBox(e)) {
			this.mouseover();
			if(e.type == 'mousedown') {
				this.click();
			}
		}
		else {
			this.mouseout();
		}
	}
});

window.addEvent('resize', function () {
	setCanvasSize();
	repaint();
});

function repaint() {
	paintRoom();
	drawREHeader();
	drawClickables();
}

function getMouseTile(e) {
	var rect = $('screen').getBoundingClientRect();
	return {
		x: e.client.x-rect.left
		,y: e.client.y-rect.top
		,xTile: Math.floor((e.client.x-rect.left)/TILESIZE)
		,yTile: Math.floor((e.client.y-rect.top)/TILESIZE)
	};
}

function drawREHeader() {
	var yOff = YOFF+(SPRITESIZE*1.5),
	xOff = SPRITESIZE;

	// Background
	filledRectangle(0, YOFF, 16*SPRITESIZE, 4*SPRITESIZE, "#000", ctxBg);


	// Pickable tiles
	writeText("  page "+String("00" + Number(env.spritePage+1)).slice(-2)+' of '+env.spritePageCount, HALFSPRITE*1.5, 2, 2, ctxBg);
	
	filledRectangle(0.5*SPRITESIZE-3, 1*SPRITESIZE-3, (SPRITESIZE*1.5)*6+6, SPRITESIZE*2.5+6, env.background, ctxBg);
	drawBorder(0, HALFSPRITE, 20,7, ctxBg);
	var y = SPRITESIZE*1.125;
	var j = 0;
	for(var i=(env.spritePage*env.spritesPerPage); i<((env.spritePage+1)*env.spritesPerPage); i++) {
		if(i>(env.spritePage*env.spritesPerPage) && i%7 == 0) {
			y += SPRITESIZE*1.25;
			j = 0;
		} 
		placeTile(i, (SPRITESIZE*0.75)+(j++*1.25*SPRITESIZE), y, null, null, null, null, ctxBg);
	}
	
	// Current tile
	drawBorder(SPRITESIZE*14, SPRITESIZE*2, 4,4, ctxBg);
	filledRectangle(14.5*SPRITESIZE-3, 2.5*SPRITESIZE-3, SPRITESIZE+6, SPRITESIZE+6, env.background, ctxBg);
	placeTile(env.currentSprite, SPRITESIZE*14.5, SPRITESIZE*2.5,  null, null, null, null, ctxBg);
}