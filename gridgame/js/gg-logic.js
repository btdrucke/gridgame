window.Game = window.Game || {};  // namespace

// -------------------------------------
// Game.Logic: Base class for game logic
// -------------------------------------

Game.Logic = function (options)
{
    // -------------
    // options logic

    var _defaults = {
        topology: undefined
    };
    options = Game.mergeOptions(_defaults, options);

    // ------
    // public

    this.topology = options.topology;
    this.data = this.topology.data;
    this.xSize = this.data.xMax;
    this.ySize = this.data.yMax;

    this.topology.clickCb = function (cell, event)
    {
        console.log("Clicked cell at",cell.x, cell.y);
    }
    this.topology.mouseoverCb = function (cell, event)
    {
        console.log("Entered cell at",cell.x, cell.y);
    }
    this.topology.mouseoutCb = function (cell, event)
    {
        console.log("Left cell at",cell.x, cell.y);
    }

    this.onReady = function (event)
    {
        //noop
    }
    
    function _onReadyDispatch (event)
    {
        return this.onReady(event);
    }

    document.addEventListener('DOMContentLoaded', _onReadyDispatch.bind(this), false);
};


// ------------------------------------------
// Game.Logic.Bomb : minesweeper game logic
// ------------------------------------------

Game.Logic.Bomb = function (options)
{
    var _defaults = {
        bombRatio: 0.125
    }
    options = Game.mergeOptions(_defaults, options);
    this.Inherits(Game.Logic, options);

    // ------
    // public

    this.bombRatio = options.bombRatio;

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
        this.data.eachCell(function (cell) {
            cell.count = 0;
            cell.shown = false;
            cell.hasFlag = false;
            var classList = cell.elem.classList;
            classList.add("bomb-cell");
            classList.add((cell.x + cell.y)%2 ? "bomb-hiddenEven" : "bomb-hiddenOdd");
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
        this.data.eachCell(function (cell) {
            _queueShow(cell);
        });
        _doShow.bind(this)(startingCell);
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
        var distanceSqrFn = this.topology.distanceSqr.bind(this.topology);
        _showQueue.sort(function(a,b) {
            var aDist = distanceSqrFn(startingCell, a);
            var bDist = distanceSqrFn(startingCell, b);

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


    function _placeBombs (startingCell) 
    {
        var xSafe = startingCell.x;
        var ySafe = startingCell.y;
        while (_bombsToCreate) {
            var xBomb = Math.floor(Math.random()*_xMax);
            var yBomb = Math.floor(Math.random()*_yMax);
	    if ((xBomb === xSafe) && (yBomb === ySafe)) {
	        continue;
	    }
            var cell = this.data.cell(xBomb, yBomb);
            if (cell.hasBomb()) {
                continue;
            }
            _placeBomb.bind(this)(xBomb, yBomb);
            --_bombsToCreate;
        }
    }

    function _increaseBombCount (cell)
    {
        if (cell) {
            ++cell.count;
        }
    }

    function _placeBomb (x, y) 
    {
        this.data.cell(x, y).count = 9;

        var cellFn = this.data.cell.bind(this.data);

        _increaseBombCount(cellFn(x-1, y-1));
        _increaseBombCount(cellFn(x-1, y  ));
        _increaseBombCount(cellFn(x-1, y+1));
        _increaseBombCount(cellFn(x, y-1));
        _increaseBombCount(cellFn(x, y+1));
        _increaseBombCount(cellFn(x+1, y-1));
        _increaseBombCount(cellFn(x+1, y  ));
        _increaseBombCount(cellFn(x+1, y+1));
    }


    this.explode = function (x,y)
    {
        var x = startingCell.x;
        var y = startingCell.y;
        this.topology.spinTo(x,y)
        console.log("explode",x,y);
        _explodeSound = _explodeSound || document.getElementById("explode");
        var cell = this.data.cell(x,y);
        _showAll.bind(this)(cell);
        cell.elem.classList.add("bomb-exploded");
        this.topology.setMessage("You lose!");
        _explodeSound.play();
    }

    this.win = function (winningCell)
    {
        if (_bombsToCreate) {
	    _placeBombs.bind(this)(winningCell);
        }

        if (!_cellsToShow) {
            return;
        }

        _successSound = success || document.getElementById("success");
        var topo = this.topology;
        topo.setMessage("You WIN!");
        topo.data.eachCell(function (cell) {
	    if (cell.hasBomb()) {
		cell.hasFlag = true;
	    }
        });
        _showAll.bind(this)(winningCell);
        _successSound.play();
    }


    this.doHint = function ()
    {
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

        if (_bombsToCreate) {
	    _placeBombs.bind(this)(cell);
        }

        var topo = this.topology;
        topo.setMessage("Hint: ("+xHint+"x"+yHint+")");

        //_queueShow(cell);
        //_doShow(cell);
	this.floodFill(cell);
	cell.elem.style.webkitAnimationName = "bomb-hintPulse";

	topo.spinTo(xHint, yHint, function() {
	    //this.floodFill(xHint, yHint);
	    //cell.elem.style.webkitAnimationName = "bomb-hintPulse";
	});
    }


    this.floodFill = function (startingCell)
    {
        if (_bombsToCreate) {
	    _placeBombs.bind(this)(startingCell);
        }

        if (startingCell.hasBomb()) {
            this.explode(startingCell);
            return;
        }

        var startX = startingCell.x;
        var startY = startingCell.y;
        this.topology.spinTo(startX, startY);

        if (startingCell.shown) {
            return;
        }
        
        console.log("floodFill", startX, startY);

        if (startingCell.count > 0) {
            _queueShow.bind(this)(startingCell);
	    if (!_cellsToShow) {
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
            var x = cell.x;
            var y = cell.y;
            var prevRow = this.data.row(y-1);
            var currRow = this.data.row(y);
            var nextRow = this.data.row(y+1);

            var x1 = x; 
            var cell1;
            do {
                cell1 = thisRow[x1];
                --x1;
            } while (this.data.xInRange(x1) && !cell1.shown && (cell1.count === 0) && (x1 != x));
            ++x1;

            var spanTop  = false;
            var spanBottom = false;

            do {
                cell1 = thisRow[x1];
                _queueShow (cell1);
                var hasPrevCell = this.data.xInRange(x1-1);
                var hasNextCell = this.data.xInRange(x1+1);
                if (prevRow) {
                    _queueShow (cell1);
                }
            
	        conditionalShow(x1, y-1);
	        conditionalShow(x1, y+1);
		conditionalShow(x1-1, y-1);
		conditionalShow(x1-1,   y);
		conditionalShow(x1-1, y+1);
		conditionalShow(x1+1, y-1);
		conditionalShow(x1+1,   y);
		conditionalShow(x1+1, y+1);
	        
	        if (!_cellsToShow) {
		    this.win(startingCell);
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
                ++x1;
            } while (this.data.xInRange(x1) && !cell1.shown && (cell1.count === 0) && (x1 != x));
        }
        _doShow.bind(this)(startingCell);
    }

    function cellEventHandler (event) 
    {
        
    }


    this.onReady = function (Event) 
    {
        document.getElementById("hint").addEventListener("click", this.doHint.bind(this), false);
        document.getElementById("reset3d").addEventListener("click", function (e) {
            var cell = this.data.cell(this.topology.xPos, this.topology.yPos);
            this.win.bind(this)(cell);
        }.bind(this), false);
    }

    // ------------
    // private data


    var _numCells = this.data.numCells;
    var _xMax = this.xSize;
    var _yMax = this.ySize;
    var _showTimerId;
    var _showTimerDelay = 1;//Math.min(10, 5000 / _numCells);
    var _bombsToCreate = Math.max(Math.round(_numCells * this.bombRatio), 1);
    var _cellsToShow = _numCells - _bombsToCreate;
    var _floodStack = [];
    var _showQueue = [];
    var _clickSound, _explodeSound, _successSound;

    // ----------------
    // constructor code

    this.reset();

}; // Game.Logic.Bomb
