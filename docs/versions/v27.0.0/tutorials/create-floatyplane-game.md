---
title: Creating A 2D Game
---

> **Notice** This tutorial is written for Expo v22.

### Goal
In this tutorial we want to show you how easy it is to create a 2D cross-platform mobile game with React Native, Expo, and Three.js. We'll be recreating a version of the popular (and addictive) game Flappy Bird!

**Because this game uses Three.js you will only be able to run it on a physical device! No Simulators** 😐

Demo: https://snack.expo.io/@community/flappy-bird

${<SnackEmbed snackId="@community/flappy-bird" />}

### Prerequisites
* NodeJS 6+ (LTS)
* Git
* Expo XDE + iOS/Android App

### Getting Started
The starter code sets up the basics of creating an Expo app with [Three.js](https://threejs.org). It also has some a psuedo-lib called GameKit which emulates some of the core features from [phaser.js](https://phaser.io/).
To get started open this snack: https://snack.expo.io/@community/flappy-bird-starter

You should see a beautiful blank canvas!

### Three.js Basics
Three is a Javascript library that makes it easy to create WebGL 3D graphics. There are three things needed to display graphics:

1. Camera: Points at what you see on your screen
2. Scene: A collection of meshes (elements in the game)
3. Renderer: Updates the scene with movement

You can add meshes (objects e.g. a ball) to the scene. Meshes comprise of a `geometry` (shape + size) and `texture` (e.g. color or image).

## Assets

Before we get started we should import all of our assets into `Files.js`.
This will help us preload our sprites and audio.

```js
export default {
  sprites: {
    bg: require('./assets/sprites/bg.png'),
    bird: require('./assets/sprites/bird.png'),
    ground: require('./assets/sprites/ground.png'),
    pipe_bottom: require('./assets/sprites/pipe_bottom.png'),
    pipe_top: require('./assets/sprites/pipe_top.png'),
  },
  audio: {
    hit: require('./assets/audio/hit.mp3'),
    point: require('./assets/audio/point.mp3'),
    wing: require('./assets/audio/wing.mp3'),
  },
};
```

### Preloading

We want to load all of our assets before we start the game.
All of the code necessary to do this is already included in the 2D Game template as it is commonly used across projects.

## Building our game


The first thing we want to do in our game is define some global constant settings that can be edited to manipulate the look and feel of the experience.
A good place for this would be right outside the `Game` class

```js
const SPEED = 1.6;
const GRAVITY = 1100;
const FLAP = 320;
const SPAWN_RATE = 2600;
const OPENING = 120;
const GROUND_HEIGHT = 64;

export default class Game extends React.Component {
    ...
}
```
1. **SPEED:** Speed of the pipes and ground
2. **GRAVITY:** The force with which the player falls at
3. **FLAP:** Upward velocity that is applied to the player on tap
4. **SPAWN_RATE:** Time in milliseconds between each pipe spawn
5. **OPENING:** Space between two pipes
6. **GROUND_HEIGHT:** Amount of ground that we will see at the bottom of the screen

Feel free to play with these values to create a unique experience!

---

Now that we have some of the laborious stuff out of the way, let's add something to our scene!

The first thing we should add is an awesome background!
The background should be a static sprite that fills in the entire screen.
To do this, open `Game.js` in the root directory, add a function called `setupBackground`, then call this function in the `onSetup` function.

```js
onSetup = async ({ scene }) => {
  // Give us global reference to the scene
  this.scene = scene;
  await this.setupBackground();
};

setupBackground = async () => {
  // We will be doing some async stuff in here :}
};
```

---

Because we will be building a lot of static nodes we should create a helper function for that.

> **Tip** Sprites are used for images and animations. We use nodes for positioning and managing state.


```js
setupStaticNode = async ({ image, size, name }) => {
  // 1
  const sprite = new Sprite();

  await sprite.setup({
    image,
    size,
  });

  // 2
  const node = new Node({
    sprite,
  });
  node.name = name;

  return node;
};
```

1. Create a new `Sprite` from our GameKit and give it a image, and a size.
2. Now we create a `Node` with our `Sprite` and we give it a name for reference!

Now that we have our shnazzy new helper function we can start doing the fun stuff!
Go into your `setupBackground` function and add the following code:

```js
setupBackground = async () => {
  // 1
  const { scene } = this;
  const { size } = scene;
  // 2
  const bg = await this.setupStaticNode({
    image: Files.sprites.bg,
    size,
    name: 'bg',
  });
  // 3
  scene.add(bg);
};
```
1. Pull in a reference to the scene and get the scene's size
2. Call our helper function `setupStaticNode` and pass it our background image, the size of the scene, and a cool name for referencing!
3. Finally add the background node to our scene

---

Now when you run the snack you should see this dope background!

![](./flappy_00.jpg)

So the app is a little boring now, no drama or tension.
We should add a player to the game to spice things up!

```js
onSetup = async ({ scene }) => {
    ...
    await this.setupPlayer();
}


setupPlayer = async () => {
    // 1
    const size = {
        width: 36,
        height: 26
    };

    // 2
    const sprite = new Sprite();
    await sprite.setup({
        image: Files.sprites.bird,
        tilesHoriz: 3,
        tilesVert: 1,
        numTiles: 3,
        tileDispDuration: 75,
        size
    });

    // 3
    this.player = new Node({
        sprite
    });
    this.scene.add(this.player);
};
```

1. Lets create the players display size. If you look at our player sprite in `assets/sprites/bird.png` you will notice that there are three birds on it! When we make an animation in a video game we load in a sprite sheet, which is an optimal image containing all of the frames of an animation. Our display size is the image size but the width is divided by the number of birds, so  108 / 3 = 36 :)
2. Make a `Sprite` just like before but this time we will add a few more properties for animating.
* tilesHoriz: (Tiles Horizontal) is how many tiles we have across (in our case 3).
* tilesVert: (Tiles Vertical) is how many tiles we have... vertically ;) (in our case 1).
* numTiles: The number of tiles in total
* tilesDispDuration: How long each tile is on screen for before it goes to the next one, this is measured in milliseconds.
* size: this is the size we defined earlier.
3. Finally make a `Node`, give it our animated `Sprite`, and add it to the scene!

