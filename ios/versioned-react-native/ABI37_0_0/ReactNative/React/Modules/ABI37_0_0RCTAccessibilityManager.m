/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTAccessibilityManager.h"

#import "ABI37_0_0RCTUIManager.h"
#import "ABI37_0_0RCTBridge.h"
#import "ABI37_0_0RCTConvert.h"
#import "ABI37_0_0RCTEventDispatcher.h"
#import "ABI37_0_0RCTLog.h"

NSString *const ABI37_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification = @"ABI37_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification";

static NSString *UIKitCategoryFromJSCategory(NSString *JSCategory)
{
  static NSDictionary *map = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    map = @{@"extraSmall": UIContentSizeCategoryExtraSmall,
            @"small": UIContentSizeCategorySmall,
            @"medium": UIContentSizeCategoryMedium,
            @"large": UIContentSizeCategoryLarge,
            @"extraLarge": UIContentSizeCategoryExtraLarge,
            @"extraExtraLarge": UIContentSizeCategoryExtraExtraLarge,
            @"extraExtraExtraLarge": UIContentSizeCategoryExtraExtraExtraLarge,
            @"accessibilityMedium": UIContentSizeCategoryAccessibilityMedium,
            @"accessibilityLarge": UIContentSizeCategoryAccessibilityLarge,
            @"accessibilityExtraLarge": UIContentSizeCategoryAccessibilityExtraLarge,
            @"accessibilityExtraExtraLarge": UIContentSizeCategoryAccessibilityExtraExtraLarge,
            @"accessibilityExtraExtraExtraLarge": UIContentSizeCategoryAccessibilityExtraExtraExtraLarge};
  });
  return map[JSCategory];
}

@interface ABI37_0_0RCTAccessibilityManager ()

@property (nonatomic, copy) NSString *contentSizeCategory;
@property (nonatomic, assign) CGFloat multiplier;

@end

@implementation ABI37_0_0RCTAccessibilityManager

@synthesize bridge = _bridge;
@synthesize multipliers = _multipliers;

ABI37_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (instancetype)init
{
  if (self = [super init]) {
    _multiplier = 1.0;

    // TODO: can this be moved out of the startup path?
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(didReceiveNewContentSizeCategory:)
                                                 name:UIContentSizeCategoryDidChangeNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(accessibilityAnnouncementDidFinish:)
                                                 name:UIAccessibilityAnnouncementDidFinishNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(boldTextStatusDidChange:)
                                                 name:UIAccessibilityBoldTextStatusDidChangeNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(grayscaleStatusDidChange:)
                                                 name:UIAccessibilityGrayscaleStatusDidChangeNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(invertColorsStatusDidChange:)
                                                 name:UIAccessibilityInvertColorsStatusDidChangeNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(reduceMotionStatusDidChange:)
                                                 name:UIAccessibilityReduceMotionStatusDidChangeNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(reduceTransparencyStatusDidChange:)
                                                 name:UIAccessibilityReduceTransparencyStatusDidChangeNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(voiceVoiceOverStatusDidChange:)
                                                 name:UIAccessibilityVoiceOverStatusChanged
                                               object:nil];

    self.contentSizeCategory = ABI37_0_0RCTSharedApplication().preferredContentSizeCategory;
    _isBoldTextEnabled = UIAccessibilityIsBoldTextEnabled();
    _isGrayscaleEnabled = UIAccessibilityIsGrayscaleEnabled();
    _isInvertColorsEnabled = UIAccessibilityIsInvertColorsEnabled();
    _isReduceMotionEnabled = UIAccessibilityIsReduceMotionEnabled();
    _isReduceTransparencyEnabled = UIAccessibilityIsReduceTransparencyEnabled();
    _isVoiceOverEnabled = UIAccessibilityIsVoiceOverRunning();
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)didReceiveNewContentSizeCategory:(NSNotification *)note
{
  self.contentSizeCategory = note.userInfo[UIContentSizeCategoryNewValueKey];
}

- (void)accessibilityAnnouncementDidFinish:(__unused NSNotification *)notification
{
  NSDictionary *userInfo = notification.userInfo;
  // Response dictionary to populate the event with.
  NSDictionary *response = @{@"announcement": userInfo[UIAccessibilityAnnouncementKeyStringValue],
                              @"success": userInfo[UIAccessibilityAnnouncementKeyWasSuccessful]};

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [_bridge.eventDispatcher sendDeviceEventWithName:@"announcementFinished"
                                              body:response];
#pragma clang diagnostic pop
}

