package expo.modules.updates.errorrecovery

import android.os.Message
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.launcher.Launcher
import expo.modules.updates.logging.UpdatesLogger
import io.mockk.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4ClassRunner::class)
class ErrorRecoveryTest {
  private var mockDelegate: ErrorRecoveryDelegate = mockk()
  private val context = InstrumentationRegistry.getInstrumentation().targetContext.applicationContext
  private val updatesLogger = UpdatesLogger(context)
  private var errorRecovery: ErrorRecovery = ErrorRecovery(updatesLogger)

  @Before
  fun setup() {
    mockDelegate = mockk(relaxed = true)
    errorRecovery = ErrorRecovery(updatesLogger)
    errorRecovery.initialize(mockDelegate)
    errorRecovery.handler = spyk(ErrorRecoveryHandler(errorRecovery.handlerThread.looper, mockDelegate, UpdatesLogger(context)))
    // make handler run synchronously
    val messageSlot = slot<Message>()
    every { errorRecovery.handler.sendMessageAtTime(capture(messageSlot), any()) } answers {
      val message = messageSlot.captured
      if (message.callback != null) {
        message.callback.run()
      } else {
        errorRecovery.handler.handleMessage(message)
      }
      return@answers true
    }
    every { errorRecovery.handler.postDelayed(any(), any()) } answers {
      return@answers true
    }
    every { mockDelegate.getLaunchedUpdateSuccessfulLaunchCount() } returns 0
    every { mockDelegate.getCheckAutomaticallyConfiguration() } returns UpdatesConfiguration.CheckAutomaticallyConfiguration.ALWAYS

    // exclude getters so we can use `confirmVerified` to ensure we are tracking each delegate action
    excludeRecords { mockDelegate.getLaunchedUpdateSuccessfulLaunchCount() }
    excludeRecords { mockDelegate.getRemoteLoadStatus() }
    excludeRecords { mockDelegate.getCheckAutomaticallyConfiguration() }
  }

  @Test
  fun testHandleException_NewWorkingUpdateAlreadyLoaded() {
    every { mockDelegate.getRemoteLoadStatus() } returns ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADED
    mockRelaunchWillSucceed()

    errorRecovery.handleException(mockk())
    verifySequence {
      mockDelegate.markFailedLaunchForLaunchedUpdate()
      mockDelegate.relaunch(any())
    }
  }

  @Test
  fun testHandleException_NewWorkingUpdateAlreadyLoaded_ContentAppeared() {
    every { mockDelegate.getRemoteLoadStatus() } returns ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADED

    errorRecovery.handleContentAppeared()
    verify { mockDelegate.markSuccessfulLaunchForLaunchedUpdate() }

    errorRecovery.handleException(mockk())
    verify { mockDelegate.throwException(any()) }
    confirmVerified(mockDelegate)
  }

  @Test
  fun testHandleException_NewUpdateLoaded_RelaunchFails() {
    every { mockDelegate.getRemoteLoadStatus() } returns ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADED
    mockRelaunchWillFail()

    errorRecovery.handleException(mockk())
    verifySequence {
      mockDelegate.markFailedLaunchForLaunchedUpdate()
      mockDelegate.relaunch(any())
      mockDelegate.throwException(any())
    }
  }

  @Test
  fun testHandleException_NewWorkingUpdateLoading() {
    every { mockDelegate.getRemoteLoadStatus() } returns ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING
    mockRelaunchWillSucceed()

    errorRecovery.handleException(mockk())
    verify { mockDelegate.markFailedLaunchForLaunchedUpdate() }
    confirmVerified(mockDelegate)

    errorRecovery.notifyNewRemoteLoadStatus(ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADED)
    verify { mockDelegate.relaunch(any()) }
    confirmVerified(mockDelegate)
  }

  @Test
  fun testHandleException_NewWorkingUpdateLoading_ContentAppeared() {
    every { mockDelegate.getRemoteLoadStatus() } returns ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING

    errorRecovery.handleContentAppeared()
    verify { mockDelegate.markSuccessfulLaunchForLaunchedUpdate() }

    errorRecovery.handleException(mockk())
    // should wait to be notified of the new status before crashing
    confirmVerified(mockDelegate)

    errorRecovery.notifyNewRemoteLoadStatus(ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADED)
    verify { mockDelegate.throwException(any()) }
    confirmVerified(mockDelegate)
  }

  @Test
  fun testHandleException_NewBrokenUpdateLoaded_WorkingUpdateCached() {
    every { mockDelegate.getRemoteLoadStatus() } returns ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADED
    mockRelaunchWillSucceed()

    errorRecovery.handleException(mockk())
    verifySequence {
      mockDelegate.markFailedLaunchForLaunchedUpdate()
      mockDelegate.relaunch(any())
    }

    // the newly launched update also has an error
    errorRecovery.handleException(mockk())
    verifySequence {
      // from the previous sequence
      mockDelegate.markFailedLaunchForLaunchedUpdate()
      mockDelegate.relaunch(any())
      // new calls
      mockDelegate.markFailedLaunchForLaunchedUpdate()
      mockDelegate.relaunch(any())
    }
  }

  @Test
  fun testHandleException_NewBrokenUpdateLoaded_UpdateAlreadyLaunchedSuccessfully() {
    every { mockDelegate.getLaunchedUpdateSuccessfulLaunchCount() } returns 1
    every { mockDelegate.getRemoteLoadStatus() } returns ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADED
    mockRelaunchWillSucceed()

    errorRecovery.handleException(mockk())
    verifySequence {
      mockDelegate.relaunch(any())
    }

    // the newly launched update will not have been successfully launched before
    every { mockDelegate.getLaunchedUpdateSuccessfulLaunchCount() } returns 0
    // the newly launched update also has an error
    errorRecovery.handleException(mockk())
    verifySequence {
      // from the previous sequence
      mockDelegate.relaunch(any())
      // new calls
      mockDelegate.markFailedLaunchForLaunchedUpdate()
      mockDelegate.throwException(any()) // if an update has already been launched successfully, we don't want to fall back to an older update
    }
  }

