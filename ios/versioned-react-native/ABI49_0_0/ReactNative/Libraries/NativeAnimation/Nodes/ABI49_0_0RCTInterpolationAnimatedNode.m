/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTInterpolationAnimatedNode.h>

#import <ABI49_0_0React/ABI49_0_0RCTAnimationUtils.h>
#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>

static NSRegularExpression *regex;

typedef NS_ENUM(NSInteger, ABI49_0_0RCTInterpolationOutputType) {
  ABI49_0_0RCTInterpolationOutputNumber,
  ABI49_0_0RCTInterpolationOutputColor,
  ABI49_0_0RCTInterpolationOutputString,
};

static NSRegularExpression *getNumericComponentRegex()
{
  static NSRegularExpression *regex;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *fpRegex = @"[+-]?(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?";
    regex = [NSRegularExpression regularExpressionWithPattern:fpRegex
                                                      options:NSRegularExpressionCaseInsensitive
                                                        error:nil];
  });
  return regex;
}

static NSArray<NSArray<NSNumber *> *> *outputFromStringPattern(NSString *input)
{
  NSMutableArray *output = [NSMutableArray array];
  [getNumericComponentRegex()
      enumerateMatchesInString:input
                       options:0
                         range:NSMakeRange(0, input.length)
                    usingBlock:^(NSTextCheckingResult *_Nullable result, NSMatchingFlags flags, BOOL *_Nonnull stop) {
                      [output addObject:@([[input substringWithRange:result.range] doubleValue])];
                    }];
  return output;
}

NSString *ABI49_0_0RCTInterpolateString(
    NSString *pattern,
    CGFloat inputValue,
    NSArray<NSNumber *> *inputRange,
    NSArray<NSArray<NSNumber *> *> *outputRange,
    NSString *extrapolateLeft,
    NSString *extrapolateRight)
{
  NSUInteger rangeIndex = ABI49_0_0RCTFindIndexOfNearestValue(inputValue, inputRange);

  NSMutableString *output = [NSMutableString stringWithString:pattern];
  NSArray<NSTextCheckingResult *> *matches =
      [getNumericComponentRegex() matchesInString:pattern options:0 range:NSMakeRange(0, pattern.length)];
  NSInteger matchIndex = matches.count - 1;
  for (NSTextCheckingResult *match in [matches reverseObjectEnumerator]) {
    CGFloat val = ABI49_0_0RCTInterpolateValue(
        inputValue,
        [inputRange[rangeIndex] doubleValue],
        [inputRange[rangeIndex + 1] doubleValue],
        [outputRange[rangeIndex][matchIndex] doubleValue],
        [outputRange[rangeIndex + 1][matchIndex] doubleValue],
        extrapolateLeft,
        extrapolateRight);
    [output replaceCharactersInRange:match.range withString:[@(val) stringValue]];
    matchIndex--;
  }
  return output;
}

@implementation ABI49_0_0RCTInterpolationAnimatedNode {
  __weak ABI49_0_0RCTValueAnimatedNode *_parentNode;
  NSArray<NSNumber *> *_inputRange;
  NSArray *_outputRange;
  NSString *_extrapolateLeft;
  NSString *_extrapolateRight;
  ABI49_0_0RCTInterpolationOutputType _outputType;
  id _Nullable _outputvalue;
  NSString *_Nullable _outputPattern;

  NSArray<NSTextCheckingResult *> *_matches;
}

- (instancetype)initWithTag:(NSNumber *)tag config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithTag:tag config:config])) {
    _inputRange = config[@"inputRange"];

    NSArray *outputRangeConfig = config[@"outputRange"];
    if ([config[@"outputType"] isEqual:@"color"]) {
      _outputType = ABI49_0_0RCTInterpolationOutputColor;
    } else if ([outputRangeConfig[0] isKindOfClass:[NSString class]]) {
      _outputType = ABI49_0_0RCTInterpolationOutputString;
      _outputPattern = outputRangeConfig[0];
    } else {
      _outputType = ABI49_0_0RCTInterpolationOutputNumber;
    }

    NSMutableArray *outputRange = [NSMutableArray arrayWithCapacity:outputRangeConfig.count];
    for (id value in outputRangeConfig) {
      switch (_outputType) {
        case ABI49_0_0RCTInterpolationOutputColor: {
          UIColor *color = [ABI49_0_0RCTConvert UIColor:value];
          [outputRange addObject:color ? color : [UIColor whiteColor]];
          break;
        }
        case ABI49_0_0RCTInterpolationOutputString:
          [outputRange addObject:outputFromStringPattern(value)];
          break;
        case ABI49_0_0RCTInterpolationOutputNumber:
          [outputRange addObject:value];
          break;
      }
    }
    _outputRange = outputRange;
    _extrapolateLeft = config[@"extrapolateLeft"];
    _extrapolateRight = config[@"extrapolateRight"];
  }
  return self;
}

- (void)onAttachedToNode:(ABI49_0_0RCTAnimatedNode *)parent
{
  [super onAttachedToNode:parent];
  if ([parent isKindOfClass:[ABI49_0_0RCTValueAnimatedNode class]]) {
    _parentNode = (ABI49_0_0RCTValueAnimatedNode *)parent;
  }
}

- (void)onDetachedFromNode:(ABI49_0_0RCTAnimatedNode *)parent
{
  [super onDetachedFromNode:parent];
  if (_parentNode == parent) {
    _parentNode = nil;
  }
}

- (void)performUpdate
{
  [super performUpdate];
  if (!_parentNode) {
    return;
  }

  CGFloat inputValue = _parentNode.value;
  switch (_outputType) {
    case ABI49_0_0RCTInterpolationOutputColor:
      _outputvalue = @(ABI49_0_0RCTInterpolateColorInRange(inputValue, _inputRange, _outputRange));
      break;
    case ABI49_0_0RCTInterpolationOutputString:
      _outputvalue = ABI49_0_0RCTInterpolateString(
          _outputPattern, inputValue, _inputRange, _outputRange, _extrapolateLeft, _extrapolateRight);
      break;
    case ABI49_0_0RCTInterpolationOutputNumber:
      self.value =
          ABI49_0_0RCTInterpolateValueInRange(inputValue, _inputRange, _outputRange, _extrapolateLeft, _extrapolateRight);
      break;
  }
}

- (id)animatedObject
{
  return _outputvalue;
}

@end
