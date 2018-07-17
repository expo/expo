/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTNavItemManager.h"

#import "ABI29_0_0RCTConvert.h"
#import "ABI29_0_0RCTNavItem.h"

@implementation ABI29_0_0RCTConvert (BarButtonSystemItem)

ABI29_0_0RCT_ENUM_CONVERTER(UIBarButtonSystemItem, (@{
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

@implementation ABI29_0_0RCTNavItemManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI29_0_0RCTNavItem new];
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(navigationBarHidden, BOOL)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(shadowHidden, BOOL)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
#if !TARGET_OS_TV
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(barStyle, UIBarStyle)
#endif
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(titleTextColor, UIColor)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(titleImage, UIImage)

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonIcon, UIImage)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonTitle, NSString)

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonTitle, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonIcon, UIImage)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonSystemIcon, UIBarButtonSystemItem)

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonIcon, UIImage)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonTitle, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonSystemIcon, UIBarButtonSystemItem)

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onLeftButtonPress, ABI29_0_0RCTBubblingEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onRightButtonPress, ABI29_0_0RCTBubblingEventBlock)

@end
