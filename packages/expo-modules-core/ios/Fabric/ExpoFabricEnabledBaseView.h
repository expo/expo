// Copyright 2022-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#ifdef RN_FABRIC_ENABLED
#ifdef __cplusplus
#import <React/RCTViewComponentView.h>

@interface ExpoFabricEnabledBaseView : RCTViewComponentView
@end

#else

// Interface visible in Swift
@interface ExpoFabricEnabledBaseView
@end

#endif // __cplusplus
#else // Paper
#import <React/RCTView.h>

@interface ExpoFabricEnabledBaseView : RCTView
@end

#endif // RN_FABRIC_ENABLED

@class EXAppContext;

@interface ExpoFabricEnabledBaseView (ExpoFabricViewInterface)

@property (nonatomic, strong, nullable) UIView *contentView;

- (nullable EXAppContext *)__injectedAppContext;
- (nonnull NSString *)__injectedModuleName;

@end
