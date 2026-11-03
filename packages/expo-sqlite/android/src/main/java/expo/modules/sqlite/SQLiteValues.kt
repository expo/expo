// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.nio.ByteBuffer

/**
 * JavaScript numbers arrive as doubles, so an integral one binds as an INTEGER instead of a REAL.
 */
internal fun normalizeBindParam(param: Any?): Any? =
  if (param is Double && param % 1.0 == 0.0) {
    param.toLong()
  } else {
    param
  }

/**
 * The binding returns a BLOB column as a direct `ByteBuffer`. It crosses to JavaScript as a
 * `ByteArray`, which arrives as an `ArrayBuffer`.
 */
internal fun normalizeColumnValues(values: List<Any?>): List<Any?> =
  values.map {
    if (it is ByteBuffer) {
      it.toByteArray()
    } else {
      it
    }
  }

internal fun ByteBuffer.toByteArray(): ByteArray =
  ByteArray(remaining()).also { duplicate().get(it) }

/** A direct copy of the bytes, for the binding calls that read memory through a `ByteBuffer`. */
internal fun ByteArray.toDirectBuffer(): ByteBuffer =
  ByteBuffer.allocateDirect(size).apply {
    put(this@toDirectBuffer)
    flip()
  }

/**
 * Runs [block] on the IO dispatcher. A `suspend` export starts on the JS thread, and the queries
 * must not block it.
 */
internal suspend inline fun <T> io(crossinline block: () -> T): T =
  withContext(Dispatchers.IO) { block() }
