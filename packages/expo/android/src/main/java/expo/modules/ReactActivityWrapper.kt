package expo.modules

import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.MotionEvent
import com.facebook.react.ReactActivity

open class ReactActivityWrapper : ReactActivity() {
  private val reactActivityHandlers = ExpoModulesPackage.packageList
    .flatMap { it.createReactActivityHandlers(application) }

  override fun onNewIntent(intent: Intent?) {
    reactActivityHandlers.forEach {
      if (it.onNewIntent(this, intent)) {
        return@onNewIntent
      }
    }
    super.onNewIntent(intent)
  }

  override fun onPostCreate(savedInstanceState: Bundle?) {
    super.onPostCreate(savedInstanceState)
    reactActivityHandlers.forEach {
      it.onPostCreate(savedInstanceState, reactNativeHost)
    }
  }

  override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
    reactActivityHandlers.forEach {
      if (it.dispatchTouchEvent(ev)) {
        return@dispatchTouchEvent true
      }
    }
    return super.dispatchTouchEvent(ev)
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
    reactActivityHandlers.forEach {
      if (it.onKeyUp(keyCode, event)) {
        return@onKeyUp true
      }
    }
    return super.onKeyUp(keyCode, event)
  }
}