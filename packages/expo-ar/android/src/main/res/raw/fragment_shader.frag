// important to include in order to use rendered Android View to gl texture
#extension GL_OES_EGL_image_external : require

// make sure to use samplerExternalOES instead of sampler2D
uniform samplerExternalOES u_Texture;                   // input texture

precision mediump float;                                // Set the default precision to medium. We don't need as high of a precision in the fragment shader.

varying vec2 v_TextureCoordinates;                      // Interpolated texture Coordinates per fragment.

void main() {
  gl_FragColor = texture2D(u_Texture, v_TextureCoordinates);
}
