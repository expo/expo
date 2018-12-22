package expo.modules.gl;

import android.graphics.SurfaceTexture;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;

import expo.interfaces.camera.ExpoCameraViewInterface;

import static android.opengl.GLES11Ext.GL_TEXTURE_EXTERNAL_OES;
import static android.opengl.GLES30.*;
import static expo.modules.gl.cpp.EXGL.*;

public class GLCameraObject extends GLObject implements SurfaceTexture.OnFrameAvailableListener {
  private ExpoCameraViewInterface mCameraView;
  private GLContext mGLContext;
  private int mProgram;
  private int mFramebuffer;
  private int mVertexBuffer;
  private int mVertexArray;
  private int mExtTexture;
  private int mDestTexture;
  private int mTextureWidth = -1;
  private int mTextureHeight = -1;

  private SurfaceTexture mCameraSurfaceTexture;

  private float textureCoords[] = {
      0.0f, 1.0f,
      1.0f, 1.0f,
      0.0f, 0.0f,
      1.0f, 1.0f,
      1.0f, 0.0f,
      0.0f, 0.0f
  };

  private static String vertexShaderSource
      = "precision highp float;"
      + "attribute vec4 position;"
      + "uniform mat4 transformMatrix;"
      + "varying vec2 coords;"
      + "void main() {"
      + "  vec2 clipSpace = (1.0 - 2.0 * position.xy);"
      + "  coords = (transformMatrix * position).xy;"
      + "  gl_Position = vec4(clipSpace, 0.0, 1.0);"
      + "}";

  private static String fragmentShaderSource
      = "#extension GL_OES_EGL_image_external : require\n"
      + "precision highp float;"
      + "uniform samplerExternalOES cameraTexture;"
      + "varying vec2 coords;"
      + "void main() {"
      + "  gl_FragColor = texture2D(cameraTexture, coords);"
      + "}";

  // Must be constructed on GL thread!
  GLCameraObject(final GLContext glContext, final ExpoCameraViewInterface cameraView) {
    super(glContext.getContextId());

    mGLContext = glContext;
    mCameraView = cameraView;

    int[] textures = new int[2];
    int[] framebuffers = new int[1];
    int[] buffers = new int[1];
    int[] vertexArrays = new int[1];

    int program = glCreateProgram();
    int vertexShader = glCreateShader(GL_VERTEX_SHADER);
    int fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);

    // prepare program
    glShaderSource(vertexShader, vertexShaderSource);
    glShaderSource(fragmentShader, fragmentShaderSource);
    glCompileShader(vertexShader);
    glCompileShader(fragmentShader);
    glAttachShader(program, vertexShader);
    glAttachShader(program, fragmentShader);
    glLinkProgram(program);

    // create objects
    glGenTextures(2, textures, 0);
    glGenFramebuffers(1, framebuffers, 0);
    glGenBuffers(1, buffers, 0);
    glGenVertexArrays(1, vertexArrays, 0);

    mProgram = program;
    mExtTexture = textures[0];
    mDestTexture = textures[1];
    mFramebuffer = framebuffers[0];
    mVertexBuffer = buffers[0];
    mVertexArray = vertexArrays[0];
    EXGLContextMapObject(exglCtxId, exglObjId, mDestTexture);

