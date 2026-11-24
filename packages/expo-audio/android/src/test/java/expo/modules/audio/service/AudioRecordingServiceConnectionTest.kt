package expo.modules.audio.service

import android.content.ComponentName
import android.content.Context
import android.content.ServiceConnection
import android.util.Log
import expo.modules.audio.AudioRecorder
import expo.modules.audio.AudioRecordingServiceException
import expo.modules.kotlin.AppContext
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.mockkStatic
import io.mockk.unmockkObject
import io.mockk.unmockkStatic
import io.mockk.verify
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.lang.ref.WeakReference
import kotlin.concurrent.thread

class AudioRecordingServiceConnectionTest {
  private val reactContext = mockk<Context>(relaxed = true)
  private val appContext = mockk<AppContext>(relaxed = true) {
    every { reactContext } returns this@AudioRecordingServiceConnectionTest.reactContext
  }
  private val recorder = mockk<AudioRecorder>(relaxed = true)
  private var serviceAppContext: AppContext? = null
  private val service = mockk<AudioRecordingService>(relaxed = true) {
    every { appContext = any() } answers { serviceAppContext = firstArg() }
  }
  private val binder = mockk<AudioRecordingServiceBinder> {
    every { service } returns this@AudioRecordingServiceConnectionTest.service
  }
  private val connection = AudioRecordingServiceConnection(WeakReference(recorder), appContext)

  @Before
  fun setUp() {
    mockkObject(BaseServiceConnection.Companion)
    mockkStatic(Log::class)
    every { Log.d(any(), any()) } returns 0
  }

  @After
  fun tearDown() {
    unmockkObject(BaseServiceConnection.Companion)
    unmockkStatic(Log::class)
  }

  /** Makes `startServiceAndBind` run [onBind] with the connection, then return [result]. */
  private fun onStartServiceAndBind(result: Boolean = true, onBind: (ServiceConnection) -> Unit = {}) {
    every {
      BaseServiceConnection.startServiceAndBind(any(), any(), any(), any<Class<AudioRecordingService>>(), any())
    } answers {
      onBind(thirdArg())
      result
    }
  }

  private fun ServiceConnection.connect() {
    onServiceConnected(mockk<ComponentName>(), binder)
  }

  private fun ServiceConnection.connectLater() {
    thread(isDaemon = true) {
      Thread.sleep(50)
      connect()
    }
  }

  @Test
  fun bindsWhenTheServiceConnectsBeforeBindServiceReturns() {
    // The system delivers `onServiceConnected` on the main thread as soon as the service is up,
    // which can be before `bindService` has returned on the thread that called it.
    onStartServiceAndBind { it.connect() }

    runBlocking { connection.bindWithService() }

    assertEquals(ServiceBindingState.BOUND, connection.bindingState)
    assertSame(binder, connection.recordingServiceBinder)
  }

  @Test
  fun bindsWhenTheServiceConnectsAfterBindServiceReturns() {
    onStartServiceAndBind { it.connectLater() }

    runBlocking { connection.bindWithService() }

    assertEquals(ServiceBindingState.BOUND, connection.bindingState)
    assertSame(binder, connection.recordingServiceBinder)
  }

  @Test
  fun failsAndAllowsRetryingWhenBindServiceReturnsFalse() {
    onStartServiceAndBind(result = false)

    assertThrows(AudioRecordingServiceException::class.java) {
      runBlocking { connection.bindWithService() }
    }
    assertEquals(ServiceBindingState.UNBOUND, connection.bindingState)
    // `bindService` registers the connection even when it returns false.
    verify(exactly = 1) { reactContext.unbindService(connection) }

    onStartServiceAndBind { it.connectLater() }
    runBlocking { connection.bindWithService() }
    assertTrue(connection.isConnected)
  }

  @Test
  fun failsAndAllowsRetryingWhenStartingTheServiceThrows() {
    // For example, `startService` throws when the app is not allowed to start a service from the background.
    every {
      BaseServiceConnection.startServiceAndBind(any(), any(), any(), any<Class<AudioRecordingService>>(), any())
    } throws IllegalStateException("Not allowed to start service")
    every { reactContext.unbindService(any()) } throws IllegalArgumentException("Service not registered")

    assertThrows(IllegalStateException::class.java) {
      runBlocking { connection.bindWithService() }
    }
    assertEquals(ServiceBindingState.UNBOUND, connection.bindingState)

    onStartServiceAndBind { it.connectLater() }
    runBlocking { connection.bindWithService() }
    assertTrue(connection.isConnected)
  }
}
