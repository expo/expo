/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTActionSheetManager.h>

#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>
#import <ABI48_0_0React/ABI48_0_0RCTLog.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManager.h>
#import <ABI48_0_0React/ABI48_0_0RCTUtils.h>

#import <ABI48_0_0FBReactNativeSpec/ABI48_0_0FBReactNativeSpec.h>
#import <ABI48_0_0RCTTypeSafety/ABI48_0_0RCTConvertHelpers.h>

#import "ABI48_0_0CoreModulesPlugins.h"

using namespace ABI48_0_0facebook::ABI48_0_0React;

@interface ABI48_0_0RCTActionSheetManager () <UIActionSheetDelegate, ABI48_0_0NativeActionSheetManagerSpec>

@property (nonatomic, strong) NSMutableArray<UIAlertController *> *alertControllers;

@end

@implementation ABI48_0_0RCTActionSheetManager

- (instancetype)init
{
  self = [super init];
  if (self) {
    _alertControllers = [NSMutableArray new];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

ABI48_0_0RCT_EXPORT_MODULE()

@synthesize viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED;

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
    sourceView = [self.viewRegistry_DEPRECATED viewForABI48_0_0ReactTag:anchorViewTag];
  } else {
    alertController.popoverPresentationController.permittedArrowDirections = 0;
  }
  alertController.popoverPresentationController.sourceView = sourceView;
  alertController.popoverPresentationController.sourceRect = sourceView.bounds;
  [parentViewController presentViewController:alertController animated:YES completion:nil];
}

