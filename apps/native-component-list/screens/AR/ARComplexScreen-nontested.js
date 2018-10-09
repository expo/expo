import React from 'react';
import PropTypes from 'prop-types';
import {
  PanResponder,
  Text,
  View,
} from 'react-native';
import ExpoTHREE, { AR as ThreeAR, THREE } from 'expo-three';
import { AR, Permissions } from 'expo';

// Let's alias ExpoTHREE.AR as ThreeAR so it doesn't collide with Expo.AR.
// Let's also import `expo-graphics`

class TouchableView extends React.Component {
  static propTypes = {
    onTouchesBegan: PropTypes.func.isRequired,
    onTouchesMoved: PropTypes.func.isRequired,
    onTouchesEnded: PropTypes.func.isRequired,
    onTouchesCancelled: PropTypes.func.isRequired,
    onStartShouldSetPanResponderCapture: PropTypes.func.isRequired,
  };
  static defaultProps = {
    onTouchesBegan: () => {},
    onTouchesMoved: () => {},
    onTouchesEnded: () => {},
    onTouchesCancelled: () => {},
    onStartShouldSetPanResponderCapture: () => true,
  };

  buildGestures = () =>
    PanResponder.create({
      // onResponderTerminate: this.props.onResponderTerminate ,
      // onStartShouldSetResponder: () => true,
      onResponderTerminationRequest: this.props.onResponderTerminationRequest,
      onStartShouldSetPanResponderCapture: this.props
        .onStartShouldSetPanResponderCapture,
      // onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onPanResponderGrant: ({ nativeEvent }, gestureState) => {
        const event = this._transformEvent({ ...nativeEvent, gestureState });
        this._emit('touchstart', event);
        this.props.onTouchesBegan(event);
      },
      onPanResponderMove: ({ nativeEvent }, gestureState) => {
        const event = this._transformEvent({ ...nativeEvent, gestureState });
        this._emit('touchmove', event);
        this.props.onTouchesMoved(event);
      },
      onPanResponderRelease: ({ nativeEvent }, gestureState) => {
        const event = this._transformEvent({ ...nativeEvent, gestureState });
        this._emit('touchend', event);
        this.props.onTouchesEnded(event);
      },
      onPanResponderTerminate: ({ nativeEvent }, gestureState) => {
        const event = this._transformEvent({ ...nativeEvent, gestureState });
        this._emit('touchcancel', event);

        this.props.onTouchesCancelled
          ? this.props.onTouchesCancelled(event)
          : this.props.onTouchesEnded(event);
      },
    });
  _panResponder = null;
  constructor(props) {
    super(props);
    this._panResponder = this.buildGestures();
  }

  _emit = (type, props) => {
    if (window.document && window.document.emitter) {
      window.document.emitter.emit(type, props);
    }
  };

  _transformEvent = event => {
    event.preventDefault = event.preventDefault || (_ => {});
    event.stopPropagation = event.stopPropagation || (_ => {});
    return event;
  };

  render() {
    const { children, id, style, ...props } = this.props;
    return (
      <View {...props} style={[style]} {...this._panResponder.panHandlers}>
        {children}
      </View>
    );
  }
}

