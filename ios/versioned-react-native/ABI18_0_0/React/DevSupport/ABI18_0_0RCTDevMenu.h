/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI18_0_0/ABI18_0_0RCTBridge.h>
#import <ReactABI18_0_0/ABI18_0_0RCTBridgeModule.h>

@class ABI18_0_0RCTDevMenuItem;

/**
 * Developer menu, useful for exposing extra functionality when debugging.
 */
@interface ABI18_0_0RCTDevMenu : NSObject

/**
 * Deprecated, use ABI18_0_0RCTDevSettings instead.
 */
@property (nonatomic, assign) BOOL shakeToShow DEPRECATED_ATTRIBUTE;

/**
 * Deprecated, use ABI18_0_0RCTDevSettings instead.
 */
@property (nonatomic, assign) BOOL profilingEnabled DEPRECATED_ATTRIBUTE;

/**
 * Deprecated, use ABI18_0_0RCTDevSettings instead.
 */
@property (nonatomic, assign) BOOL liveReloadEnabled DEPRECATED_ATTRIBUTE;

/**
 * Deprecated, use ABI18_0_0RCTDevSettings instead.
 */
@property (nonatomic, assign) BOOL hotLoadingEnabled DEPRECATED_ATTRIBUTE;

/**
 * Presented items in development menu
 */
@property (nonatomic, copy, readonly) NSArray<ABI18_0_0RCTDevMenuItem *> *presentedItems;

/**
 * Detect if actions sheet (development menu) is shown
 */
- (BOOL)isActionSheetShown;

/**
 * Manually show the dev menu (can be called from JS).
 */
- (void)show;

/**
 * Deprecated, use -[ABI18_0_0RCTBRidge reload] instead.
 */
- (void)reload DEPRECATED_ATTRIBUTE;

/**
 * Deprecated. Use the `-addItem:` method instead.
 */
- (void)addItem:(NSString *)title
        handler:(void(^)(void))handler DEPRECATED_ATTRIBUTE;

/**
 * Add custom item to the development menu. The handler will be called
 * when user selects the item.
 */
- (void)addItem:(ABI18_0_0RCTDevMenuItem *)item;

@end

typedef NSString *(^ABI18_0_0RCTDevMenuItemTitleBlock)(void);

/**
 * Developer menu item, used to expose additional functionality via the menu.
 */
@interface ABI18_0_0RCTDevMenuItem : NSObject

/**
 * This creates an item with a simple push-button interface, used to trigger an
 * action.
 */
+ (instancetype)buttonItemWithTitle:(NSString *)title
                            handler:(dispatch_block_t)handler;

/**
 * This creates an item with a simple push-button interface, used to trigger an
 * action. getTitleForPresentation is called each time the item is about to be
 * presented, and should return the item's title.
 */
+ (instancetype)buttonItemWithTitleBlock:(ABI18_0_0RCTDevMenuItemTitleBlock)titleBlock
                                 handler:(dispatch_block_t)handler;

@end

/**
 * This category makes the developer menu instance available via the
 * ABI18_0_0RCTBridge, which is useful for any class that needs to access the menu.
 */
@interface ABI18_0_0RCTBridge (ABI18_0_0RCTDevMenu)

@property (nonatomic, readonly) ABI18_0_0RCTDevMenu *devMenu;

@end
