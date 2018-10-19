#version 300 es
#extension GL_OES_EGL_image_external_essl3 : require

precision mediump float;

in vec2 uv;
uniform samplerExternalOES uSampler;
out vec4 fragColor;

void main() {
  fragColor = texture(uSampler, uv);
}
