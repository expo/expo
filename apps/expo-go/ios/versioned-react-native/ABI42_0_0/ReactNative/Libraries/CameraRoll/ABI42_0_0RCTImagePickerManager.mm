/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTImagePickerManager.h"

#import <ABI42_0_0FBReactNativeSpec/ABI42_0_0FBReactNativeSpec.h>
#import <MobileCoreServices/UTCoreTypes.h>
#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import <ABI42_0_0React/ABI42_0_0RCTImageStoreManager.h>
#import <ABI42_0_0React/ABI42_0_0RCTRootView.h>
#import <ABI42_0_0React/ABI42_0_0RCTUtils.h>

#import "ABI42_0_0RCTCameraRollPlugins.h"

@interface ABI42_0_0RCTImagePickerController : UIImagePickerController

@property (nonatomic, assign) BOOL unmirrorFrontFacingCamera;

@end

@implementation ABI42_0_0RCTImagePickerController

@end

@interface ABI42_0_0RCTImagePickerManager () <UIImagePickerControllerDelegate, UINavigationControllerDelegate, ABI42_0_0NativeImagePickerIOSSpec>
@end

@implementation ABI42_0_0RCTImagePickerManager
{
  NSMutableArray<UIImagePickerController *> *_pickers;
  NSMutableArray<ABI42_0_0RCTResponseSenderBlock> *_pickerCallbacks;
  NSMutableArray<ABI42_0_0RCTResponseSenderBlock> *_pickerCancelCallbacks;
  NSMutableDictionary<NSString *, NSDictionary<NSString *, id> *> *_pendingVideoInfo;
}

ABI42_0_0RCT_EXPORT_MODULE(ImagePickerIOS);

@synthesize bridge = _bridge;

- (id)init
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(cameraChanged:)
                                                 name:@"AVCaptureDeviceDidStartRunningNotification"
                                               object:nil];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI42_0_0RCT_EXPORT_METHOD(canRecordVideos:(ABI42_0_0RCTResponseSenderBlock)callback)
{
  NSArray<NSString *> *availableMediaTypes = [UIImagePickerController availableMediaTypesForSourceType:UIImagePickerControllerSourceTypeCamera];
  callback(@[@([availableMediaTypes containsObject:(NSString *)kUTTypeMovie])]);
}

ABI42_0_0RCT_EXPORT_METHOD(canUseCamera:(ABI42_0_0RCTResponseSenderBlock)callback)
{
  callback(@[@([UIImagePickerController isSourceTypeAvailable:UIImagePickerControllerSourceTypeCamera])]);
}

ABI42_0_0RCT_EXPORT_METHOD(openCameraDialog:(JS::NativeImagePickerIOS::SpecOpenCameraDialogConfig &)config
                  successCallback:(ABI42_0_0RCTResponseSenderBlock)callback
                  cancelCallback:(ABI42_0_0RCTResponseSenderBlock)cancelCallback)
{
  if (ABI42_0_0RCTRunningInAppExtension()) {
    cancelCallback(@[@"Camera access is unavailable in an app extension"]);
    return;
  }

  ABI42_0_0RCTImagePickerController *imagePicker = [ABI42_0_0RCTImagePickerController new];
  imagePicker.delegate = self;
  imagePicker.sourceType = UIImagePickerControllerSourceTypeCamera;
  NSArray<NSString *> *availableMediaTypes = [UIImagePickerController availableMediaTypesForSourceType:UIImagePickerControllerSourceTypeCamera];
  imagePicker.mediaTypes = availableMediaTypes;
  imagePicker.unmirrorFrontFacingCamera = config.unmirrorFrontFacingCamera() ? YES : NO;

  if (config.videoMode()) {
    imagePicker.cameraCaptureMode = UIImagePickerControllerCameraCaptureModeVideo;
  }

  [self _presentPicker:imagePicker
       successCallback:callback
        cancelCallback:cancelCallback];
}

ABI42_0_0RCT_EXPORT_METHOD(openSelectDialog:(JS::NativeImagePickerIOS::SpecOpenSelectDialogConfig &)config
                  successCallback:(ABI42_0_0RCTResponseSenderBlock)callback
                  cancelCallback:(ABI42_0_0RCTResponseSenderBlock)cancelCallback)
{
  if (ABI42_0_0RCTRunningInAppExtension()) {
    cancelCallback(@[@"Image picker is currently unavailable in an app extension"]);
    return;
  }

  UIImagePickerController *imagePicker = [UIImagePickerController new];
  imagePicker.delegate = self;
  imagePicker.sourceType = UIImagePickerControllerSourceTypePhotoLibrary;

  NSMutableArray<NSString *> *allowedTypes = [NSMutableArray new];
  if (config.showImages()) {
    [allowedTypes addObject:(NSString *)kUTTypeImage];
  }
  if (config.showVideos()) {
    [allowedTypes addObject:(NSString *)kUTTypeMovie];
  }

  imagePicker.mediaTypes = allowedTypes;

  [self _presentPicker:imagePicker
       successCallback:callback
        cancelCallback:cancelCallback];
}

// In iOS 13, the URLs provided when selecting videos from the library are only valid while the
// info object provided by the delegate is retained.
// This method provides a way to clear out all retained pending info objects.
ABI42_0_0RCT_EXPORT_METHOD(clearAllPendingVideos)
{
  [_pendingVideoInfo removeAllObjects];
  _pendingVideoInfo = [NSMutableDictionary new];
}

