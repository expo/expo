// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXHaptics/EXHapticsModule.h>

@interface EXHapticsModule ()

@end

@implementation EXHapticsModule

UM_EXPORT_MODULE(ExpoHaptics);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

UM_EXPORT_METHOD_AS(notificationAsync,
                    notifyWithType:(NSString *)inputType
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
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

UM_EXPORT_METHOD_AS(impactAsync,
                    impactWithStyle:(NSString *)inputStyle
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
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

UM_EXPORT_METHOD_AS(selectionAsync,
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  UISelectionFeedbackGenerator *feedback = [UISelectionFeedbackGenerator new];
  [feedback prepare];
  [feedback selectionChanged];
  feedback = nil;
  
  resolve(nil);
}

@end
