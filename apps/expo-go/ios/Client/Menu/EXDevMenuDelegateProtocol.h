// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridge.h>
#import <React-RCTAppDelegate/RCTAppDelegate.h>

@class EXDevMenuManager;

@protocol EXDevMenuDelegateProtocol <NSObject>

@required

/**
 * Returns the bridge to which the dev menu is hooked.
 * TODO: (@tsapeta) It's gonna be removed once the dev menu moves to have its own bridge.
 */
- (nonnull RCTBridge *)mainBridgeForDevMenuManager:(nonnull EXDevMenuManager *)manager;

/**
 * Returns the bridge of the currently shown app. It is a context of what the dev menu displays.
 */
- (nullable RCTBridge *)appBridgeForDevMenuManager:(nonnull EXDevMenuManager *)manager;

@optional

/**
 * Tells the manager whether it can change dev menu visibility. In some circumstances you may want not to show/close the dev menu.
 */
- (BOOL)devMenuManager:(nonnull EXDevMenuManager *)manager canChangeVisibility:(BOOL)visibility;

/**
 * Returns the app delegate of the currently shown app. It is a context of what the dev menu displays.
 */
- (nullable RCTAppDelegate *)appDelegateForDevMenuManager:(nonnull EXDevMenuManager *)manager;

@end
