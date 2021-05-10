// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI41_0_0EXSplashScreen/ABI41_0_0EXSplashScreenViewProvider.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXSplashScreenController : NSObject

- (instancetype)init NS_UNAVAILABLE;

- (instancetype)initWithViewController:(UIViewController *)viewController
              splashScreenViewProvider:(id<ABI41_0_0EXSplashScreenViewProvider>)splashScreenViewProvider;

- (void)showWithCallback:(void (^)(void))successCallback failureCallback:(void (^)(NSString *message))failureCallback;
- (void)preventAutoHideWithCallback:(void (^)(BOOL hasEffect))successCallback failureCallback:(void (^)(NSString *message))failureCallback;
- (void)hideWithCallback:(void (^)(BOOL hasEffect))successCallback failureCallback:(void (^)(NSString *message))failureCallback;
- (void)onAppContentDidAppear;
- (void)onAppContentWillReload;

@end

NS_ASSUME_NONNULL_END
