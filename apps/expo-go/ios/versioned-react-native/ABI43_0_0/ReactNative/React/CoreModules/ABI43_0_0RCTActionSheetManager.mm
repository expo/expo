/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTActionSheetManager.h>

#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>
#import <ABI43_0_0React/ABI43_0_0RCTConvert.h>
#import <ABI43_0_0React/ABI43_0_0RCTLog.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIManager.h>
#import <ABI43_0_0React/ABI43_0_0RCTUtils.h>

#import <ABI43_0_0FBReactNativeSpec/ABI43_0_0FBReactNativeSpec.h>
#import <ABI43_0_0RCTTypeSafety/ABI43_0_0RCTConvertHelpers.h>

#import "ABI43_0_0CoreModulesPlugins.h"

using namespace ABI43_0_0facebook::ABI43_0_0React;

@interface ABI43_0_0RCTActionSheetManager () <UIActionSheetDelegate, ABI43_0_0NativeActionSheetManagerSpec>
@end

@implementation ABI43_0_0RCTActionSheetManager {
  // Use NSMapTable, as UIAlertViews do not implement <NSCopying>
  // which is required for NSDictionary keys
  NSMapTable *_callbacks;
}

ABI43_0_0RCT_EXPORT_MODULE()

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
    sourceView = [self.bridge.uiManager viewForABI43_0_0ReactTag:anchorViewTag];
  } else {
    alertController.popoverPresentationController.permittedArrowDirections = 0;
  }
  alertController.popoverPresentationController.sourceView = sourceView;
  alertController.popoverPresentationController.sourceRect = sourceView.bounds;
  [parentViewController presentViewController:alertController animated:YES completion:nil];
}

ABI43_0_0RCT_EXPORT_METHOD(showActionSheetWithOptions
                  : (JS::NativeActionSheetManager::SpecShowActionSheetWithOptionsOptions &)options callback
                  : (ABI43_0_0RCTResponseSenderBlock)callback)
{
  if (ABI43_0_0RCTRunningInAppExtension()) {
    ABI43_0_0RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }

  if (!_callbacks) {
    _callbacks = [NSMapTable strongToStrongObjectsMapTable];
  }

  NSString *title = options.title();
  NSString *message = options.message();
  NSArray<NSString *> *buttons = ABI43_0_0RCTConvertOptionalVecToArray(options.options(), ^id(NSString *element) {
    return element;
  });
  NSArray<NSNumber *> *disabledButtonIndices;
  NSInteger cancelButtonIndex =
      options.cancelButtonIndex() ? [ABI43_0_0RCTConvert NSInteger:@(*options.cancelButtonIndex())] : -1;
  NSArray<NSNumber *> *destructiveButtonIndices;
  if (options.disabledButtonIndices()) {
    disabledButtonIndices = ABI43_0_0RCTConvertVecToArray(*options.disabledButtonIndices(), ^id(double element) {
      return @(element);
    });
  }
  if (options.destructiveButtonIndices()) {
    destructiveButtonIndices = ABI43_0_0RCTConvertVecToArray(*options.destructiveButtonIndices(), ^id(double element) {
      return @(element);
    });
  } else {
    NSNumber *destructiveButtonIndex = @-1;
    destructiveButtonIndices = @[ destructiveButtonIndex ];
  }

  UIViewController *controller = ABI43_0_0RCTPresentedViewController();
  NSNumber *anchor = [ABI43_0_0RCTConvert NSNumber:options.anchor() ? @(*options.anchor()) : nil];
  UIColor *tintColor = [ABI43_0_0RCTConvert UIColor:options.tintColor() ? @(*options.tintColor()) : nil];

  if (controller == nil) {
    ABI43_0_0RCTLogError(@"Tried to display action sheet but there is no application window. options: %@", @{
      @"title" : title,
      @"message" : message,
      @"options" : buttons,
      @"cancelButtonIndex" : @(cancelButtonIndex),
      @"destructiveButtonIndices" : destructiveButtonIndices,
      @"anchor" : anchor,
      @"tintColor" : tintColor,
      @"disabledButtonIndices" : disabledButtonIndices,
    });
    return;
  }

  /*
   * The `anchor` option takes a view to set as the anchor for the share
   * popup to point to, on iPads running iOS 8. If it is not passed, it
   * defaults to centering the share popup on screen without any arrows.
   */
  NSNumber *anchorViewTag = anchor;

  UIAlertController *alertController = [UIAlertController alertControllerWithTitle:title
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
                                                      handler:^(__unused UIAlertAction *action) {
                                                        callback(@[ @(localIndex) ]);
                                                      }]];

    index++;
  }

  if (disabledButtonIndices) {
    for (NSNumber *disabledButtonIndex in disabledButtonIndices) {
      if ([disabledButtonIndex integerValue] < buttons.count) {
        [alertController.actions[[disabledButtonIndex integerValue]] setEnabled:false];
      } else {
        ABI43_0_0RCTLogError(@"Index %@ from `disabledButtonIndices` is out of bounds. Maximum index value is %@.", @([disabledButtonIndex integerValue]), @(buttons.count - 1));
        return;
      }
    }
  }

  alertController.view.tintColor = tintColor;
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    NSString *userInterfaceStyle = [ABI43_0_0RCTConvert NSString:options.userInterfaceStyle()];

    if (userInterfaceStyle == nil || [userInterfaceStyle isEqualToString:@""]) {
      alertController.overrideUserInterfaceStyle = UIUserInterfaceStyleUnspecified;
    } else if ([userInterfaceStyle isEqualToString:@"dark"]) {
      alertController.overrideUserInterfaceStyle = UIUserInterfaceStyleDark;
    } else if ([userInterfaceStyle isEqualToString:@"light"]) {
      alertController.overrideUserInterfaceStyle = UIUserInterfaceStyleLight;
    }
  }
