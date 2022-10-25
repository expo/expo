// Copyright 2022-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXJavaScriptObject.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXJavaScriptRuntime.h>

// We need to redefine the C++ enum (see TypedArray.h) in an Objective-C way to expose it to Swift.
// Please keep them in-sync!
typedef NS_ENUM(NSInteger, ABI47_0_0EXTypedArrayKind) {
  Int8Array = 1,
  Int16Array = 2,
  Int32Array = 3,
  Uint8Array = 4,
  Uint8ClampedArray = 5,
  Uint16Array = 6,
  Uint32Array = 7,
  Float32Array = 8,
  Float64Array = 9,
  BigInt64Array = 10,
  BigUint64Array = 11,
} NS_SWIFT_NAME(TypedArrayKind);

NS_SWIFT_NAME(JavaScriptTypedArray)
@interface ABI47_0_0EXJavaScriptTypedArray : ABI47_0_0EXJavaScriptObject

@property (nonatomic) ABI47_0_0EXTypedArrayKind kind;

- (nonnull void *)getUnsafeMutableRawPointer;

@end
