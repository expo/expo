/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTAccessibilityManager.h"
#import "ABI47_0_0RCTAccessibilityManager+Internal.h"

#import <ABI47_0_0FBReactNativeSpec/ABI47_0_0FBReactNativeSpec.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventDispatcherProtocol.h>
#import <ABI47_0_0React/ABI47_0_0RCTLog.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManager.h>

#import "ABI47_0_0CoreModulesPlugins.h"

NSString *const ABI47_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification =
    @"ABI47_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification";

@interface ABI47_0_0RCTAccessibilityManager () <ABI47_0_0NativeAccessibilityManagerSpec>

@property (nonatomic, copy) NSString *contentSizeCategory;
@property (nonatomic, assign) CGFloat multiplier;

@end

@implementation ABI47_0_0RCTAccessibilityManager

@synthesize viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED;
@synthesize moduleRegistry = _moduleRegistry;
@synthesize multipliers = _multipliers;

ABI47_0_0RCT_EXPORT_MODULE()

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
                                                 name:UIAccessibilityVoiceOverStatusDidChangeNotification
                                               object:nil];

    self.contentSizeCategory = ABI47_0_0RCTSharedApplication().preferredContentSizeCategory;
    _isBoldTextEnabled = UIAccessibilityIsBoldTextEnabled();
    _isGrayscaleEnabled = UIAccessibilityIsGrayscaleEnabled();
    _isInvertColorsEnabled = UIAccessibilityIsInvertColorsEnabled();
    _isReduceMotionEnabled = UIAccessibilityIsReduceMotionEnabled();
    _isReduceTransparencyEnabled = UIAccessibilityIsReduceTransparencyEnabled();
    _isVoiceOverEnabled = UIAccessibilityIsVoiceOverRunning();
  }
  return self;
}

- (void)didReceiveNewContentSizeCategory:(NSNotification *)note
{
  self.contentSizeCategory = note.userInfo[UIContentSizeCategoryNewValueKey];
}

- (void)accessibilityAnnouncementDidFinish:(__unused NSNotification *)notification
{
  NSDictionary *userInfo = notification.userInfo;
  // Response dictionary to populate the event with.
  NSDictionary *response = @{
    @"announcement" : userInfo[UIAccessibilityAnnouncementKeyStringValue],
    @"success" : userInfo[UIAccessibilityAnnouncementKeyWasSuccessful]
  };

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"announcementFinished" body:response];
#pragma clang diagnostic pop
}

