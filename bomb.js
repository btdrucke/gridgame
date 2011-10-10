var grid    = [];
var stackSize    = 5000;
var stack        = new Array(stackSize);
var stackPointer = 0;
var yMax         = 50;
var xMax         = 50;
var cellsToShow  = 0;

function pop(x, y)
{
    if (stackPointer > 0) {
        var p = stack[stackPointer];
        x = p / yMax;
        y = p % yMax;
        --stackPointer;
        return {x:x, y:y};
    } 
    else {
        return 0;
    }
}

function push(x, y)
{
    if (stackPointer < stackSize - 1) {
        ++stackPointer;
        stack[stackPointer] = yMax * x + y;
        return true;
    }  
    else {
        return false;
    }
}

function emptyStack()
{
    stack        = [];
    stackPointer = 0;
}


function showAll()
{
    for(var row=0; row<yMax; ++row) {
        for(var col=0; col<xMax; ++col) {
            show(col, row);
        }
    }
}

function setMessage(msg)
{
    var msgElem = document.getElementById('message');
    msgElem.innerHTML = msg;
}

function explode(x,y)
{
    console.log("explode",x,y);
    showAll();
    grid[y][x].cell.style.cssText += 'background-color:rgb(255,255,0)';
    setMessage("You lose!");
}


function doFloodFill(x,y)
{
    if (!cellsToShow) return;

    if (hasBomb(x,y)) {
        explode(x,y);
    }
    else {
        floodFill(x,y);
    }
}

function floodFill(x, y)
{
    console.log("floodFill",x,y);
    if (isShown(x,y)) return;

    if (grid[y][x].count > 0) {
    	show(x,y);
	if (!cellsToShow) {
	    setMessage("You WIN!");
	    showAll();
	}
    	return;
    }

    emptyStack();
    if(!push(x, y)) return;

    while(popped = pop(x, y)) {
        x = parseInt(popped.x);
        y = parseInt(popped.y);
        var y1 = y;

        //while((y1 >= 0) && isHidden(x,y1) && !hasBomb(x,y1)) {
        while((y1 >= 0) && isHidden(x,y1) && (grid[y1][x].count == 0)) {
            --y1;
        }
        ++y1;

        var spanLeft  = false;
        var spanRight = false;

        //while ((y1 < yMax) && isHidden(x,y1) && !hasBomb(x,y1)) {
        while ((y1 < yMax) && isHidden(x,y1) && (grid[y1][x].count == 0)) {
            show(x, y1);
            
	    if (y1 > 0) {
		if ((x>0) && (grid[y1-1][x-1].count > 0)) show(x-1, y1-1);
		if ((grid[y1-1][x].count > 0)) show(x, y1-1);
		if ((x<xMax-1) && (grid[y1-1][x+1].count > 0)) show(x+1, y1-1);
	    }
	    if (y1 < yMax-1) {
		if ((x>0) && (grid[y1+1][x-1].count > 0)) show(x-1, y1+1);
		if ((grid[y1+1][x].count > 0)) show(x, y1+1);
		if ((x<xMax-1) && (grid[y1+1][x+1].count > 0)) show(x+1, y1+1);
	    }
	    if ((x>0) && (grid[y1][x-1].count > 0)) show(x-1, y1);
	    if ((x<xMax-1) && (grid[y1][x+1].count > 0)) show(x+1, y1);
	    
	    if (!cellsToShow) {
		setMessage("You WIN!");
		showAll();
	    }

	    //var leftNeedsShowing = (x > 0) && isHidden(x-1, y1) && !hasBomb(x-1, y1);
	    var leftNeedsShowing = (x > 0) && isHidden(x-1, y1) && (grid[y1][x-1].count == 0);
            if (!spanLeft && leftNeedsShowing) {
                if (!push(x - 1, y1)) return;
                spanLeft = true;
            }
            else if (spanLeft && !leftNeedsShowing) {
                spanLeft = false;
            }

	    //var rightNeedsShowing = (x < xMax - 1) && isHidden(x+1, y1) && !hasBomb(x+1, y1);
	    var rightNeedsShowing = (x < xMax - 1) && isHidden(x+1, y1) && (grid[y1][x+1].count == 0);
            if (!spanRight && rightNeedsShowing) {
                if (!push(x + 1, y1)) return;
                spanRight = true;
            }
            else if (spanRight && !rightNeedsShowing) {
                spanRight = false;
            }
            ++y1;
        }

    }
}