If we were to run the app right now we would see the bird in the middle of the screen.
But Wait! It's not animating, this is because we need to update it each frame.
To do this we need to add some code to our `updateGame` function.

```js
gameStarted = false;

updateGame = delta => {
  if (this.gameStarted) {
    // We will do stuff here later :)
  } else {
    this.player.update(delta);
    this.player.y = 8 * Math.cos(Date.now() / 200);
    this.player.angle = 0;
  }
};
```

Now we should see the bird flapping and bobbing!
Congrats on making an animated sprite BTW :} 🤓💙

![](./flappy_01.gif)


### Pipes

Right now our bird lives in a perfect bird world. So lets go ahead and change that right away.
Nothing upsets birds more than pipes, so we'll add non-stop pipes!

Add some code to your project:
```js
pipes = new Group();
deadPipeTops = [];
deadPipeBottoms = [];

setupPipe = async ({ key, y }) => {
}
spawnPipe = async (openPos, flipped) => {
}
spawnPipes = () => {
}

//Add the pipes node to the scene
onSetup = async ({ scene }) => {
    this.scene = scene;
    this.scene.add(this.pipes);
    ...
}
```
* **pipes:**  This is a group of nodes that will be the parent to all of the pipe nodes
* **deadPipeTops/deadPipeBottoms:**  These will hold all of the pipes that have moved off screen. We save reference to these so we can recycle them and save memory :)
*  **setupPipe:** This function will determine if we should build a pipe or if we have one that we can recycle
*  **spawnPipes:** This function will choose the random position for the pipes and spawn them right off screen

---
Now that we've added the scaffold for our pipe logic we should implement the `spawnPipes` function

```js
spawnPipes = () => {
  this.pipes.forEachAlive(pipe => {
    // 1
    if (pipe.size && pipe.x + pipe.size.width < this.scene.bounds.left) {
      if (pipe.name === 'top') {
        this.deadPipeTops.push(pipe.kill());
      }
      if (pipe.name === 'bottom') {
        this.deadPipeBottoms.push(pipe.kill());
      }
    }
  });

  // 2
  const pipeY =
    this.scene.size.height / 2 +
    (Math.random() - 0.5) * this.scene.size.height * 0.2;
  // 3
  this.spawnPipe(pipeY);
  this.spawnPipe(pipeY, true);
};
```
1. If any pipes are off screen then we want to flag them as "dead" so we can recycle them!
2. Get a random spot for the center of the two pipes.
3. Spawn both pipes around this point.

Great! Now we need our `spawnPipe` method to spawn the top and bottom of the pipe collection.

