/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTNavItemManager.h"

#import "ABI32_0_0RCTConvert.h"
#import "ABI32_0_0RCTNavItem.h"

@implementation ABI32_0_0RCTConvert (BarButtonSystemItem)

ABI32_0_0RCT_ENUM_CONVERTER(UIBarButtonSystemItem, (@{
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

@implementation ABI32_0_0RCTNavItemManager

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI32_0_0RCTNavItem new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(navigationBarHidden, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(shadowHidden, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
#if !TARGET_OS_TV
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(barStyle, UIBarStyle)
#endif
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(titleTextColor, UIColor)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(titleImage, UIImage)

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonIcon, UIImage)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonTitle, NSString)

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonTitle, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonIcon, UIImage)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonSystemIcon, UIBarButtonSystemItem)

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonIcon, UIImage)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonTitle, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonSystemIcon, UIBarButtonSystemItem)

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onLeftButtonPress, ABI32_0_0RCTBubblingEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onRightButtonPress, ABI32_0_0RCTBubblingEventBlock)

@end
