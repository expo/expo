// Copyright 2016-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXSingletonModule.h>
#import <EXSplashScreen/EXSplashScreenViewController.h>
#import <EXSplashScreen/EXSplashScreenViewProvider.h>

NS_ASSUME_NONNULL_BEGIN

/**
* Entry point for handling SplashScreen associated mechanism.
* This class has state based on the following relation { ViewController -> ApplicationSplashScreenState }.
* Each method call has to be made using ViewController that holds Application's view hierachy.
*/
@protocol EXSplashScreenService <NSObject>

/**
 * Overloaded method. See main method below.
 */
- (void)showSplashScreenFor:(UIViewController *)viewController;

/**
 * Entry point for SplashScreen unimodule.
 * Registers SplashScreen for given viewController and presents it in that viewController.
 */
- (void)showSplashScreenFor:(UIViewController *)viewController
   splashScreenViewProvider:(id<EXSplashScreenViewProvider>)splashScreenViewProvider
            successCallback:(void (^)(void))successCallback
            failureCallback:(void (^)(NSString *message))failureCallback;

/**
 * Entry point for SplashScreen unimodule.
 * Registers SplashScreen for given viewController and EXSplashController and presents it in that viewController.
 */
-(void)showSplashScreenFor:(UIViewController *)viewController
    splashScreenController:(EXSplashScreenViewController *)splashScreenController
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

@interface EXSplashScreenService : EXSingletonModule <EXSplashScreenService, UIApplicationDelegate>
@end

NS_ASSUME_NONNULL_END
