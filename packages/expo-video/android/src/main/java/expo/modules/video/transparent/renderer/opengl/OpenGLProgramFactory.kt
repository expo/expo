package expo.modules.video.transparent.renderer.opengl

import android.graphics.SurfaceTexture
import android.opengl.GLES11Ext
import android.opengl.GLES20
import android.util.Log
import expo.modules.video.transparent.renderer.OpenGLProgram
import expo.modules.video.transparent.renderer.shader.FRAGMENT_SHADER_SOURCE
import expo.modules.video.transparent.renderer.shader.VERTEX_SHADER_SOURCE

internal object OpenGLProgramFactory {
  fun create(): OpenGLProgram? = createNativeProgram()?.let { nativeProgram ->
    OpenGLProgram(
      nativeProgram = nativeProgram,
      positionInSurfaceHandle = createHandle(
        handleName = "positionInSurface",
        program = nativeProgram,
        glMethod = GLES20::glGetAttribLocation
      ),
      positionInTextureHandle = createHandle(
        handleName = "positionInTexture",
        program = nativeProgram,
        glMethod = GLES20::glGetAttribLocation
      ),
      surfaceTransformMatrixHandle = createHandle(
        handleName = "surfaceTransformMatrix",
        program = nativeProgram,
        glMethod = GLES20::glGetUniformLocation
      ),
      surfaceTexture = createSurfaceTexture()
    )
  }

  private fun createHandle(
    handleName: String,
    program: Int,
    glMethod: (Int, String) -> Int
  ): Int = glMethod(program, handleName)
    .takeIf { it != -1 }
    .also { checkOpenGLError("createHandle $handleName") }
    ?: throw RuntimeException("$glMethod failed for $handleName")

  private fun createSurfaceTexture(): SurfaceTexture = IntArray(1)
    .also { GLES20.glGenTextures(1, it, 0) }
    .first()
    .also { textureId ->
      GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, textureId)
      GLES20.glTexParameterf(
        GLES11Ext.GL_TEXTURE_EXTERNAL_OES,
        GLES20.GL_TEXTURE_MIN_FILTER,
        GLES20.GL_NEAREST.toFloat()
      )
      GLES20.glTexParameterf(
        GLES11Ext.GL_TEXTURE_EXTERNAL_OES,
        GLES20.GL_TEXTURE_MAG_FILTER,
        GLES20.GL_LINEAR.toFloat()
      )
      checkOpenGLError("createTexture")
    }
    .let { SurfaceTexture(it) }

  private fun loadShader(shaderType: Int, source: String): Int? = GLES20
    .glCreateShader(shaderType)
    .takeIf { it != 0 }
    ?.also { shader ->
      GLES20.glShaderSource(shader, source)
      GLES20.glCompileShader(shader)
    }
    ?.let { shader ->
      if (getShaderCompileStatus(shader) != 0) return@let shader
      Log.e(
        this::class.simpleName,
        "Error compiling shader $shaderType:\n${GLES20.glGetShaderInfoLog(shader)}"
      )
      GLES20.glDeleteShader(shader)
      null
    }
    .also { checkOpenGLError("loadShader") }

  private fun getShaderCompileStatus(shader: Int): Int = IntArray(1)
    .also { GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, it, 0) }
    .first()
    .also { checkOpenGLError("getCompileStatus") }

  private fun createNativeProgram(): Int? = GLES20.glCreateProgram()
    .takeIf { it != 0 }
    ?.also { program ->
      val vertexShader = loadShader(GLES20.GL_VERTEX_SHADER, VERTEX_SHADER_SOURCE)
        ?: return null
      val pixelShader = loadShader(GLES20.GL_FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)
        ?: return null
      GLES20.glAttachShader(program, vertexShader)
      GLES20.glAttachShader(program, pixelShader)
      GLES20.glLinkProgram(program)
      val linkStatus = IntArray(1)
      GLES20.glGetProgramiv(program, GLES20.GL_LINK_STATUS, linkStatus, 0)
      GLES20.glDeleteShader(vertexShader)
      GLES20.glDeleteShader(pixelShader)
      if (linkStatus[0] != GLES20.GL_TRUE) {
        Log.e(
          this::class.simpleName,
          "Could not link program: \n${GLES20.glGetProgramInfoLog(program)}"
        )
        GLES20.glDeleteProgram(program)
        return null
      }
    }
    .also { checkOpenGLError("createProgram") }
}
