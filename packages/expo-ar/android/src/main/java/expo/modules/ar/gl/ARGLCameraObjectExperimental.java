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

public class ARGLCameraObjectExperimental extends GLObject {
  private final String TAG = ARGLCameraObjectExperimental.class.getSimpleName();
  private final String ERROR_TAG = "E_CAMERA_OBJECT";

  private static final int COORDS_PER_VERTEX = 2;
  private static final int TEXCOORDS_PER_VERTEX = 2;
  private static final int FLOAT_SIZE = 4;

  private final Context mContext;
  private final Session mSession;
  private final GLView mGLView;

  private ARGLContextManager mARGLContextManager;
  private SurfaceTexture mCameraSurfaceTexture;

  private FloatBuffer mVerticesBuffer;
  private FloatBuffer mTextureCoordBuffer;
  private FloatBuffer mTextureCoordTransformedBuffer;

  private int mProgram = -1;
  private int mExternalOESTexture = -1;
  private int mDestinationTexture = -1;
  private int mFramebuffer = -1;

  private int mPositionHandler = -1;
  private int mTextureCoordHandler = -1;
  private int uSamplerHandler = -1;

  private int mTextureWidth = -1;
  private int mTextureHeight = -1;

  private static final float[] VERTEX_COORDS =
      new float[] {
          -1.0f, -1.0f,
          -1.0f, +1.0f,
          +1.0f, -1.0f,

          -1.0f, +1.0f,
          +1.0f, -1.0f,
          +1.0f, +1.0f,
      };

  private static final float[] TEXTURE_COORDS =
      new float[] {
          0.0f, 1.0f,
          0.0f, 0.0f,
          1.0f, 1.0f,

          0.0f, 0.0f,
          1.0f, 1.0f,
          1.0f, 0.0f,
      };

  public ARGLCameraObjectExperimental(Context context, Session session, GLView glView) {
    super(glView.getGLContext().getContextId());
    mContext = context;
    mSession = session;
    mGLView = glView;
    mARGLContextManager = new ARGLContextManager();
  }

  private void setupShaderProgram() {
    mProgram = ARGLUtils.createProgram(mContext, R.raw.camera_experimental_vertex_shader, R.raw.camera_experimental_fragment_shader);
    ARGLUtils.checkGLError(TAG, "CREATE PROGRAM");

    mPositionHandler = glGetAttribLocation(mProgram, "aPosition");
    mTextureCoordHandler = glGetAttribLocation(mProgram, "aTextureCoord");
    uSamplerHandler = glGetUniformLocation(mProgram, "uSampler");
    ARGLUtils.checkGLError(TAG, "PROGRAM ATTRIBUTES");
  }

  private void setupTextures() {
    int[] textures = new int[2];
    glGenTextures(2, textures, 0);
    mExternalOESTexture = textures[0];
    mDestinationTexture = textures[1];

    glActiveTexture(GL_TEXTURE10);

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

    ARGLUtils.checkGLError(TAG, "TEXTURES");
  }

  private void setupVertexBuffers() {
    int verticesCount = VERTEX_COORDS.length / COORDS_PER_VERTEX;

    ByteBuffer bbVertices = ByteBuffer.allocateDirect(VERTEX_COORDS.length * FLOAT_SIZE);
    bbVertices.order(ByteOrder.nativeOrder());
    mVerticesBuffer = bbVertices.asFloatBuffer();
    mVerticesBuffer.put(VERTEX_COORDS);
    mVerticesBuffer.position(0);

    ByteBuffer bbTextureCoords = ByteBuffer.allocateDirect(verticesCount * TEXCOORDS_PER_VERTEX * FLOAT_SIZE);
    bbTextureCoords.order(ByteOrder.nativeOrder());
    mTextureCoordBuffer = bbTextureCoords.asFloatBuffer();
    mTextureCoordBuffer.put(TEXTURE_COORDS);
    mTextureCoordBuffer.position(0);

    ByteBuffer bbTextureCoordsTransformed = ByteBuffer.allocateDirect(verticesCount * TEXCOORDS_PER_VERTEX * FLOAT_SIZE);
    bbTextureCoordsTransformed.order(ByteOrder.nativeOrder());
    mTextureCoordTransformedBuffer = bbTextureCoordsTransformed.asFloatBuffer();
  }

