// Copyright © 2018 650 Industries. All rights reserved.

#import <MessageUI/MessageUI.h>
#import <EXSMS/EXSMSModule.h>
#import <EXCore/EXUtilities.h>
#import <EXPermissionsInterface/EXPermissionsInterface.h>

@interface EXSMSModule () <MFMessageComposeViewControllerDelegate>

@property (nonatomic, weak) id<EXPermissionsInterface> permissionsManager;
@property (nonatomic, weak) id<EXUtilitiesInterface> utils;
@property (nonatomic, strong) EXPromiseResolveBlock resolve;
@property (nonatomic, strong) EXPromiseRejectBlock reject;

@end

@implementation EXSMSModule

EX_EXPORT_MODULE(ExpoSMS);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXPermissionsInterface)];
  _utils = [moduleRegistry getModuleImplementingProtocol:@protocol(EXUtilitiesInterface)];
}

EX_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailable:(EXPromiseResolveBlock)resolve
                       rejecter:(EXPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    BOOL canOpenURL = [[UIApplication sharedApplication] canOpenURL:[NSURL URLWithString:@"sms:"]];
    resolve(@(canOpenURL));
  });
}

EX_EXPORT_METHOD_AS(sendSMSAsync,
                    sendSMS:(NSArray<NSString *> *)addresses
                    message:(NSString *)message
                   resolver:(EXPromiseResolveBlock)resolve
                   rejecter:(EXPromiseRejectBlock)reject)
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

  MFMessageComposeViewController *composeViewController = [[MFMessageComposeViewController alloc] init];
  composeViewController.messageComposeDelegate = self;
  composeViewController.recipients = addresses;
  composeViewController.body = message;

  __weak EXSMSModule *weakSelf = self;
  [EXUtilities performSynchronouslyOnMainThread:^{
    __strong EXSMSModule *strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf.utils.currentViewController presentViewController:composeViewController animated:YES completion:nil];
    }
  }];
}

- (void)messageComposeViewController:(MFMessageComposeViewController *)controller
                 didFinishWithResult:(MessageComposeResult)result
{
  switch (result) {
    case MessageComposeResultCancelled:
      _resolve(@{@"result": @"cancelled"});
      break;

    case MessageComposeResultFailed:
      _reject(@"E_SMS_SENDING_FAILED", @"SMS message sending failed", nil);
      break;

    case MessageComposeResultSent:
      _resolve(@{@"result": @"sent"});
      break;

    default:
      _reject(@"E_SMS_SENDING_FAILED", @"SMS message sending failed with unknown error", nil);
      break;
  }
  _reject = nil;
  _resolve = nil;
  [controller dismissViewControllerAnimated:YES completion:nil];
}

@end
