// Copyright 2024-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXSharedObjectUtils.h>
#import <ExpoModulesCore/SharedObject.h>

@implementation EXSharedObjectUtils

+ (void)setNativeState:(void *)runtimePointer
          valuePointer:(void *)valuePointer
              objectId:(long)objectId
              releaser:(ObjectReleaser)releaser
{
  auto &runtime = *reinterpret_cast<jsi::Runtime *>(runtimePointer);
  auto &value = *reinterpret_cast<jsi::Value *>(valuePointer);
  auto object = value.getObject(runtime);
  auto nativeState = std::make_shared<expo::SharedObject::NativeState>(
    objectId,
    [releaser](long id) { releaser(id); }
  );
  object.setNativeState(runtime, nativeState);
}

@end