  public void createOnGLThread() {
    // setup shader program
    setupShaderProgram();

    // setup textures - one connected with camera and one that we're drawing to
    setupTextures();
    EXGLContextMapObject(exglCtxId, exglObjId, mDestinationTexture);
    mCameraSurfaceTexture = new SurfaceTexture(mExternalOESTexture);
    // pass externalOES texture (camera one) to AR session
    mSession.setCameraTextureName(mExternalOESTexture);

    setupVertexBuffers();

    int[] framebuffers = new int[1];
    glGenFramebuffers(1, framebuffers, 0);
    mFramebuffer = framebuffers[0];
  }

  public void destroy() {
  }

  public Object getCameraTexture() {
    return exglObjId;
  }

  @TargetApi(Build.VERSION_CODES.LOLLIPOP)
  public void drawFrame(Frame frame) {
    if (frame.hasDisplayGeometryChanged()) {
      frame.transformDisplayUvCoords(mTextureCoordBuffer, mTextureCoordTransformedBuffer);
    }

    Size previewSize = mSession.getCameraConfig().getImageSize();

    mARGLContextManager.saveGLContext();

    // no need for depth testing
    glDisable(GL_DEPTH_TEST);
    glDepthMask(false);

    // reallocate destination texture if preview has changed
    if (mTextureWidth != previewSize.getWidth() || mTextureHeight != previewSize.getHeight()) {
      mTextureWidth = previewSize.getWidth();
      mTextureHeight = previewSize.getHeight();
      mCameraSurfaceTexture.setDefaultBufferSize(mTextureWidth, mTextureHeight);
      glBindTexture(GL_TEXTURE_2D, mDestinationTexture);
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
      ARGLUtils.checkGLError(TAG, "TEX IMAGE 2D");
    }

    // bind destination texture to framebuffer
    glBindFramebuffer(GL_DRAW_FRAMEBUFFER, mFramebuffer);
    glFramebufferTexture2D(GL_DRAW_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, mDestinationTexture, 0);
    ARGLUtils.checkGLError(TAG, "FRAMEBUFFER TEXTURE 2D");

    glUseProgram(mProgram);
    ARGLUtils.checkGLError(TAG, "USE PROGRAM");

    // set the vertex positions.
    glVertexAttribPointer(
        mPositionHandler,
        COORDS_PER_VERTEX,
        GL_FLOAT,
        false,
        0,
        mVerticesBuffer);
    ARGLUtils.checkGLError(TAG, "VERTEX ATTRIB POINTER");

    // set the texture coordinates.
    glVertexAttribPointer(
        mTextureCoordHandler,
        TEXCOORDS_PER_VERTEX,
        GL_FLOAT,
        false,
        0,
        mTextureCoordTransformedBuffer);
    ARGLUtils.checkGLError(TAG, "VERTEX ATTRIB POINTER");

    // enable vertex arrays
    glEnableVertexAttribArray(mPositionHandler);
    glEnableVertexAttribArray(mTextureCoordHandler);
    ARGLUtils.checkGLError(TAG, "ENABLE VERTEX ATTRIB ARRAY");

    // update external texture and get transformation matrix
    mCameraSurfaceTexture.updateTexImage();

    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_EXTERNAL_OES, mExternalOESTexture);
    glUniform1f(uSamplerHandler, 1);

    glViewport(0, 0, mTextureWidth, mTextureHeight);
    glDrawArrays(GL_TRIANGLES, 0, 6);
    ARGLUtils.checkGLError(TAG, "DRAW ARRAYS");

    // disable vertex arrays
    glDisableVertexAttribArray(mPositionHandler);
    glDisableVertexAttribArray(mTextureCoordHandler);

    // restore the depth state for further drawing.
    glDepthMask(true);
    glEnable(GL_DEPTH_TEST);

    mARGLContextManager.restoreGLContext();
  }
}
