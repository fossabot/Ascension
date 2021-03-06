// lazuli is the player!
var lazuli;

function startGame() {
    lazuli = new component(data[0].start[0]); // for now, get the first starting point
//    document.body.style.backgroundImage = "url('spiral.jpg')";
    // add the title to the game
    var title = document.createElement("h1");
    title.textContent = "Ascension";
    title.style.textAlign = "center";
    document.body.appendChild(title);

    gameArea.start();
    displayFilters([]);
}

function displayFilters(array)
{
	var filters = ["", "Grayscale", "Rotate 90", "Rotate 180", "Rotate 270", "Swirl", "Adjust brightness", "Adjust contrast", "Centered vignette", "Following vignette"];
    var tbl  = document.getElementById("table");
    if (tbl === null)
    {
    	tbl = document.createElement("table");
    	tbl.setAttribute("id", "table");
    	document.body.appendChild(tbl);
    }
    tbl.innerHTML = "";
    tbl.style.width  = '100px';
    tbl.style.border = '1px solid black';
    tbl.style.position = 'relative';
    tbl.style.marginLeft = 'auto';
    tbl.style.marginRight = 'auto';
    tbl.style.font = '1vw Gloria Hallelujah, cursive, Garamond';
    tbl.style.textAlign = "center";
    tbl.style.color = "white";
    tbl.style.outline =  "medium solid #000000";
    tbl.style.backgroundColor = "rgba(0,0,0,0.5)";
    tbl.style.tableLayout = 'auto';

    // title of the table
	var tr = tbl.insertRow();
	var td = tr.insertCell();
	td.appendChild(document.createTextNode('Active Filters:'));
	td.style.border = '1px solid white';
    td.style.padding = '0vw 1vw';
    td.style.width = '100%';
    td.style.whiteSpace = 'nowrap';

    // when empty length
    if (array.length === 0) {
        var td = tr.insertCell();
        td.style.border = '1px solid white';
        td.style.width = '100%';
        td.style.whiteSpace = 'nowrap';
        td.style.padding = '0vw 1vw';
        td.appendChild(document.createTextNode("None"));
    }
    // when there are filters
	for(var j = 0; j < array.length; j++){
		var td = tr.insertCell();
		td.style.border = '1px solid white';
        td.style.width = '100%';
        td.style.whiteSpace = 'nowrap';
        td.style.padding = '0vw 1vw';
        td.appendChild(document.createTextNode(filters[array[j]]));
	}	
}

