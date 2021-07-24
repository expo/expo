// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXBlur/EXBlurView.h>
#import <EXBlur/EXBlurViewManager.h>
#import <ExpoModulesCore/EXUIManager.h>

@interface EXBlurViewManager ()

@property (weak, nonatomic) EXModuleRegistry *moduleRegistry;

@end

@implementation EXBlurViewManager

EX_EXPORT_MODULE(ExpoBlurViewManager);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry {
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

EX_VIEW_PROPERTY(tint, NSString *, EXBlurView)
{
  [view setTint:value];
  [view didSetProps:@[@"tint"]];
}

EX_VIEW_PROPERTY(intensity, NSNumber *, EXBlurView)
{
  [view setIntensity:value];
  [view didSetProps:@[@"intensity"]];
}

EX_EXPORT_METHOD_AS(updateProps,
                    updateProps:(NSDictionary *)props
                    onViewOfId:(id)viewId
                    resolve:(EXPromiseResolveBlock)resolver
                    reject:(EXPromiseRejectBlock)rejecter)
{
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(EXUIManager)] executeUIBlock:^(id view) {
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