  @Test
  fun testHandleException_RemoteLoadTimesOut() {
    every { mockDelegate.getRemoteLoadStatus() } returns ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING
    mockRelaunchWillSucceed()
    mockLoadRemoteUpdateWillTimeOut()

    errorRecovery.handleException(mockk())
    verifySequence {
      mockDelegate.markFailedLaunchForLaunchedUpdate()
      mockDelegate.relaunch(any())
    }
  }

  @Test
  fun testHandleException_RemoteLoadTimesOut_UpdateAlreadyLaunchedSuccessfully() {
    every { mockDelegate.getLaunchedUpdateSuccessfulLaunchCount() } returns 1
    every { mockDelegate.getRemoteLoadStatus() } returns ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING
    mockLoadRemoteUpdateWillTimeOut()

    errorRecovery.handleException(mockk())
    verifySequence {
      mockDelegate.throwException(any())
    }
  }

  @Test
  fun testHandleException_RemoteLoadTimesOut_ContentAppeared() {
    every { mockDelegate.getRemoteLoadStatus() } returns ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING
    mockLoadRemoteUpdateWillTimeOut()

    errorRecovery.handleContentAppeared()
    verify { mockDelegate.markSuccessfulLaunchForLaunchedUpdate() }

    errorRecovery.handleException(mockk())
    verify { mockDelegate.throwException(any()) }
    confirmVerified(mockDelegate)
  }

  @Test
  fun testHandleException_NoRemoteUpdate() {
    every { mockDelegate.getRemoteLoadStatus() } returns ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
    mockRelaunchWillSucceed()

    errorRecovery.handleException(mockk())
    verifySequence {
      mockDelegate.markFailedLaunchForLaunchedUpdate()
      // should try to load a remote update since we don't have one already
      mockDelegate.loadRemoteUpdate()
    }

    // indicate there isn't a new update from the server
    errorRecovery.notifyNewRemoteLoadStatus(ErrorRecoveryDelegate.RemoteLoadStatus.IDLE)
    verify { mockDelegate.relaunch(any()) }
    confirmVerified(mockDelegate)
  }

  @Test
  fun testHandleException_NoRemoteUpdate_ContentAppeared() {
    every { mockDelegate.getRemoteLoadStatus() } returns ErrorRecoveryDelegate.RemoteLoadStatus.IDLE

    errorRecovery.handleContentAppeared()
    verify { mockDelegate.markSuccessfulLaunchForLaunchedUpdate() }

    errorRecovery.handleException(mockk())
    // should try to load a remote update since we don't have one already
    verify { mockDelegate.loadRemoteUpdate() }
    confirmVerified(mockDelegate)

    // indicate there isn't a new update from the server
    errorRecovery.notifyNewRemoteLoadStatus(ErrorRecoveryDelegate.RemoteLoadStatus.IDLE)
    verify { mockDelegate.throwException(any()) }
    confirmVerified(mockDelegate)
  }

  @Test
  fun testHandleException_CheckAutomaticallyNever() {
    every { mockDelegate.getRemoteLoadStatus() } returns ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
    every { mockDelegate.getCheckAutomaticallyConfiguration() } returns UpdatesConfiguration.CheckAutomaticallyConfiguration.NEVER
    mockRelaunchWillSucceed()

    errorRecovery.handleException(mockk())
    verifySequence {
      mockDelegate.markFailedLaunchForLaunchedUpdate()
      mockDelegate.relaunch(any())
    }
  }

  @Test
  fun testHandleException_CheckAutomaticallyNever_ContentAppeared() {
    every { mockDelegate.getRemoteLoadStatus() } returns ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
    every { mockDelegate.getCheckAutomaticallyConfiguration() } returns UpdatesConfiguration.CheckAutomaticallyConfiguration.NEVER

    errorRecovery.handleContentAppeared()
    verify { mockDelegate.markSuccessfulLaunchForLaunchedUpdate() }

    errorRecovery.handleException(mockk())
    verify { mockDelegate.throwException(any()) }
    confirmVerified(mockDelegate)
  }

  @Test
  fun testHandleException_Twice() {
    every { mockDelegate.getRemoteLoadStatus() } returns ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
    errorRecovery.handleException(mockk())
    errorRecovery.handleException(mockk())
    // the actual error recovery sequence should only happen once despite there being two errors
    verify(exactly = 1) { mockDelegate.loadRemoteUpdate() }
    verify(exactly = 0) { mockDelegate.relaunch(any()) }
    verify(exactly = 0) { mockDelegate.throwException(any()) }
  }

  private fun mockRelaunchWillSucceed() {
    val relaunchSlot = slot<Launcher.LauncherCallback>()
    every { mockDelegate.relaunch(capture(relaunchSlot)) } answers {
      relaunchSlot.captured.onSuccess()
    }
  }

  private fun mockRelaunchWillFail() {
    val relaunchSlot = slot<Launcher.LauncherCallback>()
    every { mockDelegate.relaunch(capture(relaunchSlot)) } answers {
      relaunchSlot.captured.onFailure(mockk())
    }
  }

  private fun mockLoadRemoteUpdateWillTimeOut() {
    // call the original, which will hit the `sendMessageAtTime` mock and
    // cause the message to be sent immediately
    every { errorRecovery.handler.postDelayed(any(), any()) } answers { callOriginal() }
  }
}
