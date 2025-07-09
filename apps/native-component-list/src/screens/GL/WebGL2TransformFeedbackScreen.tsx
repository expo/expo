import GLWrap from './GLWrap';

// WebGL 2.0 sample - https://webglsamples.org/WebGL2Samples/#transform_feedback_separated_2
export default GLWrap('WebGL2 - Transform feedback', async (gl) => {
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
  const particleTransformFeedbacks = [gl.createTransformFeedback(), gl.createTransformFeedback()];

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
});