    mCameraSurfaceTexture = new SurfaceTexture(mExtTexture);
    mCameraSurfaceTexture.setOnFrameAvailableListener(this);
    mCameraView.setPreviewTexture(mCameraSurfaceTexture);
  }

  private FloatBuffer setupVertexBuffer() {
    // Initialize the texture coords
    ByteBuffer bb = ByteBuffer.allocateDirect(textureCoords.length * 4);
    bb.order(ByteOrder.nativeOrder());
    FloatBuffer vertexBuffer = bb.asFloatBuffer();
    vertexBuffer.put(textureCoords);
    vertexBuffer.position(0);
    return vertexBuffer;
  }

  @Override
  public void onFrameAvailable(SurfaceTexture surfaceTexture) {
    final int[] previewSize = mCameraView.getPreviewSizeAsArray();
    final int previewWidth = previewSize[0];
    final int previewHeight = previewSize[1];

    mGLContext.runAsync(new Runnable() {
      @Override
      public void run() {
        if (mCameraSurfaceTexture == null) {
          return;
        }

        int[] prevFramebuffer = new int[1];
        int[] prevPrograms = new int[1];
        int[] prevActiveTexture = new int[1];
        int[] prevTexture = new int[1];
        int[] prevVertexArray = new int[1];
        int[] viewport = new int[4];
        float[] transformMatrix = new float[16];

        // get previous state
        glGetIntegerv(GL_DRAW_FRAMEBUFFER_BINDING, prevFramebuffer, 0);
        glGetIntegerv(GL_CURRENT_PROGRAM, prevPrograms, 0);
        glGetIntegerv(GL_ACTIVE_TEXTURE, prevActiveTexture, 0);
        glGetIntegerv(GL_TEXTURE_BINDING_2D, prevTexture, 0);
        glGetIntegerv(GL_VERTEX_ARRAY_BINDING, prevVertexArray, 0);
        glGetIntegerv(GL_VIEWPORT, viewport, 0);

        glUseProgram(mProgram);
        glBindVertexArray(mVertexArray);
        glBindFramebuffer(GL_DRAW_FRAMEBUFFER, mFramebuffer);

        int positionLocation = glGetAttribLocation(mProgram, "position");
        int transformLocation = glGetUniformLocation(mProgram, "transformMatrix");
        int textureLocation = glGetUniformLocation(mProgram, "cameraTexture");

        // setup objects on the first frame
        if (mTextureWidth == -1) {
          // setup external texture
          glBindTexture(GL_TEXTURE_EXTERNAL_OES, mExtTexture);
          glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
          glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
          glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
          glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MIN_FILTER, GL_LINEAR);

          // setup destination texture
          glBindTexture(GL_TEXTURE_2D, mDestTexture);
          glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
          glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
          glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
          glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);

          // bind destination texture to framebuffer
          glFramebufferTexture2D(GL_DRAW_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, mDestTexture, 0);

          // initialize vertex array with vertex buffer
          FloatBuffer vertexBuffer = setupVertexBuffer();
          glBindBuffer(GL_ARRAY_BUFFER, mVertexBuffer);
          glBufferData(GL_ARRAY_BUFFER, textureCoords.length * 4, vertexBuffer, GL_STATIC_DRAW);
          glEnableVertexAttribArray(positionLocation);
          glVertexAttribPointer(positionLocation, 2, GL_FLOAT, false, 4 * 2, 0);
        }

        // reallocate destination texture if preview size has changed
        if (mTextureWidth != previewWidth || mTextureHeight != previewHeight) {
          mTextureWidth = previewWidth;
          mTextureHeight = previewHeight;
          glBindTexture(GL_TEXTURE_2D, mDestTexture);
          glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, mTextureWidth, mTextureHeight, 0, GL_RGBA, GL_UNSIGNED_BYTE, null);
          mCameraSurfaceTexture.setDefaultBufferSize(previewWidth, previewHeight);
        }

        try {
          // update external texture and get transformation matrix
          mCameraSurfaceTexture.updateTexImage();
          mCameraSurfaceTexture.getTransformMatrix(transformMatrix);

          // set uniforms
          glBindTexture(GL_TEXTURE_EXTERNAL_OES, mExtTexture);
          glUniform1i(textureLocation, prevActiveTexture[0] - GL_TEXTURE0);
          glUniformMatrix4fv(transformLocation, 1, false, transformMatrix, 0);

          // change viewport to fit the texture and draw
          glViewport(0, 0, mTextureWidth, mTextureHeight);
          glDrawArrays(GL_TRIANGLES, 0, textureCoords.length / 2);

          // restore previous state
          glViewport(viewport[0], viewport[1], viewport[2], viewport[3]);
          glBindTexture(GL_TEXTURE_2D, prevTexture[0]);
          glBindFramebuffer(GL_DRAW_FRAMEBUFFER, prevFramebuffer[0]);
          glBindVertexArray(prevVertexArray[0]);
          glUseProgram(prevPrograms[0]);
        } catch (IllegalStateException e) {
          // nothing, just prevents crashes
        }
      }
    });
  }

  @Override
  void destroy() {
    if (mCameraView != null) {
      mCameraView.setPreviewTexture(null);
      mCameraView = null;
    }
    if (mCameraSurfaceTexture != null) {
      mCameraSurfaceTexture.release();
      mCameraSurfaceTexture = null;
    }
    super.destroy();
  }
}
