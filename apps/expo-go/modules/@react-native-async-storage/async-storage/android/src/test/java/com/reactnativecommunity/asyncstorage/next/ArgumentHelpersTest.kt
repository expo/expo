package com.reactnativecommunity.asyncstorage.next

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.ReadableArray
import com.google.common.truth.Truth.assertThat
import org.junit.Assert.assertThrows
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.BlockJUnit4ClassRunner

@RunWith(BlockJUnit4ClassRunner::class)
class ArgumentHelpersTest {

    @Test
    fun transformsArgumentsToEntryList() {
        val args = JavaOnlyArray.of(
            arrayListOf("key1", "value1"),
            arrayListOf("key2", "value2"),
            arrayListOf("key3", "value3")
        )
        assertThat(args.toEntryList()).isEqualTo(
            listOf(
                Entry("key1", "value1"),
                Entry("key2", "value2"),
                Entry("key3", "value3"),
            )
        )
    }

    @Test
    fun transfersArgumentsToKeyList() {
        val keyList = listOf("key1", "key2", "key3")
        val args = keyList.toReadableArray()
        assertThat(args.toKeyList()).isEqualTo(keyList)
    }

    @Test
    fun throwsIfArgumentsNotValidFormat() {
        val invalid = arrayListOf("invalid")
        val args = JavaOnlyArray.of(invalid)
        val error = assertThrows(AsyncStorageError::class.java) {
            args.toEntryList()
        }

        assertThat(error is AsyncStorageError).isTrue()
        assertThat(error).hasMessageThat()
            .isEqualTo("Invalid key-value format. Expected a list of [key, value] list.")
    }

    @Test
    fun throwsIfArgumentKeyIsNullOrNotString() {
        val argsInvalidNull = JavaOnlyArray.of(arrayListOf(null, "invalid"))
        val errorArgsInvalidNull = assertThrows(AsyncStorageError::class.java) {
            argsInvalidNull.toEntryList()
        }
        assertThat(errorArgsInvalidNull is AsyncStorageError).isTrue()
        assertThat(errorArgsInvalidNull).hasMessageThat().isEqualTo("Key cannot be null.")

        val notStringArgs = JavaOnlyArray.of(arrayListOf(123, "invalid"))
        val errorNotString = assertThrows(AsyncStorageError::class.java) {
            notStringArgs.toEntryList()
        }
        assertThat(errorNotString is AsyncStorageError).isTrue()
        assertThat(errorNotString).hasMessageThat()
            .isEqualTo("Provided key is not string. Only strings are supported as storage key.")
    }

    @Test
    fun throwsIfArgumentValueNotString() {
        val invalidArgs = JavaOnlyArray.of(arrayListOf("my_key", 666))
        val error = assertThrows(AsyncStorageError::class.java) {
            invalidArgs.toEntryList()
        }
        assertThat(error is AsyncStorageError).isTrue()
        assertThat(error).hasMessageThat()
            .isEqualTo("Value for key \"my_key\" is not a string. Only strings are supported as a value.")
    }
}

fun List<Any?>.toReadableArray(): ReadableArray {
    val arr = JavaOnlyArray()
    forEach {
        when (it) {
            null -> arr.pushNull()
            is Boolean -> arr.pushBoolean(it)
            is Double -> arr.pushDouble(it)
            is Int -> arr.pushInt(it)
            is String -> arr.pushString(it)
            else -> throw NotImplementedError()
        }
    }
    return arr
}
