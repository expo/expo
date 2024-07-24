// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.kotlin.types

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType

class ByteArrayTypeConverter(isOptional: Boolean) : NullAwareTypeConverter<ByteArray>(isOptional) {
  override fun convertNonOptional(value: Any, context: AppContext?): ByteArray = value as ByteArray
  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.UINT8_TYPED_ARRAY)
  override fun isTrivial() = false
}
