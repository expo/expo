package abi48_0_0.host.exp.exponent.modules.api.safeareacontext

import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import androidx.annotation.RequiresApi
import java.lang.IllegalArgumentException
import kotlin.math.max
import kotlin.math.min

@RequiresApi(Build.VERSION_CODES.R)
private fun getRootWindowInsetsCompatR(rootView: View): EdgeInsets? {
  val insets =
    rootView.rootWindowInsets?.getInsets(
      WindowInsets.Type.statusBars() or
        WindowInsets.Type.displayCutout() or
        WindowInsets.Type.navigationBars()
    )
      ?: return null
  return EdgeInsets(
    top = insets.top.toFloat(),
    right = insets.right.toFloat(),
    bottom = insets.bottom.toFloat(),
    left = insets.left.toFloat()
  )
}

@RequiresApi(Build.VERSION_CODES.M)
@Suppress("DEPRECATION")
private fun getRootWindowInsetsCompatM(rootView: View): EdgeInsets? {
  val insets = rootView.rootWindowInsets ?: return null
  return EdgeInsets(
    top = insets.systemWindowInsetTop.toFloat(),
    right = insets.systemWindowInsetRight.toFloat(),
    // System insets are more reliable to account for notches but the
    // system inset for bottom includes the soft keyboard which we don't
    // want to be consistent with iOS. Using the min value makes sure we
    // never get the keyboard offset while still working with devices that
    // hide the navigation bar.
    bottom = min(insets.systemWindowInsetBottom, insets.stableInsetBottom).toFloat(),
    left = insets.systemWindowInsetLeft.toFloat()
  )
}

private fun getRootWindowInsetsCompatBase(rootView: View): EdgeInsets? {
  val visibleRect = android.graphics.Rect()
  rootView.getWindowVisibleDisplayFrame(visibleRect)
  return EdgeInsets(
    top = visibleRect.top.toFloat(),
    right = (rootView.width - visibleRect.right).toFloat(),
    bottom = (rootView.height - visibleRect.bottom).toFloat(),
    left = visibleRect.left.toFloat()
  )
}

private fun getRootWindowInsetsCompat(rootView: View): EdgeInsets? {
  return when {
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.R -> getRootWindowInsetsCompatR(rootView)
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.M -> getRootWindowInsetsCompatM(rootView)
    else -> getRootWindowInsetsCompatBase(rootView)
  }
}

fun getSafeAreaInsets(view: View): EdgeInsets? {
  // The view has not been layout yet.
  if (view.height == 0) {
    return null
  }
  val rootView = view.rootView
  val windowInsets = getRootWindowInsetsCompat(rootView) ?: return null

  // Calculate the part of the view that overlaps with window insets.
  val windowWidth = rootView.width.toFloat()
  val windowHeight = rootView.height.toFloat()
  val visibleRect = android.graphics.Rect()
  view.getGlobalVisibleRect(visibleRect)
  return EdgeInsets(
    top = max(windowInsets.top - visibleRect.top, 0f),
    right = max(min(visibleRect.left + view.width - windowWidth, 0f) + windowInsets.right, 0f),
    bottom = max(min(visibleRect.top + view.height - windowHeight, 0f) + windowInsets.bottom, 0f),
    left = max(windowInsets.left - visibleRect.left, 0f)
  )
}

fun getFrame(rootView: ViewGroup, view: View): Rect? {
  // This can happen while the view gets unmounted.
  if (view.parent == null) {
    return null
  }
  val offset = android.graphics.Rect()
  view.getDrawingRect(offset)
  try {
    rootView.offsetDescendantRectToMyCoords(view, offset)
  } catch (ex: IllegalArgumentException) {
    // This can throw if the view is not a descendant of rootView. This should not
    // happen but avoid potential crashes.
    ex.printStackTrace()
    return null
  }
  return Rect(
    x = offset.left.toFloat(),
    y = offset.top.toFloat(),
    width = view.width.toFloat(),
    height = view.height.toFloat()
  )
}
