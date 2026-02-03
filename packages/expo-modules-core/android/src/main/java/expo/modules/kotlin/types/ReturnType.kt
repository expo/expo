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
  private val converter: ExperimentalJSTypeConverter<*> = run {
    val directConverter = when (klass) {
      Unit::class -> ExperimentalJSTypeConverter.PassThroughConverter()
      Bundle::class -> ExperimentalJSTypeConverter.BundleConverter()
      IntArray::class -> ExperimentalJSTypeConverter.IntArrayConverter()
      FloatArray::class -> ExperimentalJSTypeConverter.FloatArrayConverter()
      DoubleArray::class -> ExperimentalJSTypeConverter.DoubleArrayConverter()
      BooleanArray::class -> ExperimentalJSTypeConverter.BooleanArrayConverter()
      ByteArray::class -> ExperimentalJSTypeConverter.ByteArrayConverter()
      java.net.URI::class -> ExperimentalJSTypeConverter.URIConverter()
      java.net.URL::class -> ExperimentalJSTypeConverter.URLConverter()
      android.net.Uri::class -> ExperimentalJSTypeConverter.AndroidUriConverter()
      java.io.File::class -> ExperimentalJSTypeConverter.FileConverter()
      Pair::class -> ExperimentalJSTypeConverter.PairConverter()
      Long::class -> ExperimentalJSTypeConverter.LongConverter()
      Duration::class -> ExperimentalJSTypeConverter.DurationConverter()
      Any::class -> ExperimentalJSTypeConverter.AnyConverter()
      else -> null
    }

    directConverter ?: when {
      inheritFrom<Map<*, *>>() -> ExperimentalJSTypeConverter.MapConverter()
      inheritFrom<Enum<*>>() -> ExperimentalJSTypeConverter.EnumConverter()
      inheritFrom<expo.modules.kotlin.records.Record>() -> ExperimentalJSTypeConverter.RecordConverter()
      inheritFrom<FormattedRecord<*>>() -> ExperimentalJSTypeConverter.FormattedRecordConverter()
      inheritFrom<expo.modules.kotlin.typedarray.RawTypedArrayHolder>() -> ExperimentalJSTypeConverter.RawTypedArrayHolderConverter()
      inheritFrom<Array<*>>() -> ExperimentalJSTypeConverter.ArrayConverter()
      inheritFrom<Collection<*>>() -> ExperimentalJSTypeConverter.CollectionConverter()
      else -> ExperimentalJSTypeConverter.PassThroughConverter()
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
