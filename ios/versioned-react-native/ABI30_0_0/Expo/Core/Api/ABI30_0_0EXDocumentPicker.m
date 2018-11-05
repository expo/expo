// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI30_0_0EXDocumentPicker.h"
#import "ABI30_0_0EXScopedModuleRegistry.h"
#import "ABI30_0_0EXUtil.h"
#import "ABI30_0_0EXModuleRegistryBinding.h"
#import <ABI30_0_0EXCore/ABI30_0_0EXUtilitiesInterface.h>
#import <ABI30_0_0EXFileSystemInterface/ABI30_0_0EXFileSystemInterface.h>

#import <MobileCoreServices/MobileCoreServices.h>
#import <UIKit/UIKit.h>
#import <ReactABI30_0_0/ABI30_0_0RCTConvert.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUtils.h>

static NSString * ABI30_0_0EXConvertMimeTypeToUTI(NSString *mimeType)
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

@interface ABI30_0_0EXDocumentPicker () <UIDocumentMenuDelegate, UIDocumentPickerDelegate>

@property (nonatomic, strong) ABI30_0_0RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI30_0_0RCTPromiseRejectBlock reject;

@property (nonatomic, assign) BOOL shouldCopyToCacheDirectory;

@end

@implementation ABI30_0_0EXDocumentPicker

@synthesize bridge = _bridge;

ABI30_0_0RCT_EXPORT_MODULE(ExponentDocumentPicker)

ABI30_0_0RCT_EXPORT_METHOD(getDocumentAsync:(NSDictionary *)options resolver:(ABI30_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI30_0_0RCTPromiseRejectBlock)reject) {
  _resolve = resolve;
  _reject = reject;

  NSString *type = ABI30_0_0EXConvertMimeTypeToUTI(options[@"type"] ?: @"*/*");

  if (options[@"copyToCacheDirectory"] && [ABI30_0_0RCTConvert BOOL:options[@"copyToCacheDirectory"]] == NO) {
    _shouldCopyToCacheDirectory = NO;
  } else {
    _shouldCopyToCacheDirectory = YES;
  }

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
  
  // Because of the way IPad works with Actionsheets such as this one, we need to provide a source view and set it's position.
  if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
    documentMenuVC.popoverPresentationController.sourceRect = CGRectMake(CGRectGetMidX([ABI30_0_0RCTPresentedViewController().view frame]), CGRectGetMaxY([ABI30_0_0RCTPresentedViewController().view frame]), 0, 0);
    documentMenuVC.popoverPresentationController.sourceView = ABI30_0_0RCTPresentedViewController().view;
    documentMenuVC.modalPresentationStyle = UIModalPresentationPageSheet;
  }

  id<ABI30_0_0EXUtilitiesInterface> utils = [_bridge.scopedModules.moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXUtilitiesInterface)];
  [utils.currentViewController presentViewController:documentMenuVC animated:YES completion:nil];
}

- (void)documentMenu:(UIDocumentMenuViewController *)documentMenu didPickDocumentPicker:(UIDocumentPickerViewController *)documentPicker
{
  documentPicker.delegate = self;
  id<ABI30_0_0EXUtilitiesInterface> utils = [_bridge.scopedModules.moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXUtilitiesInterface)];
  [utils.currentViewController presentViewController:documentPicker animated:YES completion:nil];
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
  
  NSURL *newUrl = url;
  if (_shouldCopyToCacheDirectory) {
    id<ABI30_0_0EXFileSystemInterface> fileSystem = [_bridge.scopedModules.moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXFileSystemInterface)];
    if (!fileSystem) {
      _reject(@"E_CANNOT_PICK_FILE", @"No FileSystem module.", nil);
      return;
    }
    NSString *directory = [fileSystem.cachesDirectory stringByAppendingPathComponent:@"DocumentPicker"];
    NSString *extension = [url pathExtension];
    NSString *path = [fileSystem generatePathInDirectory:directory withExtension:[extension isEqualToString:@""] ? extension : [@"." stringByAppendingString:extension]];
    NSError *error = nil;
    newUrl = [NSURL fileURLWithPath:path];
    [[NSFileManager defaultManager] copyItemAtURL:url toURL:newUrl error:&error];
    if (error != nil) {
      self.reject(@"E_CANNOT_PICK_FILE", @"File could not be saved to app storage", error);
      return;
    }
  }

  _resolve(@{
    @"type": @"success",
    @"uri": [newUrl absoluteString],
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