var gameArea = {
    // make a canvas for the gaming area
    canvas : document.createElement("canvas"),

    // a list of colors for accessing
    colors : {
        "start": "green",
        "inactive": "blue",
        "exit": "brown",
        "walls": "#ffd27f",
        "guards": "red",
        "deaths": "black",
	"lights": "yellow",
	"vents": "purple"
    },

    // define where the exit is
    exit: [],

    // define how big the exit is
    exitSize: 50,

    // a list of guards
    guards: [],
    
    // a list of death locations
    deaths: [],
    
    // a list of cooldowns: 0 -> blink, 1 -> stun
    cooldowns: [0, 0],

    // where the light switch is
    lights: [],

    // how large the light switch is:
    lightSize: 25,

    // vents
    vents: [],

    // keep track of what level we are on, start off level 0
    level: 0,

    // decide which convolution to apply
    convList: [],

    gameSpeed: 2,

    // start off and draw for every 10 milliseconds
    start : function() {
        var dataDef = data[0];
        // the exit of the starting map, 0
        this.exit = dataDef.exit[0];

        // list of the guards of the starting map, 0
        for (var i = 0; i < dataDef.guards.length; i++) {
            var patrol = [];
            var patrolPosList = dataDef.guards[i];
            for (var j = 0; j < patrolPosList.length; j++) {
                patrol.push(new THREE.Vector2(patrolPosList[j][0], patrolPosList[j][1]));
            }
            var guard = new Guard(patrol, 2, 100, 1, Math.PI/2, 100);
            this.guards.push(guard);
        }

        this.canvas.width = 640;
        this.canvas.height = 640;
        this.ctx = this.canvas.getContext("2d");
        document.body.append(this.canvas);
        this.interval = setInterval(updateGameArea, 10);

        // add event listeners for pressing the keys — can press multiple keys
        window.addEventListener('keydown', function (e) {
            gameArea.keys = (gameArea.keys || []);
            gameArea.keys[e.keyCode] = (e.type == "keydown");
        })
        window.addEventListener('keyup', function (e) {
            gameArea.keys[e.keyCode] = (e.type == "keydown");            
        })
    },

    // a clear function to reset
    clear: function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// make a component 
function component(coordinates) {
    this.x = coordinates[0];
    this.y = coordinates[1];
    this.radius = 10;
    this.speed = 5;

    // update the drawing of the player
    this.update = function() {
        ctx = gameArea.ctx;
        if (gameArea.cooldowns[0] <= 0) ctx.fillStyle = gameArea.colors.start;
        else ctx.fillStyle = gameArea.colors.inactive;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.closePath();
        ctx.fill();
    }
}

// draw all the necessary environment
function drawEnvironment() {
    /*=====================Draw the walls======================*/
    var walls = data[gameArea.level].walls;
    var ctx = gameArea.ctx;

    // draw a white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, gameArea.canvas.width, gameArea.canvas.height);

    ctx.beginPath();
    for (var i = 0; i < walls.length; i++) {
        // get the walls corresponding to one block (array of points)
        var oneWall = walls[i];

        ctx.moveTo(oneWall[0][0], oneWall[0][1]);
        for (var j = 1; j < oneWall.length; j++) {
            ctx.lineTo(oneWall[j][0], oneWall[j][1]);
        }
    }
    ctx.closePath();
    // fill in the walls
    ctx.fillStyle = gameArea.colors.walls;
    ctx.fill();
    
    // draw deaths
    for (var i = 0; i < gameArea.deaths.length; i++)
    {
    	var deathSize = 5;
    	var death = gameArea.deaths[i];
    	ctx = gameArea.ctx;
    	ctx.lineWidth = 2;
        ctx.strokeStyle = gameArea.colors.deaths;
        ctx.beginPath();
        ctx.moveTo(death.x + deathSize, death.y + deathSize);
        ctx.lineTo(death.x - deathSize, death.y - deathSize);
        ctx.closePath();
        ctx.stroke();
        
    	ctx.beginPath();
        ctx.moveTo(death.x - deathSize, death.y + deathSize);
        ctx.lineTo(death.x + deathSize, death.y - deathSize);
        ctx.closePath();
        ctx.stroke();
	}

    /*=====================Draw the exit======================*/
    ctx.fillStyle = gameArea.colors.exit;
    ctx.fillRect(gameArea.exit[0], gameArea.exit[1], gameArea.exitSize, gameArea.exitSize);
	
    // draw the light switch if necessary:
    if(gameArea.lights && gameArea.lights.length > 0)
    {
	ctx.fillStyle = gameArea.colors.lights;
    	ctx.fillRect(gameArea.lights[0], gameArea.lights[1], gameArea.lightSize, gameArea.lightSize);
    }

    // draw the vents
    for (var i = 0; i < gameArea.vents.length; i++)
    {
	var vent = gameArea.vents[i];
	ctx.lineWidth = 4;
	ctx.strokeStyle = gameArea.colors.vents;
	ctx.beginPath();
	ctx.moveTo(vent[0][0], vent[0][1]);
	ctx.lineTo(vent[1][0], vent[1][1]);
	ctx.closePath();
	ctx.stroke();
    }
}

// makes all the canvas texts on title page
function makeTitlePage() {
    var ctx = gameArea.ctx;
    var canvas = gameArea.canvas;
    
    // make a gradient for the title
    var gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'red');
    gradient.addColorStop(0.35, 'red');
    gradient.addColorStop(0.65, 'yellow');
    gradient.addColorStop(0.7, 'red');
    gradient.addColorStop(1, 'yellow');
    ctx.font = "2.8vw Gloria Hallelujah, cursive, Garamond";
    ctx.fillStyle = gradient;
    ctx.textAlign = "center";
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 2;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText("Ascension", canvas.width/2, 80);

    // write in the start
    ctx.font = "1.2vw Gloria Hallelujah, cursive, Garamond";
    ctx.fillText("<<< Move Here to Start!", 280, 350);

    // keyboards
    ctx.fillStyle = "#aaa";
    ctx.fillRect(100, 470, 50, 50);
    ctx.fillRect(40, 530, 50, 50);
    ctx.fillRect(100, 530, 50, 50);
    ctx.fillRect(160, 530, 50, 50);
    ctx.fillStyle = "black";
    ctx.fillText("W", 125, 500);
    ctx.fillText("A", 65, 560);
    ctx.fillText("S", 125, 560);
    ctx.fillText("D", 185, 560);

    // write in the guard warning
    ctx.fillStyle = gradient;
    ctx.font = "1.2vw Gloria Hallelujah, cursive, Garamond";
    ctx.fillText("Avoid Guards", 450, 430);
}