- (void)boldTextStatusDidChange:(__unused NSNotification *)notification
{
  BOOL newBoldTextEnabled = UIAccessibilityIsBoldTextEnabled();
  if (_isBoldTextEnabled != newBoldTextEnabled) {
    _isBoldTextEnabled = newBoldTextEnabled;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [_bridge.eventDispatcher sendDeviceEventWithName:@"boldTextChanged"
                                                body:@(_isBoldTextEnabled)];
#pragma clang diagnostic pop
  }
}

- (void)grayscaleStatusDidChange:(__unused NSNotification *)notification
{
  BOOL newGrayscaleEnabled = UIAccessibilityIsGrayscaleEnabled();
  if (_isGrayscaleEnabled != newGrayscaleEnabled) {
    _isGrayscaleEnabled = newGrayscaleEnabled;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [_bridge.eventDispatcher sendDeviceEventWithName:@"grayscaleChanged"
                                                body:@(_isGrayscaleEnabled)];
#pragma clang diagnostic pop
  }
}

- (void)invertColorsStatusDidChange:(__unused NSNotification *)notification
{
  BOOL newInvertColorsEnabled = UIAccessibilityIsInvertColorsEnabled();
  if (_isInvertColorsEnabled != newInvertColorsEnabled) {
    _isInvertColorsEnabled = newInvertColorsEnabled;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [_bridge.eventDispatcher sendDeviceEventWithName:@"invertColorsChanged"
                                                body:@(_isInvertColorsEnabled)];
#pragma clang diagnostic pop
  }
}

- (void)reduceMotionStatusDidChange:(__unused NSNotification *)notification
{
  BOOL newReduceMotionEnabled = UIAccessibilityIsReduceMotionEnabled();
  if (_isReduceMotionEnabled != newReduceMotionEnabled) {
    _isReduceMotionEnabled = newReduceMotionEnabled;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [_bridge.eventDispatcher sendDeviceEventWithName:@"reduceMotionChanged"
                                                body:@(_isReduceMotionEnabled)];
#pragma clang diagnostic pop
  }
}

- (void)reduceTransparencyStatusDidChange:(__unused NSNotification *)notification
{
  BOOL newReduceTransparencyEnabled = UIAccessibilityIsReduceTransparencyEnabled();
  if (_isReduceTransparencyEnabled != newReduceTransparencyEnabled) {
    _isReduceTransparencyEnabled = newReduceTransparencyEnabled;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [_bridge.eventDispatcher sendDeviceEventWithName:@"reduceTransparencyChanged"
                                                body:@(_isReduceTransparencyEnabled)];
#pragma clang diagnostic pop
  }
}

- (void)voiceVoiceOverStatusDidChange:(__unused NSNotification *)notification
{
  BOOL newIsVoiceOverEnabled = UIAccessibilityIsVoiceOverRunning();
  if (_isVoiceOverEnabled != newIsVoiceOverEnabled) {
    _isVoiceOverEnabled = newIsVoiceOverEnabled;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [_bridge.eventDispatcher sendDeviceEventWithName:@"screenReaderChanged"
                                                body:@(_isVoiceOverEnabled)];
#pragma clang diagnostic pop
  }
}

- (void)setContentSizeCategory:(NSString *)contentSizeCategory
{
  if (_contentSizeCategory != contentSizeCategory) {
    _contentSizeCategory = [contentSizeCategory copy];
    [self invalidateMultiplier];
  }
}

- (void)invalidateMultiplier
{
  self.multiplier = [self multiplierForContentSizeCategory:_contentSizeCategory];
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI37_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification object:self];
}

- (CGFloat)multiplierForContentSizeCategory:(NSString *)category
{
  NSNumber *m = self.multipliers[category];
  if (m.doubleValue <= 0.0) {
    ABI37_0_0RCTLogError(@"Can't determine multiplier for category %@. Using 1.0.", category);
    m = @1.0;
  }
  return m.doubleValue;
}

- (void)setMultipliers:(NSDictionary<NSString *, NSNumber *> *)multipliers
{
  if (_multipliers != multipliers) {
    _multipliers = [multipliers copy];
    [self invalidateMultiplier];
  }
}

