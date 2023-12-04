// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.kotlin.types.folly

import android.util.ArrayMap
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.exception.CodedException

internal const val DYNAMIC_EXTENSION_PREFIX = "__expo_dynamic_extension__#"

/**
 * A extension for folly::dynamic that can get or put other data types than JSON.
 * This class should use with the `convertStringToFollyDynamicIfNeeded()` in **JSIToJSIConverter.cpp**.
 */
@DoNotStrip
class FollyDynamicExtensionConverter {
  companion object {
    private val instanceMap = ArrayMap<Int, Any>()
    private var nextId = 0

    @JvmStatic
    @Synchronized
    @DoNotStrip
    fun put(any: Any): String {
      val id = nextId++
      instanceMap[id] = any
      return "${createPrefix(any.javaClass)}#$id"
    }

    @JvmStatic
    @Synchronized
    @DoNotStrip
    fun get(payload: String): Any? {
      if (!payload.startsWith(DYNAMIC_EXTENSION_PREFIX)) {
        throw InvalidDynamicExtensionFormatException()
      }
      val javaClassPos = DYNAMIC_EXTENSION_PREFIX.length
      val idPos = payload.indexOf('#', javaClassPos)
      val id = payload.substring(idPos + 1).toInt()
      return instanceMap.remove(id)
    }

    private fun <T> createPrefix(anyClass: Class<T>): String {
      return "${DYNAMIC_EXTENSION_PREFIX}${anyClass.canonicalName}"
    }
  }
}

internal class InvalidDynamicExtensionFormatException :
  CodedException("Invalid folly::dynamic extension format")
