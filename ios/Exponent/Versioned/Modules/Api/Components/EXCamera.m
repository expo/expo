#import <React/RCTBridge.h>
#import "EXCamera.h"
#import "EXCameraManager.h"
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

#import <React/UIView+React.h>

#import <AVFoundation/AVFoundation.h>

@interface EXCamera ()

@property (nonatomic, weak) EXCameraManager *manager;
@property (nonatomic, weak) RCTBridge *bridge;
@property (nonatomic, copy) RCTDirectEventBlock onCameraReady;
@property (nonatomic, copy) RCTDirectEventBlock onBarCodeRead;

@end

@implementation EXCamera

- (id)initWithManager:(EXCameraManager *)manager bridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    self.manager = manager;
    self.bridge = bridge;
    [self changePreviewOrientation:[UIApplication sharedApplication]
     .statusBarOrientation];
    [[NSNotificationCenter defaultCenter]
     addObserver:self
     selector:@selector(orientationChanged:)
     name:UIDeviceOrientationDidChangeNotification
     object:nil];
  }
  return self;
}

- (void)onReady:(NSDictionary *)event
{
  if (_onCameraReady) {
    _onCameraReady(nil);
  }
}

- (void)onCodeRead:(NSDictionary *)event
{
  if (_onBarCodeRead) {
    _onBarCodeRead(event);
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  self.manager.previewLayer.frame = self.bounds;
  [self setBackgroundColor:[UIColor blackColor]];
  [self.layer insertSublayer:self.manager.previewLayer atIndex:0];
}

- (void)insertReactSubview:(UIView *)view atIndex:(NSInteger)atIndex
{
  [self insertSubview:view atIndex:atIndex + 1];
  [super insertReactSubview:view atIndex:atIndex];
  return;
}

- (void)removeReactSubview:(UIView *)subview
{
  [subview removeFromSuperview];
  [super removeReactSubview:subview];
  return;
}

- (void)removeFromSuperview
{
  [self.manager stopSession];
  [super removeFromSuperview];
  [[NSNotificationCenter defaultCenter]
   removeObserver:self
   name:UIDeviceOrientationDidChangeNotification
   object:nil];
}

- (void)orientationChanged:(NSNotification *)notification
{
  UIInterfaceOrientation orientation =
  [[UIApplication sharedApplication] statusBarOrientation];
  [self changePreviewOrientation:orientation];
}

- (void)changePreviewOrientation:(NSInteger)orientation
{
  __weak typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    __strong typeof(self) strongSelf = weakSelf;
    if (strongSelf && strongSelf.manager.previewLayer.connection.isVideoOrientationSupported) {
      strongSelf.manager.previewLayer.connection.videoOrientation = orientation;
    }
  });
}

@end
