// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXBlur/ABI37_0_0EXBlurView.h>
#import <ABI37_0_0EXBlur/ABI37_0_0EXBlurViewManager.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMUIManager.h>

@interface ABI37_0_0EXBlurViewManager ()

@property (weak, nonatomic) ABI37_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI37_0_0EXBlurViewManager

ABI37_0_0UM_EXPORT_MODULE(ExpoBlurViewManager);

- (void)setModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry {
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [[ABI37_0_0EXBlurView alloc] init];
}

- (NSString *)viewName
{
  return @"ExpoBlurView";
}

ABI37_0_0UM_VIEW_PROPERTY(tint, NSString *, ABI37_0_0EXBlurView)
{
  [view setTint:value];
  [view didSetProps:@[@"tint"]];
}

ABI37_0_0UM_VIEW_PROPERTY(intensity, NSNumber *, ABI37_0_0EXBlurView)
{
  [view setIntensity:value];
  [view didSetProps:@[@"intensity"]];
}

ABI37_0_0UM_EXPORT_METHOD_AS(updateProps,
                    updateProps:(NSDictionary *)props
                    onViewOfId:(id)viewId
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI37_0_0UMPromiseRejectBlock)rejecter)
{
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMUIManager)] executeUIBlock:^(id view) {
    if ([view isKindOfClass:[ABI37_0_0EXBlurView class]]) {
      ABI37_0_0EXBlurView *blurView = view;
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
  } forView:viewId ofClass:[ABI37_0_0EXBlurView class]];
}

@end
