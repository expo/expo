// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesJSI/EXJavaScriptObject.h>
#import <ExpoModulesJSI/EXJavaScriptRuntime.h>

NS_SWIFT_NAME(JSUtils)
@interface EXJSUtils : NSObject

+ (nonnull EXJavaScriptObject *)createNativeModuleObject:(nonnull EXJavaScriptRuntime *)runtime;

+ (void)emitEvent:(nonnull NSString *)eventName
         toObject:(nonnull EXJavaScriptObject *)object
    withArguments:(nonnull NSArray<id> *)arguments
        inRuntime:(nonnull EXJavaScriptRuntime *)runtime;

@end
