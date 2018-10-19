package expo.modules.ar.gl;

import static android.opengl.GLES20.GL_ACTIVE_TEXTURE;
import static android.opengl.GLES20.GL_ARRAY_BUFFER;
import static android.opengl.GLES20.GL_ARRAY_BUFFER_BINDING;
import static android.opengl.GLES20.GL_CURRENT_PROGRAM;
import static android.opengl.GLES20.GL_TEXTURE_2D;
import static android.opengl.GLES20.GL_TEXTURE_BINDING_2D;
import static android.opengl.GLES20.GL_VIEWPORT;
import static android.opengl.GLES20.glActiveTexture;
import static android.opengl.GLES20.glBindBuffer;
import static android.opengl.GLES20.glBindFramebuffer;
import static android.opengl.GLES20.glBindTexture;
import static android.opengl.GLES20.glGetIntegerv;
import static android.opengl.GLES20.glUseProgram;
import static android.opengl.GLES20.glViewport;
import static android.opengl.GLES30.GL_DRAW_FRAMEBUFFER;
import static android.opengl.GLES30.GL_DRAW_FRAMEBUFFER_BINDING;
import static android.opengl.GLES30.GL_VERTEX_ARRAY_BINDING;
import static android.opengl.GLES30.glBindVertexArray;

public class ARGLContextManager {
  private int[] mPrevFramebuffer = new int[1];
  private int[] mPrevPrograms = new int[1];
  private int[] mPrevActiveTexture = new int[1];
  private int[] mPrevTexture = new int[1];
  private int[] mPrevVertexArray = new int[1];
  private int[] mViewport = new int[4];
  private int[] mPrevArrayBuffer = new int[1];

  public void saveGLContext() {
    glGetIntegerv(GL_ARRAY_BUFFER_BINDING, mPrevArrayBuffer, 0);
    glGetIntegerv(GL_DRAW_FRAMEBUFFER_BINDING, mPrevFramebuffer, 0);
    glGetIntegerv(GL_TEXTURE_BINDING_2D, mPrevTexture, 0);
    glGetIntegerv(GL_ACTIVE_TEXTURE, mPrevActiveTexture, 0);
    glGetIntegerv(GL_CURRENT_PROGRAM, mPrevPrograms, 0);
    glGetIntegerv(GL_VIEWPORT, mViewport, 0);
    glGetIntegerv(GL_VERTEX_ARRAY_BINDING, mPrevVertexArray, 0);
  }

  public void restoreGLContext() {
    glBindBuffer(GL_ARRAY_BUFFER, mPrevArrayBuffer[0]);
    glBindFramebuffer(GL_DRAW_FRAMEBUFFER, mPrevFramebuffer[0]);
    glActiveTexture(mPrevActiveTexture[0]);
    glBindTexture(GL_TEXTURE_2D, mPrevTexture[0]);
    glUseProgram(mPrevPrograms[0]);
    glViewport(mViewport[0], mViewport[1], mViewport[2], mViewport[3]);
    glBindVertexArray(mPrevVertexArray[0]);
  }
}