- (void)boldTextStatusDidChange:(__unused NSNotification *)notification
{
  BOOL newBoldTextEnabled = UIAccessibilityIsBoldTextEnabled();
  if (_isBoldTextEnabled != newBoldTextEnabled) {
    _isBoldTextEnabled = newBoldTextEnabled;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"boldTextChanged"
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
    [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"grayscaleChanged"
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
    [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"invertColorsChanged"
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
    [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"reduceMotionChanged"
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
    [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"reduceTransparencyChanged"
                                                                          body:@(_isReduceTransparencyEnabled)];
#pragma clang diagnostic pop
  }
}

- (void)voiceVoiceOverStatusDidChange:(__unused NSNotification *)notification
{
  BOOL isVoiceOverEnabled = UIAccessibilityIsVoiceOverRunning();
  [self _setIsVoiceOverEnabled:isVoiceOverEnabled];
}

- (void)_setIsVoiceOverEnabled:(BOOL)isVoiceOverEnabled
{
  if (_isVoiceOverEnabled != isVoiceOverEnabled) {
    _isVoiceOverEnabled = isVoiceOverEnabled;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"screenReaderChanged"
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
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI47_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                                      object:self];
}

- (CGFloat)multiplierForContentSizeCategory:(NSString *)category
{
  NSNumber *m = self.multipliers[category];
  if (m.doubleValue <= 0.0) {
    ABI47_0_0RCTLogError(@"Can't determine multiplier for category %@. Using 1.0.", category);
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
    _multipliers = @{
      UIContentSizeCategoryExtraSmall : @0.823,
      UIContentSizeCategorySmall : @0.882,
      UIContentSizeCategoryMedium : @0.941,
      UIContentSizeCategoryLarge : @1.0,
      UIContentSizeCategoryExtraLarge : @1.118,
      UIContentSizeCategoryExtraExtraLarge : @1.235,
      UIContentSizeCategoryExtraExtraExtraLarge : @1.353,
      UIContentSizeCategoryAccessibilityMedium : @1.786,
      UIContentSizeCategoryAccessibilityLarge : @2.143,
      UIContentSizeCategoryAccessibilityExtraLarge : @2.643,
      UIContentSizeCategoryAccessibilityExtraExtraLarge : @3.143,
      UIContentSizeCategoryAccessibilityExtraExtraExtraLarge : @3.571
    };
  }
  return _multipliers;
}

ABI47_0_0RCT_EXPORT_METHOD(setAccessibilityContentSizeMultipliers
                  : (ABI47_0_0JS::NativeAccessibilityManager::SpecSetAccessibilityContentSizeMultipliersJSMultipliers &)
                      JSMultipliers)
{
  NSMutableDictionary<NSString *, NSNumber *> *multipliers = [NSMutableDictionary new];
  setMultipliers(multipliers, UIContentSizeCategoryExtraSmall, JSMultipliers.extraSmall());
  setMultipliers(multipliers, UIContentSizeCategorySmall, JSMultipliers.small());
  setMultipliers(multipliers, UIContentSizeCategoryMedium, JSMultipliers.medium());
  setMultipliers(multipliers, UIContentSizeCategoryLarge, JSMultipliers.large());
  setMultipliers(multipliers, UIContentSizeCategoryExtraLarge, JSMultipliers.extraLarge());
  setMultipliers(multipliers, UIContentSizeCategoryExtraExtraLarge, JSMultipliers.extraExtraLarge());
  setMultipliers(multipliers, UIContentSizeCategoryExtraExtraExtraLarge, JSMultipliers.extraExtraExtraLarge());
  setMultipliers(multipliers, UIContentSizeCategoryAccessibilityMedium, JSMultipliers.accessibilityMedium());
  setMultipliers(multipliers, UIContentSizeCategoryAccessibilityLarge, JSMultipliers.accessibilityLarge());
  setMultipliers(multipliers, UIContentSizeCategoryAccessibilityExtraLarge, JSMultipliers.accessibilityExtraLarge());
  setMultipliers(
      multipliers, UIContentSizeCategoryAccessibilityExtraExtraLarge, JSMultipliers.accessibilityExtraExtraLarge());
  setMultipliers(
      multipliers,
      UIContentSizeCategoryAccessibilityExtraExtraExtraLarge,
      JSMultipliers.accessibilityExtraExtraExtraLarge());
  self.multipliers = multipliers;
}

static void setMultipliers(
    NSMutableDictionary<NSString *, NSNumber *> *multipliers,
    NSString *key,
    std::optional<double> optionalDouble)
{
  if (optionalDouble.has_value()) {
    multipliers[key] = @(optionalDouble.value());
  }
}

ABI47_0_0RCT_EXPORT_METHOD(setAccessibilityFocus : (double)ABI47_0_0ReactTag)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIView *view = [self.viewRegistry_DEPRECATED viewForABI47_0_0ReactTag:@(ABI47_0_0ReactTag)];
    UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, view);
  });
}

ABI47_0_0RCT_EXPORT_METHOD(announceForAccessibility : (NSString *)announcement)
{
  UIAccessibilityPostNotification(UIAccessibilityAnnouncementNotification, announcement);
}

ABI47_0_0RCT_EXPORT_METHOD(announceForAccessibilityWithOptions
                  : (NSString *)announcement options
                  : (ABI47_0_0JS::NativeAccessibilityManager::SpecAnnounceForAccessibilityWithOptionsOptions &)options)
{
  if (@available(iOS 11.0, *)) {
    NSMutableDictionary<NSString *, NSNumber *> *attrsDictionary = [NSMutableDictionary new];
    if (options.queue()) {
      attrsDictionary[UIAccessibilitySpeechAttributeQueueAnnouncement] = @(*(options.queue()) ? YES : NO);
    }

    if (attrsDictionary.count > 0) {
      NSAttributedString *announcementWithAttrs = [[NSAttributedString alloc] initWithString:announcement
                                                                                  attributes:attrsDictionary];
      UIAccessibilityPostNotification(UIAccessibilityAnnouncementNotification, announcementWithAttrs);
    } else {
      UIAccessibilityPostNotification(UIAccessibilityAnnouncementNotification, announcement);
    }
  } else {
    UIAccessibilityPostNotification(UIAccessibilityAnnouncementNotification, announcement);
  }
}