// makes all the canvas texts for credits
function makeCreditsPage() {
    var ctx = gameArea.ctx;
    var canvas = gameArea.canvas;
    
    // make a gradient for the title
    var gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'red');
    gradient.addColorStop(0.35, 'red');
    gradient.addColorStop(0.65, 'yellow');
    gradient.addColorStop(0.7, 'red');
    gradient.addColorStop(1, 'yellow');
    ctx.font = "2.8vw Gloria Hallelujah, cursive, Garamond";
    ctx.fillStyle = gradient;
    ctx.textAlign = "center";
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 2;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';

    ctx.fillText("Congratulations!", canvas.width/2, 80);

    // write in all other text
    ctx.font = "1.2vw Gloria Hallelujah, cursive, Garamond";
    ctx.fillText("You have successfully ascended all levels of insanity!", canvas.width/2, 140);
    ctx.fillText("Created By", canvas.width/2, 240);
    ctx.fillText("Daniel Chae, Annie Chen, & Tom Colen", canvas.width/2, 270);
    ctx.fillText("Special thanks to Professor Finkelstein & COS426 peers!", canvas.width/2, 450);
    ctx.fillText("Return to Home >>>", 420, 600);
}

// write in text for blink page
function makeBlinkPage() {
    var ctx = gameArea.ctx;
    var canvas = gameArea.canvas;
    
    // make a gradient for the title
    var gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'red');
    gradient.addColorStop(0.35, 'red');
    gradient.addColorStop(0.65, 'yellow');
    gradient.addColorStop(0.7, 'red');
    gradient.addColorStop(1, 'yellow');
    ctx.font = "2.8vw Gloria Hallelujah, cursive, Garamond";
    ctx.fillStyle = gradient;
    ctx.textAlign = "center";
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 2;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';

    ctx.fillText("New Ability Unlocked!", canvas.width/2, 80);

    // write in all other text
    ctx.font = "1.2vw Gloria Hallelujah, cursive, Garamond";
    ctx.fillStyle = "green";
    ctx.fillText("You may now <Blink>", 160, 200);
    ctx.fillText("<Blink> teleports to a distance", 160, 240);
    ctx.fillText("Press 'P' while walking to <Blink>", 160, 300);
    ctx.fillText("in that direction.", 160, 325);
    ctx.fillText("Beware of cooldown (available when green)!", 370, 600);
}

