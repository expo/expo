package expo.modules.kotlin.activityresult

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResult
import androidx.activity.result.ActivityResultCallback
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContract
import androidx.annotation.MainThread
import androidx.core.app.ActivityOptionsCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.LifecycleOwner
import java.util.*

/**
 * This class is created to address the problem of integrating original [androidx.activity.result.ActivityResultRegistry]
 * with ReactNative and our current architecture of subscribing to [Lifecycle]'s events for [android.app.Activity].
 *
 * Ideally we would get rid of this class in favour of the original one, but firstly we need to
 * create some mechanism for hooking into full [android.app.Activity]'s [Lifecycle] from [expo.modules.kotlin.AppContext].
 *
 * The implementation is based on [androidx.activity.result.ActivityResultRegistry] coming from `androidx.activity:activity-ktx:1.4.0`
 * Main difference is in the [register] method that serves as replacement for [androidx.activity.result.ActivityResultRegistry.register].
 * Moreover following methods are removed [androidx.activity.result.ActivityResultRegistry.onSaveInstanceState] and [androidx.activity.result.ActivityResultRegistry.onRestoreInstanceState]
 * as this class lives outside [android.app.Activity]'s scope and does not need to be saved/restored.
 *
 * @see [androidx.activity.result.ActivityResultRegistry] for more information.
 */
abstract class AppContextActivityResultRegistry {
  private val LOG_TAG = "ActivityResultRegistry"

  // Use upper 16 bits for request codes
  private val INITIAL_REQUEST_CODE_VALUE = 0x00010000
  private var mRandom: Random = Random()

  private val mRequestCodeToKey: MutableMap<Int, String> = HashMap()
  private val mKeyToRequestCode: MutableMap<String, Int> = HashMap()
  private val mKeyToLifecycleContainers: MutableMap<String, LifecycleContainer> = HashMap()
  /**
   * Keeps track of the keys for which there is an actively launched action happening.
   */
  private var mLaunchedKeys: ArrayList<String> = ArrayList()

  @Transient
  /* synthetic access */
  private val mKeyToCallback: MutableMap<String, CallbackAndContract<*>> = HashMap()

  /* synthetic access */
  private val mParsedPendingResults: MutableMap<String, Any?> = HashMap()

  /* synthetic access */
  private val mPendingResults = Bundle/*<String, ActivityResult>*/()

  /**
   * A register that stores the keys for which the original launching [android.app.Activity] has been destroyed
   * due to resources limits. This information is then propagated as an additional information to
   * the resulting callback. Upon [android.app.Activity] recreation the original [CallbackAndContract]
   * reattached to the [Lifecycle].
   */
  private val launchingActivityDestroyedForKey: MutableMap<String, CallbackAndContract<*>> = HashMap()

  private fun hasLaunchingActivityBeenDestroyedForKey(key: String): Boolean {
    return launchingActivityDestroyedForKey.remove(key)
  }

  /**
   * @see [androidx.activity.result.ActivityResultRegistry.onLaunch]
   * @see [ComponentActivity.mActivityResultRegistry] - this method code is adapted from this class
   */
  @MainThread
  abstract fun <I, O> onLaunch(
    requestCode: Int,
    contract: ActivityResultContract<I, O>,
    @SuppressLint("UnknownNullness") input: I,
    options: ActivityOptionsCompat?
  )

