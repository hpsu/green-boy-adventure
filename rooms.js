/****************
 * Room classes *
 ****************/
var RoomStorage = new Class({
	 rooms: []
	,row: 0
	,col: 0
	,initialize: function(defRow, defCol, rooms) {
		this.row = defRow;
		this.col = defCol;
		this.addRooms(rooms);
	}
	,addRoom: function(room) {
		if(!this.rooms[room.row]) this.rooms[room.row] = [];
		this.rooms[room.row][room.col] = room;
	}
	,addRooms: function(rooms) {
		Array.each(rooms, function(room){
			this.addRoom(room);
		}, this);
	}
	,getRoom: function(row,col) {
		if(this.rooms[row] && this.rooms[row][col])
			return this.rooms[row][col];
		return null;
	}
	,getCurrentRoom: function() {
		return this.rooms[this.row][this.col];
	}
	,switchRoom: function(row, col) {
		if(this.exists(row,col)) {
			this.row = row;
			this.col = col;
			cr = this.getRoom(row,col);
			$('screen').setStyle('background', cr.background ? cr.background : '#fcd8a8');
			if(!cr.initialized) {
				if(cr.enemyData) Array.each(cr.enemyData, function(enm){new enm;});
				cr.initialized = true;
			}
			return cr;
		}
		return false;
	}
	,exists: function(row,col) {
		return (this.rooms[row] && this.rooms[row][col]);
	}
});

var Room = new Class({
	 roomWidth: 16
	,roomHeight: 11
	,initialized: false
	,background: null
	,row: null
	,col: null
	,tiles: []
	,MOBs: []
	,initialize: function(params) {
		if(params.row != undefined) this.row = params.row;
		if(params.col != undefined) this.col = params.col;
		if(params.tiles) this.tileData = params.tiles;
		if(params.background) this.background = params.background;
		for(var i=0; i < this.roomHeight; i++) {
			this.tiles[i] = [];
			for(var j=0; j < this.roomWidth; j++) {
				if(!params.tiles[i]) sprite = null;
				else sprite = (params.tiles[i][j] && params.tiles[i][j] > -1 ? params.tiles[i][j] : null)

				this.tiles[i][j] =new Tile({
					sprite: sprite
				});
				
			}
		}

		if(params.tintData)	this.setTintData(params.tintData);
		if(params.hollowTiles) {
			Array.each(params.hollowTiles, function(tile) {
				var ct = this.tiles[tile[0]][tile[1]] ;
				ct.isSolid = false;
			},this);
		}

		if(params.enemies) this.enemyData = params.enemies;
	}
	,getTiles: function() {
		return this.tiles;
	}
	,getTile: function(row,col) {
		if(!this.tiles[row][col]) console.log(this.row, this.col, row, col);
		return this.tiles[row][col];
	}
	,setTintData: function(tintGroups) {
		Array.each(tintGroups, function (tintData) {
			if(tintData.wholeRoom) {
				tintData.rows = [];
				for(var i=0; i<this.roomHeight; i++) {
					tintData.rows.push(i);
				}
			}
			if(tintData.rows) {
				Array.each(tintData.rows, function(row) {
					Array.each(this.tiles[row], function(tile) {
						tile.tintFrom = tintData.tintFrom;
						tile.tintTo = tintData.tintTo;
					},this);
				},this);
			}
			else if(tintData.tiles) {
				Array.each(tintData.tiles, function(tile) {
					var ct = this.tiles[tile[0]][tile[1]] ;
					ct.tintFrom = tintData.tintFrom;
					ct.tintTo = tintData.tintTo;
				},this);
			}
			
			
		},this);
	}
});

var Tile = new Class({
	sprite: null
	,isSolid: true
	,tintFrom: null
	,tintTo: null,
	initialize: function(params) {
		this.sprite = params.sprite;
		if(!this.sprite) this.isSolid=false;
	}
});

/*********************
 * Room declarations *
 *********************/

