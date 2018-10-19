#extension GL_OES_EGL_image_external : require

precision mediump float;
varying vec2 uv;
uniform samplerExternalOES uSampler;

void main() {
//    gl_FragColor = texture2D(uSampler, uv);
    gl_FragColor = vec4(uv.x, uv.y, 0.0, 0.0);
}
