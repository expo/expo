// Copyright 2018-present 650 Industries. All rights reserved.


#import <EXDocumentPicker/EXDocumentPickerModule.h>
#import <ExpoModulesCore/EXUtilitiesInterface.h>
#import <ExpoModulesCore/EXFileSystemInterface.h>

#import <UIKit/UIKit.h>
#import <MobileCoreServices/MobileCoreServices.h>

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 140000
  #import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>
#endif


#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 140000
  API_AVAILABLE(ios(14.0))
  static UTType* EXConvertMimeTypeToUTType(NSString *mimeType)
  {
    // UTType#typeWithMIMEType doesn't work with wildcard mimetypes
    // so support common top level types with wildcards here.
    if ([mimeType isEqualToString:@"*/*"]) {
      return UTTypeItem;
    } else if ([mimeType isEqualToString:@"image/*"]) {
      return UTTypeImage;
    } else if ([mimeType isEqualToString:@"video/*"]) {
      return UTTypeMovie;
    } else if ([mimeType isEqualToString:@"audio/*"]) {
      return UTTypeAudio;
    } else if ([mimeType isEqualToString:@"text/*"]) {
      return UTTypeText;
    } else {
      return [UTType typeWithMIMEType:mimeType];
    }
  }
#endif

// Deprecated in iOS 14
static NSString * EXConvertMimeTypeToUTI(NSString *mimeType)
{
  CFStringRef uti;

  // UTTypeCreatePreferredIdentifierForTag doesn't work with wildcard mimetypes
  // so support common top level types with wildcards here.
  if ([mimeType isEqualToString:@"*/*"]) {
    uti = kUTTypeItem;
  } else if ([mimeType isEqualToString:@"image/*"]) {
    uti = kUTTypeImage;
  } else if ([mimeType isEqualToString:@"video/*"]) {
    uti = kUTTypeMovie;
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

@interface EXDocumentPickerModule () <UIDocumentPickerDelegate, UIAdaptivePresentationControllerDelegate>

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXFileSystemInterface> fileSystem;
@property (nonatomic, weak) id<EXUtilitiesInterface> utilities;

@property (nonatomic, strong) EXPromiseResolveBlock resolve;
@property (nonatomic, strong) EXPromiseRejectBlock reject;

@property (nonatomic, assign) BOOL shouldCopyToCacheDirectory;

@end

@implementation EXDocumentPickerModule

EX_EXPORT_MODULE(ExpoDocumentPicker);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;

  if (_moduleRegistry != nil) {
    _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(EXFileSystemInterface)];
    _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(EXUtilitiesInterface)];
  }
}

