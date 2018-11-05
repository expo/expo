// Copyright © 2018 650 Industries. All rights reserved.

#import <MessageUI/MessageUI.h>
#import <ABI29_0_0EXSMS/ABI29_0_0EXSMSModule.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXUtilities.h>
#import <ABI29_0_0EXPermissionsInterface/ABI29_0_0EXPermissionsInterface.h>

@interface ABI29_0_0EXSMSModule () <MFMessageComposeViewControllerDelegate>

@property (nonatomic, weak) id<ABI29_0_0EXPermissionsInterface> permissionsManager;
@property (nonatomic, weak) id<ABI29_0_0EXUtilitiesInterface> utils;
@property (nonatomic, strong) ABI29_0_0EXPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI29_0_0EXPromiseRejectBlock reject;

@end

@implementation ABI29_0_0EXSMSModule

ABI29_0_0EX_EXPORT_MODULE(ExpoSMS);

- (void)setModuleRegistry:(ABI29_0_0EXModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI29_0_0EXPermissionsInterface)];
  _utils = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI29_0_0EXUtilitiesInterface)];
}

ABI29_0_0EX_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailable:(ABI29_0_0EXPromiseResolveBlock)resolve
                       rejecter:(ABI29_0_0EXPromiseRejectBlock)reject)
{
  if ([[UIApplication sharedApplication] canOpenURL:[NSURL URLWithString:@"sms:"]]) {
    resolve(@YES);
  } else {
    resolve(@NO);
  }
}

ABI29_0_0EX_EXPORT_METHOD_AS(sendSMSAsync,
                    sendSMS:(NSArray<NSString *> *)addresses
                    message:(NSString *)message
                   resolver:(ABI29_0_0EXPromiseResolveBlock)resolve
                   rejecter:(ABI29_0_0EXPromiseRejectBlock)reject)
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

  __weak ABI29_0_0EXSMSModule *weakSelf = self;
  [ABI29_0_0EXUtilities performSynchronouslyOnMainThread:^{
    __strong ABI29_0_0EXSMSModule *strongSelf = weakSelf;
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
