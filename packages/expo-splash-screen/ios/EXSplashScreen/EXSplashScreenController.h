// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSplashScreenController : NSObject

- (instancetype)init NS_UNAVAILABLE;

- (instancetype)initWithRootView:(UIView *)rootView
                splashScreenView:(UIView *)splashScreenView;

- (void)showWithCallback:(void (^)(void))successCallback failureCallback:(void (^)(NSString *message))failureCallback;
- (void)preventAutoHideWithCallback:(void (^)(BOOL hasEffect))successCallback failureCallback:(void (^)(NSString *message))failureCallback;
- (void)hideWithCallback:(void (^)(BOOL hasEffect))successCallback failureCallback:(void (^)(NSString *message))failureCallback;
- (void)onAppContentDidAppear;
- (void)onAppContentWillReload;

@end

NS_ASSUME_NONNULL_END
