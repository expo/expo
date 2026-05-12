package expo.modules.kotlin.types

import android.net.Uri
import android.os.Bundle
import expo.modules.kotlin.jni.ReturnType
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.formatters.FormattedRecord
import expo.modules.kotlin.typedarray.RawTypedArrayHolder
import expo.modules.kotlin.types.folly.FollyDynamicExtensionConverter
import io.github.lukmccall.pika.PIntrospectionData
import java.io.File
import java.net.URI
import java.net.URL
import kotlin.time.Duration
import kotlin.time.DurationUnit

interface JSTypeConverter<T> {
  fun convertToJS(value: Any?): Any?
  val returnType: ReturnType

  object PassThroughConverter : JSTypeConverter<Any> {
    override fun convertToJS(value: Any?): Any? {
      return value
    }

    override val returnType: ReturnType
      get() = ReturnType.UNKNOWN
  }

  object BundleConverter : JSTypeConverter<Bundle> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Bundle?>(value)
      return value?.toJSValue(JSTypeConverterProvider.DefaultContainerProvider)
    }

    override val returnType: ReturnType
      get() = ReturnType.WRITEABLE_MAP
  }

  object ArrayConverter : JSTypeConverter<Array<*>> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Array<*>?>(value)
      return value?.toJSValue(JSTypeConverterProvider.DefaultContainerProvider)
    }

    override val returnType: ReturnType
      get() = ReturnType.WRITEABLE_ARRAY
  }

  object IntArrayConverter : JSTypeConverter<IntArray> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<IntArray?>(value)
      return value?.toJSValue(JSTypeConverterProvider.DefaultContainerProvider)
    }

    override val returnType: ReturnType
      get() = ReturnType.INT_ARRAY
  }

  object FloatArrayConverter : JSTypeConverter<FloatArray> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<FloatArray?>(value)
      return value?.toJSValue(JSTypeConverterProvider.DefaultContainerProvider)
    }

    override val returnType: ReturnType
      get() = ReturnType.FLOAT_ARRAY
  }

  object DoubleArrayConverter : JSTypeConverter<DoubleArray> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<DoubleArray?>(value)
      return value?.toJSValue(JSTypeConverterProvider.DefaultContainerProvider)
    }

    override val returnType: ReturnType
      get() = ReturnType.DOUBLE_ARRAY
  }

  object BooleanArrayConverter : JSTypeConverter<BooleanArray> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<BooleanArray?>(value)
      return value?.toJSValue(JSTypeConverterProvider.DefaultContainerProvider)
    }

    override val returnType: ReturnType
      get() = ReturnType.BOOLEAN_ARRAY
  }

  object ByteArrayConverter : JSTypeConverter<ByteArray> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<ByteArray?>(value)
      return value?.let { FollyDynamicExtensionConverter.put(it) }
    }

    override val returnType: ReturnType
      get() = ReturnType.STRING
  }

  object MapConverter : JSTypeConverter<Map<*, *>> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Map<*, *>?>(value)
      return value?.toJSValueExperimental()
    }

    override val returnType: ReturnType
      get() = ReturnType.MAP
  }

  object EnumConverter : JSTypeConverter<Enum<*>> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Enum<*>?>(value)
      return value?.toJSValue()
    }

    override val returnType: ReturnType
      get() = ReturnType.UNKNOWN // TODO(@lukmccall): Define proper ReturnType for Enums
  }

  object RecordConverter : JSTypeConverter<Record> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Record?>(value)
      return value?.toJSValueExperimental(null)
    }

    override val returnType: ReturnType
      get() = ReturnType.MAP
  }

  class IntrospectableRecordConverter(
    private val introspectableData: PIntrospectionData<Record>
  ) : JSTypeConverter<Record> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Record?>(value)
      return value?.toJSValueExperimental(introspectableData)
    }

    override val returnType: ReturnType
      get() = ReturnType.MAP
  }

  object URIConverter : JSTypeConverter<URI> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<URI?>(value)
      return value?.toJSValue()
    }

    override val returnType: ReturnType
      get() = ReturnType.STRING
  }

  object URLConverter : JSTypeConverter<URL> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<URL?>(value)
      return value?.toJSValue()
    }

    override val returnType: ReturnType
      get() = ReturnType.STRING
  }

  object AndroidUriConverter : JSTypeConverter<Uri> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Uri?>(value)
      return value?.toJSValue()
    }

    override val returnType: ReturnType
      get() = ReturnType.STRING
  }

  object FileConverter : JSTypeConverter<File> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<File?>(value)
      return value?.toJSValue()
    }

    override val returnType: ReturnType
      get() = ReturnType.STRING
  }

  object PairConverter : JSTypeConverter<Pair<*, *>> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Pair<*, *>?>(value)
      return value?.toJSValue(JSTypeConverterProvider.DefaultContainerProvider)
    }

    override val returnType: ReturnType
      get() = ReturnType.WRITEABLE_ARRAY
  }

  object LongConverter : JSTypeConverter<Long> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Long?>(value)
      return value?.toDouble()
    }

    override val returnType: ReturnType
      get() = ReturnType.LONG
  }

  object DurationConverter : JSTypeConverter<Duration> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Duration?>(value)
      return value?.toDouble(DurationUnit.SECONDS)
    }

    override val returnType: ReturnType
      get() = ReturnType.DOUBLE
  }

  object RawTypedArrayHolderConverter : JSTypeConverter<RawTypedArrayHolder> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<RawTypedArrayHolder?>(value)
      return value?.rawArray
    }

    override val returnType: ReturnType
      get() = ReturnType.JS_TYPED_ARRAY
  }

  object CollectionConverter : JSTypeConverter<Collection<*>> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<Collection<*>?>(value)
      return value?.toJSValueExperimental()
    }

    override val returnType: ReturnType
      get() = ReturnType.COLLECTION
  }

  object AnyConverter : JSTypeConverter<Any> {
    override fun convertToJS(value: Any?): Any? {
      return JSTypeConverterProvider.convertToJSValue(value, useExperimentalConverter = true)
    }

    override val returnType: ReturnType
      get() = ReturnType.UNKNOWN
  }

  object FormattedRecordConverter : JSTypeConverter<FormattedRecord<*>> {
    override fun convertToJS(value: Any?): Any? {
      enforceType<FormattedRecord<*>?>(value)
      return value?.toJSValueExperimental()
    }

    override val returnType: ReturnType
      get() = ReturnType.MAP
  }
}
