// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXPreventScreenCapture/EXPreventScreenCaptureModule.h>

@interface EXPreventScreenCaptureModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, strong) UIView *blockView;

@end

@implementation EXPreventScreenCaptureModule

UM_EXPORT_MODULE(ExpoPreventScreenCapture);

- (id)init {
  if (self = [super init]) {
      self.blockView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, [[UIScreen mainScreen] bounds].size.height, [[UIScreen mainScreen] bounds].size.height)];
      [self.blockView setBackgroundColor:[UIColor whiteColor]];
  }
  return self;
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

UM_EXPORT_METHOD_AS(activatePreventScreenCapture,
                    activatePreventScreenCaptureWithResolver:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if (@available(iOS 11.0, *)) {
    // If already recording, block it
    dispatch_async(dispatch_get_main_queue(), ^{
            [self preventScreenRecording];
    });

    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(preventScreenRecording) name:UIScreenCapturedDidChangeNotification object:nil];
  }
    
  // This notification is only sent AFTER a screenshot is already taken. There is currently no exposed listner for iOS that sends an event BEFORE a screenshot.
  // [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(screenShotWasTaken) name:UIApplicationUserDidTakeScreenshotNotification object:nil];
    
  resolve(nil);
}

UM_EXPORT_METHOD_AS(deactivatePreventScreenCapture,
                    deactivatePreventScreenCaptureWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  if (@available(iOS 11.0, *)) {
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIScreenCapturedDidChangeNotification object:nil];
  }
  // [[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationUserDidTakeScreenshotNotification object:nil];
  resolve(nil);
}

- (void)preventScreenRecording {
  if (@available(iOS 11.0, *)) {
    BOOL isCaptured = [[UIScreen mainScreen] isCaptured];

    if (isCaptured) {
        [[[[UIApplication sharedApplication].keyWindow subviews] objectAtIndex:0] addSubview:_blockView];
    }
    else {
        [_blockView removeFromSuperview];
    }
  }
}

@end
