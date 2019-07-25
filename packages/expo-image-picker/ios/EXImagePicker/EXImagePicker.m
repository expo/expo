#import <EXImagePicker/EXImagePicker.h>

#import <AssetsLibrary/AssetsLibrary.h>

#import <UMFileSystemInterface/UMFileSystemInterface.h>
#import <UMCore/UMUtilitiesInterface.h>
#import <UMPermissionsInterface/UMPermissionsInterface.h>

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
@property (nonatomic, weak) id<UMPermissionsInterface> permissionsModule;
@property (nonatomic, assign) BOOL shouldRestoreStatusBarVisibility;

@end

@implementation EXImagePicker

UM_EXPORT_MODULE(ExponentImagePicker);

- (instancetype)init
{
  if (self = [super init]) {
    self.defaultOptions = @{
                            @"title": @"Select a Photo",
                            @"cancelButtonTitle": @"Cancel",
                            @"takePhotoButtonTitle": @"Take Photo…",
                            @"chooseFromLibraryButtonTitle": @"Choose from Library…",
                            @"allowsEditing" : @NO,
                            @"base64": @NO,
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
  _permissionsModule = [self.moduleRegistry getModuleImplementingProtocol:@protocol(UMPermissionsInterface)];
}

UM_EXPORT_METHOD_AS(launchCameraAsync, launchCameraAsync:(NSDictionary *)options
                  resolver:(UMPromiseResolveBlock)resolve
                  rejecter:(UMPromiseRejectBlock)reject)
{

  BOOL permissionsAreGranted = [self.permissionsModule hasGrantedPermission:@"cameraRoll"] &&
                               [self.permissionsModule hasGrantedPermission:@"camera"];

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
  if (![self.permissionsModule hasGrantedPermission:@"cameraRoll"]) {
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
  self.picker = [[UIImagePickerController alloc] init];

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

  if ([[self.options objectForKey:@"allowsEditing"] boolValue]) {
    self.picker.allowsEditing = true;
  }
  self.picker.modalPresentationStyle = UIModalPresentationOverFullScreen; // only fullscreen styles work well with modals
  self.picker.delegate = self;

  dispatch_async(dispatch_get_main_queue(), ^{
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
    id<UMFileSystemInterface> fileSystem = [self.moduleRegistry getModuleImplementingProtocol:@protocol(UMFileSystemInterface)];
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
      [self handleVideoWithInfo:info saveAt:directory updateResponse:response];
      self.resolve(response);
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
  UIImage *image;
  if ([[self.options objectForKey:@"allowsEditing"] boolValue]) {
    image = [info objectForKey:UIImagePickerControllerEditedImage];
  } else {
    image = [info objectForKey:UIImagePickerControllerOriginalImage];
  }
  image = [self fixOrientation:image];
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

  id<UMFileSystemInterface> fileSystem = [self.moduleRegistry getModuleImplementingProtocol:@protocol(UMFileSystemInterface)];
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
      PHFetchResult<PHAsset *> *assets = [PHAsset fetchAssetsWithALAssetURLs:@[imageURL] options:nil];
      if (assets.count > 0) {
        PHAsset *asset = assets.firstObject;
        PHContentEditingInputRequestOptions *options = [[PHContentEditingInputRequestOptions alloc] init];
        options.networkAccessAllowed = YES; // Download from iCloud if needed
        [asset requestContentEditingInputWithOptions:options completionHandler:^(PHContentEditingInput *input, NSDictionary *info) {
          NSDictionary *metadata = [CIImage imageWithContentsOfURL:input.fullSizeImageURL].properties;
          [self updateResponse:response withMetadata:metadata];
          completionHandler();
        }];
      } else {
        UMLogInfo(@"Could not fetch metadata for image %@", [imageURL absoluteString]);
        completionHandler();
      }
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

- (void)handleVideoWithInfo:(NSDictionary * _Nonnull)info saveAt:(NSString *)directory updateResponse:(NSMutableDictionary *)response
{
  NSURL *videoURL = info[UIImagePickerControllerMediaURL];
  if (info[UIImagePickerControllerReferenceURL]) { // video from gallery
    PHFetchResult<PHAsset *> *assets = [PHAsset fetchAssetsWithALAssetURLs:@[[info valueForKey:UIImagePickerControllerReferenceURL]] options:nil];
    if (assets.count > 0) {
      PHAsset *videoAsset = assets.firstObject;
      response[@"width"] = @(videoAsset.pixelWidth);
      response[@"height"] = @(videoAsset.pixelHeight);
      response[@"duration"] = @(videoAsset.duration * 1000);
    } else {
      UMLogInfo(@"Could not fetch metadata for video %@", [videoURL absoluteString]);
    }
  }
  if (([[self.options objectForKey:@"allowsEditing"] boolValue])) {
    AVURLAsset *editedAsset = [AVURLAsset assetWithURL:videoURL];
    CMTime duration = [editedAsset duration];
    response[@"duration"] = @((float) duration.value / duration.timescale * 1000);
  }

  response[@"type"] = @"video";
  NSError *error = nil;
  id<UMFileSystemInterface> fileSystem = [self.moduleRegistry getModuleImplementingProtocol:@protocol(UMFileSystemInterface)];
  if (!fileSystem) {
    self.reject(@"E_NO_MODULE", @"No FileSystem module.", nil);
    return;
  }
  NSString *path = [fileSystem generatePathInDirectory:directory withExtension:@".mov"];
  [[NSFileManager defaultManager] moveItemAtURL:videoURL
                                          toURL:[NSURL fileURLWithPath:path]
                                          error:&error];
  if (error != nil) {
    self.reject(@"E_CANNOT_PICK_VIDEO", @"Video could not be picked", error);
    return;
  }

  NSURL *fileURL = [NSURL fileURLWithPath:path];
  NSString *filePath = [fileURL absoluteString];
  
  // adding data to response if video came from camera
  if (!info[UIImagePickerControllerReferenceURL]) {
    AVURLAsset *asset = [[AVURLAsset alloc] initWithURL:fileURL options:nil];
    CGSize size = [[[asset tracksWithMediaType:AVMediaTypeVideo] objectAtIndex:0] naturalSize];
    response[@"width"] = @(size.width);
    response[@"height"] = @(size.height);
    if (!response[@"duration"]) {
      CMTime duration = [asset duration];
      response[@"duration"] = @(ceil((float) duration.value / duration.timescale * 1000));
    }
  }
  response[@"uri"] = filePath;
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

@end
