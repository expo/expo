package expo.modules.kotlin.activityresult

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.IntentSender
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResult
import androidx.activity.result.ActivityResultCallback
import androidx.activity.result.ActivityResultRegistry
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContract
import androidx.activity.result.contract.ActivityResultContracts.RequestMultiplePermissions
import androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult
import androidx.activity.result.contract.ActivityResultContracts.StartIntentSenderForResult
import androidx.annotation.MainThread
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
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
  private val SHARED_PREFERENCES_NAME = "expo.modules.kotlin.PersistentDataManager"
  private val KEY_COMPONENT_ACTIVITY_REGISTERED_RCS = "KEY_COMPONENT_ACTIVITY_REGISTERED_RCS"
  private val KEY_COMPONENT_ACTIVITY_REGISTERED_KEYS = "KEY_COMPONENT_ACTIVITY_REGISTERED_KEYS"
  private val KEY_COMPONENT_ACTIVITY_LAUNCHED_KEYS = "KEY_COMPONENT_ACTIVITY_LAUNCHED_KEYS"
  private val KEY_COMPONENT_ACTIVITY_RANDOM_OBJECT = "KEY_COMPONENT_ACTIVITY_RANDOM_OBJECT"
  private val KEY_COMPONENT_ACTIVITY_PARAMS_FOR_FALLBACK_CALLBACK = "KEY_COMPONENT_ACTIVITY_PARAMS_FOR_FALLBACK_CALLBACK"

  private val LOG_TAG = "ActivityResultRegistry"

  // Use upper 16 bits for request codes
  private val INITIAL_REQUEST_CODE_VALUE = 0x00010000
  private var random: Random = Random()

  private val requestCodeToKey: MutableMap<Int, String> = HashMap()
  private val keyToRequestCode: MutableMap<String, Int> = HashMap()
  private val keyToLifecycleContainers: MutableMap<String, LifecycleContainer> = HashMap()
  private var launchedKeys: ArrayList<String> = ArrayList()

  private val keyToCallback: MutableMap<String, CallbackAndContract<*>> = HashMap()

  /**
   * A register that stores the keys for which the original launching [Activity] has been destroyed
   * due to resources limits. It also stores the contract and callback that have to be invoked once
   * the application is restored by the Android OS.
   */
  private val keyToFallbackCallback: MutableMap<String, FallbackCallbackAndContract<*, *>> = HashMap()

  /**
   * A register that stores launching-specific options that allow proper resumption of the process
   * in case launching Activity is destroyed.
   */
  private val keyToParamsForFallbackCallback: MutableMap<String, Any> = HashMap()

  private val parsedPendingResults: MutableMap<String, Any?> = HashMap()
  private val pendingResults = Bundle/*<String, ActivityResult>*/()

  private val activity: AppCompatActivity
    get() = requireNotNull(currentActivityProvider.currentActivity) { "Current Activity is not available at the moment" }

  /**
   * @see [ActivityResultRegistry.onLaunch]
   * @see [ComponentActivity.mActivityResultRegistry] - this method code is adapted from this class
   */
  @MainThread
  fun <I, O> onLaunch(
    requestCode: Int,
    contract: ActivityResultContract<I, O>,
    @SuppressLint("UnknownNullness") input: I,
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
   * This method should be called every time the Activity is created
   * @see [ActivityResultRegistry.register]
   * @param fallbackCallback callback that is invoked only if the Activity is destroyed and
   * recreated by the Android OS. Regular results are returned from [AppContextActivityResultLauncher.launch] method.
   */
  @MainThread
  fun <I, O, P> register(
    key: String,
    lifecycleOwner: LifecycleOwner,
    contract: ActivityResultContract<I, O>,
    fallbackCallback: AppContextActivityResultCallback<O, P>
  ): AppContextActivityResultLauncher<I, O, P> {
    val lifecycle = lifecycleOwner.lifecycle
    keyToFallbackCallback[key] = FallbackCallbackAndContract(fallbackCallback, contract)

    registerKey(key)

    val lifecycleContainer = keyToLifecycleContainers[key] ?: LifecycleContainer(lifecycle)
    val observer = LifecycleEventObserver { _, event ->
      when (event) {
        Lifecycle.Event.ON_START -> {
          // This is the most common path for returning results
          // When the Activity is destroyed then the other path is invoked, see [keyToFallbackCallback]
          val callbackAndContract = keyToCallback[key] ?: return@LifecycleEventObserver
          @Suppress("UNCHECKED_CAST")
          val callback = callbackAndContract.callback as ActivityResultCallback<O>

          if (parsedPendingResults.containsKey(key)) {
            @Suppress("UNCHECKED_CAST")
            val parsedPendingResult = parsedPendingResults[key] as O
            parsedPendingResults.remove(key)

            callback.onActivityResult(parsedPendingResult)
          }
          pendingResults.getParcelable<ActivityResult>(key)?.let {
            pendingResults.remove(key)
            callback.onActivityResult(contract.parseResult(it.resultCode, it.data))
          }
        }
        Lifecycle.Event.ON_DESTROY -> {
          unregister(key)
        }
        else -> Unit
      }
    }

    lifecycleContainer.addObserver(observer)
    keyToLifecycleContainers[key] = lifecycleContainer

    return object : AppContextActivityResultLauncher<I, O, P>() {
      override fun launch(input: I, params: P, callback: ActivityResultCallback<O>) {
        val requestCode = keyToRequestCode[key] ?: throw IllegalStateException("Attempting to launch an unregistered ActivityResultLauncher with contract $contract and input $input .You must ensure the ActivityResultLauncher is registered before calling launch()")
        launchedKeys.add(key)
        keyToCallback[key] = CallbackAndContract(callback, contract)
        keyToParamsForFallbackCallback[key] = params as Any
        try {
          onLaunch(requestCode, contract, input)
        } catch (e: Exception) {
          launchedKeys.remove(key)
          throw e
        }
      }

      override val contract: ActivityResultContract<I, *> = contract
    }
  }

  fun persistInstanceState(context: Context) {
    val sharedPreferences = context.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE)

    sharedPreferences
      .edit()
      .putString(KEY_COMPONENT_ACTIVITY_REGISTERED_RCS, requestCodeToKey.toString())
      .putString(KEY_COMPONENT_ACTIVITY_REGISTERED_KEYS, keyToRequestCode.toString())
      .putString(KEY_COMPONENT_ACTIVITY_LAUNCHED_KEYS, launchedKeys.toString())
      .putString(KEY_COMPONENT_ACTIVITY_RANDOM_OBJECT, random.toString())
      .putString(KEY_COMPONENT_ACTIVITY_PARAMS_FOR_FALLBACK_CALLBACK, keyToParamsForFallbackCallback.toString())
      .apply()
  }

  fun restoreInstanceState(context: Context) {
    val sharedPreferences = context.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE)

    sharedPreferences.all.let {
    }

    sharedPreferences
      .edit()
      .clear()
      .apply()
  }

  /**
   * @see [ActivityResultRegistry.unregister]
   */
  @MainThread
  fun unregister(key: String) {
    if (!launchedKeys.contains(key)) {
      // Only remove the key -> requestCode mapping if there isn't a launch in flight
      keyToRequestCode.remove(key)?.let { requestCodeToKey.remove(it) }
    }
    keyToCallback.remove(key)
    if (parsedPendingResults.containsKey(key)) {
      Log.w(LOG_TAG, "Dropping pending result for request $key : ${parsedPendingResults[key]}")
      parsedPendingResults.remove(key)
    }
    if (pendingResults.containsKey(key)) {
      Log.w(LOG_TAG, "Dropping pending result for request $key : ${pendingResults.getParcelable<ActivityResult>(key)}")
      pendingResults.remove(key)
    }
    keyToLifecycleContainers[key]?.let {
      it.clearObservers()
      keyToLifecycleContainers.remove(key)
    }
  }

  /**
   * @see [ActivityResultRegistry.dispatchResult]
   */
  @MainThread
  fun dispatchResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean {
    val key = requestCodeToKey[requestCode] ?: return false
    doDispatch(key, resultCode, data, keyToCallback[key])
    return true
  }

  /**
   * @see [ActivityResultRegistry.dispatchResult]
   */
  @MainThread
  fun <O> dispatchResult(requestCode: Int,
                         @SuppressLint("UnknownNullness") result: O
  ): Boolean {
    val key = requestCodeToKey[requestCode] ?: return false
    val callbackAndContract = keyToCallback[key]
    if (callbackAndContract?.callback == null) {
      // Remove any pending result
      pendingResults.remove(key)
      // And add these pre-parsed pending results in their place
      parsedPendingResults[key] = result
    } else {
      @Suppress("UNCHECKED_CAST")
      val callback = callbackAndContract.callback as ActivityResultCallback<O>
      if (launchedKeys.remove(key)) {
        callback.onActivityResult(result)
      }
    }
    return true
  }

  private fun <O> doDispatch(key: String, resultCode: Int, data: Intent?, callbackAndContract: CallbackAndContract<O>?) {
    @Suppress("UNCHECKED_CAST")
//    val storedCallbackAndContract = keyToFallbackCallback[key] as FallbackCallbackAndContract<O, P>?
    if (callbackAndContract?.callback != null && launchedKeys.contains(key)) {
      val callback = callbackAndContract.callback
      val contract = callbackAndContract.contract
      callback.onActivityResult(contract.parseResult(resultCode, data))
      launchedKeys.remove(key)
//    } else if (storedCallbackAndContract != null && launchedKeys.contains(key)) {
//      // That's the path when the Activity has been destroyed and restored by the Android OS
//      val (callback, contract) = storedCallbackAndContract
//      callback.onActivityResult(contract.parseResult(resultCode, data))
//      keyToFallbackCallback.remove(key)
//      launchedKeys.remove(key)
    } else {
      // Remove any parsed pending result
      parsedPendingResults.remove(key)
      // And add these pending results in their place
      pendingResults.putParcelable(key, ActivityResult(resultCode, data))
    }
  }

  private fun registerKey(key: String) {
    val existing = keyToRequestCode[key]
    if (existing != null) {
      return
    }
    val requestCode = generateRandomNumber()
    requestCodeToKey[requestCode] = key
    keyToRequestCode[key] = requestCode
  }

  private fun generateRandomNumber(): Int {
    var number = (random.nextInt(Int.MAX_VALUE - INITIAL_REQUEST_CODE_VALUE + 1) + INITIAL_REQUEST_CODE_VALUE)
    while (requestCodeToKey.containsKey(number)) {
      number = (random.nextInt(Int.MAX_VALUE - INITIAL_REQUEST_CODE_VALUE + 1) + INITIAL_REQUEST_CODE_VALUE)
    }
    return number
  }

  private data class CallbackAndContract<O>(
    val callback: ActivityResultCallback<O>,
    val contract: ActivityResultContract<*, O>
  )

  private data class FallbackCallbackAndContract<O, P>(
    val callback: AppContextActivityResultCallback<O, P>,
    val contract: ActivityResultContract<*, O>
  )

  class LifecycleContainer internal constructor(val lifecycle: Lifecycle) {
    private val observers: ArrayList<LifecycleEventObserver> = ArrayList()

    fun addObserver(observer: LifecycleEventObserver) {
      lifecycle.addObserver(observer)
      observers.add(observer)
    }

    fun clearObservers() {
      observers.forEach { lifecycle.removeObserver(it) }
      observers.clear()
    }
  }
}
