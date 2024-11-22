// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import okhttp3.Headers

/**
 * An extension to convert list of header pair to [Headers]
 */
internal fun List<Pair<String, String>>.toHeaders(): Headers {
  val builder = Headers.Builder()
  for (pair in this) {
    builder.add(pair.first, pair.second)
  }
  return builder.build()
}
