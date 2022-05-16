window.onload = function() {
    // Get the canvas and context
    var canvas = document.getElementById("viewport");
    var context = canvas.getContext("2d");
    
    var aisle_freq = 6;
    var dispatch_zone_size = 2;
    var still_block = 0;
    var empty = 1;
    var blocked = 2;
    var moving = 3;
    
    // Level object
    var level = {
        x: 250,         // X position
        y: 113,         // Y position
        columns: 18,     // Number of tile columns
        rows: 10,        // Number of tile rows
        tilewidth: 40,  // Visual width of a tile
        tileheight: 40, // Visual height of a tile
        tiles: [],      // The two-dimensional tile array
        selectedtile: { selected: false, column: 0, row: 0 }
    };
    
    // All of the different tile colors in RGB
    var tilecolors = [[255, 128, 128], // red for still units
                      [0, 0, 0], // black for empty cells
                      [128, 128, 128], // grey for blocked cells
                      [250, 253, 15] // yellow for moving units
                    ];
    
    // counter of renders for movement control
    var timer = 0;
    // number of renders before printing next move
    var endtime = 30;
    // array that contains a queue of next moves to process
    var moves = [];

    var blocked_columns = {
                            "3+2":true, "9+2":true, "15+2":true,
                            "3+5":true, "9+5":true, "15+5":true,
                          }

    

    // unique identifier integer  
    var uuid = 0;
    
    // Initialize the game
    function init() {
        // Add mouse events
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseout", onMouseOut);
        
        // Initialize the two-dimensional tile array
        for (var i=0; i<level.columns; i++) {
            level.tiles[i] = [];
            for (var j=0; j<level.rows; j++) {
                // Define a tile type and a shift parameter for animation
                if(!blocked_columns[i+"+"+j]){
                    if ((i>1 && i%aisle_freq == 0) | (j>= (level.rows-dispatch_zone_size))){
                        level.tiles[i][j] = { type: 1, shift:0, uid:-1 };
                        
                    }else{
                        level.tiles[i][j] = { type: 0, shift:0, uid:uuid };
                        uuid += 1;
                    }
                }
                else{
                    level.tiles[i][j] = { type: 2, shift:0, uid:-1 };
                }
            }
        }
        
        // Enter main loop
        main(0);
    }
    
    // Main loop
    function main(tframe) {
        // Request animation frames
        window.requestAnimationFrame(main);
        
        // Update and render the game
        render();
    }
    
    // Render the game
    function render() {
        // Draw the frame
        drawFrame();

        
        // Draw level background
        var levelwidth = level.columns * level.tilewidth;
        var levelheight = level.rows * level.tileheight;
        context.fillStyle = "#000000";
        context.fillRect(level.x - 4, level.y - 4, levelwidth + 8, levelheight + 8);
        
        // Render tiles
        renderTiles();
    }
    
    // Draw a frame with a border
    function drawFrame() {
        // Draw background and a border
        context.fillStyle = "#d0d0d0";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#e8eaec";
        context.fillRect(1, 1, canvas.width-2, canvas.height-2);
        
        // Draw header
        context.fillStyle = "#303030";
        context.fillRect(0, 0, canvas.width, 65);
        
        // Draw title
        context.fillStyle = "#ffffff";
        context.font = "24px Verdana";
        context.fillText("DIY Unit mockup v0.4", 10, 30);

    }
    
    
    // Render tiles
    function renderTiles() {
        for (var i=0; i<level.columns; i++) {

            for (var j=0; j<(level.rows); j++) {
                // Get the shift of the tile for animation
                var shift = level.tiles[i][j].shift;
                
                // Calculate the tile coordinates
                var coord = getTileCoordinate(i, j, 0, 0);
                
                // Check if there is a tile present
                if (level.tiles[i][j].type >= 0) {
                    // Get the color of the tile
                    var col = tilecolors[level.tiles[i][j].type];
                    
                    // Draw the tile using the color
                    drawTile(coord.tilex, coord.tiley, col[0], col[1], col[2]);
                }
                
                // Draw the selected tile
                if (level.selectedtile.selected) {
                    if (level.selectedtile.column == i && level.selectedtile.row == j) {
                        // Draw a red tile
                        // drawTile(coord.tilex, coord.tiley, 255, 0, 0);
                    }
                }
            }
        }

        // after endtime iterations draw the next movement if available
        if (moves.length>0 & timer>=endtime){
            timer=0
            swap(...moves.shift())
        }else{
            if (timer < endtime){
                timer +=1;
            }
        }
    }
    
    // Get the tile coordinate
    function getTileCoordinate(column, row, columnoffset, rowoffset) {
        var tilex = level.x + (column + columnoffset) * level.tilewidth;
        var tiley = level.y + (row + rowoffset) * level.tileheight;
        return { tilex: tilex, tiley: tiley};
    }
    
    // Draw a tile with a color
    function drawTile(x, y, r, g, b) {
        context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        context.fillRect(x + 2, y + 2, level.tilewidth - 4, level.tileheight - 4);
    }
    
    function getMouseTile(pos) {
        // Calculate the index of the tile
        var tx = Math.floor((pos.x - level.x) / level.tilewidth);
        var ty = Math.floor((pos.y - level.y) / level.tileheight);
        
        // Check if the tile is valid
        if (tx >= 0 && tx < level.columns && ty >= 0 && ty < level.rows) {
            // Tile is valid
            return {
                valid: true,
                x: tx,
                y: ty
            };
        }
        
        // No valid tile
        return {
            valid: false,
            x: 0,
            y: 0
        };
    }


    // On mouse movement
    function onMouseMove(e) {}
    
    // On mouse button click
    function onMouseDown(e) {
        if (moves.length>1){
            return;
        }
        // Get the mouse position
        var pos = getMousePos(canvas, e);
        // alert(pos)
        // Get the tile under the mouse
        mt = getMouseTile(pos);
        if (mt.valid) {
            // Valid tile
            var swapped = false;
            if (level.selectedtile.selected) {
                if (mt.x == level.selectedtile.column && mt.y == level.selectedtile.row) {
                    // Same tile selected, deselect
                    level.selectedtile.selected = false;
                    return;
                }
            }
            
            if (!swapped) {
                // Set the new selected tile
                level.selectedtile.column = mt.x;
                level.selectedtile.row = mt.y;
                level.selectedtile.selected = true;

                if (level.tiles[mt.x][mt.y].type==still_block || level.tiles[mt.x][mt.y].type==moving){
                    if (mt.y == (level.rows-1)){
                        // The unit does not move anymore
                        changeColor(mt.x,mt.y, still_block)
                        returnUnit(mt.x,mt.y)
                    }else{
                        if (isDeliveryEmpty()){
                            // the tile changes color
                            changeColor(mt.x,mt.y, moving)
                            // the tile moves forward
                            moveRow(mt.x,mt.y)
                        }else{
                            alert("No empty delivery slots")
                        }
                    }
                }
            }
        } else {
            // Invalid tile
            level.selectedtile.selected = false;
        }
    }
    
    function onMouseUp(e) {}
    
    function onMouseOut(e) {}
    
    // Get the mouse position
    function getMousePos(canvas, e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left)/(rect.right - rect.left)*canvas.width),
            y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top)*canvas.height)
        };
    }
    


    function moveRow(x,y){
        var rotateupdown = 1;
        
        // if the row is just above the dispatch zone, the rotation is
        // upwards instead of the default downwards rotation
        if (y == level.rows-dispatch_zone_size-1){
            rotateupdown=-1;
        }


        // if the unit is before the first aisle it moves right 
        if (x < aisle_freq){
            return moveRowRight(x,y, rotateupdown);
        }
        // if the unit is in the last positions it moves left
        if (x > (Math.floor((level.columns-1)/aisle_freq)*aisle_freq)){
            return moveRowLeft(x,y,rotateupdown);
        }
        // in any other case the unit just moves to the closest aisle
        if ((x%aisle_freq) <= (aisle_freq/2)){
            return moveRowLeft(x,y,rotateupdown);
        }else{
            return moveRowRight(x,y,rotateupdown);
        }
    }


    function moveRowRight(x, y, up_or_down){
        var distance_to_aisle = getClosestAisle(x)-x

        // if the row is empty or the unit is next to the aisle then it directly moves
        if(distance_to_aisle< 2 | isEmptyRow(x+1, x+distance_to_aisle+1, y)){
            moveRight(x,y,x+distance_to_aisle)
            sendToDelivery(x+distance_to_aisle, y)
            return;
        }
        // assumption: there are no columns in consecutive rows and at least 2 rows between columns
        if(checkBlock(x, y, x+distance_to_aisle, 1)){
            if (up_or_down>0){
                moveToLowerRowRight(x, y, distance_to_aisle)
            }else{
                moveToUpperRowRight(x, y, distance_to_aisle)
            }
            
            rightMovementLogic(x+1, y+up_or_down, up_or_down, distance_to_aisle-1)
        }else{
            rightMovementLogic(x, y, up_or_down, distance_to_aisle)
        }

    }

    function moveToUpperRowRight(x, y, distance_to_aisle){
        // leave an empty space in the upper row
        pushR(x, y-1, x+distance_to_aisle)

        // fill the space with our unit
        pushUp(x,y,y-1)

        // leave an empty space in the aisle
        pushUp(x+distance_to_aisle,y-1,y-2)


        // leave a spot to reorder units
        pushR(x, y-1, x+distance_to_aisle)

        // move first unit to fill the original gap
        pushDown(x, y-2, y-1)
        pushDown(x, y-1, y)

        // fill the gap letting the upper aisle empty
        pushL(x+distance_to_aisle, y-2, x)

        // refill the upper aisle
        pushUp(x+distance_to_aisle,y-1,y-2)

        // refill lower row
        pushDown(x, y-2, y-1)

        // leave aisle empty
        pushL(x+distance_to_aisle, y-2, x)

    }

    function moveToLowerRowRight(x, y, distance_to_aisle){
        // leave an empty space in the lower row
        pushR(x, y+1, x+distance_to_aisle)

        // fill the space with our unit
        pushDown(x,y,y+1)

        // leave an empty space in the aisle
        pushDown(x+distance_to_aisle,y+1,y+2)


        // leave a spot to reorder units
        pushR(x, y+1, x+distance_to_aisle)

        // move first unit to fill the original gap
        pushUp(x, y+2, y+1)
        pushUp(x, y+1, y)

        // fill the gap letting the upper aisle empty
        pushL(x+distance_to_aisle, y+2, x)

        // refill the lower aisle
        pushDown(x+distance_to_aisle,y+1,y+2)

        // refill upper row
        pushUp(x, y+2, y+1)

        // leave aisle empty
        pushL(x+distance_to_aisle, y+2, x)

    }



    function rightMovementLogic(x, y, up_or_down, distance_to_aisle){ 

        var x_to_aisle = distance_to_aisle
        var posx = x;
    
        // while the desired unit is not neighbour to an aisle
        while(posx < (x+x_to_aisle-1)){

            // move row to the right
            for (i = posx+distance_to_aisle-1; i>= posx; i--){
                moves.push([i, i+1, y, y]);
            }
            // move unit in aisle to the next row
            moves.push([posx+distance_to_aisle, posx+distance_to_aisle, y, y+up_or_down]);
            
            // move unit to replace unit in upper/lower row
            moves.push([posx,posx,y+up_or_down,y])

            // move row to the left
            for (i=posx; i<(posx+distance_to_aisle); i++){
                moves.push([i+1, i,y+up_or_down,y+up_or_down])
            }
            posx += 1;
            distance_to_aisle -= 1;
        }
        // put the desired unit in the aisle
        moves.push([posx+distance_to_aisle-1, posx+distance_to_aisle,y, y]);
        sendToDelivery(posx+distance_to_aisle,y)
    }

    function moveRowLeft(x, y, up_or_down){
        var distance_to_aisle = 0
        if (x < aisle_freq){
            distance_to_aisle = aisle_freq - x;
        }else{
            distance_to_aisle = x%aisle_freq;
            distance_to_aisle = -distance_to_aisle
        }

        if(distance_to_aisle> -2 | isEmptyRow(x+distance_to_aisle, x, y)){
            moveLeft(x,y,x+distance_to_aisle)
            sendToDelivery(x+distance_to_aisle, y)
            return;
        }

        if(checkBlock(x, y, x+distance_to_aisle, -1)){
            if (up_or_down>0){
                moveToLowerRowLeft(x, y, distance_to_aisle)
            }else{
                moveToUpperRowLeft(x, y, distance_to_aisle)
            }
            
            leftMovementLogic(x-1, y+up_or_down, up_or_down, distance_to_aisle+1)
        }else{
            leftMovementLogic(x, y, up_or_down, distance_to_aisle)
        }

    }

    function moveToUpperRowLeft(x, y, distance_to_aisle){
        // leave an empty space in the upper row
        pushL(x, y-1, x+distance_to_aisle)

        // fill the space with our unit
        pushUp(x,y,y-1)

        // leave an empty space in the aisle
        pushUp(x+distance_to_aisle,y-1,y-2)


        // leave a spot to reorder units
        pushL(x, y-1, x+distance_to_aisle)

        // move first unit to fill the original gap
        pushDown(x, y-2, y-1)
        pushDown(x, y-1, y)

        // fill the gap letting the upper aisle empty
        pushR(x+distance_to_aisle, y-2, x)

        // refill the upper aisle
        pushUp(x+distance_to_aisle,y-1,y-2)

        // refill lower row
        pushDown(x, y-2, y-1)

        // leave aisle empty
        pushR(x+distance_to_aisle, y-2, x)

    }

    function moveToLowerRowLeft(x, y, distance_to_aisle){
        // leave an empty space in the lower row
        pushL(x, y+1, x+distance_to_aisle)

        // fill the space with our unit
        pushDown(x,y,y+1)

        // leave an empty space in the aisle
        pushDown(x+distance_to_aisle,y+1,y+2)


        // leave a spot to reorder units
        pushL(x, y+1, x+distance_to_aisle)

        // move first unit to fill the original gap
        pushUp(x, y+2, y+1)
        pushUp(x, y+1, y)

        // fill the gap letting the upper aisle empty
        pushR(x+distance_to_aisle, y+2, x)

        // refill the lower aisle
        pushDown(x+distance_to_aisle,y+1,y+2)

        // refill upper row
        pushUp(x, y+2, y+1)

        // leave aisle empty
        pushR(x+distance_to_aisle, y+2, x)

    }


    function leftMovementLogic(x, y, up_or_down, distance_to_aisle){
        var posx = x;
        var x_to_aisle = distance_to_aisle

        // while the desired unit is not neighbour to an aisle
        while(posx > (x+x_to_aisle+1)){

            // move row to the left
            for (i=x+distance_to_aisle+1; i<= posx; i++){
                moves.push([i, i-1, y, y]);
            }

            // move unit in aisle to the next row
            moves.push([x+x_to_aisle, x+x_to_aisle, y, y+up_or_down]);
            
            // move unit to replace unit in upper/lower row
            moves.push([posx,posx,y+up_or_down,y])

            // move row to the right
            for (i = posx; i> x+x_to_aisle; i--){
                moves.push([i-1, i, y+up_or_down, y+up_or_down])
            }
            posx -= 1;
            distance_to_aisle -= 1;
        }
        // put the desired unit in the aisle
        moves.push([posx, posx-1, y, y]);
        sendToDelivery(posx-1, y)
    }


    function swap(xa, xb, ya, yb){
        if (level.tiles[xb][yb].type==empty){
            var oriunit = level.tiles[xa][ya];
            level.tiles[xa][ya] = level.tiles[xb][yb];
            level.tiles[xb][yb] = oriunit;

        }else{
            console.log("trying to move to not empty position "+ xb + "," + yb + "")
        }
    }




    function returnUnit(x,y){
        var destination = getEmptyPos();
        if (destination[0]==-1){
            alert("no empty slot found")
            return;
        }

        x_aisle = getClosestAisle(destination[0]);

        // we extract the unit from the delivery point
        moves.push([x,x,y,y-1])

        if(x_aisle<x){
            // the unit has to move to the left
            for (i=x;i>x_aisle;i--){
                moves.push([i, i-1, y-1, y-1])
            }
        }else{
            // the unit has to move to the right
            for (i=x;i<x_aisle;i++){
                moves.push([i, i+1, y-1, y-1])
            }
        }
        
        // the unit moves up the aisle
        for(i=y-1;i>destination[1];i--){
            moves.push([x_aisle,x_aisle,i,i-1])
        }

        if(destination[0]<x_aisle){
            // the unit has to move to the left
            for (i=x_aisle;i>destination[0];i--){
                moves.push([i, i-1, destination[1], destination[1]])
            }
        }else{
            // the unit has to move to the right
            for (i=x_aisle;i<destination[0];i++){
                moves.push([i, i+1, destination[1], destination[1]])
            }
        }


    }

    function isDeliveryEmpty(){
        for (j = 0; j<level.columns;j++){
            if(level.tiles[j][level.rows-1].type==empty){
                return true;
            }
        }
        return false;
    }

    function getDeliveryPos(){
        for (j = 0; j<level.columns;j++){
            if(level.tiles[j][level.rows-1].type==empty){
                return [j, level.rows-1];
            }
        }
        return [-1, -1];
    }

    // reminder check later when rows 18 mistake inside
    function getClosestAisle(x){

        // if the unit is before the first aisle it moves right 
        if (x < aisle_freq){
            return aisle_freq;
        }
        // if the unit is in the last positions it moves left
        if (x > (Math.floor(level.columns/aisle_freq)*aisle_freq)){
            return Math.floor(level.columns/aisle_freq)*aisle_freq;
        }
        // in any other case the unit just moves to the closest aisle
        if ((x%aisle_freq) <= (aisle_freq/2)){
            return Math.floor(x/aisle_freq)*aisle_freq;
        }else{
            return Math.ceil(x/aisle_freq)*aisle_freq;
        }
    }

    function getEmptyPos(){
        for (var i=0; i<level.columns; i++) {
            for (var j=0; j<level.rows; j++) {
                // if the position is not aisle or dispatch zone
                if (!(i>1 && i%aisle_freq == 0) & !(j>= (level.rows-dispatch_zone_size))){
                    // The position must be empty
                    if (level.tiles[i][j].type == 1){
                        console.log("se manda la posicion: ["+i+","+j+"]")
                        console.log("se devuelve la posicion: ["+JSON.stringify(getBestChoice(i,j))+"]")
                        return getBestChoice(i,j)
                    }
                    
                }
            }
        }
        return [-1, -1]
    }

    function getBestChoice(x,y){
        var x_aisle = getClosestAisle(x);
        var aisle_reach = aisle_freq
        if (x_aisle < x){
            if((x_aisle/aisle_freq) != Math.floor((level.columns-1)/aisle_freq)){
                aisle_reach = Math.ceil(aisle_reach/2)
            }

            for(i=x_aisle+aisle_reach-1; i>x; i--){
                console.log("i:"+i+" __ j:"+j)
                if(level.tiles[i][y].type==empty){
                    return [i,y]
                }
            }
        }
        return [x,y];
    }

    function sendToDelivery(x,y){
        var destination = getDeliveryPos();
        if (destination[0]==-1){
            return;
        }

        // the tile moves down the aisle
        for(i=y;i<level.rows-dispatch_zone_size;i++){
            moves.push([x,x,i,i+1])
        }

        if(destination[0]<x){
            // the tile has to move to the left
            for (i=x;i>destination[0];i--){
                moves.push([i, i-1, level.rows-dispatch_zone_size, level.rows-dispatch_zone_size])
            }
            // the tile moves down to the delivery position
            moves.push([destination[0],destination[0], level.rows-dispatch_zone_size, destination[1]])
        }else{
            // the tile has to move to the right
            for (i=x;i<destination[0];i++){
                moves.push([i, i+1, level.rows-dispatch_zone_size, level.rows-dispatch_zone_size])
            }
            // the tile moves down to the delivery position
            moves.push([destination[0],destination[0], level.rows-dispatch_zone_size, destination[1]])
        }
    }

    function changeColor(x,y, col){
        level.tiles[x][y].type = col;
    }

    // push all units of a row one position to the right
    function pushR(x, y, end){
        for(i=end; i>x; i--){
            moves.push([i-1, i, y, y]);
        }
    }

    // push all units of a row one position to the left
    function pushL(x, y, end){
        for(i=end; i<x; i++){
            moves.push([i+1, i, y, y]);
        }
    }

    function fill_upper_lower(x, y, upper_lower){
        moves.push(x, x, y, y+upper_lower);
    }

    function pushUp(x, y, end){
        for(i=end; i<y; i++){
            moves.push([x, x, i+1, i])
        }
    }

    function pushDown(x, y, end){
        for(i=end; i>y; i--){
            moves.push([x, x, i-1, i])
        }
    }

    function moveRight(x, y, end){
        for(i=x; end>i; i++){
            moves.push([i, i+1, y, y])
        }
    }

    function moveLeft(x, y, end){
        for(i=x; i>end; i--){
            moves.push([i, i-1, y, y])
        }
    }

    function isEmptyRow(xmin, xmax, y){
        for(i=xmin; i<xmax; i++){
            if(level.tiles[i][y].type != 1){
                return false;
            }
        }
        return true;
    }

    function checkBlock(x, y, aisle, movement_direction){
        var current_pos = x;
        while(current_pos!= aisle){
            if (level.tiles[current_pos][y].type==blocked){
                return true;
            }
            current_pos += movement_direction;
        }
        return false;
    }

    // Call init to start the simulation
    init();
};