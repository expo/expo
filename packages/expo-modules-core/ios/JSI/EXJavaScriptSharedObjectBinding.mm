// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/EXJavaScriptSharedObjectBinding.h>

@implementation EXJavaScriptSharedObjectBinding

- (nonnull instancetype)initWith:(EXJavaScriptObject* (^_Nonnull)(void))getter {
  self.getter = getter;
  return self;
}

- (EXJavaScriptObject*)get {
  auto obj = self.getter();
  return obj;
}

@end
