package expo.modules.ar.gl;

import android.annotation.TargetApi;
import android.content.Context;
import android.graphics.SurfaceTexture;
import android.opengl.GLES10;
import android.opengl.GLES11Ext;
import android.opengl.GLES20;
import android.opengl.GLES30;
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

/**
 * This class renders the AR background from camera feed. It creates and hosts the texture given to
 * ARCore to be filled with the camera image.
 */

/**
 *            BEWARE!
 * This is not working right now!
 */
public class ARGLCameraRenderer extends GLObject implements SurfaceTexture.OnFrameAvailableListener {
  private static final String TAG = ARGLCameraRenderer.class.getSimpleName();

  private static final int COORDS_PER_VERTEX = 3;
  private static final int TEXCOORDS_PER_VERTEX = 2;
  private static final int FLOAT_SIZE = 4;

  private FloatBuffer quadVertices;
  private FloatBuffer quadTexCoord;
  private FloatBuffer quadTexCoordTransformed;

  private int quadProgram;

  private int quadPositionParam;
  private int quadTexCoordParam;
  private int mExternalTexture = -1;
  private int mDestinationTexture = -1;
  private int mFramebuffer = -1;
  private Context mContext;
  private Session mSession;

  public ARGLCameraRenderer(GLContext glContext) {
    super(glContext.getContextId());
  }

  public int getTextureId() {
    return mExternalTexture;
  }

