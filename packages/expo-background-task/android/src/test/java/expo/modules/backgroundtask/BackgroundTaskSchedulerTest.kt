package expo.modules.backgroundtask

import androidx.work.NetworkType
import org.junit.Assert.assertEquals
import org.junit.Test

class BackgroundTaskSchedulerTest {
  @Test
  fun `requiring network connectivity keeps the CONNECTED constraint`() {
    val constraints = BackgroundTaskScheduler.buildConstraints(requiresNetworkConnectivity = true)

    assertEquals(NetworkType.CONNECTED, constraints.requiredNetworkType)
  }

  @Test
  fun `opting out of network connectivity leaves the work unconstrained`() {
    val constraints = BackgroundTaskScheduler.buildConstraints(requiresNetworkConnectivity = false)

    assertEquals(NetworkType.NOT_REQUIRED, constraints.requiredNetworkType)
  }

  @Test
  fun `the default keeps network connectivity required`() {
    val constraints =
      BackgroundTaskScheduler.buildConstraints(BackgroundTaskScheduler.DEFAULT_REQUIRES_NETWORK_CONNECTIVITY)

    assertEquals(NetworkType.CONNECTED, constraints.requiredNetworkType)
  }
}
