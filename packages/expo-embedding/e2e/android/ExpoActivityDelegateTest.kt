package dev.expo.kudo.androidtest

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.SystemClock
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.LifecycleState
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import expo.embedding.ExpoActivityDelegate
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertNotSame
import org.junit.Assert.assertSame
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

@RunWith(AndroidJUnit4::class)
class ExpoActivityDelegateTest {
  private val instrumentation get() = InstrumentationRegistry.getInstrumentation()
  private val application get() = instrumentation.targetContext.applicationContext as MainApplication
  private val host get() = application.expo.host

  private fun delegate(activity: MainActivity) =
    activity.window.decorView.getTag(expo.embedding.R.id.expo_embedding_activity_delegate) as ExpoActivityDelegate

  private fun awaitCondition(condition: () -> Boolean) {
    val deadline = SystemClock.uptimeMillis() + 15000
    while (!condition() && SystemClock.uptimeMillis() < deadline) SystemClock.sleep(50)
    assertTrue("Condition did not become true within 15 seconds", condition())
  }

  private fun awaitReactContext(): ReactContext {
    awaitCondition { host.reactHost.currentReactContext != null }
    return host.reactHost.currentReactContext!!
  }

  @Test
  fun shouldRejectHostAccessBeforeAttachment() {
    assertThrows(IllegalStateException::class.java) { ExpoActivityDelegate().host }
  }

  @Test
  fun shouldAttachTheApplicationHostAndPreserveItOnRepeatedAttachment() {
    ActivityScenario.launch(MainActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        val expo = delegate(activity)
        expo.attach(activity, host)
        assertSame(host, expo.host)
        assertTrue(activity is PermissionAwareActivity)
      }
    }
  }

  @Test
  fun shouldRejectAttachmentBeforeOnCreateAndAfterStart() {
    instrumentation.runOnMainSync {
      assertThrows(IllegalStateException::class.java) {
        ExpoActivityDelegate().attach(AppCompatActivity(), host)
      }
    }
    ActivityScenario.launch(MainActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        val error = assertThrows(IllegalStateException::class.java) {
          ExpoActivityDelegate().attach(activity, host)
        }
        assertTrue(error.message!!.contains("lifecycle state"))
      }
    }
  }

  @Test
  fun shouldRejectASecondDelegateAndBindingToAnotherActivity() {
    ActivityScenario.launch(MainActivity::class.java).use { scenario ->
      scenario.moveToState(Lifecycle.State.CREATED)
      scenario.onActivity { activity ->
        val error = assertThrows(IllegalStateException::class.java) {
          ExpoActivityDelegate().attach(activity, host)
        }
        assertTrue(error.message!!.contains("already has an Expo delegate"))
        assertThrows(IllegalStateException::class.java) {
          delegate(activity).attach(AppCompatActivity(), host)
        }
      }
    }
  }

  @Test
  fun shouldForwardResumePauseAndDestroyAndReleaseTheActivity() {
    val oldDelegate = AtomicReference<ExpoActivityDelegate>()
    ActivityScenario.launch(MainActivity::class.java).use { scenario ->
      awaitReactContext()
      awaitCondition { host.reactHost.lifecycleState == LifecycleState.RESUMED }
      scenario.onActivity { oldDelegate.set(delegate(it)) }
      scenario.moveToState(Lifecycle.State.CREATED)
      awaitCondition { host.reactHost.lifecycleState == LifecycleState.BEFORE_RESUME }
      scenario.moveToState(Lifecycle.State.RESUMED)
      awaitCondition { host.reactHost.lifecycleState == LifecycleState.RESUMED }
    }
    awaitCondition { host.reactHost.lifecycleState == LifecycleState.BEFORE_CREATE }
    assertThrows(IllegalStateException::class.java) { oldDelegate.get().host }
    instrumentation.runOnMainSync {
      assertThrows(IllegalStateException::class.java) { oldDelegate.get().attach(AppCompatActivity(), host) }
    }
  }

  @Test
  fun shouldCreateANewDelegateOnActivityRecreationWithTheSameHost() {
    ActivityScenario.launch(MainActivity::class.java).use { scenario ->
      val previous = AtomicReference<ExpoActivityDelegate>()
      scenario.onActivity { previous.set(delegate(it)) }
      scenario.recreate()
      scenario.onActivity {
        assertNotSame(previous.get(), delegate(it))
        assertSame(host, delegate(it).host)
      }
      assertThrows(IllegalStateException::class.java) { previous.get().host }
      awaitCondition { host.reactHost.lifecycleState == LifecycleState.RESUMED }
    }
  }

  @Test
  fun shouldForwardNewIntentsAndLegacyActivityResultsToNativeModules() {
    ActivityScenario.launch(MainActivity::class.java).use { scenario ->
      val context = awaitReactContext()
      val intentReceived = CountDownLatch(1)
      val resultReceived = CountDownLatch(1)
      val listener = object : BaseActivityEventListener() {
        override fun onNewIntent(intent: Intent) {
          if (intent.action == "expo.embedding.TEST") intentReceived.countDown()
        }
        override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
          if (requestCode == 41 && resultCode == Activity.RESULT_OK) resultReceived.countDown()
        }
      }
      context.addActivityEventListener(listener)
      try {
        scenario.onActivity { activity ->
          instrumentation.callActivityOnNewIntent(activity, Intent("expo.embedding.TEST"))
          delegate(activity).onActivityResult(41, Activity.RESULT_OK, null)
        }
        assertTrue(intentReceived.await(5, TimeUnit.SECONDS))
        assertTrue(resultReceived.await(5, TimeUnit.SECONDS))
      } finally {
        context.removeActivityEventListener(listener)
      }
    }
  }

  @Test
  fun shouldDeliverFrameworkPermissionResultsThroughTheRealActivity() {
    ActivityScenario.launch(MainActivity::class.java).use { scenario ->
      val received = CountDownLatch(1)
      val results = AtomicReference<IntArray>()
      scenario.onActivity { activity ->
        // CAMERA is deliberately absent from the fixture manifest: Android returns a denial without a dialog.
        (activity as PermissionAwareActivity).requestPermissions(arrayOf(Manifest.permission.CAMERA), 42,
          PermissionListener { requestCode, permissions, grantResults ->
            if (requestCode == 42 && permissions.contentEquals(arrayOf(Manifest.permission.CAMERA))) {
              results.set(grantResults)
              received.countDown()
            }
            true
          })
      }
      assertTrue(received.await(5, TimeUnit.SECONDS))
      assertArrayEquals(intArrayOf(PackageManager.PERMISSION_DENIED), results.get())
    }
  }

  @Test
  fun shouldFallBackToNativeBackWhenJavaScriptDoesNotConsumeIt() {
    ActivityScenario.launch(MainActivity::class.java).use { scenario ->
      awaitReactContext()
      scenario.onActivity { it.onBackPressedDispatcher.onBackPressed() }
      awaitCondition { scenario.state == Lifecycle.State.DESTROYED }
    }
  }
}