  /**
   * @see [androidx.activity.result.ActivityResultRegistry.register]
   */
  @MainThread
  fun <I, O> register(
    key: String,
    lifecycleOwner: LifecycleOwner,
    contract: ActivityResultContract<I, O>,
    callback: AppContextActivityResultCallback<O>
  ): ActivityResultLauncher<I> {
    val lifecycle = lifecycleOwner.lifecycle

    registerKey(key)

    val lifecycleContainer = mKeyToLifecycleContainers[key] ?: LifecycleContainer(lifecycle)
    val observer = LifecycleEventObserver { _, event ->
      when (event) {
        /**
         * Happens when Activity comes from background to foreground
         */
        Lifecycle.Event.ON_START -> {
          mKeyToCallback[key] = CallbackAndContract(callback, contract)
          possiblyDispatchResult(key, contract, callback)
        }
        Lifecycle.Event.ON_STOP -> {
          mKeyToCallback.remove(key)
        }
        /**
         * Happens when Activity is killed by the OS. Possibly it's going to be recreated a while later.
         */
        Lifecycle.Event.ON_DESTROY -> {
          launchingActivityDestroyedForKey[key] = CallbackAndContract(callback, contract)
          unregister(key)
        }
        else -> Unit
      }
    }

    lifecycleContainer.addObserver(observer)
    mKeyToLifecycleContainers[key] = lifecycleContainer

    return object : ActivityResultLauncher<I>() {
      override fun launch(input: I, options: ActivityOptionsCompat?) {
        val innerCode = mKeyToRequestCode[key]
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
   * Unless [dispatchResult]/[doDispatch] has called the [callback] already it will store it for
   * later retrieval when [Lifecycle.State.STARTED] event happens.
   */
  private fun <I, O> possiblyDispatchResult(
    key: String,
    contract: ActivityResultContract<I, O>,
    callback: AppContextActivityResultCallback<O>
  ) {
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

  /**
   * @see [androidx.activity.result.ActivityResultRegistry.register]
   */
  fun <I, O> register(
    key: String,
    contract: ActivityResultContract<I, O>,
    callback: AppContextActivityResultCallback<O>
  ): ActivityResultLauncher<I> {
    registerKey(key)
    mKeyToCallback[key] = CallbackAndContract(callback, contract)
    if (mParsedPendingResults.containsKey(key)) {
      @Suppress("UNCHECKED_CAST")
      val parsedPendingResult = mParsedPendingResults[key] as O
      mParsedPendingResults.remove(key)
      callback.onActivityResult(parsedPendingResult, false)
    }
    val pendingResult = mPendingResults.getParcelable<ActivityResult>(key)
    if (pendingResult != null) {
      mPendingResults.remove(key)
      callback.onActivityResult(contract.parseResult(
        pendingResult.resultCode,
        pendingResult.data), false)
    }
    return object : ActivityResultLauncher<I>() {
      override fun launch(input: I, options: ActivityOptionsCompat?) {
        val innerCode = mKeyToRequestCode[key]
          ?: throw java.lang.IllegalStateException("Attempting to launch an unregistered "
            + "ActivityResultLauncher with contract " + contract + " and input "
            + input + ". You must ensure the ActivityResultLauncher is registered "
            + "before calling launch().")
        mLaunchedKeys.add(key)
        onLaunch(innerCode, contract, input, options)
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
   * @see [androidx.activity.result.ActivityResultRegistry.unregister]
   */
  @MainThread
  fun unregister(key: String) {
    if (!mLaunchedKeys.contains(key)) {
      // Only remove the key -> requestCode mapping if there isn't a launch in flight
      mKeyToRequestCode.remove(key)?.let { mRequestCodeToKey.remove(it) }
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
   * @see [androidx.activity.result.ActivityResultRegistry.dispatchResult]
   */
  @MainThread
  fun dispatchResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean {
    val key = mRequestCodeToKey[requestCode] ?: return false
    doDispatch(key, resultCode, data, mKeyToCallback[key])
    return true
  }

  /**
   * @see [androidx.activity.result.ActivityResultRegistry.dispatchResult]
   */
  @MainThread
  fun <O> dispatchResult(requestCode: Int,
                         @SuppressLint("UnknownNullness") result: O
  ): Boolean {
    val key = mRequestCodeToKey[requestCode] ?: return false
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
    val existing = mKeyToRequestCode[key]
    if (existing != null) {
      return
    }
    val rc = generateRandomNumber()
    bindRequestCodeKey(rc, key)
  }

  private fun generateRandomNumber(): Int {
    var number = (mRandom.nextInt(Int.MAX_VALUE - INITIAL_REQUEST_CODE_VALUE + 1)
      + INITIAL_REQUEST_CODE_VALUE)
    while (mRequestCodeToKey.containsKey(number)) {
      number = (mRandom.nextInt(Int.MAX_VALUE - INITIAL_REQUEST_CODE_VALUE + 1)
        + INITIAL_REQUEST_CODE_VALUE)
    }
    return number
  }

  private fun bindRequestCodeKey(rc: Int, key: String) {
    mRequestCodeToKey[rc] = key
    mKeyToRequestCode[key] = rc
  }

  data class CallbackAndContract<O> internal constructor(
    val mCallback: AppContextActivityResultCallback<O>,
    val mContract: ActivityResultContract<*, O>
  )

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
