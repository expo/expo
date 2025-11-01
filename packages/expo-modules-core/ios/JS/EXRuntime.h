// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesJSI/EXJavaScriptRuntime.h>
#import <ExpoModulesJSI/EXJavaScriptObject.h>

NS_SWIFT_NAME(ExpoRuntime)
@interface EXRuntime : EXJavaScriptRuntime

typedef void (^ClassConstructorBlock)(EXJavaScriptObject *_Nonnull thisValue, NSArray<EXJavaScriptValue *> *_Nonnull arguments);

#pragma mark - Shared objects

- (nonnull EXJavaScriptObject *)createSharedObjectClass:(nonnull NSString *)name
                                            constructor:(nonnull ClassConstructorBlock)constructor;

#pragma mark - Shared refs

- (nonnull EXJavaScriptObject *)createSharedRefClass:(nonnull NSString *)name
                                         constructor:(nonnull ClassConstructorBlock)constructor;

@end
