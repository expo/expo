package expo.modules.ar.gl;

import android.content.Context;
import android.opengl.Matrix;
import android.util.Log;
import android.view.Surface;

import com.google.ar.core.Frame;
import com.google.ar.core.Session;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;

import expo.modules.ar.R;
import expo.modules.gl.GLView;

import static android.opengl.GLES10.GL_TEXTURE_MIN_FILTER;
import static android.opengl.GLES10.glActiveTexture;
import static android.opengl.GLES11Ext.GL_TEXTURE_EXTERNAL_OES;
import static android.opengl.GLES20.GL_ARRAY_BUFFER;
import static android.opengl.GLES20.GL_CLAMP_TO_EDGE;
import static android.opengl.GLES20.GL_COLOR_ATTACHMENT0;
import static android.opengl.GLES20.GL_DEPTH_TEST;
import static android.opengl.GLES20.GL_FLOAT;
import static android.opengl.GLES20.GL_LINEAR;
import static android.opengl.GLES20.GL_NO_ERROR;
import static android.opengl.GLES20.GL_RGBA;
import static android.opengl.GLES20.GL_STATIC_DRAW;
import static android.opengl.GLES20.GL_TEXTURE0;
import static android.opengl.GLES20.GL_TEXTURE_2D;
import static android.opengl.GLES20.GL_TEXTURE_MAG_FILTER;
import static android.opengl.GLES20.GL_TEXTURE_WRAP_S;
import static android.opengl.GLES20.GL_TEXTURE_WRAP_T;
import static android.opengl.GLES20.GL_TRIANGLES;
import static android.opengl.GLES20.GL_UNSIGNED_BYTE;
import static android.opengl.GLES20.glBindBuffer;
import static android.opengl.GLES20.glBindFramebuffer;
import static android.opengl.GLES20.glBindTexture;
import static android.opengl.GLES20.glBufferData;
import static android.opengl.GLES20.glDepthMask;
import static android.opengl.GLES20.glDisable;
import static android.opengl.GLES20.glDisableVertexAttribArray;
import static android.opengl.GLES20.glDrawArrays;
import static android.opengl.GLES20.glEnable;
import static android.opengl.GLES20.glEnableVertexAttribArray;
import static android.opengl.GLES20.glFramebufferTexture2D;
import static android.opengl.GLES20.glGenBuffers;
import static android.opengl.GLES20.glGenFramebuffers;
import static android.opengl.GLES20.glGenTextures;
import static android.opengl.GLES20.glGetAttribLocation;
import static android.opengl.GLES20.glGetError;
import static android.opengl.GLES20.glGetUniformLocation;
import static android.opengl.GLES20.glGetUniformfv;
import static android.opengl.GLES20.glTexImage2D;
import static android.opengl.GLES20.glTexParameteri;
import static android.opengl.GLES20.glUniform1i;
import static android.opengl.GLES20.glUniformMatrix4fv;
import static android.opengl.GLES20.glUseProgram;
import static android.opengl.GLES20.glValidateProgram;
import static android.opengl.GLES20.glVertexAttribPointer;
import static android.opengl.GLES20.glViewport;
import static android.opengl.GLES30.GL_DRAW_FRAMEBUFFER;
import static android.opengl.GLES30.glBindVertexArray;
import static android.opengl.GLES30.glGenVertexArrays;
import static expo.modules.gl.cpp.EXGL.EXGLContextCreateObject;
import static expo.modules.gl.cpp.EXGL.EXGLContextDestroyObject;
import static expo.modules.gl.cpp.EXGL.EXGLContextMapObject;

public class ARGLBackgroundRenderer {
  private static final int FLOAT_SIZE = Float.SIZE / Byte.SIZE;

  private Context mContext;
  private GLView mGLView;
  private Session mSession;
  private ARGLContextManager mARGLContextManager;

  private int mEXGLContexId;
  private int mEXGLOutputTextureId;
  private int mExternalOESTexture;
  private int mOutputTexture;

  private int mFrameBuffer;
  private int mVertexBuffer;
  private int mVertexArray;
  private int mTextureWidth = -1;
  private int mTextureHeight = -1;

  private float[] mMVPMatrix = new float[16];
  private int mProgramHandle;
  private int mPositionHandle;
  private int mMVPMatrixHandle;
  private int mUniformTextureHandle;
  private int mTextureCoordinatesHandle;

