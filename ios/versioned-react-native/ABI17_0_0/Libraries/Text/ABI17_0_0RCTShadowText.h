/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI17_0_0/ABI17_0_0RCTShadowView.h>
#import <ReactABI17_0_0/ABI17_0_0RCTTextDecorationLineType.h>

typedef NS_ENUM(NSInteger, ABI17_0_0RCTSizeComparison)
{
  ABI17_0_0RCTSizeTooLarge,
  ABI17_0_0RCTSizeTooSmall,
  ABI17_0_0RCTSizeWithinRange,
};


extern NSString *const ABI17_0_0RCTIsHighlightedAttributeName;
extern NSString *const ABI17_0_0RCTReactABI17_0_0TagAttributeName;

@interface ABI17_0_0RCTShadowText : ABI17_0_0RCTShadowView

@property (nonatomic, strong) UIColor *color;
@property (nonatomic, copy) NSString *fontFamily;
@property (nonatomic, assign) CGFloat fontSize;
@property (nonatomic, copy) NSString *fontWeight;
@property (nonatomic, copy) NSString *fontStyle;
@property (nonatomic, copy) NSArray *fontVariant;
@property (nonatomic, assign) BOOL isHighlighted;
@property (nonatomic, assign) CGFloat letterSpacing;
@property (nonatomic, assign) CGFloat lineHeight;
@property (nonatomic, assign) NSUInteger numberOfLines;
@property (nonatomic, assign) NSLineBreakMode ellipsizeMode;
@property (nonatomic, assign) CGSize shadowOffset;
@property (nonatomic, assign) NSTextAlignment textAlign;
@property (nonatomic, assign) NSWritingDirection writingDirection;
@property (nonatomic, strong) UIColor *textDecorationColor;
@property (nonatomic, assign) NSUnderlineStyle textDecorationStyle;
@property (nonatomic, assign) ABI17_0_0RCTTextDecorationLineType textDecorationLine;
@property (nonatomic, assign) CGFloat fontSizeMultiplier;
@property (nonatomic, assign) BOOL allowFontScaling;
@property (nonatomic, assign) CGFloat opacity;
@property (nonatomic, assign) CGSize textShadowOffset;
@property (nonatomic, assign) CGFloat textShadowRadius;
@property (nonatomic, strong) UIColor *textShadowColor;
@property (nonatomic, assign) BOOL adjustsFontSizeToFit;
@property (nonatomic, assign) CGFloat minimumFontScale;
@property (nonatomic, assign) BOOL selectable;

- (void)recomputeText;

@end
