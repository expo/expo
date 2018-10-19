package expo.modules.ar.gl;

import android.annotation.TargetApi;
import android.content.Context;
import android.graphics.SurfaceTexture;
import android.os.Build;
import android.util.Size;

import com.google.ar.core.Frame;
import com.google.ar.core.Session;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;

import expo.modules.ar.R;
import expo.modules.gl.GLObject;
import expo.modules.gl.GLView;

import static android.opengl.GLES11Ext.GL_TEXTURE_EXTERNAL_OES;
import static android.opengl.GLES30.*;
import static expo.modules.gl.cpp.EXGL.EXGLContextMapObject;

public class ARGLCameraObject extends GLObject {
  private static final String TAG = ARGLCameraObject.class.getSimpleName();

  private static final int FLOAT_SIZE = Float.SIZE / Byte.SIZE;
  private final Context mContext;
  private Session mSession;
  private SurfaceTexture mCameraSurfaceTexture;
  private ARGLContextManager mARGLContextManager;

  private int mProgram;
  private int mPositionHandler;
  private int mTransformHandler;
  private int mTextureHandler;

  private int mFramebuffer;
  private int mVertexBuffer;
  private int mExternalOESTexture;
  private int mDestinationTexture;
  private int mTextureWidth = -1;
  private int mTextureHeight = -1;


  private float textureCoords[] = {
      0.0f, 0.0f, // 0
      0.0f, 1.0f, // 2
      1.0f, 1.0f, // 1
      0.0f, 0.0f, // 0
      1.0f, 1.0f, // 1
      1.0f, 0.0f, // 3
  };

  private FloatBuffer mQuadTexCoordTransformed;
  private FloatBuffer mQuadTexCoord;

  // Must be constructed on GL thread!
  public ARGLCameraObject(Context context, Session session, GLView glView) {
    super(glView.getGLContext().getContextId());
    mARGLContextManager = new ARGLContextManager();
    mContext = context;
    mSession = session;
  }

  public void createOnGLThread() {
    mARGLContextManager.saveGLContext();
    int[] textures = new int[2];
    int[] framebuffers = new int[1];
    int[] buffers = new int[1];
    int[] vertexArrays = new int[1];

    // create objects
    glGenTextures(2, textures, 0);
    glGenFramebuffers(1, framebuffers, 0);
    glGenBuffers(1, buffers, 0);
    glGenVertexArrays(1, vertexArrays, 0);

    mProgram = ARGLUtils.createProgram(mContext, R.raw.camera_vertex_shader, R.raw.camera_fragment_shader);
    mPositionHandler = glGetAttribLocation(mProgram, "aPosition");
    mTransformHandler = glGetUniformLocation(mProgram, "uTransformMatrix");
    mTextureHandler = glGetUniformLocation(mProgram, "uSampler");
    mExternalOESTexture = textures[0];
    mDestinationTexture = textures[1];
    mFramebuffer = framebuffers[0];
    mVertexBuffer = buffers[0];
    EXGLContextMapObject(exglCtxId, exglObjId, mDestinationTexture);

    mCameraSurfaceTexture = new SurfaceTexture(mExternalOESTexture);

    mSession.setCameraTextureName(mExternalOESTexture); // .setPreviewTexture(mCameraSurfaceTexture);

    // allocate buffers
    mQuadTexCoord = allocateFloatBuffer(textureCoords);
    mQuadTexCoordTransformed = allocateFloatBuffer(textureCoords);

    glActiveTexture(GL_TEXTURE1);

    // setup external texture
    glBindTexture(GL_TEXTURE_EXTERNAL_OES, mExternalOESTexture);
    glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    ARGLUtils.checkGLError(TAG, "PREPARING EXTERNAL TEXTURE");

    // setup destination texture
    glBindTexture(GL_TEXTURE_2D, mDestinationTexture);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    ARGLUtils.checkGLError(TAG, "PREPARING DESTINATION TEXTURE");

    // bind destination texture to framebuffer
    glBindFramebuffer(GL_DRAW_FRAMEBUFFER, mFramebuffer);
    glFramebufferTexture2D(GL_DRAW_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, mDestinationTexture, 0);
    ARGLUtils.checkGLError(TAG, "PREPARING DRAW FRAMEBUFFER");

    // initialize vertex array with vertex buffer
    FloatBuffer vertexBuffer = setupVertexBuffer();

    glBindBuffer(GL_ARRAY_BUFFER, mVertexBuffer);
    glBufferData(GL_ARRAY_BUFFER, textureCoords.length * 4, vertexBuffer, GL_STATIC_DRAW);
    ARGLUtils.checkGLError(TAG, "BINDING ARRAY BUFFER");
    mARGLContextManager.restoreGLContext();
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

    float[] transformMatrix = new float[16];

    glUseProgram(mProgram);
    glBindBuffer(GL_ARRAY_BUFFER, mVertexBuffer);
    glBindFramebuffer(GL_DRAW_FRAMEBUFFER, mFramebuffer);
    ARGLUtils.checkGLError(TAG, "PROGRAM AND BINDINGS");

    if (frame.hasDisplayGeometryChanged()) {
      frame.transformDisplayUvCoords(mQuadTexCoord, mQuadTexCoordTransformed);
    }

    glEnableVertexAttribArray(mPositionHandler);
    glVertexAttribPointer(mPositionHandler, 2, GL_FLOAT, false, 4 * 2, 0);
    ARGLUtils.checkGLError(TAG, "VERTEX ATTRIB");

//    glEnableVertexAttribArray(mTransformHandler);
//    glVertexAttribPointer(mTransformHandler, 2, GL_FLOAT, false, FLOAT_SIZE * 2, mQuadTexCoord);

    // reallocate destination texture if preview size has changed
    if (mTextureWidth != previewWidth || mTextureHeight != previewHeight) {
      mTextureWidth = previewWidth;
      mTextureHeight = previewHeight;
      glBindTexture(GL_TEXTURE_2D, mDestinationTexture);
      glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, mTextureWidth, mTextureHeight, 0, GL_RGBA, GL_UNSIGNED_BYTE, null);
      mCameraSurfaceTexture.setDefaultBufferSize(previewWidth, previewHeight);
    }

    // update external texture and get transformation matrix
    mCameraSurfaceTexture.updateTexImage();
    mCameraSurfaceTexture.getTransformMatrix(transformMatrix);
    // set uniforms
    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_EXTERNAL_OES, mExternalOESTexture);
    glUniform1i(mTextureHandler, 1);
    ARGLUtils.checkGLError(TAG, "EXTERNAL TEXTURE");

    glUniformMatrix4fv(mTransformHandler, 1, false, transformMatrix, 0);

    // change viewport to fit the texture and draw
    glViewport(0, 0, mTextureWidth, mTextureHeight);
    glDrawArrays(GL_TRIANGLES, 0, 6); // 6 vertices -> 2 triangles
    ARGLUtils.checkGLError(TAG, "DRAW ARRAYS");

    // Disable stuff
    glDisableVertexAttribArray(mPositionHandler);
    glDisableVertexAttribArray(mTransformHandler);

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