var rooms = new RoomStorage(7,7,[
	new Room({row: 5, col: 0, tiles: [
		 [16,16,16,16,16,16,16,16,16,16,16,16,16,16,71,16]
		,[16,16,16,16,16,16,16,16,16,16,16,16,16,16,71,16]
		,[16,16,16,16,16,16,16,16,16,16,16,16,16,16,71,16]
		,[16,16,16,16,16,16,16,16,16,16,16,16,16,16,71,16]
		,[16,16,16,16,16,16,16,16,16,16,16,16,16,16,71,16]
		,[16,16,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,16]
		,[16,16,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,16]
		,[16,16,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,16]
		,[16,16,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,16]
		,[16,16,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,16,16]
		,[16,16,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,16,16]
		],tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [252, 252, 252]}], background: '#747474',hollowTiles: [[0,14], [1,14], [2,14], [3,14], [4,14]]
	})
	,new Room({row: 5, col: 1, tiles: [
		 [44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44,44,44]
		,[44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44,44,44]
		,[44,-1,-1,44,-1,44,-1,44,-1,44,-1,-1,-1,-1,-1,-1]
		,[44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,-1,-1,44,-1,44,-1,44,-1,44,-1,-1,-1,-1,-1,-1]
		,[44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44,44,44]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,-1,-1,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,-1,-1,44,44,44,44]
		],tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})
	,new Room({row: 5, col: 2, tiles: [
		 [44,44,44,44,44,44,44,-1,-1,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,-1,-1,44,44,44,44,44,44,44]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,-1,-1,44,44,44,44,44,44,44,44,44,44,44,44]
		,[-1,-1,-1,-1,44,44,44,44,44,44,44,44,44,44,44,44]
		,[-1,-1,-1,-1,44,44,44,44,44,44,44,44,44,44,44,44]
		,[-1,-1,-1,-1,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,-1,-1,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,44,44,44,-1,-1,44,44,-1,-1,-1,-1,-1,44,44]
		,[44,44,44,44,44,-1,-1,44,44,-1,-1,-1,-1,-1,44,44]
		],tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})
	,new Room({row: 5, col: 3, tiles: [
		 [44,44,44,44,44,44,44,-1,-1,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,-1,-1,44,44,44,44,44,44,44]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44]
		,[44,44,44,44,-1,-1,44,-1,-1,-1,44,-1,44,-1,44,44]
		,[44,44,44,44,-1,-1,44,-1,-1,-1,44,-1,44,-1,44,44]
		],tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})
	,new Room({row: 5, col: 4, tiles: [
		 [44,44,44,44,44,44,44,-1,-1,55,36,36,36,36,36,36]
		,[44,44,44,44,44,44,44,-1,-1,55,36,36,36,36,36,36]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[44,44,-1,-1,-1,44,-1,-1,-1,55,36,36,36,36,36,36]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,57,36,36,36,36,36,36]
		,[-1,-1,-1,-1,-1,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,19,19]
		,[44,44,-1,-1,-1,44,-1,-1,-1,-1,-1,-1,-1,-1,16,16]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,16,16]
		,[44,44,44,-1,-1,44,44,44,44,-1,-1,44,44,-1,16,16]
		,[44,44,44,-1,-1,44,44,44,44,-1,-1,44,44,-1,16,16]
		]
	})
	,new Room({row: 5, col: 5, tiles: [
		 [36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		,[58,58,58,58,36,36,36,36,49,58,58,58,58,58,58,58]
		,[-1,-1,-1,-1,72,36,36,73,-1,-1,-1,-1,-1,-1,-1,-1]
		,[19,19,-1,-1,-1,36,36,-1,-1,-1,-1,-1,-1,-1,19,19]
		,[16,16,-1,-1,-1,36,36,-1,-1,-1,-1,-1,-1,-1,16,16]
		,[16,16,-1,-1,-1,36,36,-1,-1,-1,-1,-1,-1,-1,16,16]
		,[16,16,-1,-1,-1,36,36,-1,-1,-1,19,-1,19,-1,16,16]
		,[16,16,-1,-1,-1,36,36,-1,-1,-1,16,-1,16,-1,16,16]
		],hollowTiles: [[5,4], [5,7]]
	})
	,new Room({row: 5, col: 6, tiles: [
		 [36,36,36,36,36,36,59,-1,-1,44,44,44,44,44,44,44]
		,[36,36,36,36,36,36,59,-1,-1,44,44,44,44,44,44,44]
		,[36,36,36,36,36,36,59,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[36,36,36,36,36,36,59,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[36,36,36,36,36,36,60,-1,-1,-1,44,-1,44,44,-1,-1]
		,[]
		,[19,19,19,-1,-1,-1,-1,-1,-1,-1,44,-1,44,44,-1,-1]
		,[16,16,16,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[16,16,16,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[16,16,16,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[16,16,16,44,44,44,44,44,44,44,44,44,44,44,44,44]
		]
	})
	,new Room({row: 5, col: 7, tiles: [
		 [44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[]
		,[-1,-1,-1,-1,-1,-1,-1,44,-1,44,-1,-1,-1,44,-1,44]
		,[]
		,[-1,-1,-1,44,-1,44,-1,44,-1,44,-1,44,-1,44,-1,44]
		,[]
		,[-1,-1,-1,-1,-1,-1,-1,44,-1,44,-1,-1,-1,44,-1,44]
		,[]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		]
	})
	,new Room({row: 5, col: 8, tiles: [
		 [44,44,44,44,44,44,44,-1,-1,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,-1,-1,44,44,44,44,44,44,44]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44]
		,[44,-1,44,-1,-1,-1,44,-1,-1,44,-1,44,-1,-1,-1,44]
		,[]
		,[44,-1,44,-1,44,-1,44,-1,-1,44,-1,44,-1,44,-1,-1]
		,[]
		,[44,-1,44,-1,-1,-1,44,-1,-1,44,-1,44,-1,-1,-1,44]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44]
		,[44,44,44,-1,44,-1,44,-1,-1,44,-1,44,-1,44,-1,44]
		,[44,44,44,-1,44,-1,44,-1,-1,44,-1,44,-1,44,-1,44]
		]
	})
	,new Room({row: 5, col: 9, tiles: [
		 [44,44,44,44,44,44,44,-1,-1,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,-1,-1,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,-1,-1,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,-1,-1,44,44,44,44,44,44,44]
		,[]
		,[]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,53,54,54,54,54,54,54]
		,[44,44,44,44,44,44,44,-1,-1,55,36,36,36,36,36,36]
		,[44,44,44,44,44,44,44,-1,-1,55,36,36,36,36,36,36]
		,[44,44,44,44,44,44,44,-1,-1,55,36,36,36,36,36,36]
		,[44,44,44,44,44,44,44,-1,-1,55,36,36,36,36,36,36]
		]
	})
	,new Room({row: 5, col: 10, tiles: [
		 [44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,-1,-1]
		,[]
		,[54,54,54,54,54,54,74,-1,-1,-1,-1,-1,-1,44,-1,-1]
		,[36,36,36,36,36,36,59,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[36,36,36,36,36,36,59,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[36,36,36,36,36,36,59,-1,-1,-1,-1,44,44,44,-1,44]
		,[36,36,36,36,36,36,59,-1,-1,-1,-1,44,44,44,-1,44]
		]
	})
	,new Room({row: 5, col: 11, tiles: [
		 [44,-1,44,-1,-1,-1,44,-1,44,-1,44,44,-1,-1,44,44]
		,[44,-1,44,-1,-1,-1,44,-1,44,-1,44,44,-1,-1,44,44]
		,[]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,-1,-1,-1,-1,44]
		,[-1,-1,44,-1,-1,-1,44,-1,44,-1,-1,-1,-1,-1,-1,44]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,-1,-1,-1,-1,44]
		,[-1,-1,44,-1,-1,-1,44,-1,44,-1,-1,-1,-1,-1,-1,44]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,-1,-1,-1,-1,44]
		,[]
		,[44,-1,44,-1,-1,-1,44,-1,44,-1,44,44,-1,44,44,44]
		,[44,-1,44,-1,-1,-1,44,-1,44,-1,44,44,-1,44,44,44]
		]
	})
	,new Room({row: 5, col: 12, tiles: [
		 [44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,-1,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,-1,-1,-1,-1]
		,[44,44,44,44,44,44,44,44,44,44,44,44,-1,-1,-1,-1]
		,[44,44,44,44,44,44,44,44,44,44,44,44,-1,-1,-1,-1]
		,[44,44,44,44,44,44,44,44,44,44,44,44,-1,44,44,44]
		,[-1,-1,-1,-1,-1,44,44,44,44,44,44,44,-1,44,44,44]
		,[44,44,44,44,-1,44,44,44,44,44,44,44,-1,44,44,44]
		,[44,44,44,44,-1,44,44,44,44,44,44,44,-1,44,44,44]
		]
	})
	,new Room({row: 5, col: 13, tiles: [
		 [44,44,44,-1,44,44,44,44,44,44,44,44,-1,44,44,44]
		,[44,44,44,-1,44,44,44,44,44,44,44,44,-1,44,44,44]
		,[44,44,44,-1,44,44,44,44,44,44,44,44,-1,44,44,44]
		,[44,44,44,-1,44,44,44,44,44,44,44,44,-1,44,44,44]
		,[]
		,[]
		,[]
		,[44,44,44,-1,44,44,44,44,44,44,44,44,-1,44,44,44]
		,[44,44,44,-1,44,44,44,44,44,44,44,44,-1,44,44,44]
		,[44,44,44,-1,44,44,44,44,44,44,44,44,-1,44,44,44]
		,[44,44,44,-1,44,44,44,44,44,44,44,44,-1,44,44,44]
		]
	})
	,new Room({row: 5, col: 14, tiles: [
		 [16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		,[16,16,16,16,16,18,17,43,16,16,16,16,16,16,16,16]
		,[16,18,-1,-1,-1,-1,-1,-1,17,16,16,18,-1,-1,17,16]
		,[18,-1,-1,-1,-1,-1,-1,-1,-1,17,18,-1,-1,-1,-1,16]
		,[-1,-1,-1,-1,44,-1,-1,-1,-1,-1,-1,-1,44,-1,-1,16]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,16]
		,[-1,-1,-1,-1,44,-1,-1,-1,-1,-1,-1,-1,44,-1,-1,16]
		,[20,-1,-1,-1,-1,-1,-1,-1,-1,35,20,-1,-1,-1,-1,16]
		,[16,20,-1,-1,-1,-1,-1,-1,35,16,16,20,-1,-1,35,16]
		,[16,16,19,19,19,20,35,19,16,16,16,16,19,19,16,16]
		,[16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		]
	})
	,new Room({row: 5, col: 15, tiles: [
		 [16,16,16,16,16,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[16,16,16,16,18,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[16,16,16,16,-1,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[16,16,16,16,-1,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[16,16,16,18,-1,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[16,16,18,-1,-1,-1,-1,-1,-1,55,49,36,49,36,36,36]
		,[16,16,-1,-1,-1,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[16,16,-1,-1,-1,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[16,16,20,-1,-1,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[16,16,16,19,20,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[16,16,16,16,16,-1,-1,-1,-1,55,36,36,36,36,36,36]
		],tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})
	,new Room({row: 6, col: 0, tiles: [
		 [44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		]
		,tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})
	,new Room({row: 6, col: 1, tiles: [
		 [44,44,44,44,44,44,44,44,44,44,-1,-1,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,-1,-1,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,-1,-1,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,-1,-1,44,44,44,44]
		,[]
		,[] // This should be a maze whos solution is up left down left
		,[]
		,[44,44,44,44,44,44,44,44,44,44,-1,-1,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,-1,-1,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,-1,-1,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,-1,-1,44,44,44,44]
		]
		,tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})
	,new Room({row: 6, col: 2, tiles: [
		 [44,44,44,44,44,-1,-1,44,44,-1,-1,-1,-1,-1,44,44]
		,[44,44,44,44,44,-1,-1,44,44,-1,-1,-1,-1,-1,44,44]
		,[44,44,44,44,44,-1,-1,-1,44,-1,-1,-1,-1,-1,44,44]
		,[44,44,44,44,44,-1,-1,-1,44,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,-1,-1,44,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,-1,-1,44,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,-1,-1,44,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,44,44,44,44,-1,-1,44,44,44,44,44,44,-1,-1]
		,[44,44,44,44,44,44,-1,-1,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,-1,-1,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,-1,-1,44,44,44,44,44,44,44,44]
		]
		,tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})
	,new Room({row: 6, col: 3, tiles: [
		 [44,44,44,44,-1,-1,44,-1,-1,-1,44,-1,44,-1,44,44]
		,[44,44,44,44,-1,-1,44,-1,-1,-1,44,-1,44,-1,44,44]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44]
		,[-1,-1,-1,44,-1,-1,-1,-1,-1,-1,44,-1,-1,-1,-1,44]
		,[-1,-1,-1,-1,-1,-1,44,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,44,-1,-1,-1,-1,-1,-1,44,-1,44,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,44,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,44,-1,-1,-1,-1,-1,-1,44,-1,-1,-1,-1,44]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44]
		,[44,44,44,44,44,44,44,-1,-1,-1,44,-1,44,-1,44,44]
		,[44,44,44,44,44,44,44,-1,-1,-1,44,-1,44,-1,44,44]
		]
		,tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})
	,new Room({row: 6, col: 4, tiles: [
		 [16,16,16,-1,-1,16,16,16,16,-1,-1,16,16,-1,16,16]
		,[16,16,16,-1,-1,17,16,43,18,-1,-1,17,18,-1,17,16]
		,[16,16,18,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[17,18,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,44,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[]
		,[-1,-1,-1,-1,-1,-1,44,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[35,20,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[16,16,20,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[16,16,16,19,19,19,19,19,19,19,19,19,19,19,19,19]
		,[16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
	]})
	,new Room({row: 6, col: 5, tiles: [
		 [16,16,-1,-1,-1,36,36,-1,-1,-1,16,-1,16,-1,16,16]
		,[16,18,-1,-1,-1,36,36,-1,-1,-1,16,-1,16,-1,17,16]
		,[-1,-1,-1,-1,-1,36,36,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,36,36,-1,-1,-1,34,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,36,36,-1,-1,-1,-1,-1,34,-1,-1,-1]
		,[-1,-1,-1,-1,-1,49,49,-1,-1,-1,34,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,36,36,-1,-1,-1,-1,-1,34,-1,-1,-1]
		,[-1,-1,-1,-1,-1,36,36,-1,-1,-1,34,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,36,36,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[19,19,19,20,-1,36,36,19,19,19,19,19,19,19,19,19]
		,[16,16,16,16,-1,36,36,16,16,16,16,16,16,16,16,16]
		]
		,tintData: [{rows: [2,3,4,5,6,7,8], tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
		,hollowTiles: [[5,5], [5,6]]
		, enemies: [Octorock, Octorock, Octorock, Octorock]
	})
	,new Room({row: 6, col: 6, tiles: [
		 [16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		,[16,16,16,16,16,16,16,43,16,16,16,16,16,16,16,16]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,17,16]
		,[-1,-1,-1,34,34,34,34,-1,-1,-1,-1,-1,-1,-1,-1,17]
		,[-1,-1,-1,-1,-1,-1,-1,-1,34,34,34,-1,-1,-1,-1,-1]
		,[-1,-1,-1,34,34,34,34,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,-1,-1,34,34,34,-1,-1,-1,-1,-1]
		,[-1,-1,-1,34,34,34,34,-1,-1,-1,-1,-1,-1,-1,-1,35]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,35,16]
		,[19,19,19,19,19,19,19,19,19,19,19,20,-1,-1,16,16]
		,[16,16,16,16,16,16,16,16,16,16,16,16,-1,-1,16,16]
		], tintData: [
			{tiles: [
				 [3,3], [3,4], [3,5], [3,6]
				,[4,8], [4,9], [4,10]
				,[5,3], [5,4], [5,5], [5,6]
				,[6,8], [6,9], [6,10]
				,[7,3], [7,4], [7,5], [7,6]
				], tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}
		], enemies: [Octorock, Octorock, Octorock, Octorock]
	})
	,new Room({row: 6, col: 7, tiles: [
		 [16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		,[16,16,16,16,16,16,16,43,16,16,16,16,16,16,16,16] // The hole on this row should not be visible until bombed
		,[16,18,-1,-1,-1,-1,-1,-1,-1,17,18,-1,-1,-1,17,16]
		,[18,-1,-1,34,-1,34,-1,-1,-1,-1,-1,-1,34,-1,-1,17]
		,[]
		,[-1,-1,-1,34,-1,34,-1,-1,-1,-1,-1,-1,34,-1,-1,-1]
		,[]
		,[20,-1,-1,34,-1,34,-1,-1,-1,-1,-1,-1,34,-1,-1,35]
		,[16,20,-1,-1,-1,-1,-1,-1,-1,35,20,-1,-1,-1,35,16]
		,[16,16,19,19,19,19,19,-1,-1,16,16,19,19,19,16,16]
		,[16,16,16,16,16,16,16,-1,-1,16,16,16,16,16,16,16]
		
	], enemies: [Octorock, Octorock, Octorock, Octorock]})
	,new Room({row: 6, col: 8, tiles: [
		 [16,16,44,-1,44,-1,44,-1,-1,44,-1,44,-1,44,-1,44]
		,[16,16,44,-1,44,-1,44,-1,-1,44,-1,44,-1,44,-1,44]
		,[16,18,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44]
		,[18,-1,-1,-1,44,-1,-1,-1,-1,44,-1,-1,-1,44,-1,44]
		,[-1,-1,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,44,-1,44,-1,-1,44,-1,44,-1,44,-1,-1]
		,[-1,-1,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[20,-1,-1,-1,44,-1,-1,-1,-1,44,-1,-1,-1,44,-1,44]
		,[16,20,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44]
		,[16,16,44,-1,44,-1,44,-1,-1,44,-1,44,-1,44,-1,44]
		,[16,16,44,-1,44,-1,44,-1,-1,44,-1,44,-1,44,-1,44]
	], enemies: [Octorock, Octorock, Octorock, Octorock]})
	,new Room({row: 6, col: 9, tiles: [
		 [44,44,44,44,44,44,44,-1,-1,55,36,36,36,36,36,36]
		,[44,44,44,44,44,44,44,-1,-1,55,36,36,36,36,36,36]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[44,-1,-1,-1,-1,44,-1,-1,-1,55,36,36,36,36,36,36]
		,[-1,-1,44,-1,-1,-1,-1,-1,-1,57,58,58,58,58,58,58]
		,[-1,-1,-1,-1,-1,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,-1,-1,-1,-1,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
	], enemies: [Octorock, Octorock, Octorock, Octorock]})
	,new Room({row: 6, col: 10, tiles: [
		 [36,36,36,36,36,36,59,-1,-1,-1,-1,44,44,44,-1,44]
		,[36,36,36,36,36,36,59,-1,-1,-1,-1,44,44,44,-1,44]
		,[36,36,36,36,36,36,59,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[36,36,36,36,36,36,59,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[36,36,36,36,36,36,60,-1,-1,-1,-1,-1,44,-1,-1,-1]
		,[]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,-1,-1,-1]
		,[]
		,[]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
	], enemies: [Octorock, Octorock, Octorock, Octorock]})
	,new Room({row: 6, col: 11, tiles: [
		 [44,-1,44,-1,-1,-1,44,-1,44,-1,44,44,-1,44,44,44]
		,[44,-1,44,-1,-1,-1,44,-1,44,-1,44,44,-1,44,44,44]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,-1,-1,-1,-1,44]
		,[-1,-1,44,-1,-1,-1,44,-1,44,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,-1,-1,-1,-1,-1]
		,[-1,-1,44,-1,-1,-1,44,-1,44,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,-1,-1,-1,-1,44]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,-1,-1,-1,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,-1,-1,-1,44,44]
	]})
	,new Room({row: 6, col: 12, tiles: [
		 [44,44,44,44,-1,44,44,44,44,44,44,44,-1,44,44,44]
		,[44,44,44,44,-1,44,44,44,44,44,44,44,-1,44,44,44]
		,[44,44,44,44,-1,44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,44,44,-1,44,-1,-1,-1,-1,-1,-1,-1,44,44,44]
		,[-1,-1,-1,-1,-1,44,-1,-1,-1,-1,-1,-1,-1,44,44,44]
		,[-1,-1,-1,-1,-1,44,-1,-1,-1,-1,-1,-1,-1,44,44,44]
		,[-1,-1,-1,-1,-1,44,-1,-1,-1,-1,-1,-1,-1,44,44,44]
		,[44,44,44,44,44,44,-1,-1,-1,-1,-1,-1,-1,44,44,44]
		,[44,44,44,44,44,44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
	]})
	,new Room({row: 6, col: 13, tiles: [
		 [44,44,44,-1,44,44,44,44,44,44,44,44,-1,44,44,44]
		,[44,44,44,-1,44,44,44,44,44,44,44,44,-1,44,44,44]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,-1,-1,44,44,44]
		,[44,44,-1,-1,44,44,44,44,44,44,44,44,-1,44,44,44]
		,[44,44,-1,-1,44,44,44,44,44,44,44,44,-1,-1,-1,-1]
		,[44,44,-1,-1,44,44,44,44,44,44,44,44,-1,-1,-1,-1]
		,[44,44,-1,-1,44,44,44,44,44,44,44,44,-1,-1,-1,-1]
		,[44,44,-1,-1,44,44,44,44,44,44,44,44,44,44,44,44]
		,[-1,-1,-1,-1,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
	]})
	,new Room({row: 6, col: 14, tiles: [
		 [44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,-1,-1,44,44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44,44,44,-1,-1]
		,[-1,-1,-1,44,44,44,-1,44,44,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44,44,44,-1,-1]
		,[44,-1,-1,44,44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
	]})
	,new Room({row: 6, col: 15, tiles: [
		 [16,16,16,16,16,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[17,16,16,43,18,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[35,16,16,16,20,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[16,16,16,16,16,-1,-1,-1,-1,55,36,36,36,36,36,36]
		]
		,tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
		,enemies: [Octorock, Octorock, Octorock, Octorock]
	})
	// Row 7 ---------------------------------------------
	,new Room({row: 7, col: 0, tiles: [
		 [16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		,[16,16,16,16,16,16,16,16,16,16,16,43,16,16,16,16]
		,[16,16,16,18,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[16,16,18,-1,-1,45,46,-1,45,46,-1,-1,-1,-1,-1,-1]
		,[16,18,-1,-1,-1,47,48,-1,47,48,-1,-1,-1,-1,-1,-1]
		,[16,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[16,20,-1,-1,-1,-1,45,46,-1,45,46,-1,-1,-1,-1,-1]
		,[16,16,20,-1,-1,-1,47,48,-1,47,48,-1,-1,-1,-1,-1]
		,[16,16,16,20,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[16,16,16,16,19,19,19,19,19,19,19,19,19,19,19,19]
		,[16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		]
		,tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})
	,new Room({row: 7, col: 1, tiles: [
		 [16,16,16,16,16,16,16,16,16,16,-1,-1,16,16,16,16]
		,[16,16,16,18,17,43,16,16,16,18,-1,-1,17,16,16,16]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,17,16,16]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,17,18]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,35,20]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,35,16,16]
		,[19,19,19,19,19,19,19,19,19,19,19,19,19,16,16,16]
		,[16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		]
		,tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})
	,new Room({row: 7, col: 2, tiles: [
		 [44,44,44,44,44,44,-1,-1,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,-1,-1,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[-1,-1,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[-1,-1,-1,-1,-1,-1,44,44,44,44,44,44,44,44,44,44]
		,[-1,-1,-1,-1,-1,-1,44,44,44,44,44,44,44,44,44,44]
		,[44,44,-1,-1,-1,-1,44,44,44,44,44,44,44,44,44,44]
		,[44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		]
		,tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})
	,new Room({row: 7, col: 3, tiles: [
		 [44,44,44,44,44,44,44,-1,-1,-1,44,-1,44,-1,44,44]
		,[44,44,44,44,44,44,44,-1,-1,-1,44,-1,44,-1,44,44]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44]
		,[44,44,44,44,44,44,44,-1,-1,-1,-1,-1,-1,-1,-1,44]
		,[44,44,44,44,44,44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,44,44,44,44,44,-1,-1,-1,44,-1,-1,-1,-1,-1]
		,[44,44,44,44,44,44,44,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[44,44,44,44,44,44,44,-1,-1,-1,-1,-1,-1,-1,-1,44]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		]
		,tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})
	,new Room({row: 7, col: 4, tiles: [ 
		 [16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		,[16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		,[16,18,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,17,16]
		,[18,-1,-1,-1,-1,-1,-1,38,39,40,-1,-1,-1,-1,-1,16]
		,[-1,-1,-1,-1,37,-1,37,41,43,42,37,-1,37,-1,-1,16]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,16]
		,[-1,-1,-1,-1,37,-1,37,-1,-1,-1,37,-1,37,-1,-1,16]
		,[20,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,16]
		,[16,20,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,35,16]
		,[16,16,19,19,19,19,19,19,19,19,19,19,19,19,16,16]
		,[16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
	]})
	,new Room({row: 7, col: 5, tiles: [ 
		 [16,16,16,16,-1,36,36,16,16,16,16,16,16,16,16,16]
		,[16,16,43,18,-1,36,36,17,16,16,16,16,16,16,16,16]
		,[16,18,-1,-1,-1,36,36,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[16,-1,-1,-1,-1,36,36,-1,34,-1,-1,-1,34,-1,-1,-1]
		,[16,-1,-1,-1,-1,36,36,-1,-1,-1,34,-1,-1,-1,-1,-1]
		,[16,-1,-1,34,-1,36,36,-1,34,-1,-1,-1,34,-1,-1,-1]
		,[16,-1,-1,-1,-1,36,36,-1,-1,-1,34,-1,-1,-1,-1,-1]
		,[16,-1,-1,-1,-1,36,36,-1,34,-1,-1,-1,34,-1,-1,-1]
		,[16,20,-1,-1,-1,36,36,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[16,16,19,19,20,36,36,35,19,19,19,19,19,19,19,19]
		,[16,16,16,16,16,36,36,16,16,16,16,16,16,16,16,16]
	]})
	,new Room({row: 7, col: 6, tiles: [
		 [16,16,16,16,16,16,16,16,16,16,16,16,-1,-1,16,16]
		,[16,16,16,16,16,16,16,16,16,16,16,18,-1,-1,16,16]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,16,16]
		,[-1,-1,-1,-1,-1,-1,-1,-1,34,-1,-1,-1,-1,-1,17,16]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,34,-1,-1,-1,-1,17]
		,[-1,-1,34,-1,-1,34,-1,-1,34,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,34,-1,-1,-1,-1,35]
		,[-1,-1,-1,-1,-1,-1,-1,-1,34,-1,-1,-1,-1,-1,35,16]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,16,16]
		,[19,19,19,19,19,19,19,19,19,19,19,19,19,19,16,16]
		,[16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
	]})
	,new Room({row: 7, col: 7, tiles: [ // level 7, room 7 (start)
		 [16,16,16,16,16,16,16,-1,-1,16,16,16,16,16,16,16]
		,[16,16,16,16,43,16,18,-1,-1,16,16,16,16,16,16,16]
		,[16,16,16,18,-1,-1,-1,-1,-1,16,16,16,16,16,16,16]
		,[16,16,18,-1,-1,-1,-1,-1,-1,16,16,16,16,16,16,16]
		,[16,18,-1,-1,-1,-1,-1,-1,-1,17,16,16,16,16,16,16]
		,[]
		,[19,20,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,19,19]
		,[16,16,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,16,16]
		,[16,16,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,16,16]
		,[16,16,19,19,19,19,19,19,19,19,19,19,19,19,16,16]
		,[16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
	]})
	,new Room({row: 7, col: 8, tiles: [
		 [16,16,44,-1,44,-1,44,-1,-1,44,-1,44,-1,44,-1,44]
		,[16,16,44,-1,44,-1,44,-1,-1,44,-1,44,-1,44,-1,44]
		,[16,16,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[16,18,-1,-1,-1,-1,44,-1,-1,44,-1,44,-1,44,-1,-1]
		,[18,-1,44,-1,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,44,-1,-1,44,-1,44,-1,44,-1,-1]
		,[20,-1,44,-1,44,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[16,20,-1,-1,-1,-1,44,-1,-1,44,-1,44,-1,44,-1,-1]
		,[16,16,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[16,16,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
		,[16,16,44,44,44,44,44,44,44,44,44,44,44,44,44,44]
	], enemies: [Octorock, Octorock, Octorock, Octorock]})
	,new Room({row: 7, col: 9, tiles: [
		 [16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		,[17,16,16,16,16,16,18,17,16,16,16,16,16,16,16,16]
		,[-1,17,16,16,16,16,-1,-1,-1,-1,-1,-1,17,16,16,16]
		,[-1,-1,17,16,16,16,-1,-1,-1,-1,-1,-1,-1,16,16,16]
		,[-1,-1,-1,17,16,16,-1,-1,-1,34,-1,-1,-1,17,16,16]
		,[-1,-1,-1,-1,17,18,-1,-1,34,52,34,-1,-1,-1,-1,-1]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,34,-1,-1,-1,35,19,19]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,16,16,16]
		,[-1,-1,-1,-1,35,20,-1,-1,-1,-1,-1,-1,35,16,16,16]
		,[35,19,19,19,16,16,20,35,19,19,19,19,16,16,16,16]
		,[16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		]
		,tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})
	,new Room({row: 7, col: 10, tiles: [
		 [16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		,[16,16,16,16,16,16,16,18,17,16,16,16,16,16,16,16]
		,[16,16,16,16,18,17,18,-1,-1,17,16,16,16,16,16,16]
		,[16,16,16,18,-1,-1,-1,-1,-1,-1,16,16,16,16,16,16]
		,[18,17,18,-1,-1,-1,-1,-1,-1,-1,17,18,17,18,17,16]
		,[]
		,[20,35,20,-1,-1,-1,-1,-1,-1,-1,35,20,35,20,35,16]
		,[16,16,16,20,-1,-1,-1,-1,-1,-1,16,16,16,16,16,16]
		,[16,16,16,16,20,35,20,-1,-1,35,16,16,16,16,16,16]
		,[16,16,16,16,16,16,16,20,35,16,16,16,16,16,16,16]
		,[16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		]
		,tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})
	,new Room({row: 7, col: 11, tiles: [
		 [16,16,16,16,16,16,16,16,16,16,16,-1,-1,-1,16,16]
		,[16,16,16,16,16,16,16,16,16,43,16,-1,-1,-1,16,16]
		,[16,16,16,16,16,16,18,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[16,16,16,16,16,18,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[16,18,17,16,18,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
		,[]
		,[19,20,35,19,20,-1,-1,53,54,54,54,54,54,54,54,54]
		,[16,16,16,16,16,20,-1,55,36,36,36,36,36,36,36,36]
		,[16,16,16,16,16,16,20,55,36,36,36,36,36,36,36,36]
		,[16,16,16,16,16,16,16,55,36,36,36,36,36,36,36,36]
		,[16,16,16,16,16,16,16,55,36,36,36,36,36,36,36,36]
		]
		,tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})
	,new Room({row: 7, col: 12, tiles: [
		 [16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		,[16,16,16,16,16,16,43,16,16,16,16,16,16,16,16,16]
		,[]
		,[]
		,[]
		,[]
		,[54,54,54,54,54,54,54,54,54,54,54,54,54,54,54,54]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		]
		,tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})
	,new Room({row: 7, col: 13, tiles: [
		 [16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		,[16,16,16,16,16,16,43,16,16,16,16,16,16,16,16,16]
		,[]
		,[]
		,[]
		,[]
		,[54,54,54,54,54,54,54,54,54,54,54,54,54,54,54,54]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		]
		,tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})
	,new Room({row: 7, col: 14, tiles: [
		 [16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		,[16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		,[-1,-1,16,16,16,16,16,16,16,16,16,16,16,16,16,16]
		,[-1,-1,17,16,18,17,16,16,16,18,17,16,18,17,18,17]
		,[]
		,[]
		,[54,54,54,54,54,54,54,54,54,54,54,54,54,54,54,54]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		]
		,tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
		,enemies: [Octorock, Octorock, Octorock]
	})
	,new Room({row: 7, col: 15, tiles: [
		 [16,16,16,16,16,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[16,16,16,16,16,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[16,16,16,16,16,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[18,17,16,16,18,-1,-1,-1,-1,55,36,36,36,36,36,36]
		,[-1,-1,-1,-1,-1,-1,-1,-1,-1,36,36,36,36,36,36,36]
		,[-1,-1,-1,-1,-1,-1,-1,-1,56,36,36,36,36,36,36,36]
		,[54,54,54,54,54,54,54,54,36,36,36,36,36,36,36,36]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		,[36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36]
		]
		,tintData: [{wholeRoom: true, tintFrom: [0, 168, 0], tintTo: [200, 76, 12]}]
	})

]);

