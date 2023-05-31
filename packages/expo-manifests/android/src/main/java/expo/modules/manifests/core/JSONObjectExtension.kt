// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.manifests.core

import org.json.JSONObject

/**
 * Convert a [JSONObject] to Map<String, Any> recursively
 */
fun JSONObject.toMap(): Map<String, Any> {
  return mutableMapOf<String, Any>().apply {
    keys().forEach {
      when (val value = this@toMap[it]) {
        is JSONObject -> {
          put(it, value.toMap())
        }
        else -> {
          put(it, value)
        }
      }
    }
  }
}
