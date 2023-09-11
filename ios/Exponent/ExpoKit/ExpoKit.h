// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class EXViewController;

@interface ExpoKit : NSObject

+ (instancetype)sharedInstance;

/**
 *  Register an EXViewController subclass as the root class.
 *  This must be the first method called on ExpoKit's singleton instance to make any difference.
 */
- (void)registerRootViewControllerClass:(Class)rootViewControllerClass;

/**
 *  The root Exponent view controller hosting a detached Exponent app.
 */
- (EXViewController *)rootViewController;

/**
 *  The current view controller that is presented by Exponent app.
 */
- (UIViewController *)currentViewController;

/**
 *  Set up dependencies that need to be initialized before app delegates.
 */
- (void)prepareWithLaunchOptions:(nullable NSDictionary *)launchOptions;

/**
 *  Keys to third-party integrations used inside ExpoKit.
 *  TODO: document this.
 */
@property (nonatomic, strong) NSDictionary *applicationKeys;

@property (nonatomic, readonly) NSDictionary *launchOptions;

@property (nonatomic, weak) Class moduleRegistryDelegateClass;

@end

NS_ASSUME_NONNULL_END
