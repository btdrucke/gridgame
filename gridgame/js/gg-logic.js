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


    this.hasWin = function () 
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

    this.win = function (winningCell)
    {
        if (_bombsToCreate) {
	    _placeBombs.bind(this)();
        }

        if (!_cellsToShow) {
            return;
        }

        _successSound = success || document.getElementById("success");
        var topo = this.topology;
        topo.setMessage("You WIN!");
        topo.data.forEach(function (cell) {
	    if (cell.hasBomb()) {
		cell.hasFlag = true;
	    }
        });
        _showAll.bind(this)(winningCell);
        _successSound.play();
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

        _queueShow(cell);
        _doShow(cell);
	cell.elem.style.webkitAnimationName = "bomb-hintPulse";

	topo.spinTo(xHint, yHint, function() {
	    //this.floodFill(xHint, yHint);
	    //cell.elem.style.webkitAnimationName = "bomb-hintPulse";
	});
    }


    this.floodFill = function (startX, startY)
    {
        console.log("floodFill",startX,startY);
        if (_bombsToCreate) {
	    _placeBombs.bind(this)(x,y);
        }

        var startingCell = this.data.cell(startX, startY);
        if (startingCell.hasBomb()) {
            this.explode(startX, startY);
            return;
        }

        this.topology.spinTo(startX, startY);
        if (startingCell.shown) {
            return;
        }
        
        if (startingCell.count > 0) {
            _queueShow.bind(this)(startingCell);
	    if (!cellsToShow) {
	        this.win(startingCell);
	    }
	    else {
	        _doShow.bind(this)(startingCell);
	    }
    	    return;
        }

        _floodStack = [startingCell];
        while(_floodStack.length) {
            var cell = _floodStack.pop();
            var x = cell.x();
            var y = cell.y();

            var x1 = x; 
            var cell1;
            do {
                cell1 = this.data.cell(x1,y);
                --x1;
            }
            while (this.data.xInRange(x1) && !cell1.shown && (cell1.count === 0) && (x1 != x));
            ++x1;

            var spanTop  = false;
            var spanBottom = false;

            while (this.data.xInRange(x1) && !cell1.shown && (cell1.count === 0)) {
	        conditionalShow(x-1, y1);
                queueShow(x, y1);
	        conditionalShow(x+1, y1);
                
	        if (y1 > 0) {
		    conditionalShow(x-1, y1-1);
		    conditionalShow(x,   y1-1);
		    conditionalShow(x+1, y1-1);
	        }
	        if (y1 < yMax-1) {
		    conditionalShow(x-1, y1+1);
		    conditionalShow(x,   y1+1);
		    conditionalShow(x+1, y1+1);
	        }
	        
	        if (!cellsToShow) {
		    win(startX,startY);
		    return;
	        }

	        var leftNeedsShowing = do3D 
		    ? (isHidden(xPrev(x), y1) && (grid[y1][xPrev(x)].count == 0))
		    : ((x > 0) && isHidden(x-1, y1) && (grid[y1][x-1].count == 0));

                if (!spanLeft && leftNeedsShowing) {
                    if (!push(xPrev(x), y1)) return;
                    spanLeft = true;
                }
                else if (spanLeft && !leftNeedsShowing) {
                    spanLeft = false;
                }

	        var rightNeedsShowing = do3D
		    ? (isHidden(xNext(x), y1) && (grid[y1][xNext(x)].count == 0))
		    : ((x < xMax - 1) && isHidden(x+1, y1) && (grid[y1][x+1].count == 0));
                if (!spanRight && rightNeedsShowing) {
                    if (!push(xNext(x), y1)) return;
                    spanRight = true;
                }
                else if (spanRight && !rightNeedsShowing) {
                    spanRight = false;
                }
                ++y1;
            }
        }
        _doShow.bind(this)(startingCell);
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
    var _clickSound, _explodeSound, _successSound;

    // ----------------
    // constructor code

    this.reset();
    /*
    this.topology.forEach(function (elem, x, y) {
        elem.addEventListener("click",     new Function('Game.Logic.Bomb.doFloodFill('+x+', '+y+');'), false);
        elem.addEventListener("mouseover", new Function('Game.Logic.Bomb.enterCell('+x+', '+y+');'), false);
        elem.addEventListener("mouseout",  new Function('Game.Logic.Bomb.leaveCell('+x+', '+y+');'), false);
    });
    */

    //_placeBombs.bind(this)(0,0);

    document.getElementById("hint").addEventListener("click", this.doHint.bind(this), false);
    document.getElementById("reset3d").addEventListener("click", function (e) {
        var cell = this.data.cell(this.topology.xPos, this.topology.yPos);
        this.win.bind(this)(cell);
    }.bind(this), false);

}; // Game.Logic.Bomb
