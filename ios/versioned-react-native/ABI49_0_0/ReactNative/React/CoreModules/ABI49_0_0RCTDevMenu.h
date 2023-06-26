/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTDefines.h>

#if ABI49_0_0RCT_DEV_MENU

ABI49_0_0RCT_EXTERN NSString *const ABI49_0_0RCTShowDevMenuNotification;

#endif

@class ABI49_0_0RCTDevMenuItem;

/**
 * Developer menu, useful for exposing extra functionality when debugging.
 */
@interface ABI49_0_0RCTDevMenu : NSObject

/**
 * Deprecated, use ABI49_0_0RCTDevSettings instead.
 */
@property (nonatomic, assign) BOOL shakeToShow DEPRECATED_ATTRIBUTE;

/**
 * Deprecated, use ABI49_0_0RCTDevSettings instead.
 */
@property (nonatomic, assign) BOOL profilingEnabled DEPRECATED_ATTRIBUTE;

/**
 * Deprecated, use ABI49_0_0RCTDevSettings instead.
 */
@property (nonatomic, assign) BOOL hotLoadingEnabled DEPRECATED_ATTRIBUTE;

/**
 * Whether the hotkeys that toggles the developer menu is enabled.
 */
@property (nonatomic, assign) BOOL hotkeysEnabled;

/**
 * Presented items in development menu
 */
@property (nonatomic, copy, readonly) NSArray<ABI49_0_0RCTDevMenuItem *> *presentedItems;

/**
 * Detect if actions sheet (development menu) is shown
 */
- (BOOL)isActionSheetShown;

/**
 * Manually show the dev menu (can be called from JS).
 */
- (void)show;

/**
 * Deprecated, use `ABI49_0_0RCTReloadCommand` instead.
 */
- (void)reload DEPRECATED_ATTRIBUTE;

/**
 * Deprecated. Use the `-addItem:` method instead.
 */
- (void)addItem:(NSString *)title handler:(void (^)(void))handler DEPRECATED_ATTRIBUTE;

/**
 * Add custom item to the development menu. The handler will be called
 * when user selects the item.
 */
- (void)addItem:(ABI49_0_0RCTDevMenuItem *)item;

@end

typedef NSString * (^ABI49_0_0RCTDevMenuItemTitleBlock)(void);

/**
 * Developer menu item, used to expose additional functionality via the menu.
 */
@interface ABI49_0_0RCTDevMenuItem : NSObject

/**
 * This creates an item with a simple push-button interface, used to trigger an
 * action.
 */
+ (instancetype)buttonItemWithTitle:(NSString *)title handler:(dispatch_block_t)handler;

/**
 * This creates an item with a simple push-button interface, used to trigger an
 * action. getTitleForPresentation is called each time the item is about to be
 * presented, and should return the item's title.
 */
+ (instancetype)buttonItemWithTitleBlock:(ABI49_0_0RCTDevMenuItemTitleBlock)titleBlock handler:(dispatch_block_t)handler;

@end

/**
 * This category makes the developer menu instance available via the
 * ABI49_0_0RCTBridge, which is useful for any class that needs to access the menu.
 */
@interface ABI49_0_0RCTBridge (ABI49_0_0RCTDevMenu)

@property (nonatomic, readonly) ABI49_0_0RCTDevMenu *devMenu;

@end
