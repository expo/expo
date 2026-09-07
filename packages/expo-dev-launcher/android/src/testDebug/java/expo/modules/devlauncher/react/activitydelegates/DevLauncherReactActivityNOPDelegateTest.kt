package expo.modules.devlauncher.react.activitydelegates

import android.view.KeyEvent
import com.facebook.react.ReactActivity
import com.google.common.truth.Truth
import io.mockk.mockk
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class DevLauncherReactActivityNOPDelegateTest {
  @Test
  fun `key events do not crash after the delegate was invalidated`() {
    val delegate = DevLauncherReactActivityNOPDelegate(mockk<ReactActivity>())
    val event = KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_A)
    Truth.assertThat(delegate.onKeyDown(KeyEvent.KEYCODE_A, event)).isFalse()
    Truth.assertThat(delegate.onKeyUp(KeyEvent.KEYCODE_A, event)).isFalse()
    Truth.assertThat(delegate.onKeyLongPress(KeyEvent.KEYCODE_A, event)).isFalse()
  }
}
