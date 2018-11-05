// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDocumentPicker.h"
#import "EXScopedModuleRegistry.h"
#import "EXUtil.h"
#import "EXModuleRegistryBinding.h"
#import <EXCore/EXUtilitiesInterface.h>
#import <EXFileSystemInterface/EXFileSystemInterface.h>

#import <MobileCoreServices/MobileCoreServices.h>
#import <UIKit/UIKit.h>
#import <React/RCTConvert.h>
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

@property (nonatomic, assign) BOOL shouldCopyToCacheDirectory;

@end

@implementation EXDocumentPicker

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(ExponentDocumentPicker)

RCT_EXPORT_METHOD(getDocumentAsync:(NSDictionary *)options resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  _resolve = resolve;
  _reject = reject;

  NSString *type = EXConvertMimeTypeToUTI(options[@"type"] ?: @"*/*");

  if (options[@"copyToCacheDirectory"] && [RCTConvert BOOL:options[@"copyToCacheDirectory"]] == NO) {
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
    documentMenuVC.popoverPresentationController.sourceRect = CGRectMake(CGRectGetMidX([RCTPresentedViewController().view frame]), CGRectGetMaxY([RCTPresentedViewController().view frame]), 0, 0);
    documentMenuVC.popoverPresentationController.sourceView = RCTPresentedViewController().view;
    documentMenuVC.modalPresentationStyle = UIModalPresentationPageSheet;
  }

  id<EXUtilitiesInterface> utils = [_bridge.scopedModules.moduleRegistry getModuleImplementingProtocol:@protocol(EXUtilitiesInterface)];
  [utils.currentViewController presentViewController:documentMenuVC animated:YES completion:nil];
}

- (void)documentMenu:(UIDocumentMenuViewController *)documentMenu didPickDocumentPicker:(UIDocumentPickerViewController *)documentPicker
{
  documentPicker.delegate = self;
  id<EXUtilitiesInterface> utils = [_bridge.scopedModules.moduleRegistry getModuleImplementingProtocol:@protocol(EXUtilitiesInterface)];
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
    id<EXFileSystemInterface> fileSystem = [_bridge.scopedModules.moduleRegistry getModuleImplementingProtocol:@protocol(EXFileSystemInterface)];
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

