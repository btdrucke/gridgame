window.Game = window.Game || {};  // namespace

// -------------------------------------
// Game.Logic: Base class for game logic
// -------------------------------------

Game.Logic = function (topology)
{
    this.topology = topology;
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
        return (this.bomb3d.state.count > 8);
    };

    this.reset();
    this.topology.forEach(function (elem, x, y) {
        //elem.addEventListener("click",     new Function('Game.Logic.Bomb.doFloodFill('+x+', '+y+');'), false);
        //elem.addEventListener("mouseover", new Function('Game.Logic.Bomb.enterCell('+x+', '+y+');'), false);
        //elem.addEventListener("mouseout",  new Function('Game.Logic.Bomb.leaveCell('+x+', '+y+');'), false);
    });
}


Game.Logic.Bomb3d.prototype.reset = function () 
{
    this.topology.data.forEach(function (cell) {
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
