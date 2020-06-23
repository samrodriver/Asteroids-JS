const FPS = 30; //frames per second
const SHIP_SIZE = 30; //ship height in pixels
const SHIP_THRUST = 5; //Acceleration pixels/second
const SHIP_EXPLODE_DUR = 0.3; //Duration of the ship´s explosion
const SHIP_INV_DUR = 3; //Duration of ship's invisibility
const SHIP_BLINK_DUR = 0.1 //Duration of ship´s blink during invisibility
const TURN_SPEED = 360; //Turn speed n degrees per second 
const FRICTION = 0.7; //Friction coefficient of space
const ASTEROID_NUM = 3; //Starting number of asteroids
const ASTEROID_SIZE = 100; //starting size of asteroids in pixels
const ASTEROID_SPEED = 50; //max speed of asteroids pix/sec
const ASTEROID_VERT = 10; //average number of vertice in asteroid
const ASTEROID_JAG = 0.3; // jaggedness of our asteroids.
const ASTEROID_PTS_LARGE = 20; //Points given for a large asteroid
const ASTEROID_PTS_MED = 50; //Points given for a medium asteroid
const ASTEROID_PTS_SMALL = 100; //Points given for a small asteroid
const SHOW_BOUNDING = false; // show or hide collision bounding
const LASER_MAX = 10; //Maximum number of laser on screen
const LASER_SPEED = 500; //Speed of laser in pixels per second
const LASER_DIST = 0.4; //Max distance laser can travel, fraction of screen width
const LASER_EXPLODE_DUR = 0.1; //Duration of the laser explosion
const TEXT_FADE_TIME = 2.5; //Text fade time in seconds
const TEXT_SIZE = 40; //text font size in pixels
const GAME_LIVES = 3; //Starting number of lives
const SAFE_KEY_SCORE = "highscore"; // Save key for local storage
const SOUND_ON = false; // Enable sound only when in the same window
const MUSIC_ON = false; 


      var canva = document.getElementById("asteroidsCanvas");
      var ctx = canva.getContext("2d");

      //set up sound effects
      var fxLaser = new Sound("sounds/laser.m4a",5,0.5);
      var fxThrust = new Sound("sounds/thrust.m4a");
      var fxExplode = new Sound("sounds/explode.m4a");
      var fxHit = new Sound("sounds/hit.m4a",5, 0.5);

      //set up the music
      var music = new Music("sounds/music-low.m4a", "sounds/music-high.m4a");
      var roidsLeft, roidsTotal;


      //set up the game parameters
      var level, lives, asteroid, score, scoreHigh, ship, text, textAlpha;
      newGame();

      //set up event handlers
      document.addEventListener("keydown", keyDown);
      document.addEventListener("keyup", keyUp);

      //set up the game loop
      setInterval(update, 1000 / FPS);

     
     
      function createAsteroidBelt()
      {
        asteroid = [];
        roidsTotal = (ASTEROID_NUM + level) * 7;
        roidsLeft = roidsTotal
        var x,y;
        for(var i = 0; i<ASTEROID_NUM + level; i++)
        {
          do{
          x = Math.floor(Math.random() * canva.width);
          y = Math.floor(Math.random()* canva.height);
          }while(distanceBetweenPoints(ship.x, ship.y, x, y) < ASTEROID_SIZE *2 + ship.radius);
          asteroid.push(newAsteroid(x,y, Math.ceil(ASTEROID_SIZE/2)));
        }
      }

      function destroyAsteroid(index)
      {
        var x = asteroid[index].x;
        var y = asteroid[index].y;
        var r = asteroid[index].r;

        //split the asteroid if necessary
        if(r == Math.ceil(ASTEROID_SIZE/2))
        {
          asteroid.push(newAsteroid(x,y,Math.ceil(ASTEROID_SIZE/4)));
          asteroid.push(newAsteroid(x,y,Math.ceil(ASTEROID_SIZE/4)));
          score += ASTEROID_PTS_LARGE;
        }else if (r == Math.ceil(ASTEROID_SIZE/4))
        {
          asteroid.push(newAsteroid(x,y,Math.ceil(ASTEROID_SIZE/8)));
          asteroid.push(newAsteroid(x,y,Math.ceil(ASTEROID_SIZE/8)));
          score += ASTEROID_PTS_MED; 
        }else{
          score += ASTEROID_PTS_SMALL;
        }

        //check high score
        if(score > scoreHigh)
        {
          scoreHigh = score;
          localStorage.setItem(SAFE_KEY_SCORE, scoreHigh);
        }

        //destroy the asteroid
        asteroid.splice(index, 1);
        fxHit.play();

        //calculate ratio of remaining asteroids to determine music tempo
        roidsLeft--;
        music.setAsteroidRatio(roidsLeft == 0 ? 1:roidsLeft/roidsTotal);

        //new level when no asteroids left
        if(asteroid.length == 0)
        {
          level++;
          newLevel();
        }
      }

      function distanceBetweenPoints(x1,y1,x2,y2)
      {
        return Math.sqrt(Math.pow(x2-x1, 2.1)+Math.pow(y2-y1,2));
      }

      function drawShip(x,y,angle, colour = "white")
      {
        ctx.strokeStyle = colour;
        ctx.lineWidth = SHIP_SIZE / 20;
        ctx.beginPath();
        ctx.moveTo(    //nose of the ship
          x + 4/3 * ship.radius * Math.cos(angle),
          y - 4/3 * ship.radius * Math.sin(angle)

        );

        ctx.lineTo( //rear left
          x - ship.radius * (2/3 * Math.cos(angle) + Math.sin(angle)),
          y + ship.radius * (2/3 * Math.sin(angle) - Math.cos(angle))

        );

        ctx.lineTo( //rear right
          x - ship.radius * (2/3 * Math.cos(angle) - Math.sin(angle)),
          y + ship.radius * (2/3 * Math.sin(angle) + Math.cos(angle))

        );

        ctx.closePath();
        ctx.stroke();
      }

      function explodeShip()
      {
        ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
        fxExplode.play();
      }

      function gameOver()
      {
        ship.dead = true;
        text = "GAME OVER";
        textAlpha = 1.0;
      }


      // event functions
      function keyDown(/** @type {KeyboardEvent}*/ ev)
      {
        if(ship.dead == true)
        {
          return;
        }
        switch(ev.keyCode)
        {
          case 32:  //space bar (shoot laser)
          shootLaser();
          break;
          case 37:  //left arrow (rotate ship left)
              ship.rotation = TURN_SPEED /180 * Math.PI / FPS;
          break;
          case 38: // up, thrusts the ship forward
              ship.thrusting = true;
          break;
          case 39:  //right arrow (rotate ship right)
              ship.rotation = -TURN_SPEED /180 * Math.PI / FPS;  
          break;
           case 37:  //left arrow (rotate ship left)
              ship.rotation = TURN_SPEED /180 * Math.PI / FPS;

        }
      }

      function keyUp(/** @type {KeyboardEvent}*/ ev)
      {
        if(ship.dead == true)
        {
          return;
        }
        switch(ev.keyCode)
        {
          case 32:  //space bar (allow shooting again)
          ship.canShoot = true;
          break;
          case 37:  //left arrow (stop rotating left)

              ship.rotation = 0;
          break;
          case 38: // stops the thrust

              ship.thrusting = false;

          break;
          case 39:  //right arrow (stop rotating right)

              ship.rotation = 0;  

          break;

        }
      }

      function newAsteroid(x,y,r)
      {
        var lvlMult = 1+ 0.1 * level;
        var roid = {
          x:x,
          y:y,
          xv: Math.random()*ASTEROID_SPEED * lvlMult /FPS * (Math.random()<0.5 ? 1:-1),
          yv: Math.random()*ASTEROID_SPEED * lvlMult/FPS * (Math.random()<0.5 ? 1:-1),
          r: r,
          a: Math.random()*Math.PI * 2, // in radians
          vertices: Math.floor(Math.random() * (ASTEROID_VERT +1)+ ASTEROID_VERT /2),
          offset:[]
        };

        //create the vertex offset array
        for(var i = 0; i < roid.vertices; i++)
        {
          roid.offset.push(Math.random() * ASTEROID_JAG * 2 + 1-ASTEROID_JAG);
        }

        return roid;
      }

      function newGame()
      {
        level = 0;
        lives = GAME_LIVES;
        ship = newShip();
        score = 0;
        // get the high score from local storage
        var scoreStr = localStorage.getItem(SAFE_KEY_SCORE);
        if(scoreStr == null)
        {
          scoreHigh = 0;
        }else{
          scoreHigh = parseInt(scoreStr);
        }
        newLevel();
      }

      function newLevel()
      {
        text = "Level " + (level+1);
        textAlpha = 1.0; 
        createAsteroidBelt();
      }
    

      function newShip()
      {
        return{
          x: canva.width /2,
          y: canva.height /2,
          radius: SHIP_SIZE /2,
          angle: 90 / 180 * Math.PI, // convert to radians
          blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
          blinkNumber: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
          canShoot: true,
          lasers: [],
          dead: false,
          explodeTime: 0,
          rotation: 0,
          thrusting: false,
          thrustmag: 
          {
            x:0,
            y:0
          }
      }
      }

      function shootLaser()
      {
        //create laser object
        if(ship.canShoot && ship.lasers.length < LASER_MAX)
        {
          ship.lasers.push({//from the nose of the ship
            x: ship.x + 4/3 * ship.radius * Math.cos(ship.angle),
            y: ship.y - 4/3 * ship.radius * Math.sin(ship.angle),
            xv: LASER_SPEED * Math.cos(ship.angle) /FPS,
            yv: -LASER_SPEED * Math.sin(ship.angle)/ FPS,
            dist: 0,
            explodeTime: 0
          });
          fxLaser.play();
        }

        //prevent further shooting
        ship.canShoot = false;
      }

      function Music(srclow, srchigh)
      {
        this.soundLow = new Audio(srclow);
        this.soundHigh = new Audio(srchigh);
        this.low = true;
        this.tempo = 1.0; // seconds per beat
        this.beatTime = 0; //frames left until next beat

        this.play = ()=>
        {
          if(MUSIC_ON)
          {
          if(this.low)
          {
           this.soundLow.play();
          }else{
           this.soundHigh.play();
          }
           this.low = !this.low;
          }
        }

        this.setAsteroidRatio = (ratio)=>
        {
          this.tempo = 1.0 - 0.75 * (1.0 - ratio)
        }

        this.tick = () =>
        {
          if(this.beatTime == 0)
          {
            this.play();
            this.beatTime = Math.ceil(this.tempo * FPS);
          }else{
            this.beatTime--;
          }
        }
      }

      function Sound(src, maxStreams = 1, volume = 1.0)
      {
        this.streamNum = 0;
        this.streams = [];
        for(var i = 0; i < maxStreams; i++)
        {
          this.streams.push(new Audio(src));
          this.streams[i].volume = volume;
        }

        this.play = function()
        {
          if(SOUND_ON)
          {
          this.streamNum = (this.streamNum + 1) % maxStreams;
          this.streams[this.streamNum].play();
          }
        }

        this.stop = () =>{
          this.streams[this.streamNum].pause();
          this.streams[this.streamNum].currentTime = 0;
        }
      }

      function update()
      {
        var blinkOn = ship.blinkNumber %2 ==0;
        var exploding = ship.explodeTime > 0;

        //tick the music
        music.tick();

        //draw space
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0 ,canva.width, canva.height);

        //thrust the ship
        if(ship.thrusting && !ship.dead)
        {
          ship.thrustmag.x += SHIP_THRUST * Math.cos(ship.angle) /FPS;
          ship.thrustmag.y -= SHIP_THRUST * Math.sin(ship.angle) /FPS;
          fxThrust.play();

          //draw the thruster
          if(!exploding && blinkOn){
            ctx.fillStyle = "red";
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = SHIP_SIZE / 10;
            ctx.beginPath();

            ctx.moveTo(    //rear left
              ship.x - ship.radius * (2/3 * Math.cos(ship.angle) + 0.3*Math.sin(ship.angle)),
              ship.y + ship.radius * (2/3 * Math.sin(ship.angle) - 0.3*Math.cos(ship.angle))


            );

            ctx.lineTo( //behind the ship (rear centre)
              ship.x - ship.radius * 6/3 * Math.cos(ship.angle),
              ship.y + ship.radius * 6/3 * Math.sin(ship.angle)

            );

            ctx.lineTo( //rear right
              ship.x - ship.radius * (2/3 * Math.cos(ship.angle) - 0.3*Math.sin(ship.angle)),
              ship.y + ship.radius * (2/3 * Math.sin(ship.angle) + 0.3*Math.cos(ship.angle))

            );

            ctx.closePath();
            ctx.fill();
            ctx.stroke();
           }

        }else{
          ship.thrustmag.x -= FRICTION * ship.thrustmag.x /FPS;
          ship.thrustmag.y -= FRICTION * ship.thrustmag.y /FPS;
          fxThrust.stop();
        }

        //draw ship
        if(!exploding){
          if(blinkOn && !ship.dead){
            drawShip(ship.x, ship.y, ship.angle);
          }

          //handle blinking
          if(ship.blinkNumber > 0)
          {
            //reduce blink time
            ship.blinkTime--;
            
            //reduce blink number
            if(ship.blinkTime == 0)
            {
              ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
              ship.blinkNumber--;
            }
          }
        }else{
          //draw the explosion
          ctx.fillStyle = "darkred";
          ctx.strokeStyle = "darkred";
          ctx.beginPath();
          ctx.arc(ship.x, ship.y, ship.radius * 1.7, 0, Math.PI * 2, false);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "red";
          ctx.strokeStyle = "red";
          ctx.beginPath();
          ctx.arc(ship.x, ship.y, ship.radius * 1.4, 0, Math.PI * 2, false);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "orange";
          ctx.strokeStyle = "orange";
          ctx.beginPath();
          ctx.arc(ship.x, ship.y, ship.radius * 1.1, 0, Math.PI * 2, false);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "yellow";
          ctx.strokeStyle = "yellow";
          ctx.beginPath();
          ctx.arc(ship.x, ship.y, ship.radius * 0.7, 0, Math.PI * 2, false);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "white";
          ctx.strokeStyle = "white";
          ctx.beginPath();
          ctx.arc(ship.x, ship.y, ship.radius * 0.3, 0, Math.PI * 2, false);
          ctx.fill();
          ctx.stroke();
        }

        if(SHOW_BOUNDING)
        {
          ctx.strokeStyle = "lime";
          ctx.beginPath();
          ctx.arc(ship.x, ship.y, ship.radius, 0, Math.PI * 2, false);
          ctx.stroke();
        }

        //draw asteroids
        
        ctx.lineWidth = SHIP_SIZE / 20;
        var x, y, r, a, vet, offset;
        for(var i = 0; i < asteroid.length; i++)
        {
          ctx.strokeStyle = "slategrey";
          //asteroid properties
          x = asteroid[i].x;
          y = asteroid[i].y;
          a = asteroid[i].a;
          r = asteroid[i].r;
          vet = asteroid[i].vertices;
          offset = asteroid[i].offset;

          //draw a path
          ctx.beginPath();
          ctx.moveTo(
            x + r * offset[0] * Math.cos(a),
            y + r * offset[0] * Math.sin(a)
          );

          //draw polygon
          for(var j = 1; j<vet;j++)
          {
            ctx.lineTo(
              x+r * offset[j] * Math.cos(a+j * Math.PI *2 /vet),
              y+r * offset[j] * Math.sin(a+j * Math.PI *2 /vet)

            );
          }
          ctx.closePath();
          ctx.stroke();

          if(SHOW_BOUNDING)
          {
            ctx.strokeStyle = "yellow";
            ctx.beginPath();
            ctx.arc(x, y, asteroid[i].r, 0, Math.PI * 2, false);
            ctx.stroke();
          }

          //move the asteroid
          asteroid[i].x += asteroid[i].xv;
          asteroid[i].y += asteroid[i].yv;

          //handle edge of screen
          if(asteroid[i].x < 0 - asteroid[i].r)
          {
            asteroid[i].x = canva.width + asteroid[i].r;
          }else if(asteroid[i].x > canva.width + asteroid[i].r)
          {
            asteroid[i].x = 0 - asteroid[i].r;
          }

          if(asteroid[i].y < 0 - asteroid[i].r)
          {
            asteroid[i].y = canva.height + asteroid[i].r;
          }else if(asteroid[i].y > canva.height + asteroid[i].r)
          {
            asteroid[i].y = 0 - asteroid[i].r;
          }

        }


        //check for asteroid collisions
        if(!exploding)
        {
          if(ship.blinkNumber == 0 && !ship.dead)
          {
            for(var i = 0; i < asteroid.length; i++)
            {
              if(distanceBetweenPoints(ship.x, ship.y, asteroid[i].x, asteroid[i].y) < ship.radius + asteroid[i].r)
              {
                explodeShip();
                destroyAsteroid(i);
                break;
              }
            }
          }

          //rotate ship
          ship.angle += ship.rotation;


          //move ship
          ship.x += ship.thrustmag.x;
          ship.y += ship.thrustmag.y;
       }else
       {
          ship.explodeTime--;
          //reset the ship after explosion finishes
          if(ship.explodeTime ==0)
          {
            lives--;
            if(lives == 0)
            {
              gameOver();
            }else{
            ship = newShip();
          }
        }
       }

      //handle edge of screen
        if(ship.x < 0 - ship.radius)
        {
            ship.x = canva.width + ship.radius;
          }else if(ship.x >canva.width + ship.radius)
          {
            ship.x = 0 - ship.radius;
          }
          if(ship.y < 0 - ship.radius)
          {
            ship.y = canva.height + ship.radius;
          }else if(ship.y >canva.height + ship.radius)
          {
            ship.y = 0 - ship.radius;
        }       

       //draw the laser
       for(var i = 0; i< ship.lasers.length; i++)
       {
         if(ship.lasers[i].explodeTime == 0)
         {
          ctx.fillStyle = "orange";
          ctx.beginPath();
          ctx.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 15, 0, Math.PI *2, false);
          ctx.fill();
         }else{
           //draw the explosion
          ctx.fillStyle = "orangered";
          ctx.beginPath();
          ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.radius * 0.75, 0, Math.PI *2, false);
          ctx.fill();
          ctx.fillStyle = "salmon";
          ctx.beginPath();
          ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.radius * 0.5, 0, Math.PI *2, false);
          ctx.fill();
          ctx.fillStyle = "pink";
          ctx.beginPath();
          ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.radius * 0.25, 0, Math.PI *2, false);
          ctx.fill();

         }
       }

       //draw the game text
       if(textAlpha >= 0)
       {
         ctx.textAlign = "center";
         ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255, 255, 255, " + textAlpha + ")";
        ctx.font = "small-caps " + TEXT_SIZE + "px dejavu sans mono";
        ctx.fillText(text, canva.width / 2, canva.height * 0.75);
        textAlpha -= (1.0 / TEXT_FADE_TIME / FPS);
       }else if(ship.dead)
       {
         newGame();
       }

       //Draw the lives
       var lifeColour;
       for(var i = 0; i < lives; i++)
       {
         lifeColour = exploding && i == lives-1 ? "red" : "white";
         drawShip(SHIP_SIZE + i*SHIP_SIZE * 1.2, SHIP_SIZE, 0.5 * Math.PI, lifeColour);
       }

       //draw the score
       ctx.textAlign = "right";
       ctx.textBaseline = "middle";
       ctx.fillStyle = "white";
       ctx.font = TEXT_SIZE + "px dejavu sans mono";
       ctx.fillText(score, canva.width - SHIP_SIZE / 2, SHIP_SIZE);

       //draw the highest score
       ctx.textAlign = "center";
       ctx.textBaseline = "middle";
       ctx.fillStyle = "white";
       ctx.font = (TEXT_SIZE * 0.5) + "px dejavu sans mono";
       ctx.fillText("Best Score " + scoreHigh, canva.width / 2, SHIP_SIZE);
       


       //move the lasers
       for(var i = ship.lasers.length-1 ; i >= 0; i--)
       {
        //check distance travelled
        if(ship.lasers[i].dist > LASER_DIST * canva.width)
        {
          ship.lasers.splice(i,1);
          continue;
        }

        //handle the explosion
        if(ship.lasers[i].explodeTime >0)
        {
          ship.lasers[i].explodeTime--;
          //destroy the laser after the duration is up
          if(ship.lasers[i].explodeTime == 0)
          {
            ship.lasers.splice(i,1);
            continue;
          }
        }else{

          //lasers move
          ship.lasers[i].x += ship.lasers[i].xv;
          ship.lasers[i].y += ship.lasers[i].yv;

          //calculate distance travelled
          ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv,2) + Math.pow(ship.lasers[i].yv, 2));
        }

        //handle laser edge of screen
        if(ship.lasers[i].x < 0)
        {
            ship.lasers[i].x = canva.width;
          }else if(ship.lasers[i].x > canva.width)
          {
            ship.lasers[i].x = 0;
          }

          if(ship.lasers[i].y < 0)
          {
            ship.lasers[i].y = canva.height;
          }else if(ship.lasers[i].y > canva.height)
          {
            ship.lasers[i].y = 0;
        }

       }

      //detect if lasers hit the asteroids
      var ax, ay, ar, lx, ly;
      for(var i = asteroid.length -1; i >= 0; i--)
      {
        //asteroid properties
        ax = asteroid[i].x;
        ay = asteroid[i].y;
        ar = asteroid[i].r;

        //loop over the lasers
        for(var j = ship.lasers.length -1; j >= 0; j--)
        {
          lx = ship.lasers[j].x;
          ly = ship.lasers[j].y;

          //detect hit
          if(ship.lasers[j].explodeTime == 0 && distanceBetweenPoints(ax, ay, lx, ly)< ar)
          {

            //remove the asteroid and activate explosion
            destroyAsteroid(i);
            ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS);
            break;
          }
        }
      }

        //centre dot
        if(!ship.dead)
        {
        ctx.fillStyle = "red";
        ctx.fillRect(ship.x - 1, ship.y -1, 2, 2);
      }
    }
