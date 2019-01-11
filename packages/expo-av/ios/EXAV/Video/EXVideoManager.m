// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <EXAV/EXVideoManager.h>
#import <EXAV/EXVideoView.h>
#import <EXCore/EXUIManager.h>

@interface EXVideoManager ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXVideoManager

EX_EXPORT_MODULE(ExponentVideoManager);

- (NSString *)viewName
{
  return @"ExponentVideo";
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
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
EX_VIEW_PROPERTY(status, NSDictionary *, EXVideoView)
{
  [view setStatus:value];
}

EX_VIEW_PROPERTY(useNativeControls, BOOL, EXVideoView)
{
  [view setUseNativeControls:value];
}

// Native only props -- set by Video.js
EX_VIEW_PROPERTY(source, NSDictionary *, EXVideoView)
{
  [view setSource:value];
}
EX_VIEW_PROPERTY(nativeResizeMode, NSString *, EXVideoView)
{
  [view setNativeResizeMode:value];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           @"onStatusUpdateNative",
           @"onLoadStartNative",
           @"onLoadNative",
           @"onErrorNative",
           @"onReadyForDisplayNative",
           @"onFullscreenUpdateNative"
           ];
}

- (void)_runBlock:(void (^)(EXVideoView *view))block
withEXVideoViewForTag:(nonnull NSNumber *)viewTag
     withRejecter:(EXPromiseRejectBlock)reject
{
  id<EXUIManager> uiManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXUIManager)];
  [uiManager addUIBlock:^(id view) {
    if ([view isKindOfClass:[EXVideoView class]]) {
      block((EXVideoView *)view);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Invalid view returned from registry, expecting EXVideo, got: %@", view];
      reject(@"E_VIDEO_TAGINCORRECT", errorMessage, EXErrorWithMessage(errorMessage));
    }
  } forView:viewTag ofClass:[EXVideoView class]];
}

EX_EXPORT_METHOD_AS(setFullscreen,
                    setFullscreen:(NSNumber *)viewTag
                    toValue:(BOOL)value
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXVideoView *view) {
    [view setFullscreen:value resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:viewTag withRejecter:reject];
}

// Note that the imperative playback API for Video is conducted through the AV module.

@end
