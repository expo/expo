package expo.modules.notifications.service.delegates

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import expo.modules.notifications.notifications.NotificationManager
import expo.modules.notifications.notifications.interfaces.NotificationListener
import expo.modules.notifications.service.NotificationsService.Companion.GOOGLE_MESSAGE_ID_KEY
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.android.controller.ActivityController

@RunWith(RobolectricTestRunner::class)
class ExpoNotificationLifecycleListenerTest {
  private val responses = mutableListOf<Bundle>()
  private val listener = object : NotificationListener {
    override fun onNotificationResponseIntentReceived(extras: Bundle): Boolean {
      responses.add(extras)
      return true
    }
  }
  private lateinit var controller: ActivityController<NotificationActivity>

  @Before
  fun setup() {
    NotificationManager.addListener(listener)
  }

  @After
  fun teardown() {
    if (::controller.isInitialized) {
      controller.pause().stop().destroy()
    }
    NotificationManager.removeListener(listener)
  }

  @Test
  fun `recreation does not replay a response or suppress a different message`() {
    startActivity(notificationIntent("first"))

    controller.recreate()

    assertEquals(1, responses.size)
    assertEquals("first", controller.get().intent.getStringExtra(GOOGLE_MESSAGE_ID_KEY))
    assertEquals("first", responses.single().getString(GOOGLE_MESSAGE_ID_KEY))
    assertFalse(responses.single().containsKey("expo.modules.notifications.consumedMessageId"))

    controller.get().intent.putExtra(GOOGLE_MESSAGE_ID_KEY, "second")
    controller.recreate()
    controller.recreate()

    assertEquals(listOf("first", "second"), responses.map { it.getString(GOOGLE_MESSAGE_ID_KEY) })
  }

  @Test
  fun `onCreate does not replay a new intent stored by the activity`() {
    startActivity(Intent())
    val intent = notificationIntent("new-intent")

    assertFalse(ExpoNotificationLifecycleListener().onNewIntent(intent))
    controller.get().intent = intent
    ExpoNotificationLifecycleListener().onCreate(controller.get(), null)

    assertEquals(1, responses.size)
    assertEquals("new-intent", controller.get().intent.getStringExtra(GOOGLE_MESSAGE_ID_KEY))
    assertEquals("new-intent", responses.single().getString(GOOGLE_MESSAGE_ID_KEY))
    assertFalse(responses.single().containsKey("expo.modules.notifications.consumedMessageId"))
  }

  @Test
  fun `a queued response is delivered once across recreation and listener registration`() {
    NotificationManager.removeListener(listener)
    startActivity(notificationIntent("queued"))
    controller.recreate()

    NotificationManager.addListener(listener)
    controller.recreate()

    assertEquals(1, responses.size)
    assertEquals("queued", responses.single().getString(GOOGLE_MESSAGE_ID_KEY))
  }

  private fun startActivity(intent: Intent) {
    controller = Robolectric.buildActivity(NotificationActivity::class.java, intent).setup()
  }

  private fun notificationIntent(messageId: String) = Intent().putExtra(GOOGLE_MESSAGE_ID_KEY, messageId)

  class NotificationActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
      super.onCreate(savedInstanceState)
      ExpoNotificationLifecycleListener().onCreate(this, savedInstanceState)
    }
  }
}
