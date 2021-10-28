package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic

interface TypeConverter {
  fun canHandleConversion(toType: KClassTypeWrapper): Boolean
  fun convert(jsValue: Dynamic, toType: KClassTypeWrapper): Any
}
