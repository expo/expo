package expo.modules.video.transparent.renderer.shader

internal const val VERTEX_SHADER_SOURCE = """uniform mat4 surfaceTransformMatrix;
attribute vec4 positionInSurface;
attribute vec4 positionInTexture;
varying vec2 rgbTextureCoordinates;
varying vec2 alphaTextureCoordinates;

void main() {
  gl_Position = positionInSurface;

  float rgbYOrigin = 0.5;
  float alphaYOrigin = 0.0;
  float channelScale = 2.0;

  float rgbY = positionInTexture.y / channelScale + rgbYOrigin;
  float alphaY = positionInTexture.y / channelScale + alphaYOrigin;

  vec4 positionInRgbTexture = vec4(positionInTexture.x, rgbY, positionInTexture.zw);
  vec4 positionInAlphaTexture = vec4(positionInTexture.x, alphaY, positionInTexture.zw);

  rgbTextureCoordinates = (surfaceTransformMatrix * positionInRgbTexture).xy;
  alphaTextureCoordinates = (surfaceTransformMatrix * positionInAlphaTexture).xy;
}
"""
