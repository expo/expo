// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Enum mirroring worklets::Serializable::ValueType for Swift exposure.
// Kept in sync with react-native-worklets; the adapter maps between the
// two when it hands instances of EXJavaScriptSerializable back.
typedef NS_ENUM(NSInteger, EXSerializableValueType) {
  EXSerializableValueTypeUndefined = 0,
  EXSerializableValueTypeNull = 1,
  EXSerializableValueTypeBoolean = 2,
  EXSerializableValueTypeNumber = 3,
  EXSerializableValueTypeBigInt = 4,
  EXSerializableValueTypeString = 5,
  EXSerializableValueTypeObject = 6,
  EXSerializableValueTypeArray = 7,
  EXSerializableValueTypeMap = 8,
  EXSerializableValueTypeSet = 9,
  EXSerializableValueTypeWorklet = 10,
  EXSerializableValueTypeRemoteFunction = 11,
  EXSerializableValueTypeHandle = 12,
  EXSerializableValueTypeHostObject = 13,
  EXSerializableValueTypeHostFunction = 14,
  EXSerializableValueTypeArrayBuffer = 15,
  EXSerializableValueTypeTurboModuleLike = 16,
  EXSerializableValueTypeImport = 17,
  EXSerializableValueTypeSynchronizable = 18,
  EXSerializableValueTypeCustom = 19,
} NS_SWIFT_NAME(SerializableValueType);

NS_SWIFT_NAME(JavaScriptSerializable)
@interface EXJavaScriptSerializable : NSObject

@property (nonatomic, readonly) EXSerializableValueType valueType;

/**
 Opaque handle owned by whichever provider created this instance
 (typically `ExpoModulesWorkletsAdapter`, which stores a
 `std::shared_ptr<worklets::Serializable>` inside its own NSObject
 container). Kept deliberately untyped so this header stays free of any
 C++ / `worklets::*` references and can live in a precompiled xcframework.
 */
@property (nonatomic, readonly, nonnull) id opaqueHandle;

- (nonnull instancetype)initWithOpaqueHandle:(nonnull id)opaqueHandle
                                    valueType:(EXSerializableValueType)valueType
    NS_DESIGNATED_INITIALIZER;

- (nonnull instancetype)init NS_UNAVAILABLE;

@end