ABI48_0_0RCT_EXPORT_METHOD(showActionSheetWithOptions
                  : (ABI48_0_0JS::NativeActionSheetManager::SpecShowActionSheetWithOptionsOptions &)options callback
                  : (ABI48_0_0RCTResponseSenderBlock)callback)
{
  if (ABI48_0_0RCTRunningInAppExtension()) {
    ABI48_0_0RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }

  NSString *title = options.title();
  NSString *message = options.message();
  NSArray<NSString *> *buttons = ABI48_0_0RCTConvertOptionalVecToArray(options.options(), ^id(NSString *element) {
    return element;
  });
  NSArray<NSNumber *> *disabledButtonIndices;
  NSInteger cancelButtonIndex =
      options.cancelButtonIndex() ? [ABI48_0_0RCTConvert NSInteger:@(*options.cancelButtonIndex())] : -1;
  NSArray<NSNumber *> *destructiveButtonIndices;
  if (options.disabledButtonIndices()) {
    disabledButtonIndices = ABI48_0_0RCTConvertVecToArray(*options.disabledButtonIndices(), ^id(double element) {
      return @(element);
    });
  }
  if (options.destructiveButtonIndices()) {
    destructiveButtonIndices = ABI48_0_0RCTConvertVecToArray(*options.destructiveButtonIndices(), ^id(double element) {
      return @(element);
    });
  } else {
    NSNumber *destructiveButtonIndex = @-1;
    destructiveButtonIndices = @[ destructiveButtonIndex ];
  }

  UIViewController *controller = ABI48_0_0RCTPresentedViewController();
  NSNumber *anchor = [ABI48_0_0RCTConvert NSNumber:options.anchor() ? @(*options.anchor()) : nil];
  UIColor *tintColor = [ABI48_0_0RCTConvert UIColor:options.tintColor() ? @(*options.tintColor()) : nil];
  UIColor *cancelButtonTintColor =
      [ABI48_0_0RCTConvert UIColor:options.cancelButtonTintColor() ? @(*options.cancelButtonTintColor()) : nil];

  if (controller == nil) {
    ABI48_0_0RCTLogError(
        @"Tried to display action sheet but there is no application window. options: %@", @{
          @"title" : title,
          @"message" : message,
          @"options" : buttons,
          @"cancelButtonIndex" : @(cancelButtonIndex),
          @"destructiveButtonIndices" : destructiveButtonIndices,
          @"anchor" : anchor,
          @"tintColor" : tintColor,
          @"cancelButtonTintColor" : cancelButtonTintColor,
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
  bool isCancelButtonIndex = false;
  // The handler for a button might get called more than once when tapping outside
  // the action sheet on iPad. ABI48_0_0RCTResponseSenderBlock can only be called once so
  // keep track of callback invocation here.
  __block bool callbackInvoked = false;
  for (NSString *option in buttons) {
    UIAlertActionStyle style = UIAlertActionStyleDefault;
    if ([destructiveButtonIndices containsObject:@(index)]) {
      style = UIAlertActionStyleDestructive;
    } else if (index == cancelButtonIndex) {
      style = UIAlertActionStyleCancel;
      isCancelButtonIndex = true;
    }

    NSInteger localIndex = index;
    UIAlertAction *actionButton = [UIAlertAction actionWithTitle:option
                                                           style:style
                                                         handler:^(__unused UIAlertAction *action) {
                                                           if (!callbackInvoked) {
                                                             callbackInvoked = true;
                                                             [self->_alertControllers removeObject:alertController];
                                                             callback(@[ @(localIndex) ]);
                                                           }
                                                         }];
    if (isCancelButtonIndex) {
      [actionButton setValue:cancelButtonTintColor forKey:@"titleTextColor"];
    }
    [alertController addAction:actionButton];

    index++;
  }

  if (disabledButtonIndices) {
    for (NSNumber *disabledButtonIndex in disabledButtonIndices) {
      if ([disabledButtonIndex integerValue] < buttons.count) {
        [alertController.actions[[disabledButtonIndex integerValue]] setEnabled:false];
      } else {
        ABI48_0_0RCTLogError(
            @"Index %@ from `disabledButtonIndices` is out of bounds. Maximum index value is %@.",
            @([disabledButtonIndex integerValue]),
            @(buttons.count - 1));
        return;
      }
    }
  }

  alertController.view.tintColor = tintColor;
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    NSString *userInterfaceStyle = [ABI48_0_0RCTConvert NSString:options.userInterfaceStyle()];

    if (userInterfaceStyle == nil || [userInterfaceStyle isEqualToString:@""]) {
      alertController.overrideUserInterfaceStyle = UIUserInterfaceStyleUnspecified;
    } else if ([userInterfaceStyle isEqualToString:@"dark"]) {
      alertController.overrideUserInterfaceStyle = UIUserInterfaceStyleDark;
    } else if ([userInterfaceStyle isEqualToString:@"light"]) {
      alertController.overrideUserInterfaceStyle = UIUserInterfaceStyleLight;
    }
  }
#endif

  [_alertControllers addObject:alertController];
  [self presentViewController:alertController onParentViewController:controller anchorViewTag:anchorViewTag];
}

ABI48_0_0RCT_EXPORT_METHOD(dismissActionSheet)
{
  if (_alertControllers.count == 0) {
    ABI48_0_0RCTLogWarn(@"Unable to dismiss action sheet");
  }

  id _alertController = [_alertControllers lastObject];
  [_alertController dismissViewControllerAnimated:YES completion:nil];
  [_alertControllers removeLastObject];
}

ABI48_0_0RCT_EXPORT_METHOD(showShareActionSheetWithOptions
                  : (ABI48_0_0JS::NativeActionSheetManager::SpecShowShareActionSheetWithOptionsOptions &)options failureCallback
                  : (ABI48_0_0RCTResponseSenderBlock)failureCallback successCallback
                  : (ABI48_0_0RCTResponseSenderBlock)successCallback)
{
  if (ABI48_0_0RCTRunningInAppExtension()) {
    ABI48_0_0RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }

  NSMutableArray<id> *items = [NSMutableArray array];
  NSString *message = options.message();
  if (message) {
    [items addObject:message];
  }
  NSURL *URL = [ABI48_0_0RCTConvert NSURL:options.url()];
  if (URL) {
    if ([URL.scheme.lowercaseString isEqualToString:@"data"]) {
      NSError *error;
      NSData *data = [NSData dataWithContentsOfURL:URL options:(NSDataReadingOptions)0 error:&error];
      if (!data) {
        failureCallback(@[ ABI48_0_0RCTJSErrorFromNSError(error) ]);
        return;
      }
      [items addObject:data];
    } else {
      [items addObject:URL];
    }
  }
  if (items.count == 0) {
    ABI48_0_0RCTLogError(@"No `url` or `message` to share");
    return;
  }

  UIActivityViewController *shareController = [[UIActivityViewController alloc] initWithActivityItems:items
                                                                                applicationActivities:nil];

  NSString *subject = options.subject();
  if (subject) {
    [shareController setValue:subject forKey:@"subject"];
  }

  NSArray *excludedActivityTypes =
      ABI48_0_0RCTConvertOptionalVecToArray(options.excludedActivityTypes(), ^id(NSString *element) {
        return element;
      });
  if (excludedActivityTypes) {
    shareController.excludedActivityTypes = excludedActivityTypes;
  }

  UIViewController *controller = ABI48_0_0RCTPresentedViewController();
  shareController.completionWithItemsHandler =
      ^(NSString *activityType, BOOL completed, __unused NSArray *returnedItems, NSError *activityError) {
        if (activityError) {
          failureCallback(@[ ABI48_0_0RCTJSErrorFromNSError(activityError) ]);
        } else if (completed || activityType == nil) {
          successCallback(@[ @(completed), ABI48_0_0RCTNullIfNil(activityType) ]);
        }
      };

  NSNumber *anchorViewTag = [ABI48_0_0RCTConvert NSNumber:options.anchor() ? @(*options.anchor()) : nil];
  shareController.view.tintColor = [ABI48_0_0RCTConvert UIColor:options.tintColor() ? @(*options.tintColor()) : nil];

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    NSString *userInterfaceStyle = [ABI48_0_0RCTConvert NSString:options.userInterfaceStyle()];

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

Class ABI48_0_0RCTActionSheetManagerCls(void)
{
  return ABI48_0_0RCTActionSheetManager.class;
}
