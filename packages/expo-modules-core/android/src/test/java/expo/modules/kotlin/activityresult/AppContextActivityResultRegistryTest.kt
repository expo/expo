package expo.modules.kotlin.activityresult

import android.app.Activity.RESULT_OK
import android.content.Intent
import androidx.activity.result.contract.ActivityResultContract
import androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult
import androidx.activity.result.contract.ActivityResultContracts.TakePicture
import androidx.activity.result.contract.ActivityResultContracts.TakePicturePreview
import androidx.core.app.ActivityOptionsCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.testing.TestLifecycleOwner
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.MediumTest
import com.google.common.truth.Truth.assertThat
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Copied and adapted from https://android.googlesource.com/platform/frameworks/support/+/HEAD/activity/activity/src/androidTest/java/androidx/activity/result/ActivityResultRegistryTest.kt
 *
 * Main differences:
 * - replaced all [androidx.activity.result.ActivityResultRegistry] with [AppContextActivityResultRegistry]
 * - removed or slimmed down tests that used [androidx.activity.result.ActivityResultRegistry.onSaveInstanceState] or [androidx.activity.result.ActivityResultRegistry.onRestoreInstanceState]
 */
@MediumTest
@RunWith(AndroidJUnit4::class)
class AppContextActivityResultRegistryTest {
  private val registry = object : AppContextActivityResultRegistry() {
    override fun <I, O> onLaunch(
      requestCode: Int,
      contract: ActivityResultContract<I, O>,
      input: I,
      options: ActivityOptionsCompat?
    ) {
      dispatchResult(requestCode, RESULT_OK, Intent())
    }
  }

  @Test
  fun `should invoke registered callback`() {
    val lifecycleOwner = TestLifecycleOwner(Lifecycle.State.INITIALIZED)
    var resultReturned = false

    // register for the result
    val activityResult = registry.register(
      "test",
      lifecycleOwner,
      TakePicturePreview()
    ) { _, _ ->
      resultReturned = true
    }

    // move the state to started
    lifecycleOwner.currentState = Lifecycle.State.STARTED

    // launch the result
    activityResult.launch(null)

    assertThat(resultReturned).isTrue()
  }

  @Test
  fun `should preserve registered callbacks from activity destruction`() {
    val lifecycleOwner = TestLifecycleOwner(Lifecycle.State.INITIALIZED)
    // register for the result
    val activityResult = registry.register("test", lifecycleOwner, TakePicturePreview()) { _, _ -> }
    activityResult.unregister()
    var resultReturned = false
    // re-register for the result that should have been saved
    registry.register("test", lifecycleOwner, TakePicturePreview()) { _, _ -> resultReturned = true }
    // launch the result
    activityResult.launch(null)
    // move to CREATED and make sure the callback is not fired
    lifecycleOwner.currentState = Lifecycle.State.CREATED
    assertThat(resultReturned).isFalse()
    // move to STARTED and make sure the callback fires
    lifecycleOwner.currentState = Lifecycle.State.STARTED
    assertThat(resultReturned).isTrue()
    // Reset back to CREATED
    lifecycleOwner.currentState = Lifecycle.State.CREATED
    resultReturned = false
    // Move back to STARTED and make sure the previously returned result
    // isn't sent a second time
    lifecycleOwner.currentState = Lifecycle.State.STARTED
    assertThat(resultReturned).isFalse()
  }

  @Test
  fun `should dispatch result to registered contract`() {
    val lifecycleOwner = TestLifecycleOwner(Lifecycle.State.INITIALIZED)
    val dispatchResultRegistry = object : AppContextActivityResultRegistry() {
      override fun <I : Any?, O : Any?> onLaunch(
        requestCode: Int,
        contract: ActivityResultContract<I, O>,
        input: I,
        options: ActivityOptionsCompat?
      ) {
        dispatchResult(requestCode, true)
      }
    }
    var resultReturned = false
    val activityResult = dispatchResultRegistry.register(
      "test", lifecycleOwner, TakePicture()
    ) { _, _ ->
      resultReturned = true
    }
    // launch the result
    activityResult.launch(null)
    // move to CREATED and make sure the callback is not fired
    lifecycleOwner.currentState = Lifecycle.State.CREATED
    assertThat(resultReturned).isFalse()
    // move to STARTED and make sure the callback fires
    lifecycleOwner.currentState = Lifecycle.State.STARTED
    assertThat(resultReturned).isTrue()
    // Reset back to CREATED
    lifecycleOwner.currentState = Lifecycle.State.CREATED
    resultReturned = false
    // Move back to STARTED and make sure the previously returned result
    // isn't sent a second time
    lifecycleOwner.currentState = Lifecycle.State.STARTED
    assertThat(resultReturned).isFalse()
  }

  @Test
  fun `should preserve request code after unregister`() {
    var code = 0
    val noDispatchRegistry = object : AppContextActivityResultRegistry() {
      override fun <I : Any?, O : Any?> onLaunch(
        requestCode: Int,
        contract: ActivityResultContract<I, O>,
        input: I,
        options: ActivityOptionsCompat?
      ) {
        code = requestCode
      }
    }
    val activityResult = noDispatchRegistry.register("key", StartActivityForResult()) { _, _ -> }
    activityResult.launch(null)
    activityResult.unregister()
    var callbackExecuted = false
    noDispatchRegistry.register("key", StartActivityForResult()) { _, _ ->
      callbackExecuted = true
    }
    noDispatchRegistry.dispatchResult(code, RESULT_OK, Intent())
    assertThat(callbackExecuted).isTrue()
  }

  @Test
  fun `should throw if launched if already unregistered`() {
    val contract = StartActivityForResult()
    val activityResult = registry.register("key", contract) { _, _ -> }
    activityResult.unregister()
    try {
      activityResult.launch(null)
    } catch (e: IllegalStateException) {
      assertThat(e).hasMessageThat().contains(
        "Attempting to launch an unregistered ActivityResultLauncher with contract " +
          contract + " and input null. You must ensure the ActivityResultLauncher is " +
          "registered before calling launch()."
      )
    }
  }
}
