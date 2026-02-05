package expo.modules.kotlin.types

import android.os.Bundle
import expo.modules.kotlin.records.formatters.FormattedRecord
import kotlin.reflect.KClass
import kotlin.time.Duration

object ReturnTypeProvider {
  val types = mutableMapOf<KClass<*>, ReturnType>()
}

inline fun <reified T> ReturnTypeProvider.get(): ReturnType {
  return types[T::class] ?: ReturnType(T::class).also {
    types[T::class] = it
  }
}

inline fun <reified T> toReturnType(): ReturnType {
  return ReturnTypeProvider.get<T>()
}

class ReturnType(
  private val klass: KClass<*>
) {
  private val converter: JSTypeConverter<*> = run {
    val directConverter = when (klass) {
      Unit::class -> JSTypeConverter.PassThroughConverter()
      Bundle::class -> JSTypeConverter.BundleConverter()
      IntArray::class -> JSTypeConverter.IntArrayConverter()
      FloatArray::class -> JSTypeConverter.FloatArrayConverter()
      DoubleArray::class -> JSTypeConverter.DoubleArrayConverter()
      BooleanArray::class -> JSTypeConverter.BooleanArrayConverter()
      ByteArray::class -> JSTypeConverter.ByteArrayConverter()
      java.net.URI::class -> JSTypeConverter.URIConverter()
      java.net.URL::class -> JSTypeConverter.URLConverter()
      android.net.Uri::class -> JSTypeConverter.AndroidUriConverter()
      java.io.File::class -> JSTypeConverter.FileConverter()
      Pair::class -> JSTypeConverter.PairConverter()
      Long::class -> JSTypeConverter.LongConverter()
      Duration::class -> JSTypeConverter.DurationConverter()
      Any::class -> JSTypeConverter.AnyConverter()
      else -> null
    }

    directConverter ?: when {
      inheritFrom<Map<*, *>>() -> JSTypeConverter.MapConverter()
      inheritFrom<Enum<*>>() -> JSTypeConverter.EnumConverter()
      inheritFrom<expo.modules.kotlin.records.Record>() -> JSTypeConverter.RecordConverter()
      inheritFrom<FormattedRecord<*>>() -> JSTypeConverter.FormattedRecordConverter()
      inheritFrom<expo.modules.kotlin.typedarray.RawTypedArrayHolder>() -> JSTypeConverter.RawTypedArrayHolderConverter()
      inheritFrom<Array<*>>() -> JSTypeConverter.ArrayConverter()
      inheritFrom<Collection<*>>() -> JSTypeConverter.CollectionConverter()
      else -> JSTypeConverter.PassThroughConverter()
    }
  }

  fun convertToJS(value: Any?): Any? {
    return converter.convertToJS(value)
  }

  val cppType: expo.modules.kotlin.jni.ReturnType
    get() = converter.returnType

  internal inline fun <reified T> inheritFrom(): Boolean {
    val jClass = klass.java
    return T::class.java.isAssignableFrom(jClass)
  }
}
