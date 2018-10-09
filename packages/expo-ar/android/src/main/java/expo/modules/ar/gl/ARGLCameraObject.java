package expo.modules.ar.gl;
import android.annotation.TargetApi;
import android.graphics.SurfaceTexture;
import android.os.Build;
import android.util.Size;

import com.google.ar.core.Frame;
import com.google.ar.core.Session;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;

import expo.modules.gl.GLContext;
import expo.modules.gl.GLObject;

import static android.opengl.GLES11Ext.GL_TEXTURE_EXTERNAL_OES;
import static android.opengl.GLES30.*;
import static expo.modules.gl.cpp.EXGL.*;

public class ARGLCameraObject extends GLObject {
  private static final int FLOAT_SIZE = Float.SIZE / Byte.SIZE;

  private Session mSession;
  private int mProgram;
  private int mFramebuffer;
  private int mVertexBuffer;
  private int mVertexArray;
  private int mExtTexture;
  private int mDestTexture;
  private int mTextureWidth = -1;
  private int mTextureHeight = -1;

  public SurfaceTexture mCameraSurfaceTexture;

  private float textureCoords[] = {
      0.0f, 0.0f, // 1
      0.0f, 1.0f, // 3
      1.0f, 1.0f, // 2
      0.0f, 0.0f, // 1
      1.0f, 1.0f, // 2
      1.0f, 0.0f, // 4
  };

  private FloatBuffer mQuadTexCoordTransformed;
  private FloatBuffer mQuadTexCoord;

  private static String vertexShaderSource
      = "precision highp float;"
      + "attribute vec4 position;"
      + "uniform mat4 transformMatrix;"
      + "varying vec2 coords;"
      + "void main() {"
      + "  vec2 clipSpace = (1.0 - 2.0 * position.xy);"
      + "  coords = (transformMatrix * position).xy;"
      + "  gl_Position = vec4(clipSpace.y, clipSpace.x, 0.0, 1.0);"
      + "}";

  private static String fragmentShaderSource
      = "#extension GL_OES_EGL_image_external : require\n"
      + "precision mediump float;"
      + "varying vec2 coords;"
      + "uniform samplerExternalOES cameraTexture;"
      + "void main() {"
      + "  gl_FragColor = texture2D(cameraTexture, coords);"
      + "}";

  private ARGLContextManager mARGLContextManager;

  // Must be constructed on GL thread!
  public ARGLCameraObject(final GLContext glContext, final Session session) {
    super(glContext.getContextId());
    mARGLContextManager = new ARGLContextManager();

    mSession = session;

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

    mSession.setCameraTextureName(mExtTexture); // .setPreviewTexture(mCameraSurfaceTexture);

    // allocate buffers
    mQuadTexCoord = allocateFloatBufferWithData(textureCoords);
    glBindBuffer(GL_ARRAY_BUFFER, mVertexBuffer);
    glBufferData(GL_ARRAY_BUFFER, textureCoords.length * FLOAT_SIZE, mQuadTexCoord, GL_STATIC_DRAW);

    mQuadTexCoord = allocateFloatBuffer(textureCoords);
    mQuadTexCoordTransformed = allocateFloatBuffer(textureCoords);
  }

  private FloatBuffer allocateFloatBuffer(float[] data) {
    ByteBuffer byteBuffer = ByteBuffer.allocateDirect(data.length * FLOAT_SIZE);
    byteBuffer.order(ByteOrder.nativeOrder());
    return byteBuffer.asFloatBuffer();
  }

  private FloatBuffer allocateFloatBufferWithData(float[] data) {
    FloatBuffer floatBuffer = allocateFloatBuffer(data);
    floatBuffer.put(data);
    floatBuffer.position(0);
    return floatBuffer;
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

  public int getCameraTexture() {
    return exglObjId;
  }

  @TargetApi(Build.VERSION_CODES.LOLLIPOP)
  public void drawFrame(final Frame frame) {

    mARGLContextManager.saveGLContext();
    glDisable(GL_DEPTH_TEST);
    glDepthMask(false);

    final Size previewSize = mSession.getCameraConfig().getTextureSize(); // mCameraView.getPreviewSizeAsArray();
    final int previewWidth = previewSize.getWidth();
    final int previewHeight = previewSize.getHeight();

//    mSession.setDisplayGeometry(Surface.ROTATION_180, previewWidth, previewHeight);

    if (mCameraSurfaceTexture == null) return;

    int[] prevActiveTexture = new int[1];
    float[] transformMatrix = new float[16];
    // get previous state
    glGetIntegerv(GL_ACTIVE_TEXTURE, prevActiveTexture, 0);

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
    }

    if (frame.hasDisplayGeometryChanged())
      frame.transformDisplayUvCoords(mQuadTexCoord, mQuadTexCoordTransformed);

    glEnableVertexAttribArray(positionLocation);
    glVertexAttribPointer(positionLocation, 2, GL_FLOAT, false, 4 * 2, 0);

//    glEnableVertexAttribArray(transformLocation);
//    glVertexAttribPointer(transformLocation, 2, GL_FLOAT, false, FLOAT_SIZE * 2, mQuadTexCoord);

    // reallocate destination texture if preview size has changed
    if (mTextureWidth != previewWidth || mTextureHeight != previewHeight) {
      mTextureWidth = previewWidth;
      mTextureHeight = previewHeight;
      glBindTexture(GL_TEXTURE_2D, mDestTexture);
      glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, mTextureWidth, mTextureHeight, 0, GL_RGBA, GL_UNSIGNED_BYTE, null);
      mCameraSurfaceTexture.setDefaultBufferSize(previewWidth, previewHeight);
    }


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

    // Disable stuff
    glDisableVertexAttribArray(positionLocation);
    glDisableVertexAttribArray(transformLocation);

    // restore previous state
    glDepthMask(true);
    glEnable(GL_DEPTH_TEST);
    mARGLContextManager.restoreGLContext();
  }

  @Override
  public void destroy() {
    super.destroy();

    if (mSession != null) {
      mSession = null;
    }
    if (mCameraSurfaceTexture != null) {
      mCameraSurfaceTexture.release();
      mCameraSurfaceTexture = null;
    }
  }
}
