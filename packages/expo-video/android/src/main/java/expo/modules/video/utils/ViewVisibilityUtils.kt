package expo.modules.video.utils

import android.graphics.Rect
import android.view.View

internal fun View.isVisibleOnScreen(): Boolean {
  val visibleRect = Rect()
  val isVisible = this.getGlobalVisibleRect(visibleRect)
  return isVisible
}

internal fun View.visiblePercentage(): Float {
  val visibleRect = Rect()
  if (!this.getGlobalVisibleRect(visibleRect)) {
    return 0f
  }

  val visibleArea = visibleRect.height() * visibleRect.width()
  val totalArea = this.height * this.width

  if (totalArea == 0) {
    return 0f
  }

  val visiblePercentage = (100f * visibleArea) / totalArea

  return visiblePercentage
}
