package expo.modules.kotlin.types.descriptors

import android.util.Log
import io.github.lukmccall.pika.PTypeDescriptor
import io.github.lukmccall.pika.pTypeDescriptorOf
import kotlin.reflect.typeOf

@PublishedApi
internal fun PTypeDescriptor.toRawTypeDescriptor(): RawTypeDescriptor {
  return when (this) {
    is PTypeDescriptor.Concrete -> {
      if (this is PTypeDescriptor.Concrete.Parameterized) {
        RawTypeDescriptor.Parameterized(
          pType.kClass,
          isNullable,
          argumentsPTypes.map { it.toRawTypeDescriptor() }
        )
      } else {
        RawTypeDescriptor.Simple(
          pType.kClass,
          isNullable
        )
      }

    }

    PTypeDescriptor.Star -> error("Star projections are not supported")
  }
}

@PublishedApi
internal inline fun <reified T> cpTypeDescriptorOf(): TypeDescriptor {
  return TypeDescriptor(
    typeInfo = pTypeDescriptorOf<T>().toRawTypeDescriptor(),
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
