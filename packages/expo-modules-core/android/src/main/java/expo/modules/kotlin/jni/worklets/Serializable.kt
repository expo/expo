package expo.modules.kotlin.jni.worklets

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.jni.Destructible

@DoNotStrip
class Serializable @DoNotStrip private constructor(
  @DoNotStrip private val mHybridData: HybridData,
  type: Int
) : Destructible {
  enum class ValueType(val value: Int) {
    Undefined(1),
    Null(2),
    Boolean(3),
    Number(4),
    BigInt(5),
    String(6),
    Object(7),
    Array(8),
    Map(9),
    Set(10),
    Worklet(11),
    RemoteFunction(12),
    Handle(13),
    HostObject(14),
    HostFunction(15),
    ArrayBuffer(16),
    TurboModuleLike(17),
    Import(18),
    Synchronizable(19),
    Custom(20)
  }

  val type: ValueType = ValueType.entries.first { it.value == type }

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }

  override fun getHybridDataForJNIDeallocator(): HybridData {
    return mHybridData
  }
}
