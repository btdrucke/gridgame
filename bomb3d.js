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
    if (!do3D) return;
    by = Math.round(by||1);
    xPos += by;
    var gridElem = document.getElementById("grid");
    gridElem.style.webkitTransform = "rotateY("+xPos*360/xMax+"deg)";
}

function normalizeX(x)
{
    var xTemp = (x % xMax);
    return (xTemp < 0) ? (xTemp+xMax) : xTemp;
}

function spinTo(x, whenDone)
{
    if (!do3D) return;
    console.log("[spinTo] xPos:"+xPos+", x:"+x);
    
    //if (x == xPos) return; //We want an transform to start in any case so we can catch the end of it
    
    var xPosNorm = normalizeX(xPos);
    var xNorm = normalizeX(Math.round(x));
    console.log("  xPosNorm:"+xPosNorm+", xNorm:"+xNorm);

    var cwDist, ccwDist;
    if (xPosNorm > xNorm) {
	cwDist = xMax - xPosNorm + xNorm;
	ccwDist = xPosNorm - xNorm;
    }
    else {
	cwDist = xNorm - xPosNorm;
	ccwDist = xMax + xPosNorm - xNorm;
    }

    if (cwDist < ccwDist) {
	xPos += cwDist;
    }
    else {
	xPos -= ccwDist;
    }
    console.log("  cw:"+cwDist+", ccw:"+ccwDist+", xPos:"+xPos);
    console.log("  deg:"+xPos*360/xMax);

    var gridElem = document.getElementById("grid");

    gridElem.style.webkitTransform = "rotateY("+(-xPos*360/xMax)+"deg)";
    if (whenDone && (whenDone instanceof Function)) {
	postAnimationFn = whenDone;
    }
}

function handleKeyDown(event) 
{
    var code = getKeyCode(event);
    
    switch (code) {
    case 17: //ctrl
	ctrlPressed = true;
	pressed = false;
	dragging = false;
	var flagButtonElem = document.getElementById("flag");
	addClassName(flagButtonElem, "flagChoice");
	if (currCoords && cellsToShow && isHidden(currCoords.x,currCoords.y)) {
	    addClassName(grid[currCoords.y][currCoords.x].cell, "flagChoice");
	}
	break;
    case 37: //left
	spinTo(xPos+1);
	break;
    case 39: //right
	spinTo(xPos-1);
	break;
    case 33: //page up
	spinTo(xPos+xMax/2);
	break;
    case 34: //page down
	spinTo(xPos-xMax/2-1);
	break;
    }
    return false;
}

function handleKeyUp(event) 
{
    var code = getKeyCode(event);
    
    switch (code) {
    case 17: //ctrl
	ctrlPressed = false;
	var flagButtonElem = document.getElementById("flag");
	removeClassName(flagButtonElem, "flagChoice");
	if (currCoords && cellsToShow && isHidden(currCoords.x,currCoords.y)) {
	    removeClassName(grid[currCoords.y][currCoords.x].cell, "flagChoice");
	}
	break;
    }
    return false;
}


