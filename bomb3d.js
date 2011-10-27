// based on http://www.selfcontained.us/2009/09/16/getting-keycode-values-in-javascript/

function getKeyCode(event)
{
    var keycode = null;
    if (window.event) {
        keycode = window.event.keyCode;
    } 
    else if(event) {
        keycode = event.which;
    }
    return keycode;    
}

function spin(by) 
{
    by = Math.round(by||1);
    xPos += by;
    gridElem.style.webkitTransform = "rotateY("+xPos*360/xMax+"deg)";
}

function spinTo(x)
{
    if (x - xPos > xMax/2) {
	xPos = -x + xMax;
    }
    else {
	xPos = -x;
    }
    gridElem.style.webkitTransform = "rotateY("+xPos*360/xMax+"deg)";
}

function handleKeyDown(event) 
{
    var code = getKeyCode(event);
    
    switch (code) {
    case 37: //left
	spin(-1);
	break;
    case 39: //right
	spin(1);
	break;
    }
    return false;
}

function animationStart(event) 
{
    console.log("animation start");
}

function animationEnd(event) 
{
    console.log("animation end");
}


function hasClassName(inElement, inClassName)
{
    var regExp = new RegExp('(?:^|\\s+)' + inClassName + '(?:\\s+|$)');
    return regExp.test(inElement.className);
}

function addClassName(inElement, inClassName)
{
    if (!hasClassName(inElement, inClassName))
        inElement.className = [inElement.className, inClassName].join(' ');
}

function removeClassName(inElement, inClassName)
{
    if (hasClassName(inElement, inClassName)) {
        var regExp = new RegExp('(?:^|\\s+)' + inClassName + '(?:\\s+|$)', 'g');
        var curClasses = inElement.className;
        inElement.className = curClasses.replace(regExp, ' ');
    }
}

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
    msgElem.innerText = msg;
}

function explode(x,y)
{
    console.log("explode",x,y);
    showAll();
    addClassName(grid[y][x].cell, "exploded");
    setMessage("You lose!");
    spinTo(x);
    var explodeSound = document.getElementById("explode");
    explodeSound.play();
}


function doFloodFill(x,y)
{
    if (!cellsToShow) return;

    if (bombsToCreate) {
	placeBombs(x,y);
    }
    if (hasBomb(x,y)) {
        explode(x,y);
    }
    else {
        floodFill(x,y);
    }
}

function xPrev(x)
{
    if (x == 0) return (xMax-1)
    else return x-1;
}

function xNext(x)
{
    return (x+1)%xMax;
}


function conditionalShow(x,y)
{
    if (do3D) {
	if (x < 0) 
	    x = (x+xMax) % xMax;
	else if (x >= xMax) 
	    x = x % xMax;
    }
    else {
	if ((x < 0) || (x >= xMax)) return;
    }
    if ((grid[y][x].count > 0)) show(x, y);
}


