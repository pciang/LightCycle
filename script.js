var secPerFrame = 1 / 24,
	secPerUpdate = secPerFrame,
	msPerFrame = 1000 / 24,
	msPerUpdate = 1000 / 24,
	SVGNS = 'http://www.w3.org/2000/svg',
	dotRadius = 3,
	collisionRange = 2 * dotRadius,
	updater = null,
	ignoreLastRange = 3,
	dotSpeed = 75,
	dotRotationalSpeed = 360;

// grid based collision detection for circle-circle with same radius
function Grid(max_width, max_height, num_rows, num_cols){
	this.grid = [];
	this.grid_w = max_width / num_cols;
	this.grid_h = max_height / num_rows;
	
	// anonymous constructor function
	(function (){
		this.grid[num_rows - 1] = null;
		for(var i = 0; i < num_rows; ++i){
			this.grid[i] = [];
			this.grid[i][num_cols - 1] = null;
			for(var j = 0; j < num_cols; ++j){
				this.grid[i][j] = [];
			}
		}
	}).bind(this)();
	
	this.insert = function (obj){
		// assuming x and y is always within the display box
		// else there will be an index error
		var row = obj.y / this.grid_h | 0,
			col = obj.x / this.grid_w | 0;
		
		this.grid[row][col].push(obj);
	};
	
	this.check_grid = function (grid, obj){
		var x = obj.x,
			y = obj.y;
		for(var i = 0, size = grid.length; i < size; ++i){
			if(obj != grid[i]){
				var diff_x = x - grid[i].x,
					diff_y = y - grid[i].y,
					distance = Math.sqrt(diff_x * diff_x + diff_y * diff_y);
				
				if(distance < collisionRange){
					return obj.parent != grid[i].parent
						|| !obj.ignore || !grid[i].ignore;
				}
			}
		}
		
		return false;
	};
	
	this.query = function (obj){
		var y = obj.y,
			x = obj.x,
			row = y / this.grid_h | 0,
			col = x / this.grid_w | 0;
		
		if(this.check_grid(this.grid[row][col], obj)){
			return true;
		}
		
		var y0 = row * this.grid_h,
			y1 = y0 + this.grid_h,
			x0 = col * this.grid_w,
			x1 = x0 + this.grid_w,
			result = false;
		
		// top
		if(row > 0 && y - y0 < dotRadius){
			result = this.check_grid(this.grid[row - 1][col], obj);
			// top & left
			if(col > 0 && x - x0 < dotRadius){
				result = result || this.check_grid(this.grid[row - 1][col - 1], obj)
					|| this.check_grid(this.grid[row][col - 1], obj);
			}
		// ~top & left
		} else if(col > 0 && x - x0 < dotRadius){
			result = this.check_grid(this.grid[row][col - 1], obj);
			// left & bot
			if(row + 1 < num_rows && y1 - y < dotRadius){
				result = result || this.check_grid(this.grid[row + 1][col - 1], obj);
			}
		}
		
		// bot
		if(row + 1 < num_rows && y1 - y < dotRadius){
			result = result || this.check_grid(this.grid[row + 1][col], obj);
			// bot & right
			if(col + 1 < num_cols && x1 - x < dotRadius){
				result = result || this.check_grid(this.grid[row + 1][col + 1], obj)
					|| this.check_grid(this.grid[row][col + 1], obj);
			}
		// ~bot & right
		} else if(col + 1 < num_cols && x1 - x < dotRadius){
			result = result || this.check_grid(this.grid[row][col + 1], obj);
			// right & top
			if(row > 0 && y - y0 < dotRadius){
				result = result || this.check_grid(this.grid[row - 1][col + 1], obj);
			}
		}
		
		return result;
	};
}

