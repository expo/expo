@file:Suppress("MemberVisibilityCanBePrivate")

package android.os

import java.util.*
import kotlin.collections.LinkedHashMap

class Bundle {

  var keyToStructure = LinkedHashMap<String, LinkedHashMap<String, *>>()

  var stringArrayLists = LinkedHashMap<String, ArrayList<String?>?>()
  var stringArrays = LinkedHashMap<String, Array<String?>?>()
  var strings = LinkedHashMap<String, String?>()
  var charSequenceArrayLists = LinkedHashMap<String, ArrayList<CharSequence?>?>()
  var charSequenceArrays = LinkedHashMap<String, Array<CharSequence?>?>()
  var charSequences = LinkedHashMap<String, CharSequence?>()
  var booleans = LinkedHashMap<String, Boolean?>()
  var booleanArrays = LinkedHashMap<String, BooleanArray?>()
  var integers = LinkedHashMap<String, Int?>()
  var integerArrays = LinkedHashMap<String, IntArray?>()
  var shorts = LinkedHashMap<String, Short?>()
  var shortArrays = LinkedHashMap<String, ShortArray?>()
  var floats = LinkedHashMap<String, Float?>()
  var floatArrays = LinkedHashMap<String, FloatArray?>()
  var double = LinkedHashMap<String, Double?>()
  var doubleArrays = LinkedHashMap<String, DoubleArray?>()
  var chars = LinkedHashMap<String, Char?>()
  var charArrays = LinkedHashMap<String, CharArray?>()
  var bytes = LinkedHashMap<String, Byte?>()
  var byteArrays = LinkedHashMap<String, ByteArray?>()
  var integerArrayLists = LinkedHashMap<String, ArrayList<Int>?>()
  var parcelables = LinkedHashMap<String, Parcelable?>()
  var parcelablesArrayList = LinkedHashMap<String, ArrayList<Parcelable?>?>()
  var parcelableArrays = LinkedHashMap<String, Array<Parcelable?>?>()
  var bundles: MutableList<Bundle> = LinkedList()

  val keysInOrder: List<String>
    get() = keyToStructure.map { it.key }

  fun putStringArrayList(key: String, value: ArrayList<String?>?) {
    addKey(key, value, stringArrayLists)
  }

  fun putStringArray(key: String, value: Array<String?>?) {
    addKey(key, value, stringArrays)
  }

  fun putString(key: String, value: String?) {
    addKey(key, value, strings)
  }

  fun putCharSequenceArrayList(key: String, value: ArrayList<CharSequence?>?) {
    addKey(key, value, charSequenceArrayLists)
  }

  fun putCharSequenceArray(key: String, value: Array<CharSequence?>?) {
    addKey(key, value, charSequenceArrays)
  }

  fun putCharSequence(key: String, value: CharSequence?) {
    addKey(key, value, charSequences)
  }

  fun putBoolean(key: String, value: Boolean) {
    addKey(key, value, booleans)
  }

  fun putBooleanArray(key: String, value: BooleanArray?) {
    addKey(key, value, booleanArrays)
  }

  fun putInteger(key: String, value: Int) {
    addKey(key, value, integers)
  }

  fun putIntegerArray(key: String, value: IntArray?) {
    addKey(key, value, integerArrays)
  }

  fun putShort(key: String, value: Short) {
    addKey(key, value, shorts)
  }

  fun putShortArray(key: String, value: ShortArray?) {
    addKey(key, value, shortArrays)
  }

  fun putFloat(key: String, value: Float) {
    addKey(key, value, floats)
  }

  fun putFloatArray(key: String, value: FloatArray?) {
    addKey(key, value, floatArrays)
  }

  fun putDouble(key: String, value: Double) {
    addKey(key, value, double)
  }

  fun putDoubleArray(key: String, value: DoubleArray?) {
    addKey(key, value, doubleArrays)
  }

  fun putChar(key: String, value: Char) {
    addKey(key, value, chars)
  }

  fun putCharArray(key: String, value: CharArray?) {
    addKey(key, value, charArrays)
  }

