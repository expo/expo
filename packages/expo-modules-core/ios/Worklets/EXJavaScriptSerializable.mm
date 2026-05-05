// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesWorklets/EXJavaScriptSerializable.h>

@implementation EXJavaScriptSerializable

- (instancetype)initWithHandle:(nullable id)handle
                     valueType:(EXSerializableValueType)valueType
{
  if (self = [super init]) {
    _handle = handle;
    _valueType = valueType;
  }
  return self;
}

@end
