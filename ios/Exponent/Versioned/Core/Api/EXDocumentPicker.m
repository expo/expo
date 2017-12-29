// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDocumentPicker.h"

#import <MobileCoreServices/MobileCoreServices.h>
#import <UIKit/UIKit.h>
#import <React/RCTUtils.h>

static NSString * EXConvertMimeTypeToUTI(NSString *mimeType)
{
  CFStringRef uti;

  // UTTypeCreatePreferredIdentifierForTag doesn't work with wildcard mimetypes
  // so support common top level types with wildcards here.
  if ([mimeType isEqualToString:@"*/*"]) {
    uti = kUTTypeData;
  } else if ([mimeType isEqualToString:@"image/*"]) {
    uti = kUTTypeImage;
  } else if ([mimeType isEqualToString:@"video/*"]) {
    uti = kUTTypeVideo;
  } else if ([mimeType isEqualToString:@"audio/*"]) {
    uti = kUTTypeAudio;
  } else if ([mimeType isEqualToString:@"text/*"]) {
    uti = kUTTypeText;
  } else {
    CFStringRef mimeTypeRef = (__bridge CFStringRef)mimeType;
    uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, mimeTypeRef, NULL);
  }

  return (__bridge_transfer NSString *)uti;
}

@interface EXDocumentPicker () <UIDocumentMenuDelegate, UIDocumentPickerDelegate>

@property (nonatomic, strong) RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) RCTPromiseRejectBlock reject;

@end

@implementation EXDocumentPicker

RCT_EXPORT_MODULE(ExponentDocumentPicker)

RCT_EXPORT_METHOD(getDocumentAsync:(NSDictionary *)options resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  _resolve = resolve;
  _reject = reject;

  NSString *type = EXConvertMimeTypeToUTI(options[@"type"] ?: @"*/*");

  UIDocumentMenuViewController *documentMenuVC;
  @try {
    documentMenuVC = [[UIDocumentMenuViewController alloc] initWithDocumentTypes:@[type]
                                                                          inMode:UIDocumentPickerModeImport];
  }
  @catch (NSException *exception) {
    reject(@"E_PICKER_ICLOUD", @"DocumentPicker requires the iCloud entitlement. If you are using ExpoKit, you need to add this capability to your App Id. See `https://docs.expo.io/versions/v16.0.0/guides/advanced-expokit-topics.html#enabling-icloud-entitlement` for more info.", nil);
    _resolve = nil;
    _reject = nil;
    return;
  }
  documentMenuVC.delegate = self;

  [RCTPresentedViewController() presentViewController:documentMenuVC animated:YES completion:nil];
}

- (void)documentMenu:(UIDocumentMenuViewController *)documentMenu didPickDocumentPicker:(UIDocumentPickerViewController *)documentPicker
{
  documentPicker.delegate = self;
  [RCTPresentedViewController() presentViewController:documentPicker animated:YES completion:nil];
}

- (void)documentMenuWasCancelled:(UIDocumentMenuViewController *)documentMenu
{
  _resolve(@{@"type": @"cancel"});
  _resolve = nil;
  _reject = nil;
}

- (void)documentPicker:(UIDocumentPickerViewController *)controller didPickDocumentAtURL:(NSURL *)url
{

  NSNumber *fileSize = nil;
  NSError *fileSizeError = nil;
  [url getResourceValue:&fileSize forKey:NSURLFileSizeKey error:&fileSizeError];
  if (fileSizeError) {
    _reject(@"E_INVALID_FILE", @"Unable to get file size", fileSizeError);
    _resolve = nil;
    _reject = nil;
    return;
  }

  _resolve(@{
    @"type": @"success",
    @"uri": [url absoluteString],
    @"name": [url lastPathComponent],
    @"size": fileSize,
  });
  _resolve = nil;
  _reject = nil;
}

- (void)documentPickerWasCancelled:(UIDocumentPickerViewController *)controller
{
  _resolve(@{@"type": @"cancel"});
  _resolve = nil;
  _reject = nil;
}

@end

