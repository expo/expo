/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTNavItemManager.h"

#import "ABI28_0_0RCTConvert.h"
#import "ABI28_0_0RCTNavItem.h"

@implementation ABI28_0_0RCTConvert (BarButtonSystemItem)

ABI28_0_0RCT_ENUM_CONVERTER(UIBarButtonSystemItem, (@{
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

@implementation ABI28_0_0RCTNavItemManager

ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI28_0_0RCTNavItem new];
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(navigationBarHidden, BOOL)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(shadowHidden, BOOL)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
#if !TARGET_OS_TV
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(barStyle, UIBarStyle)
#endif
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(titleTextColor, UIColor)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(titleImage, UIImage)

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonIcon, UIImage)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonTitle, NSString)

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonTitle, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonIcon, UIImage)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonSystemIcon, UIBarButtonSystemItem)

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonIcon, UIImage)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonTitle, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonSystemIcon, UIBarButtonSystemItem)

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onLeftButtonPress, ABI28_0_0RCTBubblingEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onRightButtonPress, ABI28_0_0RCTBubblingEventBlock)

@end
