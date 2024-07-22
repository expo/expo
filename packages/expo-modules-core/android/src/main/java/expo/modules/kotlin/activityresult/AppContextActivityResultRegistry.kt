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
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts.RequestMultiplePermissions
import androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult
import androidx.activity.result.contract.ActivityResultContracts.StartIntentSenderForResult
import androidx.annotation.MainThread
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.LifecycleOwner
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.providers.CurrentActivityProvider
import expo.modules.kotlin.safeGetParcelable
import expo.modules.kotlin.safeGetParcelableExtra
import java.io.Serializable
import java.util.Random

private const val TAG = "ActivityResultRegistry"

// Use upper 16 bits for request codes
private const val INITIAL_REQUEST_CODE_VALUE = 0x00010000

/**
 * A registry that stores activity result callbacks ([ActivityResultCallback]) for
 * [AppContextActivityResultCaller.registerForActivityResult] registered calls.
 *
 * This class is created to address the problems of integrating original [androidx.activity.result.ActivityResultRegistry]
 * with ReactNative and our current architecture ([AppContext]).
 * There are two main problems that this class is solving:
 * - react-native-screen prevents us from using [Activity.onSaveInstanceState] / [Activity.onCreate] with `saveInstanceState`, because of https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067
 *   - this might be fixable in react-native-screens itself
 * - ReactNative does not provide any straightforward way to hook into every [Activity] / [Lifecycle] event that the original [androidx.activity.result.ActivityResultRegistry] mechanism depends on
 *   - there's room for further research in this case
 *
 * Ideally we would get rid of this class in favour of the original one, but firstly we need to
 * solve these problems listed above.
 *
 * The implementation is based on [androidx.activity.result.ActivityResultRegistry] coming from  `androidx.activity:activity:1.4.0` and `androidx.activity:activity-ktx:1.4.0`.
 * Main differences are:
 * - it operates on two callbacks instead of one
 *   - fallback callback - the secondary callback that is registered at the very beginning of the registry lifecycle (at the very beginning of the app's lifecycle).
 *                         It is not aware of the context and serves to preserve the results coming from 3rd party Activity when Android kills the launching Activity.
 *                         Additionally there's a supporting field that is serialized and deserialized that might hold some additional info about the result (like further instructions what to do about the result)
 *   - main callback - regular callback that allows single path execution of the asynchronous 3rd party Activity calls
 * - it preserves the state across [Activity] recreation in different way - we use [android.content.SharedPreferences]
 * - it is adjusted to work with [AppContext] and the lifecycle events ReactNative provides.
 *
 * @see [androidx.activity.result.ActivityResultRegistry] for more information.
 */
