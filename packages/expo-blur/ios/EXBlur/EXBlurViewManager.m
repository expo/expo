// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXBlur/EXBlurView.h>
#import <EXBlur/EXBlurViewManager.h>
#import <UMCore/UMUIManager.h>

@interface EXBlurViewManager ()

@property (weak, nonatomic) UMModuleRegistry *moduleRegistry;

@end

@implementation EXBlurViewManager

UM_EXPORT_MODULE(ExpoBlurViewManager);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry {
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [[EXBlurView alloc] init];
}

- (NSString *)viewName
{
  return @"ExpoBlurView";
}

UM_VIEW_PROPERTY(tint, NSString *, EXBlurView)
{
  [view setTint:value];
  [view didSetProps:@[@"tint"]];
}

UM_VIEW_PROPERTY(intensity, NSNumber *, EXBlurView)
{
  [view setIntensity:value];
  [view didSetProps:@[@"intensity"]];
}

UM_EXPORT_METHOD_AS(updateProps,
                    updateProps:(NSDictionary *)props
                    onViewOfId:(id)viewId
                    resolve:(UMPromiseResolveBlock)resolver
                    reject:(UMPromiseRejectBlock)rejecter)
{
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(UMUIManager)] executeUIBlock:^(id view) {
    if ([view isKindOfClass:[EXBlurView class]]) {
      EXBlurView *blurView = view;
      NSMutableArray *changedProps = [NSMutableArray new];
      if (props[@"intensity"] && ![props[@"intensity"] isEqual:blurView.intensity]) {
        [blurView setIntensity:props[@"intensity"]];
        [changedProps addObject:@"intensity"];
      }
      if (props[@"tint"] && ![props[@"tint"] isEqual:blurView.tint]) {
        [blurView setTint:props[@"tint"]];
        [changedProps addObject:@"tint"];
      }
      [blurView didSetProps:changedProps];
      resolver([NSNull null]);
    } else {
      rejecter(@"E_INVALID_VIEW", @"Invalid view found for requested tag", nil);
    }
  } forView:viewId ofClass:[EXBlurView class]];
}

@end
