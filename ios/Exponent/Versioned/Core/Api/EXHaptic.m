//
//  EXHaptic.m
//  Exponent
//
//  Created by Evan Bacon on 2/23/18.
//  Copyright © 2018 650 Industries. All rights reserved.
//

#import "EXHaptic.h"

#if !TARGET_OS_TV
@implementation RCTConvert (UINotificationFeedback)

RCT_ENUM_CONVERTER(UINotificationFeedbackType, (@{
                                                  @"success": @(UINotificationFeedbackTypeSuccess),
                                                  @"warning": @(UINotificationFeedbackTypeWarning),
                                                  @"error": @(UINotificationFeedbackTypeError),
                                                  }), UINotificationFeedbackTypeSuccess, integerValue);

@end

@implementation RCTConvert (UIImpactFeedback)
RCT_ENUM_CONVERTER(UIImpactFeedbackStyle, (@{
                                             @"light": @(UIImpactFeedbackStyleLight),
                                             @"medium": @(UIImpactFeedbackStyleMedium),
                                             @"heavy": @(UIImpactFeedbackStyleHeavy),
                                             }), UIImpactFeedbackStyleMedium, integerValue);

@end
#endif

@implementation EXHaptic

RCT_EXPORT_MODULE(ExponentHaptic);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(notification:(UINotificationFeedbackType)type)
{
  if (@available(iOS 10, *)) {
    UINotificationFeedbackGenerator *feedback = [UINotificationFeedbackGenerator new];
    [feedback prepare];
    [feedback notificationOccurred:type];
    feedback = nil;
  }
}

RCT_EXPORT_METHOD(impact:(UIImpactFeedbackStyle)style)
{
  if (@available(iOS 10, *)) {
    UIImpactFeedbackGenerator *feedback = [[UIImpactFeedbackGenerator alloc] initWithStyle:style];
    [feedback prepare];
    [feedback impactOccurred];
    feedback = nil;
  }
}

RCT_EXPORT_METHOD(selection)
{
  if (@available(iOS 10, *)) {
    UISelectionFeedbackGenerator *feedback = [UISelectionFeedbackGenerator new];
    [feedback prepare];
    [feedback selectionChanged];
    feedback = nil;
  }
}

@end

