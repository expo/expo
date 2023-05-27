package expo.modules.kotlin.sharedobjects

import expo.modules.kotlin.jni.JavaScriptObject

@JvmInline
value class SharedObjectId(val value: Int)

// TODO(@lukmccall): use weak ref to hold js object
typealias SharedObjectPair = Pair<SharedObject, JavaScriptObject>

const val sharedObjectIdPropertyName = "__expo_shared_object_id__"

class SharedObjectRegistry {
  private var currentId: SharedObjectId = SharedObjectId(1)

  internal var pairs = mutableMapOf<SharedObjectId, SharedObjectPair>()

  private fun pullNextId(): SharedObjectId {
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

    pairs[id] = native to js
    return id
  }

  internal fun delete(id: SharedObjectId) {
    pairs.remove(id)?.let { (native, js) ->
      native.sharedObjectId = SharedObjectId(0)
      if (js.isValid()) {
        js.defineProperty(sharedObjectIdPropertyName, 0)
      }
    }
  }

  internal fun toNativeObject(id: SharedObjectId): SharedObject? {
    return pairs[id]?.first
  }

  internal fun toNativeObject(js: JavaScriptObject): SharedObject? {
    if (!js.hasProperty(sharedObjectIdPropertyName)) {
      return null
    }

    val id = SharedObjectId(js.getProperty(sharedObjectIdPropertyName).getInt())
    return pairs[id]?.first
  }

  internal fun toJavaScriptObjet(native: SharedObject): JavaScriptObject? {
    return pairs[native.sharedObjectId]?.second
  }
}