ABI47_0_0RCT_EXPORT_METHOD(getMultiplier : (ABI47_0_0RCTResponseSenderBlock)callback)
{
  if (callback) {
    callback(@[ @(self.multiplier) ]);
  }
}

ABI47_0_0RCT_EXPORT_METHOD(getCurrentBoldTextState
                  : (ABI47_0_0RCTResponseSenderBlock)onSuccess onError
                  : (__unused ABI47_0_0RCTResponseSenderBlock)onError)
{
  onSuccess(@[ @(_isBoldTextEnabled) ]);
}

ABI47_0_0RCT_EXPORT_METHOD(getCurrentGrayscaleState
                  : (ABI47_0_0RCTResponseSenderBlock)onSuccess onError
                  : (__unused ABI47_0_0RCTResponseSenderBlock)onError)
{
  onSuccess(@[ @(_isGrayscaleEnabled) ]);
}

ABI47_0_0RCT_EXPORT_METHOD(getCurrentInvertColorsState
                  : (ABI47_0_0RCTResponseSenderBlock)onSuccess onError
                  : (__unused ABI47_0_0RCTResponseSenderBlock)onError)
{
  onSuccess(@[ @(_isInvertColorsEnabled) ]);
}

ABI47_0_0RCT_EXPORT_METHOD(getCurrentReduceMotionState
                  : (ABI47_0_0RCTResponseSenderBlock)onSuccess onError
                  : (__unused ABI47_0_0RCTResponseSenderBlock)onError)
{
  onSuccess(@[ @(_isReduceMotionEnabled) ]);
}

ABI47_0_0RCT_EXPORT_METHOD(getCurrentPrefersCrossFadeTransitionsState
                  : (ABI47_0_0RCTResponseSenderBlock)onSuccess onError
                  : (__unused ABI47_0_0RCTResponseSenderBlock)onError)
{
  if (@available(iOS 14.0, *)) {
    onSuccess(@[ @(UIAccessibilityPrefersCrossFadeTransitions()) ]);
  } else {
    onSuccess(@[ @(false) ]);
  }
}

ABI47_0_0RCT_EXPORT_METHOD(getCurrentReduceTransparencyState
                  : (ABI47_0_0RCTResponseSenderBlock)onSuccess onError
                  : (__unused ABI47_0_0RCTResponseSenderBlock)onError)
{
  onSuccess(@[ @(_isReduceTransparencyEnabled) ]);
}

ABI47_0_0RCT_EXPORT_METHOD(getCurrentVoiceOverState
                  : (ABI47_0_0RCTResponseSenderBlock)onSuccess onError
                  : (__unused ABI47_0_0RCTResponseSenderBlock)onError)
{
  onSuccess(@[ @(_isVoiceOverEnabled) ]);
}

- (std::shared_ptr<ABI47_0_0facebook::ABI47_0_0React::TurboModule>)getTurboModule:
    (const ABI47_0_0facebook::ABI47_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI47_0_0facebook::ABI47_0_0React::NativeAccessibilityManagerSpecJSI>(params);
}

#pragma mark - Internal

void ABI47_0_0RCTAccessibilityManagerSetIsVoiceOverEnabled(
    ABI47_0_0RCTAccessibilityManager *accessibilityManager,
    BOOL isVoiceOverEnabled)
{
  [accessibilityManager _setIsVoiceOverEnabled:isVoiceOverEnabled];
}

@end

@implementation ABI47_0_0RCTBridge (ABI47_0_0RCTAccessibilityManager)

- (ABI47_0_0RCTAccessibilityManager *)accessibilityManager
{
  return [self moduleForClass:[ABI47_0_0RCTAccessibilityManager class]];
}

@end

Class ABI47_0_0RCTAccessibilityManagerCls(void)
{
  return ABI47_0_0RCTAccessibilityManager.class;
}
