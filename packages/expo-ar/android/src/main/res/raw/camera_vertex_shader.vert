attribute vec2 aPosition;
attribute vec2 aTextureCoord;

varying vec2 uv;

void main() {
   uv = aTextureCoord;
   gl_Position = vec4(aPosition, 0.0, 1.0);
}