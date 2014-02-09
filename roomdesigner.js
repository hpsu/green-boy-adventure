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
	});

	$('screen').addEvent('contextmenu', function(e) {
		if(!e.shift)
		e.preventDefault();
	});

	setCanvasSize();
	repaint();
});

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
		else if(pos.x >= 0.5*HALFTILE && pos.x <= (0.5*HALFTILE)+(10*SCALE) && pos.y >= 1*SCALE && pos.y <= 11*SCALE) {
			filledRectangle(0.5*HALFSPRITE, 1, 10, 10, "rgba(255,255,240,0.5)", ctx);
			if(e.type=='mousedown') {
				if(env.spritePage > 0) {
					env.spritePage--;
					repaint();
				}
			}
		}
		else if(pos.x >= 18.5*HALFTILE && pos.x <= (18.5*HALFTILE)+(10*SCALE) && pos.y >= 1*SCALE && pos.y <= 11*SCALE) {
			filledRectangle(18.5*HALFSPRITE, 1, 10, 10, "rgba(255,255,240,0.5)", ctx);
			if(e.type=='mousedown') {
				if(env.spritePage < env.spritePageCount) {
					env.spritePage++;
					repaint();
				}
			}
		}
	}
}

window.addEvent('resize', function () {
	setCanvasSize();
	repaint();
});

function repaint() {
	paintRoom();
	drawREHeader();
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
	SpriteCatalog.draw('Triforce', 0.5*HALFSPRITE, 1, {ctx: ctxBg, direction: 270});
	SpriteCatalog.draw('Triforce', 18.5*HALFSPRITE, 1, {ctx: ctxBg, direction: 90});
	
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