  fun putByte(key: String, value: Byte) {
    addKey(key, value, bytes)
  }

  fun putByteArray(key: String, value: ByteArray?) {
    addKey(key, value, byteArrays)
  }

  fun putIntegerArrayList(key: String, value: ArrayList<Int>?) {
    addKey(key, value, integerArrayLists)
  }

  fun putParcelable(key: String, value: Parcelable?) {
    addKey(key, value, parcelables)
  }

  fun putParcelablesArrayLis(key: String, value: ArrayList<Parcelable?>?) {
    addKey(key, value, parcelablesArrayList)
  }

  fun putParcelableArray(key: String, value: Array<Parcelable?>?) {
    addKey(key, value, parcelableArrays)
  }

  fun putAll(bundle: Bundle) {
    bundles.add(bundle)
  }

  fun keySet(): Set<String> {
    return keyToStructure.keys
  }

  private fun <T> addKey(key: String, value: T, structure: LinkedHashMap<String, T>) {
    if(keyToStructure.containsKey(key)) {
      keyToStructure[key]!!.remove(key)
    }
    structure.put(key, value)
    keyToStructure.put(key, structure)
  }

}

val Bundle.putStringArrayLists: LinkedHashMap<String, ArrayList<String?>?>
  get() = this.stringArrayLists
val Bundle.putStringArrays: LinkedHashMap<String, Array<String?>?>
  get() = this.stringArrays
val Bundle.putStrings: LinkedHashMap<String, String?>
  get() = this.strings
val Bundle.putCharSequenceArrayLists: LinkedHashMap<String, ArrayList<CharSequence?>?>
  get() = this.charSequenceArrayLists
val Bundle.putCharSequenceArrays: LinkedHashMap<String, Array<CharSequence?>?>
  get() = this.charSequenceArrays
val Bundle.putCharSequences: LinkedHashMap<String, CharSequence?>
  get() = this.charSequences
val Bundle.putBooleans: LinkedHashMap<String, Boolean?>
  get() = this.booleans
val Bundle.putBooleanArrays: LinkedHashMap<String, BooleanArray?>
  get() = this.booleanArrays
val Bundle.putIntegers: LinkedHashMap<String, Int?>
  get() = this.integers
val Bundle.putIntegerArrays: LinkedHashMap<String, IntArray?>
  get() = this.integerArrays
val Bundle.putShorts: LinkedHashMap<String, Short?>
  get() = this.shorts
val Bundle.putShortArrays: LinkedHashMap<String, ShortArray?>
  get() = this.shortArrays
val Bundle.putFloats: LinkedHashMap<String, Float?>
  get() = this.floats
val Bundle.putFloatArrays: LinkedHashMap<String, FloatArray?>
  get() = this.floatArrays
val Bundle.putDouble: LinkedHashMap<String, Double?>
  get() = this.double
val Bundle.putDoubleArrays: LinkedHashMap<String, DoubleArray?>
  get() = this.doubleArrays
val Bundle.putChars: LinkedHashMap<String, Char?>
  get() = this.chars
val Bundle.putCharArrays: LinkedHashMap<String, CharArray?>
  get() = this.charArrays
val Bundle.putBytes: LinkedHashMap<String, Byte?>
  get() = this.bytes
val Bundle.putByteArrays: LinkedHashMap<String, ByteArray?>
  get() = this.byteArrays
val Bundle.putIntegerArrayLists: LinkedHashMap<String, ArrayList<Int>?>
  get() = this.integerArrayLists
val Bundle.putParcelables: LinkedHashMap<String, Parcelable?>
  get() = this.parcelables
val Bundle.putParcelablesArrayList: LinkedHashMap<String, ArrayList<Parcelable?>?>
  get() = this.parcelablesArrayList
val Bundle.putParcelableArrays: LinkedHashMap<String, Array<Parcelable?>?>
  get() = this.parcelableArrays

val Bundle.putBundles:MutableList<Bundle>
  get() = this.bundles
val Bundle.orderedKeys:List<String>
  get() = this.keysInOrder