//
//  EXMailComposer.m
//  Exponent
//
//  Created by Alicja Warchał on 20.12.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import "EXMailComposer.h"
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <MobileCoreServices/MobileCoreServices.h>

#import <EXFileSystemInterface/EXFileSystemInterface.h>
#import "EXModuleRegistryBinding.h"

@interface EXMailComposer ()

@property (nonatomic, strong) RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) RCTPromiseRejectBlock reject;

@end

@implementation EXMailComposer

RCT_EXPORT_MODULE(ExponentMailComposer);

@synthesize bridge = _bridge;

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
}

RCT_EXPORT_METHOD(composeAsync:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if (![MFMailComposeViewController canSendMail]) {
    reject(@"E_COMPOSE_UNAVAILABLE", @"Mail services are not available.", nil);
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
      id<EXFileSystemInterface> fileSystem = [self.bridge.scopedModules.moduleRegistry getModuleImplementingProtocol:@protocol(EXFileSystemInterface)];
      if (!fileSystem) {
        reject(@"E_MISSING_MODULE", @"No FileSystem module.", nil);
        return;
      }
      if (!([fileSystem permissionsForURI:url] & EXFileSystemPermissionRead)) {
        reject(@"E_FILESYSTEM_PERMISSIONS", [NSString stringWithFormat:@"File '%@' isn't readable.", uri], nil);
        return;
      }
      
      if (![[NSFileManager defaultManager] fileExistsAtPath:path]) {
        reject(@"E_INVALID_ATTACHMENT", [NSString stringWithFormat:@"The file does not exist. Given path: `%@`.", path], nil);
        return;
      }
      
      CFStringRef identifier = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, (__bridge CFStringRef)[path pathExtension], NULL);
      CFStringRef typeRef = UTTypeCopyPreferredTagWithClass (identifier, kUTTagClassMIMEType);
      CFRelease(identifier);
      NSString *mimeType = [NSString stringWithString:(__bridge NSString *)(typeRef)];
      CFRelease(typeRef);
      
      NSData *fileData = [NSData dataWithContentsOfFile:path];
      
      [composeController addAttachmentData:fileData mimeType:mimeType fileName:[path lastPathComponent]];
    }
  }

  self.resolve = resolve;
  self.reject = reject;
  dispatch_async(dispatch_get_main_queue(), ^{
    [RCTPresentedViewController() presentViewController:composeController animated:YES completion:nil];
  });
}

- (void)mailComposeController:(MFMailComposeViewController *)controller
          didFinishWithResult:(MFMailComposeResult)result error:(NSError *)error {
  
  if (self.resolve != nil && self.reject != nil) {
    if (error != nil) {
      self.reject(@"E_MAIL_ERROR", @"An error occurred while trying to send the e-mail.", error);
      self.reject = nil;
      self.resolve = nil;
      return;
    }
    
    switch (result) {
      case MFMailComposeResultSent:
        self.resolve(@{ @"status": @"sent" });
        break;
      case MFMailComposeResultSaved:
        self.resolve(@{ @"status": @"saved" });
        break;
      case MFMailComposeResultCancelled:
        self.resolve(@{ @"status": @"cancelled" });
        break;
      case MFMailComposeResultFailed:
        self.reject(@"E_MAIL_ERROR", @"Something went wrong while trying to send the e-mail.", error);
        break;
      default:
        self.reject(@"E_MAIL_ERROR", @"Something went wrong while trying to send the e-mail.", error);
        break;
    }
    
    self.reject = nil;
    self.resolve = nil;
  }
  
  dispatch_async(dispatch_get_main_queue(), ^{
    [controller dismissViewControllerAnimated:YES completion:nil];
  });
}

@end