  private FloatBuffer mTextureCoordinatesBuffer;

  // TEXTURE EDGE COORDINATES:
  //    1,0 ------- 1,1
  //    |             |
  //    |             |
  //    |             |
  //    |             |
  //    0,0 ------- 0,1
  //
  private float mTextureCoordinates[] = {
      0.0f, 1.0f, 1.0f, // top-left
      1.0f, 0.0f, 0.0f, // top-right
      1.0f, 1.0f, 1.0f, // bottom-tight
      0.0f, 0.0f, 0.0f, // bottom-left
  };
  private float mCoordinates[] = {
      -1.0f, -1.0f, 0.0f,
      -1.0f, +1.0f, 0.0f,
      +1.0f, -1.0f, 0.0f,
      +1.0f, +1.0f, 0.0f,
  };
  private FloatBuffer mQuadTextureCoordinatesTransformedBuffer;
  private FloatBuffer mQuadTextureCoordinatesBuffer;

  public ARGLBackgroundRenderer(Context context) {
    mContext = context;
    mARGLContextManager = new ARGLContextManager();
  }

  public void initialize(GLView glView, Session session, final Runnable completionHandler) {
    mGLView = glView;
    mSession = session;

    mGLView.getGLContext().runAsync(new Runnable() {
      @Override
      public void run() {
        mEXGLOutputTextureId = EXGLContextCreateObject(mEXGLContexId);
        mEXGLContexId = mGLView.getEXGLCtxId();
        initializeGLObjects();
        completionHandler.run();
      }
    });
  }

  private void initializeGLObjects() {
    // Generate background texture
    int[] textures = new int[2];
    glGenTextures(2, textures, 0);
    mExternalOESTexture = textures[0];
    mOutputTexture = textures[1];
    EXGLContextMapObject(mEXGLContexId, mEXGLOutputTextureId, mOutputTexture);

    // Setup textures
    glBindTexture(GL_TEXTURE_EXTERNAL_OES, mExternalOESTexture);
    glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

    glBindTexture(GL_TEXTURE_2D, mOutputTexture);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);

    // Compile shaders & create program
    mProgramHandle = ARGLUtils.createProgram(mContext, R.raw.vertex_shader, R.raw.fragment_shader);
    glUseProgram(mProgramHandle);
    glValidateProgram(mProgramHandle);

    int[] frameBuffers = new int[1];
    int[] buffers = new int[1];
    int[] vertexArrays = new int[1];

    // create objects
    glGenFramebuffers(1, frameBuffers, 0);
    glGenBuffers(1, buffers, 0);
    glGenVertexArrays(1, vertexArrays, 0);
    mFrameBuffer = frameBuffers[0];
    mVertexBuffer = buffers[0];
    mVertexArray = vertexArrays[0];

    // allocate buffers
    mTextureCoordinatesBuffer = allocateFloatBufferWithData(mTextureCoordinates);
    glBindBuffer(GL_ARRAY_BUFFER, mVertexBuffer);
    glBufferData(GL_ARRAY_BUFFER, mTextureCoordinates.length * FLOAT_SIZE, mTextureCoordinatesBuffer, GL_STATIC_DRAW);

    mQuadTextureCoordinatesBuffer = allocateFloatBuffer(mTextureCoordinates);
    mQuadTextureCoordinatesTransformedBuffer = allocateFloatBuffer(mTextureCoordinates);

