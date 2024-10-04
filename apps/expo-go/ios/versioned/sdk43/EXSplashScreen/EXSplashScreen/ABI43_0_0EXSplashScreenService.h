// Copyright 2016-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXSingletonModule.h>
#import <ABI43_0_0EXSplashScreen/ABI43_0_0EXSplashScreenViewController.h>
#import <ABI43_0_0EXSplashScreen/ABI43_0_0EXSplashScreenViewProvider.h>

NS_ASSUME_NONNULL_BEGIN

/**
* Entry point for handling SplashScreen associated mechanism.
* This class has state based on the following relation { ViewController -> ApplicationSplashScreenState }.
* Each method call has to be made using ViewController that holds Application's view hierachy.
*/
@protocol ABI43_0_0EXSplashScreenService <NSObject>

/**
 * Overloaded method. See main method below.
 */
- (void)showSplashScreenFor:(UIViewController *)viewController;

/**
 * Entry point for SplashScreen unimodule.
 * Registers SplashScreen for given viewController and presents it in that viewController.
 */
- (void)showSplashScreenFor:(UIViewController *)viewController
   splashScreenViewProvider:(id<ABI43_0_0EXSplashScreenViewProvider>)splashScreenViewProvider
            successCallback:(void (^)(void))successCallback
            failureCallback:(void (^)(NSString *message))failureCallback;

/**
 * Entry point for SplashScreen unimodule.
 * Registers SplashScreen for given viewController and ABI43_0_0EXSplashController and presents it in that viewController.
 */
-(void)showSplashScreenFor:(UIViewController *)viewController
    splashScreenController:(ABI43_0_0EXSplashScreenViewController *)splashScreenController
           successCallback:(void (^)(void))successCallback
           failureCallback:(void (^)(NSString *message))failureCallback;

/**
 * Hides SplashScreen for given viewController.
 */
- (void)hideSplashScreenFor:(UIViewController *)viewController
            successCallback:(void (^)(BOOL hasEffect))successCallback
            failureCallback:(void (^)(NSString *message))failureCallback;

/**
 * Prevents SplashScreen from default autohiding.
 */
- (void)preventSplashScreenAutoHideFor:(UIViewController *)viewController
                       successCallback:(void (^)(BOOL hasEffect))successCallback
                       failureCallback:(void (^)(NSString *message))failureCallback;

/**
 * Signaling method that has to be called upon Content is rendered in view hierarchy.
 * Autohide functionality depends on this call.
 */
- (void)onAppContentDidAppear:(UIViewController *)viewController;

/**
 * Signaling method that is responsible for reshowing SplashScreen upon full content reload.
 */
- (void)onAppContentWillReload:(UIViewController *)viewController;

@end

@interface ABI43_0_0EXSplashScreenService : ABI43_0_0EXSingletonModule <ABI43_0_0EXSplashScreenService, UIApplicationDelegate>
@end

NS_ASSUME_NONNULL_END
