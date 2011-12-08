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
// Game.Logic.Bomb3d : minesweeper game logic
// ------------------------------------------

Game.Logic.Bomb3d = function (topology)
{
    this.Inherits(Game.Logic, topology);

    this.floodStack = [];
    this.showQueue = [];
    this.cellsToShow = 0;
    this.bombsToCreate = 0;
    this.showTimerId;
    this.showTimerDelay = 10;

    // Add Bomb3d-specific state and logic to DataCell
    Game.DataCell.prototype.hasBomb = function () {
        return (this.count > 8);
    };

    var _numCells = this.data.xMax() * this.data.yMax();
    var _bombRatio = 0.125; //Math.min(bombRatio, 0.25);
    var _bombsToCreate = Math.max(Math.round(_numCells * _bombRatio), 1);
    var _cellsToShow = _numCells - _bombsToCreate;
    
    this.placeBombs = function (xSafe, ySafe) 
    {
        var xMax = this.data.xMax();
        var yMax = this.data.yMax();
        while (_bombsToCreate) {
            var xBomb = Math.floor(Math.random()*xMax);
            var yBomb = Math.floor(Math.random()*yMax);
	    if ((xBomb == xSafe) && (yBomb == ySafe)) {
	        continue;
	    }
            if (this.data.cell(xBomb, yBomb).hasBomb()) {
                continue;
            }
            this.placeBomb(xBomb, yBomb);
            --_bombsToCreate;
        }
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
    }

    this.placeBomb = function (x, y) 
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

    this.reset();
    this.topology.forEach(function (elem, x, y) {
        //elem.addEventListener("click",     new Function('Game.Logic.Bomb.doFloodFill('+x+', '+y+');'), false);
        //elem.addEventListener("mouseover", new Function('Game.Logic.Bomb.enterCell('+x+', '+y+');'), false);
        //elem.addEventListener("mouseout",  new Function('Game.Logic.Bomb.leaveCell('+x+', '+y+');'), false);
    });

    this.placeBombs(0,0);
}


Game.Logic.Bomb3d.prototype.reset = function () 
{
    this.data.forEach(function (cell) {
        cell.count = 0;
        cell.shown = false;
        cell.hasFlag = false;
        cell.elem.classList.remove("bomb3d-flagChoice",    // TODO: namespace these class names
                                   "bomb3d-hasFlag",
                                   "bomb3d-hasBomb",
                                   "bomb3d-flagChoice",
                                   "bomb3d-exploded");
        cell.elem.classList.add((cell.x() + cell.y())%2 ? "bomb3d-hiddenEven" : "bomb3d-hiddenOdd");
    });
    
    this.floodStack = [];
    this.showQueue = [];
};


Game.Logic.Bomb3d.prototype.queueShow = function (cell) 
{
    // TODO: hack because duplicates are getting in the list somehow!
    if (cell.shown) return;

    cell.shown = true;
    this.showQueue.push(cell);
    if (!cell.hasBomb()) {
        --this.cellsToShow;
    }
};

Game.Logic.Bomb3d.prototype.showAll = function (startingCell)
{
    this.topology.data.forEach(function (cell) {
        this.queueShow(cell);
    });
    this.doShow(x,y);
};


Game.Logic.Bomb3d.prototype.doShowOnce = function ()
{
    if (!showTimerId) return;

    if (this.showQueue.length) {
        var cell = this.showQueue.pop();
        this.show(cell);
    }
    else {
        window.clearInterval(this.showTimerId);
        this.showTimerId = undefined;
        console.log("cellsToShow", this.cellsToShow);
    }
}

Game.Logic.Bomb3d.prototype.doShow = function (x,y) 
{
    toShowList.sort(function(a,b) {
        var aDistX = Math.abs(a.x-x);
        var bDistX = Math.abs(b.x-x);
        if (do3D && (aDistX > xMax/2)) aDistX = Math.abs(aDistX - xMax);
        if (do3D && (bDistX > xMax/2)) bDistX = Math.abs(bDistX - xMax);
        var aDist = Math.pow(aDistX,2) + Math.pow(Math.abs(a.y-y),2);
        var bDist = Math.pow(bDistX,2) + Math.pow(Math.abs(b.y-y),2);
        if (aDist == bDist) return 0;
        else if (aDist < bDist) return 1;
        else return -1;
    });

    [x, y] = toShowList.pop();
    show(x, y);
    this.showTimerId = window.setInterval("doShowOnce()", this.showTimerDelay);
}

