package expo.modules.splashscreen

import android.app.Activity
import android.app.Dialog
import android.os.Bundle
import android.view.WindowManager
import androidx.annotation.StyleRes


class SplashScreenDialog(
  activity: Activity,
  @StyleRes resId: Int,
  private val fade: Boolean
) : Dialog(activity, resId) {

  init {
    setOwnerActivity(activity)
    setCancelable(false)
    setCanceledOnTouchOutside(false)
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    window?.let {
      it.setLayout(
        WindowManager.LayoutParams.MATCH_PARENT,
        WindowManager.LayoutParams.MATCH_PARENT
      )

      it.setWindowAnimations(if (fade) {
        R.style.SplashScreenFadeOutAnimation
      } else {
        R.style.SplashScreenNoAnimation
      })
    }
    super.onCreate(savedInstanceState)
  }

  override fun onBackPressed() {
    ownerActivity?.moveTaskToBack(true)
  }

  override fun dismiss() {
    if (!isShowing) {
      return
    }

    try {
      super.dismiss()
    } catch (_: Exception) {
    }
  }

  fun dismiss(execute: () -> Unit) {
    if (!isShowing) {
      execute()
      return
    }

    setOnDismissListener {
      execute()
    }

    try {
      super.dismiss()
    } catch (e: Exception) {
      execute()
    }
  }

  override fun show() {
    if (isShowing) {
      return
    }

    try {
      super.show()
    } catch (_: Exception) {
    }
  }

  fun show(execute: () -> Unit) {
    if (isShowing) {
      execute()
      return
    }

    setOnShowListener {
      execute()
    }

    try {
      super.show()
    } catch (e: Exception) {
      execute()
    }
  }
}