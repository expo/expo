package expo.modules.notifications.tokens

import androidx.test.core.app.ApplicationProvider
import com.google.android.gms.tasks.OnCompleteListener
import com.google.android.gms.tasks.Task
import com.google.firebase.messaging.FirebaseMessaging
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.slot
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.unimodules.test.core.PromiseMock
import org.unimodules.test.core.assertRejected
import org.unimodules.test.core.assertResolved

@RunWith(RobolectricTestRunner::class)
class PushTokenModuleTest {
  private val deleteTokenTask = mockk<Task<Void>>()
  private val firebaseMessaging: FirebaseMessaging = mockk()
  private lateinit var module: PushTokenModule

  @Before
  fun setup() {
    module = PushTokenModule(ApplicationProvider.getApplicationContext())

    mockkStatic(FirebaseMessaging::class)
    every { FirebaseMessaging.getInstance() } returns firebaseMessaging
    every { firebaseMessaging.deleteToken() } returns deleteTokenTask

    val deleteTokenTaskSlot = slot<OnCompleteListener<Void>>()
    every { deleteTokenTask.addOnCompleteListener(capture(deleteTokenTaskSlot)) } answers {
      deleteTokenTaskSlot.captured.onComplete(deleteTokenTask)
      deleteTokenTask
    }
    every { firebaseMessaging.deleteToken() } returns deleteTokenTask
  }

  @Test
  fun `unregisterForNotificationsAsync when no error resolves promise`() {
    every { deleteTokenTask.isSuccessful } returns true

    val promise = PromiseMock()
    module.unregisterForNotificationsAsync(promise)

    assertResolved(promise)
  }

  @Test
  fun `unregisterForNotificationsAsync when error rejects promise`() {
    every { deleteTokenTask.isSuccessful } returns false
    every { deleteTokenTask.exception } returns Exception("Error deleting notification token.")

    val promise = PromiseMock()
    module.unregisterForNotificationsAsync(promise)

    assertRejected(promise)
  }
}
