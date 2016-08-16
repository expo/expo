/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI8_0_0RCTActionSheetManager.h"

#import "ABI8_0_0RCTConvert.h"
#import "ABI8_0_0RCTLog.h"
#import "ABI8_0_0RCTUtils.h"
#import "ABI8_0_0RCTBridge.h"
#import "ABI8_0_0RCTUIManager.h"

@interface ABI8_0_0RCTActionSheetManager () <UIActionSheetDelegate>
@end

@implementation ABI8_0_0RCTActionSheetManager
{
  // Use NSMapTable, as UIAlertViews do not implement <NSCopying>
  // which is required for NSDictionary keys
  NSMapTable *_callbacks;
}

ABI8_0_0RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

/*
 * The `anchor` option takes a view to set as the anchor for the share
 * popup to point to, on iPads running iOS 8. If it is not passed, it
 * defaults to centering the share popup on screen without any arrows.
 */
- (CGRect)sourceRectInView:(UIView *)sourceView
             anchorViewTag:(NSNumber *)anchorViewTag
{
  if (anchorViewTag) {
    UIView *anchorView = [self.bridge.uiManager viewForReactABI8_0_0Tag:anchorViewTag];
    return [anchorView convertRect:anchorView.bounds toView:sourceView];
  } else {
    return (CGRect){sourceView.center, {1, 1}};
  }
}

ABI8_0_0RCT_EXPORT_METHOD(showActionSheetWithOptions:(NSDictionary *)options
                  callback:(ABI8_0_0RCTResponseSenderBlock)callback)
{
  if (ABI8_0_0RCTRunningInAppExtension()) {
    ABI8_0_0RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }

  if (!_callbacks) {
    _callbacks = [NSMapTable strongToStrongObjectsMapTable];
  }

  NSString *title = [ABI8_0_0RCTConvert NSString:options[@"title"]];
  NSString *message = [ABI8_0_0RCTConvert NSString:options[@"message"]];
  NSArray<NSString *> *buttons = [ABI8_0_0RCTConvert NSStringArray:options[@"options"]];
  NSInteger destructiveButtonIndex = options[@"destructiveButtonIndex"] ? [ABI8_0_0RCTConvert NSInteger:options[@"destructiveButtonIndex"]] : -1;
  NSInteger cancelButtonIndex = options[@"cancelButtonIndex"] ? [ABI8_0_0RCTConvert NSInteger:options[@"cancelButtonIndex"]] : -1;

  UIViewController *controller = ABI8_0_0RCTPresentedViewController();

  if (controller == nil) {
    ABI8_0_0RCTLogError(@"Tried to display action sheet but there is no application window. options: %@", options);
    return;
  }

  /*
   * The `anchor` option takes a view to set as the anchor for the share
   * popup to point to, on iPads running iOS 8. If it is not passed, it
   * defaults to centering the share popup on screen without any arrows.
   */
  NSNumber *anchorViewTag = [ABI8_0_0RCTConvert NSNumber:options[@"anchor"]];
  UIView *sourceView = controller.view;
  CGRect sourceRect = [self sourceRectInView:sourceView anchorViewTag:anchorViewTag];

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0

  if ([UIAlertController class] == nil) {

    UIActionSheet *actionSheet = [UIActionSheet new];

    actionSheet.title = title;
    for (NSString *option in buttons) {
      [actionSheet addButtonWithTitle:option];
    }
    actionSheet.destructiveButtonIndex = destructiveButtonIndex;
    actionSheet.cancelButtonIndex = cancelButtonIndex;
    actionSheet.delegate = self;

    [_callbacks setObject:callback forKey:actionSheet];

    if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
      [actionSheet showFromRect:sourceRect inView:sourceView animated:YES];
    } else {
      [actionSheet showInView:sourceView];
    }

  } else

