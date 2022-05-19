package expo.modules.kotlin.activityresult

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.IntentSender
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResult
import androidx.activity.result.ActivityResultCallback
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.ActivityResultRegistry
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContract
import androidx.activity.result.contract.ActivityResultContracts.RequestMultiplePermissions
import androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult
import androidx.activity.result.contract.ActivityResultContracts.StartIntentSenderForResult
import androidx.annotation.MainThread
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.app.ActivityOptionsCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.LifecycleOwner
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.providers.CurrentActivityProvider
import java.util.*

/**
 * This class is created to address the problem of integrating original [ActivityResultRegistry]
 * with ReactNative and our current architecture of subscribing to [Lifecycle]'s events for [Activity].
 *
 * Ideally we would get rid of this class in favour of the original one, but firstly we need to
 * create some mechanism for hooking into full [Activity]'s [Lifecycle] from [AppContext].
 *
 * The implementation is based on [ActivityResultRegistry] coming from `androidx.activity:activity-ktx:1.4.0`
 * Main difference is in the [register] method that serves as replacement for [ActivityResultRegistry.register].
 * Moreover following methods are removed [ActivityResultRegistry.onSaveInstanceState] and [ActivityResultRegistry.onRestoreInstanceState]
 * as this class lives outside [Activity]'s scope and does not need to be saved/restored.
 *
 * @see [ActivityResultRegistry] for more information.
 */
