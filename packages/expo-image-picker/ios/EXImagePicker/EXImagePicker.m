#import <EXImagePicker/EXImagePicker.h>
#import <EXImagePicker/EXImagePickerCameraPermissionRequester.h>
#import <EXImagePicker/EXImagePickerMediaLibraryPermissionRequester.h>
#import <EXImagePicker/EXImagePickerMediaLibraryWriteOnlyPermissionRequester.h>

#import <ExpoModulesCore/EXFileSystemInterface.h>
#import <UMCore/UMUtilitiesInterface.h>
#import <ExpoModulesCore/EXPermissionsInterface.h>
#import <ExpoModulesCore/EXPermissionsMethodsDelegate.h>

@import MobileCoreServices;
@import Photos;

// 1.0 best to 0.0 worst
const CGFloat EXDefaultImageQuality = 0.2;

@interface EXImagePicker ()

@property (nonatomic, strong) UIAlertController *alertController;
@property (nonatomic, strong) UIImagePickerController *picker;
@property (nonatomic, strong) UMPromiseResolveBlock resolve;
@property (nonatomic, strong) UMPromiseRejectBlock reject;
@property (nonatomic, weak) id kernelPermissionsServiceDelegate;
@property (nonatomic, strong) NSDictionary *defaultOptions;
@property (nonatomic, retain) NSMutableDictionary *options;
@property (nonatomic, strong) NSDictionary *customButtons;
@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXPermissionsInterface> permissionsManager;
@property (nonatomic, assign) BOOL shouldRestoreStatusBarVisibility;
@property (nonatomic, weak) UIScrollView *imageScrollView;

@end

@implementation EXImagePicker

UM_EXPORT_MODULE(ExponentImagePicker);