    mSession.setCameraTextureName(mExternalOESTexture);
    mSession.setDisplayGeometry(Surface.ROTATION_0, mGLView.getWidth(), mGLView.getHeight());
  }

  public void drawFrame(Frame frame) {
    draw(frame);
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

  private void draw(Frame frame) {
    // save previous state
    mARGLContextManager.saveGLContext();
    glDisable(GL_DEPTH_TEST);
    glDepthMask(false);

    final int previewWidth = mGLView.getWidth();
    final int previewHeight = mGLView.getHeight();

    // setup new state
    checkGLError("before shader");
    glUseProgram(mProgramHandle);
    glBindVertexArray(mVertexArray);
    glBindFramebuffer(GL_DRAW_FRAMEBUFFER, mFrameBuffer);
    checkGLError("after shader");

    mMVPMatrixHandle = glGetUniformLocation(mProgramHandle, "u_MVPMatrix");
    mUniformTextureHandle = glGetAttribLocation(mProgramHandle, "u_Texture");
    mPositionHandle = glGetAttribLocation(mProgramHandle, "a_Position");
    mTextureCoordinatesHandle = glGetAttribLocation(mProgramHandle, "a_TextureCoordinates");

    // setup objects on the first frame
    if (mTextureWidth == -1) {
      // bind destination texture to framebuffer
      glBindFramebuffer(GL_DRAW_FRAMEBUFFER, mFrameBuffer);
      glFramebufferTexture2D(GL_DRAW_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, mOutputTexture, 0);
    }

    // reallocate destination texture if preview size has changed
    if (mTextureWidth != previewWidth || mTextureHeight != previewHeight) {
      mTextureWidth = previewWidth;
      mTextureHeight = previewHeight;
      glBindTexture(GL_TEXTURE_2D, mOutputTexture);
      glTexImage2D(
          GL_TEXTURE_2D,
          0,
          GL_RGBA,
          mTextureWidth,
          mTextureHeight,
          0,
          GL_RGBA,
          GL_UNSIGNED_BYTE,
          null);
//    mCameraSurfaceTexture.setDefaultBufferSize(previewWidth, previewHeight);
    }

    glBindFramebuffer(GL_DRAW_FRAMEBUFFER, mFrameBuffer);

//  mCameraSurfaceTexture.updateTexImage();
//  mCameraSurfaceTexture.getTransformMatrix(transformMatrix);

    // change viewport to fit the texture
    glViewport(0, 0, mTextureWidth, mTextureHeight);


    // set attributes
    // initialize vertex array with vertex buffer
    glBindBuffer(GL_ARRAY_BUFFER, mVertexBuffer);
    glBufferData(GL_ARRAY_BUFFER, mTextureCoordinates.length * FLOAT_SIZE, mTextureCoordinatesBuffer, GL_STATIC_DRAW);
    glEnableVertexAttribArray(mPositionHandle);
    glVertexAttribPointer(mPositionHandle, 2, GL_FLOAT, false, FLOAT_SIZE * 2, 0);

    glEnableVertexAttribArray(mTextureCoordinatesHandle);
    frame.transformDisplayUvCoords(mQuadTextureCoordinatesBuffer, mQuadTextureCoordinatesTransformedBuffer);
    glVertexAttribPointer(mTextureCoordinatesHandle, 2, GL_FLOAT, false, FLOAT_SIZE * 2, mQuadTextureCoordinatesTransformedBuffer);

    // set texture
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_EXTERNAL_OES, mExternalOESTexture);
    glUniform1i(mUniformTextureHandle, 0);

    // set MVPMatrix
    Matrix.setIdentityM(mMVPMatrix, 0);
    Matrix.rotateM(mMVPMatrix, 0, 90, 0, 0, -1f);
    Matrix.scaleM(mMVPMatrix, 0, 1f, 1f, 1f);

//    frame.getCamera().getPose().toMatrix(transformMatrix, 0);
//    frame.getCamera().getViewMatrix(transformMatrix, 0);
//    frame.getCamera().getProjectionMatrix(transformMatrix, 0, 0.001f, 1000f);

    glUniformMatrix4fv(mMVPMatrixHandle, 1, false, mMVPMatrix, 0);

    checkGLError("before draw");

    glDrawArrays(GL_TRIANGLES, 0, mTextureCoordinates.length / 2);
    glDisableVertexAttribArray(mPositionHandle);
    glDisableVertexAttribArray(mTextureCoordinatesHandle);
    glDepthMask(true);
    glEnable(GL_DEPTH_TEST);
    checkGLError("after drawing quad");

    // restore previous state
    mARGLContextManager.restoreGLContext();

    checkGLError("post drawing");
  }

  private void checkGLError(String s) {
    int error;
    while ((error = glGetError()) != GL_NO_ERROR) {
      Log.e("GL", s + " glerror " + error);
      throw new RuntimeException(s + " glerror " + error);
    }
  }

  public void stop() {
    EXGLContextDestroyObject(mGLView.getEXGLCtxId(), mEXGLOutputTextureId);
  }

  public int getCameraTexture() {
    return mEXGLOutputTextureId;
  }
}