function floodFill(x, y)
{
    console.log("floodFill",x,y);
    if (isShown(x,y)) return;

    spinTo(x);
    
    if (grid[y][x].count > 0) {
    	show(x,y);
	if (!cellsToShow) {
	    setMessage("You WIN!");
	    showAll();
	    var successSound = document.getElementById("success");
	    successSound.play();
	}
    	return;
    }

    emptyStack();
    if(!push(x, y)) return;

    while(popped = pop(x, y)) {
        x = parseInt(popped.x);
        y = parseInt(popped.y);
        var y1 = y;

        while((y1 >= 0) && isHidden(x,y1) && (grid[y1][x].count == 0)) {
            --y1;
        }
        ++y1;

        var spanLeft  = false;
        var spanRight = false;

        while ((y1 < yMax) && isHidden(x,y1) && (grid[y1][x].count == 0)) {
	    conditionalShow(x-1, y1);
            show(x, y1);
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
		setMessage("You WIN!");
		showAll();
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
    grid[y][x].count = 9;
    if (yInRange(y-1)) grid[y-1][x].count++;
    if (yInRange(y+1)) grid[y+1][x].count++;

    if (do3D) {
        grid[y][xPrev(x)].count++;
        grid[y][xNext(x)].count++;
        if (yInRange(y-1)) {
	    grid[y-1][xPrev(x)].count++;
            grid[y-1][xNext(x)].count++;
	}
        if (yInRange(y+1)) {
	    grid[y+1][xPrev(x)].count++;
            grid[y+1][xNext(x)].count++;
	}
    }
    else {
	if (xInRange(x-1)) {
            grid[y][x-1].count++;
            if (yInRange(y-1)) grid[y-1][x-1].count++;
            if (yInRange(y+1)) grid[y+1][x-1].count++;
	}
	if (xInRange(x+1)) {
	    grid[y][x+1].count++;
            if (yInRange(y-1)) grid[y-1][x+1].count++;
            if (yInRange(y+1)) grid[y+1][x+1].count++;
	}
    }
}


function placeBombs(xNone, yNone) 
{
    while (bombsToCreate) {
        var xBomb = Math.floor(Math.random()*xMax);
        var yBomb = Math.floor(Math.random()*yMax);
	if ((xBomb == xNone) && (yBomb == yNone)) {
	    continue;
	}
        if (hasBomb(xBomb, yBomb)) {
            continue;
        }
        else {
            placeBomb(xBomb, yBomb);
            --bombsToCreate;
        }
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
	addClassName(cell, "hasBomb");
	cell.style.backgroundSize = cellHeight+"px "+cellHeight+"px";
    }
    else {
        var count = grid[y][x].count;
        //console.log("no bomb", count);
        if (count > 0) {
            cell.innerText = count;
        }
        var gb = Math.round(255 * (8-count)/8);
        cell.style.backgroundColor = "rgb(255,"+gb+","+gb+")";
	--cellsToShow;
    }

    var clickSound = document.getElementById('click');
    clickSound.play();
}

function createGrid3d(cellHeight)
{
    var cellWidth = cellHeight;
    var circum = cellWidth*xMax;
    var radius = circum/(2*Math.PI);
    var cellRot = 360/xMax;

    for (var i = gridElem.childNodes.length-1; i>=0; --i) {
        gridElem.removeChild(gridElem.childNodes[i]);
    }

    for (var y = 0; y < yMax; ++y) {
        grid[y] = [];
	for (var x = 0; x < xMax; ++x) {
	    var xRot = Math.round(x*cellRot);
	    var cell = document.createElement('div');
            grid[y][x] = {"cell": cell, "count": 0, "shown": false};
	    addClassName(cell, "plane");
	    addClassName(cell, (x+y)%2 ? "hiddenEven" : "hiddenOdd");
	    //cell.innerText = x;
	    cell.style.height = ""+cellHeight+"px";
	    cell.style.width = ""+cellWidth+"px";
	    cell.style.webkitTransform = "rotateY(" +xRot+ "deg) \
                                          translateY("+cellHeight*y+"px) \
                                          translateZ("+radius+"px)";
            cell.onclick = new Function('doFloodFill('+x+', '+y+');');
	    gridElem.appendChild(cell);
	}
    }
}


function createGrid(cellHeight)
{
    for (var i = gridElem.childNodes.length-1; i>=0; --i) {
        gridElem.removeChild(gridElem.childNodes[i]);
    }

    for (var y = 0; y < yMax; ++y) {
        grid[y] = [];
        var row = document.createElement("div");
	row.className = "row";
        row.style.backgroundColor = "white";
        for (var x = 0; x < xMax; ++x) {
            var cell = document.createElement("div");
            grid[y][x] = {"cell": cell, "count": 0, "shown": false};
	    cell.className    = "cell hidden";
            cell.style.width  = cellHeight+'px';
	    cell.style.height = cellHeight+'px';
            cell.onclick      = new Function('doFloodFill('+x+', '+y+');');
            row.appendChild(cell);
        }
        gridElem.appendChild(row);
    }
}


function loadFloodFill(w, h, bombRatio, cellHeight)
{
    setMessage("");

    xMax = w;
    yMax = h;

    if (do3D) {
	createGrid3d(cellHeight);
    }
    else {
	createGrid(cellHeight);
    }

    bombRatio = Math.min(bombRatio, 0.25);
    bombsToCreate = Math.round(Math.max(yMax*xMax*bombRatio, 1));
    cellsToShow = w*h-bombsToCreate;
}

function doHint()
{
    if (!cellsToShow) return;

    if (bombsToCreate) {
	placeBombs();
    }

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
    grid[yHint][xHint].cell.style.webkitAnimationName = "hintPulse";
}


function clickCoordsWithinElement(event) {
    var coords = {x: 0, y: 0};
    if (!event) {
        event = window.event;
        coords.x = event.x;
        coords.y = event.y;
    } else {
        var element = event.target ;
        var totalOffsetLeft = 0;
        var totalOffsetTop = 0 ;

        while (element.offsetParent)
        {
            totalOffsetLeft += element.offsetLeft;
            totalOffsetTop += element.offsetTop;
            element = element.offsetParent;
        }
        coords.x = event.pageX - totalOffsetLeft;
        coords.y = event.pageY - totalOffsetTop;
    }
    return coords;
}

function mouseDown(event) 
{
    if (!pressed) {
	var coords = clickCoordsWithinElement(event);
	firstXPos = xPos;
	firstX = lastX = coords.x;
	lastY = coords.y
	pressed = true;
	dragging = false;
    }
}


function mouseUp(event) 
{
    if (pressed) {
        pressed = false;
	if (dragging) {
	    if (Math.abs(lastXDelta) > 2) {
		var a = (lastXDelta<0)?-1:1;
		var b = Math.abs(lastXDelta)/6;
		var c = Math.min(xMax/2, b)
		var spinBy = c * a;
		console.log("flick:" + lastXDelta+ ", spinBy:"+spinBy);
		spin(spinBy);
	    }
	    dragging = false;
	}
	else {
	}
    }
    return false;
}


function mouseMove(event) 
{
    if (pressed) {
	var coords = clickCoordsWithinElement(event);
        var x = coords.x;
        var y = coords.y;
        var xDelta = x-lastX;
        var yDelta = y-lastY;

	if (Math.abs(x-firstX) > 2) {
	    var spinBy = (lastXDelta<0)?-1:1;
	    spin(spinBy);
	}

	// fuzzy factor to determine drage versus sloppy click
        if (Math.abs(xDelta) + Math.abs(yDelta) > 2) {  
            dragging = true;
	    lastXDelta = xDelta;

	    console.log("dragging: " + xDelta);
	    var spinBy = (lastXDelta<0)?-1:1;
	    spin(spinBy);

            lastX = x;
            lastY = y;
        }
    }
}


var do3D = true;
var bombRatio = 0.125
var xMax, yMax, cellHeight;

if (do3D) {
    xMax = 36;
    yMax = 10;
    cellHeight = 40;
}
else {
    xMax = 10;
    yMax = 10;
    cellHeight = 50;
}

var grid = [];
var stackSize = 5000;
var stack = new Array(stackSize);
var stackPointer = 0;
var cellsToShow, bombsToCreate;
var xPos = 0;
var gridElem;
var pressed = false;
var dragging = false;
var lastX, lastY, lastXDelta;
var firstX, firstXPos;


window.onload = function() 
{
    document.onkeydown = handleKeyDown;

    document.getElementById("reset").addEventListener("click", function(event) {
	loadFloodFill(xMax,yMax,bombRatio,cellHeight);
    });
    document.getElementById("hint").addEventListener("click", doHint);

    gridElem = document.getElementById("grid");
    gridElem.addEventListener("webkitAnimationStart", animationStart, true);
    gridElem.addEventListener("webkitAnimationEnd", animationEnd, true);

    gridElem.addEventListener('mousedown', mouseDown, false);
    gridElem.addEventListener('mousemove', mouseMove, false);
    gridElem.addEventListener('mouseup', mouseUp, false);
    var body = document.getElementsByTagName("body")[0];
    body.addEventListener('mousedown', mouseDown, false);
    body.addEventListener('mousemove', mouseMove, false);
    body.addEventListener('mouseup', mouseUp, false);

    //body.addEventListener('mouseout', mouseUp, true);

    loadFloodFill(xMax,yMax,bombRatio,cellHeight);
};