EX_EXPORT_METHOD_AS(getDocumentAsync,
                    options:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if (_resolve != nil) {
    return reject(@"E_DOCUMENT_PICKER", @"Different document picking in progress. Await other document picking first.", nil);
  }
  _resolve = resolve;
  _reject = reject;

  NSArray *mimeTypes = options[@"type"] ?: @[@"*/*"];
  if (mimeTypes.count == 0) {
    reject(@"E_DOCUMENT_PICKER", @"type must be a list of strings.", nil);
    _resolve = nil;
    _reject = nil;
    return;
  }
  _shouldCopyToCacheDirectory = options[@"copyToCacheDirectory"] && [options[@"copyToCacheDirectory"] boolValue] == YES;

  EX_WEAKIFY(self);

  dispatch_async(dispatch_get_main_queue(), ^{
    EX_ENSURE_STRONGIFY(self);
    UIDocumentPickerViewController *documentPickerVC;

    @try {
      // TODO: drop #if macro once Xcode is updated to 12
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 140000
      if (@available(iOS 14, *)) {
        NSMutableArray *utTypes = [mimeTypes mutableCopy];
        for (int i = 0; i < [mimeTypes count]; i++) {
          utTypes[i] = (NSString *)EXConvertMimeTypeToUTType(mimeTypes[i]);
        }
        documentPickerVC = [[UIDocumentPickerViewController alloc] initForOpeningContentTypes:utTypes asCopy:true];
      } else {
#endif
        NSMutableArray *utiTypes = [mimeTypes mutableCopy];
        for (int i = 0; i < [mimeTypes count]; i++) {
          utiTypes[i] = (NSString *)EXConvertMimeTypeToUTI(mimeTypes[i]);
        }
        documentPickerVC = [[UIDocumentPickerViewController alloc] initWithDocumentTypes:utiTypes
                                                                                  inMode:UIDocumentPickerModeImport];
        // TODO: drop #if macro once Xcode is updated to 12
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 140000
      }
#endif
    }
    @catch (NSException *exception) {
      reject(@"E_PICKER_ICLOUD", @"DocumentPicker requires the iCloud entitlement. If you are using ExpoKit, you need to add this capability to your App Id. See `https://docs.expo.dev/versions/latest/expokit/advanced-expokit-topics#using-documentpicker` for more info.", nil);
      self->_resolve = nil;
      self->_reject = nil;
      return;
    }
    documentPickerVC.delegate = self;
    documentPickerVC.presentationController.delegate = self;

    // Because of the way IPad works with Actionsheets such as this one, we need to provide a source view and set it's position.
    if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
      documentPickerVC.popoverPresentationController.sourceRect = CGRectMake(CGRectGetMidX([self->_utilities.currentViewController.view frame]), CGRectGetMaxY([self->_utilities.currentViewController.view frame]), 0, 0);
      documentPickerVC.popoverPresentationController.sourceView = self->_utilities.currentViewController.view;
      documentPickerVC.modalPresentationStyle = UIModalPresentationPageSheet;
    }

    [self->_utilities.currentViewController presentViewController:documentPickerVC animated:YES completion:nil];
  });
}

- (void)documentPicker:(UIDocumentPickerViewController *)controller didPickDocumentAtURL:(NSURL *)url
{
  NSError *fileSizeError = nil;
  unsigned long long fileSize = [EXDocumentPickerModule getFileSize:[url path] error:&fileSizeError];
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

  NSString *extension = [url pathExtension];
  NSString *mimeType = [EXDocumentPickerModule getMimeType:extension];

  NSMutableDictionary *response = [@{
    @"type": @"success",
    @"uri": [newUrl absoluteString],
    @"name": [url lastPathComponent],
    @"size": @(fileSize)
  } mutableCopy];

  if (mimeType != nil) {
    response[@"mimeType"] = mimeType;
  }

  _resolve(response);

  _resolve = nil;
  _reject = nil;
}

// Document picker view controller has been cancelled with a button
- (void)documentPickerWasCancelled:(UIDocumentPickerViewController *)controller
{
  _resolve(@{@"type": @"cancel"});
  _resolve = nil;
  _reject = nil;
}

// Document picker view controller has been dismissed by gesture
- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
  [self documentPickerWasCancelled:presentationController.presentedViewController];
}

+ (unsigned long long)getFileSize:(NSString *)path error:(NSError **)error
{
  NSDictionary<NSFileAttributeKey, id> *fileAttributes = [[NSFileManager defaultManager] attributesOfItemAtPath:path error:error];
  if (*error) {
    return 0;
  }

  if (fileAttributes.fileType != NSFileTypeDirectory) {
    return fileAttributes.fileSize;
  }

  // The path is pointing to the folder
  NSArray *contents = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:path error:error];
  if (*error) {
    return 0;
  }

  NSEnumerator *contentsEnumurator = [contents objectEnumerator];
  NSString *file;
  unsigned long long folderSize = 0;
  while (file = [contentsEnumurator nextObject]) {
    folderSize += [EXDocumentPickerModule getFileSize:[path stringByAppendingPathComponent:file] error:error];
    if (*error) {
      return 0;
    }
  }

  return folderSize;
}

+ (NSString *)getMimeType:(NSString *)fileExtension{
  NSString *UTI = (__bridge_transfer NSString *)UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, (__bridge CFStringRef)fileExtension, NULL);
  NSString *mimeType = (__bridge_transfer NSString *)UTTypeCopyPreferredTagWithClass((__bridge CFStringRef)UTI, kUTTagClassMIMEType);
  return mimeType;
}

@end
