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

    function _increaseBombCount (x, y)
    {
        var cell = _cellFn(x, y);
        if (cell) {
            ++cell.count;
        }
    }

    var _normalizeXFn = this.topology.normalizeX.bind(this.topology);
    var _normalizeYFn = this.topology.normalizeY.bind(this.topology);
    var _cellFn       = this.data.cell.bind(this.data);

    function _placeBomb (x, y) 
    {
        _cellFn(x, y).count = 9;

        var xPrev = _normalizeXFn(x-1);
        var xNext = _normalizeXFn(x+1);
        var yPrev = _normalizeYFn(y-1);
        var yNext = _normalizeYFn(y+1);

        _increaseBombCount(xPrev, yPrev);
        _increaseBombCount(xPrev, y    );
        _increaseBombCount(xPrev, yNext);
        _increaseBombCount(x,     yPrev);
        _increaseBombCount(x,     yNext);
        _increaseBombCount(xNext, yPrev);
        _increaseBombCount(xNext, y    );
        _increaseBombCount(xNext, yNext);
    }


    this.explode = function (startingCell)
    {
        var x = startingCell.x;
        var y = startingCell.y;
        this.topology.spinTo(x,y)
        console.log("explode",x,y);
        _explodeSound = _explodeSound || document.getElementById("explode");
        _showAll.bind(this)(startingCell);
        startingCell.elem.classList.add("bomb-exploded");
        this.topology.setMessage("You lose!");
        _explodeSound.play();
    }

    this.win = function (winningCell)
    {
        if (_bombsToCreate) {
	    _placeBombs.bind(this)(winningCell);
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

    function _conditionalShow (cell)
    {
        if (cell && (cell.count > 0)) {
            _queueShow(cell);
        }
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

            var y1 = y;
            var cell1;
            do {
                y1 = _normalizeYFn(y1 - 1);
                cell1 = _cellFn(x, y1);
            } while ((y1 !== y) && cell1 && !cell1.shown && (cell1.count === 0));
            y1 = _normalizeYFn(y1 + 1);
            cell1 = _cellFn(x, y1);

            var spanLeft  = false;
            var spanRight = false;

            var y1Start = y1;
            var cell2;
            do {
                _queueShow(cell1);
                var xPrev = _normalizeXFn(x-1);
                var xNext = _normalizeXFn(x+1);
                var yPrev = _normalizeYFn(y1-1);
                var yNext = _normalizeYFn(y1+1);

                var leftCell  = _cellFn(xPrev, y1); _conditionalShow(leftCell);
                var rightCell = _cellFn(xNext, y1); _conditionalShow(rightCell);
                cell2 = _cellFn(xPrev, yPrev); _conditionalShow(cell2);
                cell2 = _cellFn(x    , yPrev); _conditionalShow(cell2);
                cell2 = _cellFn(xNext, yPrev); _conditionalShow(cell2);
                cell2 = _cellFn(xPrev, yNext); _conditionalShow(cell2);
                cell2 = _cellFn(x    , yNext); _conditionalShow(cell2);
                cell2 = _cellFn(xNext, yNext); _conditionalShow(cell2);
	        
	        if (!_cellsToShow) {
		    this.win(startingCell);
		    return;
	        }

	        var leftNeedsShowing = (leftCell && !leftCell.shown && (leftCell.count === 0));

                if (!spanLeft && leftNeedsShowing) {
                    _floodStack.push(leftCell);
                    spanLeft = true;
                }
                else if (spanLeft && !leftNeedsShowing) {
                    spanLeft = false;
                }

	        var rightNeedsShowing = (rightCell && !rightCell.shown && (rightCell.count === 0));
                if (!spanRight && rightNeedsShowing) {
                    _floodStack.push(rightCell);
                    spanRight = true;
                }
                else if (spanRight && !rightNeedsShowing) {
                    spanRight = false;
                }

                y1 = _normalizeYFn(y1 + 1);
                cell1 = _cellFn(x, y1);
            } while ((y1 !== y1Start) && cell1 && !cell1.shown && (cell1.count === 0));
        }
        _doShow.bind(this)(startingCell);
    }

    this.onReady = function (Event) 
    {
        document.getElementById("hint").addEventListener("click", this.doHint.bind(this), false);
        document.getElementById("reset3d").addEventListener("click", function (e) {
            var cell = this.data.cell(this.topology.xPos, this.topology.yPos);
            this.win(cell);
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
    this.topology.clickCb = this.floodFill.bind(this);

}; // Game.Logic.Bomb