```js
spawnPipe = async (openPos, flipped) => {
  // 1
  let pipeY;
  if (flipped) {
    pipeY = Math.floor(openPos - OPENING / 2 - 320);
  } else {
    pipeY = Math.floor(openPos + OPENING / 2);
  }
  // 2
  let pipeKey = flipped ? 'bottom' : 'top';
  let pipe;

  // 3
  const end = this.scene.bounds.right + 26;
  // 4
  if (this.deadPipeTops.length > 0 && pipeKey === 'top') {
    pipe = this.deadPipeTops.pop().revive();
    pipe.reset(end, pipeY);
  } else if (this.deadPipeBottoms.length > 0 && pipeKey === 'bottom') {
    pipe = this.deadPipeBottoms.pop().revive();
    pipe.reset(end, pipeY);
  } else {
    // 5
    pipe = await this.setupPipe({
      y: pipeY,
      key: pipeKey,
    });
    pipe.x = end;
    this.pipes.add(pipe);
  }
  // Set the pipes velocity so it knows how fast to go
  pipe.velocity = -SPEED;
  return pipe;
};
```
1. First we want to get a random position for our pipes
2. Next we define if it's a top or bottom pipe
3. Here we set the initial x position for the pipe - this is just offscreen to the right
4. Now we check if there are any offscreen pipes that we can just reposition
5. If there aren't any pipes to recycle then we will create some and add them to the pipes group

OK the last part of spawning the pipes is building the static `Node`; you should be pretty good at this by now!

```js
setupPipe = async ({ key, y }) => {
  const size = {
    width: 52,
    height: 320,
  };

  // 1
  const tbs = {
    top: Files.sprites.pipe_top,
    bottom: Files.sprites.pipe_bottom,
  };
  const pipe = await this.setupStaticNode({
    image: tbs[key],
    size,
    name: key,
  });
  // 2
  pipe.size = size;
  pipe.y = y;

  return pipe;
};
```

1. Define a dictionary for our images
2. Give the pipe a reference to it's size

---
Now our pipes can spawn in!! 😻
The only thing we need now is a timer to spawn them every so often.

```js
tap = () => {
    // 1
    if (!this.gameStarted) {
        this.gameStarted = true;
        // 2
        this.pillarInterval = setInterval(this.spawnPipes, SPAWN_RATE);
    }
}

render() {
    // 3
    return (
        <View style={StyleSheet.absoluteFill}>
            <SpriteView
            touchDown={({ x, y }) => this.tap()}
            update={this.updateGame}
            onSetup={this.onSetup}
            />
        </View>
    );
}
```
1. On the first tap we start the game
2. Here we build a timer to spawn the pipes
3. Call our `tap` function from the `SpriteView`

---
Every few seconds (`SPAWN_RATE`) the pipes will spawn!
However if you run the app you still won't see the pipes on screen 😱😭
This is because we aren't moving them yet!
Let's move them all to the left and when they move past the player we should increment the score!

```js
addScore = () => {

}
gameOver = false;
updateGame = delta => {
    ...
    if (this.gameStarted) {

        if (!this.gameOver) {
        // 1
            this.pipes.forEachAlive(pipe => {
                pipe.x += pipe.velocity;

                // 2
                if (
                    pipe.name === "bottom" &&
                    !pipe.passed &&
                    pipe.x < this.player.x
                    ) {
                    pipe.passed = true;
                    this.addScore();
                }
            });
        }
    }
    ...
}
```

1. Here we iterate over all of the active pipes and move them to the left.
2. We check to see if a user has passed a pipe, if so then we update the score!

---

YAY! 😛 Now we have pipes working! Our game is starting to come together pretty nicely.
Now we need someway to control the bird and flap it right into a pipe!! 🙃

![](./flappy_02.gif)

### Physics

Let's go back into our `tap` function and add the rest of our tapping logic
```js
reset = () => {
}
velocity = 0;
tap = () => {
    ...
    if (!this.gameOver) {
        // 1
        this.velocity = FLAP;
    } else {
        // 2
        this.reset();
    }
}
```
1. If the game hasn't ended yet then we should set our players velocity to a constant velocity we defined earlier
2. If the game has ended then we should reset it

---

Now we have a way to make the bird go up, all we need now is some gravity! ⬇️

