package abi48_0_0.expo.modules.kotlin

import abi48_0_0.com.facebook.react.bridge.Dynamic
import abi48_0_0.com.facebook.react.bridge.ReadableArray

class ReadableArrayIterator(private val array: ReadableArray) : Iterator<Dynamic> {
  var current = 0

  override fun hasNext(): Boolean = current < array.size()

  override fun next(): Dynamic = array.getDynamic(current++)
}

fun ReadableArray.iterator(): ReadableArrayIterator = ReadableArrayIterator(this)
