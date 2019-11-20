// Copyright © 2018 650 Industries. All rights reserved.

#import <MessageUI/MessageUI.h>
#import <ABI34_0_0EXSMS/ABI34_0_0EXSMSModule.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMUtilities.h>
#import <ABI34_0_0UMPermissionsInterface/ABI34_0_0UMPermissionsInterface.h>

@interface ABI34_0_0EXSMSModule () <MFMessageComposeViewControllerDelegate>

@property (nonatomic, weak) id<ABI34_0_0UMPermissionsInterface> permissionsManager;
@property (nonatomic, weak) id<ABI34_0_0UMUtilitiesInterface> utils;
@property (nonatomic, strong) ABI34_0_0UMPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI34_0_0UMPromiseRejectBlock reject;

@end

@implementation ABI34_0_0EXSMSModule

ABI34_0_0UM_EXPORT_MODULE(ExpoSMS);

- (void)setModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI34_0_0UMPermissionsInterface)];
  _utils = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI34_0_0UMUtilitiesInterface)];
}

ABI34_0_0UM_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailable:(ABI34_0_0UMPromiseResolveBlock)resolve
                       rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    BOOL canOpenURL = [[UIApplication sharedApplication] canOpenURL:[NSURL URLWithString:@"sms:"]];
    resolve(@(canOpenURL));
  });
}

ABI34_0_0UM_EXPORT_METHOD_AS(sendSMSAsync,
                    sendSMS:(NSArray<NSString *> *)addresses
                    message:(NSString *)message
                   resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                   rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
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

  ABI34_0_0UM_WEAKIFY(self);
  [ABI34_0_0UMUtilities performSynchronouslyOnMainThread:^{
    ABI34_0_0UM_ENSURE_STRONGIFY(self);
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
  ABI34_0_0UM_WEAKIFY(self);
  [controller dismissViewControllerAnimated:YES completion:^{
    ABI34_0_0UM_ENSURE_STRONGIFY(self);
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
