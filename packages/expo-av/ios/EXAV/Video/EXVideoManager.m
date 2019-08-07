// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <EXAV/EXVideoManager.h>
#import <EXAV/EXVideoView.h>
#import <UMCore/UMUIManager.h>

@interface EXVideoManager ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXVideoManager

UM_EXPORT_MODULE(ExpoVideoManager);

- (NSString *)viewName
{
  return @"ExpoVideoView";
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [[EXVideoView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSDictionary *)constantsToExport
{
  return @{@"ScaleNone": AVLayerVideoGravityResizeAspect,
           @"ScaleToFill": AVLayerVideoGravityResize,
           @"ScaleAspectFit": AVLayerVideoGravityResizeAspect,
           @"ScaleAspectFill": AVLayerVideoGravityResizeAspectFill};
}

// Props set directly in <Video> component
UM_VIEW_PROPERTY(status, NSDictionary *, EXVideoView)
{
  [view setStatus:value];
}

UM_VIEW_PROPERTY(useNativeControls, BOOL, EXVideoView)
{
  [view setUseNativeControls:value];
}

// Native only props -- set by Video.js
UM_VIEW_PROPERTY(source, NSDictionary *, EXVideoView)
{
  [view setSource:value];
}
UM_VIEW_PROPERTY(resizeMode, NSString *, EXVideoView)
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

- (void)_runBlock:(void (^)(EXVideoView *view))block
withEXVideoViewForTag:(nonnull NSNumber *)viewTag
     withRejecter:(UMPromiseRejectBlock)reject
{
  id<UMUIManager> uiManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(UMUIManager)];
  [uiManager executeUIBlock:^(id view) {
    if ([view isKindOfClass:[EXVideoView class]]) {
      block((EXVideoView *)view);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Invalid view returned from registry, expecting EXVideo, got: %@", view];
      reject(@"E_VIDEO_TAGINCORRECT", errorMessage, UMErrorWithMessage(errorMessage));
    }
  } forView:viewTag ofClass:[EXVideoView class]];
}

UM_EXPORT_METHOD_AS(setFullscreen,
                    setFullscreen:(NSNumber *)viewTag
                    toValue:(BOOL)value
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXVideoView *view) {
    [view setFullscreen:value resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:viewTag withRejecter:reject];
}

// Note that the imperative playback API for Video is conducted through the AV module.

@end
