package expo.modules.ar.gl;

import android.annotation.TargetApi;
import android.content.Context;
import android.os.Build;
import android.util.Size;

import com.google.ar.core.Frame;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;

import expo.modules.ar.R;
import expo.modules.gl.GLObject;
import expo.modules.gl.context.GLSharedContext;

import static android.opengl.GLES11Ext.GL_TEXTURE_EXTERNAL_OES;
import static android.opengl.GLES30.*;
import static expo.modules.gl.cpp.EXGL.EXGLContextMapObject;

/**
 * This class is responsible for rendering 'texture' (stored as texture_external_oes)
 * that is obtained from camera device into normal OpenGL texture.
 * All rendering and setup should be done in separate GL shared context.
 */
public class ARGLCameraObject extends GLObject {
  private final String TAG = ARGLCameraObject.class.getSimpleName();
  private final String ERROR_TAG = "E_CAMERA_OBJECT";

  private static final int COORDS_PER_VERTEX = 2;
  private static final int TEXCOORDS_PER_VERTEX = 2;
  private static final int FLOAT_SIZE = 4;

  private final Context mContext;

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
          +1.0f, +1.0f,
      };

  private static final float[] TEXTURE_COORDS =
      new float[] {
          0.0f, 1.0f,
          0.0f, 0.0f,
          1.0f, 1.0f,
          1.0f, 0.0f,
      };

  public ARGLCameraObject(Context context, GLSharedContext glContext) {
    super(glContext.getEXGLContextId());
    mContext = context;
  }

  private void setupShaderProgram() {
    mProgram = ARGLUtils.createProgram(mContext, R.raw.camera_vertex_shader, R.raw.camera_fragment_shader);
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

    // make mDestinationTexture be available from JS
    EXGLContextMapObject(exglCtxId, exglObjId, mDestinationTexture);

    glActiveTexture(GL_TEXTURE0);

    // setup external texture
    glBindTexture(GL_TEXTURE_EXTERNAL_OES, mExternalOESTexture);
    glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MIN_FILTER, GL_LINEAR);

    // setup destination texture
    glBindTexture(GL_TEXTURE_2D, mDestinationTexture);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);

    // connect framebuffer with mDestinationTexture -> rendering to this would be stored in this texture
    glBindFramebuffer(GL_DRAW_FRAMEBUFFER, mFramebuffer);
    glFramebufferTexture2D(
        GL_DRAW_FRAMEBUFFER,
        GL_COLOR_ATTACHMENT0,
        GL_TEXTURE_2D,
        mDestinationTexture,
        0);

    ARGLUtils.checkGLError(TAG, "TEXTURES");
  }

  /**
   * Prepare Buffer with data that will be directly passed to GL using {@link android.opengl.GLES30#glVertexAttribPointer}
   * using last parameter and {@link android.opengl.GLES30#GL_ARRAY_BUFFER} set to 0
   */
  private void setupVertexBuffers() {
    int verticesCount = VERTEX_COORDS.length / COORDS_PER_VERTEX;

    ByteBuffer bbVertices = ByteBuffer.allocateDirect(VERTEX_COORDS.length * FLOAT_SIZE);
    bbVertices.order(ByteOrder.nativeOrder()); // LITTLE or BIG ENDIANESS - platform depending
    mVerticesBuffer = bbVertices.asFloatBuffer();
    mVerticesBuffer.put(VERTEX_COORDS);
    mVerticesBuffer.position(0);

    ByteBuffer bbTextureCoords = ByteBuffer.allocateDirect(verticesCount * TEXCOORDS_PER_VERTEX * FLOAT_SIZE);
    bbTextureCoords.order(ByteOrder.nativeOrder()); // LITTLE or BIG ENDIANESS - platform depending
    mTextureCoordBuffer = bbTextureCoords.asFloatBuffer();
    mTextureCoordBuffer.put(TEXTURE_COORDS);
    mTextureCoordBuffer.position(0);

    ByteBuffer bbTextureCoordsTransformed = ByteBuffer.allocateDirect(verticesCount * TEXCOORDS_PER_VERTEX * FLOAT_SIZE);
    bbTextureCoordsTransformed.order(ByteOrder.nativeOrder()); // LITTLE or BIG ENDIANESS - platform depending
    mTextureCoordTransformedBuffer = bbTextureCoordsTransformed.asFloatBuffer();
    mTextureCoordBuffer.put(TEXTURE_COORDS);
    mTextureCoordBuffer.position(0);
  }

  public void initializeOnGLThread() {
    // general setup
    glDisable(GL_DEPTH_TEST);
    glDepthMask(false);
    glDisable(GL_CULL_FACE);

    // setup framebuffer that would be used for rendering to texture as substitute for default GL_DRAW_FRAMEBUFFER
    int[] framebuffers = new int[1];
    glGenFramebuffers(1, framebuffers, 0);
    mFramebuffer = framebuffers[0];

    // setup shader program
    setupShaderProgram();

    // setup textures - one connected to camera and one that we're drawing to (available form JS)
    setupTextures();

    // prepare buffers with data for GL
    setupVertexBuffers();
    ARGLUtils.checkGLError(TAG, "CREATION");
  }

  public void destroy() {
  }

  public Object getJSAvailableCameraTexture() {
    return exglObjId;
  }

  public int getCameraTexture() {
    return mExternalOESTexture;
  }

  /**
   * Renders available frame available in {@link this#mExternalOESTexture}
   * into {@link this#mDestinationTexture} that is available from JS
   * @param frame used to get correct orientation for {@link this#mDestinationTexture}
   * @param textureSize current size of texture stored in {@link this#mExternalOESTexture}; used to allocate space for {@link this#mDestinationTexture}
   */
  public void drawFrame(Frame frame, Size textureSize) {
    // bindings used in rendering process
    glUseProgram(mProgram);
    glBindFramebuffer(GL_DRAW_FRAMEBUFFER, mFramebuffer);
    glViewport(0, 0, mTextureWidth, mTextureHeight);
    glClearColor(0, 0, 0, 0);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    ARGLUtils.checkGLError(TAG, "PROGRAM, DRAW_FRAMEBUFFER BINDINGS");

    // reallocate destination texture if preview has changed
    possiblyReallocateTexture(textureSize);

    // set the vertex positions
    // binding 0 to GL_ARRAY_BUFFER is important see https://www.khronos.org/registry/OpenGL-Refpages/es3.0/html/glVertexAttribPointer.xhtml pointer param description
    glBindBuffer(GL_ARRAY_BUFFER, 0);
    glVertexAttribPointer(
        mPositionHandler,
        COORDS_PER_VERTEX,
        GL_FLOAT,
        false,
        TEXCOORDS_PER_VERTEX * FLOAT_SIZE,
        mVerticesBuffer);
    ARGLUtils.checkGLError(TAG, "VERTEX ATTRIB POINTER");

    // upon first frame it always is true
    if (frame.hasDisplayGeometryChanged()) {
      // BEWARE!
      // mTextureCoordTransformedBuffer will be filled correctly only if Session is instructed
      // about orientation before obtaining Frame from Session (see invocation of this method and what's happening just before)
      // in other case mTextureCoordTransformedBuffer will be filled with NaN as it doesn't know it's orientation
      frame.transformDisplayUvCoords(mTextureCoordBuffer, mTextureCoordTransformedBuffer);

      // code below is useful for debugging purposes
//      float[] plain = new float[8];
//      float[] transformed = new float[8];
//      mTextureCoordBuffer.get(plain);
//      mTextureCoordBuffer.position(0);
//      mTextureCoordTransformedBuffer.get(transformed);
//      mTextureCoordTransformedBuffer.position(0);
//      Log.d(TAG + "_PLAIN", Arrays.toString(plain));
//      Log.d(TAG + "_TRANSFORMED", Arrays.toString(transformed));
    }
    // set the texture coordinates by passing correctly filled mTextureCoordTransformedBuffer (see above)
    glBindBuffer(GL_ARRAY_BUFFER, 0);
    glVertexAttribPointer(
        mTextureCoordHandler,
        TEXCOORDS_PER_VERTEX,
        GL_FLOAT,
        false,
        TEXCOORDS_PER_VERTEX * FLOAT_SIZE,
        mTextureCoordTransformedBuffer);
    ARGLUtils.checkGLError(TAG, "VERTEX ATTRIB POINTER");

    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_EXTERNAL_OES, mExternalOESTexture);
    ARGLUtils.checkGLError(TAG, "EXTERNAL TEXTURE");
    glUniform1i(uSamplerHandler, 0);
    ARGLUtils.checkGLError(TAG, "SAMPLER");

    // pass data to GL
    glEnableVertexAttribArray(mTextureCoordHandler);
    glEnableVertexAttribArray(mPositionHandler);
    ARGLUtils.checkGLError(TAG, "ENABLE VERTEX ATTRIB ARRAY");

    glDrawArrays(GL_TRIANGLE_STRIP, 0, 4); // 4 vertices -> 2 triangles using GL_TRIANGLE_STRIP
    ARGLUtils.checkGLError(TAG, "DRAW ARRAYS");
    glFinish();

    // disable vertex arrays
    glDisableVertexAttribArray(mPositionHandler);
    glDisableVertexAttribArray(mTextureCoordHandler);
  }

  @TargetApi(Build.VERSION_CODES.LOLLIPOP)
  private void possiblyReallocateTexture(Size textureSize) {
    int width = textureSize.getWidth();
    int height = textureSize.getHeight();

    if (mTextureWidth != width || mTextureHeight != height) {
      mTextureWidth = width;
      mTextureHeight = height;
      glActiveTexture(GL_TEXTURE0);
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
  }
}
