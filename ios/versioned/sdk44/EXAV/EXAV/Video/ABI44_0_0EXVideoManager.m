// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ABI44_0_0EXAV/ABI44_0_0EXVideoManager.h>
#import <ABI44_0_0EXAV/ABI44_0_0EXVideoView.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXUIManager.h>

@interface ABI44_0_0EXVideoManager ()

@property (nonatomic, weak) ABI44_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI44_0_0EXVideoManager

ABI44_0_0EX_EXPORT_MODULE(ExpoVideoManager);

- (NSString *)viewName
{
  return @"ExpoVideoView";
}

- (void)setModuleRegistry:(ABI44_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [[ABI44_0_0EXVideoView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSDictionary *)constantsToExport
{
  return @{@"ScaleNone": AVLayerVideoGravityResizeAspect,
           @"ScaleToFill": AVLayerVideoGravityResize,
           @"ScaleAspectFit": AVLayerVideoGravityResizeAspect,
           @"ScaleAspectFill": AVLayerVideoGravityResizeAspectFill};
}

// Props set directly in <Video> component
ABI44_0_0EX_VIEW_PROPERTY(status, NSDictionary *, ABI44_0_0EXVideoView)
{
  [view setStatus:value];
}

ABI44_0_0EX_VIEW_PROPERTY(useNativeControls, BOOL, ABI44_0_0EXVideoView)
{
  [view setUseNativeControls:value];
}

// Native only props -- set by Video.js
ABI44_0_0EX_VIEW_PROPERTY(source, NSDictionary *, ABI44_0_0EXVideoView)
{
  [view setSource:value];
}
ABI44_0_0EX_VIEW_PROPERTY(resizeMode, NSString *, ABI44_0_0EXVideoView)
{
  [view setNativeResizeMode:value];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           @"onStatusUpdate",
           @"onLoadStart",
           @"onLoad",
           @"onError",
           @"onReadyForDisplay",
           @"onFullscreenUpdate"
           ];
}

- (void)_runBlock:(void (^)(ABI44_0_0EXVideoView *view))block
withEXVideoViewForTag:(nonnull NSNumber *)viewTag
     withRejecter:(ABI44_0_0EXPromiseRejectBlock)reject
{
  id<ABI44_0_0EXUIManager> uiManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI44_0_0EXUIManager)];
  [uiManager executeUIBlock:^(id view) {
    if ([view isKindOfClass:[ABI44_0_0EXVideoView class]]) {
      block((ABI44_0_0EXVideoView *)view);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Invalid view returned from registry, expecting ABI44_0_0EXVideo, got: %@", view];
      reject(@"E_VIDEO_TAGINCORRECT", errorMessage, ABI44_0_0EXErrorWithMessage(errorMessage));
    }
  } forView:viewTag ofClass:[ABI44_0_0EXVideoView class]];
}

ABI44_0_0EX_EXPORT_METHOD_AS(setFullscreen,
                    setFullscreen:(NSNumber *)viewTag
                    toValue:(BOOL)value
                    resolver:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI44_0_0EXVideoView *view) {
    [view setFullscreen:value resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:viewTag withRejecter:reject];
}

// Note that the imperative playback API for Video is conducted through the AV module.

@end