class AppContextActivityResultRegistry(
  private val currentActivityProvider: CurrentActivityProvider
) {
  private val LOG_TAG = "ActivityResultRegistry"

  // Use upper 16 bits for request codes
  private val INITIAL_REQUEST_CODE_VALUE = 0x00010000
  private var mRandom: Random = Random()

  private val mRcToKey: MutableMap<Int, String> = HashMap()
  private val mKeyToRc: MutableMap<String, Int> = HashMap()
  private val mKeyToLifecycleContainers: MutableMap<String, LifecycleContainer> = HashMap()
  private var mLaunchedKeys: ArrayList<String> = ArrayList()

  @Transient
  /* synthetic access */
  private val mKeyToCallback: MutableMap<String, CallbackAndContract<*>> = HashMap()

  /* synthetic access */
  private val mParsedPendingResults: MutableMap<String, Any?> = HashMap()

  /* synthetic access */
  private val mPendingResults = Bundle/*<String, ActivityResult>*/()

  /**
   * A register that stores the keys for which the original launching [Activity] has been destroyed
   * due to resources limits. This information is then propagated as an additional information to
   * the resulting callback.
   */
  private val launchingActivityDestroyedForKey: MutableSet<String> = HashSet()

  private fun hasLaunchingActivityBeenDestroyedForKey(key: String): Boolean {
    return launchingActivityDestroyedForKey.remove(key)
  }

  private val activity: AppCompatActivity
    get() = requireNotNull(currentActivityProvider.currentActivity) { TODO() }

  /**
   * @see [ActivityResultRegistry.onLaunch]
   * @see [ComponentActivity.mActivityResultRegistry] - this method code is adapted from this class
   */
  @MainThread
  fun <I, O> onLaunch(
    requestCode: Int,
    contract: ActivityResultContract<I, O>,
    @SuppressLint("UnknownNullness") input: I,
    options: ActivityOptionsCompat?
  ) {
    // Immediate result path
    val synchronousResult = contract.getSynchronousResult(activity, input)
    if (synchronousResult != null) {
      Handler(Looper.getMainLooper()).post { dispatchResult(requestCode, synchronousResult.value) }
      return
    }

    // Start activity path
    val intent = contract.createIntent(activity, input)
    var optionsBundle: Bundle? = null
    // If there are any extras, we should defensively set the classLoader
    if (intent.extras != null && intent.extras!!.classLoader == null) {
      intent.setExtrasClassLoader(activity.classLoader)
    }
    if (intent.hasExtra(StartActivityForResult.EXTRA_ACTIVITY_OPTIONS_BUNDLE)) {
      optionsBundle = intent.getBundleExtra(StartActivityForResult.EXTRA_ACTIVITY_OPTIONS_BUNDLE)
      intent.removeExtra(StartActivityForResult.EXTRA_ACTIVITY_OPTIONS_BUNDLE)
    } else if (options != null) {
      optionsBundle = options.toBundle()
    }
    when (intent.action) {
      RequestMultiplePermissions.ACTION_REQUEST_PERMISSIONS -> {
        // requestPermissions path
        var permissions = intent.getStringArrayExtra(RequestMultiplePermissions.EXTRA_PERMISSIONS)
        if (permissions == null) {
          permissions = arrayOfNulls(0)
        }
        ActivityCompat.requestPermissions(activity, permissions, requestCode)
      }
      StartIntentSenderForResult.ACTION_INTENT_SENDER_REQUEST -> {
        val request: IntentSenderRequest = intent.getParcelableExtra(StartIntentSenderForResult.EXTRA_INTENT_SENDER_REQUEST)!!
        try {
          // startIntentSenderForResult path
          ActivityCompat.startIntentSenderForResult(activity, request.intentSender,
            requestCode, request.fillInIntent, request.flagsMask,
            request.flagsValues, 0, optionsBundle)
        } catch (e: IntentSender.SendIntentException) {
          Handler(Looper.getMainLooper()).post {
            dispatchResult(requestCode, Activity.RESULT_CANCELED,
              Intent().setAction(StartIntentSenderForResult.ACTION_INTENT_SENDER_REQUEST)
                .putExtra(StartIntentSenderForResult.EXTRA_SEND_INTENT_EXCEPTION, e))
          }
        }
      }
      else -> {
        // startActivityForResult path
        ActivityCompat.startActivityForResult(activity, intent, requestCode, optionsBundle)
      }
    }
  }

  /**
   * The difference from the original method is commented out assertion about the current [Lifecycle]'s state.
   * @see [ActivityResultRegistry.register]
   */
  @MainThread
  fun <I, O> register(
    key: String,
    lifecycleOwner: LifecycleOwner,
    contract: ActivityResultContract<I, O>,
    callback: AppContextActivityResultCallback<O>
  ): ActivityResultLauncher<I> {
    val lifecycle = lifecycleOwner.lifecycle

    /**
     * Below is commented out as we're registering contracts when the Activity is already STARTED
     */
//    check(!lifecycle.currentState.isAtLeast(Lifecycle.State.STARTED)) {
//      ("LifecycleOwner " + lifecycleOwner + " is "
//        + "attempting to register while current state is "
//        + lifecycle.currentState + ". LifecycleOwners must call register before "
//        + "they are STARTED.")
//    }

    registerKey(key)

    val lifecycleContainer = mKeyToLifecycleContainers[key] ?: LifecycleContainer(lifecycle)
    val observer = LifecycleEventObserver { _, event ->
      when (event) {
        Lifecycle.Event.ON_START -> {
          mKeyToCallback[key] = CallbackAndContract(callback, contract)
          val launchingActivityDestroyed = hasLaunchingActivityBeenDestroyedForKey(key)
          if (mParsedPendingResults.containsKey(key)) {
            @Suppress("UNCHECKED_CAST")
            val parsedPendingResult = mParsedPendingResults[key] as O
            mParsedPendingResults.remove(key)

            callback.onActivityResult(parsedPendingResult, launchingActivityDestroyed)
          }
          mPendingResults.getParcelable<ActivityResult>(key)?.let {
            mPendingResults.remove(key)
            callback.onActivityResult(contract.parseResult(it.resultCode, it.data), launchingActivityDestroyed)
          }
        }
        Lifecycle.Event.ON_STOP -> mKeyToCallback.remove(key)
        Lifecycle.Event.ON_DESTROY -> {
          launchingActivityDestroyedForKey.add(key)
          unregister(key)
        }
        else -> Unit
      }
    }

    lifecycleContainer.addObserver(observer)
    mKeyToLifecycleContainers[key] = lifecycleContainer

    return object : ActivityResultLauncher<I>() {
      override fun launch(input: I, options: ActivityOptionsCompat?) {
        val innerCode = mKeyToRc[key]
          ?: throw IllegalStateException("Attempting to launch an unregistered "
            + "ActivityResultLauncher with contract " + contract + " and input "
            + input + ". You must ensure the ActivityResultLauncher is registered "
            + "before calling launch().")
        mLaunchedKeys.add(key)
        try {
          onLaunch(innerCode, contract, input, options)
        } catch (e: Exception) {
          mLaunchedKeys.remove(key)
          throw e
        }
      }

      override fun unregister() {
        this@AppContextActivityResultRegistry.unregister(key)
      }

      override fun getContract(): ActivityResultContract<I, *> {
        return contract
      }
    }
  }

  /**
   * @see [ActivityResultRegistry.unregister]
   */
  @MainThread
  fun unregister(key: String) {
    if (!mLaunchedKeys.contains(key)) {
      // Only remove the key -> requestCode mapping if there isn't a launch in flight
      mKeyToRc.remove(key)?.let { mRcToKey.remove(it) }
    }
    mKeyToCallback.remove(key)
    if (mParsedPendingResults.containsKey(key)) {
      Log.w(LOG_TAG, "Dropping pending result for request " + key + ": "
        + mParsedPendingResults[key])
      mParsedPendingResults.remove(key)
    }
    if (mPendingResults.containsKey(key)) {
      Log.w(LOG_TAG, "Dropping pending result for request " + key + ": "
        + mPendingResults.getParcelable<ActivityResult>(key))
      mPendingResults.remove(key)
    }
    mKeyToLifecycleContainers[key]?.let {
      it.clearObservers()
      mKeyToLifecycleContainers.remove(key)
    }
  }

  /**
   * @see [ActivityResultRegistry.dispatchResult]
   */
  @MainThread
  fun dispatchResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean {
    val key = mRcToKey[requestCode] ?: return false
    doDispatch(key, resultCode, data, mKeyToCallback[key])
    return true
  }

  /**
   * @see [ActivityResultRegistry.dispatchResult]
   */
  @MainThread
  fun <O> dispatchResult(requestCode: Int,
                         @SuppressLint("UnknownNullness") result: O
  ): Boolean {
    val key = mRcToKey[requestCode] ?: return false
    val callbackAndContract = mKeyToCallback[key]
    if (callbackAndContract?.mCallback == null) {
      // Remove any pending result
      mPendingResults.remove(key)
      // And add these pre-parsed pending results in their place
      mParsedPendingResults[key] = result
    } else {
      @Suppress("UNCHECKED_CAST")
      val callback = callbackAndContract.mCallback as ActivityResultCallback<O>
      if (mLaunchedKeys.remove(key)) {
        callback.onActivityResult(result)
      }
    }
    return true
  }

  private fun <O> doDispatch(key: String, resultCode: Int, data: Intent?,
                             callbackAndContract: CallbackAndContract<O>?) {
    if (callbackAndContract?.mCallback != null && mLaunchedKeys.contains(key)) {
      val callback = callbackAndContract.mCallback
      val contract = callbackAndContract.mContract
      val launchingActivityDestroyed = hasLaunchingActivityBeenDestroyedForKey(key)
      callback.onActivityResult(contract.parseResult(resultCode, data), launchingActivityDestroyed)
      mLaunchedKeys.remove(key)
    } else {
      // Remove any parsed pending result
      mParsedPendingResults.remove(key)
      // And add these pending results in their place
      mPendingResults.putParcelable(key, ActivityResult(resultCode, data))
    }
  }

  private fun registerKey(key: String) {
    val existing = mKeyToRc[key]
    if (existing != null) {
      return
    }
    val rc = generateRandomNumber()
    bindRcKey(rc, key)
  }

  private fun generateRandomNumber(): Int {
    var number = (mRandom.nextInt(Int.MAX_VALUE - INITIAL_REQUEST_CODE_VALUE + 1)
      + INITIAL_REQUEST_CODE_VALUE)
    while (mRcToKey.containsKey(number)) {
      number = (mRandom.nextInt(Int.MAX_VALUE - INITIAL_REQUEST_CODE_VALUE + 1)
        + INITIAL_REQUEST_CODE_VALUE)
    }
    return number
  }

  private fun bindRcKey(rc: Int, key: String) {
    mRcToKey[rc] = key
    mKeyToRc[key] = rc
  }

  class CallbackAndContract<O> internal constructor(
    val mCallback: AppContextActivityResultCallback<O>?,
    val mContract: ActivityResultContract<*, O>)

  class LifecycleContainer internal constructor(val mLifecycle: Lifecycle) {
    private val mObservers: ArrayList<LifecycleEventObserver> = ArrayList()

    fun addObserver(observer: LifecycleEventObserver) {
      mLifecycle.addObserver(observer)
      mObservers.add(observer)
    }

    fun clearObservers() {
      mObservers.forEach { mLifecycle.removeObserver(it) }
      mObservers.clear()
    }
  }
}