- (instancetype)init
{
  if (self = [super init]) {
    self.defaultOptions = @{
                            @"allowsEditing": @NO,
                            @"base64": @NO,
                            @"videoMaxDuration": @0,
                            @"videoQuality": @0
                            };
    self.shouldRestoreStatusBarVisibility = NO;
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _permissionsManager = [self.moduleRegistry getModuleImplementingProtocol:@protocol(EXPermissionsInterface)];
  [EXPermissionsMethodsDelegate registerRequesters:@[
                                                    [EXImagePickerCameraPermissionRequester new],
                                                    [EXImagePickerMediaLibraryPermissionRequester new],
                                                    [EXImagePickerMediaLibraryWriteOnlyPermissionRequester new]
                                                    ]
                           withPermissionsManager:_permissionsManager];
}

- (id)requesterClass:(BOOL)writeOnly
{
  if (writeOnly) {
    return [EXImagePickerMediaLibraryWriteOnlyPermissionRequester class];
  } else {
    return [EXImagePickerMediaLibraryPermissionRequester class];
  }
}

UM_EXPORT_METHOD_AS(getCameraPermissionsAsync,
                    getCameraPermissionsAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[EXImagePickerCameraPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

UM_EXPORT_METHOD_AS(getMediaLibraryPermissionsAsync,
                    getPermissionsAsync:(BOOL)writeOnly
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[self requesterClass:writeOnly]
                                                            resolve:resolve
                                                             reject:reject];
}

UM_EXPORT_METHOD_AS(requestCameraPermissionsAsync,
                    requestCameraPermissionsAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[EXImagePickerCameraPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

UM_EXPORT_METHOD_AS(requestMediaLibraryPermissionsAsync,
                    requestCameraRollPermissionsAsync:(BOOL)writeOnly
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[self requesterClass:writeOnly]
                                                               resolve:resolve
                                                                reject:reject];
}

UM_EXPORT_METHOD_AS(launchCameraAsync, launchCameraAsync:(NSDictionary *)options
                  resolver:(UMPromiseResolveBlock)resolve
                  rejecter:(UMPromiseRejectBlock)reject)
{
  if (!_permissionsManager) {
    return reject(@"E_NO_PERMISSIONS", @"Permissions module not found. Are you sure that Expo modules are properly linked?", nil);
  }
  BOOL permissionsAreGranted = [self hasCameraRollPermission] &&
                               [self.permissionsManager hasGrantedPermissionUsingRequesterClass:[EXImagePickerCameraPermissionRequester class]];

  if (!permissionsAreGranted) {
    reject(@"E_MISSING_PERMISSION", @"Missing camera or camera roll permission.", nil);
    return;
  }
  self.resolve = resolve;
  self.reject = reject;
  [self launchImagePicker:EXImagePickerTargetCamera options:options];
}

UM_EXPORT_METHOD_AS(launchImageLibraryAsync, launchImageLibraryAsync:(NSDictionary *)options
                  resolver:(UMPromiseResolveBlock)resolve
                  rejecter:(UMPromiseRejectBlock)reject)
{
  if (!_permissionsManager) {
    return reject(@"E_NO_PERMISSIONS", @"Permissions module not found. Are you sure that Expo modules are properly linked?", nil);
  }
  if (![self hasCameraRollPermission]) {
    reject(@"E_MISSING_PERMISSION", @"Missing camera roll permission.", nil);
    return;
  }
  self.resolve = resolve;
  self.reject = reject;
  [self launchImagePicker:EXImagePickerTargetLibrarySingleImage options:options];
}

- (void)launchImagePicker:(EXImagePickerTarget)target options:(NSDictionary *)options
{
  self.options = [NSMutableDictionary dictionaryWithDictionary:self.defaultOptions]; // Set default options
  for (NSString *key in options.keyEnumerator) { // Replace default options
    [self.options setValue:options[key] forKey:key];
  }
  [self launchImagePicker:target];
}

- (void)launchImagePicker:(EXImagePickerTarget)target
{
  dispatch_async(dispatch_get_main_queue(), ^{
    self.picker = [UIImagePickerController new];

    if (target == EXImagePickerTargetCamera) {
  #if TARGET_IPHONE_SIMULATOR
      self.reject(@"CAMERA_MISSING", @"Camera not available on simulator", nil);
      return;
  #else
      self.picker.sourceType = UIImagePickerControllerSourceTypeCamera;
      if ([[self.options objectForKey:@"cameraType"] isEqualToString:@"front"]) {
        self.picker.cameraDevice = UIImagePickerControllerCameraDeviceFront;
      } else { // "back"
        self.picker.cameraDevice = UIImagePickerControllerCameraDeviceRear;
      }
  #endif
    } else { // RNImagePickerTargetLibrarySingleImage
      self.picker.sourceType = UIImagePickerControllerSourceTypePhotoLibrary;
    }

    self.picker.mediaTypes = [self convertMediaTypes:self.options[@"mediaTypes"]];
    
    if (@available(iOS 11.0, *)) {
      self.picker.videoExportPreset = [self importVideoExportPreset:self.options[@"videoExportPreset"]];
    }
      
    NSNumber* videoQuality = [self.options valueForKey:@"videoQuality"];
    self.picker.videoQuality = [videoQuality intValue];

    NSTimeInterval videoMaxDuration = [[self.options objectForKey:@"videoMaxDuration"] doubleValue];
    
    if ([[self.options objectForKey:@"allowsEditing"] boolValue]) {
      self.picker.allowsEditing = true;
      
      if (videoMaxDuration > 600.0) {
        self.reject(@"ERR_IMAGE_PICKER_MAX_DURATION", @"'videoMaxDuration' limits to 600 when 'allowsEditing=true'", nil);
        return;
      }
      
      // iOS has system-enforced duration limit for edited videos
      if (videoMaxDuration == 0.0) {
        videoMaxDuration = 600.0;
      }
    }
    
    self.picker.videoMaximumDuration = videoMaxDuration;
    
    self.picker.modalPresentationStyle = UIModalPresentationPageSheet;
    self.picker.delegate = self;

    [self maybePreserveVisibilityAndHideStatusBar:[[self.options objectForKey:@"allowsEditing"] boolValue]];
    id<UMUtilitiesInterface> utils = [self.moduleRegistry getModuleImplementingProtocol:@protocol(UMUtilitiesInterface)];
    [utils.currentViewController presentViewController:self.picker animated:YES completion:nil];
  });
}

- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary *)info
{
  dispatch_block_t dismissCompletionBlock = ^{
    [self maybeRestoreStatusBarVisibility];
    NSString *mediaType = [info objectForKey:UIImagePickerControllerMediaType];
    NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
    response[@"cancelled"] = @NO;
    id<EXFileSystemInterface> fileSystem = [self.moduleRegistry getModuleImplementingProtocol:@protocol(EXFileSystemInterface)];
    if (!fileSystem) {
      self.reject(@"E_MISSING_MODULE", @"No FileSystem module", nil);
      return;
    }
    NSString *directory = [fileSystem.cachesDirectory stringByAppendingPathComponent:@"ImagePicker"];
    if ([mediaType isEqualToString:(NSString *)kUTTypeImage]) {
      [self handleImageWithInfo:info saveAt:directory updateResponse:response completionHandler:^{
        self.resolve(response);
      }];
    } else if ([mediaType isEqualToString:(NSString *)kUTTypeMovie]) {
      [self handleVideoWithInfo:info saveAt:directory updateResponse:response completionHandler:^{
        self.resolve(response);
      }];
    }
  };
  dispatch_async(dispatch_get_main_queue(), ^{
    [picker dismissViewControllerAnimated:YES completion:dismissCompletionBlock];
  });
}

- (void)handleImageWithInfo:(NSDictionary * _Nonnull)info
                     saveAt:(NSString *)directory
             updateResponse:(NSMutableDictionary *)response
          completionHandler:(void (^)(void))completionHandler
{
  NSURL *imageURL = [info valueForKey:UIImagePickerControllerReferenceURL];
  NSDictionary *metadata = [info objectForKey:UIImagePickerControllerMediaMetadata];
  UIImage *image = [info objectForKey:UIImagePickerControllerOriginalImage];
  image = [self fixOrientation:image];
  if ([[self.options objectForKey:@"allowsEditing"] boolValue]) {
    CGRect rect = ((NSValue *) [info objectForKey:UIImagePickerControllerCropRect]).CGRectValue;
      
    CGImageRef imageRef = CGImageCreateWithImageInRect(image.CGImage, rect);
    image = [UIImage imageWithCGImage:imageRef
                                scale:image.scale
                          orientation:image.imageOrientation];
    CGImageRelease(imageRef);
  }
  response[@"type"] = @"image";
  response[@"width"] = @(image.size.width);
  response[@"height"] = @(image.size.height);

  NSString *extension = @".jpg";

  NSNumber *quality = [self.options valueForKey:@"quality"];
  NSData *data = UIImageJPEGRepresentation(image, quality == nil ? EXDefaultImageQuality : [quality floatValue]);

  if ([[imageURL absoluteString] containsString:@"ext=PNG"]) {
    extension = @".png";
    data = UIImagePNGRepresentation(image);
  } else if ([[imageURL absoluteString] containsString:@"ext=BMP"]) {
      if (([[self.options objectForKey:@"allowsEditing"] boolValue]) || (quality != nil)){
        //switch to png if editing.
        extension = @".png";
        data = UIImagePNGRepresentation(image);
      } else {
        extension = @".bmp";
        data = nil;
      }
  } else if ([[imageURL absoluteString] containsString:@"ext=GIF"]) {
    extension = @".gif";
    data = [NSMutableData data];
    CGImageDestinationRef imageDestination = CGImageDestinationCreateWithData((__bridge CFMutableDataRef)data, kUTTypeGIF, 1, NULL);
    if (imageDestination == NULL) {
      self.reject(@"E_CONV_ERR", @"Failed to create image destination for GIF export.", nil);
      return;
    }

    NSMutableDictionary *mutableMetadata = [NSMutableDictionary dictionaryWithDictionary:metadata];
    if (quality) {
      mutableMetadata[(__bridge NSString *)kCGImageDestinationLossyCompressionQuality] = quality;
    }
    CGImageDestinationAddImage(imageDestination, image.CGImage, (__bridge CFDictionaryRef)mutableMetadata);
    if (!CGImageDestinationFinalize(imageDestination)) {
      self.reject(@"E_CONV_ERR", @"Failed to export requested GIF.", nil);
      return;
    }
    CFRelease(imageDestination);
  }

  id<EXFileSystemInterface> fileSystem = [self.moduleRegistry getModuleImplementingProtocol:@protocol(EXFileSystemInterface)];
  if (!fileSystem) {
    self.reject(@"E_NO_MODULE", @"No FileSystem module.", nil);
    return;
  }

  NSString *path = [fileSystem generatePathInDirectory:directory withExtension:extension];
  NSURL *fileURL = [NSURL fileURLWithPath:path];

  BOOL fileCopied = false;
  if (![[self.options objectForKey:@"allowsEditing"] boolValue] && quality == nil) {
    // No modification requested
    fileCopied = [self tryCopyImage:info path:path];
  }
  if (!fileCopied) {
    [data writeToFile:path atomically:YES];
  }

  NSString *filePath = [fileURL absoluteString];
  response[@"uri"] = filePath;

  if ([[self.options objectForKey:@"base64"] boolValue]) {
    if (@available(iOS 11.0, *)) {
      if (fileCopied) {
        data = [NSData dataWithContentsOfFile:path];
      }
    }
    response[@"base64"] = [data base64EncodedStringWithOptions:0];
  }
  if ([[self.options objectForKey:@"exif"] boolValue]) {
    // Can easily get metadata only if from camera, else go through `PHAsset`
    if (metadata) {
      [self updateResponse:response withMetadata:metadata];
      completionHandler();
    } else {
      PHAsset *asset;
      if (@available(iOS 11.0, *)) {
        asset = [info objectForKey:UIImagePickerControllerPHAsset];
      } else {
        PHFetchResult<PHAsset *> *assets = [PHAsset fetchAssetsWithALAssetURLs:@[imageURL] options:nil];
        if (assets.count > 0) {
          asset = assets.firstObject;
        }
      }
      if (!asset) {
        UMLogInfo(@"Could not fetch metadata for image %@", [imageURL absoluteString]);
        completionHandler();
      }
      
      PHContentEditingInputRequestOptions *options = [[PHContentEditingInputRequestOptions alloc] init];
      options.networkAccessAllowed = YES; // Download from iCloud if needed
      UM_WEAKIFY(self)
      [asset requestContentEditingInputWithOptions:options completionHandler:^(PHContentEditingInput *input, NSDictionary *info) {
        UM_ENSURE_STRONGIFY(self)
        NSDictionary *metadata = [CIImage imageWithContentsOfURL:input.fullSizeImageURL].properties;
        [self updateResponse:response withMetadata:metadata];
        completionHandler();
      }];
    }
  } else {
    completionHandler();
  }
}

- (BOOL)tryCopyImage:(NSDictionary * _Nonnull)info path:(NSString *)toPath {
  if (@available(iOS 11.0, *)) {
    NSError *error = nil;
    NSString *fromPath = [[info objectForKey:UIImagePickerControllerImageURL] path];
    if (fromPath == nil) {
      return false;
    }
    [[NSFileManager defaultManager] copyItemAtPath:fromPath
                                            toPath:toPath
                                             error:&error];
    if (error == nil) {
      return true;
    }
  }

  // Try to save recompressed image if saving the original one failed
  return false;
}

- (void)handleVideoWithInfo:(NSDictionary * _Nonnull)info
                     saveAt:(NSString *)directory
             updateResponse:(NSMutableDictionary *)response
          completionHandler:(void (^)(void))completionHandler
{
  NSURL *videoURL = info[UIImagePickerControllerMediaURL] ?: info[UIImagePickerControllerReferenceURL];
  if (videoURL == nil) {
    // not calling completionHandler here, as it's only purpose is to resolve the promise and we rejected it right here
    self.reject(@"E_COULDNT_OPEN_FILE", @"Couldn't open video", nil);
    return;
  }
  if (([[self.options objectForKey:@"allowsEditing"] boolValue])) {
    AVURLAsset *editedAsset = [AVURLAsset assetWithURL:videoURL];
    CMTime duration = [editedAsset duration];
    response[@"duration"] = @((float) duration.value / duration.timescale * 1000);
  }

  response[@"type"] = @"video";
  NSError *error = nil;
  id<EXFileSystemInterface> fileSystem = [self.moduleRegistry getModuleImplementingProtocol:@protocol(EXFileSystemInterface)];
  if (!fileSystem) {
    self.reject(@"E_NO_MODULE", @"No FileSystem module.", nil);
    return;
  }
  NSString *path = [fileSystem generatePathInDirectory:directory withExtension:@".mov"];

  // We copy the file as `moveItemAtURL:toURL:error` started throwing an error in iOS 13 due to missing permissions :O
  [[NSFileManager defaultManager] copyItemAtURL:videoURL
                                          toURL:[NSURL fileURLWithPath:path]
                                          error:&error];
  if (error != nil) {
    self.reject(@"E_CANNOT_PICK_VIDEO", @"Video could not be picked", error);
    return;
  }

  NSURL *fileURL = [NSURL fileURLWithPath:path];
  NSString *filePath = [fileURL absoluteString];
  
  // adding information about asset
  AVURLAsset *asset = [AVURLAsset URLAssetWithURL:fileURL options:nil];
  CGSize size = [[[asset tracksWithMediaType:AVMediaTypeVideo] objectAtIndex:0] naturalSize];
  response[@"width"] = @(size.width);
  response[@"height"] = @(size.height);
  if (!response[@"duration"]) {
    CMTime duration = [asset duration];
    response[@"duration"] = @(ceil((float) duration.value / duration.timescale * 1000));
  }

  response[@"uri"] = filePath;
  
  completionHandler();
}

- (void)updateResponse:(NSMutableDictionary *)response withMetadata:(NSDictionary *)metadata
{
  NSMutableDictionary *exif = [NSMutableDictionary dictionaryWithDictionary:metadata[(NSString *)kCGImagePropertyExifDictionary]];

  // Copy `["{GPS}"]["<tag>"]` to `["GPS<tag>"]`
  NSDictionary *gps = metadata[(NSString *)kCGImagePropertyGPSDictionary];
  if (gps) {
    for (NSString *gpsKey in gps) {
      exif[[@"GPS" stringByAppendingString:gpsKey]] = gps[gpsKey];
    }
  }

  // Inject orientation into exif
  if ([metadata valueForKey:(NSString *)kCGImagePropertyOrientation] != nil) {
    exif[(NSString *)kCGImagePropertyOrientation] = metadata[(NSString *)kCGImagePropertyOrientation];
  }

  [response setObject:exif forKey:@"exif"];
}

- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [picker dismissViewControllerAnimated:YES completion:^{
      [self maybeRestoreStatusBarVisibility];
      self.resolve(@{@"cancelled": @YES});
    }];
  });
}

