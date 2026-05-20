package expo.modules.kotlin.types

import android.net.Uri
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import expo.modules.core.arguments.ReadableArguments
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.typedarray.BigInt64Array
import expo.modules.kotlin.typedarray.BigUint64Array
import expo.modules.kotlin.typedarray.Float32Array
import expo.modules.kotlin.typedarray.Float64Array
import expo.modules.kotlin.typedarray.Int16Array
import expo.modules.kotlin.typedarray.Int32Array
import expo.modules.kotlin.typedarray.Int8Array
import expo.modules.kotlin.typedarray.TypedArray
import expo.modules.kotlin.typedarray.Uint16Array
import expo.modules.kotlin.typedarray.Uint32Array
import expo.modules.kotlin.typedarray.Uint8Array
import expo.modules.kotlin.typedarray.Uint8ClampedArray
import expo.modules.kotlin.types.descriptors.typeDescriptorOf
import java.io.File
import java.net.URI
import java.net.URL
import kotlin.collections.get

object AnyTypeCache {
  @PublishedApi
  internal val typesMap = mapOf(
    (Int::class to false) to AnyType(typeDescriptorOf<Int>()),
    (Float::class to false) to AnyType(typeDescriptorOf<Float>()),
    (Double::class to false) to AnyType(typeDescriptorOf<Double>()),
    (Long::class to false) to AnyType(typeDescriptorOf<Long>()),
    (Boolean::class to false) to AnyType(typeDescriptorOf<Boolean>()),
    (String::class to false) to AnyType(typeDescriptorOf<String>()),
    (ByteArray::class to false) to AnyType(typeDescriptorOf<ByteArray>()),
    (LongArray::class to false) to AnyType(typeDescriptorOf<LongArray>()),
    (IntArray::class to false) to AnyType(typeDescriptorOf<IntArray>()),
    (BooleanArray::class to false) to AnyType(typeDescriptorOf<BooleanArray>()),
    (FloatArray::class to false) to AnyType(typeDescriptorOf<FloatArray>()),
    (DoubleArray::class to false) to AnyType(typeDescriptorOf<DoubleArray>()),
    (JavaScriptValue::class to false) to AnyType(typeDescriptorOf<JavaScriptValue>()),
    (JavaScriptObject::class to false) to AnyType(typeDescriptorOf<JavaScriptObject>()),
    (TypedArray::class to false) to AnyType(typeDescriptorOf<TypedArray>()),
    (Int8Array::class to false) to AnyType(typeDescriptorOf<Int8Array>()),
    (Int16Array::class to false) to AnyType(typeDescriptorOf<Int16Array>()),
    (Int32Array::class to false) to AnyType(typeDescriptorOf<Int32Array>()),
    (Uint8Array::class to false) to AnyType(typeDescriptorOf<Uint8Array>()),
    (Uint8ClampedArray::class to false) to AnyType(typeDescriptorOf<Uint8ClampedArray>()),
    (Uint16Array::class to false) to AnyType(typeDescriptorOf<Uint16Array>()),
    (Uint32Array::class to false) to AnyType(typeDescriptorOf<Uint32Array>()),
    (Float32Array::class to false) to AnyType(typeDescriptorOf<Float32Array>()),
    (Float64Array::class to false) to AnyType(typeDescriptorOf<Float64Array>()),
    (BigInt64Array::class to false) to AnyType(typeDescriptorOf<BigInt64Array>()),
    (BigUint64Array::class to false) to AnyType(typeDescriptorOf<BigUint64Array>()),
    (ReadableArray::class to false) to AnyType(typeDescriptorOf<ReadableArray>()),
    (ReadableMap::class to false) to AnyType(typeDescriptorOf<ReadableMap>()),
    (URL::class to false) to AnyType(typeDescriptorOf<URL>()),
    (Uri::class to false) to AnyType(typeDescriptorOf<Uri>()),
    (URI::class to false) to AnyType(typeDescriptorOf<URI>()),
    (File::class to false) to AnyType(typeDescriptorOf<File>()),
    (Any::class to false) to AnyType(typeDescriptorOf<Any>()),
    (Unit::class to false) to AnyType(typeDescriptorOf<Unit>()),
    (ReadableArguments::class to false) to AnyType(typeDescriptorOf<ReadableArguments>()),

    (Int::class to true) to AnyType(typeDescriptorOf<Int?>()),
    (Float::class to true) to AnyType(typeDescriptorOf<Float?>()),
    (Double::class to true) to AnyType(typeDescriptorOf<Double?>()),
    (Long::class to true) to AnyType(typeDescriptorOf<Long?>()),
    (Boolean::class to true) to AnyType(typeDescriptorOf<Boolean?>()),
    (String::class to true) to AnyType(typeDescriptorOf<String?>()),
    (ByteArray::class to true) to AnyType(typeDescriptorOf<ByteArray?>()),
    (LongArray::class to true) to AnyType(typeDescriptorOf<LongArray?>()),
    (IntArray::class to true) to AnyType(typeDescriptorOf<IntArray?>()),
    (BooleanArray::class to true) to AnyType(typeDescriptorOf<BooleanArray?>()),
    (FloatArray::class to true) to AnyType(typeDescriptorOf<FloatArray?>()),
    (DoubleArray::class to true) to AnyType(typeDescriptorOf<DoubleArray?>()),
    (JavaScriptValue::class to true) to AnyType(typeDescriptorOf<JavaScriptValue?>()),
    (JavaScriptObject::class to true) to AnyType(typeDescriptorOf<JavaScriptObject?>()),
    (TypedArray::class to true) to AnyType(typeDescriptorOf<TypedArray?>()),
    (Int8Array::class to true) to AnyType(typeDescriptorOf<Int8Array?>()),
    (Int16Array::class to true) to AnyType(typeDescriptorOf<Int16Array?>()),
    (Int32Array::class to true) to AnyType(typeDescriptorOf<Int32Array?>()),
    (Uint8Array::class to true) to AnyType(typeDescriptorOf<Uint8Array?>()),
    (Uint8ClampedArray::class to true) to AnyType(typeDescriptorOf<Uint8ClampedArray?>()),
    (Uint16Array::class to true) to AnyType(typeDescriptorOf<Uint16Array?>()),
    (Uint32Array::class to true) to AnyType(typeDescriptorOf<Uint32Array?>()),
    (Float32Array::class to true) to AnyType(typeDescriptorOf<Float32Array?>()),
    (Float64Array::class to true) to AnyType(typeDescriptorOf<Float64Array?>()),
    (BigInt64Array::class to true) to AnyType(typeDescriptorOf<BigInt64Array?>()),
    (BigUint64Array::class to true) to AnyType(typeDescriptorOf<BigUint64Array?>()),
    (ReadableArray::class to true) to AnyType(typeDescriptorOf<ReadableArray?>()),
    (ReadableMap::class to true) to AnyType(typeDescriptorOf<ReadableMap?>()),
    (URL::class to true) to AnyType(typeDescriptorOf<URL?>()),
    (Uri::class to true) to AnyType(typeDescriptorOf<Uri?>()),
    (URI::class to true) to AnyType(typeDescriptorOf<URI?>()),
    (File::class to true) to AnyType(typeDescriptorOf<File?>()),
    (Any::class to true) to AnyType(typeDescriptorOf<Any?>()),
    (Unit::class to true) to AnyType(typeDescriptorOf<Unit?>()),
    (ReadableArguments::class to true) to AnyType(typeDescriptorOf<ReadableArguments?>())
  )
}

inline fun <reified T> AnyTypeCache.cachedAnyType(): AnyType? {
  val key = Pair(T::class, null is T)
  return typesMap[key]
}
