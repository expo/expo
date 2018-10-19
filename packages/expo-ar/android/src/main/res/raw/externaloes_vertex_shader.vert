precision highp float;

attribute vec4 aPosition;
uniform mat4 uTransformMatrix;

varying vec2 uv;

void main() {
   vec2 clipSpace = (1.0 - 2.0 * aPosition.xy);
   uv = (uTransformMatrix * aPosition).xy;
   gl_Position = vec4(clipSpace, 0.0, 1.0);
}