- (void)maybePreserveVisibilityAndHideStatusBar:(BOOL)editingEnabled
{
  // As of iOS 11, launching ImagePicker with `allowsEditing` option makes cropping rectangle
  // slightly moved upwards, because of StatusBar visibility.
  // Hiding StatusBar during picking process solves the displacement issue.
  // See https://forums.developer.apple.com/thread/98274
  if (editingEnabled && ![[UIApplication sharedApplication] isStatusBarHidden]) {
    // Calling -[UIApplication setStatusBarHidden:withAnimation:] triggers a warning
    // that should be suppressable with -Wdeprecated-declarations, but is not.
    // The warning suggests to use -[UIViewController prefersStatusBarHidden].
    // Unfortunately until we stop presenting view controllers on detached VCs
    // the setting doesn't have any effect and we need to set status bar like that.
    SEL setStatusBarSelector = NSSelectorFromString(@"setStatusBarHidden:withAnimation:");
    UIApplication *sharedApplication = [UIApplication sharedApplication];
    ((void (*)(id, SEL, BOOL, BOOL))[sharedApplication methodForSelector:setStatusBarSelector])(sharedApplication, setStatusBarSelector, YES, NO);
    _shouldRestoreStatusBarVisibility = YES;
  }
}

- (void)maybeRestoreStatusBarVisibility
{
  if (_shouldRestoreStatusBarVisibility) {
    _shouldRestoreStatusBarVisibility = NO;
    // Calling -[UIApplication setStatusBarHidden:withAnimation:] triggers a warning
    // that should be suppressable with -Wdeprecated-declarations, but is not.
    // The warning suggests to use -[UIViewController prefersStatusBarHidden].
    // Unfortunately until we stop presenting view controllers on detached VCs
    // the setting doesn't have any effect and we need to set status bar like that.
    SEL setStatusBarSelector = NSSelectorFromString(@"setStatusBarHidden:withAnimation:");
    UIApplication *sharedApplication = [UIApplication sharedApplication];
    ((void (*)(id, SEL, BOOL, BOOL))[sharedApplication methodForSelector:setStatusBarSelector])(sharedApplication, setStatusBarSelector, NO, NO);
  }
}

