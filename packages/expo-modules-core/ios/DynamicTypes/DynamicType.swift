// Copyright 2021-present 650 Industries. All rights reserved.

// Function names should start with a lowercase character, but in this one case
// we want it to be uppercase as we treat it more like a generic class.
// swiftlint:disable identifier_name

/**
 Factory creating an instance of the dynamic type wrapper conforming to `AnyDynamicType`.
 Depending on the given type, it may return one of `DynamicArrayType`, `DynamicOptionalType`, `DynamicConvertibleType`, etc.
 Note that this goes through many type checks, thus it might be a bit more expensive than using generic type constraints,
 see the `~` prefix operator below that handles types conforming to `AnyArgument` in a faster way.
 */
private func DynamicType<T>(_ type: T.Type) -> AnyDynamicType {
  if let ArrayType = T.self as? AnyArray.Type {
    return DynamicArrayType(elementType: ArrayType.getElementDynamicType())
  }
  if let DictionaryType = T.self as? AnyDictionary.Type {
    return DynamicDictionaryType(valueType: DictionaryType.getValueDynamicType())
  }
  if let OptionalType = T.self as? any AnyOptional.Type {
    return DynamicOptionalType(wrappedType: OptionalType.getWrappedDynamicType())
  }
  if let ConvertibleType = T.self as? Convertible.Type {
    return DynamicConvertibleType(innerType: ConvertibleType)
  }
  if let EnumType = T.self as? any Enumerable.Type {
    return DynamicEnumType(innerType: EnumType)
  }
  if let ViewType = T.self as? UIView.Type {
    return DynamicViewType(innerType: ViewType)
  }
  if let SharedObjectType = T.self as? SharedObject.Type {
    return DynamicSharedObjectType(innerType: SharedObjectType)
  }
  if let TypedArrayType = T.self as? AnyTypedArray.Type {
    return DynamicTypedArrayType(innerType: TypedArrayType)
  }
  if let DataType = T.self as? Data.Type {
    return DynamicDataType()
  }
  if let JavaScriptValueType = T.self as? any AnyJavaScriptValue.Type {
    return DynamicJavaScriptType(innerType: JavaScriptValueType)
  }
  return DynamicRawType(innerType: T.self)
}

/**
 Handy prefix operator that makes the dynamic type from the static type.
 */
prefix operator ~
internal prefix func ~ <T>(type: T.Type) -> AnyDynamicType {
  return DynamicType(type)
}

internal prefix func ~ <T>(type: T.Type) -> AnyDynamicType where T: AnyArgument {
  return T.getDynamicType()
}
