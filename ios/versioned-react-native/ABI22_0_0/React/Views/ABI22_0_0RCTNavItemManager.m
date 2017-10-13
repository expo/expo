/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI22_0_0RCTNavItemManager.h"

#import "ABI22_0_0RCTConvert.h"
#import "ABI22_0_0RCTNavItem.h"

@implementation ABI22_0_0RCTConvert (BarButtonSystemItem)

ABI22_0_0RCT_ENUM_CONVERTER(UIBarButtonSystemItem, (@{
  @"done": @(UIBarButtonSystemItemDone),
  @"cancel": @(UIBarButtonSystemItemCancel),
  @"edit": @(UIBarButtonSystemItemEdit),
  @"save": @(UIBarButtonSystemItemSave),
  @"add": @(UIBarButtonSystemItemAdd),
  @"flexible-space": @(UIBarButtonSystemItemFlexibleSpace),
  @"fixed-space": @(UIBarButtonSystemItemFixedSpace),
  @"compose": @(UIBarButtonSystemItemCompose),
  @"reply": @(UIBarButtonSystemItemReply),
  @"action": @(UIBarButtonSystemItemAction),
  @"organize": @(UIBarButtonSystemItemOrganize),
  @"bookmarks": @(UIBarButtonSystemItemBookmarks),
  @"search": @(UIBarButtonSystemItemSearch),
  @"refresh": @(UIBarButtonSystemItemRefresh),
  @"stop": @(UIBarButtonSystemItemStop),
  @"camera": @(UIBarButtonSystemItemCamera),
  @"trash": @(UIBarButtonSystemItemTrash),
  @"play": @(UIBarButtonSystemItemPlay),
  @"pause": @(UIBarButtonSystemItemPause),
  @"rewind": @(UIBarButtonSystemItemRewind),
  @"fast-forward": @(UIBarButtonSystemItemFastForward),
  @"undo": @(UIBarButtonSystemItemUndo),
  @"redo": @(UIBarButtonSystemItemRedo),
  @"page-curl": @(UIBarButtonSystemItemPageCurl)
}), NSNotFound, integerValue);

@end

@implementation ABI22_0_0RCTNavItemManager

ABI22_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI22_0_0RCTNavItem new];
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(navigationBarHidden, BOOL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(shadowHidden, BOOL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
#if !TARGET_OS_TV
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(barStyle, UIBarStyle)
#endif
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(titleTextColor, UIColor)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(titleImage, UIImage)

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonIcon, UIImage)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonTitle, NSString)

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonTitle, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonIcon, UIImage)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonSystemIcon, UIBarButtonSystemItem)

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonIcon, UIImage)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonTitle, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonSystemIcon, UIBarButtonSystemItem)

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onLeftButtonPress, ABI22_0_0RCTBubblingEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onRightButtonPress, ABI22_0_0RCTBubblingEventBlock)

@end
