package com.reactnativecommunity.asyncstorage.next

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Callback
import kotlinx.coroutines.CoroutineExceptionHandler

internal fun createExceptionHandler(cb: Callback): CoroutineExceptionHandler {
    return CoroutineExceptionHandler { _, throwable ->
        val error = Arguments.createMap()
        if (throwable !is AsyncStorageError) {
            error.putString(
                "message", "Unexpected AsyncStorage error: ${throwable.localizedMessage}"
            )
        } else {
            error.putString("message", throwable.errorMessage)
        }

        cb(error)
    }
}

internal class AsyncStorageError private constructor(val errorMessage: String) :
    Throwable(errorMessage) {

    companion object {
        fun keyIsNull() = AsyncStorageError("Key cannot be null.")

        fun keyNotString() = AsyncStorageError("Provided key is not string. Only strings are supported as storage key.")

        fun valueNotString(key: String?): AsyncStorageError {
            val detail = if (key == null) "Provided value" else "Value for key \"$key\""
            return AsyncStorageError("$detail is not a string. Only strings are supported as a value.")
        }

        fun invalidKeyValueFormat() =
            AsyncStorageError("Invalid key-value format. Expected a list of [key, value] list.")

    }
}