// Copyright 2024-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXJavaScriptObject.h>

typedef void (^ObjectReleaser)(long objectId);

NS_SWIFT_NAME(SharedObjectUtils)
@interface EXSharedObjectUtils : NSObject

+ (void)setNativeState:(nonnull EXJavaScriptObject *)object
               runtime:(nonnull EXJavaScriptRuntime *)runtime
              objectId:(long)objectId
              releaser:(nonnull ObjectReleaser)releaser;

@end
