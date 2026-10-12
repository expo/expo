// Copyright 2024-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>

@protocol RCTSurfacePresenterStub;

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

/// The surface presenter of the host. It's typed with the protocol, because `RCTSurfacePresenter` declares
/// its conformance only in a category interface, so a runtime cast to the protocol fails in Swift.
- (nullable id<RCTSurfacePresenterStub>)surfacePresenter;

@end

