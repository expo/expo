package expo.modules.kotlin

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray

class ReadableArrayIterator(private val array: ReadableArray) : Iterator<Dynamic> {
  var current = -1

  override fun hasNext(): Boolean {
    return current < array.size()
  }

  override fun next(): Dynamic {
    return array.getDynamic(++current)
  }
}

fun ReadableArray.iterator(): ReadableArrayIterator {
  return ReadableArrayIterator(this)
}
