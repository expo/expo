// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.kotlin.devtools

import androidx.collection.ArrayMap
import okhttp3.Headers

/**
 * OkHttp `Headers` extension method to generate a simple key-value map
 * which only exposing single value for a key.
 */
fun Headers.toSingleMap(): Map<String, String> {
  val result = ArrayMap<String, String>()
  for (key in names()) {
    result[key] = get(key)
  }
  return result
}
