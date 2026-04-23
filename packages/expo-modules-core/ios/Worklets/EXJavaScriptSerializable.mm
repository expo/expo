// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesWorklets/EXJavaScriptSerializable.h>

@implementation EXJavaScriptSerializable {
  id _opaqueHandle;
}

- (nonnull instancetype)initWithOpaqueHandle:(nonnull id)opaqueHandle
                                    valueType:(EXSerializableValueType)valueType
{
  if (self = [super init]) {
    _opaqueHandle = opaqueHandle;
    _valueType = valueType;
  }
  return self;
}

- (nonnull id)opaqueHandle
{
  return _opaqueHandle;
}

@end
