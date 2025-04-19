
// Copyright 2023-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXJavaScriptRuntime.h>

NS_SWIFT_NAME(JavaScriptSharedObjectBinding)
@interface EXJavaScriptSharedObjectBinding : NSObject

@property (nonatomic, copy) EXJavaScriptObject* _Nonnull (^ _Nonnull getter)(void);

- (nonnull instancetype)initWith:(EXJavaScriptObject* _Nonnull (^_Nonnull)(void))getter;

- (EXJavaScriptObject*_Nonnull)get;

@end
