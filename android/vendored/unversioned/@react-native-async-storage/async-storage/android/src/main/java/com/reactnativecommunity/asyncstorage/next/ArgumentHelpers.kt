package com.reactnativecommunity.asyncstorage.next

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import org.json.JSONException
import org.json.JSONObject

fun ReadableArray.toEntryList(): List<Entry> {
    val list = mutableListOf<Entry>()
    for (keyValue in this.toArrayList()) {
        if (keyValue !is ArrayList<*> || keyValue.size != 2) {
            throw AsyncStorageError.invalidKeyValueFormat()
        }
        val key = keyValue[0]
        val value = keyValue[1]

        if (key !is String) {
            when (key) {
                null -> throw AsyncStorageError.keyIsNull()
                else -> throw AsyncStorageError.keyNotString()
            }
        }

        if (value !is String) {
            throw AsyncStorageError.valueNotString(key)
        }

        list.add(Entry(key, value))
    }
    return list
}

fun ReadableArray.toKeyList(): List<String> {
    val list = this.toArrayList()

    for (item in list) {
        if (item !is String) {
            throw AsyncStorageError.keyNotString()
        }
    }
    return list as List<String>
}

fun List<Entry>.toKeyValueArgument(): ReadableArray {
    val args = Arguments.createArray()

    for (entry in this) {
        val keyValue = Arguments.createArray()
        keyValue.pushString(entry.key)
        keyValue.pushString(entry.value)
        args.pushArray(keyValue)
    }

    return args
}

fun String?.isValidJson(): Boolean {
    if (this == null) return false

    return try {
        JSONObject(this)
        true
    } catch (e: JSONException) {
        false
    }
}

fun JSONObject.mergeWith(newObject: JSONObject): JSONObject {

    val keys = newObject.keys()
    val mergedObject = JSONObject(this.toString())

    while (keys.hasNext()) {
        val key = keys.next()
        val curValue = this.optJSONObject(key)
        val newValue = newObject.optJSONObject(key)

        if (curValue != null && newValue != null) {
            val merged = curValue.mergeWith(newValue)
            mergedObject.put(key, merged)
        } else {
            mergedObject.put(key, newObject.get(key))
        }
    }
    return mergedObject
}