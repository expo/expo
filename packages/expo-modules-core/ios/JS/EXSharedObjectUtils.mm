// Copyright 2024-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXSharedObjectUtils.h>
#import <ExpoModulesCore/SharedObject.h>

#import <ExpoModulesJSI/EXJavaScriptRuntime.h>

@implementation EXSharedObjectUtils

+ (void)setNativeState:(nonnull EXJavaScriptObject *)object
               runtime:(nonnull EXJavaScriptRuntime *)runtime
              objectId:(long)objectId
              releaser:(nonnull ObjectReleaser)releaser
{
  auto nativeState = std::make_shared<expo::SharedObject::NativeState>(objectId, releaser);
  [object get]->setNativeState(*[runtime get], nativeState);
}

@end
