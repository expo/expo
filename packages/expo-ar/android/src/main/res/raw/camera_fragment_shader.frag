#extension GL_OES_EGL_image_external : require

precision mediump float;
varying vec2 uv;
uniform samplerExternalOES sTexture;

void main() {
    gl_FragColor = texture2D(sTexture, uv);
}