// write in text for stun page
function makeStunPage() {
    var ctx = gameArea.ctx;
    var canvas = gameArea.canvas;
    
    // make a gradient for the title
    var gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'red');
    gradient.addColorStop(0.35, 'red');
    gradient.addColorStop(0.65, 'yellow');
    gradient.addColorStop(0.7, 'red');
    gradient.addColorStop(1, 'yellow');
    ctx.font = "2.8vw Gloria Hallelujah, cursive, Garamond";
    ctx.fillStyle = gradient;
    ctx.textAlign = "center";
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 2;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';

    ctx.fillText("New Ability Unlocked!", canvas.width/2, 80);

    // write in all other text
    ctx.font = "1.2vw Gloria Hallelujah, cursive, Garamond";
    ctx.fillStyle = "black";
    ctx.fillText("You may now <Stun>", canvas.width/2, 140);
    ctx.fillText("<Stun> temporarily disables a guard", canvas.width/2, 180);
    ctx.fillText("Press 'O' while near a guard to <Stun> that guard", canvas.width/2, 220);
    ctx.fillText("Beware of cooldown (available when nearest guard orange)!", canvas.width/2, 250);
}

// draw canvas text for light switch level
function makeLightSwitchPage() {
    var ctx = gameArea.ctx;
    var canvas = gameArea.canvas;

    ctx.font = "1.2vw Gloria Hallelujah, cursive, Garamond";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.fillText("Find the light switch!", canvas.width/2, canvas.height/2);
}

// draw canvas text for vent level
function makeVentPage() {
    var ctx = gameArea.ctx;
    var canvas = gameArea.canvas;

    ctx.font = "1.2vw Gloria Hallelujah, cursive, Garamond";
    ctx.fillStyle = "purple";
    ctx.textAlign = "center";
    ctx.fillText("Use the vents to your advantage", canvas.width/2, canvas.height/2);
}

// find the closest guard to the player within the stunRange
function findClosest() {
    var stunRange = 150; // stun range
    var closestDist = stunRange;
    var closestGuard = -1;
    var position = new THREE.Vector2(lazuli.x, lazuli.y);
    // find the closest guard to the player
    for(var i = 0; i < gameArea.guards.length; i++) {
    	var dist = (new THREE.Vector2()).subVectors(position, gameArea.guards[i].location).length();
    	if (dist <= closestDist) {
    		closestDist = dist;
    		closestGuard = i;
    	}
    }
    return closestGuard;
}

// draw all the guards
function drawGuards() {
    var walls = data[gameArea.level].walls;    
    
    // activate stun after level 3
	if (gameArea.level > 3) {
        var closestGuard = findClosest();
    }

    for (var i = 0; i < gameArea.guards.length; i++) {
        gameArea.guards[i].show(gameArea.ctx, walls, i === closestGuard && gameArea.cooldowns[1] <= 0);
        gameArea.guards[i].move();


        if (gameArea.guards[i].caught(new THREE.Vector2(lazuli.x, lazuli.y),  walls)) {
        	gameArea.deaths.push(new THREE.Vector2(lazuli.x, lazuli.y));
            lazuli = new component(data[gameArea.level].start[0]);
        }
    }
}

function inVent(vent)
{
	var p = new THREE.Vector2(vent[0][0], vent[0][1]);
	var q = new THREE.Vector2(vent[1][0], vent[1][1]);
	var r = new THREE.Vector3(lazuli.x, lazuli.y);
	var d = (new THREE.Vector2()).subVectors(q, p);
	var f = (new THREE.Vector2()).subVectors(p, r);

	var rad = 10;

	var a = d.dot(d);
	var b = 2 * f.dot(d);
	var c = f.dot(f) - rad * rad;

	var disc = b * b - 4 * a * c;
	if (disc >= 0)
	{
		disc = Math.sqrt(disc);
	
		var t1 = (-b - disc)/(2*a);
		var t2 = (-b + disc)/(2*a);
		if (t1 >= 0 && t1 <= 1) return true;
		if (t2 >= 0 && t2 <= 1) return true;
	}
	return false;
}

function checkVents()
{
	for(var i = 0; i < gameArea.vents.length; i++)
	{
		var vent = gameArea.vents[i];
		if (inVent(vent))
		{
			lazuli.x = vent[2][0];
			lazuli.y = vent[2][1];
		}
	}
}

