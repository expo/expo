/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTActionSheetManager.h>

#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0RCTConvert.h>
#import <ABI37_0_0React/ABI37_0_0RCTLog.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManager.h>
#import <ABI37_0_0React/ABI37_0_0RCTUtils.h>

@interface ABI37_0_0RCTActionSheetManager () <UIActionSheetDelegate>
@end

@implementation ABI37_0_0RCTActionSheetManager
{
  // Use NSMapTable, as UIAlertViews do not implement <NSCopying>
  // which is required for NSDictionary keys
  NSMapTable *_callbacks;
}

ABI37_0_0RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)presentViewController:(UIViewController *)alertController
       onParentViewController:(UIViewController *)parentViewController
                anchorViewTag:(NSNumber *)anchorViewTag
{
  alertController.modalPresentationStyle = UIModalPresentationPopover;
  UIView *sourceView = parentViewController.view;

  if (anchorViewTag) {
    sourceView = [self.bridge.uiManager viewForABI37_0_0ReactTag:anchorViewTag];
  } else {
    alertController.popoverPresentationController.permittedArrowDirections = 0;
  }
  alertController.popoverPresentationController.sourceView = sourceView;
  alertController.popoverPresentationController.sourceRect = sourceView.bounds;
  [parentViewController presentViewController:alertController animated:YES completion:nil];
}

ABI37_0_0RCT_EXPORT_METHOD(showActionSheetWithOptions:(NSDictionary *)options
                  callback:(ABI37_0_0RCTResponseSenderBlock)callback)
{
  if (ABI37_0_0RCTRunningInAppExtension()) {
    ABI37_0_0RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }

  if (!_callbacks) {
    _callbacks = [NSMapTable strongToStrongObjectsMapTable];
  }

  NSString *title = [ABI37_0_0RCTConvert NSString:options[@"title"]];
  NSString *message = [ABI37_0_0RCTConvert NSString:options[@"message"]];
  NSArray<NSString *> *buttons = [ABI37_0_0RCTConvert NSStringArray:options[@"options"]];
  NSInteger cancelButtonIndex = options[@"cancelButtonIndex"] ? [ABI37_0_0RCTConvert NSInteger:options[@"cancelButtonIndex"]] : -1;
  NSArray<NSNumber *> *destructiveButtonIndices;
  if ([options[@"destructiveButtonIndex"] isKindOfClass:[NSArray class]]) {
    destructiveButtonIndices = [ABI37_0_0RCTConvert NSArray:options[@"destructiveButtonIndex"]];
  } else {
    NSNumber *destructiveButtonIndex = options[@"destructiveButtonIndex"] ? [ABI37_0_0RCTConvert NSNumber:options[@"destructiveButtonIndex"]] : @-1;
    destructiveButtonIndices = @[destructiveButtonIndex];
  }

  UIViewController *controller = ABI37_0_0RCTPresentedViewController();

  if (controller == nil) {
    ABI37_0_0RCTLogError(@"Tried to display action sheet but there is no application window. options: %@", options);
    return;
  }

  /*
   * The `anchor` option takes a view to set as the anchor for the share
   * popup to point to, on iPads running iOS 8. If it is not passed, it
   * defaults to centering the share popup on screen without any arrows.
   */
  NSNumber *anchorViewTag = [ABI37_0_0RCTConvert NSNumber:options[@"anchor"]];
  
  UIAlertController *alertController =
  [UIAlertController alertControllerWithTitle:title
                                      message:message
                               preferredStyle:UIAlertControllerStyleActionSheet];

  NSInteger index = 0;
  for (NSString *option in buttons) {
    UIAlertActionStyle style = UIAlertActionStyleDefault;
    if ([destructiveButtonIndices containsObject:@(index)]) {
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

  alertController.view.tintColor = [ABI37_0_0RCTConvert UIColor:options[@"tintColor"]];
  [self presentViewController:alertController onParentViewController:controller anchorViewTag:anchorViewTag];
}

ABI37_0_0RCT_EXPORT_METHOD(showShareActionSheetWithOptions:(NSDictionary *)options
                  failureCallback:(ABI37_0_0RCTResponseErrorBlock)failureCallback
                  successCallback:(ABI37_0_0RCTResponseSenderBlock)successCallback)
{
  if (ABI37_0_0RCTRunningInAppExtension()) {
    ABI37_0_0RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }

  NSMutableArray<id> *items = [NSMutableArray array];
  NSString *message = [ABI37_0_0RCTConvert NSString:options[@"message"]];
  if (message) {
    [items addObject:message];
  }
  NSURL *URL = [ABI37_0_0RCTConvert NSURL:options[@"url"]];
  if (URL) {
    if ([URL.scheme.lowercaseString isEqualToString:@"data"]) {
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
    ABI37_0_0RCTLogError(@"No `url` or `message` to share");
    return;
  }

  UIActivityViewController *shareController = [[UIActivityViewController alloc] initWithActivityItems:items applicationActivities:nil];

  NSString *subject = [ABI37_0_0RCTConvert NSString:options[@"subject"]];
  if (subject) {
    [shareController setValue:subject forKey:@"subject"];
  }

  NSArray *excludedActivityTypes = [ABI37_0_0RCTConvert NSStringArray:options[@"excludedActivityTypes"]];
  if (excludedActivityTypes) {
    shareController.excludedActivityTypes = excludedActivityTypes;
  }

  UIViewController *controller = ABI37_0_0RCTPresentedViewController();
  shareController.completionWithItemsHandler = ^(NSString *activityType, BOOL completed, __unused NSArray *returnedItems, NSError *activityError) {
    if (activityError) {
      failureCallback(activityError);
    } else if (completed) {
      successCallback(@[@(completed), ABI37_0_0RCTNullIfNil(activityType)]);
    }
  };

  NSNumber *anchorViewTag = [ABI37_0_0RCTConvert NSNumber:options[@"anchor"]];
  shareController.view.tintColor = [ABI37_0_0RCTConvert UIColor:options[@"tintColor"]];
  
  [self presentViewController:shareController onParentViewController:controller anchorViewTag:anchorViewTag];
}

@end
