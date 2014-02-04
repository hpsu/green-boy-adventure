var SpriteCache = {};

var Sprite = new Class({
	buffer: {},
	width: SPRITESIZE,
	height: SPRITESIZE,
	size: SPRITESIZE,
	direction: 0,
	positiony: 0,
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
			if(typeof params.row != 'undefined') {
				this.positiony = params.row;
			}
			if(typeof params.palette != 'undefined') {
				this.defaultPalette = params.palette;
			}
		}
	}
	,hash: function() {

		return Array.slice(arguments).join('.');
	}
	,draw: function(tCtx, x, y, direction, flip, palette) {
		var h = this.hash(direction,flip,palette);
		if(!this.buffer[h]) this.create(direction, flip, palette);

		//if(window.spriteDebug)
		filledRectangle(x, y, this.width, this.height, 'rgba(255,0,255,0.2)', tCtx);

		tCtx.drawImage(this.buffer[h], 0, 0, this.width, this.height, x*SCALE, y*SCALE, Math.round(this.width*SCALE), Math.round(this.height*SCALE));
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
			tmpY = this.height/-2;
			tmpX = this.width/-2;
			rotate = (direction/180)*Math.PI;
			tCtx.translate((this.width/2), (this.height/2));
			if(direction > 0) {
				console.log('rotating to',direction);
				tCtx.rotate(rotate);
			}
			if(flip) {
				tCtx.scale((flip.contains('x') ? -1 : 1), (flip.contains('y') ? -1 : 1));
			}
		}


		tCtx.drawImage(
			env.spriteSheet, 
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
			console.log('tinting to palette',palette);
			var map = tCtx.getImageData(0, 0, this.width, this.height),
				imdata = map.data
				tintFrom = env.palettes[this.defaultPalette]
				tintTo = env.palettes[palette];
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
	,Fire: {col: [84]}
	,HeartContainer: {col: [107]}
	,Compass: {col: [127]}
	,Triforce: {col: [144]}
	,MovableBlock: {col: [284]}
	,DoorLocked0: {col: [294]}
	,DoorLocked90: {col: [298]}
	,DoorLocked180: {col: [303]}
	,DoorLocked270: {col: [298]}
	,DoorOpen0: {col: [241]}
	,DoorOpen90: {col: [300]}
	,DoorOpen180: {col: [240]}
	,DoorOpen270: {col: [299]}
	,DoorShut0: {col: [295]}
	,DoorShut90: {col: [304]}
	,DoorShut180: {col: [295]}
	,DoorShut270: {col: [304]}
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
	,Moblin90: {col: [92], palette: 2}
	,Moblin180: {col: [90,91], palette: 2}
	,Moblin270: {col: [93], palette: 2}

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
	,Arrow: {col: [94]}
	,Bow: {col: [146*2], width: 8, height: 16}
	,RockProjectile: {col: [115*2], width: 8, height: 10}
	,Fireball: {col: [80*2], width: 8, height: 10}
	,MagicProjectile: {col: [131]}

	,getWidth: function(key) {
		if(!this[key]) {
			console.warn('No such sprite in catalog!');
			return false;
		}
		if(this[key].width)
			return this[key].width;
		else if(this[key].size)
			return this[key].size;

		return SPRITESIZE;
	}
	,getHeight: function(key) {
		if(!this[key]) {
			console.warn('No such sprite in catalog!');
			return false;
		}
		if(this[key].height)
			return this[key].height;
		else if(this[key].size)
			return this[key].size;

		return SPRITESIZE;
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
		var tCtx = (params['ctx'] ? params['ctx'] : ctx);
		var animFrame = typeof params['animFrame'] != 'undefined' && typeof this[key]['col'][params['animFrame']] != 'undefined' ? params['animFrame'] : 0;
		var spriteParams = this[key];

		if(!SpriteCache[key+animFrame]) SpriteCache[key+animFrame] = new Sprite(this[key]['col'][animFrame], spriteParams);
		return SpriteCache[key+animFrame].draw(tCtx, x, y, params['direction'], params['flip'], params['palette']);
	}
};
