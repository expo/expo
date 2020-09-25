#import "EXDevelopmentClient.h"

#import "EXDevelopmentClientController+Private.h"


@implementation EXDevelopmentClient

RCT_EXPORT_MODULE()

- (instancetype)init {
  if (self = [super init]) {
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

+ (UIInterfaceOrientation)defaultOrientationForOrientationMask:(UIInterfaceOrientationMask)orientationMask
{
  if (UIInterfaceOrientationMaskPortrait & orientationMask) {
    return UIInterfaceOrientationPortrait;
  } else if (UIInterfaceOrientationMaskLandscapeLeft & orientationMask) {
    return UIInterfaceOrientationLandscapeLeft;
  } else if (UIInterfaceOrientationMaskLandscapeRight & orientationMask) {
    return UIInterfaceOrientationLandscapeRight;
  } else if (UIInterfaceOrientationMaskPortraitUpsideDown & orientationMask) {
    return UIInterfaceOrientationPortraitUpsideDown;
  }
  return UIInterfaceOrientationUnknown;
}

RCT_EXPORT_METHOD(loadApp:(NSURL *)url
                  options:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  UIInterfaceOrientationMask orientationMask = UIInterfaceOrientationMaskAll;
  if ([@"portrait" isEqualToString:options[@"orientation"]]) {
    orientationMask = UIInterfaceOrientationMaskPortrait;
  } else if ([@"landscape" isEqualToString:options[@"orientation"]]) {
    orientationMask = UIInterfaceOrientationMaskLandscape;
  }
  UIInterfaceOrientation orientation = [EXDevelopmentClient defaultOrientationForOrientationMask:orientationMask];

  dispatch_async(dispatch_get_main_queue(), ^{
    [[UIDevice currentDevice] setValue:@(orientation) forKey:@"orientation"];
    [UIViewController attemptRotationToDeviceOrientation];

    EXDevelopmentClientController *controller = [EXDevelopmentClientController sharedInstance];
    controller.sourceUrl = url;
    [controller.delegate developmentClientController:controller didStartWithSuccess:YES];
  });
  resolve(nil);
}

@end
