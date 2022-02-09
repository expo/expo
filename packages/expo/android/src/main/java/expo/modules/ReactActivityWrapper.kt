package expo.modules

import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.MotionEvent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate

class ReactActivityWrapper : ReactActivity() {
  private val reactActivityListeners = ExpoModulesPackage.packageList
    .flatMap { it.createReactActivityListeners(application) }

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    val delegate = super.createReactActivityDelegate()
    return reactActivityListeners.asSequence()
      .mapNotNull { it.createReactActivityDelegate(this, delegate) }
      .firstOrNull() ?: delegate
  }

  override fun onNewIntent(intent: Intent?) {
    reactActivityListeners.forEach {
      if (it.onNewIntent(this, intent)) {
        return@onNewIntent
      }
    }
    super.onNewIntent(intent)
  }

  override fun onPostCreate(savedInstanceState: Bundle?) {
    super.onPostCreate(savedInstanceState)
    reactActivityListeners.forEach {
      it.onPostCreate(savedInstanceState, reactNativeHost)
    }
  }

  override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
    reactActivityListeners.forEach {
      if (it.dispatchTouchEvent(ev)) {
        return@dispatchTouchEvent true
      }
    }
    return super.dispatchTouchEvent(ev)
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
    reactActivityListeners.forEach {
      if (it.onKeyUp(keyCode, event)) {
        return@onKeyUp true
      }
    }
    return super.onKeyUp(keyCode, event)
  }
}