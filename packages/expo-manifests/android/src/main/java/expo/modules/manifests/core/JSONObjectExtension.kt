// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.manifests.core

import org.json.JSONObject

/**
 * Convert a [JSONObject] to Map<String, Any> recursively
 */
fun JSONObject.toMap(): Map<String, Any> {
  return keys().asSequence().associateWith {
    when (val value = this@toMap[it]) {
      is JSONObject -> value.toMap()
      else -> value
    }
  }
}
