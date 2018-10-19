package expo.modules.ar.gl;

import android.content.Context;
import android.opengl.GLES20;
import android.util.Log;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

import static android.opengl.GLES20.GL_COMPILE_STATUS;
import static android.opengl.GLES20.GL_FRAGMENT_SHADER;
import static android.opengl.GLES20.GL_INVALID_ENUM;
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

/** OpenGL helper functions. */
public class ARGLUtils {
  private static final String TAG = ARGLUtils.class.getSimpleName();

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

    ARGLUtils.checkGLError(TAG, "PROGRAM COMPILATION");

    return program;
  }

  /**
   * Checks if we've had an error inside of OpenGL ES, and if so what that error is.
   *
   * @param label Label to report in case of error.
   * @throws RuntimeException If an OpenGL error is detected.
   */
  public static boolean checkGLError(String tag, String label) {
    int error;
    if ((error = GLES20.glGetError()) != GLES20.GL_NO_ERROR) {
      String errorMessage = parseError(error);
      Log.e(tag, label + ": glError " + errorMessage);
      return false;
    }
    return true;
  }

  private static String parseError(int glError) {
    switch (glError) {
      case GLES20.GL_INVALID_ENUM:
        return "INVALID_ENUM";
      case GLES20.GL_INVALID_VALUE:
        return "INVALID_VALUE";
      case GLES20.GL_INVALID_OPERATION:
        return "INVALID OPERATION";
      case GLES20.GL_INVALID_FRAMEBUFFER_OPERATION:
        return "INVALID_FRAMEBUFFER_OPERATION";
      case GLES20.GL_OUT_OF_MEMORY:
        return "OF_OF_MEMORY";
      default:
        return "UNKNOWN ERROR WITH CODE: '" + glError + "'";
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
