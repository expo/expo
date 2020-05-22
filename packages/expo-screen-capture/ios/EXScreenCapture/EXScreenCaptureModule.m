// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXScreenCapture/EXScreenCaptureModule.h>

@interface EXScreenCaptureModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXScreenCaptureModule {
  UIView *_blockView;
  NSMutableSet *_activeTags;
}

- (instancetype)init {
  if (self = [super init]) {
    CGFloat boundLength = MAX([[UIScreen mainScreen] bounds].size.width, [[UIScreen mainScreen] bounds].size.height);
    _blockView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, boundLength, boundLength)];
    _blockView.backgroundColor = UIColor.blackColor;
    
    _activeTags = [[NSMutableSet alloc] init];
  }
  return self;
}

UM_EXPORT_MODULE(ExpoScreenCapture);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

UM_EXPORT_METHOD_AS(preventScreenCapture,
                    preventScreenCapture:(NSString *)tag
                    preventScreenCaptureWithResolver:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if (@available(iOS 11.0, *) ) {
    if (![_activeTags containsObject:tag]){
      [_activeTags addObject:tag];
      // If already recording, block it
      dispatch_async(dispatch_get_main_queue(), ^{
        [self preventScreenRecording];
      });

      // Avoid setting duplicate observers
      [[NSNotificationCenter defaultCenter] removeObserver:self name:UIScreenCapturedDidChangeNotification object:nil];
          
      [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(preventScreenRecording) name:UIScreenCapturedDidChangeNotification object:nil];
    }
  }
  resolve([NSNull null]);
}

UM_EXPORT_METHOD_AS(allowScreenCapture,
                    allowScreenCapture:(NSString *)tag
                    allowScreenCaptureWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  if (@available(iOS 11.0, *)) {
    [_activeTags removeObject:tag];
    
    // No active tags means we can safely remove the listener
    if (_activeTags.count == 0){
      [[NSNotificationCenter defaultCenter] removeObserver:self name:UIScreenCapturedDidChangeNotification object:nil];
    }
  }

  resolve([NSNull null]);
}

- (void)preventScreenRecording {
  if (@available(iOS 11.0, *)) {
    BOOL isCaptured = [[UIScreen mainScreen] isCaptured];

    if (isCaptured) {
      [UIApplication.sharedApplication.keyWindow.subviews.firstObject addSubview:_blockView];
    } else {
      [_blockView removeFromSuperview];
    }
  }
}

@end