function transitionEnd(event) 
{
    console.log("transition end");
    if (postAnimationFn) {
	postAnimationFn();
	postAnimationFn = undefined;
    }
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

function queueShow(x,y) 
{
    var cell = grid[y][x];
    if (cell.shown) return;  // TODO: hack because duplicates are getting in the list somehow!
    cell.shown = true;
    toShowList.push({"x":x, "y":y});
    if (!hasBomb(x, y)) {
	--cellsToShow;
    }
}

function showAll(x,y)
{
    for(var yy=0; yy<yMax; ++yy) {
        for(var xx=0; xx<xMax; ++xx) {
            queueShow(xx, yy);
        }
    }
    doShow(x,y);
}

function setMessage(msg)
{
    var msgElem = document.getElementById('message');
    msgElem.innerText = msg;
}

function explode(x,y)
{
    console.log("explode",x,y);
    var explodeSound = document.getElementById("explode");
    spinTo(x)
    showAll(x,y);
    addClassName(grid[y][x].cell, "exploded");
    setMessage("You lose!");
    explodeSound.play();
}

function dropFlag(x,y) 
{
    if (isHidden(x,y)) {
	grid[y][x].hasFlag = true;
	addClassName(grid[y][x].cell, "hasFlag");
	spinTo(x);
    }
}

function removeFlag(x,y) 
{
    if (isHidden(x,y)) {
	grid[y][x].hasFlag = false;
	removeClassName(grid[y][x].cell, "hasFlag");
    }
}


function enterCell(x,y)
{
    //console.log("entered cell",x,y);
    currCoords = {"x":x, "y":y};
    if (ctrlPressed && isHidden(x,y)) {
	addClassName(grid[y][x].cell, "flagChoice");
    }
}

function leaveCell(x,y)
{
    //console.log("left cell",x,y);
    if (isHidden(x,y)) {
	removeClassName(grid[y][x].cell, "flagChoice");
    }
    currCoords = undefined;
}

function doFloodFill(x,y)
{
    if (!cellsToShow) return;

    if (ctrlPressed) {
	if (hasFlag(x,y)) {
	    removeFlag(x,y);
	} 
	else {
	    dropFlag(x,y);
	}
	return;
    }

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
    if ((grid[y][x].count > 0)) {
        queueShow(x, y);
    }
}


function doShowOnce()
{
    if (!showTimerId) return;

    if (toShowList.length) {
	var coord = toShowList.pop();
	show(coord.x, coord.y);
    }
    else {
	window.clearInterval(showTimerId);
	showTimerId = undefined;
	console.log("cellsToShow",cellsToShow);
    }
}

function doShow(x,y) 
{
    // TODO: pause to play sound for each cell revealed

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

    var coord = toShowList.pop();
    show(coord.x, coord.y);
    showTimerId = window.setInterval("doShowOnce()", showTimerDelay);
}


function win(x,y) 
{
    setMessage("You WIN!");
    for(var yy=0; yy<yMax; ++yy) {
        for(var xx=0; xx<xMax; ++xx) {
	    if (hasBomb(xx,yy)) {
		grid[yy][xx].hasFlag = true;
	    }
        }
    }
    showAll(x, y);
    var successSound = document.getElementById("success");
    successSound.play();
}

function floodFill(startX, startY)
{
    var x = startX;
    var y = startY;

    console.log("floodFill",x,y);
    spinTo(x);
    if (isShown(x,y)) return;
    
    if (grid[y][x].count > 0) {
        queueShow(x, y);
	if (!cellsToShow) {
	    win(x,y);
	}
	else {
	    doShow(x,y);
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
    doShow(startX,startY);
}

function hasBomb(x, y) 
{
    // An empty space surrounded by bombs will have a count of 8.
    //console.log("hasBomb",x,y,grid[y][x].count);
    return (grid[y][x].count > 8);
}

function hasFlag(x, y) 
{
    return (grid[y][x].hasFlag);
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
        placeBomb(xBomb, yBomb);
        --bombsToCreate;
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

    grid[y][x].shown = true;

    var cell = grid[y][x].cell;
    if (hasBomb(x,y)) {
	if (hasFlag(x,y)) {
	    addClassName(cell, "flagChoice");
	}
	removeClassName(cell, "hasFlag");
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
    var gridHalfHeight = Math.round(cellHeight * yMax / 2);
    //gridHalfHeight = 50;

    var gridElem = document.getElementById("grid");
    for (var i = gridElem.childNodes.length-1; i>=0; --i) {
        gridElem.removeChild(gridElem.childNodes[i]);
    }

    for (var y = 0; y < yMax; ++y) {
        grid[y] = [];
	for (var x = 0; x < xMax; ++x) {
	    var xRot = Math.round(x*cellRot);
	    var cell = document.createElement('div');
            grid[y][x] = {"cell": cell, "count": 0, "shown": false, "hasFlag": false};
	    addClassName(cell, "plane");
	    addClassName(cell, (x+y)%2 ? "hiddenEven" : "hiddenOdd");
	    //cell.innerText = x;
	    cell.style.height = ""+cellHeight+"px";
	    cell.style.width = ""+cellWidth+"px";
	    cell.style.webkitTransform = "rotateY(" +xRot+ "deg) \
                                          translateY("+(cellHeight*y-gridHalfHeight)+"px) \
                                          translateZ("+radius+"px)";
            cell.addEventListener("click", new Function('doFloodFill('+x+', '+y+');'), false);
            cell.addEventListener("mouseover", new Function('enterCell('+x+', '+y+');'), false);
            cell.addEventListener("mouseout", new Function('leaveCell('+x+', '+y+');'), false);
	    gridElem.appendChild(cell);
	}
    }
}


function createGrid(cellHeight)
{
    var gridElem = document.getElementById("grid");
    for (var i = gridElem.childNodes.length-1; i>=0; --i) {
        gridElem.removeChild(gridElem.childNodes[i]);
    }

    for (var y = 0; y < yMax; ++y) {
        grid[y] = [];
        var row = document.createElement("div");
        for (var x = 0; x < xMax; ++x) {
            var cell = document.createElement("div");
            grid[y][x] = {"cell": cell, "count": 0, "shown": false, "hasFlag":false};
	    addClassName(cell, "cell");
	    addClassName(cell, (x+y)%2 ? "hiddenEven" : "hiddenOdd");
            cell.style.width  = cellHeight+'px';
	    cell.style.height = cellHeight+'px';
            cell.addEventListener("click", new Function('doFloodFill('+x+', '+y+');'), false);
            cell.addEventListener("mouseover", new Function('enterCell('+x+', '+y+');'), false);
            cell.addEventListener("mouseout", new Function('leaveCell('+x+', '+y+');'), false);
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
    if (bombsToCreate) {
	placeBombs();
    }

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
    //setMessage("Hint: ("+xHint+"x"+yHint+")");
    if (do3D){
	spinTo(xHint, function() {
	    floodFill(xHint, yHint);
	    grid[yHint][xHint].cell.style.webkitAnimationName = "hintPulse";
	});
    }
    else {
	floodFill(xHint, yHint);
	grid[yHint][xHint].cell.style.webkitAnimationName = "hintPulse";
    }
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
    if (!ctrlPressed && !pressed) {
	var coords = clickCoordsWithinElement(event);
	firstXPos = xPos;
	firstX = lastX = coords.x;
	lastY = coords.y
	lastTime = new Date();
	pressed = true;
	dragging = false;
    }
}


function mouseUp(event) 
{
    if (pressed) {
        pressed = false;
	if (dragging) {
	    if (Math.abs(lastXRate) > 0.05) {
		console.log("flick:" + lastXRate);
		var spinBy = Math.max(xMax-1,lastXRate * 20);
		spinTo(xPos + spinBy);
	    }
	    dragging = false;
	}
	else {
	}
    }
}


function mouseMove(event) 
{
    if (pressed) {
	var coords = clickCoordsWithinElement(event);
	var thisTime = new Date();
        var xDelta = coords.x - lastX;
	var timeDelta = thisTime - lastTime;
	var totalXDelta = coords.x - firstX;

	if (Math.abs(totalXDelta) > 4) {
	    var spinBy = totalXDelta / 30;
	    spinTo(firstXPos - spinBy);
	}

	// fuzzy factor to determine drage versus sloppy click
        if (Math.abs(xDelta) > 4) {  
            dragging = true;
	    lastXRate = xDelta/timeDelta;
	    console.log("dragging: " + lastX,coords.x,xDelta, lastTime, lastXRate);
            lastX = coords.x;
        }
    }
}


function enterFlag(event)
{
    var flagElem = document.getElementById("flag");
    addClassName(flagElem, "flagChoice");
}


function leaveFlag(event)
{
    if (!ctrlPressed) {
	var flagElem = document.getElementById("flag");
	removeClassName(flagElem, "flagChoice");
    }
}


function start2d()
{
    if (showTimerId) showTimerId = undefined;
    do3D = false;
    xMax = 10;
    yMax = 10;
    cellHeight = 50;
    grid = [];
    stackSize = 5000;
    stack = new Array(stackSize);
    stackPointer = 0;
    toShowList = [];

    loadFloodFill(xMax,yMax,bombRatio,cellHeight);

    var gridElem = document.getElementById("grid");
    gridElem.style.webkitTransform = "rotateY(0deg)";
    gridElem.removeEventListener('mousedown', false);
    gridElem.removeEventListener('mousemove', false);
    gridElem.removeEventListener('mouseup', false);
    gridElem.addEventListener('webkitTransitionEnd', transitionEnd, false);

    var body = document.getElementsByTagName("body")[0];
    body.removeEventListener('mousedown', false);
    body.removeEventListener('mousemove', false);
    body.removeEventListener('mouseup', false);
    //body.removeEventListener('mouseout', mouseUp, false);
}


function start3d()
{
    if (showTimerId) showTimerId = undefined;
    do3D = true;
    xMax = 36;
    yMax = 10;
    cellHeight = 40;
    grid = [];
    stackSize = 5000;
    stack = new Array(stackSize);
    stackPointer = 0;
    toShowList = [];

    loadFloodFill(xMax,yMax,bombRatio,cellHeight);

    var gridElem = document.getElementById("grid");
    gridElem.addEventListener('mousedown', mouseDown, false);
    gridElem.addEventListener('mousemove', mouseMove, false);
    gridElem.addEventListener('mouseup', mouseUp, false);
    gridElem.addEventListener('webkitTransitionEnd', transitionEnd, false);

    var body = document.getElementsByTagName("body")[0];
    body.addEventListener('mousedown', mouseDown, false);
    body.addEventListener('mousemove', mouseMove, false);
    body.addEventListener('mouseup', mouseUp, false);
    //body.addEventListener('mouseout', mouseUp, false);
}

var do3D = false;
var bombRatio = 0.125;
var xMax = 10;
var yMax = 10;
var cellHeight = 50;

var grid = [];
var stackSize = 5000;
var stack = new Array(stackSize);
var stackPointer = 0;
var toShowList = [];
var cellsToShow, bombsToCreate;
var xPos = xMax;  // TODO: should be zero, but I'm having trouble with negative degree rotation

var ctrlPressed = false;
var currCoords;
var pressed = false;
var dragging = false;
var postAnimationFn;
var showTimerId;
var showTimerDelay = 10;

var firstX, lastX, lastXDelta, totalXDelta;
var firstXPos, lastTime;


window.onload = function() 
{
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    document.getElementById("reset2d").addEventListener("click", start2d);
    document.getElementById("reset3d").addEventListener("click", start3d);
    document.getElementById("hint").addEventListener("click", doHint);
    var flagElem = document.getElementById("flag");
    flagElem.addEventListener("mouseover", enterFlag);
    flagElem.addEventListener("mouseout", leaveFlag);

    start3d();
};
