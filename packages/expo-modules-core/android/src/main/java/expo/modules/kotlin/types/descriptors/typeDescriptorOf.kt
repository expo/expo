package expo.modules.kotlin.types.descriptors

import android.util.Log
import io.github.lukmccall.pika.PTypeDescriptor
import kotlin.reflect.typeOf
import io.github.lukmccall.pika.typeDescriptorOf as pikaTypeDescriptorOf

@PublishedApi
internal fun PTypeDescriptor.toRawTypeDescriptor(): RawTypeDescriptor {
  return when (this) {
    is PTypeDescriptor.Concrete -> {
      if (this is PTypeDescriptor.Concrete.Parameterized) {
        RawTypeDescriptor.Parameterized(
          pType.jClass,
          isNullable,
          introspection,
          parameters.map { it.toRawTypeDescriptor() }
        )
      } else {
        RawTypeDescriptor.Simple(
          pType.jClass,
          isNullable,
          introspection
        )
      }
    }

    PTypeDescriptor.Star -> error("Star projections are not supported")
  }
}

@PublishedApi
internal inline fun <reified T> ctTypeDescriptorOf(): TypeDescriptor {
  val typeDescriptor = pikaTypeDescriptorOf<T>().toRawTypeDescriptor()
  val kTypeProvider = { typeOf<T>() }

  return TypeDescriptor(
    typeDescriptor,
    kTypeProvider
  )
}

inline fun <reified T> typeDescriptorOf(): TypeDescriptor {
  val typeDescriptor = runCatching { ctTypeDescriptorOf<T>() }
    .onFailure {
      Log.e("ExpoModulesCore", "Failed to get type info for ${T::class.java.name}", it)
    }
    .getOrNull()

  if (typeDescriptor != null) {
    return typeDescriptor
  }

  return typeOf<T>().toTypeDescriptor()
}
