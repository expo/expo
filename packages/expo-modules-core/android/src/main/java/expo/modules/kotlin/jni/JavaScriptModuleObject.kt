package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeMap
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.objects.ObjectDefinitionData

/**
 * A class to communicate with CPP part of the [expo.modules.kotlin.modules.Module] class.
 * Used to register exported JSI functions.
 * The lifetime of instances of this class should be in sync with the lifetime of the bridge.
 * All exported functions/objects will have a reference to the `JavaScriptModuleObject`,
 * so it must outlive the current RN context.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class JavaScriptModuleObject(
  jniDeallocator: JNIDeallocator,
  val name: String
) : Destructible {
  // Has to be called "mHybridData" - fbjni uses it via reflection
  @DoNotStrip
  private val mHybridData = initHybrid()

  private external fun initHybrid(): HybridData

  init {
    jniDeallocator.addReference(this)
  }

  fun initUsingObjectDefinition(appContext: AppContext, definition: ObjectDefinitionData) = apply {
    val constants = definition.constantsProvider()
    val convertedConstants = Arguments.makeNativeMap(constants)
    exportConstants(convertedConstants)

    definition
      .functions
      .forEach { function ->
        function.attachToJSObject(appContext, this)
      }

    definition
      .properties
      .forEach { (_, prop) ->
        prop.attachToJSObject(this)
      }
  }

  /**
   * Exports constants
   */
  external fun exportConstants(constants: NativeMap)

  /**
   * Register a promise-less function on the CPP module representation.
   * After calling this function, user can access the exported function in the JS code.
   */
  external fun registerSyncFunction(name: String, takesOwner: Boolean, args: Int, desiredTypes: Array<ExpectedType>, body: JNIFunctionBody)

  /**
   * Register a promise function on the CPP module representation.
   * After calling this function, user can access the exported function in the JS code.
   */
  external fun registerAsyncFunction(name: String, takesOwner: Boolean, args: Int, desiredTypes: Array<ExpectedType>, body: JNIAsyncFunctionBody)

  external fun registerProperty(name: String, desiredType: ExpectedType, getter: JNIFunctionBody?, setter: JNIFunctionBody?)

  external fun registerClass(name: String, classModule: JavaScriptModuleObject, takesOwner: Boolean, args: Int, desiredTypes: Array<ExpectedType>, body: JNIFunctionBody)

  external fun registerViewPrototype(viewPrototype: JavaScriptModuleObject)

  @Throws(Throwable::class)
  protected fun finalize() {
    deallocate()
  }

  override fun deallocate() {
    mHybridData.resetNative()
  }

  override fun toString(): String {
    return "JavaScriptModuleObject_$name"
  }
}
