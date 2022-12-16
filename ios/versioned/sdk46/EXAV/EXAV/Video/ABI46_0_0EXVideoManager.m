// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ABI46_0_0EXAV/ABI46_0_0EXVideoManager.h>
#import <ABI46_0_0EXAV/ABI46_0_0EXVideoView.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXUIManager.h>

@interface ABI46_0_0EXVideoManager ()

@property (nonatomic, weak) ABI46_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI46_0_0EXVideoManager

ABI46_0_0EX_EXPORT_MODULE(ExpoVideoManager);

- (NSString *)viewName
{
  return @"ExpoVideoView";
}

- (void)setModuleRegistry:(ABI46_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [[ABI46_0_0EXVideoView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSDictionary *)constantsToExport
{
  return @{@"ScaleNone": AVLayerVideoGravityResizeAspect,
           @"ScaleToFill": AVLayerVideoGravityResize,
           @"ScaleAspectFit": AVLayerVideoGravityResizeAspect,
           @"ScaleAspectFill": AVLayerVideoGravityResizeAspectFill};
}

// Props set directly in <Video> component
ABI46_0_0EX_VIEW_PROPERTY(status, NSDictionary *, ABI46_0_0EXVideoView)
{
  [view setStatus:value];
}

ABI46_0_0EX_VIEW_PROPERTY(useNativeControls, BOOL, ABI46_0_0EXVideoView)
{
  [view setUseNativeControls:value];
}

// Native only props -- set by Video.js
ABI46_0_0EX_VIEW_PROPERTY(source, NSDictionary *, ABI46_0_0EXVideoView)
{
  [view setSource:value];
}
ABI46_0_0EX_VIEW_PROPERTY(resizeMode, NSString *, ABI46_0_0EXVideoView)
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

- (void)_runBlock:(void (^)(ABI46_0_0EXVideoView *view))block
withEXVideoViewForTag:(nonnull NSNumber *)viewTag
     withRejecter:(ABI46_0_0EXPromiseRejectBlock)reject
{
  id<ABI46_0_0EXUIManager> uiManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI46_0_0EXUIManager)];
  [uiManager executeUIBlock:^(id view) {
    if ([view isKindOfClass:[ABI46_0_0EXVideoView class]]) {
      block((ABI46_0_0EXVideoView *)view);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Invalid view returned from registry, expecting ABI46_0_0EXVideo, got: %@", view];
      reject(@"E_VIDEO_TAGINCORRECT", errorMessage, ABI46_0_0EXErrorWithMessage(errorMessage));
    }
  } forView:viewTag ofClass:[ABI46_0_0EXVideoView class]];
}

ABI46_0_0EX_EXPORT_METHOD_AS(setFullscreen,
                    setFullscreen:(NSNumber *)viewTag
                    toValue:(BOOL)value
                    resolver:(ABI46_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI46_0_0EXPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI46_0_0EXVideoView *view) {
    [view setFullscreen:value resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:viewTag withRejecter:reject];
}

// Note that the imperative playback API for Video is conducted through the AV module.

@end
