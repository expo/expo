package expo.modules.kotlin.sharedobjects

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.JavaScriptWeakObject

@JvmInline
value class SharedObjectId(val value: Int) {
  fun toNativeObject(appContext: AppContext): SharedObject? {
    return appContext.sharedObjectRegistry.toNativeObject(this)
  }

  fun toJavaScriptObject(appContext: AppContext): JavaScriptObject? {
    val nativeObject = toNativeObject(appContext) ?: return null
    return appContext.sharedObjectRegistry.toJavaScriptObject(nativeObject)
  }
}

typealias SharedObjectPair = Pair<SharedObject, JavaScriptWeakObject>

const val sharedObjectIdPropertyName = "__expo_shared_object_id__"

class SharedObjectRegistry {
  private var currentId: SharedObjectId = SharedObjectId(1)

  internal var pairs = mutableMapOf<SharedObjectId, SharedObjectPair>()

  private fun pullNextId(): SharedObjectId = synchronized(this) {
    val current = currentId
    currentId = SharedObjectId(current.value + 1)
    return current
  }

  internal fun add(native: SharedObject, js: JavaScriptObject): SharedObjectId {
    val id = pullNextId()
    native.sharedObjectId = id
    js.defineProperty(sharedObjectIdPropertyName, id.value)

    js.defineDeallocator {
      delete(id)
    }

    val jsWeakObject = js.createWeak()
    synchronized(this) {
      pairs[id] = native to jsWeakObject
    }
    return id
  }

  internal fun delete(id: SharedObjectId) {
    val removedObject: SharedObjectPair? = synchronized(this) {
      return@synchronized pairs.remove(id)
    }
    removedObject?.let { (native, js) ->
      native.sharedObjectId = SharedObjectId(0)
      native.deallocate()
    }
  }

  internal fun toNativeObject(id: SharedObjectId): SharedObject? {
    return synchronized(this) {
      pairs[id]?.first
    }
  }

  internal fun toNativeObject(js: JavaScriptObject): SharedObject? {
    if (!js.hasProperty(sharedObjectIdPropertyName)) {
      return null
    }

    val id = SharedObjectId(js.getProperty(sharedObjectIdPropertyName).getInt())
    return pairs[id]?.first
  }

  internal fun toJavaScriptObject(native: SharedObject): JavaScriptObject? {
    return synchronized(this) {
      pairs[native.sharedObjectId]?.second?.lock()
    }
  }
}
