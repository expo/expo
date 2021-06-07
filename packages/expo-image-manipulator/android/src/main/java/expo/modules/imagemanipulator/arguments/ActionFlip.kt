package expo.modules.imagemanipulator.arguments

import android.graphics.Matrix

enum class ActionFlip(private val mType: String, private val mSx: Float, private val mSy: Float) {
  VERTICAL("vertical", 1, -1), HORIZONTAL("horizontal", -1, 1);

  val rotationMatrix: Matrix
    get() {
      val rotationMatrix = Matrix()
      rotationMatrix.postScale(mSx, mSy)
      return rotationMatrix
    }

  companion object {
    @Throws(IllegalArgumentException::class)
    fun fromObject(o: Any): ActionFlip {
      val errorMessage = "Action 'flip' must be one of ['vertical', 'horizontal']. Obtained '$o'"
      require(o is String) { errorMessage }
      for (af in values()) {
        if (af.mType == o) {
          return af
        }
      }
      throw IllegalArgumentException(errorMessage)
    }
  }
}
