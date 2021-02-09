/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI39_0_0React/ABI39_0_0RCTDefines.h>
#import <ABI39_0_0React/ABI39_0_0RCTLog.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI39_0_0RCTScrollViewProtocol <NSObject>
- (void)flashScrollIndicators;
- (void)scrollTo:(double)x y:(double)y animated:(BOOL)animated;
- (void)scrollToEnd:(BOOL)animated;
@end

ABI39_0_0RCT_EXTERN inline void
ABI39_0_0RCTScrollViewHandleCommand(id<ABI39_0_0RCTScrollViewProtocol> componentView, NSString const *commandName, NSArray const *args)
{
  if ([commandName isEqualToString:@"flashScrollIndicators"]) {
#if ABI39_0_0RCT_DEBUG
    if ([args count] != 0) {
      ABI39_0_0RCTLogError(
          @"%@ command %@ received %d arguments, expected %d.", @"ScrollView", commandName, (int)[args count], 1);
      return;
    }
#endif

    [componentView flashScrollIndicators];
    return;
  }

  if ([commandName isEqualToString:@"scrollTo"]) {
#if ABI39_0_0RCT_DEBUG
    if ([args count] != 3) {
      ABI39_0_0RCTLogError(
          @"%@ command %@ received %d arguments, expected %d.", @"ScrollView", commandName, (int)[args count], 3);
      return;
    }
#endif

    NSObject *arg0 = args[0];
#if ABI39_0_0RCT_DEBUG
    if (!ABI39_0_0RCTValidateTypeOfViewCommandArgument(arg0, [NSNumber class], @"float", @"ScrollView", commandName, @"1st")) {
      return;
    }
#endif
    NSObject *arg1 = args[1];
#if ABI39_0_0RCT_DEBUG
    if (!ABI39_0_0RCTValidateTypeOfViewCommandArgument(arg1, [NSNumber class], @"float", @"ScrollView", commandName, @"2nd")) {
      return;
    }
#endif
    NSObject *arg2 = args[2];
#if ABI39_0_0RCT_DEBUG
    if (!ABI39_0_0RCTValidateTypeOfViewCommandArgument(arg2, [NSNumber class], @"boolean", @"ScrollView", commandName, @"3rd")) {
      return;
    }
#endif

    double x = [(NSNumber *)arg0 doubleValue];
    double y = [(NSNumber *)arg1 doubleValue];
    BOOL animated = [(NSNumber *)arg2 boolValue];

    [componentView scrollTo:x y:y animated:animated];
    return;
  }

  if ([commandName isEqualToString:@"scrollToEnd"]) {
#if ABI39_0_0RCT_DEBUG
    if ([args count] != 1) {
      ABI39_0_0RCTLogError(
          @"%@ command %@ received %d arguments, expected %d.", @"ScrollView", commandName, (int)[args count], 1);
      return;
    }
#endif

    NSObject *arg0 = args[0];
#if ABI39_0_0RCT_DEBUG
    if (!ABI39_0_0RCTValidateTypeOfViewCommandArgument(arg0, [NSNumber class], @"boolean", @"ScrollView", commandName, @"1st")) {
      return;
    }
#endif

    BOOL animated = [(NSNumber *)arg0 boolValue];

    [componentView scrollToEnd:animated];
    return;
  }
}

NS_ASSUME_NONNULL_END