- (NSDictionary<NSString *, NSNumber *> *)multipliers
{
  if (_multipliers == nil) {
    _multipliers = @{UIContentSizeCategoryExtraSmall: @0.823,
                     UIContentSizeCategorySmall: @0.882,
                     UIContentSizeCategoryMedium: @0.941,
                     UIContentSizeCategoryLarge: @1.0,
                     UIContentSizeCategoryExtraLarge: @1.118,
                     UIContentSizeCategoryExtraExtraLarge: @1.235,
                     UIContentSizeCategoryExtraExtraExtraLarge: @1.353,
                     UIContentSizeCategoryAccessibilityMedium: @1.786,
                     UIContentSizeCategoryAccessibilityLarge: @2.143,
                     UIContentSizeCategoryAccessibilityExtraLarge: @2.643,
                     UIContentSizeCategoryAccessibilityExtraExtraLarge: @3.143,
                     UIContentSizeCategoryAccessibilityExtraExtraExtraLarge: @3.571};
  }
  return _multipliers;
}

ABI37_0_0RCT_EXPORT_METHOD(setAccessibilityContentSizeMultipliers:(NSDictionary *)JSMultipliers)
{
  NSMutableDictionary<NSString *, NSNumber *> *multipliers = [NSMutableDictionary new];
  for (NSString *__nonnull JSCategory in JSMultipliers) {
    NSNumber *m = [ABI37_0_0RCTConvert NSNumber:JSMultipliers[JSCategory]];
    NSString *UIKitCategory = UIKitCategoryFromJSCategory(JSCategory);
    multipliers[UIKitCategory] = m;
  }
  self.multipliers = multipliers;
}

ABI37_0_0RCT_EXPORT_METHOD(setAccessibilityFocus:(nonnull NSNumber *)ABI37_0_0ReactTag)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIView *view = [self.bridge.uiManager viewForABI37_0_0ReactTag:ABI37_0_0ReactTag];
    UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, view);
  });
}

ABI37_0_0RCT_EXPORT_METHOD(announceForAccessibility:(NSString *)announcement)
{
  UIAccessibilityPostNotification(UIAccessibilityAnnouncementNotification, announcement);
}

ABI37_0_0RCT_EXPORT_METHOD(getMultiplier:(ABI37_0_0RCTResponseSenderBlock)callback)
{
  if (callback) {
    callback(@[ @(self.multiplier) ]);
  }
}

ABI37_0_0RCT_EXPORT_METHOD(getCurrentBoldTextState:(ABI37_0_0RCTResponseSenderBlock)callback
                  error:(__unused ABI37_0_0RCTResponseSenderBlock)error)
{
  callback(@[@(_isBoldTextEnabled)]);
}

ABI37_0_0RCT_EXPORT_METHOD(getCurrentGrayscaleState:(ABI37_0_0RCTResponseSenderBlock)callback
                  error:(__unused ABI37_0_0RCTResponseSenderBlock)error)
{
  callback(@[@(_isGrayscaleEnabled)]);
}

ABI37_0_0RCT_EXPORT_METHOD(getCurrentInvertColorsState:(ABI37_0_0RCTResponseSenderBlock)callback
                  error:(__unused ABI37_0_0RCTResponseSenderBlock)error)
{
  callback(@[@(_isInvertColorsEnabled)]);
}

ABI37_0_0RCT_EXPORT_METHOD(getCurrentReduceMotionState:(ABI37_0_0RCTResponseSenderBlock)callback
                  error:(__unused ABI37_0_0RCTResponseSenderBlock)error)
{
  callback(@[@(_isReduceMotionEnabled)]);
}

ABI37_0_0RCT_EXPORT_METHOD(getCurrentReduceTransparencyState:(ABI37_0_0RCTResponseSenderBlock)callback
                  error:(__unused ABI37_0_0RCTResponseSenderBlock)error)
{
  callback(@[@(_isReduceTransparencyEnabled)]);
}

ABI37_0_0RCT_EXPORT_METHOD(getCurrentVoiceOverState:(ABI37_0_0RCTResponseSenderBlock)callback
                  error:(__unused ABI37_0_0RCTResponseSenderBlock)error)
{
  callback(@[@(_isVoiceOverEnabled)]);
}

@end

@implementation ABI37_0_0RCTBridge (ABI37_0_0RCTAccessibilityManager)

- (ABI37_0_0RCTAccessibilityManager *)accessibilityManager
{
  return [self moduleForClass:[ABI37_0_0RCTAccessibilityManager class]];
}

@end
