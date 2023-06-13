package com.reactnativecommunity.asyncstorage.next

import android.content.Context
import androidx.annotation.VisibleForTesting
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.reactnativecommunity.asyncstorage.SerialExecutor
import kotlinx.coroutines.CoroutineName
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.asExecutor
import kotlinx.coroutines.launch

class StorageModule(reactContext: ReactContext) : ReactContextBaseJavaModule(), CoroutineScope {
    override fun getName() = "RNC_AsyncSQLiteDBStorage"

    // this executor is not used by the module, but it must exists here due to
    // Detox relying on this implementation detail to run
    @VisibleForTesting
    private val executor = SerialExecutor(Dispatchers.Main.asExecutor())

    override val coroutineContext =
        Dispatchers.IO + CoroutineName("AsyncStorageScope") + SupervisorJob()

    private val storage = StorageSupplier.getInstance(reactContext)

    companion object {
        @JvmStatic
        fun getStorageInstance(ctx: Context): AsyncStorageAccess {
            return StorageSupplier.getInstance(ctx)
        }
    }

    @ReactMethod
    fun multiGet(keys: ReadableArray, cb: Callback) {
        launch(createExceptionHandler(cb)) {
            val entries = storage.getValues(keys.toKeyList())
            cb(null, entries.toKeyValueArgument())
        }
    }

    @ReactMethod
    fun multiSet(keyValueArray: ReadableArray, cb: Callback) {
        launch(createExceptionHandler(cb)) {
            val entries = keyValueArray.toEntryList()
            storage.setValues(entries)
            cb(null)
        }
    }

    @ReactMethod
    fun multiRemove(keys: ReadableArray, cb: Callback) {
        launch(createExceptionHandler(cb)) {
            storage.removeValues(keys.toKeyList())
            cb(null)
        }
    }

    @ReactMethod
    fun multiMerge(keyValueArray: ReadableArray, cb: Callback) {
        launch(createExceptionHandler(cb)) {
            val entries = keyValueArray.toEntryList()
            storage.mergeValues(entries)
            cb(null)
        }
    }

    @ReactMethod
    fun getAllKeys(cb: Callback) {
        launch(createExceptionHandler(cb)) {
            val keys = storage.getKeys()
            val result = Arguments.createArray()
            keys.forEach { result.pushString(it) }
            cb.invoke(null, result)
        }
    }

    @ReactMethod
    fun clear(cb: Callback) {
        launch(createExceptionHandler(cb)) {
            storage.clear()
            cb(null)
        }
    }
}