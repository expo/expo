// Copyright 2024-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>

#ifdef __cplusplus
#import <ReactCommon/RCTHost.h>
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

- (nullable NSURL *)bundleURL;

/**
 Adds an observer to the surface presenter of the host. The observer is held weakly and should implement
 the `RCTSurfacePresenterObserver` methods. It's typed as `id`, because the protocol comes from React,
 which ExpoModulesCore doesn't import publicly in Swift.
 */
- (void)addSurfacePresenterObserver:(nonnull id)observer;

@end

