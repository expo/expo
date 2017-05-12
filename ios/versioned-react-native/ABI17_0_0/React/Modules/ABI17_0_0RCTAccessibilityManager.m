/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0RCTAccessibilityManager.h"

#import "ABI17_0_0RCTBridge.h"
#import "ABI17_0_0RCTConvert.h"
#import "ABI17_0_0RCTEventDispatcher.h"
#import "ABI17_0_0RCTLog.h"

NSString *const ABI17_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification = @"ABI17_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification";

@interface ABI17_0_0RCTAccessibilityManager ()

@property (nonatomic, copy) NSString *contentSizeCategory;
@property (nonatomic, assign) CGFloat multiplier;

@end

@implementation ABI17_0_0RCTAccessibilityManager

@synthesize bridge = _bridge;
@synthesize multipliers = _multipliers;

ABI17_0_0RCT_EXPORT_MODULE()

+ (NSDictionary<NSString *, NSString *> *)JSToUIKitMap
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
  return map;
}

+ (NSString *)UIKitCategoryFromJSCategory:(NSString *)JSCategory
{
  return [self JSToUIKitMap][JSCategory];
}

- (instancetype)init
{
  if ((self = [super init])) {

    // TODO: can this be moved out of the startup path?
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(didReceiveNewContentSizeCategory:)
                                                 name:UIContentSizeCategoryDidChangeNotification
                                               object:ABI17_0_0RCTSharedApplication()];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(didReceiveNewVoiceOverStatus:)
                                                 name:UIAccessibilityVoiceOverStatusChanged
                                               object:nil];

    self.contentSizeCategory = ABI17_0_0RCTSharedApplication().preferredContentSizeCategory;
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

- (void)didReceiveNewVoiceOverStatus:(__unused NSNotification *)notification
{
  BOOL newIsVoiceOverEnabled = UIAccessibilityIsVoiceOverRunning();
  if (_isVoiceOverEnabled != newIsVoiceOverEnabled) {
    _isVoiceOverEnabled = newIsVoiceOverEnabled;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [_bridge.eventDispatcher sendDeviceEventWithName:@"voiceOverDidChange"
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
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI17_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification object:self];
}

- (CGFloat)multiplierForContentSizeCategory:(NSString *)category
{
  NSNumber *m = self.multipliers[category];
  if (m.doubleValue <= 0.0) {
    ABI17_0_0RCTLogError(@"Can't determinte multiplier for category %@. Using 1.0.", category);
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

ABI17_0_0RCT_EXPORT_METHOD(setAccessibilityContentSizeMultipliers:(NSDictionary *)JSMultipliers)
{
  NSMutableDictionary<NSString *, NSNumber *> *multipliers = [NSMutableDictionary new];
  for (NSString *__nonnull JSCategory in JSMultipliers) {
    NSNumber *m = [ABI17_0_0RCTConvert NSNumber:JSMultipliers[JSCategory]];
    NSString *UIKitCategory = [[self class] UIKitCategoryFromJSCategory:JSCategory];
    multipliers[UIKitCategory] = m;
  }
  self.multipliers = multipliers;
}

ABI17_0_0RCT_EXPORT_METHOD(getMultiplier:(ABI17_0_0RCTResponseSenderBlock)callback)
{
  if (callback) {
    callback(@[ @(self.multiplier) ]);
  }
}

ABI17_0_0RCT_EXPORT_METHOD(getCurrentVoiceOverState:(ABI17_0_0RCTResponseSenderBlock)callback
                  error:(__unused ABI17_0_0RCTResponseSenderBlock)error)
{
  callback(@[@(_isVoiceOverEnabled)]);
}

@end

@implementation ABI17_0_0RCTBridge (ABI17_0_0RCTAccessibilityManager)

- (ABI17_0_0RCTAccessibilityManager *)accessibilityManager
{
  return [self moduleForClass:[ABI17_0_0RCTAccessibilityManager class]];
}

@end
