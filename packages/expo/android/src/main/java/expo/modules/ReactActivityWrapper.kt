package expo.modules

import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.MotionEvent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import java.lang.reflect.Field
import java.lang.reflect.Modifier

open class ReactActivityWrapper : ReactActivity() {
  private val reactActivityListeners = ExpoModulesPackage.packageList
    .flatMap { it.createReactActivityListeners(application) }

  init {
    // TODO: as an alternative, try not wrapping delegate object but instead just listening to
    //  onCreate event and calling the methods from DevLauncherReactActivityRedirectDelegate there
    val delegateField = ReactActivity::class.java.getDeclaredField("mDelegate")
    delegateField.isAccessible = true
    val delegate = delegateField.get(this) as ReactActivityDelegate

    val newDelegate = reactActivityListeners.asSequence()
      .mapNotNull { it.onDidCreateReactActivityDelegate(this, delegate) }
      .firstOrNull()

    if (newDelegate != null && newDelegate != delegate) {
      val modifiers = Field::class.java.getDeclaredField("accessFlags")
      modifiers.isAccessible = true
      modifiers.setInt(delegateField, delegateField.modifiers and Modifier.FINAL.inv())
      delegateField.set(this, newDelegate)
    }
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