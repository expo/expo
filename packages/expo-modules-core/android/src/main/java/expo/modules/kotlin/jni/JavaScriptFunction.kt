package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.types.JSTypeConverter
import expo.modules.kotlin.types.TypeConverterProviderImpl
import kotlin.reflect.KType
import kotlin.reflect.typeOf

@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class JavaScriptFunction<ReturnType : Any?> @DoNotStrip private constructor(@DoNotStrip private val mHybridData: HybridData) : Destructible {
  @PublishedApi
  internal var returnType: KType? = null

  fun isValid() = mHybridData.isValid

  private external fun invoke(args: Array<Any?>, expectedReturnType: ExpectedType): Any?

  operator fun invoke(vararg args: Any?, appContext: AppContext? = null): ReturnType {
    // TODO(@lukmccall): check current thread
    val convertedArgs = args
      .map { JSTypeConverter.convertToJSValue(it) }
      .toTypedArray()

    val converter = TypeConverterProviderImpl
      .obtainTypeConverter(returnType ?: typeOf<Unit>())

    val expectedReturnType = converter.getCppRequiredTypes()
    val result = invoke(convertedArgs, expectedReturnType)
    @Suppress("UNCHECKED_CAST")
    return converter.convert(result, appContext) as ReturnType
  }

  @Throws(Throwable::class)
  protected fun finalize() {
    deallocate()
  }

  override fun deallocate() {
    mHybridData.resetNative()
  }
}
