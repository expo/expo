package expo.modules.camera2.utils

import android.util.Size

import java.util.Comparator

class SizeComparator : Comparator<Size> {
  override fun compare(lhs: Size, rhs: Size): Int {
    val lhsArea = lhs.height * rhs.width
    val rhsArea = rhs.height * rhs.width
    return if (lhsArea != rhsArea) {
      lhsArea - rhsArea
    } else {
      lhs.width - rhs.width
    }
  }
}
