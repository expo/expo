// Copyright © 2018 650 Industries. All rights reserved.

#import <MessageUI/MessageUI.h>
#import <ABI37_0_0EXSMS/ABI37_0_0EXSMSModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMUtilities.h>

@interface ABI37_0_0EXSMSModule () <MFMessageComposeViewControllerDelegate>

@property (nonatomic, weak) id<ABI37_0_0UMUtilitiesInterface> utils;
@property (nonatomic, strong) ABI37_0_0UMPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI37_0_0UMPromiseRejectBlock reject;

@end

@implementation ABI37_0_0EXSMSModule

ABI37_0_0UM_EXPORT_MODULE(ExpoSMS);

- (void)setModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  _utils = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMUtilitiesInterface)];
}

ABI37_0_0UM_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailable:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  resolve(@([MFMessageComposeViewController canSendText]));
}

ABI37_0_0UM_EXPORT_METHOD_AS(sendSMSAsync,
                    sendSMS:(NSArray<NSString *> *)addresses
                    message:(NSString *)message
                    resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  if (![MFMessageComposeViewController canSendText]) {
    reject(@"E_SMS_UNAVAILABLE", @"SMS service not available", nil);
    return;
  }
  
  if (_resolve != nil || _reject != nil) {
    reject(@"E_SMS_SENDING_IN_PROGRESS", @"Different SMS sending in progress. Await the old request and then try again.", nil);
    return;
  }
  
  _resolve = resolve;
  _reject = reject;
    
  MFMessageComposeViewController *messageComposeViewController = [[MFMessageComposeViewController alloc] init];
  messageComposeViewController.messageComposeDelegate = self;
  messageComposeViewController.recipients = addresses;
  messageComposeViewController.body = message;
    
  ABI37_0_0UM_WEAKIFY(self);
  [ABI37_0_0UMUtilities performSynchronouslyOnMainThread:^{
    ABI37_0_0UM_ENSURE_STRONGIFY(self);
    [self.utils.currentViewController presentViewController:messageComposeViewController animated:YES completion:nil];
  }];
}

- (void)messageComposeViewController:(MFMessageComposeViewController *)controller
                 didFinishWithResult:(MessageComposeResult)result
{
  NSDictionary *resolveData;
  NSString *rejectMessage;
  switch (result) {
    case MessageComposeResultCancelled:
      resolveData = @{@"result": @"cancelled"};
      break;
    case MessageComposeResultSent:
      resolveData = @{@"result": @"sent"};
      break;
    case MessageComposeResultFailed:
      rejectMessage = @"User's attempt to save or send an SMS was unsuccessful. This can occur when the device loses connection to Wifi or Cellular.";
      break;
    default:
      rejectMessage = @"SMS message sending failed with unknown error";
      break;
  }
  ABI37_0_0UM_WEAKIFY(self);
  [controller dismissViewControllerAnimated:YES completion:^{
    ABI37_0_0UM_ENSURE_STRONGIFY(self);
    if (rejectMessage) {
      self->_reject(@"E_SMS_SENDING_FAILED", rejectMessage, nil);
    } else {
      self->_resolve(resolveData);
    }
    self->_reject = nil;
    self->_resolve = nil;
  }];
}

@end
