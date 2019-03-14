// Copyright 2018-present 650 Industries. All rights reserved.


#import <EXDocumentPicker/EXDocumentPickerModule.h>
#import <UMCore/UMUtilitiesInterface.h>
#import <UMFileSystemInterface/UMFileSystemInterface.h>

#import <UIKit/UIKit.h>
#import <MobileCoreServices/MobileCoreServices.h>

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

@interface EXDocumentPickerModule () <UIDocumentMenuDelegate, UIDocumentPickerDelegate>

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<UMFileSystemInterface> fileSystem;
@property (nonatomic, weak) id<UMUtilitiesInterface> utilities;

@property (nonatomic, strong) UMPromiseResolveBlock resolve;
@property (nonatomic, strong) UMPromiseRejectBlock reject;

@property (nonatomic, assign) BOOL shouldCopyToCacheDirectory;

@end

@implementation EXDocumentPickerModule

UM_EXPORT_MODULE(ExpoDocumentPicker);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  
  if (_moduleRegistry != nil) {
    _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(UMFileSystemInterface)];
    _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(UMUtilitiesInterface)];
  }
}

UM_EXPORT_METHOD_AS(getDocumentAsync,
                    options:(NSDictionary *)options
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if (_resolve != nil) {
    return reject(@"E_DOCUMENT_PICKER", @"Different document picking in progress. Await other document picking first.", nil);
  }
  _resolve = resolve;
  _reject = reject;
  
  NSString *type = EXConvertMimeTypeToUTI(options[@"type"] ?: @"*/*");
  
  _shouldCopyToCacheDirectory = options[@"copyToCacheDirectory"] && [options[@"copyToCacheDirectory"] boolValue] == NO ? NO : YES;
  
  UIDocumentMenuViewController *documentMenuVC;
  @try {
    documentMenuVC = [[UIDocumentMenuViewController alloc] initWithDocumentTypes:@[type]
                                                                          inMode:UIDocumentPickerModeImport];
  }
  @catch (NSException *exception) {
    reject(@"E_PICKER_ICLOUD", @"DocumentPicker requires the iCloud entitlement. If you are using ExpoKit, you need to add this capability to your App Id. See `https://docs.expo.io/versions/latest/expokit/advanced-expokit-topics#using-documentpicker` for more info.", nil);
    _resolve = nil;
    _reject = nil;
    return;
  }
  documentMenuVC.delegate = self;
  
  // Because of the way IPad works with Actionsheets such as this one, we need to provide a source view and set it's position.
  if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
    documentMenuVC.popoverPresentationController.sourceRect = CGRectMake(CGRectGetMidX([_utilities.currentViewController.view frame]), CGRectGetMaxY([_utilities.currentViewController.view frame]), 0, 0);
    documentMenuVC.popoverPresentationController.sourceView = _utilities.currentViewController.view;
    documentMenuVC.modalPresentationStyle = UIModalPresentationPageSheet;
  }
  
  [_utilities.currentViewController presentViewController:documentMenuVC animated:YES completion:nil];
}

- (void)documentMenu:(UIDocumentMenuViewController *)documentMenu didPickDocumentPicker:(UIDocumentPickerViewController *)documentPicker
{
  documentPicker.delegate = self;
  [_utilities.currentViewController presentViewController:documentPicker animated:YES completion:nil];
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
    if (!_fileSystem) {
      _reject(@"E_CANNOT_PICK_FILE", @"No FileSystem module.", nil);
      return;
    }
    NSString *directory = [_fileSystem.cachesDirectory stringByAppendingPathComponent:@"DocumentPicker"];
    NSString *extension = [url pathExtension];
    NSString *path = [_fileSystem generatePathInDirectory:directory withExtension:[extension isEqualToString:@""] ? extension : [@"." stringByAppendingString:extension]];
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