#endif

  [self presentViewController:alertController onParentViewController:controller anchorViewTag:anchorViewTag];
}

ABI43_0_0RCT_EXPORT_METHOD(showShareActionSheetWithOptions
                  : (JS::NativeActionSheetManager::SpecShowShareActionSheetWithOptionsOptions &)options failureCallback
                  : (ABI43_0_0RCTResponseSenderBlock)failureCallback successCallback
                  : (ABI43_0_0RCTResponseSenderBlock)successCallback)
{
  if (ABI43_0_0RCTRunningInAppExtension()) {
    ABI43_0_0RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }

  NSMutableArray<id> *items = [NSMutableArray array];
  NSString *message = options.message();
  if (message) {
    [items addObject:message];
  }
  NSURL *URL = [ABI43_0_0RCTConvert NSURL:options.url()];
  if (URL) {
    if ([URL.scheme.lowercaseString isEqualToString:@"data"]) {
      NSError *error;
      NSData *data = [NSData dataWithContentsOfURL:URL options:(NSDataReadingOptions)0 error:&error];
      if (!data) {
        failureCallback(@[ ABI43_0_0RCTJSErrorFromNSError(error) ]);
        return;
      }
      [items addObject:data];
    } else {
      [items addObject:URL];
    }
  }
  if (items.count == 0) {
    ABI43_0_0RCTLogError(@"No `url` or `message` to share");
    return;
  }

  UIActivityViewController *shareController = [[UIActivityViewController alloc] initWithActivityItems:items
                                                                                applicationActivities:nil];

  NSString *subject = options.subject();
  if (subject) {
    [shareController setValue:subject forKey:@"subject"];
  }

  NSArray *excludedActivityTypes =
      ABI43_0_0RCTConvertOptionalVecToArray(options.excludedActivityTypes(), ^id(NSString *element) {
        return element;
      });
  if (excludedActivityTypes) {
    shareController.excludedActivityTypes = excludedActivityTypes;
  }

  UIViewController *controller = ABI43_0_0RCTPresentedViewController();
  shareController.completionWithItemsHandler =
      ^(NSString *activityType, BOOL completed, __unused NSArray *returnedItems, NSError *activityError) {
        if (activityError) {
          failureCallback(@[ ABI43_0_0RCTJSErrorFromNSError(activityError) ]);
        } else if (completed || activityType == nil) {
          successCallback(@[ @(completed), ABI43_0_0RCTNullIfNil(activityType) ]);
        }
      };

  NSNumber *anchorViewTag = [ABI43_0_0RCTConvert NSNumber:options.anchor() ? @(*options.anchor()) : nil];
  shareController.view.tintColor = [ABI43_0_0RCTConvert UIColor:options.tintColor() ? @(*options.tintColor()) : nil];

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    NSString *userInterfaceStyle = [ABI43_0_0RCTConvert NSString:options.userInterfaceStyle()];

    if (userInterfaceStyle == nil || [userInterfaceStyle isEqualToString:@""]) {
      shareController.overrideUserInterfaceStyle = UIUserInterfaceStyleUnspecified;
    } else if ([userInterfaceStyle isEqualToString:@"dark"]) {
      shareController.overrideUserInterfaceStyle = UIUserInterfaceStyleDark;
    } else if ([userInterfaceStyle isEqualToString:@"light"]) {
      shareController.overrideUserInterfaceStyle = UIUserInterfaceStyleLight;
    }
  }
#endif

  [self presentViewController:shareController onParentViewController:controller anchorViewTag:anchorViewTag];
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeActionSheetManagerSpecJSI>(params);
}

@end

Class ABI43_0_0RCTActionSheetManagerCls(void)
{
  return ABI43_0_0RCTActionSheetManager.class;
}
