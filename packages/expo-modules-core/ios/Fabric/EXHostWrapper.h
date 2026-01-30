// Copyright 2024-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>
#import <ExpoModulesJSI/JavaScriptRuntimeProvider.h>

#ifdef __cplusplus
#import <ReactCommon/RCTHost.h>
#import <jsi/jsi.h>
#endif

/**
 A wrapper around RCTHost. RCTHost isn't directly available in Swift.
 */
NS_SWIFT_NAME(ExpoHostWrapper)
@interface EXHostWrapper : NSObject

#ifdef __cplusplus
- (instancetype _Nonnull)initWithHost:(RCTHost * _Nonnull)host;
#endif

- (nullable UIView *)findViewWithTag:(NSInteger)tag;

- (nullable id)findModuleWithName:(nonnull NSString *)name lazilyLoadIfNecessary:(BOOL)lazilyLoadIfNecessary;

@end

@interface EXRuntimeWrapper : NSObject <JavaScriptRuntimeProvider>

@end