- (UIImage *)fixOrientation:(UIImage *)srcImg {
  if (srcImg.imageOrientation == UIImageOrientationUp) {
    return srcImg;
  }

  CGAffineTransform transform = CGAffineTransformIdentity;
  switch (srcImg.imageOrientation) {
    case UIImageOrientationDown:
    case UIImageOrientationDownMirrored:
      transform = CGAffineTransformTranslate(transform, srcImg.size.width, srcImg.size.height);
      transform = CGAffineTransformRotate(transform, M_PI);
      break;

    case UIImageOrientationLeft:
    case UIImageOrientationLeftMirrored:
      transform = CGAffineTransformTranslate(transform, srcImg.size.width, 0);
      transform = CGAffineTransformRotate(transform, M_PI_2);
      break;

    case UIImageOrientationRight:
    case UIImageOrientationRightMirrored:
      transform = CGAffineTransformTranslate(transform, 0, srcImg.size.height);
      transform = CGAffineTransformRotate(transform, -M_PI_2);
      break;
    case UIImageOrientationUp:
    case UIImageOrientationUpMirrored:
      break;
  }

  switch (srcImg.imageOrientation) {
    case UIImageOrientationUpMirrored:
    case UIImageOrientationDownMirrored:
      transform = CGAffineTransformTranslate(transform, srcImg.size.width, 0);
      transform = CGAffineTransformScale(transform, -1, 1);
      break;

    case UIImageOrientationLeftMirrored:
    case UIImageOrientationRightMirrored:
      transform = CGAffineTransformTranslate(transform, srcImg.size.height, 0);
      transform = CGAffineTransformScale(transform, -1, 1);
      break;
    case UIImageOrientationUp:
    case UIImageOrientationDown:
    case UIImageOrientationLeft:
    case UIImageOrientationRight:
      break;
  }

  CGContextRef ctx = CGBitmapContextCreate(NULL, srcImg.size.width, srcImg.size.height, CGImageGetBitsPerComponent(srcImg.CGImage), 0, CGImageGetColorSpace(srcImg.CGImage), CGImageGetBitmapInfo(srcImg.CGImage));
  CGContextConcatCTM(ctx, transform);
  switch (srcImg.imageOrientation) {
    case UIImageOrientationLeft:
    case UIImageOrientationLeftMirrored:
    case UIImageOrientationRight:
    case UIImageOrientationRightMirrored:
      CGContextDrawImage(ctx, CGRectMake(0,0,srcImg.size.height,srcImg.size.width), srcImg.CGImage);
      break;

    default:
      CGContextDrawImage(ctx, CGRectMake(0,0,srcImg.size.width,srcImg.size.height), srcImg.CGImage);
      break;
  }

  CGImageRef cgimg = CGBitmapContextCreateImage(ctx);
  UIImage *img = [UIImage imageWithCGImage:cgimg];
  CGContextRelease(ctx);
  CGImageRelease(cgimg);
  return img;
}

