/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0RCTBridgeModule.h>

#if ABI37_0_0RCT_DEV

ABI37_0_0RCT_EXTERN NSString *const ABI37_0_0RCTShowDevMenuNotification;

#endif


@class ABI37_0_0RCTDevMenuItem;

/**
 * Developer menu, useful for exposing extra functionality when debugging.
 */
@interface ABI37_0_0RCTDevMenu : NSObject

/**
 * Deprecated, use ABI37_0_0RCTDevSettings instead.
 */
@property (nonatomic, assign) BOOL shakeToShow DEPRECATED_ATTRIBUTE;

/**
 * Deprecated, use ABI37_0_0RCTDevSettings instead.
 */
@property (nonatomic, assign) BOOL profilingEnabled DEPRECATED_ATTRIBUTE;

/**
 * Deprecated, use ABI37_0_0RCTDevSettings instead.
 */
@property (nonatomic, assign) BOOL liveReloadEnabled DEPRECATED_ATTRIBUTE;

/**
 * Deprecated, use ABI37_0_0RCTDevSettings instead.
 */
@property (nonatomic, assign) BOOL hotLoadingEnabled DEPRECATED_ATTRIBUTE;

/**
 * Presented items in development menu
 */
@property (nonatomic, copy, readonly) NSArray<ABI37_0_0RCTDevMenuItem *> *presentedItems;

/**
 * Detect if actions sheet (development menu) is shown
 */
- (BOOL)isActionSheetShown;

/**
 * Manually show the dev menu (can be called from JS).
 */
- (void)show;

/**
 * Deprecated, use -[ABI37_0_0RCTBRidge reload] instead.
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
- (void)addItem:(ABI37_0_0RCTDevMenuItem *)item;

@end

typedef NSString *(^ABI37_0_0RCTDevMenuItemTitleBlock)(void);

/**
 * Developer menu item, used to expose additional functionality via the menu.
 */
@interface ABI37_0_0RCTDevMenuItem : NSObject

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
+ (instancetype)buttonItemWithTitleBlock:(ABI37_0_0RCTDevMenuItemTitleBlock)titleBlock
                                 handler:(dispatch_block_t)handler;

@end

/**
 * This category makes the developer menu instance available via the
 * ABI37_0_0RCTBridge, which is useful for any class that needs to access the menu.
 */
@interface ABI37_0_0RCTBridge (ABI37_0_0RCTDevMenu)

@property (nonatomic, readonly) ABI37_0_0RCTDevMenu *devMenu;

@end
