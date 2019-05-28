// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXCamera2/EXCamera2ViewManager.h>
#import <EXCamera2/EXCamera2View.h>
#import <UMCore/UMUIManager.h>

#define EXECUTE_UI_BLOCK_WITH_SELF(block) \
  UM_WEAKIFY(self); \
  [_uiManager addUIBlock:^(id view){ \
    UM_ENSURE_STRONGIFY(self); \
    if (view) { \
      block \
    } else { \
      NSString *reason = [NSString stringWithFormat:@"Invalid view returned from registry, expected EXCamera2View, got: %@", view]; \
      reject(@"E_INVALID_VIEW", reason, nil); \
    }\
  } forView:reactTag ofClass:[EXCamera2View class]]

@interface EXCamera2ViewManager ()

@property (nonatomic, weak) id<UMUIManager> uiManager;
@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXCamera2ViewManager

UM_EXPORT_MODULE(ExpoCamera2ViewManager);

- (UIView *)view
{
  return [[EXCamera2View alloc] init];
}

- (NSString *)viewName
{
  return @"ExpoCamera2View";
}

- (NSDictionary *)constantsToExport
{
  return @{};
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           @"onCameraReady",
           @"onMountError",
           ];
}

# pragma mark - UMModuleRegistryConsumer

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _uiManager = [moduleRegistry getModuleImplementingProtocol:@protocol(UMUIManager)];
}

# pragma mark - View Props

UM_VIEW_PROPERTY(autofocus, NSNumber *, EXCamera2View)
{
  [view setAutofocus:[value integerValue]];
}

UM_VIEW_PROPERTY(facing, NSNumber *, EXCamera2View)
{
  [view setFacing:[value integerValue]];
}

UM_VIEW_PROPERTY(flashMode, NSNumber *, EXCamera2View)
{
  [view setFlashMode:[value integerValue]];
}

UM_VIEW_PROPERTY(focusDepth, NSNumber *, EXCamera2View)
{
  [view setFocusDepth:[value floatValue]];
}

UM_VIEW_PROPERTY(whiteBalance, NSNumber *, EXCamera2View)
{
  [view setWhiteBalance:[value integerValue]];
}

UM_VIEW_PROPERTY(zoom, NSNumber *, EXCamera2View)
{
  [view setZoom:[value floatValue]];
}

# pragma mark - View Lifecycle Methods

UM_EXPORT_METHOD_AS(pausePreviewAsync,
                    pausePreviewAsyncWithReactTag:(nonnull NSNumber *)reactTag
                                         resolver:(UMPromiseResolveBlock)resolve
                                         rejecter:(UMPromiseRejectBlock)reject)
{
    EXECUTE_UI_BLOCK_WITH_SELF({
        [view pausePreviewWithCompletion:^(id result){ resolve(nil); }
                                andError:^(NSString * _Nonnull message, NSError * _Nullable error){
                                    reject(@"EXPO_CAMERA_ERR", message, error);
                                }];
    });
}

UM_EXPORT_METHOD_AS(resumePreviewAsync,
                    resumePreviewAsyncWithReactTag:(nonnull NSNumber *)reactTag
                                          resolver:(UMPromiseResolveBlock)resolve
                                          rejecter:(UMPromiseRejectBlock)reject)
{
    EXECUTE_UI_BLOCK_WITH_SELF({
        [view resumePreviewWithCompletion:^(id result){ resolve(nil); }
                                 andError:^(NSString * _Nonnull message, NSError * _Nullable error){
                                     reject(@"EXPO_CAMERA_ERR", message, error);
                                 }];
    });
}

# pragma mark - View Action Methods

UM_EXPORT_METHOD_AS(focusOnPoint,
                    focusOnPointWithPreviewFocusPoint:(NSDictionary *)previewFocusPoint
                                             reactTag:(nonnull NSNumber *)reactTag
                                             resolver:(UMPromiseResolveBlock)resolve
                                             rejecter:(UMPromiseRejectBlock)reject)
{
  reject(@"NOT_IMPLEMENTED", @"focusOnPoint not implemented", nil);
}

UM_EXPORT_METHOD_AS(recordAsync,
                    recordAsyncWithOptions:(NSDictionary *)options
                                  reactTag:(nonnull NSNumber *)reactTag
                                  resolver:(UMPromiseResolveBlock)resolve
                                  rejecter:(UMPromiseRejectBlock)reject)
{
  reject(@"NOT_IMPLEMENTED", @"recordAsync not implemented", nil);
}

UM_EXPORT_METHOD_AS(takePictureAsync,
                    takePictureAsyncWithOptions:(NSDictionary *)options
                                       reactTag:(nonnull NSNumber *)reactTag
                                       resolver:(UMPromiseResolveBlock)resolve
                                       rejecter:(UMPromiseRejectBlock)reject)
{
  reject(@"NOT_IMPLEMENTED", @"takePictureAsync not implemented", nil);
}

UM_EXPORT_METHOD_AS(stopRecordingAsync,
                    stopRecordingAsyncWithReactTag:(nonnull NSNumber *)reactTag
                                          resolver:(UMPromiseResolveBlock)resolve
                                          rejecter:(UMPromiseRejectBlock)reject)
{
  reject(@"NOT_IMPLEMENTED", @"stopRecordingAsync not implemented", nil);
}

# pragma mark - View Configuration Methods

UM_EXPORT_METHOD_AS(getAvailablePictureSizesAsync,
                    getAvailablePictureSizesAsyncWithRatio:(nonnull NSString *)ratio
                                                  reactTag:(nonnull NSNumber *)reactTag
                                                  resolver:(UMPromiseResolveBlock)resolve
                                                  rejecter:(UMPromiseRejectBlock)reject)
{
  reject(@"NOT_IMPLEMENTED", @"getAvailablePictureSizesAsync not implemented", nil);
}

UM_EXPORT_METHOD_AS(getAvailableRatiosAsync,
                 getAvailableRatiosAsyncWithReactTag:(nonnull NSNumber *)reactTag
                                            resolver:(UMPromiseResolveBlock)resolve
                                            rejecter:(UMPromiseRejectBlock)reject)
{
  reject(@"NOT_IMPLEMENTED", @"getAvailableRatiosAsync not implemented", nil);
}

@end
