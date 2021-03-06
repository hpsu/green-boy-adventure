var SpriteCache = {};

var Sprite = new Class({
	buffer: {},
	width: SPRITESIZE,
	height: SPRITESIZE,
	size: SPRITESIZE,
	direction: 0,
	positiony: 0,
	paletteType: 'main',
	positionx: 0,
	defaultPalette: 0,
	initialize: function(position, params){
		this.positionx = position;
		if(typeof params != 'undefined') {
			if(typeof params.fromPalette != 'undefined') {
				this.tintFrom = env.palettes[params.fromPalette];
				this.tintTo = env.palettes[params.toPalette];
			}
			if(typeof params.size != 'undefined') {
				this.width = params.size;
				this.height = params.size;
				this.row = 0;
			}
			else if(typeof params.width != 'undefined') {
				this.width = params.width;
				this.height = params.height;
			}
			if(params.paletteType) {
				this.paletteType = params.paletteType;
			}
			if(typeof params.posy != 'undefined') {
				this.positiony = params.posy;
			}
			if(typeof params.palette != 'undefined') {
				this.defaultPalette = params.palette;
			}
			if(typeof params.spriteSheet != 'undefined') {
				this.spriteSheet = params.spriteSheet;
			}
			else 
				this.spriteSheet = env.spriteSheet;
		}
	}
	,hash: function() {

		return Array.slice(arguments).join('.');
	}
	,getRotatedDimensions: function(w,h,direction) {
		var rads=direction*Math.PI/180;
		var c = Math.cos(rads);
		var s = Math.sin(rads);
		if (s < 0) { s = -s; }
		if (c < 0) { c = -c; }
		
		return {
			w: Math.round(h * s + w * c)
			,h: Math.round(h * c + w * s)
			,rads: rads
		};
	}
	,draw: function(tCtx, x, y, direction, flip, palette) {
		var h = this.hash(direction,flip,palette);
		if(!this.buffer[h]) this.create(direction, flip, palette);

		dim = this.getRotatedDimensions(this.width, this.height, typeof direction == 'undefined' ? this.direction : direction);

		if(window.spriteCatalogDebug)
			filledRectangle(x, y, dim.w, dim.h, 'rgba(255,0,255,0.2)', tCtx);

		tCtx.drawImage(this.buffer[h], 0, 0, dim.w, dim.h, x*SCALE, y*SCALE, Math.round(dim.w*SCALE), Math.round(dim.h*SCALE));
	}
	,create: function(direction, flip, palette){
		var h = this.hash(direction,flip,palette);
		if(this.buffer[h]) return this.buffer[direction];
		this.buffer[h] = document.createElement('canvas');
		this.buffer[h].width = this.width;
		this.buffer[h].height = this.height;

		var tmpX = 0, tmpY = 0;
		var tCtx = this.buffer[h].getContext('2d');
		if(direction > 0 || flip) {
			dim = this.getRotatedDimensions(this.width, this.height, typeof direction == 'undefined' ? this.direction : direction);

			this.buffer[h].width = dim.w;
			this.buffer[h].height = dim.h;

			tmpY = this.height/-2;
			tmpX = this.width/-2;
			tCtx.translate((dim.w/2), (dim.h/2));
			if(direction > 0) {
				if(window.spriteCatalogDebug) console.log('rotating to',direction);
				tCtx.rotate(dim.rads);
			}
			if(flip) {
				if(window.spriteCatalogDebug) console.log('flipping',flip);
				tCtx.scale((flip.contains('x') ? -1 : 1), (flip.contains('y') ? -1 : 1));
			}
		}

		tCtx.drawImage(
			this.spriteSheet, 
			this.positionx*this.width,
			this.positiony*this.height,
			this.width,
			this.height,
			tmpX, //dstX
			tmpY, //dstY
			Math.round(this.width),
			this.height
		);

		//palette
		if(typeof palette != 'undefined' && palette != this.defaultPalette) {
			if(window.spriteCatalogDebug) console.log('tinting to palette',palette);
			var map = tCtx.getImageData(0, 0, (direction > 0 ? dim.w : this.width), (direction > 0 ? dim.h :this.height)),
				imdata = map.data
				tintFrom = env.palettes[this.paletteType][this.defaultPalette]
				tintTo = env.palettes[this.paletteType][palette];
			for(var p = 0, len = imdata.length; p < len; p+=4) {
				r = imdata[p]
				g = imdata[p+1];
				b = imdata[p+2];
				
				for(var i=0;i<tintFrom.length;i++) {
					if(r == tintFrom[i][0] && g == tintFrom[i][1] && b == tintFrom[i][2]) {
						imdata[p] = tintTo[i][0];
						imdata[p+1] = tintTo[i][1];
						imdata[p+2] = tintTo[i][2];
					}
				}
			}
			tCtx.putImageData(map, 0, 0);
		}

		// Deprecated, remove once all sprites use the same palette
		if(this.tintFrom) {
			console.warn('DEPRECATED - tinting from',this.tintFrom);
			var map = tCtx.getImageData(0, 0, this.width, this.height);
			imdata = map.data;
			for(var p = 0, len = imdata.length; p < len; p+=4) {
				r = imdata[p]
				g = imdata[p+1];
				b = imdata[p+2];
				
				if(this.tintFrom[0] instanceof Array) {
					for(var i=0;i<this.tintFrom.length;i++) {
						if(r == this.tintFrom[i][0] && g == this.tintFrom[i][1] && b == this.tintFrom[i][2]) {
							imdata[p] = this.tintTo[i][0];
							imdata[p+1] = this.tintTo[i][1];
							imdata[p+2] = this.tintTo[i][2];
						}
					}
				}
				else {
					if(r == this.tintFrom[0] && g == this.tintFrom[1] && b == this.tintFrom[2]) {
						imdata[p] = this.tintTo[0];
						imdata[p+1] = this.tintTo[1];
						imdata[p+2] = this.tintTo[2];
					}
				}
			}
			tCtx.putImageData(map, 0, 0);
		}

		return this.buffer[h];
	}
});

