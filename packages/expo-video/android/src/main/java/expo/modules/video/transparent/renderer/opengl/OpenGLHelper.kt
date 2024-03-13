package expo.modules.video.transparent.renderer.opengl

import android.opengl.GLES20
import android.opengl.Matrix
import expo.modules.video.transparent.renderer.OpenGLProgram
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer

/**
 * This helper is intended to be used in the renderer to execute openGL commands to draw a square
 */
internal object OpenGLHelper {
  /**
   * Vertices positions are formatted like so :
   *
   * X1, Y1, Z1, U1, V1,
   * X2, Y2, Z2, U2, V2,
   * X3, Y3, Z3, U3, V3,
   * X4, Y4, Z4, U4, V4
   *
   * Where :
   *  - Xn, Yn, Zn are respectively the x, y, z coordinates of the nth vertex in the surface
   *  - Un, Vn are respectively x, y coordinates of the nth vertex in the texture
   */
  private val verticesDefinition = floatArrayOf(
    -1.0f, -1.0f, 0f, 0f, 0f,
    1.0f, -1.0f, 0f, 1f, 0f,
    -1.0f, 1.0f, 0f, 0f, 1f,
    1.0f, 1.0f, 0f, 1f, 1f
  )

  private const val VERTEX_DEFINITION_DIMENSION = 5
  private const val FIRST_VERTEX_INDEX = 0
  private const val VERTEX_COUNT = 4
  private const val BUFFER_START_POSITION_FOR_SURFACE = 0
  private const val BUFFER_START_POSITION_FOR_TEXTURE = 3
  private const val SURFACE_VERTEX_DIMENSION = 3
  private const val TEXTURE_VERTEX_DIMENSION = 2
  private const val TRANSFORM_MATRIX_COUNT = 1
  private const val TRANSFORM_MATRIX_OFFSET = 0
  private const val TRANSFORM_MATRIX_INITIAL_VALUE = 0f

  fun createVerticesBuffer(): FloatBuffer = ByteBuffer
    .allocateDirect(verticesDefinition.size * Float.SIZE_BYTES)
    .order(ByteOrder.nativeOrder())
    .asFloatBuffer()
    .apply { put(verticesDefinition).position(BUFFER_START_POSITION_FOR_SURFACE) }

  fun draw() {
    GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, FIRST_VERTEX_INDEX, VERTEX_COUNT)
    GLES20.glFinish()
    checkOpenGLError(OpenGLHelper::draw.name)
  }

  fun setVertexPositionsInSurface(verticesBuffer: FloatBuffer, parameterHandle: Int) {
    setVertexPositions(
      verticesBuffer = verticesBuffer,
      parameterHandle = parameterHandle,
      bufferOffset = BUFFER_START_POSITION_FOR_SURFACE,
      vertexDimension = SURFACE_VERTEX_DIMENSION
    )
  }

  fun setVertexPositionsInTexture(verticesBuffer: FloatBuffer, parameterHandle: Int) {
    setVertexPositions(
      verticesBuffer = verticesBuffer,
      parameterHandle = parameterHandle,
      bufferOffset = BUFFER_START_POSITION_FOR_TEXTURE,
      vertexDimension = TEXTURE_VERTEX_DIMENSION
    )
  }

  private fun setVertexPositions(
    verticesBuffer: FloatBuffer,
    parameterHandle: Int,
    bufferOffset: Int,
    vertexDimension: Int
  ) {
    verticesBuffer.position(bufferOffset)
    GLES20.glVertexAttribPointer(
      parameterHandle,
      vertexDimension,
      GLES20.GL_FLOAT,
      false,
      VERTEX_DEFINITION_DIMENSION * Float.SIZE_BYTES,
      verticesBuffer
    )
    GLES20.glEnableVertexAttribArray(parameterHandle)
    checkOpenGLError(OpenGLHelper::setVertexPositions.name)
  }

  fun updateTexture(program: OpenGLProgram) {
    program.surfaceTexture.updateTexImage()
    checkOpenGLError(OpenGLHelper::updateTexture.name)
  }

  fun updateTransformMatrix(program: OpenGLProgram) {
    val surfaceTransformMatrix = FloatArray(
      size = 16,
      init = { TRANSFORM_MATRIX_INITIAL_VALUE }
    )
      .apply { Matrix.setIdentityM(this, TRANSFORM_MATRIX_OFFSET) }
    program.surfaceTexture.getTransformMatrix(surfaceTransformMatrix)
    GLES20.glUniformMatrix4fv(
      program.surfaceTransformMatrixHandle,
      TRANSFORM_MATRIX_COUNT,
      false,
      surfaceTransformMatrix,
      TRANSFORM_MATRIX_OFFSET
    )
    checkOpenGLError(OpenGLHelper::updateTransformMatrix.name)
  }
}
