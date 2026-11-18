package expo.modules.appmetrics

import android.content.Context
import android.content.pm.PackageManager
import androidx.core.os.bundleOf
import androidx.test.core.app.ApplicationProvider
import expo.modules.appmetrics.crashreporting.CrashFileFormat
import io.mockk.every
import io.mockk.mockk
import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class ObserveConsentTest {
  private val context: Context = ApplicationProvider.getApplicationContext()

  @Before
  fun setUp() {
    context.getSharedPreferences("dev.expo.app-metrics", Context.MODE_PRIVATE).edit().clear().commit()
  }

  @Test
  fun `absent consent value grants consent`() {
    assertTrue(ObserveConsent.resolve(null, null))
  }

  @Test
  fun `consent value granted grants consent`() {
    assertTrue(ObserveConsent.resolve(null, "granted"))
  }

  @Test
  fun `consent value not-granted denies consent`() {
    assertFalse(ObserveConsent.resolve(null, "not-granted"))
  }

  @Test
  fun `unknown consent value denies consent`() {
    assertFalse(ObserveConsent.resolve(null, "pending"))
    assertFalse(ObserveConsent.resolve(null, ""))
  }

  @Test
  fun `saved value overrides the manifest value`() {
    assertFalse(ObserveConsent.resolve("not-granted", "granted"))
    assertTrue(ObserveConsent.resolve("granted", "not-granted"))
    assertFalse(ObserveConsent.resolve("not-granted", null))
  }

  @Test
  fun `load reads the consent value from the manifest meta-data`() {
    setManifestConsent("granted")
    ObserveConsent.load(context)
    assertTrue(ObserveConsent.isLoaded)
    assertTrue(ObserveConsent.isGranted)

    // Last, so the other tests still start without consent.
    setManifestConsent("not-granted")
    ObserveConsent.load(context)
    assertFalse(ObserveConsent.isGranted)
  }

  @Test
  fun `load denies consent when the manifest cannot be read`() {
    setManifestConsent("granted")
    ObserveConsent.load(context)
    val unreadable = mockk<Context> {
      every { packageName } returns "missing"
      every { packageManager.getApplicationInfo("missing", PackageManager.GET_META_DATA) } throws
        PackageManager.NameNotFoundException()
    }

    ObserveConsent.load(unreadable)

    assertFalse(ObserveConsent.isGranted)
  }

  private fun setManifestConsent(consent: String) {
    shadowOf(context.packageManager).getInternalMutablePackageInfo(context.packageName).applicationInfo!!.metaData =
      bundleOf("expo.modules.observe.CONSENT" to consent)
  }

  @Test
  fun `deleteStoredData deletes the database, crash files, pending errors, and settings`() {
    val database = context.getDatabasePath("app_metrics").apply {
      parentFile?.mkdirs()
      writeText("db")
    }
    val crashFile = File(CrashFileFormat.crashesDir(context), "crash-1-1.json").apply {
      parentFile?.mkdirs()
      writeText("{}")
    }
    val pendingError = File(context.noBackupFilesDir, "ExpoAppMetrics/pending-errors/error.json").apply {
      parentFile?.mkdirs()
      writeText("{}")
    }
    context.getSharedPreferences("dev.expo.app-metrics", Context.MODE_PRIVATE).edit().putString("environment", "production").commit()

    deleteStoredData(context)

    assertFalse(database.exists())
    assertFalse(crashFile.exists())
    assertFalse(pendingError.exists())
    assertTrue(context.getSharedPreferences("dev.expo.app-metrics", Context.MODE_PRIVATE).all.isEmpty())
  }
}
