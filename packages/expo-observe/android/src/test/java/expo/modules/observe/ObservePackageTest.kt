package expo.modules.observe

import android.app.Application
import androidx.test.core.app.ApplicationProvider
import expo.modules.appmetrics.sessions.SessionSharedObject
import expo.modules.observe.storage.SessionManager
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class ObservePackageTest {
  @Test
  fun `the application listener registers the database sink, even if it runs twice`() =
    runBlocking {
      val application = ApplicationProvider.getApplicationContext<Application>()
      val listeners = ObservePackage().createApplicationLifecycleListeners(application)
      // A host that also runs the `ObserveModule` `OnCreate` fallback calls this twice.
      // Registering the same sink again must stay a no-op.
      listeners.forEach { it?.onCreate(application) }
      listeners.forEach { it?.onCreate(application) }

      val session = SessionSharedObject(type = "main")
      session.start()
      // The sink orders the end after the session insert.
      session.stop()

      val row = SessionManager(application).getSessionRow(session.sessionId)
      assertNotNull(row?.endTimestamp)
      // Pins the on-disk file name: renaming it in MetricsDatabase.kt loses every installed app's
      // unsent data, since the new file starts empty.
      assertTrue(application.getDatabasePath("app_metrics").exists())
    }
}
