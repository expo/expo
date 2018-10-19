package expo.modules.ar.gl;
import android.annotation.TargetApi;
import android.content.Context;
import android.graphics.SurfaceTexture;
import android.opengl.GLES20;
import android.os.Build;
import android.util.Size;

import com.google.ar.core.Frame;
import com.google.ar.core.Session;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;

import expo.modules.ar.R;
import expo.modules.gl.GLContext;
import expo.modules.gl.GLObject;
import expo.modules.gl.GLView;

import static android.opengl.GLES11Ext.GL_TEXTURE_EXTERNAL_OES;
import static android.opengl.GLES30.*;
import static expo.modules.gl.cpp.EXGL.*;

public class ARGLCameraObject2 extends GLObject {
  private static final String TAG = ARGLCameraObject2.class.getSimpleName();

  private Session mSession;

  private int mProgram;
  private int mFramebuffer;
  private int mVertexBuffer;
  private int mVertexArray;
  private int mExternalOESTexture;
  private int mDestinationTexture;
  private int mTextureWidth = -1;
  private int mTextureHeight = -1;

  public SurfaceTexture mCameraSurfaceTexture;

  private float textureCoord[] = {
      0.0f, 0.0f, // 1
      0.0f, 1.0f, // 3
      1.0f, 1.0f, // 2
      0.0f, 0.0f, // 1
      1.0f, 1.0f, // 2
      1.0f, 0.0f, // 4
  };

  private FloatBuffer mQuadTexCoordTransformed;
  private FloatBuffer mQuadTexCoord;

  private ARGLContextManager mARGLContextManager;
  private Context mContext;

  // Must be constructed on GL thread!
  public ARGLCameraObject2(Context context, Session session, GLView glView) {
    super(glView.getGLContext().getContextId());
    mContext = context;
    mSession = session;
    mARGLContextManager = new ARGLContextManager();
  }

  public void createOnGLThread() {
    int[] textures = new int[2];
    int[] framebuffers = new int[1];
    int[] buffers = new int[1];
    int[] vertexArrays = new int[1];

    // create objects
    glGenTextures(2, textures, 0);
    glGenFramebuffers(1, framebuffers, 0);
    glGenBuffers(1, buffers, 0);
    glGenVertexArrays(1, vertexArrays, 0);

    mProgram = ARGLUtils.createProgram(mContext, R.raw.externaloes_vertex_shader, R.raw.externaloes_fragment_shader);
    mExternalOESTexture = textures[0];
    mDestinationTexture = textures[1];
    mFramebuffer = framebuffers[0];
    mVertexBuffer = buffers[0];
    mVertexArray = vertexArrays[0];
    EXGLContextMapObject(exglCtxId, exglObjId, mDestinationTexture);

    mCameraSurfaceTexture = new SurfaceTexture(mExternalOESTexture);
    mSession.setCameraTextureName(mExternalOESTexture);

    // allocate buffers
    mQuadTexCoord = allocateFloatBufferWithData(textureCoord);
    glBindBuffer(GL_ARRAY_BUFFER, mVertexBuffer);
    glBufferData(GL_ARRAY_BUFFER, textureCoord.length * 4, mQuadTexCoord, GL_STATIC_DRAW);

    mQuadTexCoord = allocateFloatBuffer(textureCoord);
    mQuadTexCoordTransformed = allocateFloatBuffer(textureCoord);
  }

