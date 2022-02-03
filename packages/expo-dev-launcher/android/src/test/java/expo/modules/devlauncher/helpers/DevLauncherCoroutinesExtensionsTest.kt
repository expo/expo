package expo.modules.devlauncher.helpers

import android.os.Looper
import com.google.common.truth.Truth
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class DevLauncherCoroutinesExtensionsTest {
  @Test
  fun `checks if runBlockingOnMainThread runs on main thread`() {
    runBlockingOnMainThread {
      Truth.assertThat(Thread.currentThread()).isEqualTo(Looper.getMainLooper().thread)
    }
  }
}
