// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import "EXDevMenuDelegateProtocol.h"
#import "EXDevMenuGestureRecognizer.h"

@interface EXDevMenuManager : NSObject

@property (nullable, nonatomic, strong) id<EXDevMenuDelegateProtocol> delegate;
@property (readwrite, nonatomic, assign) BOOL interceptMotionGesture;
@property (readwrite, nonatomic, assign) BOOL interceptTouchGesture;

/**
 * Returns singleton instance of the manager.
 */
+ (nonnull instancetype)sharedInstance;

/**
 * Returns the AppDelegate whose rootViewfactory the dev menu uses to create it's root view.
 */
- (nullable RCTAppDelegate *)mainAppDelegate;

/**
 * Returns bool value whether the dev menu is visible.
 */
- (BOOL)isVisible;

/**
 * Opens the dev menu. Returns `YES` if it succeeded or `NO` if the desired state is already set or its change has been rejected by the delegate.
 */
- (BOOL)open;

/**
 * Closes the dev menu with the animation applied on the JS side. Returns `YES` if it succeeded or `NO` if the desired state is already set or its change has been rejected by the delegate.
 */
- (BOOL)close;

/**
 * Toggles the visibility of the dev menu. Returns `YES` if it succeeded or `NO` if the desired state is already set or its change has been rejected by the delegate.
 */
- (BOOL)toggle;

/**
 * Closes the dev menu but skips JS animation and doesn't return any value as it always succeeds - the delegate can't reject it.
 */
- (void)closeWithoutAnimation;

@end
