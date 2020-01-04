import './BeforePIXI';

import { Asset } from 'expo-asset';
import { Platform } from '@unimodules/core';
import * as PIXI from 'pixi.js';
import { Dimensions, PixelRatio } from 'react-native';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass';

import { Renderer, TextureLoader, THREE } from 'expo-three';
import GLWrap from './GLWrap';
import GLMaskScreen from './GLMaskScreen';
import GLSnapshotsScreen from './GLSnapshotsScreen';
import GLHeadlessRenderingScreen from './GLHeadlessRenderingScreen';
import GLViewScreen from './GLViewScreen';
import ProcessingWrap from './ProcessingWrap';
import GLThreeDepthStencilBuffer from './GLThreeDepthStencilBuffer';

function optionalRequire(requirer: () => { default: React.ComponentType }) {
  try {
    return requirer().default;
  } catch (e) {
    return null;
  }
}
const GLCameraScreen = optionalRequire(() => require('./GLCameraScreen'));

interface Screens {
  [key: string]: {
    screen: React.ComponentType & { title: string };
  };
}

const GLScreens: Screens = {
  ClearToBlue: {
    screen: GLWrap('Clear to blue', async gl => {
      gl.clearColor(0, 0, 1, 1);
      // tslint:disable-next-line: no-bitwise
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.endFrameEXP();
    }),
  },

  BasicTexture: {
    screen: GLWrap('Basic texture use', async gl => {
      const vert = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(
        vert,
        `
  precision highp float;
  attribute vec2 position;
  varying vec2 uv;
  void main () {
    uv = position;
    gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
  }`
      );
      gl.compileShader(vert);
      const frag = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(
        frag,
        `
  precision highp float;
  uniform sampler2D texture;
  varying vec2 uv;
  void main () {
    gl_FragColor = texture2D(texture, vec2(uv.x, uv.y));
  }`
      );
      gl.compileShader(frag);

      const program = gl.createProgram()!;
      gl.attachShader(program, vert);
      gl.attachShader(program, frag);
      gl.linkProgram(program);
      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const verts = new Float32Array([-2, 0, 0, -2, 2, 2]);
      gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
      const positionAttrib = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(positionAttrib);
      gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

      const asset = Asset.fromModule(require('../../../assets/images/nikki.png'));
      await asset.downloadAsync();
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, asset as any);
      gl.uniform1i(gl.getUniformLocation(program, 'texture'), 0);

      (async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const imageAsset = Asset.fromModule(
          require('../../../assets/images/nikki-small-purple.png')
        );
        await imageAsset.downloadAsync();
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 32, 32, gl.RGBA, gl.UNSIGNED_BYTE, imageAsset as any);
        // Use below to test using a `TypedArray` parameter
        //         gl.texSubImage2D(
        //           gl.TEXTURE_2D, 0, 32, 32, 2, 2, gl.RGBA, gl.UNSIGNED_BYTE,
        //           new Uint8Array([
        //             255, 0, 0, 255,
        //             0, 255, 0, 255,
        //             0, 0, 255, 255,
        //             128, 128, 0, 255,
        //           ]));
      })();

      return {
        onTick() {
          gl.clearColor(0, 0, 1, 1);
          // tslint:disable-next-line: no-bitwise
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLES, 0, verts.length / 2);
          gl.endFrameEXP();
        },
      };
    }),
  },

  GLViewScreen: {
    screen: GLViewScreen,
  },

  Mask: {
    screen: GLMaskScreen,
  },

  Snapshots: {
    screen: GLSnapshotsScreen,
  },

  THREEBasic: {
    screen: GLWrap('Basic three.js use', async gl => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );

      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0xffffff);

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        map: new TextureLoader().load(require('../../../assets/images/nikki.png')),
      });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      camera.position.z = 3;

      return {
        onLayout({ nativeEvent: { layout } }) {
          const scale = PixelRatio.get();
          camera.aspect = layout.width / layout.height;
          camera.updateProjectionMatrix();
          renderer.setSize(layout.width * scale, layout.height * scale);
        },
        onTick() {
          cube.rotation.x += 0.04;
          cube.rotation.y += 0.07;

          renderer.render(scene, camera);

          gl.endFrameEXP();
        },
      };
    }),
  },

  THREEDepthStencilBuffer: {
    screen: GLThreeDepthStencilBuffer,
  },

  THREEGlitchFilm: {
    screen: GLWrap('three.js glitch and film effects', async gl => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );

      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0xffffff);

      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const glitchPass = new GlitchPass();
      composer.addPass(glitchPass);

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        map: new TextureLoader().load(require('../../../assets/images/nikki.png')),
      });

      const cubes = Array(24)
        .fill(0)
        .map(() => {
          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);
          mesh.position.x = 3 - 6 * Math.random();
          mesh.position.y = 3 - 6 * Math.random();
          mesh.position.z = -5 * Math.random();
          const angularVelocity = {
            x: 0.1 * Math.random(),
            y: 0.1 * Math.random(),
          };
          return { mesh, angularVelocity };
        });

      camera.position.z = 3;

      return {
        onLayout({ nativeEvent: { layout } }) {
          const scale = PixelRatio.get();
          camera.aspect = layout.width / layout.height;
          camera.updateProjectionMatrix();
          renderer.setSize(layout.width * scale, layout.height * scale);
          composer.setSize(layout.width, layout.height);
        },
        onTick() {
          cubes.forEach(({ mesh, angularVelocity }) => {
            mesh.rotation.x += angularVelocity.x;
            mesh.rotation.y += angularVelocity.y;
          });

          composer.render();

          gl.endFrameEXP();
        },
      };
    }),
  },

  THREESprite: {
    screen: GLWrap('three.js sprite rendering', async gl => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );

      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0xffffff);

      const spriteMaterial = new THREE.SpriteMaterial({
        map: new TextureLoader().load(require('../../../assets/images/nikki.png')),
        color: 0xffffff,
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      scene.add(sprite);

      camera.position.z = 3;

      return {
        onLayout({ nativeEvent: { layout } }) {
          const scale = PixelRatio.get();
          camera.aspect = layout.width / layout.height;
          camera.updateProjectionMatrix();
          renderer.setSize(layout.width * scale, layout.height * scale);
        },
        onTick() {
          renderer.render(scene, camera);
          gl.endFrameEXP();
        },
      };
    }),
  },

  ProcessingInAndOut: {
    screen: ProcessingWrap<{}>(`'In and out' from openprocessing.org`, p => {
      p.setup = () => {
        p.strokeWeight(7);
      };

      const harom = (
        ax: number,
        ay: number,
        bx: number,
        by: number,
        level: number,
        ratio: number
      ) => {
        if (level <= 0) {
          return;
        }

        const vx = bx - ax;
        const vy = by - ay;
        const nx = p.cos(p.PI / 3) * vx - p.sin(p.PI / 3) * vy;
        const ny = p.sin(p.PI / 3) * vx + p.cos(p.PI / 3) * vy;
        const cx = ax + nx;
        const cy = ay + ny;
        p.line(ax, ay, bx, by);
        p.line(ax, ay, cx, cy);
        p.line(cx, cy, bx, by);

        harom(
          ax * ratio + cx * (1 - ratio),
          ay * ratio + cy * (1 - ratio),
          ax * (1 - ratio) + bx * ratio,
          ay * (1 - ratio) + by * ratio,
          level - 1,
          ratio
        );
      };

      p.draw = () => {
        p.background(240);
        harom(
          p.width - 142,
          p.height - 142,
          142,
          p.height - 142,
          6,
          (p.sin((0.0005 * Date.now()) % (2 * p.PI)) + 1) / 2
        );
      };
    }),
  },

  ProcessingNoClear: {
    screen: ProcessingWrap<{}>('Draw without clearing screen with processing.js', p => {
      let t = 0;

      p.setup = () => {
        p.background(0);
        p.noStroke();
      };

      p.draw = () => {
        t += 12;
        p.translate(p.width * 0.5, p.height * 0.5);
        p.fill(
          128 * (1 + p.sin(0.004 * t)),
          128 * (1 + p.sin(0.005 * t)),
          128 * (1 + p.sin(0.007 * t))
        );
        p.ellipse(
          0.25 * p.width * p.cos(0.002 * t),
          0.25 * p.height * p.sin(0.002 * t),
          0.1 * p.width * (1 + p.sin(0.003 * t)),
          0.1 * p.width * (1 + p.sin(0.003 * t))
        );
      };
    }),
  },

  PIXIBasic: {
    screen: GLWrap('Basic pixi.js use', async gl => {
      const { scale: resolution } = Dimensions.get('window');
      const width = gl.drawingBufferWidth / resolution;
      const height = gl.drawingBufferHeight / resolution;
      const app = new PIXI.Application({
        context: gl,
        width,
        height,
        resolution,
        backgroundColor: 0xffffff,
      });
      app.ticker.add(() => gl.endFrameEXP());

      const graphics = new PIXI.Graphics();
      graphics.lineStyle(0);
      graphics.beginFill(0x00ff00);
      graphics.drawCircle(width / 2, height / 2, 50);
      graphics.endFill();
      app.stage.addChild(graphics);
    }),
  },

  PIXISprite: {
    screen: GLWrap('pixi.js sprite rendering', async gl => {
      const { scale: resolution } = Dimensions.get('window');
      const width = gl.drawingBufferWidth / resolution;
      const height = gl.drawingBufferHeight / resolution;
      const app = new PIXI.Application({
        context: gl,
        width,
        height,
        resolution,
        backgroundColor: 0xffffff,
      });
      app.ticker.add(() => gl.endFrameEXP());

      const asset = Asset.fromModule(require('../../../assets/images/nikki.png'));
      await asset.downloadAsync();
      let image;
      if (Platform.OS === 'web') {
        image = new Image();
        image.src = asset.localUri!;
      } else {
        image = new Image(asset as any);
      }
      const sprite = PIXI.Sprite.from(image);
      app.stage.addChild(sprite);
    }),
  },

  ...(GLCameraScreen && {
    GLCamera: {
      screen: GLCameraScreen,
    },
  }),

  // WebGL 2.0 sample - http://webglsamples.org/WebGL2Samples/#transform_feedback_separated_2
  WebGL2TransformFeedback: {
    screen: GLWrap('WebGL2 - Transform feedback', async gl => {
      const POSITION_LOCATION = 0;
      const VELOCITY_LOCATION = 1;
      const SPAWNTIME_LOCATION = 2;
      const LIFETIME_LOCATION = 3;
      const ID_LOCATION = 4;
      const NUM_LOCATIONS = 5;
      const NUM_PARTICLES = 1000;
      const ACCELERATION = -1.0;

      const vertexSource = `#version 300 es
          #define POSITION_LOCATION ${POSITION_LOCATION}
          #define VELOCITY_LOCATION ${VELOCITY_LOCATION}
          #define SPAWNTIME_LOCATION ${SPAWNTIME_LOCATION}
          #define LIFETIME_LOCATION ${LIFETIME_LOCATION}
          #define ID_LOCATION ${ID_LOCATION}

          precision highp float;
          precision highp int;
          precision highp sampler3D;

          uniform float u_time;
          uniform vec2 u_acceleration;

          layout(location = POSITION_LOCATION) in vec2 a_position;
          layout(location = VELOCITY_LOCATION) in vec2 a_velocity;
          layout(location = SPAWNTIME_LOCATION) in float a_spawntime;
          layout(location = LIFETIME_LOCATION) in float a_lifetime;
          layout(location = ID_LOCATION) in float a_ID;

          out vec2 v_position;
          out vec2 v_velocity;
          out float v_spawntime;
          out float v_lifetime;

          float rand(vec2 co){
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
          }

          void main() {
            if (a_spawntime == 0.0 || (u_time - a_spawntime > a_lifetime) || a_position.y < -0.5) {
              // Generate a new particle
              v_position = vec2(0.0, 0.0);
              v_velocity = vec2(rand(vec2(a_ID, 0.0)) - 0.5, rand(vec2(a_ID, a_ID)));
              v_spawntime = u_time;
              v_lifetime = 5000.0;
            } else {
              v_velocity = a_velocity + 0.01 * u_acceleration;
              v_position = a_position + 0.01 * v_velocity;
              v_spawntime = a_spawntime;
              v_lifetime = a_lifetime;
            }
            gl_Position = vec4(v_position, 0.0, 1.0);
            gl_PointSize = 2.0;
          }
        `;

      const fragmentSource = `#version 300 es
          precision highp float;
          precision highp int;

          uniform vec4 u_color;

          out vec4 color;

          void main() {
            color = u_color;
          }
        `;

      const vert = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(vert, vertexSource);
      gl.compileShader(vert);

      const frag = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(frag, fragmentSource);
      gl.compileShader(frag);

      const program = gl.createProgram()!;
      gl.attachShader(program, vert);
      gl.attachShader(program, frag);

      const appStartTime = Date.now();
      let currentSourceIdx = 0;

      // Get varyings and link program
      const varyings = ['v_position', 'v_velocity', 'v_spawntime', 'v_lifetime'];
      gl.transformFeedbackVaryings(program, varyings, gl.SEPARATE_ATTRIBS);
      gl.linkProgram(program);

      // Get uniform locations for the draw program
      const drawTimeLocation = gl.getUniformLocation(program, 'u_time');
      const drawAccelerationLocation = gl.getUniformLocation(program, 'u_acceleration');
      const drawColorLocation = gl.getUniformLocation(program, 'u_color');

      // Initialize particle data
      const particlePositions = new Float32Array(NUM_PARTICLES * 2);
      const particleVelocities = new Float32Array(NUM_PARTICLES * 2);
      const particleSpawntime = new Float32Array(NUM_PARTICLES);
      const particleLifetime = new Float32Array(NUM_PARTICLES);
      const particleIDs = new Float32Array(NUM_PARTICLES);

      for (let p = 0; p < NUM_PARTICLES; ++p) {
        particlePositions[p * 2] = 0.0;
        particlePositions[p * 2 + 1] = 0.0;
        particleVelocities[p * 2] = 0.0;
        particleVelocities[p * 2 + 1] = 0.0;
        particleSpawntime[p] = 0.0;
        particleLifetime[p] = 0.0;
        particleIDs[p] = p;
      }

      // Init Vertex Arrays and Buffers
      const particleVAOs = [gl.createVertexArray(), gl.createVertexArray()];

      // Transform feedback objects track output buffer state
      const particleTransformFeedbacks = [
        gl.createTransformFeedback(),
        gl.createTransformFeedback(),
      ];

      const particleVBOs = new Array(particleVAOs.length);

      for (let i = 0; i < particleVAOs.length; ++i) {
        particleVBOs[i] = new Array(NUM_LOCATIONS);
        // Set up input
        gl.bindVertexArray(particleVAOs[i]!);

        particleVBOs[i][POSITION_LOCATION] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, particleVBOs[i][POSITION_LOCATION]);
        gl.bufferData(gl.ARRAY_BUFFER, particlePositions, gl.STREAM_COPY);
        gl.vertexAttribPointer(POSITION_LOCATION, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(POSITION_LOCATION);

        particleVBOs[i][VELOCITY_LOCATION] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, particleVBOs[i][VELOCITY_LOCATION]);
        gl.bufferData(gl.ARRAY_BUFFER, particleVelocities, gl.STREAM_COPY);
        gl.vertexAttribPointer(VELOCITY_LOCATION, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(VELOCITY_LOCATION);

        particleVBOs[i][SPAWNTIME_LOCATION] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, particleVBOs[i][SPAWNTIME_LOCATION]);
        gl.bufferData(gl.ARRAY_BUFFER, particleSpawntime, gl.STREAM_COPY);
        gl.vertexAttribPointer(SPAWNTIME_LOCATION, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(SPAWNTIME_LOCATION);

        particleVBOs[i][LIFETIME_LOCATION] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, particleVBOs[i][LIFETIME_LOCATION]);
        gl.bufferData(gl.ARRAY_BUFFER, particleLifetime, gl.STREAM_COPY);
        gl.vertexAttribPointer(LIFETIME_LOCATION, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(LIFETIME_LOCATION);

        particleVBOs[i][ID_LOCATION] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, particleVBOs[i][ID_LOCATION]);
        gl.bufferData(gl.ARRAY_BUFFER, particleIDs, gl.STATIC_READ);
        gl.vertexAttribPointer(ID_LOCATION, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(ID_LOCATION);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // Set up output
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, particleTransformFeedbacks[i]);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, particleVBOs[i][POSITION_LOCATION]);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, particleVBOs[i][VELOCITY_LOCATION]);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, particleVBOs[i][SPAWNTIME_LOCATION]);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 3, particleVBOs[i][LIFETIME_LOCATION]);
      }

      gl.useProgram(program);
      gl.uniform4f(drawColorLocation, 0.0, 1.0, 1.0, 1.0);
      gl.uniform2f(drawAccelerationLocation, 0.0, ACCELERATION);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

      return {
        onTick() {
          const time = Date.now() - appStartTime;
          const destinationIdx = (currentSourceIdx + 1) % 2;

          // Clear color buffer
          gl.clearColor(0.0, 0.0, 0.0, 1.0);
          gl.clear(gl.COLOR_BUFFER_BIT);

          // Toggle source and destination VBO
          const sourceVAO = particleVAOs[currentSourceIdx];
          const destinationTransformFeedback = particleTransformFeedbacks[destinationIdx];
          gl.bindVertexArray(sourceVAO);
          gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, destinationTransformFeedback);

          // Set uniforms
          gl.uniform1f(drawTimeLocation, time);

          // Draw particles using transform feedback
          gl.beginTransformFeedback(gl.POINTS);
          gl.drawArrays(gl.POINTS, 0, NUM_PARTICLES);
          gl.endTransformFeedback();
          gl.endFrameEXP();

          // Ping pong the buffers
          currentSourceIdx = (currentSourceIdx + 1) % 2;
        },
      };
    }),
  },

  HeadlessRendering: {
    screen: GLHeadlessRenderingScreen,
  },
};

export default GLScreens;
