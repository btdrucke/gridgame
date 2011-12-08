window.Game = window.Game || {};  // namespace

// -------------------------------------
// Game.Logic: Base class for game logic
// -------------------------------------

Game.Logic = function (topology)
{
    this.topology = topology;
    this.data = topology.data;
};


// ------------------------------------------
// Game.Logic.Bomb : minesweeper game logic
// ------------------------------------------

Game.Logic.Bomb = function (topology)
{
    this.Inherits(Game.Logic, topology);

    // -----------
    // public data

    this.bombRatio = 0.125; //Math.min(bombRatio, 0.25);

    // --------------
    // public methods


    // Add Bomb-specific state and logic to DataCell
    Game.DataCell.prototype.hasBomb = function () {
        return (this.count > 8);
    };


    this.didWin = function () 
    {
        return (_cellsToShow === 0);
    }
    

    this.reset = function () 
    {
        this.data.forEach(function (cell) {
            cell.count = 0;
            cell.shown = false;
            cell.hasFlag = false;
            var classList = cell.elem.classList;
            classList.add("bomb-cell");
            classList.add((cell.x() + cell.y())%2 ? "bomb-hiddenEven" : "bomb-hiddenOdd");
            classList.remove("bomb-flagChoice",    // TODO: namespace these class names
                             "bomb-hasFlag",
                             "bomb-hasBomb",
                             "bomb-flagChoice",
                             "bomb-exploded");
        });
        
        _floodStack = [];
        _showQueue = [];
    };


    // ---------------
    // private methods


    function _queueShow (cell) 
    {
        // TODO: hack because duplicates are getting in the list somehow!
        if (cell.shown) return;

        cell.shown = true;
        _showQueue.push(cell);
        if (!cell.hasBomb()) {
            --_cellsToShow;
        }
    };

    function _showAll (startingCell)
    {
        this.data.forEach(function (cell) {
            _queueShow(cell);
        });
        _doShow(startingCell);
    };


    function _doShowOnce ()
    {
        if (_showTimerId === undefined) {
            return;
        }

        if (_showQueue.length) {
            var cell = _showQueue.pop();
            _show(cell);
        }
        else {
            window.clearInterval(_showTimerId);
            _showTimerId = undefined;
            console.log("_cellsToShow:", _cellsToShow);
        }
    }


    function _show (cell)
    {
        //console.log("show",x,y);

        cell.shown = true;
        var elem = cell.elem;
        var classList = elem.classList;
        _clickSound = _clickSound || document.getElementById('click');

        if (cell.hasBomb()) {
	    if (cell.hasFlag) {
	        classList.add("bomb-flagChoice");
	    }
	    classList.remove("bomb-hasFlag");
	    classList.add("bomb-hasBomb");
        }
        else {
            var count = cell.count;
            //console.log("no bomb", count);
            if (count > 0) {
                elem.innerText = count;
            }
            var gb = Math.round(255 * (8-count)/8);
            elem.style.backgroundColor = "rgb(255,"+gb+","+gb+")";
        }

        _clickSound.play();
    }


    function _doShow (startingCell) 
    {
        _showQueue.sort(function(a,b) {
            /*
            var aDistX = Math.abs(a.x-x);
            var bDistX = Math.abs(b.x-x);
            if (do3D && (aDistX > xMax/2)) aDistX = Math.abs(aDistX - xMax);
            if (do3D && (bDistX > xMax/2)) bDistX = Math.abs(bDistX - xMax);
            var aDist = Math.pow(aDistX,2) + Math.pow(Math.abs(a.y-y),2);
            var bDist = Math.pow(bDistX,2) + Math.pow(Math.abs(b.y-y),2);
            */
            var aDist = a.distanceSqr(startingCell);
            var bDist = b.distanceSqr(startingCell);

            if (aDist === bDist) {
                return 0;
            }
            else if (aDist < bDist) {
                return 1;
            }
            else {
                return -1;
            }
        });

        var cell = _showQueue.pop();
        _show(cell);
        _showTimerId = window.setInterval(_doShowOnce, _showTimerDelay);
    }


    function _placeBombs (xSafe, ySafe) 
    {
        while (_bombsToCreate) {
            var xBomb = Math.floor(Math.random()*_xMax);
            var yBomb = Math.floor(Math.random()*_yMax);
	    if ((xBomb === xSafe) && (yBomb === ySafe)) {
	        continue;
	    }
            if (this.data.cell(xBomb, yBomb).hasBomb()) {
                continue;
            }
            _placeBomb.bind(this)(xBomb, yBomb);
            --_bombsToCreate;
        }
        /*
        this.data.forEach(function (cell) {
            var classes = cell.elem.classList;
            if (cell.hasBomb()) {
                classes.add("bomb3d-hasBomb");
            }
            else if (cell.count) {
                var count = cell.count;
                var gb = Math.round(255 * (8-count)/8);
                var elem = cell.elem;
                elem.innerText = count;
                elem.style.backgroundColor = "rgb(255,"+gb+","+gb+")";
                classes.remove("bomb3d-hiddenEven", "bomb3d-hiddenOdd")
            }
        });
        */
    }

    function _placeBomb (x, y) 
    {
        var row = this.data.row(y);
        var prevRow = this.data.row(y-1);
        var nextRow = this.data.row(y+1);
        var prevX = this.data.xNormalize(x-1);
        var nextX = this.data.xNormalize(x+1);

        this.data.cell(row, x).count = 9;
        this.data.cell(row, prevX).count++;
        this.data.cell(row, nextX).count++;
        if (prevRow) {
            this.data.cell(prevRow, x).count++;
            this.data.cell(prevRow, prevX).count++;
            this.data.cell(prevRow, nextX).count++;
        }
        if (nextRow) {
            this.data.cell(nextRow, x).count++;
            this.data.cell(nextRow, prevX).count++;
            this.data.cell(nextRow, nextX).count++;
        }
    }


    this.explode = function (x,y)
    {
        console.log("explode",x,y);
        _explodeSound = _explodeSound || document.getElementById("explode");
        this.topology.spinTo(x,y)
        var cell = this.data.cell(x,y);
        _showAll.bind(this)(cell);
        cell.elem.classList.add("bomb-exploded");
        this.topology.setMessage("You lose!");
        _explodeSound.play();
    }

    this.doHint = function ()
    {
        if (_bombsToCreate) {
	    _placeBombs.bind(this)();
        }

        if (!_cellsToShow) {
            return;
        }

        var xHint, yHint, cell;
        do {
            xHint = Math.floor(Math.random()*_xMax);
            yHint = Math.floor(Math.random()*_yMax);
            cell = this.data.cell(xHint, yHint);
        }
        while (cell.shown || cell.hasBomb());

        var topo = this.topology;
        topo.setMessage("Hint: ("+xHint+"x"+yHint+")");
	topo.spinTo(xHint, yHint, function() {
	    this.floodFill(xHint, yHint);
	    cell.elem.style.webkitAnimationName = "bomb-hintPulse";
	});
    }


    // ------------
    // private data


    var _numCells = this.data.numCells();
    var _xMax = this.data.xMax();
    var _yMax = this.data.yMax();
    var _showTimerId;
    var _showTimerDelay = Math.min(10, 5000 / _numCells);
    var _bombsToCreate = Math.max(Math.round(_numCells * this.bombRatio), 1);
    var _cellsToShow = _numCells - _bombsToCreate;
    var _floodStack = [];
    var _showQueue = [];
    var _clickSound, _explodeSound;

    // ----------------
    // constructor code

    this.reset();
    this.topology.forEach(function (elem, x, y) {
        //elem.addEventListener("click",     new Function('Game.Logic.Bomb.doFloodFill('+x+', '+y+');'), false);
        //elem.addEventListener("mouseover", new Function('Game.Logic.Bomb.enterCell('+x+', '+y+');'), false);
        //elem.addEventListener("mouseout",  new Function('Game.Logic.Bomb.leaveCell('+x+', '+y+');'), false);
    });

    _placeBombs.bind(this)(0,0);

}; // Game.Logic.Bomb