// In iOS 13, the URLs provided when selecting videos from the library are only valid while the
// info object provided by the delegate is retained.
// This method provides a way to release the info object for a particular file url when the application
// is done with it, for example after the video has been uploaded or copied locally.
ABI42_0_0RCT_EXPORT_METHOD(removePendingVideo:(NSString *)url)
{
  [_pendingVideoInfo removeObjectForKey:url];
}

- (void)imagePickerController:(UIImagePickerController *)picker
didFinishPickingMediaWithInfo:(NSDictionary<NSString *, id> *)info
{
  NSString *mediaType = info[UIImagePickerControllerMediaType];
  BOOL isMovie = [mediaType isEqualToString:(NSString *)kUTTypeMovie];
  NSString *key = isMovie ? UIImagePickerControllerMediaURL : UIImagePickerControllerReferenceURL;
  NSURL *imageURL = info[key];
  UIImage *image = info[UIImagePickerControllerOriginalImage];
  NSNumber *width = 0;
  NSNumber *height = 0;
  if (image) {
    height = @(image.size.height);
    width = @(image.size.width);
  }
  if (imageURL) {
    NSString *imageURLString = imageURL.absoluteString;
    // In iOS 13, video URLs are only valid while info dictionary is retained
    if (@available(iOS 13.0, *)) {
      if (isMovie) {
        _pendingVideoInfo[imageURLString] = info;
      }
    }

    [self _dismissPicker:picker args:@[imageURLString, ABI42_0_0RCTNullIfNil(height), ABI42_0_0RCTNullIfNil(width)]];
    return;
  }

  // This is a newly taken image, and doesn't have a URL yet.
  // We need to save it to the image store first.
  UIImage *originalImage = info[UIImagePickerControllerOriginalImage];

  // WARNING: Using ImageStoreManager may cause a memory leak because the
  // image isn't automatically removed from store once we're done using it.
  [_bridge.imageStoreManager storeImage:originalImage withBlock:^(NSString *tempImageTag) {
    [self _dismissPicker:picker args:tempImageTag ? @[tempImageTag, ABI42_0_0RCTNullIfNil(height), ABI42_0_0RCTNullIfNil(width)] : nil];
  }];
}

- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker
{
  [self _dismissPicker:picker args:nil];
}

- (void)_presentPicker:(UIImagePickerController *)imagePicker
       successCallback:(ABI42_0_0RCTResponseSenderBlock)callback
        cancelCallback:(ABI42_0_0RCTResponseSenderBlock)cancelCallback
{
  if (!_pickers) {
    _pickers = [NSMutableArray new];
    _pickerCallbacks = [NSMutableArray new];
    _pickerCancelCallbacks = [NSMutableArray new];
    _pendingVideoInfo = [NSMutableDictionary new];
  }

  [_pickers addObject:imagePicker];
  [_pickerCallbacks addObject:callback];
  [_pickerCancelCallbacks addObject:cancelCallback];

  UIViewController *rootViewController = ABI42_0_0RCTPresentedViewController();
  [rootViewController presentViewController:imagePicker animated:YES completion:nil];
}

- (void)_dismissPicker:(UIImagePickerController *)picker args:(NSArray *)args
{
  NSUInteger index = [_pickers indexOfObject:picker];
  if (index == NSNotFound) {
    // This happens if the user selects multiple items in succession.
    return;
  }

  ABI42_0_0RCTResponseSenderBlock successCallback = _pickerCallbacks[index];
  ABI42_0_0RCTResponseSenderBlock cancelCallback = _pickerCancelCallbacks[index];

  [_pickers removeObjectAtIndex:index];
  [_pickerCallbacks removeObjectAtIndex:index];
  [_pickerCancelCallbacks removeObjectAtIndex:index];

  UIViewController *rootViewController = ABI42_0_0RCTPresentedViewController();
  [rootViewController dismissViewControllerAnimated:YES completion:nil];

  if (args) {
    successCallback(args);
  } else {
    cancelCallback(@[]);
  }
}

- (void)cameraChanged:(NSNotification *)notification
{
  for (UIImagePickerController *picker in _pickers) {
    if (picker.sourceType != UIImagePickerControllerSourceTypeCamera) {
      continue;
    }
    if ([picker isKindOfClass:[ABI42_0_0RCTImagePickerController class]]
      && ((ABI42_0_0RCTImagePickerController *)picker).unmirrorFrontFacingCamera
      && picker.cameraDevice == UIImagePickerControllerCameraDeviceFront) {
      picker.cameraViewTransform = CGAffineTransformScale(CGAffineTransformIdentity, -1, 1);
    } else {
      picker.cameraViewTransform = CGAffineTransformIdentity;
    }
  }
}

- (std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::TurboModule>)
    getTurboModuleWithJsInvoker:(std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::CallInvoker>)jsInvoker
                  nativeInvoker:(std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::CallInvoker>)nativeInvoker
                     perfLogger:(id<ABI42_0_0RCTTurboModulePerformanceLogger>)perfLogger
{
  return std::make_shared<ABI42_0_0facebook::ABI42_0_0React::NativeImagePickerIOSSpecJSI>(self, jsInvoker, nativeInvoker, perfLogger);
}

@end

Class ABI42_0_0RCTImagePickerManagerCls(void) {
  return ABI42_0_0RCTImagePickerManager.class;
}
