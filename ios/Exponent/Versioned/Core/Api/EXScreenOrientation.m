// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScreenOrientation.h"
#import "EXScopedModuleRegistry.h"

#import <UIKit/UIKit.h>

@interface EXScreenOrientation ()

@property (nonatomic, weak) id kernelOrientationServiceDelegate;

@end

@implementation EXScreenOrientation

EX_EXPORT_SCOPED_MODULE(ExponentScreenOrientation, ScreenOrientationManager);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _kernelOrientationServiceDelegate = kernelServiceInstance;
  }
  return self;
}

RCT_EXPORT_METHOD(allow:(NSString *)orientation)
{
  UIInterfaceOrientationMask orientationMask = [self orientationMaskFromOrientation:orientation];
  [_kernelOrientationServiceDelegate screenOrientationModule:self
                     didChangeSupportedInterfaceOrientations:orientationMask];
}

- (UIInterfaceOrientationMask)orientationMaskFromOrientation:(NSString *)orientation
{
  if ([orientation isEqualToString:@"ALL"]) {
    return UIInterfaceOrientationMaskAll;
  } else if ([orientation isEqualToString:@"ALL_BUT_UPSIDE_DOWN"]) {
    return UIInterfaceOrientationMaskAllButUpsideDown;
  } else if ([orientation isEqualToString:@"LANDSCAPE"]) {
    return UIInterfaceOrientationMaskLandscape;
  } else if ([orientation isEqualToString:@"LANDSCAPE_LEFT"]) {
    return UIInterfaceOrientationMaskLandscapeLeft;
  } else if ([orientation isEqualToString:@"LANDSCAPE_RIGHT"]) {
    return UIInterfaceOrientationMaskLandscapeRight;
  } else if ([orientation isEqualToString:@"PORTRAIT"]) {
    return UIInterfaceOrientationMaskPortrait;
  } else if ([orientation isEqualToString:@"PORTRAIT_UP"]) {
    return UIInterfaceOrientationMaskPortrait;
  } else if ([orientation isEqualToString:@"PORTRAIT_DOWN"]) {
    return UIInterfaceOrientationMaskPortraitUpsideDown;
  } else {
    @throw [NSException exceptionWithName:NSInvalidArgumentException
                                   reason:[NSString stringWithFormat:@"Invalid screen orientation %@", orientation]
                                 userInfo:nil];
  }
}

@end