class AppContextActivityResultRegistry(
  private val currentActivityProvider: CurrentActivityProvider
) {
  private var random: Random = Random()

  private val requestCodeToKey: MutableMap<Int, String> = HashMap()
  private val keyToRequestCode: MutableMap<String, Int> = HashMap()
  private val keyToLifecycleContainers: MutableMap<String, LifecycleContainer> = HashMap()
  private var launchedKeys: ArrayList<String> = ArrayList()

  /**
   * Registry storing both main callbacks and fallback callbacks and contracts associated with key.
   */
  private val keyToCallbacksAndContract: MutableMap<String, CallbacksAndContract<*, *>> = HashMap()

  /**
   * A register that stores contract-specific parameters that allow proper resumption of the process
   * in case of launching Activity being is destroyed.
   * These are serialized and deserialized.
   */
  private val keyToInputParam: MutableMap<String, Serializable> = HashMap()

  private val pendingResults = Bundle/*<String, ActivityResult>*/()

  private val activity: AppCompatActivity
    get() = requireNotNull(currentActivityProvider.currentActivity as? AppCompatActivity) { "Current Activity is not available at the moment" }

  /**
   * This method body is adapted mainly from [ComponentActivity.mActivityResultRegistry]
   *
   * @see [androidx.activity.result.ActivityResultRegistry.onLaunch]
   */
  @MainThread
  fun <I : Serializable, O> onLaunch(
    requestCode: Int,
    contract: AppContextActivityResultContract<I, O>,
    @SuppressLint("UnknownNullness") input: I
  ) {
    // Start activity path
    val intent = contract.createIntent(activity, input)
    var optionsBundle: Bundle? = null

    if (intent.hasExtra(StartActivityForResult.EXTRA_ACTIVITY_OPTIONS_BUNDLE)) {
      optionsBundle = intent.getBundleExtra(StartActivityForResult.EXTRA_ACTIVITY_OPTIONS_BUNDLE)
      intent.removeExtra(StartActivityForResult.EXTRA_ACTIVITY_OPTIONS_BUNDLE)
    }
    when (intent.action) {
      RequestMultiplePermissions.ACTION_REQUEST_PERMISSIONS -> {
        // requestPermissions path
        val permissions = intent
          .getStringArrayExtra(RequestMultiplePermissions.EXTRA_PERMISSIONS)
          ?: arrayOfNulls(0)
        ActivityCompat.requestPermissions(activity, permissions, requestCode)
      }

      StartIntentSenderForResult.ACTION_INTENT_SENDER_REQUEST -> {
        val request = intent.safeGetParcelableExtra<IntentSenderRequest>(StartIntentSenderForResult.EXTRA_INTENT_SENDER_REQUEST)!!
        try {
          // startIntentSenderForResult path
          ActivityCompat.startIntentSenderForResult(
            activity,
            request.intentSender,
            requestCode,
            request.fillInIntent,
            request.flagsMask,
            request.flagsValues,
            0,
            optionsBundle
          )
        } catch (e: IntentSender.SendIntentException) {
          Handler(Looper.getMainLooper()).post {
            dispatchResult(
              requestCode,
              Activity.RESULT_CANCELED,
              Intent().setAction(StartIntentSenderForResult.ACTION_INTENT_SENDER_REQUEST)
                .putExtra(StartIntentSenderForResult.EXTRA_SEND_INTENT_EXCEPTION, e)
            )
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
   *
   * @param fallbackCallback callback that is invoked only if the Activity is destroyed and
   * recreated by the Android OS. Regular results are returned using main callback coming from
   * [AppContextActivityResultLauncher.launch] method.
   *
   * @see [androidx.activity.result.ActivityResultRegistry.register]
   */
  @MainThread
  fun <I : Serializable, O> register(
    key: String,
    lifecycleOwner: LifecycleOwner,
    contract: AppContextActivityResultContract<I, O>,
    fallbackCallback: AppContextActivityResultFallbackCallback<I, O>
  ): AppContextActivityResultLauncher<I, O> {
    val lifecycle = lifecycleOwner.lifecycle

    keyToCallbacksAndContract[key] = CallbacksAndContract(fallbackCallback, null, contract)
    keyToRequestCode[key].ifNull {
      val requestCode = generateRandomNumber()
      requestCodeToKey[requestCode] = key
      keyToRequestCode[key] = requestCode
    }

    val observer = LifecycleEventObserver { _, event ->
      when (event) {
        Lifecycle.Event.ON_START -> {
          // This is the most common path for returning results
          // When the Activity is destroyed then the other path is invoked, see [keyToFallbackCallback]

          // 1. No callbacks registered yet, other path would take care of the results
          @Suppress("UNCHECKED_CAST")
          val callbacksAndContract: CallbacksAndContract<I, O> = (
            keyToCallbacksAndContract[key]
              ?: return@LifecycleEventObserver
            ) as CallbacksAndContract<I, O>

          // 2. There are results to be delivered to the callbacks
          val activityResult = pendingResults.safeGetParcelable<ActivityResult>(key)
          activityResult?.let {
            pendingResults.remove(key)

            @Suppress("UNCHECKED_CAST")
            val input: I = keyToInputParam[key] as I
            val result = callbacksAndContract.contract.parseResult(input, it.resultCode, it.data)

            if (callbacksAndContract.mainCallback != null) {
              // 2.1 there's a main callback available, so launching Activity has not been killed during the process
              callbacksAndContract.mainCallback.onActivityResult(result)
            } else {
              // 2.2 launching Activity killed during the process, proceed with fallback callback
              callbacksAndContract.fallbackCallback.onActivityResult(input, result)
            }
          }
        }

        Lifecycle.Event.ON_DESTROY -> {
          unregister(key)
        }

        else -> Unit
      }
    }

    val lifecycleContainer = keyToLifecycleContainers[key] ?: LifecycleContainer(lifecycle)
    lifecycleContainer.addObserver(observer)
    keyToLifecycleContainers[key] = lifecycleContainer

    return object : AppContextActivityResultLauncher<I, O>() {
      override fun launch(input: I, callback: ActivityResultCallback<O>) {
        val requestCode = keyToRequestCode[key]
          ?: throw IllegalStateException("Attempting to launch an unregistered ActivityResultLauncher with contract $contract and input $input. You must ensure the ActivityResultLauncher is registered before calling launch()")

        keyToCallbacksAndContract[key] = CallbacksAndContract(fallbackCallback, callback, contract)
        keyToInputParam[key] = input
        launchedKeys.add(key)

        try {
          onLaunch(requestCode, contract, input)
        } catch (e: Exception) {
          launchedKeys.remove(key)
          throw e
        }
      }

      override val contract = contract
    }
  }

  /**
   * Persist the state of the registry.
   */
  fun persistInstanceState(context: Context) {
    DataPersistor(context)
      .addStringArrayList("launchedKeys", launchedKeys)
      .addStringToIntMap("keyToRequestCode", keyToRequestCode)
      .addStringToSerializableMap("keyToParamsForFallbackCallback", keyToInputParam.filter { (key) -> launchedKeys.contains(key) })
      .addBundle("pendingResult", pendingResults)
      .addSerializable("random", random)
      .persist()
  }

  /**
   * Possibly restore saved results from before the registry was destroyed.
   */
  fun restoreInstanceState(context: Context) {
    val dataPersistor = DataPersistor(context)

    dataPersistor.retrieveStringArrayList("launchedKeys")?.let { launchedKeys = it }
    dataPersistor.retrieveStringToSerializableMap("keyToParamsForFallbackCallback")?.let { keyToInputParam.putAll(it) }
    dataPersistor.retrieveBundle("pendingResult")?.let { pendingResults.putAll(it) }
    dataPersistor.retrieveSerializable("random")?.let { random = it as Random }
    dataPersistor.retrieveStringToIntMap("keyToRequestCode")?.let {
      it.entries.forEach { (key, requestCode) ->
        keyToRequestCode[key] = requestCode
        requestCodeToKey[requestCode] = key
      }
    }
  }

  /**
   * @see [androidx.activity.result.ActivityResultRegistry.unregister]
   */
  @MainThread
  fun unregister(key: String) {
    if (!launchedKeys.contains(key)) {
      // Only remove the key -> requestCode mapping if there isn't a launch in flight
      keyToRequestCode.remove(key)?.let { requestCodeToKey.remove(it) }
    }
    keyToCallbacksAndContract.remove(key)
    if (pendingResults.containsKey(key)) {
      Log.w(TAG, "Dropping pending result for request $key : ${pendingResults.safeGetParcelable<ActivityResult>(key)}")
      pendingResults.remove(key)
    }
    keyToLifecycleContainers[key]?.let {
      it.clearObservers()
      keyToLifecycleContainers.remove(key)
    }
  }

  /**
   * Entry point for informing about data coming from [Activity.onActivityResult].
   *
   * @see [androidx.activity.result.ActivityResultRegistry.dispatchResult]
   */
  @MainThread
  fun dispatchResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean {
    val key = requestCodeToKey[requestCode] ?: return false
    val callbacksAndContract = keyToCallbacksAndContract[key]
    doDispatch(key, resultCode, data, callbacksAndContract)
    return true
  }

  /**
   * This method has three different flows:
   * 1. main callback available (launcher Activity has not been killed), so resume main flow with results
   * 2. launcher Activity has been recreated and it has already proceeded to [Lifecycle.State.STARTED] phase, so use fallback callback
   * 3. results are delivered, but [Activity] has not yet reached [Lifecycle.State.STARTED] phase, so save them got later use
   */
  private fun <I : Serializable, O> doDispatch(
    key: String,
    resultCode: Int,
    data: Intent?,
    callbacksAndContract: CallbacksAndContract<I, O>?
  ) {
    val currentLifecycleState = keyToLifecycleContainers[key]?.lifecycle?.currentState

    if (callbacksAndContract?.mainCallback != null && launchedKeys.contains(key)) {
      // 1. There's main callback available, so use it right away
      @Suppress("UNCHECKED_CAST")
      val input = keyToInputParam[key] as I
      callbacksAndContract.mainCallback.onActivityResult(callbacksAndContract.contract.parseResult(input, resultCode, data))
      launchedKeys.remove(key)
    } else if (currentLifecycleState != null && currentLifecycleState.isAtLeast(Lifecycle.State.STARTED) && callbacksAndContract != null && launchedKeys.contains(key)) {
      // 2. Activity has already started, so let's proceed with fallback callback scenario
      @Suppress("UNCHECKED_CAST")
      val input = keyToInputParam[key] as I
      callbacksAndContract.fallbackCallback.onActivityResult(input, callbacksAndContract.contract.parseResult(input, resultCode, data))
      launchedKeys.remove(key)
    } else {
      // 3. Add these pending results in their place in order to wait for Lifecycle-based path
      pendingResults.putParcelable(key, ActivityResult(resultCode, data))
    }
  }

  private fun generateRandomNumber(): Int {
    var number = (random.nextInt(Int.MAX_VALUE - INITIAL_REQUEST_CODE_VALUE + 1) + INITIAL_REQUEST_CODE_VALUE)
    while (requestCodeToKey.containsKey(number)) {
      number = (random.nextInt(Int.MAX_VALUE - INITIAL_REQUEST_CODE_VALUE + 1) + INITIAL_REQUEST_CODE_VALUE)
    }
    return number
  }

  private data class CallbacksAndContract<I : Serializable, O>(
    /**
     * Fallback callback that accepts both output and deserialized input parameters
     */
    val fallbackCallback: AppContextActivityResultFallbackCallback<I, O>,
    /**
     * Main callback that might not be available, because the app might be re-created
     */
    val mainCallback: ActivityResultCallback<O>?,
    val contract: AppContextActivityResultContract<I, O>
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