var SpriteCatalog = {
	// 16x16
	Sword: {col: [12]}
	,SwordRipple: {col: [13]}
	,Link0: {col: [2,3]}// right
	,Link90: {col: [6,7]} // down
	,Link180: {col: [0,1]} //left
	,Link270: {col: [4,5]}
	,LinkItem0: {col: [9]}
	,LinkItem90: {col: [11]}
	,LinkItem180: {col: [8]}
	,LinkItem270: {col: [10]}
	,LinkGainItem: {col: [109]}
	,OldMan: {col: [85]}
	,OldWoman: {col: [103]}
	,YoungMan: {col: [104]}
	,Fire: {col: [84]}
	,HeartContainer: {col: [107]}
	,Compass: {col: [127]}
	,Triforce: {col: [144/10*16], width: 10, height: 10}
	,MovableBlock: {col: [284], palette: 0}
	,DoorLocked0: {col: [294], palette: 0}
	,DoorLocked90: {col: [298], palette: 0}
	,DoorLocked180: {col: [303], palette: 0}
	,DoorLocked270: {col: [298], palette: 0}
	,DoorOpen0: {col: [241], palette: 0}
	,DoorOpen90: {col: [300], palette: 0}
	,DoorOpen180: {col: [240], palette: 0}
	,DoorOpen270: {col: [299], palette: 0}
	,DoorShut0: {col: [295], palette: 0}
	,DoorShut90: {col: [304], palette: 0}
	,DoorShut180: {col: [295], palette: 0}
	,DoorShut270: {col: [304], palette: 0}
	,BombHole: {col: [306]}
	,Peahat: {col: [88,89], palette:2}
	,EnemySpawn: {col: [110,111,112]}
	,Octorok: {col: [113,114], palette:2}
	,Tektite: {col: [86,87], palette:2}
	,LeeverDive: {col: [76,77,81], palette: 2}
	,Leever: {col: [82,83], palette: 2}
	,Dive: {col: [76,77], palette: 2}
	,Zora90: {col: [79], palette: 1}
	,Zora270: {col: [78], palette: 1}
	,Moblin0: {col: [90,91], palette: 2}
	,Moblin90: {col: [92], flipMap: [null,'x'], palette: 2}
	,Moblin180: {col: [90,91], flipMap: ['x','x'], palette: 2}
	,Moblin270: {col: [93], flipMap: [null,'x'], palette: 2}
	,Lynel0: {col: [96,97], palette: 2}
	,Lynel90: {col: [98], flipMap: [null,'x'], palette: 2}
	,Lynel180: {col: [96,97], flipMap: ['x','x'], palette: 2}
	,Lynel270: {col: [99], flipMap: [null,'x'], palette: 2}
	,Ghini0: {col: [100], palette:2}
	,Ghini90: {col: [100], palette:2}
	,Ghini180: {col: [100], flipMap: ['x'], palette:2}
	,Ghini270: {col: [101], palette:2}
	,Armos: {col: [116,117], palette:2}
	,Armos90: {col: [116,117], palette:2}
	,Armos180: {col:[116,117], palette:2}
	,Armos270: {col: [118,119], palette:2}
	,Staflos: {col: [124], flipMap: [null,'x'], palette: 2}
	,Keese: {col: [125,126], palette: 3}
	,Wizzrobe0:	{col: [129], palette:2}
	,Wizzrobe90: {col: [129], palette:2}
	,Wizzrobe180: {col: [129], flipMap: ['x'], palette: 2}
	,Wizzrobe270: {col: [130], flipMap: ['x'], palette: 2}
	,Zol: {col: [133,134], palette: 2}
	,Goriya0: {col: [137,138], palette:2}
	,Goriya90:{col: [139], flipMap: [null,'x'], palette:2}
	,Goriya180:	{col: [137,138], flipMap: ['x','x'], palette:2}
	,Goriya270:	{col: [140], flipMap: [null,'x'], palette:2}
	,WallmasterUp: {col: [142,143]}
	,WallmasterDown: {col: [142,143], flipMap: ['y', 'y' ]}
	,BladeTrap: {col: [145], palette: 3}
	,Rope0: {col: [147,148], palette: 2}
	,Rope90: {col: [147,148], palette: 2}
	,Rope180: {col: [147,148], flipMap: ['x','x'], palette: 2}
	,Rope270: {col: [147,148], flipMap: ['x','x'], palette: 2}
	,Death: {col: [120,121], palette: 0}
	,Raft: {col: [122], palette:0}

	// 8x8
	,ArrowWake: {col: [95*2], size: 8}
	,SmallRupee: {col: [42], row: [0], size: 8}
	,SmallKey: {col: [43], row: [0], size: 8}
	,SmallBomb: {col: [43], row: [1], size: 8}
	,FullHeart: {col: [44], row: [0], size: 8, palette:2}
	,HalfHeart: {col: [45], row: [0], size: 8}
	,EmptyHeart: {col: [44], row: [1], size: 8}
	,TopLeftBorder: {col: [100], row: [0], size: 8}
	,TopRightBorder: {col: [101], row: [0], size: 8}
	,HorizontalBorder: {col: [102], row: [0], size: 8}
	,VerticalBorder: {col: [103], row: [0], size: 8}
	,BottomLeftBorder: {col: [100], row: [1], size: 8}
	,BottomRightBorder: {col: [101], row: [1], size: 8}
	,a: {col: [46], row: [0], size: 8, palette: 2}
	,b: {col: [47], row: [0], size: 8, palette: 2}
	,c: {col: [46], row: [1], size: 8, palette: 2}
	,d: {col: [47], row: [1], size: 8, palette: 2}
	,e: {col: [48], row: [0], size: 8, palette: 2}
	,f: {col: [49], row: [0], size: 8, palette: 2}
	,g: {col: [48], row: [1], size: 8, palette: 2}
	,h: {col: [49], row: [1], size: 8, palette: 2}
	,i: {col: [50], row: [0], size: 8, palette: 2}
	,j: {col: [51], row: [0], size: 8, palette: 2}
	,k: {col: [50], row: [1], size: 8, palette: 2}
	,l: {col: [51], row: [1], size: 8, palette: 2}
	,m: {col: [52], row: [0], size: 8, palette: 2}
	,n: {col: [53], row: [0], size: 8, palette: 2}
	,o: {col: [52], row: [1], size: 8, palette: 2}
	,p: {col: [53], row: [1], size: 8, palette: 2}
	,q: {col: [54], row: [0], size: 8, palette: 2}
	,r: {col: [55], row: [0], size: 8, palette: 2}
	,s: {col: [54], row: [1], size: 8, palette: 2}
	,t: {col: [55], row: [1], size: 8, palette: 2}
	,u: {col: [56], row: [0], size: 8, palette: 2}
	,v: {col: [57], row: [0], size: 8, palette: 2}
	,w: {col: [56], row: [1], size: 8, palette: 2}
	,x: {col: [57], row: [1], size: 8, palette: 2}
	,y: {col: [58], row: [0], size: 8, palette: 2}
	,z: {col: [59], row: [0], size: 8, palette: 2}
	,'-': {col: [58], row: [1], size: 8, palette: 2}
	,'.': {col: [59], row: [1], size: 8, palette: 2}
	,',': {col: [60], row: [0], size: 8, palette: 2}
	,'!': {col: [61], row: [0], size: 8, palette: 2}
	,"'": {col: [60], row: [1], size: 8, palette: 2}
	,'&': {col: [61], row: [1], size: 8, palette: 2}
	,'.': {col: [62], row: [0], size: 8, palette: 2}
	,0: {col: [63], row: [0], size: 8, palette: 2}
	,1: {col: [62], row: [1], size: 8, palette: 2}
	,2: {col: [63], row: [1], size: 8, palette: 2}
	,3: {col: [64], row: [0], size: 8, palette: 2}
	,4: {col: [65], row: [0], size: 8, palette: 2}
	,5: {col: [64], row: [1], size: 8, palette: 2}
	,6: {col: [65], row: [1], size: 8, palette: 2}
	,7: {col: [66], row: [0], size: 8, palette: 2}
	,8: {col: [67], row: [0], size: 8, palette: 2}
	,9: {col: [66], row: [1], size: 8, palette: 2}
	,'+': {col: [67], row: [1], size: 8, palette: 2}
	,Boomerang: {col: [141*2], size:8}

	// 8x16
	,Bracelet: {col: [132*2], width: 8, height: 16}
	,Potion: {col: [108*2], width: 8, height: 16}
	,Candle: {col: [106*2+1], width: 8, height: 16}
	,Bomb: {col: [123*2], width: 8, height: 16}
	,Rupee: {col: [123*2+1], width: 8, height: 16}
	,Shield: {col: [105*2], width: 8, height: 16}
	,Map: {col: [136*2], width: 8, height: 16}
	,MagicalSword: {col: [128*2], width: 8, height: 16}
	,Key: {col: [106*2], width: 8, height: 16}
	,Bone: {col: [108*2+1], width: 8, height: 16}
	,Fairy: {col: [60*2,60*2+1], width: 8, height: 16}
	,Arrow: {col: [94], width: 16, height: 5, palette: 2}
	,Bow: {col: [146*2], width: 8, height: 16}

	// Odd sizes
	,RockProjectile: {col: [115*2], width: 8, height: 10}
	,Fireball: {col: [80*2], width: 8, height: 10}
	,MagicProjectile: {col: [131]}
	,Gel: {col: [135*2, 135*2+1], width: 8, height: 9, palette: 2}
	,Aquamentus: {col: [0,1], spriteSheet: env.bossSpriteSheet, size: 32}
	,Dodongo0: {col: [2,2], row: [0,1], width: 32, height: 16, spriteSheet: env.bossSpriteSheet}
	,Dodongo90:	{col: [7], flipMap: [null,'x'], width: 16, height: 16, spriteSheet: env.bossSpriteSheet}
	,Dodongo180: {col: [2,2], row: [0,1], flipMap: ['x', 'x'], width: 32, height: 16, spriteSheet: env.bossSpriteSheet}
	,Dodongo270: {col: [6], flipMap: [null,'x'], width: 16, height: 16, spriteSheet: env.bossSpriteSheet}

	,getDimensions: function(key, direction) {
		if(!this[key]) {
			console.warn('No such sprite in catalog!');
			return false;
		}
		var animFrame = 0;
		if(!SpriteCache[key+animFrame]) SpriteCache[key+animFrame] = new Sprite(this[key]['col'][animFrame], this[key]);

		return SpriteCache[key+animFrame].getRotatedDimensions(SpriteCache[key+animFrame].width, SpriteCache[key+animFrame].height, typeof direction == 'undefined' ? SpriteCache[key+animFrame].direction : direction);
	}
	,draw: function(key, x, y, params) {
		if(!params) params = {};

		if(typeof params['direction'] != 'undefined' && this[key+params['direction']]) {
			key = key+params['direction'];
			delete params['direction'];
		}

		if(!this[key]) {
			console.warn('No such sprite in catalog!',key);
			return false;
		}
		var spriteParams = this[key]
			,tCtx = (params['ctx'] ? params['ctx'] : ctx)
			,animFrame = typeof params['animFrame'] != 'undefined' && typeof this[key]['col'][params['animFrame']] != 'undefined' ? params['animFrame'] : 0
			,flipFrame = typeof params['animFrame'] != 'undefined' ? params['animFrame'] : 0
			,posyFrame = typeof params['animFrame'] != 'undefined' && this[key]['row'] && typeof this[key]['row'][params['animFrame']] != 'undefined' ? params['animFrame'] : 0
			,flip = typeof spriteParams['flipMap'] != 'undefined' && typeof spriteParams['flipMap'][flipFrame] != 'undefined' ? spriteParams['flipMap'][flipFrame] : null;
		if(typeof params['flip'] == 'undefined' && flip != null) params['flip'] = flip;
		if(typeof spriteParams['row'] != 'undefined') spriteParams['posy'] = spriteParams['row'][posyFrame];
		if(typeof params['paletteType'] != 'undefined') spriteParams['paletteType'] = params['paletteType'];
		
		if(!SpriteCache[key+animFrame]) SpriteCache[key+animFrame] = new Sprite(this[key]['col'][animFrame], spriteParams);
		return SpriteCache[key+animFrame].draw(tCtx, x, y, params['direction'], params['flip'], params['palette']);
	}
};