```
updateGame = delta => {
    ...
    if (this.gameStarted) {
        // 1
        this.velocity -= GRAVITY * delta;
        if (!this.gameOver) {
            ...
        }
        // 2
        this.player.angle = Math.min(
            Math.PI / 4,
            Math.max(-Math.PI / 2, (FLAP + this.velocity) / FLAP)
        );
        // 3
        this.player.update(delta);
        // 4
        this.player.y += this.velocity * delta;
        ...
    }
}
```
1. If the game has started then we want to add gravity * delta to our velocity
2. Here we set the birds rotation (in radians). Notice how we clamp it with min/max. This way when the bird has upwards velocity it spins to point up, and the opposite happens when it's falling down
3. Let's add another instance of updating the bird's flapping animation when we are playing the game
4. Apply velocity to our bird's position

And that's all we need to give our user a way to control the bird, pretty easy! 😁

![](./flappy_03.gif)

### Collisions

Right now our bird doesn't have much conflict in it's life. It just flaps away with no consequences, that is until now of course!
We need a way to end the game when our bird hits a pipe or get's tired and falls on the ground we haven't built ;)

First let's build that ground so we have something to fall onto.

```js
onSetup = async ({ scene }) => {
    ...
    await this.setupBackground();
    // 1
    await this.setupGround();
    await this.setupPlayer();
};
setupGround = async () => {
    const { scene } = this;
    const size = {
        width: scene.size.width,
        height: scene.size.width * 0.333333333
    };
    this.groundNode = new Group();

    // 2
    const node = await this.setupStaticNode({
        image: Files.sprites.ground,
        size,
        name: "ground"
    });

    const nodeB = await this.setupStaticNode({
        image: Files.sprites.ground,
        size,
        name: "ground"
    });
    nodeB.x = size.width;

    this.groundNode.add(node);
    this.groundNode.add(nodeB);

    // 3
    this.groundNode.position.y =
    (scene.size.height + (size.height - GROUND_HEIGHT)) * -0.5;

    // 4
    this.groundNode.top = this.groundNode.position.y + size.height / 2;

    this.groundNode.position.z = 0.01;
    scene.add(this.groundNode);
};
```

1. Add this function before we add the pipes to the scene.
2. Notice that we build two copies of the ground. Once one floor goes off screen we place it to the back and that creates our floor loop!
3. Set the groundNode group's position to be at the bottom of the scene
4. Save a reference to the top of the ground for collision purposes. Then move the ground slightly forward on the z-axis so that it appears in front of the pipes.

---
Ok so now we have a ground showing up but it doesn't move with the player 😵😨
Because the ground moves infinitely we need a function that not only moves the ground but also checks if it's off-screen so that it can reset it.

```js
updateGame = delta => {
    ...
    // 1
    // Add this at the end of the updateGame function
    if (!this.gameOver) {
        this.groundNode.children.map((node, index) => {
            // 2
            node.x -= SPEED;
            // 3
            if (node.x < this.scene.size.width * -1) {
                let nextIndex = index + 1;
                if (nextIndex === this.groundNode.children.length) {
                    nextIndex = 0;
                }
                const nextNode = this.groundNode.children[nextIndex];
                // 4
                node.x = nextNode.x + this.scene.size.width - 1.55;
            }
        });
    }
};
```
1. Only move the floor while the player is alive.
2. Move the floor at the same speed as the rest of the world
3. If the child ground node is off screen then get the next child ground node on the screen.
4. Get the position of the last node and move the current node behind it.

![](./flappy_04.gif)

---
Alright, play time is over for this bird.
We need the world to be at least 80% more hostile to make it a fun game! 😵
To do this we will add a basic box check against all of the pipes and our bird.
```js
setGameOver = () => {

}

updateGame = delta => {
    if (this.gameStarted) {
        ...
        const target = this.groundNode.top;
        if (!this.gameOver) {
        // 1
        const playerBox = new THREE.Box3().setFromObject(this.player);

        this.pipes.forEachAlive(pipe => {
            ...
            // 2
            const pipeBox = new THREE.Box3().setFromObject(pipe);

            // 3
            if (pipeBox.intersectsBox(playerBox)) {
                this.setGameOver();
            }
            ...
        });

        ...

        // 4
        if (this.player.y <= target) {
            this.setGameOver();
        }
        ...
        }

        // 5
        if (this.player.y <= target) {
            this.player.angle = -Math.PI / 2;
            this.player.y = target;
            this.velocity = 0;
        } else {
        ...
        }
    } else {
    ...
    }
};

```
> **Tip**
> Box collisions only work if both elements are on the same z-position

