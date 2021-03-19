/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTStatusBarManager.h"
#import "ABI41_0_0CoreModulesPlugins.h"

#import <ABI41_0_0React/ABI41_0_0RCTEventDispatcher.h>
#import <ABI41_0_0React/ABI41_0_0RCTLog.h>
#import <ABI41_0_0React/ABI41_0_0RCTUtils.h>

#if !TARGET_OS_TV
#import <ABI41_0_0FBReactNativeSpec/ABI41_0_0FBReactNativeSpec.h>

@implementation ABI41_0_0RCTConvert (UIStatusBar)

+ (UIStatusBarStyle)UIStatusBarStyle:(id)json ABI41_0_0RCT_DYNAMIC
{
  static NSDictionary *mapping;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    if (@available(iOS 13.0, *)) {
      mapping = @{
        @"default" : @(UIStatusBarStyleDefault),
        @"light-content" : @(UIStatusBarStyleLightContent),
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
        @"dark-content" : @(UIStatusBarStyleDarkContent)
#else
          @"dark-content": @(UIStatusBarStyleDefault)
#endif
      };

    } else {
      mapping = @{
        @"default" : @(UIStatusBarStyleDefault),
        @"light-content" : @(UIStatusBarStyleLightContent),
        @"dark-content" : @(UIStatusBarStyleDefault)
      };
    }
  });
  return _ABI41_0_0RCT_CAST(
      UIStatusBarStyle,
      [ABI41_0_0RCTConvertEnumValue("UIStatusBarStyle", mapping, @(UIStatusBarStyleDefault), json) integerValue]);
}

ABI41_0_0RCT_ENUM_CONVERTER(
    UIStatusBarAnimation,
    (@{
      @"none" : @(UIStatusBarAnimationNone),
      @"fade" : @(UIStatusBarAnimationFade),
      @"slide" : @(UIStatusBarAnimationSlide),
    }),
    UIStatusBarAnimationNone,
    integerValue);

@end
#endif

#if !TARGET_OS_TV

@interface ABI41_0_0RCTStatusBarManager () <ABI41_0_0NativeStatusBarManagerIOSSpec>
@end

#endif

@implementation ABI41_0_0RCTStatusBarManager

static BOOL ABI41_0_0RCTViewControllerBasedStatusBarAppearance()
{
  static BOOL value;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    value =
        [[[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIViewControllerBasedStatusBarAppearance"]
                ?: @YES boolValue];
  });

  return value;
}

ABI41_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"statusBarFrameDidChange", @"statusBarFrameWillChange" ];
}

#if !TARGET_OS_TV

- (void)startObserving
{
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
  [nc addObserver:self
         selector:@selector(applicationDidChangeStatusBarFrame:)
             name:UIApplicationDidChangeStatusBarFrameNotification
           object:nil];
  [nc addObserver:self
         selector:@selector(applicationWillChangeStatusBarFrame:)
             name:UIApplicationWillChangeStatusBarFrameNotification
           object:nil];
}

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)emitEvent:(NSString *)eventName forNotification:(NSNotification *)notification
{
  CGRect frame = [notification.userInfo[UIApplicationStatusBarFrameUserInfoKey] CGRectValue];
  NSDictionary *event = @{
    @"frame" : @{
      @"x" : @(frame.origin.x),
      @"y" : @(frame.origin.y),
      @"width" : @(frame.size.width),
      @"height" : @(frame.size.height),
    },
  };
  [self sendEventWithName:eventName body:event];
}

- (void)applicationDidChangeStatusBarFrame:(NSNotification *)notification
{
  [self emitEvent:@"statusBarFrameDidChange" forNotification:notification];
}

- (void)applicationWillChangeStatusBarFrame:(NSNotification *)notification
{
  [self emitEvent:@"statusBarFrameWillChange" forNotification:notification];
}

ABI41_0_0RCT_EXPORT_METHOD(getHeight : (ABI41_0_0RCTResponseSenderBlock)callback)
{
  callback(@[ @{
    @"height" : @(ABI41_0_0RCTSharedApplication().statusBarFrame.size.height),
  } ]);
}

ABI41_0_0RCT_EXPORT_METHOD(setStyle : (NSString *)style animated : (BOOL)animated)
{
  UIStatusBarStyle statusBarStyle = [ABI41_0_0RCTConvert UIStatusBarStyle:style];
  if (ABI41_0_0RCTViewControllerBasedStatusBarAppearance()) {
    ABI41_0_0RCTLogError(@"ABI41_0_0RCTStatusBarManager module requires that the \
                UIViewControllerBasedStatusBarAppearance key in the Info.plist is set to NO");
  } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [ABI41_0_0RCTSharedApplication() setStatusBarStyle:statusBarStyle animated:animated];
  }
#pragma clang diagnostic pop
}

ABI41_0_0RCT_EXPORT_METHOD(setHidden : (BOOL)hidden withAnimation : (NSString *)withAnimation)
{
  UIStatusBarAnimation animation = [ABI41_0_0RCTConvert UIStatusBarAnimation:withAnimation];
  if (ABI41_0_0RCTViewControllerBasedStatusBarAppearance()) {
    ABI41_0_0RCTLogError(@"ABI41_0_0RCTStatusBarManager module requires that the \
                UIViewControllerBasedStatusBarAppearance key in the Info.plist is set to NO");
  } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [ABI41_0_0RCTSharedApplication() setStatusBarHidden:hidden withAnimation:animation];
#pragma clang diagnostic pop
  }
}

ABI41_0_0RCT_EXPORT_METHOD(setNetworkActivityIndicatorVisible : (BOOL)visible)
{
  ABI41_0_0RCTSharedApplication().networkActivityIndicatorVisible = visible;
}

- (ABI41_0_0facebook::ABI41_0_0React::ModuleConstants<JS::NativeStatusBarManagerIOS::Constants>)getConstants
{
  return ABI41_0_0facebook::ABI41_0_0React::typedConstants<JS::NativeStatusBarManagerIOS::Constants>({
      .HEIGHT = ABI41_0_0RCTSharedApplication().statusBarFrame.size.height,
      .DEFAULT_BACKGROUND_COLOR = folly::none,
  });
}

- (ABI41_0_0facebook::ABI41_0_0React::ModuleConstants<JS::NativeStatusBarManagerIOS::Constants>)constantsToExport
{
  return (ABI41_0_0facebook::ABI41_0_0React::ModuleConstants<JS::NativeStatusBarManagerIOS::Constants>)[self getConstants];
}

- (std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::TurboModule>)
    getTurboModuleWithJsInvoker:(std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::CallInvoker>)jsInvoker
                  nativeInvoker:(std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::CallInvoker>)nativeInvoker
                     perfLogger:(id<ABI41_0_0RCTTurboModulePerformanceLogger>)perfLogger
{
  return std::make_shared<ABI41_0_0facebook::ABI41_0_0React::NativeStatusBarManagerIOSSpecJSI>(
      self, jsInvoker, nativeInvoker, perfLogger);
}

#endif // TARGET_OS_TV

@end

Class ABI41_0_0RCTStatusBarManagerCls(void)
{
  return ABI41_0_0RCTStatusBarManager.class;
}
