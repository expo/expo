#import "EXImagePicker.h"

#import <React/RCTConvert.h>
#import <React/RCTUtils.h>
#import <AssetsLibrary/AssetsLibrary.h>

#import "EXFileSystem.h"

@import MobileCoreServices;
@import Photos;

@interface EXImagePicker ()

@property (nonatomic, strong) UIAlertController *alertController;
@property (nonatomic, strong) UIImagePickerController *picker;
@property (nonatomic, strong) RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) RCTPromiseRejectBlock reject;
@property (nonatomic, strong) NSDictionary *defaultOptions;
@property (nonatomic, retain) NSMutableDictionary *options;
@property (nonatomic, strong) NSDictionary *customButtons;

@end

@implementation EXImagePicker

RCT_EXPORT_MODULE(ExponentImagePicker);

@synthesize bridge = _bridge;

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
}

- (instancetype)init
{
  if (self = [super init]) {
    self.defaultOptions = @{
      @"title": @"Select a Photo",
      @"cancelButtonTitle": @"Cancel",
      @"takePhotoButtonTitle": @"Take Photo…",
      @"chooseFromLibraryButtonTitle": @"Choose from Library…",
      @"quality" : @0.2, // 1.0 best to 0.0 worst
      @"allowsEditing" : @NO,
      @"base64": @NO,
    };
  }
  return self;
}

RCT_EXPORT_METHOD(launchCameraAsync:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  self.resolve = resolve;
  self.reject = reject;
  [self launchImagePicker:RNImagePickerTargetCamera options:options];
}

RCT_EXPORT_METHOD(launchImageLibraryAsync:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  self.resolve = resolve;
  self.reject = reject;
  [self launchImagePicker:RNImagePickerTargetLibrarySingleImage options:options];
}

- (void)launchImagePicker:(RNImagePickerTarget)target options:(NSDictionary *)options
{
  self.options = [NSMutableDictionary dictionaryWithDictionary:self.defaultOptions]; // Set default options
  for (NSString *key in options.keyEnumerator) { // Replace default options
    [self.options setValue:options[key] forKey:key];
  }
  [self launchImagePicker:target];
}

- (void)launchImagePicker:(RNImagePickerTarget)target
{
  self.picker = [[UIImagePickerController alloc] init];

  if (target == RNImagePickerTargetCamera) {
#if TARGET_IPHONE_SIMULATOR
    self.reject(RCTErrorUnspecified, @"Camera not available on simulator", nil);
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

  self.picker.mediaTypes = @[(NSString *)kUTTypeImage, (NSString*) kUTTypeMovie];

  if ([[self.options objectForKey:@"allowsEditing"] boolValue]) {
    self.picker.allowsEditing = true;
  }
  self.picker.modalPresentationStyle = UIModalPresentationCurrentContext;
  self.picker.delegate = self;

  dispatch_async(dispatch_get_main_queue(), ^{
    UIViewController *root = [[[[UIApplication sharedApplication] delegate] window] rootViewController];
    while (root.presentedViewController != nil) {
      root = root.presentedViewController;
    }
    [root presentViewController:self.picker animated:YES completion:nil];
  });
}

- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary *)info
{
  dispatch_block_t dismissCompletionBlock = ^{
    NSString *mediaType = [info objectForKey:UIImagePickerControllerMediaType];
    NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
    response[@"cancelled"] = @NO;
    NSString *directory = [self.bridge.scopedModules.fileSystem.cachesDirectory stringByAppendingPathComponent:@"ImagePicker"];
    [EXFileSystem ensureDirExistsWithPath:directory];
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
  NSData *data = UIImageJPEGRepresentation(image, [[self.options valueForKey:@"quality"] floatValue]);
  NSString *fileName = [[[NSUUID UUID] UUIDString] stringByAppendingString:@".jpg"];
  NSString *path = [directory stringByAppendingPathComponent:fileName];
  [data writeToFile:path atomically:YES];
  NSURL *fileURL = [NSURL fileURLWithPath:path];
  NSString *filePath = [fileURL absoluteString];
  response[@"uri"] = filePath;
  
  if ([[self.options objectForKey:@"base64"] boolValue]) {
    response[@"base64"] = [data base64EncodedStringWithOptions:0];
  }
  if ([[self.options objectForKey:@"exif"] boolValue]) {
    // Can easily get metadata only if from camera, else go through `PHAsset`
    NSDictionary *metadata = [info objectForKey:UIImagePickerControllerMediaMetadata];
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
        RCTLogInfo(@"Could not fetch metadata for image %@", [imageURL absoluteString]);
        completionHandler();
      }
    }
  } else {
    completionHandler();
  }
}

- (void)handleVideoWithInfo:(NSDictionary * _Nonnull)info saveAt:(NSString *)directory updateResponse:(NSMutableDictionary *)response
{
  NSURL *videoURL = info[UIImagePickerControllerMediaURL];
  PHFetchResult<PHAsset *> *assets = [PHAsset fetchAssetsWithALAssetURLs:@[[info valueForKey:UIImagePickerControllerReferenceURL]] options:nil];
  if (assets.count > 0) {
    PHAsset *videoAsset = assets.firstObject;
    response[@"width"] = @(videoAsset.pixelWidth);
    response[@"height"] = @(videoAsset.pixelHeight);
    response[@"duration"] = @(videoAsset.duration * 1000);
  } else {
    RCTLogInfo(@"Could not fetch metadata for video %@", [videoURL absoluteString]);
  }
  
  if (([[self.options objectForKey:@"allowsEditing"] boolValue])) {
    AVURLAsset *editedAsset = [AVURLAsset assetWithURL:videoURL];
    CMTime duration = [editedAsset duration];
    response[@"duration"] = @((float) duration.value / duration.timescale * 1000);
  }
  
  response[@"type"] = @"video";
  NSString *fileName = [[[NSUUID UUID] UUIDString] stringByAppendingString:@".mov"];
  NSError *error = nil;
  NSString *path = [directory stringByAppendingPathComponent:fileName];
  [[NSFileManager defaultManager] moveItemAtURL:videoURL
                                          toURL:[NSURL fileURLWithPath:path]
                                          error:&error];
  if (error != nil) {
    self.reject(@"E_CANNOT_PICK_VIDEO", @"Video could not be picked", error);
    return;
  }
  
  NSURL *fileURL = [NSURL fileURLWithPath:path];
  NSString *filePath = [fileURL absoluteString];
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

  [response setObject:exif forKey:@"exif"];
}

- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [picker dismissViewControllerAnimated:YES completion:^{
      self.resolve(@{@"cancelled": @YES});
    }];
  });
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

@end
