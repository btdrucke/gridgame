var grid    = [];
var stackSize    = 10000;
var stack        = new Array(stackSize);
var stackPointer = 0;
var h            = 50;
var w            = 50;
var newColor     = "red";
var oldColor     = "white";

function pop(x, y){
    if(stackPointer > 0){
	p = stack[stackPointer];
	x = p / h;
	y = p % h;
	stackPointer--;
	return {x:x, y:y};
    }else{
	return 0;
    }
}

function push(x, y){
    if(stackPointer < stackSize - 1){
	stackPointer++;
	stack[stackPointer] = h * x + y;
	return true;
    }  
    else{
	return false;
    }
}

function emptyStack(){
    stack        = [];
    stackPointer = 0;
}

function doFloodFill(x, y){
    if(oldColor == newColor) return;
    emptyStack();

    var y1;
    var spanLeft, spanRight;

    if(!push(x, y)) return;

    while(popped = pop(x, y)) {
	x = parseInt(popped.x);
	y = parseInt(popped.y);
	y1 = y;
	while((y1 >= 0) && (grid[x][y1].color == oldColor)) {
	    y1--;
	}
	y1++;
	spanLeft = spanRight = 0;
	while((y1 < h) && (grid[x][y1].color == oldColor)){
	    fill(x, y1, newColor);
	    
	    if(!spanLeft && x > 0 && grid[x - 1][y1].color == oldColor){
		if(!push(x - 1, y1)) return;
		spanLeft = 1;
	    }else if(spanLeft && x > 0 && grid[x - 1][y1].color != oldColor){
		spanLeft = 0;
	    }

	    if(!spanRight && x < w - 1 && grid[x + 1][y1].color == oldColor){
		if(!push(x + 1, y1)) return;
		spanRight = 1;
	    }else if(spanRight && x < w - 1 && grid[x + 1][y1].color != oldColor){
		spanRight = 0;
	    }
	    y1++;
	}
    }
}

function fill(x, y, color)
{
    grid[x][y].color = newColor;
    grid[x][y].cell.style.backgroundColor = color;
}

function hasBomb(x, y) 
{
    // An empty space surrounded by bombs will have a count of 8.
    return (grid[x][y].count > 8);
}

function xInRange(x)
{
    return (x>=0) && (x < w);
}

function yInRange(y)
{
    return (y>=0) && (y < h);
}


function placeBomb(x, y) 
{
    if (xInRange(x-1)) {
	if (yInRange(y-1)) grid[x-1][y-1].count++;
	if (yInRange(y  )) grid[x-1][y  ].count++;
	if (yInRange(y+1)) grid[x-1][y+1].count++;
    }
    if (xInRange(x)) {
	if (yInRange(y-1)) grid[x][y-1].count++;
	if (yInRange(y  )) grid[x][y  ].count = 9;
	if (yInRange(y+1)) grid[x][y+1].count++;
    }
    if (xInRange(x+1)) {
	if (yInRange(y-1)) grid[x+1][y-1].count++;
	if (yInRange(y  )) grid[x+1][y  ].count++;
	if (yInRange(y+1)) grid[x+1][y+1].count++;
    }
}

function isHidden(x,y)
{
    return grid[x][y].hidden;
}


function unhide(x,y)
{
    if (! isHidden(x,y)) return;

    if (hasBomb(i,j)) {
	cell.style.cssText = "background-image:url('bomb.png');background-position:center;background-repeat:no-repeat;border:1px solid";
    }
    else {
	var count = grid[i][j].count;
	if (count > 0) {
	    cell.innerHTML = count;
	}
	var gb = Math.round(255 * (8-count)/8);
	cell.style.cssText += "background-color:rgb(255,"+gb+","+gb+")";
    }
}


function loadFloodFill(rows, cols, totalBombs, blockSize)
{
    h = rows;
    w = cols;
    var tbl = document.getElementById('cells');
    for(var i = tbl.childNodes.length-1; i>=0; i--) {
	tbl.removeChild(tbl.childNodes[i]);
    }

    for(var i=0; i<rows; i++) {
	grid[i]     = [];
	var tr           = document.createElement('TR');
	tr.style.cssText = 'background-color:#ffffff';
	for(var j=0; j<cols; j++) {
	    var td           = document.createElement('TD');
	    grid[i][j]  = {cell:td, count:0, hidden:true};

	    td.style.cssText = 'width:'+blockSize+'px;height:'+blockSize+'px;text-align:center;border:1px solid"';
	    td.id            = 'cell'+i+'_'+j;
	    td.onclick       = new Function('doFloodFill('+i+', '+j+');');
	    tr.appendChild(td);
	}
	tbl.appendChild(tr);
    }

    var bombsToCreate = Math.max(Math.min(totalBombs, Math.ceil(rows*cols*0.25)), 1);

    while (bombsToCreate) {
	var xBomb = Math.floor(Math.random()*cols);
	var yBomb = Math.floor(Math.random()*rows);
	if (hasBomb(xBomb, yBomb)) {
	    continue;
	}
	else {
	    placeBomb(xBomb, yBomb);
	    --bombsToCreate;
	}
    }

    for(var i=0; i<rows; i++) {
	for(var j=0; j<cols; j++) {
	    var cell  = grid[i][j].cell;
	    
	    if (hasBomb(i,j)) {
		cell.style.cssText = "background-image:url('bomb.jpg');background-position:center;background-repeat:no-repeat;border:1px solid";
	    }
	    else {
		var count = grid[i][j].count;
		if (count > 0) {
		    cell.innerHTML = count;
		}
		var gb = Math.round(255 * (8-count)/8);
		cell.style.cssText += "background-color:rgb(255,"+gb+","+gb+")";
	    }
	}
    }
}

window.loadFloodFill = loadFloodFill;
window.doFloodFill   = doFloodFill;
