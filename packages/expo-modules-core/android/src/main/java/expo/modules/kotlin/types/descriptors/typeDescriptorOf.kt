package expo.modules.kotlin.types.descriptors

import android.util.Log
import io.github.lukmccall.pika.TypeInfo
import io.github.lukmccall.pika.typeInfo
import kotlin.reflect.typeOf

@PublishedApi
internal fun TypeInfo.toRawTypeDescriptor(): RawTypeDescriptor {
  return when (this) {
    is TypeInfo.Simple -> RawTypeDescriptor.Simple(
      kClass,
      isNullable
    )

    is TypeInfo.Parameterized -> RawTypeDescriptor.Parameterized(
      kClass,
      isNullable,
      typeArguments.map { it.toRawTypeDescriptor() }
    )

    TypeInfo.Star -> error("Star projections are not supported")
  }
}

@PublishedApi
internal inline fun <reified T> cpTypeDescriptorOf(): TypeDescriptor {
  return TypeDescriptor(
    typeInfo = typeInfo<T>().toRawTypeDescriptor(),
    kTypeProvider = { typeOf<T>() }
  )
}

inline fun <reified T> typeDescriptorOf(): TypeDescriptor {
  val typeDescriptor = runCatching { cpTypeDescriptorOf<T>() }
    .onFailure {
      Log.e("ExpoModulesCore", "Failed to get type info for ${T::class.java.name}", it)
    }
    .getOrNull()

  if (typeDescriptor != null) {
    return typeDescriptor
  }

  return typeOf<T>().toTypeDescriptor()
}
