// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXHaptics/ABI43_0_0EXHapticsModule.h>

@interface ABI43_0_0EXHapticsModule ()

@end

@implementation ABI43_0_0EXHapticsModule

ABI43_0_0EX_EXPORT_MODULE(ExpoHaptics);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI43_0_0EX_EXPORT_METHOD_AS(notificationAsync,
                    notifyWithType:(NSString *)inputType
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  NSDictionary* types = @{
                          @"success": @(UINotificationFeedbackTypeSuccess),
                          @"warning": @(UINotificationFeedbackTypeWarning),
                          @"error": @(UINotificationFeedbackTypeError),
                          };
  
  if (!types[inputType]) {
    return reject(@"E_HAPTICS_INVALID_ARG", [NSString stringWithFormat:@"'type' must be one of ['success', 'warning', 'error']. Obtained '%@'", inputType], nil);
  }
  
  UINotificationFeedbackGenerator *feedback = [UINotificationFeedbackGenerator new];
  [feedback prepare];
  [feedback notificationOccurred:[types[inputType] integerValue]];
  feedback = nil;
  
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(impactAsync,
                    impactWithStyle:(NSString *)inputStyle
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  NSDictionary* styles = @{
                           @"light": @(UIImpactFeedbackStyleLight),
                           @"medium": @(UIImpactFeedbackStyleMedium),
                           @"heavy": @(UIImpactFeedbackStyleHeavy),
                           };

  if (!styles[inputStyle]) {
    return reject(@"E_HAPTICS_INVALID_ARG", [NSString stringWithFormat:@"'style' must be one of ['light', 'medium', 'heavy']. Obtained '%@'", inputStyle], nil);
  }
  
  UIImpactFeedbackGenerator *feedback = [[UIImpactFeedbackGenerator alloc] initWithStyle:[styles[inputStyle] integerValue]];
  [feedback prepare];
  [feedback impactOccurred];
  feedback = nil;
  
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(selectionAsync,
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  UISelectionFeedbackGenerator *feedback = [UISelectionFeedbackGenerator new];
  [feedback prepare];
  [feedback selectionChanged];
  feedback = nil;
  
  resolve(nil);
}

@end
