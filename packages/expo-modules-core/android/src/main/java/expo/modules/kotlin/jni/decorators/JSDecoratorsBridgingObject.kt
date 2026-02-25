@file:Suppress("KotlinJniMissingFunction")

package expo.modules.kotlin.jni.decorators

import com.facebook.jni.HybridData
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeMap
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.runtime.Runtime
import expo.modules.kotlin.classcomponent.ClassDefinitionData
import expo.modules.kotlin.jni.Destructible
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.JNIAsyncFunctionBody
import expo.modules.kotlin.jni.JNIDeallocator
import expo.modules.kotlin.jni.JNINoArgsFunctionBody
import expo.modules.kotlin.jni.JNIFunctionBody
import expo.modules.kotlin.modules.DEFAULT_MODULE_VIEW
import expo.modules.kotlin.objects.ObjectDefinitionData
import expo.modules.kotlin.tracing.trace
import expo.modules.kotlin.views.ViewManagerDefinition
import kotlin.collections.component1
import kotlin.collections.component2

/**
 * This class was introduced to bridge the gap between Kotlin and cpp only once.
 * Dealing with JNI for each type of decorator was hard to get right.
 */
class JSDecoratorsBridgingObject(jniDeallocator: JNIDeallocator) : Destructible {

  @DoNotStrip
  private val mHybridData = initHybrid()

  private external fun initHybrid(): HybridData

  init {
    jniDeallocator.addReference(this)
  }

  external fun registerConstants(constants: NativeMap)

  external fun registerSyncFunction(
    name: String,
    takesOwner: Boolean,
    enumerable: Boolean,
    desiredTypes: Array<ExpectedType>,
    cppReturnType: Int,
    body: JNIFunctionBody
  )

  external fun registerAsyncFunction(
    name: String,
    takesOwner: Boolean,
    enumerable: Boolean,
    desiredTypes: Array<ExpectedType>,
    body: JNIAsyncFunctionBody
  )

  external fun registerProperty(
    name: String,
    getterTakesOwner: Boolean,
    getterExpectedType: Array<ExpectedType>,
    getter: JNIFunctionBody?,
    setterTakesOwner: Boolean,
    setterExpectedType: Array<ExpectedType>,
    setter: JNIFunctionBody?
  )

  external fun registerConstant(
    name: String,
    getter: JNINoArgsFunctionBody?
  )

  external fun registerObject(
    name: String,
    jsDecoratorsBridgingObject: JSDecoratorsBridgingObject
  )

  external fun registerClass(
    name: String,
    prototypeDecorator: JSDecoratorsBridgingObject,
    constructorDecorator: JSDecoratorsBridgingObject,
    takesOwner: Boolean,
    ownerClass: Class<*>?,
    isSharedRef: Boolean,
    desiredTypes: Array<ExpectedType>,
    body: JNIFunctionBody
  )

  fun registerModuleName(name: String) {
    registerProperty(
      "__expo_module_name__",
      false,
      emptyArray(),
      { name },
      false,
      emptyArray(),
      null
    )
  }

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }

  override fun getHybridDataForJNIDeallocator(): HybridData {
    return mHybridData
  }

  fun ObjectDefinitionData.exportConstants() {
    val legacyConstants = legacyConstantsProvider.invoke()
    if (constants.isEmpty() && legacyConstants.isEmpty()) {
      return
    }

    trace("Exporting constants") {
      if (legacyConstants.isNotEmpty()) {
        val convertedConstants = Arguments.makeNativeMap(legacyConstants)
        registerConstants(convertedConstants)
      }

      constants
        .forEach { (_, constant) ->
          constant.attachToJSObject(this@JSDecoratorsBridgingObject)
        }
    }
  }

  fun ObjectDefinitionData.exportFunctions(objectName: String, appContext: AppContext) {
    val functions = functions
    if (!functions.hasNext()) {
      return
    }

    trace("Attaching functions") {
      functions.forEach { function ->
        function.attachToJSObject(appContext, this@JSDecoratorsBridgingObject, objectName)
      }
    }
  }

  fun ObjectDefinitionData.exportProperties(appContext: AppContext) {
    if (properties.isEmpty()) {
      return
    }

    trace("Attaching properties") {
      properties
        .forEach { (_, prop) ->
          prop.attachToJSObject(appContext, this@JSDecoratorsBridgingObject)
        }
    }
  }

  fun List<ClassDefinitionData>.exportClasses(
    appContext: AppContext,
    runtime: Runtime
  ) {
    if (isEmpty()) {
      return
    }

    trace("Attaching classes") {
      forEach { classDefinition ->
        classDefinition.exportClass(appContext, runtime)
      }
    }
  }

  fun ClassDefinitionData.exportClass(
    appContext: AppContext,
    runtime: Runtime
  ) {
    trace("Attaching class $name") {
      val prototypeDecorator = JSDecoratorsBridgingObject(runtime.deallocator)
      val constructorDecorator = JSDecoratorsBridgingObject(runtime.deallocator)

      prototypeDecorator.apply {
        objectDefinition.exportConstants()
        objectDefinition.exportFunctions(name, appContext)
        objectDefinition.exportProperties(appContext)
      }

      constructorDecorator.apply {
        exportStaticFunctions(name, appContext)
      }

      val constructor = constructor
      val ownerClass = (constructor.ownerType?.classifier as? kotlin.reflect.KClass<*>)?.java

      registerClass(
        name,
        prototypeDecorator,
        constructorDecorator,
        constructor.takesOwner,
        ownerClass,
        isSharedRef,
        constructor.getCppRequiredTypes().toTypedArray(),
        constructor.getJNIFunctionBody(name, appContext)
      )
    }
  }

  fun ClassDefinitionData.exportStaticFunctions(objectName: String, appContext: AppContext) {
    val staticFunctions = staticFunctions
    if (!staticFunctions.hasNext()) {
      return
    }

    trace("Attaching static functions") {
      staticFunctions.forEach { staticFunction ->
        staticFunction.attachToJSObject(appContext, this@JSDecoratorsBridgingObject, objectName)
      }
    }
  }

  fun Map<String, ViewManagerDefinition>.exportViewPrototypes(
    modulesName: String,
    appContext: AppContext,
    runtime: Runtime
  ) {
    if (isEmpty()) {
      return
    }

    trace("Attaching view prototypes") {
      val viewPrototypesDecorator = JSDecoratorsBridgingObject(runtime.deallocator)

      for ((key, definition) in this) {
        viewPrototypesDecorator.apply {
          definition.exportViewPrototype(modulesName, key, appContext, runtime)
        }
      }

      registerObject("ViewPrototypes", viewPrototypesDecorator)
    }
  }

  fun ViewManagerDefinition.exportViewPrototype(
    moduleName: String,
    viewKey: String,
    appContext: AppContext,
    runtime: Runtime
  ) {
    val functions = asyncFunctions
    if (functions.isEmpty()) {
      return
    }

    trace("Attaching view prototype for $name") {
      val prototype = JSDecoratorsBridgingObject(runtime.deallocator)

      functions.forEach { function ->
        function.attachToJSObject(appContext, prototype, name)
      }

      registerObject(
        if (viewKey == DEFAULT_MODULE_VIEW) {
          moduleName
        } else {
          "${moduleName}_$name"
        },
        prototype
      )
    }
  }
}
