// Copyright 2022-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#ifdef RN_FABRIC_ENABLED
#ifdef __cplusplus
#import <React/RCTViewComponentView.h>

@interface ExpoFabricViewObjC : RCTViewComponentView
@end

#else

// Interface visible in Swift
@interface ExpoFabricViewObjC
@end

#endif // __cplusplus
#else // Paper
#import <React/RCTView.h>

@interface ExpoFabricViewObjC : RCTView
@end

#endif // RN_FABRIC_ENABLED

@class EXAppContext;

// Addition to the interface that is visible in both Swift and Objective-C
@interface ExpoFabricViewObjC (ExpoFabricViewInterface)

- (void)dispatchEvent:(nonnull NSString *)eventName payload:(nullable id)payload;

- (void)updateProps:(nonnull NSDictionary<NSString *, id> *)props;

- (void)viewDidUpdateProps;

- (BOOL)supportsPropWithName:(nonnull NSString *)name;

- (void)prepareForRecycle;

@end
