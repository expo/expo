package expo.modules.video.transparent.renderer.opengl

import android.opengl.GLES20
import android.opengl.GLU
import android.util.Log

internal fun checkOpenGLError(tag: String) {
  val error = GLES20.glGetError()
  if (error != GLES20.GL_NO_ERROR) {
    val errorString = GLU.gluErrorString(error)
    val exception = RuntimeException("$tag: glError $error : $errorString")
    Log.e(tag, null, exception)
    throw exception
  }
}
