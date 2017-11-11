/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0RCTNavItemManager.h"

#import "ABI23_0_0RCTConvert.h"
#import "ABI23_0_0RCTNavItem.h"

@implementation ABI23_0_0RCTConvert (BarButtonSystemItem)

ABI23_0_0RCT_ENUM_CONVERTER(UIBarButtonSystemItem, (@{
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

@implementation ABI23_0_0RCTNavItemManager

ABI23_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI23_0_0RCTNavItem new];
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(navigationBarHidden, BOOL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(shadowHidden, BOOL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
#if !TARGET_OS_TV
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(barStyle, UIBarStyle)
#endif
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(titleTextColor, UIColor)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(titleImage, UIImage)

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonIcon, UIImage)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonTitle, NSString)

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonTitle, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonIcon, UIImage)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonSystemIcon, UIBarButtonSystemItem)

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonIcon, UIImage)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonTitle, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonSystemIcon, UIBarButtonSystemItem)

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onLeftButtonPress, ABI23_0_0RCTBubblingEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onRightButtonPress, ABI23_0_0RCTBubblingEventBlock)

@end
