precision mediump float;

uniform mat4 u_MVPMatrix;		    // A constant representing the combined model/view/projection matrix.

attribute vec4 a_Position;		    // Per-vertex position information we will pass in.
attribute vec2 a_TextureCoordinates; // Per-vertex texture Coordinates information we will pass in.

varying vec2 v_TextureCoordinates;   // This will be passed into the fragment shader.

void main() {
  // pass thought the texture coordiante
  v_TextureCoordinates = a_TextureCoordinates;

  // gl_Position is a special variable used to store the final position.
  // Multiply the vertex by the matrix to get the final point in normalized screen Coordinatess.
  gl_Position = u_MVPMatrix * a_Position;
}
