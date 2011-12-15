window.Game = window.Game || {};  // namespace

// ---------------------------------------------------------------
// Game.DataCell, Game.Data: classes for game grids and grid cells
// ---------------------------------------------------------------

Game.DataCell = function (x, y) 
{
    // public 

    this.__defineGetter__("x",    function() { return _x; });
    this.__defineGetter__("y",    function() { return _y; });
    this.__defineGetter__("elem", function() { return _elem; });

    // private

    var _x = x;
    var _y = y;
    var _elem = document.createElement("div");
    _elem.cell = this;
};


Game.Data = function (xMax, yMax) 
{
    // public 

    this.__defineGetter__("xMax",     function() { return _xMax; });
    this.__defineGetter__("yMax",     function() { return _yMax; });
    this.__defineGetter__("numCells", function() { return _numCells; });

    this.xInRange = function (x) {
        return (x !== undefined) && (x>=0) && (x < _xMax);
    };

    this.yInRange = function (y) {
        return (y !== undefined) && (y>=0) && (y < _yMax);
    };

    this.row = function (y) 
    {
        if (this.yInRange(y)) {
            return _grid[y];
        }
    }

    this.cell = function (x, y) 
    {
        var row = this.row(y);
        return this.cellInRow(row, x);
    }
  
    this.cellInRow = function (row, x) 
    {
        if (row && this.xInRange(x)) {
            return row[x];
        }
    }

    this.eachCell = function (fn) 
    {
        if (!fn) return;
        _grid.forEach(function (row) {
            row.forEach(function (cell) {
                fn(cell);
            });
        });
    }

    // private

    var _xMax = xMax;
    var _yMax = yMax;
    var _numCells = _xMax * _yMax;
    var _grid = [];

    // constructor

    for (var y = 0; y < _yMax; ++y) {
        _grid[y] = [];
        for (var x = 0; x < _xMax; ++x) {
            _grid[y][x] = new Game.DataCell(x, y);
        }
    }
};
