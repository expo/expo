// Copyright 2017-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXMailComposer/ABI42_0_0EXMailComposer.h>
#import <MobileCoreServices/MobileCoreServices.h>

#import <ABI42_0_0UMCore/ABI42_0_0UMUtilitiesInterface.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXFileSystemInterface.h>

@interface ABI42_0_0EXMailComposer ()

@property (nonatomic, weak) ABI42_0_0UMModuleRegistry *moduleRegistry;

@property (nonatomic, strong) ABI42_0_0UMPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI42_0_0UMPromiseRejectBlock reject;

@end

@implementation ABI42_0_0EXMailComposer

ABI42_0_0UM_EXPORT_MODULE(ExpoMailComposer);

- (void)setModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI42_0_0UM_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailable:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  resolve(@([MFMailComposeViewController canSendMail]));
}


ABI42_0_0UM_EXPORT_METHOD_AS(composeAsync,
                    composeAsync:(NSDictionary *)options
                    resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  if (![MFMailComposeViewController canSendMail]) {
    reject(@"E_COMPOSE_UNAVAILABLE", @"Mail services are not available. Make sure you're signed into the Mail app", nil);
    return;
  }

  MFMailComposeViewController* composeController = [[MFMailComposeViewController alloc] init];
  composeController.mailComposeDelegate = self;

  NSMutableArray *recipients = [[NSMutableArray alloc] init];
  for (NSString *recipient in options[@"recipients"]) {
    [recipients addObject:recipient];
  }
  [composeController setToRecipients:recipients];

  NSMutableArray *ccRecipients = [[NSMutableArray alloc] init];
  for (NSString *ccRecipient in options[@"ccRecipients"]) {
    [ccRecipients addObject:ccRecipient];
  }
  [composeController setCcRecipients:ccRecipients];

  NSMutableArray *bccRecipients = [[NSMutableArray alloc] init];
  for (NSString *bccRecipient in options[@"bccRecipients"]) {
    [bccRecipients addObject:bccRecipient];
  }
  [composeController setBccRecipients:bccRecipients];

  if (options[@"subject"] != nil) {
    [composeController setSubject:options[@"subject"]];
  }

  if (options[@"body"] != nil) {
    BOOL isHTML = NO;
    if (options[@"isHtml"]) {
      isHTML = YES;
    }
    [composeController setMessageBody:options[@"body"] isHTML:isHTML];
  }

  if (options[@"attachments"] != nil) {
    for (NSString *uri in options[@"attachments"]) {
      NSURL *url = [NSURL URLWithString:uri];
      NSString *path = [url.path stringByStandardizingPath];
      id<ABI42_0_0EXFileSystemInterface> fileSystem = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXFileSystemInterface)];
      if (!fileSystem) {
        reject(@"E_MISSING_MODULE", @"No FileSystem module.", nil);
        return;
      }
      if (!([fileSystem permissionsForURI:url] & ABI42_0_0EXFileSystemPermissionRead)) {
        reject(@"E_FILESYSTEM_PERMISSIONS", [NSString stringWithFormat:@"File '%@' isn't readable.", uri], nil);
        return;
      }

      if (![[NSFileManager defaultManager] fileExistsAtPath:path]) {
        reject(@"E_INVALID_ATTACHMENT", [NSString stringWithFormat:@"The file does not exist. Given path: `%@`.", path], nil);
        return;
      }

      NSString *mimeType = @"application/octet-stream";
      if ([path pathExtension]) {
        CFStringRef identifier = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, (__bridge CFStringRef)[path pathExtension], NULL);
        CFStringRef typeRef = UTTypeCopyPreferredTagWithClass (identifier, kUTTagClassMIMEType);
        CFRelease(identifier);
        if (typeRef != NULL) {
          mimeType = [NSString stringWithString:(__bridge NSString *)(typeRef)];
          CFRelease(typeRef);
        }
      }

      NSData *fileData = [NSData dataWithContentsOfFile:path];

      [composeController addAttachmentData:fileData mimeType:mimeType fileName:[path lastPathComponent]];
    }
  }

  self.resolve = resolve;
  self.reject = reject;
  id<ABI42_0_0UMUtilitiesInterface> utilities = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0UMUtilitiesInterface)];
  [utilities.currentViewController presentViewController:composeController animated:YES completion:nil];
}

- (void)mailComposeController:(MFMailComposeViewController *)controller
          didFinishWithResult:(MFMailComposeResult)result error:(NSError *)error {
  __weak typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    [controller dismissViewControllerAnimated:YES completion:^{
      __strong typeof(self) strongSelf = weakSelf;
      if (strongSelf && strongSelf.resolve != nil && strongSelf.reject != nil) {
        if (error != nil) {
          strongSelf.reject(@"E_MAIL_ERROR", @"An error occurred while trying to send the e-mail.", error);
          strongSelf.reject = nil;
          strongSelf.resolve = nil;
          return;
        }

        switch (result) {
          case MFMailComposeResultSent:
            strongSelf.resolve(@{ @"status": @"sent" });
            break;
          case MFMailComposeResultSaved:
            strongSelf.resolve(@{ @"status": @"saved" });
            break;
          case MFMailComposeResultCancelled:
            strongSelf.resolve(@{ @"status": @"cancelled" });
            break;
          case MFMailComposeResultFailed:
            strongSelf.reject(@"E_MAIL_ERROR", @"Something went wrong while trying to send the e-mail.", error);
            break;
          default:
            strongSelf.reject(@"E_MAIL_ERROR", @"Something went wrong while trying to send the e-mail.", error);
            break;
        }

        strongSelf.reject = nil;
        strongSelf.resolve = nil;
      }
    }];
  });
}

@end
