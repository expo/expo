// Copyright © 2018 650 Industries. All rights reserved.

#import <MessageUI/MessageUI.h>
#import <ABI32_0_0EXSMS/ABI32_0_0EXSMSModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXUtilities.h>
#import <ABI32_0_0EXPermissionsInterface/ABI32_0_0EXPermissionsInterface.h>

@interface ABI32_0_0EXSMSModule () <MFMessageComposeViewControllerDelegate>

@property (nonatomic, weak) id<ABI32_0_0EXPermissionsInterface> permissionsManager;
@property (nonatomic, weak) id<ABI32_0_0EXUtilitiesInterface> utils;
@property (nonatomic, strong) ABI32_0_0EXPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI32_0_0EXPromiseRejectBlock reject;

@end

@implementation ABI32_0_0EXSMSModule

ABI32_0_0EX_EXPORT_MODULE(ExpoSMS);

- (void)setModuleRegistry:(ABI32_0_0EXModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI32_0_0EXPermissionsInterface)];
  _utils = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI32_0_0EXUtilitiesInterface)];
}

ABI32_0_0EX_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailable:(ABI32_0_0EXPromiseResolveBlock)resolve
                       rejecter:(ABI32_0_0EXPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    BOOL canOpenURL = [[UIApplication sharedApplication] canOpenURL:[NSURL URLWithString:@"sms:"]];
    resolve(@(canOpenURL));
  });
}

ABI32_0_0EX_EXPORT_METHOD_AS(sendSMSAsync,
                    sendSMS:(NSArray<NSString *> *)addresses
                    message:(NSString *)message
                   resolver:(ABI32_0_0EXPromiseResolveBlock)resolve
                   rejecter:(ABI32_0_0EXPromiseRejectBlock)reject)
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

  ABI32_0_0EX_WEAKIFY(self);
  [ABI32_0_0EXUtilities performSynchronouslyOnMainThread:^{
    ABI32_0_0EX_ENSURE_STRONGIFY(self);
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

    case MessageComposeResultFailed:
      rejectMessage = @"SMS message sending failed";
      break;

    case MessageComposeResultSent:
      resolveData = @{@"result": @"sent"};
      break;

    default:
      rejectMessage = @"SMS message sending failed with unknown error";
      break;
  }
  ABI32_0_0EX_WEAKIFY(self);
  [controller dismissViewControllerAnimated:YES completion:^{
    ABI32_0_0EX_ENSURE_STRONGIFY(self);
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
