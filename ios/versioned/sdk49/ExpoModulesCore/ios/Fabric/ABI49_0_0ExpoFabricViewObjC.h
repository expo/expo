// Copyright 2022-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#ifdef RN_FABRIC_ENABLED
#ifdef __cplusplus
#import <ABI49_0_0React/ABI49_0_0RCTViewComponentView.h>

@interface ExpoFabricViewObjC : ABI49_0_0RCTViewComponentView
@end

#else

// Interface visible in Swift
@interface ExpoFabricViewObjC
@end

#endif // __cplusplus
#else // Paper
#import <ABI49_0_0React/ABI49_0_0RCTView.h>

@interface ExpoFabricViewObjC : ABI49_0_0RCTView
@end

#endif // RN_FABRIC_ENABLED

@class ABI49_0_0EXAppContext;

// Addition to the interface that is visible in both Swift and Objective-C
@interface ExpoFabricViewObjC (ExpoFabricViewInterface)

@property (nonatomic, strong, nullable) UIView *contentView;

- (void)dispatchEvent:(nonnull NSString *)eventName payload:(nullable id)payload;

- (void)updateProps:(nonnull NSDictionary<NSString *, id> *)props;

- (void)viewDidUpdateProps;

- (BOOL)supportsPropWithName:(nonnull NSString *)name;

- (void)prepareForRecycle;

#pragma mark - Methods injected to the class in runtime

- (nullable ABI49_0_0EXAppContext *)__injectedAppContext;
- (nonnull NSString *)__injectedModuleName;

@end
