#version 300 es

precision highp float;

in vec2 aPosition;
uniform mat4 uTransformMatrix;
out vec2 uv;

void main() {
   vec2 clipSpace = (1.0 - 2.0 * aPosition.xy);
   uv = (uTransformMatrix * vec4(aPosition, 0.0, 0.0)).xy;
   gl_Position = vec4(clipSpace, 0.0, 1.0);
}
