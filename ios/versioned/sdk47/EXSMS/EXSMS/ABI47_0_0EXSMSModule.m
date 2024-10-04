// Copyright © 2018 650 Industries. All rights reserved.

#import <MessageUI/MessageUI.h>
#import <ABI47_0_0EXSMS/ABI47_0_0EXSMSModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXUtilities.h>
#if SD_MAC
#import <CoreServices/CoreServices.h>
#else
#import <MobileCoreServices/MobileCoreServices.h>
#endif

@interface ABI47_0_0EXSMSModule () <MFMessageComposeViewControllerDelegate>

@property (nonatomic, weak) id<ABI47_0_0EXUtilitiesInterface> utils;
@property (nonatomic, strong) ABI47_0_0EXPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI47_0_0EXPromiseRejectBlock reject;

@end

@implementation ABI47_0_0EXSMSModule

ABI47_0_0EX_EXPORT_MODULE(ExpoSMS);

- (dispatch_queue_t)methodQueue
{
  // Everything in this module uses `MFMessageComposeViewController` which is a subclass of UIViewController,
  // so everything should be called from main thread.
  return dispatch_get_main_queue();
}

- (void)setModuleRegistry:(ABI47_0_0EXModuleRegistry *)moduleRegistry
{
  _utils = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXUtilitiesInterface)];
}

ABI47_0_0EX_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailable:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  resolve(@([MFMessageComposeViewController canSendText]));
}

ABI47_0_0EX_EXPORT_METHOD_AS(sendSMSAsync,
                    sendSMS:(NSArray<NSString *> *)addresses
                    message:(NSString *)message
                    options:(NSDictionary *)options
                    resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
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
  
  if (options) {
    if (options[@"attachments"]) {
      NSArray *attachments = (NSArray *) [options objectForKey:@"attachments"];
      for (NSDictionary* attachment in attachments) {
        NSString *mimeType = attachment[@"mimeType"];
        CFStringRef mimeTypeRef = (__bridge CFStringRef)mimeType;
        CFStringRef utiRef = UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, mimeTypeRef, NULL);
        if (utiRef == NULL) {
          reject(@"E_SMS_ATTACHMENT", [NSString stringWithFormat:@"Failed to find UTI for mimeType: %@", mimeType], nil);
          _resolve = nil;
          _reject = nil;
          return;
        }
        NSString *typeIdentifier = (__bridge_transfer NSString *)utiRef;
        NSString *uri = attachment[@"uri"];
        NSString *filename = attachment[@"filename"];
        NSError *error;
        NSData *attachmentData = [NSData dataWithContentsOfURL:[NSURL URLWithString:uri] options:(NSDataReadingOptions)0 error:&error];
        bool attached = [messageComposeViewController addAttachmentData:attachmentData typeIdentifier:typeIdentifier filename:filename];
        if (!attached) {
          reject(@"E_SMS_ATTACHMENT", [NSString stringWithFormat:@"Failed to attach file: %@", uri], nil);
          _resolve = nil;
          _reject = nil;
          return;
        }
      }
    }
  }

  [self.utils.currentViewController presentViewController:messageComposeViewController animated:YES completion:nil];
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
  ABI47_0_0EX_WEAKIFY(self);
  [controller dismissViewControllerAnimated:YES completion:^{
    ABI47_0_0EX_ENSURE_STRONGIFY(self);
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