function Game(display){
	this.display = display;
	this.display_w = 640;
	this.display_h = 480;
	this.detector = new Grid(this.display_w, this.display_h, 80, 60);
	
	// clear SVG for new game
	(function (){
		var child;
		while(child = display.firstChild){
			display.removeChild(child);
		}
	})();
	
	// initialize keys
	// keydown -> true, keyup -> false
	this.keys = {
		_37: false, _39: false, _65: false, _68: false,
		_188: false, _190: false, _67: false, _86: false
	}
	
	document.addEventListener('keyup', function (e){
		switch(e.keyCode){
			case 37:
				e.preventDefault();
				this.keys._37 = false;
				break;
			case 39:
				e.preventDefault();
				this.keys._39 = false;
				break;
			case 65:
				e.preventDefault();
				this.keys._65 = false;
				break;
			case 68:
				e.preventDefault();
				this.keys._68 = false;
				break;
			case 67:
				e.preventDefault();
				this.keys._67 = false;
				break;
			case 86:
				e.preventDefault();
				this.keys._86 = false;
				break;
			case 188:
				e.preventDefault();
				this.keys._188 = false;
				break;
			case 190:
				e.preventDefault();
				this.keys._190 = false;
				break;
		}
	}.bind(this));
	
	document.addEventListener('keydown', function (e){
		switch(e.keyCode){
			case 37:
				e.preventDefault();
				this.keys._37 = true;
				break;
			case 39:
				e.preventDefault();
				this.keys._39 = true;
				break;
			case 65:
				e.preventDefault();
				this.keys._65 = true;
				break;
			case 68:
				e.preventDefault();
				this.keys._68 = true;
				break;
			case 67:
				e.preventDefault();
				this.keys._67 = true;
				break;
			case 86:
				e.preventDefault();
				this.keys._86 = true;
				break;
			case 188:
				e.preventDefault();
				this.keys._188 = true;
				break;
			case 190:
				e.preventDefault();
				this.keys._190 = true;
				break;
		}
	}.bind(this));
	
	this.players = [];
	this.initialize = function (num_players){
		// this.playerOne = (new Player(this, 540, 360, '#f00', ['_37', '_39'])).initialize();
		// this.playerTwo = (new Player(this, 100, 360, '#00f', ['_65', '_68'])).initialize();
		this.players[num_players - 1] = null;
		
		this.players[0] = (new Player(this, 540, 100, '#f00', ['_37', '_39'])).initialize();
		this.players[0].rotation = -135;
		
		this.players[1] = (new Player(this, 100, 100, '#00f', ['_65', '_68'])).initialize();
		this.players[1].rotation = 135;
		
		if(num_players >= 3){
			this.players[2] = (new Player(this, 540, 380, '#0f0', ['_188', '_190'])).initialize();
			this.players[2].rotation = -45;
		}
		
		if(num_players >= 4){
			this.players[3] = (new Player(this, 100, 380, '#0ff', ['_67', '_86'])).initialize();
			this.players[3].rotation = 45;
		}
		
		return this;
	}
	
	this.update = function (delta){
		var crashes = [];
		for(var i = 0, num_players = this.players.length; i < num_players; ++i){
			if(this.players[i].isAlive){
				this.players[i].update(delta);
			}
			if(!this.players[i].isAlive){
				crashes.push(i + 1);
			}
		}
		
		if(crashes.length == this.players.length - 1){
			if(this.players[0].isAlive){
				alert('Player 1 wins!');
			} else if(this.players[1].isAlive){
				alert('Player 2 wins!');
			} else if(this.players[2].isAlive){
				alert('Player 3 wins!');
			} else{
				alert('Player 4 wins!');
			}
			clearInterval(updater);
			updater = null;
		} else if(crashes.length == this.players.length){
			alert('All players crashed!');
			clearInterval(updater);
			updater = null;
		}
	}
}

function Player(game, x, y, color, keys){
	this.isAlive = true;
	this.game = game;
	this.display = game.display;
	
	this.position = game.display.createSVGPoint();
	this.position.x = x; this.position.y = y;
	this.rotation = 0; // in degree, not radian
	this.rotationalSpeed = dotRotationalSpeed; // degree per second
	this.speed = dotSpeed; // pixels per second
	
	this.head = null;
	this.tracks = [];
	this.initialize = function (){
		var dot = document.createElementNS(SVGNS, 'circle');
		dot.setAttribute('r', dotRadius);
		dot.setAttribute('cx', x);
		dot.setAttribute('cy', y);
		dot.setAttribute('fill', '#ff0');
		this.display.appendChild(dot);
		var __o = {shape: dot, x: x, y: y, ignore: true, parent: this};
		this.tracks.push(__o);
		game.detector.insert(__o);
		
		this.head = dot;
		return this;
	}
	
	this.update = function (delta){
		var rotationChange = 0;
		if(this.game.keys[keys[0]])
			rotationChange -= this.rotationalSpeed * delta;
		if(this.game.keys[keys[1]])
			rotationChange += this.rotationalSpeed * delta;
		
		var T = this.display.createSVGMatrix()
				.translate(this.position.x, this.position.y)
				.rotate(this.rotation + rotationChange)
				.translate(0, -this.speed * delta)
				.rotate(-this.rotation)
				.translate(-this.position.x, -this.position.y),
			dot = document.createElementNS(SVGNS, 'circle');
		
		this.rotation += rotationChange;
		if(this.rotation > 180)
			this.rotation -= 360;
		if(this.rotation < -180)
			this.rotation += 360;
		
		this.position = this.position.matrixTransform(T);
		dot.setAttribute('r', dotRadius);
		dot.setAttribute('fill', '#ff0');
		dot.setAttribute('cx', this.position.x);
		dot.setAttribute('cy', this.position.y);
		this.display.appendChild(dot);
		var __o = {shape: dot, x: this.position.x, y: this.position.y, ignore: true, parent: this};
		this.tracks.push(__o);
		game.detector.insert(__o);
		
		if(this.tracks.length - ignoreLastRange >= 0){
			this.tracks[this.tracks.length - ignoreLastRange].ignore = false;
		}
		
		this.head.setAttribute('fill', color);
		this.head = dot;
		
		if(this.checkCollision()){
			this.isAlive = false;
		}
	}
	
	this.checkCollision = function (){
		if(this.position.x < dotRadius
			|| this.position.y < dotRadius
			|| this.game.display_w - this.position.x < dotRadius
			|| this.game.display_h - this.position.y < dotRadius){
			return true;
		}
		
		return game.detector.query(this.tracks[this.tracks.length - 1]);
	}
}

document.addEventListener('DOMContentLoaded', function (arg){
	document.addEventListener('keydown', function (e){
		if(e.keyCode == 32 && updater == null){
			e.preventDefault();
			var num_players = parseInt(prompt("Please enter the number of player!\n*At least 2, and at most 4", "2")),
				game = (new Game(document.getElementById('display'))).initialize(
					Math.min(Math.max(4, num_players), Math.min(Math.max(2, num_players), 4))
				);
			updater = setInterval(game.update.bind(game), msPerFrame, secPerFrame);
		}
	});
});