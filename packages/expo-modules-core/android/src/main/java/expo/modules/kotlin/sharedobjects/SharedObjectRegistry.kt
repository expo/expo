package expo.modules.kotlin.sharedobjects

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.JavaScriptWeakObject
import java.lang.ref.WeakReference

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

class SharedObjectRegistry(appContext: AppContext) {
  private val appContextHolder = WeakReference(appContext)

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

    // This property should be deprecated, but it's still used when passing as a view prop.
    // It's already defined in the JS base SharedObject class prototype,
    // but with the current implementation it's possible to use a raw object for registration.
    js.defineProperty(sharedObjectIdPropertyName, id.value)

    val appContext = appContextHolder.get() ?: throw Exceptions.AppContextLost()

    appContext
      .jsiInterop
      .setNativeStateForSharedObject(id.value, js)

    val jsWeakObject = js.createWeak()
    synchronized(this) {
      pairs[id] = native to jsWeakObject
    }

    if (native.appContextHolder.get() == null) {
      native.appContextHolder = WeakReference(appContext)
    }

    return id
  }

  internal fun delete(id: SharedObjectId) {
    synchronized(this) {
      pairs.remove(id)
    }?.let { (native, _) ->
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
