package expo.modules.devlauncher.helpers

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.google.common.truth.Truth
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.util.*

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [21])
internal class DevLauncherInstallationIDHelperTest {
  private val context: Context = ApplicationProvider.getApplicationContext()

  @Test
  fun `installationID is persisted in memory`() {
    val installationIDHelper = DevLauncherInstallationIDHelper()
    val installationID1 = installationIDHelper.getOrCreateInstallationID(context)
    val installationID2 = installationIDHelper.getOrCreateInstallationID(context)
    Truth.assertThat(installationID1).isEqualTo(installationID2)

    // format should be a valid UUID
    Truth.assertThat(UUID.fromString(installationID1)).isNotNull()
  }

  @Test
  fun `installationID is persisted in storage`() {
    // two different instances of the same class should return the same ID
    // since it's persisted to and read from disk
    val installationIDHelper1 = DevLauncherInstallationIDHelper()
    val installationID1 = installationIDHelper1.getOrCreateInstallationID(context)

    val installationIDHelper2 = DevLauncherInstallationIDHelper()
    val installationID2 = installationIDHelper2.getOrCreateInstallationID(context)

    Truth.assertThat(installationID1).isEqualTo(installationID2)
  }
}
