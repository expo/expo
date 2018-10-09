package expo.modules.ar.gl;

import android.content.Context;
import android.opengl.GLES20;
import android.util.Log;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

import static android.opengl.GLES20.GL_COMPILE_STATUS;
import static android.opengl.GLES20.GL_FRAGMENT_SHADER;
import static android.opengl.GLES20.GL_LINK_STATUS;
import static android.opengl.GLES20.GL_TRUE;
import static android.opengl.GLES20.GL_VERTEX_SHADER;
import static android.opengl.GLES20.glAttachShader;
import static android.opengl.GLES20.glCompileShader;
import static android.opengl.GLES20.glCreateProgram;
import static android.opengl.GLES20.glCreateShader;
import static android.opengl.GLES20.glDeleteProgram;
import static android.opengl.GLES20.glDeleteShader;
import static android.opengl.GLES20.glGetProgramInfoLog;
import static android.opengl.GLES20.glGetProgramiv;
import static android.opengl.GLES20.glGetShaderInfoLog;
import static android.opengl.GLES20.glGetShaderiv;
import static android.opengl.GLES20.glLinkProgram;
import static android.opengl.GLES20.glShaderSource;

/** Shader helper functions. */
public class ARGLShaderUtils {
  private static final String TAG = ARGLShaderUtils.class.getSimpleName();

  public static int createProgram(final Context context, final int vertexShaderResourceId, final int fragmentShaderResourceId) throws RuntimeException {
    final int vertexShader = loadGLShader(context, vertexShaderResourceId, GL_VERTEX_SHADER);
    final int fragmentShader = loadGLShader(context, fragmentShaderResourceId, GL_FRAGMENT_SHADER);
    final int program = glCreateProgram();
    glAttachShader(program, vertexShader);
    glAttachShader(program, fragmentShader);
    glLinkProgram(program);

    // Cleanup shaders after linking
    glDeleteShader(vertexShader);
    glDeleteShader(fragmentShader);

    final int[] linkingStatus = new int[1];
    glGetProgramiv(program, GL_LINK_STATUS, linkingStatus, 0);
    if (linkingStatus[0] != GL_TRUE) {
      Log.e(TAG, "Error linking program: " + glGetProgramInfoLog(program));
      glDeleteProgram(program);
      throw new RuntimeException("Error creating program.");
    }

    return program;
  }
  /**
   * Converts a raw text file, saved as a resource, into an OpenGL ES shader.
   *
   * @param type The type of shader we will be creating.
   * @param filename The filename of the asset file about to be turned into a shader.
   * @return The shader object handler.
   */
  public static int loadGLShader(String tag, Context context, int type, String filename)
      throws IOException {
    String code = readRawTextFileFromAssets(context, filename);
    int shader = GLES20.glCreateShader(type);
    GLES20.glShaderSource(shader, code);
    GLES20.glCompileShader(shader);

    // Get the compilation status.
    final int[] compileStatus = new int[1];
    GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, compileStatus, 0);

    // If the compilation failed, delete the shader.
    if (compileStatus[0] == 0) {
      Log.e(tag, "Error compiling shader: " + GLES20.glGetShaderInfoLog(shader));
      GLES20.glDeleteShader(shader);
      shader = 0;
    }

    if (shader == 0) {
      throw new RuntimeException("Error creating shader.");
    }

    return shader;
  }

  /**
   * Checks if we've had an error inside of OpenGL ES, and if so what that error is.
   *
   * @param label Label to report in case of error.
   * @throws RuntimeException If an OpenGL error is detected.
   */
  public static void checkGLError(String tag, String label) {
    int lastError = GLES20.GL_NO_ERROR;
    // Drain the queue of all errors.
    int error;
    while ((error = GLES20.glGetError()) != GLES20.GL_NO_ERROR) {
      Log.e(tag, label + ": glError " + error);
      lastError = error;
    }
    if (lastError != GLES20.GL_NO_ERROR) {
      throw new RuntimeException(label + ": glError " + lastError);
    }
  }

  /**
   * Converts a raw text file into a string.
   *
   * @param filename The filename of the asset file about to be turned into a shader.
   * @return The context of the text file, or null in case of error.
   */
  private static String readRawTextFileFromAssets(Context context, String filename)
      throws IOException {
    try (InputStream inputStream = context.getAssets().open(filename);
         BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
      StringBuilder sb = new StringBuilder();
      String line;
      while ((line = reader.readLine()) != null) {
        sb.append(line).append("\n");
      }
      return sb.toString();
    }
  }


  private static int loadGLShader(final Context context, final int resourceId, int type) throws RuntimeException {
    String code = readRawShaderFile(context, resourceId);
    int shader = glCreateShader(type);
    glShaderSource(shader, code);
    glCompileShader(shader);

    // Get the compilation status.
    final int[] compileStatus = new int[1];
    glGetShaderiv(shader, GL_COMPILE_STATUS, compileStatus, 0);

    // If the compilation failed, delete the shader.
    if (compileStatus[0] == 0) {
      Log.e(TAG, "Error compiling shader: " + glGetShaderInfoLog(shader));
      glDeleteShader(shader);
      throw new RuntimeException("Error creating shader.");
    }

    return shader;
  }

  /**
   * Converts a raw shader resource file into a string.
   */
  private static String readRawShaderFile(Context context, final int resourceId) {
    final BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(context.getResources().openRawResource(resourceId)));

    final StringBuilder body = new StringBuilder();
    String nextLine;
    try {
      while ((nextLine = bufferedReader.readLine()) != null) {
        body.append(nextLine);
        body.append('\n');
      }
    } catch (IOException e) {
      Log.e(TAG, "Error reading shader file: " + e.getMessage());
      return null;
    }

    return body.toString();
  }

}