function hasBomb(x, y) 
{
    // An empty space surrounded by bombs will have a count of 8.
    //console.log("hasBomb",x,y,grid[y][x].count);
    return (grid[y][x].count > 8);
}

function xInRange(x)
{
    return (x>=0) && (x < xMax);
}

function yInRange(y)
{
    return (y>=0) && (y < yMax);
}


function placeBomb(x, y) 
{
    //console.log("placeBomb",x,y);
    if (xInRange(x-1)) {
        if (yInRange(y-1)) grid[y-1][x-1].count++;
        if (yInRange(y  )) grid[y  ][x-1].count++;
        if (yInRange(y+1)) grid[y+1][x-1].count++;
    }
    if (xInRange(x)) {
        if (yInRange(y-1)) grid[y-1][x].count++;
        if (yInRange(y  )) {
            grid[y  ][x].count = 9;
            //grid[y][x].cell.style.cssText += "background-image:url('bomb.png');background-position:center;background-repeat:no-repeat;border:1px solid";
        }
        if (yInRange(y+1)) grid[y+1][x].count++;
    }
    if (xInRange(x+1)) {
        if (yInRange(y-1)) grid[y-1][x+1].count++;
        if (yInRange(y  )) grid[y  ][x+1].count++;
        if (yInRange(y+1)) grid[y+1][x+1].count++;
    }
}

function isHidden(x,y)
{
    //console.log("isHidden",x,y,!grid[y][x].shown);
    return !grid[y][x].shown;
}

function isShown(x,y)
{
    //console.log("isShown",x,y, grid[y][x].shown);
    return grid[y][x].shown;
}


function show(x,y)
{
    //console.log("show",x,y);
    if (isShown(x,y)) return;

    grid[y][x].shown = true;

    var cell = grid[y][x].cell;
    if (hasBomb(x,y)) {
        cell.style.cssText += "background-image:url('bomb.png');background-position:center;background-repeat:no-repeat;border:1px solid";
    }
    else {
        var count = grid[y][x].count;
        //console.log("no bomb", count);
        if (count > 0) {
            cell.innerHTML = count;
        }
        var gb = Math.round(255 * (8-count)/8);
        cell.style.cssText += "background-color:rgb(255,"+gb+","+gb+")";
	--cellsToShow;
    }
}


function loadFloodFill(w, h, totalBombs, blockSize)
{
    setMessage("");

    xMax = w;
    yMax = h;
    var tbl = document.getElementById('cells');
    for (var i = tbl.childNodes.length-1; i>=0; --i) {
        tbl.removeChild(tbl.childNodes[i]);
    }

    for (var row=0; row<yMax; ++row) {
        grid[row] = [];
        var tr  = document.createElement('TR');
        tr.style.cssText = 'background-color:#ffffff';
        for (var col=0; col<xMax; ++col) {
            var td     = document.createElement('TD');
            grid[row][col] = {cell:td, count:0, shown:false};

            td.style.cssText = 'width:'+blockSize+'px;height:'+blockSize+'px;text-align:center;border:1px solid;background-color:#b0b0b0';
            td.id            = 'cell'+col+'_'+row;
            td.onclick       = new Function('doFloodFill('+col+', '+row+');');
            tr.appendChild(td);
        }
        tbl.appendChild(tr);
    }

    var bombsToCreate = Math.max(Math.min(totalBombs, Math.ceil(yMax*xMax*0.25)), 1);
    cellsToShow = w*h-bombsToCreate;

    while (bombsToCreate) {
        var xBomb = Math.floor(Math.random()*xMax);
        var yBomb = Math.floor(Math.random()*yMax);
        if (hasBomb(xBomb, yBomb)) {
            continue;
        }
        else {
            placeBomb(xBomb, yBomb);
            --bombsToCreate;
        }
    }
}

function doHint()
{
    if (!cellsToShow) return;

    var xHint = Math.floor(Math.random()*xMax);
    var yHint = Math.floor(Math.random()*yMax);
    while (!isHidden(xHint,yHint) || hasBomb(xHint, yHint)) {
	++xHint;
	if (xHint == xMax) {
	    xHint = 0;
	    ++yHint;
	    if (yHint == yMax) {
		yHint = 0;
	    }
	}
    }
    setMessage("Hint: ("+xHint+"x"+yHint+")");
    floodFill(xHint, yHint);
}

window.loadFloodFill = loadFloodFill;
window.doFloodFill   = doFloodFill;