// turn on the lights
function turnOnLights()
{
	var x = lazuli.x;
    	var y = lazuli.y;
    	var xBound = gameArea.lights[0];
    	var yBound = gameArea.lights[1];
	if (x >= xBound && x <= xBound+gameArea.exitSize && y >= yBound && y <= yBound+gameArea.exitSize)
	{

		var i = gameArea.convList.indexOf(8);
		if (i > -1)
		{
			gameArea.convList.splice(i, 1);
			for(var j = 0; j < gameArea.guards.length; j++) gameArea.guards[j].slow(gameArea.convList.length);
		}

		var i = gameArea.convList.indexOf(9);
		if (i > -1)
		{
			gameArea.convList.splice(i, 1);
			for(var j = 0; j < gameArea.guards.length; j++) gameArea.guards[j].slow(gameArea.convList.length);
		}

	}
}

// handle when the player reaches the exit
function reachExit() {
    var x = lazuli.x;
    var y = lazuli.y;
    var xBound = gameArea.exit[0];
    var yBound = gameArea.exit[1];

    // if true, we have reached the exit
    if (x >= xBound && x <= xBound+gameArea.exitSize && y >= yBound && y <= yBound+gameArea.exitSize) {
        gameArea.level += 1; // we go onto next level
        if (gameArea.level >= data.length)
            gameArea.level = 0;

        var newData = data[gameArea.level];
        lazuli = new component(newData.start[0]); // player position reset
        gameArea.exit = newData.exit[0]; // reset the exit
	if(newData.switch) gameArea.lights = newData.switch[0]; // reset the lights
	if(newData.vents) gameArea.vents = newData.vents;

        // select a convolution from the list randomly
        var convIndex = parseInt(Math.random()*newData.conv.length, 10);
        gameArea.convList = newData.conv[convIndex];
        displayFilters(gameArea.convList);

        // reset list of guards, based on convList
        gameArea.guards = [];
        for (var i = 0; i < newData.guards.length; i++) {
            var patrol = [];
            var patrolPosList = newData.guards[i];
            for (var j = 0; j < patrolPosList.length; j++) {
                patrol.push(new THREE.Vector2(patrolPosList[j][0], patrolPosList[j][1]));
            }
            gameArea.gameSpeed = 2;
            if (gameArea.convList.length > 0 && gameArea.convList.length > 0) 
                gameArea.gameSpeed = 2 + gameArea.convList.length*2.5 + 0.05*newData.guards.length;
            var guard = new Guard(patrol, gameArea.gameSpeed, 100, 1, Math.PI/2, Math.round(200/gameArea.gameSpeed));
            gameArea.guards.push(guard);
        }
        
        // reset list of deaths
        gameArea.deaths = [];

        gameArea.clear();
        drawEnvironment();
        drawGuards();
    }

}

// blink to a location in the direction of the movement
function blink() {
    var blinkDist = 100;
    var blinkCooldown = 100;
    var x = 0;
    var y = 0;
        
    // get direction
    if (gameArea.keys && gameArea.keys[87]) y -= 1;
    if (gameArea.keys && gameArea.keys[65]) x -= 1;
    if (gameArea.keys && gameArea.keys[83]) y += 1;
    if (gameArea.keys && gameArea.keys[68]) x += 1;
 
    var direction = (new THREE.Vector2(x, y)).normalize();
    gameArea.cooldowns[0] = blinkCooldown;
        
    var numWalls = 0;
    var lastWall = [-1, -1];
    var lastValid = new THREE.Vector2(lazuli.x, lazuli.y);
    for (var i = 1; i < blinkDist+1; i++) {
        var collided = checkWallCollision((new THREE.Vector2(lazuli.x + direction.x * i, lazuli.y + direction.y * i)), gameArea.level);
        if (collided[0] >= 0 && (lastWall[0] != collided[0] || lastWall[1] != collided[1])) {
            lastWall = collided;
            numWalls++;
        }
            
        // can't pass through one wall -- parity check to see if blinkable
        if (numWalls % 2 === 0 && collided < 0) {
            lastValid.x = lazuli.x + direction.x * i;
            lastValid.y = lazuli.y + direction.y * i;
        }
    }
        
    lazuli.x = lastValid.x;
    lazuli.y = lastValid.y;
}

