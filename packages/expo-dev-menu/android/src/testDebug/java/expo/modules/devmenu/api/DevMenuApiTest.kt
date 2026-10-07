package expo.modules.devmenu.api

import com.facebook.react.devsupport.interfaces.DevSupportManager
import io.mockk.mockk
import io.mockk.verify
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class DevMenuApiTest {
  @Test
  fun `disables the React Native shake gesture`() {
    val devSupportManager = mockk<DevSupportManager>(relaxed = true)

    DevMenuApi.uninstallDefaultShakeDetector(devSupportManager)

    verify { devSupportManager.shakeGestureEnabled = false }
  }
}