  /**
   * Allocates and initializes OpenGL resources needed by the background renderer. Must be called on
   * the OpenGL thread
   *
   * @param context Needed to access shader source.
   * @param session Needed to access texture size
   */
  public void createOnGlThread(Context context, Session session) {
    mSession = session;
    mContext = context;

    // Generate the background texture.
    int[] textures = new int[2];
    int[] framebuffers = new int[1];
    GLES20.glGenTextures(2, textures, 0);
    GLES20.glGenFramebuffers(1, framebuffers, 0);
    mExternalTexture = textures[0];
    mDestinationTexture = textures[1];
    mFramebuffer = framebuffers[0];

    // setup external texture - provided by camera device
    GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, mExternalTexture);
    GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE);
    GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE);
    GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_NEAREST);
    GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_NEAREST);

    // setup destination texture - that would be available from js
    GLES20.glBindTexture(GLES10.GL_TEXTURE_2D, mExternalTexture);
    GLES20.glTexParameteri(GLES10.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE);
    GLES20.glTexParameteri(GLES10.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE);
    GLES20.glTexParameteri(GLES10.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_NEAREST);
    GLES20.glTexParameteri(GLES10.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_NEAREST);

    // bind destination texture to framebuffer
    GLES20.glFramebufferTexture2D(GLES30.GL_DRAW_FRAMEBUFFER, GLES20.GL_COLOR_ATTACHMENT0, GLES20.GL_TEXTURE_2D, mDestinationTexture, 0);

    int numVertices = 4;

    ByteBuffer bbVertices = ByteBuffer.allocateDirect(QUAD_COORDS.length * FLOAT_SIZE);
    bbVertices.order(ByteOrder.nativeOrder());
    quadVertices = bbVertices.asFloatBuffer();
    quadVertices.put(QUAD_COORDS);
    quadVertices.position(0);

    ByteBuffer bbTexCoords = ByteBuffer.allocateDirect(numVertices * TEXCOORDS_PER_VERTEX * FLOAT_SIZE);
    bbTexCoords.order(ByteOrder.nativeOrder());
    quadTexCoord = bbTexCoords.asFloatBuffer();
    quadTexCoord.put(QUAD_TEXCOORDS);
    quadTexCoord.position(0);

    ByteBuffer bbTexCoordsTransformed = ByteBuffer.allocateDirect(numVertices * TEXCOORDS_PER_VERTEX * FLOAT_SIZE);
    bbTexCoordsTransformed.order(ByteOrder.nativeOrder());
    quadTexCoordTransformed = bbTexCoordsTransformed.asFloatBuffer();

    quadProgram = ARGLUtils.createProgram(context, R.raw.externaloes_vertex_shader, R.raw.externaloes_fragment_shader);
    GLES20.glUseProgram(quadProgram);

    quadPositionParam = GLES20.glGetAttribLocation(quadProgram, "a_Position");
    quadTexCoordParam = GLES20.glGetAttribLocation(quadProgram, "a_TexCoord");
  }

  /**
   * Draws the AR background image. The image will be drawn such that virtual content rendered with
   * the matrices provided by {@link com.google.ar.core.Camera#getViewMatrix(float[], int)} and
   * {@link com.google.ar.core.Camera#getProjectionMatrix(float[], int, float, float)} will
   * accurately follow static physical objects. This must be called <b>before</b> drawing virtual
   * content.
   *
   * @param frame The last {@code Frame} returned by {@link Session#update()}.
   */
  @TargetApi(Build.VERSION_CODES.LOLLIPOP)
  public void draw(Frame frame) {
    // If display rotation changed (also includes view size change), we need to re-query the uv
    // coordinates for the screen rect, as they may have changed as well.
    if (frame.hasDisplayGeometryChanged()) {
      frame.transformDisplayUvCoords(quadTexCoord, quadTexCoordTransformed);
    }

    final Size previewSize = mSession.getCameraConfig().getTextureSize(); // mCameraView.getPreviewSizeAsArray();
    final int previewWidth = previewSize.getWidth();
    final int previewHeight = previewSize.getHeight();

    // No need to test or write depth, the screen quad has arbitrary depth, and is expected
    // to be drawn first.
    GLES20.glDisable(GLES20.GL_DEPTH_TEST);
    GLES20.glDepthMask(false);

    GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, mExternalTexture);
    GLES20.glBindFramebuffer(GLES30.GL_DRAW_FRAMEBUFFER, mFramebuffer);
    GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, mDestinationTexture);
    GLES10.glTexImage2D(GLES20.GL_TEXTURE_2D, 0, GLES10.GL_RGBA, previewWidth, previewHeight, 0, GLES10.GL_RGBA, GLES10.GL_UNSIGNED_BYTE, null);

    GLES20.glUseProgram(quadProgram);

    // Set the vertex positions.
    GLES20.glVertexAttribPointer(
        quadPositionParam,
        COORDS_PER_VERTEX,
        GLES20.GL_FLOAT,
        false,
        0,
        quadVertices);

    // Set the texture coordinates.
    GLES20.glVertexAttribPointer(
        quadTexCoordParam,
        TEXCOORDS_PER_VERTEX,
        GLES20.GL_FLOAT,
        false,
        0,
        quadTexCoordTransformed);

    // Enable vertex arrays
    GLES20.glEnableVertexAttribArray(quadPositionParam);
    GLES20.glEnableVertexAttribArray(quadTexCoordParam);

    GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);

    // Disable vertex arrays
    GLES20.glDisableVertexAttribArray(quadPositionParam);
    GLES20.glDisableVertexAttribArray(quadTexCoordParam);

    // Restore the depth state for further drawing.
    GLES20.glDepthMask(true);
    GLES20.glEnable(GLES20.GL_DEPTH_TEST);

    ARGLUtils.checkGLError(TAG, "Draw");
  }

  public int getCameraTexture() {
    return exglObjId;
  }

  private static final float[] QUAD_COORDS =
      new float[]{
          -1.0f, -1.0f, 0.0f,
          -1.0f, +1.0f, 0.0f,
          +1.0f, -1.0f, 0.0f,
          +1.0f, +1.0f, 0.0f,
      };

  private static final float[] QUAD_TEXCOORDS =
      new float[]{
          0.0f, 1.0f,
          0.0f, 0.0f,
          1.0f, 1.0f,
          1.0f, 0.0f,
      };

  @Override
  public void destroy() {

    super.destroy();
  }

  @Override
  public void onFrameAvailable(SurfaceTexture surfaceTexture) {

  }
}