- (NSArray<NSString *> *)convertMediaTypes:(NSString *)requestedMediaTypes
{
  NSMutableArray *mediaTypes = [[NSMutableArray alloc] init];

  if (requestedMediaTypes != nil) {
    if ([requestedMediaTypes isEqualToString:@"Images"] || [requestedMediaTypes isEqualToString:@"All"]) {
      [mediaTypes addObject:(NSString *)kUTTypeImage];
    }
    if ([requestedMediaTypes isEqualToString:@"Videos"] || [requestedMediaTypes isEqualToString:@"All"]) {
      [mediaTypes addObject:(NSString*) kUTTypeMovie];
    }
  } else {
    [mediaTypes addObject:(NSString *)kUTTypeImage];
  }
  return mediaTypes;
}

- (BOOL)hasCameraRollPermission
{
  // to use UIImagePickerController on iOS 11+, we don't have to have camera Roll permission
  if (@available(iOS 11, *)) {
    return true;
  }
  return [_permissionsManager hasGrantedPermissionUsingRequesterClass:[EXImagePickerMediaLibraryPermissionRequester class]];
}


- (NSString *)importVideoExportPreset:(NSNumber *)preset API_AVAILABLE(ios(11));
{
  static NSDictionary* presetsMap = nil;
  if (!presetsMap) {
    presetsMap = @{
        @0: AVAssetExportPresetPassthrough,
        @1: AVAssetExportPresetLowQuality,
        @2: AVAssetExportPresetMediumQuality,
        @3: AVAssetExportPresetHighestQuality,
        @4: AVAssetExportPreset640x480,
        @5: AVAssetExportPreset960x540,
        @6: AVAssetExportPreset1280x720,
        @7: AVAssetExportPreset1920x1080,
        @8: AVAssetExportPreset3840x2160,
        @9: AVAssetExportPresetHEVC1920x1080,
        @10: AVAssetExportPresetHEVC3840x2160
    };
  }
  
  return presetsMap[preset] ?: AVAssetExportPresetPassthrough;
}

@end
