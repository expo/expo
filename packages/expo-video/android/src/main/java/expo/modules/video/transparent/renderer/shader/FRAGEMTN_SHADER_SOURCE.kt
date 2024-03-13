package expo.modules.video.transparent.renderer.shader

internal const val FRAGMENT_SHADER_SOURCE = """#extension GL_OES_EGL_image_external : require
precision mediump float;
uniform samplerExternalOES texture;
varying vec2 rgbTextureCoordinates;
varying vec2 alphaTextureCoordinates;

void main() {
  vec4 rgbSource = texture2D(texture, rgbTextureCoordinates);
  float alphaSource = texture2D(texture, alphaTextureCoordinates).g;

  gl_FragColor = vec4(rgbSource.rgb * alphaSource, alphaSource);
}
"""
