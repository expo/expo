---
title: Getting started with Expo + Three.js
---

### Goal
In this tutorial we want to show you how easy it is to create a 2D mobile game with React Native, Expo, and Three.js. We'll be recreating a version of the popular (and addictive) game Flappy Bird called Floaty Plane.

Demo (scan in Expo app): <a href="https://expo.io/@lele0108/floatyplane-gl">https://expo.io/@lele0108/floatyplane-gl</a>

<img src="http://i.imgur.com/F1Xkzu1.png" width="100px">


### Prerequisites
* NodeJS 6+ (LTS)
* Git
* Expo XDE + iOS/Android App

### Starter Code
The starter code sets up the basics of creating a React Native app with Expo and Three.js. It also has some skeletons of our game. Run this in terminal:

```
git clone https://github.com/expo/floatyplane-starter.git
cd floatyplane-starter
npm install
```

Open the Expo XDE and click Project-->Open Project and navigate to the floatyplane-starer folder. Expo will load the project and you will be able to beam the code to your phone using the Expo native app.

**Checkpoint: If you see a solid blue screen on your phone, everything is working!**

<img src="http://i.imgur.com/y8FYDUP.png" width="200px"/>

### Three.js Basics
Three is a Javascript library that makes it easy to create WebGL 3D graphics. There are three things needed to display graphics:

1. Camera: Points at what you see on your screen
2. Scene: A collection of meshes (elements in the game)
3. Renderer: Updates the scene with movement

You can add meshes (objects e.g. a ball) to the scene. Meshes comprise of a `geometry` (shape + size) and `texture` (e.g. color or image).

### Graphics
In order to add the objects (plane and pillars) in our game, we need to create a mesh representation with Three. Remeber that a `mesh` consists of a `geometry` and a `material`.

The file we will be working with is `utilities/scene.js`. Let's start by making functions that will create plane and pillar meshes that we can insert into our scene.

#### Creating Materials
First let's create a function that loads images and turns them into materials. For simplicity, we have already loaded all the images into Expo Assets in `Assets/index.js`.

This code loads a image texture and creates a material from it. We'll put this in `utilities/scene.js`.

```
const loadImageMaterial = (assetName, THREEView) => {
  const texture = THREEView.textureFromAsset(Assets[assetName]);
  texture.minFilter = texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({
	map: texture,
	transparent: true, // Use the image's alpha channel for alpha.
  });
  return material;
}
```

#### Creating Meshes
Now that we have a function that returns materials, we can use that to create a airplane mesh. Remember: `mesh = geometry + material`. We'll put this in `utilities/scene.js`.

```
export const createPlane = (THREEView) => {
  const planeGeo = new THREE.PlaneBufferGeometry(0.75, 0.75);
  const material = loadImageMaterial("player-sprite", THREEView);
  const planeMesh = new THREE.Mesh(planeGeo, material);
  return planeMesh;
}
```
We have similar code to create meshes for pillars and the start screen.

```
export const createPillar = (THREEView) => {
  const geometry = new THREE.PlaneBufferGeometry(1,5);
  const material = loadImageMaterial("pipe-top", THREEView);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = 2.5;
  return mesh;
}
```

```
export const createStart = (THREEView) => {
  const startGeo = new THREE.PlaneBufferGeometry(4, 1.5);
  const material = loadImageMaterial("start-screen", THREEView);
  const startMesh = new THREE.Mesh(startGeo, material);
  startMesh.position.y = 2;
  return startMesh;
}
```

And that's all the meshes we need for our game! Full code of `scene.js` <a href="https://github.com/expo/floatyplane/blob/master/utilities/index.js">here</a> for reference.

Now we're going to write code that adds these meshes to the scene. Let's move our attention to our main file `Game/index.js`. First we'll create a function that will add the plane and start screen graphics to the scene. 

We'll add this to the `createGameScene` function (in `Game/index.js`):

```
this.setState({started: false, scoreCount: 0});
this.animatingIds = []; // we'll use this later to animate pillers
this.velocity = -1; // initial y velocity of the plane
this.planeMesh = Meshes.createPlane(THREEView);
this.startScreen = Meshes.createStart(THREEView);
this.scene.add(this.startScreen); // adds meshes to the scene
this.scene.add(this.planeMesh);
```

**Checkpoint: Now you should see this on your screen.**

<img src="http://i.imgur.com/BIcWSdy.png" width="200px"/>

### Moving The Airplane

Now that we have a airplane in our scene, let's make it move. `tick` is a function we pass to `Three` that is called every frame refresh. We can update our mesh locations here. `dt` is the elapsed time in seconds since the last call to `tick`.

Add the following to `tick` in `Game/index.js`:

```
if (this.state.started) {
  if (this.planeMesh.position.y < (this.height / 2) * -1 || this.planeMesh.position.y > (this.height / 2)) {
    alert("You Lost!"); // if plane hits top or bottom of screen
    this.resetScene(); // resets the scene to the original state
  } else { 
    this.velocity -= 7 * dt; // simulate gravity in plane
    this.planeMesh.translateY(this.velocity*dt); // move plane down
  }
}
``` 
In our `PanResponder` (React's gesture detector), we call `touch` when a tap is detected. Let's make it so we increase the velocity of the plane to a positive number (making the place go up). 

Add the following to `touch` in `Game/index.js`:

```
if (this.state.started) { // Increase velocity to make plane go up
  this.velocity = 4;
} else {
  this.startGame();
}
```

Now let's make it possible to start the game and move the plane!

```
startGame = () => {
  this.setState({started: true});
  this.scene.remove(this.startScreen);
};
```

**Checkpoint: You're game should now be responsive to touch.**

<img src="https://media.giphy.com/media/554szyzCGtZT2/giphy.gif" width="200px"/>

### Creating Pillars and Animations

But wait, where are the pillars? Don't fret, let's add them to the scene.

We want a function that will return two pillars, one on the top and one on the bottom, and add them to the scene. We also want them to be random length.

Let's define `createSetOfPillars` to do this (in `Game/index.js`):

```
createSetOfPillars = () => {
    const pillarTop = Meshes.createPillar(THREEView); // creating meshes from methods we wrote before
    const pillarBottom = Meshes.createPillar(THREEView);
    const rand = 4 - Math.random() * 2;
    pillarTop.position.y = rand;
    pillarBottom.position.y = rand - 7.3;
    pillarTop.name = "top"; // keeping track of which one is top and bottom
    pillarBottom.name = "bottom";
    pillarTop.passed = false; //we will use this later to increment score
    pillarBottom.passed = false;
    this.scene.add(pillarTop); // add the mesh to the scene
    this.scene.add(pillarBottom);
    this.animatingIds.push(pillarTop.id); // save mesh id so we can animate later
    this.animatingIds.push(pillarBottom.id);
};
```

Now that we can create pillars, we also want to move them.

Let's create `animatePillar` in `Game/index.js` that will move the pillar left on the screen. We'll call this later in `tick`. This function will do these things:

* Get pillar mesh object from mesh ID
* Check if plane collides with pillar. If so, stop the game
* Check if pillar is off the screen. If so, destroy that pillar set.
* Move the pillar left

```
animatePillar = (id, dt) => {
    const object = this.scene.getObjectById(id);
    if (!object) {
      return;
    }

    // Checks for collision of pillar and plane
    if (this.intersects(object, this.planeMesh)) {
      alert("You Lost!");
      this.resetScene();
    } else if (object.position.x < -2.5) { // If pillar is off the screen, remove from scene
      this.animatingIds.splice(this.animatingIds.indexOf(id), 1);
      this.scene.remove(object);
    } else { // Move pillar to the left
      object.position.x -= 0.02;
    }
};
```

Remember in flappy bird, new pillars keep on coming. We want to be able to create new pillars every 3 seconds. We'll set an interval that keeps on calling `createSetOfPillars`.

Add to `startGame` (in `Game/index.js`):

```
this.createSetOfPillars();
this.pillarInterval = setInterval(() => {
  this.createSetOfPillars();
}, 3000);
```

Lastly, we want to move all the pillars on the screen a little every frame. Remember we store all the pillar mesh ID's in the array `animatingIds[]`.

We'll call the `animatePillar` function in `tick` after moving the plane:

```
// After this line
/*
this.planeMesh.translateY(this.velocity*dt);
*/

this.animatingIds.forEach( id => {
 this.animatePillar(id, dt);
});
```

**Checkpoint: Game should generate pillars and detect collisions**

<img src="https://media.giphy.com/media/kuJLpNfGs9QUE/giphy.gif" width="200px"/>

### Pulling It Together

Almost done! We need to be able to keep track of score and also be able to reset the game when the player loses.

Since the plane is always located at `x = 0`, we want to check when the pillar passes over this point. Since `tick` is called every frame, `pillar.position.x` can have a lot of unnecessary precesion. We'll round this off to make our lives easier. Also, since there are two pillars per set, we only want to increment the score once. We'll only increase score for the top pillar.

Add to `animatePillar`:

```
//Add Ater Nullity Check 
/*
	if (!object) {
     return;
    }
*/

// Checks if plane passes pillar to increment score
    if (Math.round(object.position.x, -5) == 0 && !object.passed && object.name  == "top") {
      this.setState({scoreCount: this.state.scoreCount + 1}); // update the score in the state
      object.passed = true; // mark pillar as passed
}
```

We need a way to display the score on the screen. We create a new `Score` component where we pass in the score in `props`.

```
// Add at the end of the file
class Score extends React.Component {
  render() {
    return (
      <Text style={styles.scoreText}>
        {this.props.score}
      </Text>
    );
  }
}

const styles = StyleSheet.create({
  scoreText: {
    position:'absolute',
    top: 40,
    width: 75,
    textAlign: 'center',
    zIndex: 100,
    backgroundColor: 'transparent',
    color: 'white',
    fontSize: 30,
  }
});
```

We then add this component to our render. We only want to display the score when the game is started.

```
// Add right after the THREEView component
/*
<THREEView/>
*/

{ this.state.started ? <Score score={this.state.scoreCount}/> : null }
```

Finally when a player loses, we need a way to reset the game to the original state (the start screen). This stops the create pillar interval and clears all the meshes from the scene.

```
// Replace old resetScene
resetScene = () => {
  clearInterval(this.pillarInterval);
  while (this.scene.children.length > 0) {
    this.scene.remove(this.scene.children[0]);
  }
  this.createGameScene();
};
```

And we're done!

<img src="https://media.giphy.com/media/ltkOM6tpRPNPa/giphy.gif" width="200px"/>

### Conclusion

Using Expo, React Native, and Three makes it really easy to write mobile games.

Final code for the project here:

```
git clone https://github.com/expo/floatyplane.git
```

Thanks for reading!