1. Get the collision box for our bird
2. Define the collision box for a pipe
3. We check if the user collided with any of the pipes. If so then we end the game
4. Check to see if the user's y position is lower than the floor, if so then we end the game.
5. If the game is over than let the player continue to fall until they hit the floor.

![](./flappy_05.gif)

### Game Over

Alrighty so let's recap: we have a player, we have obstacles for them to overcome, now we need to handle when they inevitable fail!! 😈

```js
setGameOver = () => {
    // 1
    this.gameOver = true;
    clearInterval(this.pillarInterval);
};

// 2
reset = () => {
this.gameStarted = false;
this.gameOver = false;
this.setState({ score: 0 });

this.player.reset(this.scene.size.width * -0.3, 0);
this.player.angle = 0;
this.pipes.removeAll();
};
onSetup = async ({ scene }) => {
    ...
    // 3
    this.reset();
};
```

1. Toggle the `gameOver` flag to true, then stop the pipes from continuing to spawn
2. This method has all of the necessary resets to revert the game to the initial state.
* We set the flags to false
* Set the score to 0
* Reset the player position / angle
* Remove all of the pipe nodes
3. We call reset after we finish setting up the scene, this allows us to keep a consistent state.


### Keeping Score
```js
// Don't forget to import the Text component!
import {Text} from 'react-native';

// 1
state = {
    score: 0
};

// 2
addScore = () => {
    this.setState({ score: this.state.score + 1 });
};

// 3
renderScore = () => (
    <Text
        style={{
            textAlign: "center",
            fontSize: 64,
            position: "absolute",
            left: 0,
            right: 0,
            color: "white",
            top: 64,
            backgroundColor: "transparent"
        }}>
    {this.state.score}
    </Text>
);

render() {
    // 4
    return (
        <View style={StyleSheet.absoluteFill}>
            <SpriteView
            touchDown={({ x, y }) => this.tap()}
            touchMoved={({ x, y }) => {}}
            touchUp={({ x, y }) => {}}
            update={this.updateGame}
            onSetup={this.onSetup}
            />
            {this.renderScore()}
        </View>
    );
}

```
1. define the components state and give it a property `score` then assign `score` to `0`
2. Let's build a helpful function to increment the score by 1 whenever it's called
3. Here we will define what the score label will look like. We use a native Text component to do this! 🤤
4. Now we will add our score component to the main render method 😬

![](./flappy_06.gif)

### Loading Sounds

Nothing makes a game for more real than good sound effects.
Lucky for us everyone at Expo is a huge audiophile and as a result of this we have a dope audio API
Let's add sounds whenever a key moment occurs:
* Getting a point 😎
* Flapping 🤔
* Dying 😅

```js
// 1
componentWillMount() {
    this.setupAudio();
}

setupAudio = async () => {
    // 2
    Expo.Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: Expo.Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Expo.Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
    });


    // 3
    this.audio = {};
    Object.keys(Files.audio).map(async key => {
        const res = Files.audio[key];
        const { sound } = await Expo.Audio.Sound.create(res);
        await sound.setStatusAsync({
            volume: 1
        });
        this.audio[key] = async () => {
            // 4
            try {
                await sound.setPositionAsync(0);
                await sound.playAsync();
            } catch (error) {
                console.warn("sound error", { error });
                // An error occurred!
            }
        };
    });
};
```

1. Because loading audio isn't dependent on a GL View, we can load it asap 😮
2. Here we define how audio is used in our app.
3. Now we parse the preloaded audio assets and create a helper object for playing sounds.
4. This function will restart the sound and play it for us


### Playing Sounds!

Inside of our `tap` function, let's play our first sound! 🎉
Every time the user taps the screen while the game is going, they should hear a flapping noise! 🐦

```js
tap = () => {
    ...

    if (!this.gameOver) {
        ...
        this.audio.wing();
    } else {
        ...
    }
}
```
Let's play a nice dinging noise whenever we score a point 🔔
```js
addScore = () => {
    ...
    this.audio.point();
};
```
Finally when the player inevitably fails we will play the almighty slapping noise! 👏
```js
setGameOver = () => {
    ...
    this.audio.hit();
};
```


### Congratulations!

You made Flappy Bird!!
You should go call your parents and tell them about your new accomplishment! 🔥😁💙

Using Expo, React Native, and Three makes it really easy (and extremely fun) to write production ready mobile games!
The final project can be found here: https://snack.expo.io/@community/flappy-bird

Thanks for reading! 😍