#endif

  {
    UIAlertController *alertController =
    [UIAlertController alertControllerWithTitle:title
                                        message:message
                                 preferredStyle:UIAlertControllerStyleActionSheet];

    NSInteger index = 0;
    for (NSString *option in buttons) {
      UIAlertActionStyle style = UIAlertActionStyleDefault;
      if (index == destructiveButtonIndex) {
        style = UIAlertActionStyleDestructive;
      } else if (index == cancelButtonIndex) {
        style = UIAlertActionStyleCancel;
      }

      NSInteger localIndex = index;
      [alertController addAction:[UIAlertAction actionWithTitle:option
                                                          style:style
                                                        handler:^(__unused UIAlertAction *action){
        callback(@[@(localIndex)]);
      }]];

      index++;
    }

    alertController.modalPresentationStyle = UIModalPresentationPopover;
    alertController.popoverPresentationController.sourceView = sourceView;
    alertController.popoverPresentationController.sourceRect = sourceRect;
    if (!anchorViewTag) {
      alertController.popoverPresentationController.permittedArrowDirections = 0;
    }
    [controller presentViewController:alertController animated:YES completion:nil];

    alertController.view.tintColor = [ABI8_0_0RCTConvert UIColor:options[@"tintColor"]];
  }
}

ABI8_0_0RCT_EXPORT_METHOD(showShareActionSheetWithOptions:(NSDictionary *)options
                  failureCallback:(ABI8_0_0RCTResponseErrorBlock)failureCallback
                  successCallback:(ABI8_0_0RCTResponseSenderBlock)successCallback)
{
  if (ABI8_0_0RCTRunningInAppExtension()) {
    ABI8_0_0RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }

  NSMutableArray<id> *items = [NSMutableArray array];
  NSString *message = [ABI8_0_0RCTConvert NSString:options[@"message"]];
  if (message) {
    [items addObject:message];
  }
  NSURL *URL = [ABI8_0_0RCTConvert NSURL:options[@"url"]];
  if (URL) {
    if (URL.fileURL || [URL.scheme.lowercaseString isEqualToString:@"data"]) {
      NSError *error;
      NSData *data = [NSData dataWithContentsOfURL:URL
                                           options:(NSDataReadingOptions)0
                                             error:&error];
      if (!data) {
        failureCallback(error);
        return;
      }
      [items addObject:data];
    } else {
      [items addObject:URL];
    }
  }
  if (items.count == 0) {
    ABI8_0_0RCTLogError(@"No `url` or `message` to share");
    return;
  }

  UIActivityViewController *shareController = [[UIActivityViewController alloc] initWithActivityItems:items applicationActivities:nil];

  NSString *subject = [ABI8_0_0RCTConvert NSString:options[@"subject"]];
  if (subject) {
    [shareController setValue:subject forKey:@"subject"];
  }

  NSArray *excludedActivityTypes = [ABI8_0_0RCTConvert NSStringArray:options[@"excludedActivityTypes"]];
  if (excludedActivityTypes) {
    shareController.excludedActivityTypes = excludedActivityTypes;
  }

  UIViewController *controller = ABI8_0_0RCTPresentedViewController();

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0

  if (![UIActivityViewController instancesRespondToSelector:@selector(setCompletionWithItemsHandler:)]) {
    // Legacy iOS 7 implementation
    shareController.completionHandler = ^(NSString *activityType, BOOL completed) {
      successCallback(@[@(completed), ABI8_0_0RCTNullIfNil(activityType)]);
    };
  } else

#endif

  {
    // iOS 8 version
    shareController.completionWithItemsHandler = ^(NSString *activityType, BOOL completed, __unused NSArray *returnedItems, NSError *activityError) {
      if (activityError) {
        failureCallback(activityError);
      } else {
        successCallback(@[@(completed), ABI8_0_0RCTNullIfNil(activityType)]);
      }
    };

    shareController.modalPresentationStyle = UIModalPresentationPopover;
    NSNumber *anchorViewTag = [ABI8_0_0RCTConvert NSNumber:options[@"anchor"]];
    if (!anchorViewTag) {
      shareController.popoverPresentationController.permittedArrowDirections = 0;
    }
    shareController.popoverPresentationController.sourceView = controller.view;
    shareController.popoverPresentationController.sourceRect = [self sourceRectInView:controller.view anchorViewTag:anchorViewTag];
  }

  [controller presentViewController:shareController animated:YES completion:nil];

  shareController.view.tintColor = [ABI8_0_0RCTConvert UIColor:options[@"tintColor"]];
}

#pragma mark UIActionSheetDelegate Methods

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex
{
  ABI8_0_0RCTResponseSenderBlock callback = [_callbacks objectForKey:actionSheet];
  if (callback) {
    callback(@[@(buttonIndex)]);
    [_callbacks removeObjectForKey:actionSheet];
  } else {
    ABI8_0_0RCTLogWarn(@"No callback registered for action sheet: %@", actionSheet.title);
  }
}

@end
