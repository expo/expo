// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXBlur/ABI43_0_0EXBlurView.h>
#import <ABI43_0_0EXBlur/ABI43_0_0EXBlurViewManager.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUIManager.h>

@interface ABI43_0_0EXBlurViewManager ()

@property (weak, nonatomic) ABI43_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI43_0_0EXBlurViewManager

ABI43_0_0EX_EXPORT_MODULE(ExpoBlurViewManager);

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry {
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [[ABI43_0_0EXBlurView alloc] init];
}

- (NSString *)viewName
{
  return @"ExpoBlurView";
}

ABI43_0_0EX_VIEW_PROPERTY(tint, NSString *, ABI43_0_0EXBlurView)
{
  [view setTint:value];
  [view didSetProps:@[@"tint"]];
}

ABI43_0_0EX_VIEW_PROPERTY(intensity, NSNumber *, ABI43_0_0EXBlurView)
{
  [view setIntensity:value];
  [view didSetProps:@[@"intensity"]];
}

ABI43_0_0EX_EXPORT_METHOD_AS(updateProps,
                    updateProps:(NSDictionary *)props
                    onViewOfId:(id)viewId
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolver
                    reject:(ABI43_0_0EXPromiseRejectBlock)rejecter)
{
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXUIManager)] executeUIBlock:^(id view) {
    if ([view isKindOfClass:[ABI43_0_0EXBlurView class]]) {
      ABI43_0_0EXBlurView *blurView = view;
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
  } forView:viewId ofClass:[ABI43_0_0EXBlurView class]];
}

@end
