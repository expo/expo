package expo.modules.kotlin.sharedobjects

import expo.modules.kotlin.RuntimeContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.InvalidSharedObjectIdException
import expo.modules.kotlin.exception.UsingReleasedSharedObjectException
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.JavaScriptWeakObject
import expo.modules.kotlin.weak

@JvmInline
value class SharedObjectId(val value: Int) {
  fun toNativeObject(runtimeContext: RuntimeContext): SharedObject {
    return runtimeContext.sharedObjectRegistry.toNativeObject(this)
  }

  fun toNativeObjectOrNull(runtimeContext: RuntimeContext): SharedObject? {
    return runtimeContext.sharedObjectRegistry.toNativeObjectOrNull(this)
  }

  fun toJavaScriptObjectNull(runtimeContext: RuntimeContext): JavaScriptObject? {
    val nativeObject = toNativeObjectOrNull(runtimeContext) ?: return null
    return runtimeContext.sharedObjectRegistry.toJavaScriptObjectOrNull(nativeObject)
  }

  fun toWeakJavaScriptObjectNull(runtimeContext: RuntimeContext): JavaScriptWeakObject? {
    val nativeObject = toNativeObjectOrNull(runtimeContext) ?: return null
    return runtimeContext.sharedObjectRegistry.toWeakJavaScriptObjectOrNull(nativeObject)
  }
}

typealias SharedObjectPair = Pair<SharedObject, JavaScriptWeakObject>

const val sharedObjectIdPropertyName = "__expo_shared_object_id__"

class SharedObjectRegistry(runtimeContext: RuntimeContext) {
  private val runtimeContextHolder = runtimeContext.weak()

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

    val runtimeContext = runtimeContextHolder.get() ?: throw Exceptions.AppContextLost()

    runtimeContext
      .jsiContext
      .setNativeStateForSharedObject(id.value, js)

    val size = native.getAdditionalMemoryPressure()
    // If the size is less or equal to 0, it means that the object doesn't require additional memory pressure.
    // We can skip the call to the JSI method.
    if (size > 0) {
      js.setExternalMemoryPressure(size)
    }

    if (native is SharedRef<*>) {
      js.defineProperty("nativeRefType", native.nativeRefType)
    }

    val jsWeakObject = js.createWeak()
    synchronized(this) {
      pairs[id] = native to jsWeakObject
    }

    if (native.runtimeContextHolder.get() == null) {
      native.runtimeContextHolder = runtimeContext.weak()
    }

    return id
  }

  internal fun delete(id: SharedObjectId) {
    synchronized(this) {
      pairs.remove(id)
    }?.let { (native, _) ->
      native.sharedObjectId = SharedObjectId(0)
      native.sharedObjectDidRelease()
    }
  }

  internal fun toNativeObject(id: SharedObjectId): SharedObject {
    val native = pairs[id.ensureWasNotRelease()]?.first
    return native ?: throw InvalidSharedObjectIdException()
  }

  internal fun toNativeObjectOrNull(id: SharedObjectId): SharedObject? {
    return synchronized(this) {
      pairs[id]?.first
    }
  }

  internal fun toNativeObjectOrNull(js: JavaScriptObject): SharedObject? {
    if (!js.hasProperty(sharedObjectIdPropertyName)) {
      return null
    }

    val id = SharedObjectId(js.getProperty(sharedObjectIdPropertyName).getInt())
    return pairs[id]?.first
  }

  internal fun toJavaScriptObjectOrNull(native: SharedObject): JavaScriptObject? {
    return synchronized(this) {
      pairs[native.sharedObjectId]?.second?.lock()
    }
  }

  internal fun toWeakJavaScriptObjectOrNull(nativeObject: SharedObject): JavaScriptWeakObject? {
    return synchronized(this) {
      pairs[nativeObject.sharedObjectId]?.second
    }
  }

  private fun SharedObjectId.ensureWasNotRelease() = apply {
    if (!pairs.contains(this) && value != 0 && value < currentId.value) {
      throw UsingReleasedSharedObjectException()
    }
  }
}
