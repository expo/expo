/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTNavItemManager.h"

#import "ABI13_0_0RCTConvert.h"
#import "ABI13_0_0RCTNavItem.h"

@implementation ABI13_0_0RCTConvert (BarButtonSystemItem)

ABI13_0_0RCT_ENUM_CONVERTER(UIBarButtonSystemItem, (@{
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

@implementation ABI13_0_0RCTNavItemManager

ABI13_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI13_0_0RCTNavItem new];
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(navigationBarHidden, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(shadowHidden, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(titleTextColor, UIColor)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(titleImage, UIImage)

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonIcon, UIImage)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonTitle, NSString)

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonTitle, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonIcon, UIImage)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonSystemIcon, UIBarButtonSystemItem)

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonIcon, UIImage)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonTitle, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonSystemIcon, UIBarButtonSystemItem)

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onLeftButtonPress, ABI13_0_0RCTBubblingEventBlock)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onRightButtonPress, ABI13_0_0RCTBubblingEventBlock)

@end
