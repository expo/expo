package expo.modules.kotlin.types

import android.os.Bundle
import expo.modules.kotlin.types.folly.FollyDynamicExtensionConverter
import kotlin.reflect.KClass
import kotlin.time.Duration
import kotlin.time.DurationUnit

object ReturnTypeProvider {
  val types = mutableMapOf<KClass<*>, ReturnType>()

  inline fun <reified T> get(): ReturnType {
    return types[T::class] ?: ReturnType(T::class).also {
      types[T::class] = it
    }
  }
}

inline fun <reified T> toReturnType(): ReturnType {
  return ReturnTypeProvider.get<T>()
}

interface ExperimentalJSTypeConverter<T> {
  fun convertToJS(value: Any?): Any?

  class PassThroughConverter : ExperimentalJSTypeConverter<Any> {
    override fun convertToJS(value: Any?): Any? {
      return value
    }
  }

  class BundleConverter : ExperimentalJSTypeConverter<Bundle> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Bundle?>(value)
      return value?.toJSValue(JSTypeConverter.DefaultContainerProvider)
    }
  }

  class ArrayConverter : ExperimentalJSTypeConverter<Array<*>> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Array<*>?>(value)
      return value?.toJSValue(JSTypeConverter.DefaultContainerProvider)
    }
  }

  class IntArrayConverter : ExperimentalJSTypeConverter<IntArray> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<IntArray?>(value)
      return value?.toJSValue(JSTypeConverter.DefaultContainerProvider)
    }
  }

  class FloatArrayConverter : ExperimentalJSTypeConverter<FloatArray> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<FloatArray?>(value)
      return value?.toJSValue(JSTypeConverter.DefaultContainerProvider)
    }
  }

  class DoubleArrayConverter : ExperimentalJSTypeConverter<DoubleArray> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<DoubleArray?>(value)
      return value?.toJSValue(JSTypeConverter.DefaultContainerProvider)
    }
  }

  class BooleanArrayConverter : ExperimentalJSTypeConverter<BooleanArray> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<BooleanArray?>(value)
      return value?.toJSValue(JSTypeConverter.DefaultContainerProvider)
    }
  }

  class ByteArrayConverter : ExperimentalJSTypeConverter<ByteArray> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<ByteArray?>(value)
      return value?.let { FollyDynamicExtensionConverter.put(it) }
    }
  }

  class MapConverter : ExperimentalJSTypeConverter<Map<*, *>> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Map<*, *>?>(value)
      return value?.toJSValueExperimental()
    }
  }

  class EnumConverter : ExperimentalJSTypeConverter<Enum<*>> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Enum<*>?>(value)
      return value?.toJSValue()
    }
  }

  class RecordConverter : ExperimentalJSTypeConverter<expo.modules.kotlin.records.Record> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<expo.modules.kotlin.records.Record?>(value)
      return value?.toJSValue(JSTypeConverter.DefaultContainerProvider)
    }
  }

  class URIConverter : ExperimentalJSTypeConverter<java.net.URI> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<java.net.URI?>(value)
      return value?.toJSValue()
    }
  }

  class URLConverter : ExperimentalJSTypeConverter<java.net.URL> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<java.net.URL?>(value)
      return value?.toJSValue()
    }
  }

  class AndroidUriConverter : ExperimentalJSTypeConverter<android.net.Uri> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<android.net.Uri?>(value)
      return value?.toJSValue()
    }
  }

  class FileConverter : ExperimentalJSTypeConverter<java.io.File> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<java.io.File?>(value)
      return value?.toJSValue()
    }
  }

  class PairConverter : ExperimentalJSTypeConverter<Pair<*, *>> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Pair<*, *>?>(value)
      return value?.toJSValue(JSTypeConverter.DefaultContainerProvider)
    }
  }

  class LongConverter : ExperimentalJSTypeConverter<Long> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Long?>(value)
      return value?.toDouble()
    }
  }

  class DurationConverter : ExperimentalJSTypeConverter<Duration> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Duration?>(value)
      return value?.toDouble(DurationUnit.SECONDS)
    }
  }

  class RawTypedArrayHolderConverter : ExperimentalJSTypeConverter<expo.modules.kotlin.typedarray.RawTypedArrayHolder> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<expo.modules.kotlin.typedarray.RawTypedArrayHolder?>(value)
      return value?.rawArray
    }
  }

  class CollectionConverter : ExperimentalJSTypeConverter<Collection<*>> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Collection<*>?>(value)
      return value?.toJSValueExperimental()
    }
  }

  class AnyConverter : ExperimentalJSTypeConverter<Any> {
    override fun convertToJS(value: Any?): Any? {
      return JSTypeConverter.convertToJSValue(value, useExperimentalConverter = true)
    }
  }
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
      inheritFrom<expo.modules.kotlin.typedarray.RawTypedArrayHolder>() -> ExperimentalJSTypeConverter.RawTypedArrayHolderConverter()
      inheritFrom<Array<*>>() -> ExperimentalJSTypeConverter.ArrayConverter()
      inheritFrom<Collection<*>>() -> ExperimentalJSTypeConverter.CollectionConverter()
      else -> ExperimentalJSTypeConverter.PassThroughConverter()
    }
  }

  fun convertToJS(value: Any?): Any? {
    return converter.convertToJS(value)
  }

  internal inline fun <reified T> inheritFrom(): Boolean {
    val jClass = klass.java
    return T::class.java.isAssignableFrom(jClass)
  }
}
