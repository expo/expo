// Copyright 2023-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXJavaScriptRuntime.h>

NS_ASSUME_NONNULL_BEGIN

typedef EXJavaScriptObject * _Nonnull (^EXJavaScriptObjectBindingGetter)(void);

NS_SWIFT_NAME(JavaScriptSharedObjectBinding)
@interface EXJavaScriptSharedObjectBinding : NSObject

@property (nonatomic, copy) EXJavaScriptObjectBindingGetter getter;

- (instancetype)initWithGetter:(EXJavaScriptObjectBindingGetter)getter
      NS_DESIGNATED_INITIALIZER
      NS_SWIFT_NAME(init(getter:));

- (instancetype)init NS_UNAVAILABLE;

- (EXJavaScriptObject *)get;

@end

NS_ASSUME_NONNULL_END
