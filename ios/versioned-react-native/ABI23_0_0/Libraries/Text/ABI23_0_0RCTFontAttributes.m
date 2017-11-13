/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0RCTFontAttributes.h"

#import <ReactABI23_0_0/ABI23_0_0RCTAccessibilityManager.h>
#import <ReactABI23_0_0/ABI23_0_0RCTAssert.h>
#import <ReactABI23_0_0/ABI23_0_0RCTFont.h>
#import <ReactABI23_0_0/ABI23_0_0RCTLog.h>

@interface ABI23_0_0RCTFontAttributes ()
{
  ABI23_0_0RCTAccessibilityManager *_accessibilityManager;
}

@property (nonatomic, strong) UIFont *font;

@end

@implementation ABI23_0_0RCTFontAttributes

- (instancetype)initWithAccessibilityManager:(ABI23_0_0RCTAccessibilityManager *)accessibilityManager
{
  ABI23_0_0RCTAssertParam(accessibilityManager);

  if (self = [super init]) {
    _accessibilityManager = accessibilityManager;
    _fontSizeMultiplier = _accessibilityManager.multiplier;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(contentSizeMultiplierDidChange)
                                                 name:ABI23_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                               object:_accessibilityManager];

    [self updateFont];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)contentSizeMultiplierDidChange
{
  self.fontSizeMultiplier = _accessibilityManager.multiplier;
}

- (void)setAllowFontScaling:(BOOL)allowFontScaling
{
  _allowFontScaling = allowFontScaling;
  [self updateFont];
}

- (void)setFontFamily:(NSString *)fontFamily
{
  _fontFamily = fontFamily;
  [self updateFont];
}

- (void)setFontSize:(NSNumber *)fontSize
{
  _fontSize = fontSize;
  [self updateFont];
}

- (void)setFontSizeMultiplier:(CGFloat)fontSizeMultiplier
{
   _fontSizeMultiplier = fontSizeMultiplier;

  if (_fontSizeMultiplier == 0) {
    ABI23_0_0RCTLogError(@"fontSizeMultiplier value must be > zero.");
    _fontSizeMultiplier = 1.0;
  }

  [self updateFont];
}

- (void)setFontStyle:(NSString *)fontStyle
{
  _fontStyle = fontStyle;
  [self updateFont];
}

- (void)setFontWeight:(NSString *)fontWeight
{
  _fontWeight = fontWeight;
  [self updateFont];
}

- (void)updateFont
{
  CGFloat scaleMultiplier = self.allowFontScaling ? self.fontSizeMultiplier : 1.0;
  self.font = [ABI23_0_0RCTFont updateFont:nil
                       withFamily:self.fontFamily
                             size:self.fontSize
                           weight:self.fontWeight
                           style:self.fontStyle
                         variant:nil
                 scaleMultiplier:scaleMultiplier];

  [self.delegate fontAttributesDidChangeWithFont:self.font];
}

@end
