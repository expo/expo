package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.types.JSTypeConverterProvider
import expo.modules.kotlin.types.TypeConverterProviderImpl
import expo.modules.kotlin.types.descriptors.TypeDescriptor
import expo.modules.kotlin.types.descriptors.typeDescriptorOf

@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class JavaScriptFunction<ReturnType : Any?> @DoNotStrip private constructor(@DoNotStrip private val mHybridData: HybridData) : Destructible {
  @PublishedApi
  internal var returnType: TypeDescriptor? = null

  fun isValid() = mHybridData.isValid

  private external fun invoke(thisValue: JavaScriptObject?, args: Array<Any?>, expectedReturnType: ExpectedType): Any?

  operator fun invoke(vararg args: Any?, thisValue: JavaScriptObject? = null, appContext: AppContext? = null): ReturnType {
    // TODO(@lukmccall): check current thread
    val convertedArgs = args
      .map { JSTypeConverterProvider.convertToJSValue(it) }
      .toTypedArray()

    val converter = TypeConverterProviderImpl
      .obtainTypeConverter(
        returnType ?: typeDescriptorOf<Unit>()
      )

    val expectedReturnType = converter.getCppRequiredTypes()
    val result = invoke(thisValue, convertedArgs, expectedReturnType)
    @Suppress("UNCHECKED_CAST")
    return converter.convert(result, appContext, false) as ReturnType
  }

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }

  override fun getHybridDataForJNIDeallocator(): HybridData {
    return mHybridData
  }
}