export default class App extends React.Component {
  state = { isPermissionGranted: false };
  async componentDidMount() {
    // Turn off extra warnings
    THREE.suppressExpoWarnings();
    const result = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ isPermissionGranted: result.status === 'granted' });
  }
  
  render() {
    if (!this.state.isPermissionGranted) {
      return (
        <View>
          <Text>
            No Camera Permissions granted
          </Text>
        </View>
      );
    }
    return (
      <TouchableView
      style={{ flex: 1 }}
      shouldCancelWhenOutside={false}
      onTouchesBegan={this.onTouchesBegan}>
      <GraphicsView
        style={{ flex: 1, backgroundColor: 'orange' }}
        onContextCreate={this.onContextCreate}
        onRender={this.onRender}
        onResize={this.onResize}
        isArEnabled={true}
        isArRunningStateEnabled={false}
        isArCameraStateEnabled={false}
        arTrackingConfiguration={AR.TrackingConfigurations.World}
      />
      </TouchableView>

    );
  }

  // Called when `onPanResponderGrant` is invoked.
  onTouchesBegan = async ({ locationX: x, locationY: y }) => {
    if (!this.renderer) {
       return;
     }
 
     // Get the size of the renderer
     const size = this.renderer.getSize();
 
     // Invoke the native hit test method
     const hitTest = await AR.performHitTestAsync(
       {
         x: x, // / size.width,
         y: y // / size.height,
       },
       // Result type from intersecting a horizontal plane estimate, determined for the current frame.
       AR.HitTestResultTypes.HorizontalPlane
     );
     console.log(x, y, { hitTest })
 
     return;

     // Traverse the test results
     for (let hit of hitTest) {
       const { worldTransform } = hit;
       // If we've already placed a cube, then remove it
       if (this.cube) {
         this.scene.remove(this.cube);
       }
 
       // Create a new cube 
       const geometry = new THREE.BoxGeometry(0.0254, 0.0254, 0.0254);
       const material = new THREE.MeshPhongMaterial({
         color: 0x00ff00,
       });
       this.cube = new THREE.Mesh(geometry, material);
       // Add the cube to the scene
       this.scene.add(this.cube);
 
       // Disable the matrix auto updating system
       this.cube.matrixAutoUpdate = false;
 
       /* 
       Parse the matrix array: ex: 
         [
           1,0,0,0,
           0,1,0,0,
           0,0,1,0,
           0,0,0,1
         ]
       */
       const matrix = new THREE.Matrix4();
       matrix.fromArray(worldTransform);
 
       // Manually update the matrix 
       this.cube.applyMatrix(matrix);
       this.cube.updateMatrix();
     }
   };

  // When our context is built we can start coding 3D things.
  onContextCreate = async ({ gl, scale: pixelRatio, width, height }) => {
    // This will allow ARKit to collect Horizontal surfaces
    // AR.setPlaneDetection(AR.PlaneDetectionTypes.Horizontal);

    // Create a 3D renderer
    this.renderer = new ExpoTHREE.Renderer({
      gl,
      pixelRatio,
      width,
      height,
    });
    this.renderer.setClearColor(0xfffc00);

    // // We will add all of our meshes to this scene.
    this.scene = new THREE.Scene();
    // // This will create a camera texture and use it as the background for our scene
    this.scene.background = new ThreeAR.BackgroundTexture(this.renderer, gl);
    // // Now we make a camera that matches the device orientation. 
    // // Ex: When we look down this camera will rotate to look down too!
    // this.camera = new THREE.PerspectiveCamera( 45, width / height, 0.001, 1000 );

    this.camera = new ThreeAR.Camera(width, height, 0.01, 1000);
    
    // // Make a cube - notice that each unit is 1 meter in real life, we will make our box 0.1 meters
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    // Simple color material
    const material = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
    });
    
    // // this.magneticObject = new ThreeAR.MagneticObject();
    
    // // Combine our geometry and material
    this.cube = new THREE.Mesh(geometry, material);
    this.cube.position.z = -0.3
    // // Place the box 0.4 meters in front of us.
    // // const helper = new THREE.PolarGridHelper( 0.1, 16, 8, 64 );

    // // Scale the contents up / down to preserve size 
    // // this.magneticObject.maintainScale = false
    // // // Matches the device rotation
    // // this.magneticObject.maintainRotation = true
    
    // // this.magneticObject.add(helper)
    // // this.magneticObject.add(this.cube)
    // // this.scene.add(this.magneticObject)
    this.scene.add(this.cube);
    
    // // Add some depth lighting
    this.scene.add(new THREE.AmbientLight(0x404040));
    
    const light = new THREE.DirectionalLight(0xffffff, 0.5);
    light.position.set(3, 3, 3);
    this.scene.add(light);
    
    // Create this cool utility function that let's us see all the raw data points.
    // this.points = new ThreeAR.Points();
    // Add the points to our scene...
    // this.scene.add(this.points)
  };

  // The normalized point on the screen that we want our object to stick to.
  screenCenter = new THREE.Vector2(0.5, 0.5);

  // When the phone rotates, or the view changes size, this method will be called.
  onResize = ({ x, y, scale, width, height }) => {
    // Let's stop the function if we haven't setup our scene yet
    if (!this.renderer) {
      return;
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(width, height);
  };
  // Called every frame.
  onRender = async () => {
    // if (this.cube) this.cube.rotation.x = this.cube.rotation.z = (this.cube.rotation.z + 0.03)
    // This will make the points get more rawDataPoints from Expo.AR
    // if (this.points) {
    //   this.points.update();
    // }
    // if (this.magneticObject) {
    //   this.magneticObject.update(this.camera, this.screenCenter);
    // }

    // try {
    //   const data = await AR.getCurrentFrameAsync({
    //     anchors: {}, 
    //     // rawFeaturePoints: true, 
    //     // lightEstimation: true, 
    //   });
    //   console.log({data})
    //   } catch({ message }) {
    //     console.error(message)
    //   }
    
    // Finally render the scene with the AR Camera
    if (this.renderer)
    this.renderer.render(this.scene, this.camera);
  };
}