// stun the nearest guard
function stunGuard() {
    var stunDuration = Math.round(250/gameArea.gameSpeed);
    var stunCooldown = 800;
    if (gameArea.keys && gameArea.keys[79] && gameArea.cooldowns[1] <= 0)
    {
        var g = findClosest();
        if (g >= 0)
        {
            gameArea.guards[g].stun(stunDuration);
            gameArea.cooldowns[1] = stunCooldown;
        }
    }
}

// update everything necessary
function updateGameArea(coordinates) {
    gameArea.clear();
    drawEnvironment();
    drawGuards();
    // draw in the title page if on title page
    if (gameArea.level === 0) {
        makeTitlePage();
    }
    // draw in the help page for stunning, unlocks after 3rd official map
    else if (gameArea.level === 4) {
        makeStunPage();
    }
    // tell player to find the light switch!
    else if (gameArea.level === 5) {
        makeLightSwitchPage();
    }
    // draw in the help page for blinking, unlocks after 5th official map
    else if (gameArea.level === 7) {
        makeBlinkPage();
    }
    // draw in help page for vents!
    else if (gameArea.level === 10) {
        makeVentPage();
    }
    // draw in the credits page if on last map
    else if (gameArea.level === data.length-1) {
        makeCreditsPage();
    }

	// blink feature //
    if (gameArea.keys && gameArea.keys[80] && gameArea.cooldowns[0] <= 0 && gameArea.level >= 7) {
    	blink();
    }
    else
    {
		// if key is pressed, update the position of the player
		if (gameArea.keys && gameArea.keys[87]) {if (checkWallCollision((new THREE.Vector2(lazuli.x, lazuli.y - lazuli.speed)), gameArea.level) === -1) {lazuli.y -= lazuli.speed}};
		if (gameArea.keys && gameArea.keys[65]) {if (checkWallCollision((new THREE.Vector2(lazuli.x - lazuli.speed, lazuli.y)), gameArea.level) === -1) {lazuli.x -= lazuli.speed}};
		if (gameArea.keys && gameArea.keys[83]) {if (checkWallCollision((new THREE.Vector2(lazuli.x, lazuli.y + lazuli.speed)), gameArea.level) === -1) {lazuli.y += lazuli.speed}};
		if (gameArea.keys && gameArea.keys[68]) {if (checkWallCollision((new THREE.Vector2(lazuli.x + lazuli.speed, lazuli.y)), gameArea.level) === -1) {lazuli.x += lazuli.speed}};
    }

    // check to see if we are in a vent
    checkVents();
    
    // lower cooldowns by 1 time
    for (var i = 0; i < gameArea.cooldowns.length; i++)
    {
    	var decrease = lazuli.speed / 2;
    	gameArea.cooldowns[i] -= decrease; 
    }

    // stun a guard only after level 3 (introduction to it starts map 4)
    if (gameArea.level > 3)
        stunGuard();

    // update the physical location of lazuli
    lazuli.update();

    // change the speed based on the map
    lazuli.speed = 2;
    if (gameArea.convList.length > 0 && gameArea.convList.length > 0) 
        lazuli.speed = 2 + gameArea.convList.length*2.5 + 0.05*data[gameArea.level].guards.length;

    // apply convolution(s) to the canvas map
    imageData = gameArea.ctx.getImageData(0, 0, gameArea.canvas.width, gameArea.canvas.height);
    imageData2 = gameArea.ctx.getImageData(0, 0, gameArea.canvas.width, gameArea.canvas.height);
    var newImage = applyConvolutions(imageData, gameArea.convList, imageData2, lazuli);
    gameArea.ctx.putImageData(newImage, 0, 0);

    reachExit(); // check if player is at the exit
    if (gameArea.lights && gameArea.lights.length > 0) turnOnLights(); // check if player is on light switch
}