  private FloatBuffer allocateFloatBuffer(float[] data) {
    ByteBuffer byteBuffer = ByteBuffer.allocateDirect(data.length * 4);
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
    ByteBuffer bb = ByteBuffer.allocateDirect(textureCoord.length * 4);
    bb.order(ByteOrder.nativeOrder());
    FloatBuffer vertexBuffer = bb.asFloatBuffer();
    vertexBuffer.put(textureCoord);
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

    if (mCameraSurfaceTexture == null) {
      return;
    }

    float[] transformMatrix = new float[16];

    glUseProgram(mProgram);
    ARGLUtils.checkGLError(TAG, "USE PROGRAM");
    glBindVertexArray(mVertexArray);
    glBindFramebuffer(GL_DRAW_FRAMEBUFFER, mFramebuffer);
    ARGLUtils.checkGLError(TAG, "BIND FRAMEBUFFER");

    int aPositionHandler = glGetAttribLocation(mProgram, "aPosition");
    int uTransformMatrix = glGetUniformLocation(mProgram, "uTransformMatrix");
    int uSamplerHandler = glGetUniformLocation(mProgram, "uSampler");

    // setup objects on the first frame
    if (mTextureWidth == -1) {
      // setup external texture
      glBindTexture(GL_TEXTURE_EXTERNAL_OES, mExternalOESTexture);
      glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
      glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
      glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
      glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MIN_FILTER, GL_LINEAR);

      // setup destination texture
      glBindTexture(GL_TEXTURE_2D, mDestinationTexture);
      glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
      glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
      glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
      glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);

      // bind destination texture to framebuffer
      glFramebufferTexture2D(GL_DRAW_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, mDestinationTexture, 0);

      // initialize vertex array with vertex buffer
      FloatBuffer vertexBuffer = setupVertexBuffer();

      glBindBuffer(GL_ARRAY_BUFFER, mVertexBuffer);
      glBufferData(GL_ARRAY_BUFFER, textureCoord.length * 4, vertexBuffer, GL_STATIC_DRAW);

      ARGLUtils.checkGLError(TAG, "ARRAY BUFFER DATA");
    }

    if (frame.hasDisplayGeometryChanged()) {
      frame.transformDisplayUvCoords(mQuadTexCoord, mQuadTexCoordTransformed);
    }

    glEnableVertexAttribArray(aPositionHandler);
    glVertexAttribPointer(
        aPositionHandler,
        2,
        GL_FLOAT,
        false,
        4 * 2,
        0
    );
    ARGLUtils.checkGLError(TAG, "VERTEX ATTRIB POINTER");

//    glEnableVertexAttribArray(transformLocation);
//    glVertexAttribPointer(transformLocation, 2, GL_FLOAT, false, FLOAT_SIZE * 2, mQuadTexCoord);

    // reallocate destination texture if preview size has changed
    if (mTextureWidth != previewWidth || mTextureHeight != previewHeight) {
      mTextureWidth = previewWidth;
      mTextureHeight = previewHeight;
      glBindTexture(GL_TEXTURE_2D, mDestinationTexture);
      glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, mTextureWidth, mTextureHeight, 0, GL_RGBA, GL_UNSIGNED_BYTE, null);
      ARGLUtils.checkGLError(TAG, "TEX IMAGE 2D");
      mCameraSurfaceTexture.setDefaultBufferSize(previewWidth, previewHeight);
    }

    // update external texture and get transformation matrix
    mCameraSurfaceTexture.updateTexImage();
    mCameraSurfaceTexture.getTransformMatrix(transformMatrix);
    // set uniforms
    glBindTexture(GL_TEXTURE_EXTERNAL_OES, mExternalOESTexture);
    glActiveTexture(GLES20.GL_TEXTURE3);
    glUniform1i(uSamplerHandler, 3);

    glUniformMatrix4fv(uTransformMatrix, 1, false, transformMatrix, 0);
    ARGLUtils.checkGLError(TAG, "PASS UNIFORMS");

    // change viewport to fit the texture and draw
    glViewport(0, 0, mTextureWidth, mTextureHeight);
    glDrawArrays(GL_TRIANGLES, 0, textureCoord.length / 2);
    ARGLUtils.checkGLError(TAG, "DRAW ARRAYS");

    // Disable stuff
    glDisableVertexAttribArray(aPositionHandler);
    glDisableVertexAttribArray(uTransformMatrix);

    // restore previous state
    glDepthMask(true);
    glEnable(GL_DEPTH_TEST);
    ARGLUtils.checkGLError(TAG, "AFTER RENDERING");

    mARGLContextManager.restoreGLContext();
  }

  @Override
  public void destroy() {
    if (mSession != null) {
      mSession = null;
    }
    if (mCameraSurfaceTexture != null) {
      mCameraSurfaceTexture.release();
      mCameraSurfaceTexture = null;
    }
  }
}
