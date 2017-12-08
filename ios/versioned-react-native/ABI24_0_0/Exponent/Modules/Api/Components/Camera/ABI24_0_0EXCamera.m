#import "ABI24_0_0EXCamera.h"
#import "ABI24_0_0EXCameraUtils.h"
#import "ABI24_0_0EXCameraManager.h"
#import <ReactABI24_0_0/ABI24_0_0RCTEventDispatcher.h>
#import <ReactABI24_0_0/ABI24_0_0RCTLog.h>
#import <ReactABI24_0_0/ABI24_0_0RCTUtils.h>

#import <ReactABI24_0_0/UIView+ReactABI24_0_0.h>

#import <AVFoundation/AVFoundation.h>

@interface ABI24_0_0EXCamera ()

@property (nonatomic, weak) ABI24_0_0EXCameraManager *manager;
@property (nonatomic, weak) ABI24_0_0RCTBridge *bridge;
@property (nonatomic, copy) ABI24_0_0RCTDirectEventBlock onCameraReady;
@property (nonatomic, copy) ABI24_0_0RCTDirectEventBlock onMountError;
@property (nonatomic, copy) ABI24_0_0RCTDirectEventBlock onBarCodeRead;
@property (nonatomic, copy) ABI24_0_0RCTDirectEventBlock onFacesDetected;

@end

@implementation ABI24_0_0EXCamera

- (id)initWithManager:(ABI24_0_0EXCameraManager *)manager bridge:(ABI24_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    self.manager = manager;
    self.bridge = bridge;
    [self changePreviewOrientation:[UIApplication sharedApplication].statusBarOrientation];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(orientationChanged:) name:UIDeviceOrientationDidChangeNotification object:nil];
  }
  return self;
}

- (void)onReady:(NSDictionary *)event
{
  if (_onCameraReady) {
    _onCameraReady(nil);
  }
}

- (void)onMountingError:(NSDictionary *)event
{
  if (_onMountError) {
    _onMountError(event);
  }
}

- (void)onCodeRead:(NSDictionary *)event
{
  if (_onBarCodeRead) {
    _onBarCodeRead(event);
  }
}

- (void)onFacesDetected:(NSDictionary *)event
{
  if (_onFacesDetected) {
    _onFacesDetected(event);
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  self.manager.previewLayer.frame = self.bounds;
  [self setBackgroundColor:[UIColor blackColor]];
  [self.layer insertSublayer:self.manager.previewLayer atIndex:0];
}

- (void)insertReactABI24_0_0Subview:(UIView *)view atIndex:(NSInteger)atIndex
{
  [self insertSubview:view atIndex:atIndex + 1];
  [super insertReactABI24_0_0Subview:view atIndex:atIndex];
  return;
}

- (void)removeReactABI24_0_0Subview:(UIView *)subview
{
  [subview removeFromSuperview];
  [super removeReactABI24_0_0Subview:subview];
  return;
}

- (void)removeFromSuperview
{
  [self.manager stopSession];
  [super removeFromSuperview];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIDeviceOrientationDidChangeNotification object:nil];
}

- (void)orientationChanged:(NSNotification *)notification
{
  UIInterfaceOrientation orientation = [[UIApplication sharedApplication] statusBarOrientation];
  [self changePreviewOrientation:orientation];
}

- (void)changePreviewOrientation:(UIInterfaceOrientation)orientation
{
  __weak typeof(self) weakSelf = self;
  AVCaptureVideoOrientation videoOrientation = [ABI24_0_0EXCameraUtils videoOrientationForInterfaceOrientation:orientation];
  dispatch_async(dispatch_get_main_queue(), ^{
    __strong typeof(self) strongSelf = weakSelf;
    if (strongSelf && strongSelf.manager.previewLayer.connection.isVideoOrientationSupported) {
      [strongSelf.manager.previewLayer.connection setVideoOrientation:videoOrientation];
    }
  });
}

@end
