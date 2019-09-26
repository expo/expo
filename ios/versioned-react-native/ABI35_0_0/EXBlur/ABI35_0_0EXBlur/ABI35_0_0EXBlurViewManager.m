// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI35_0_0EXBlur/ABI35_0_0EXBlurView.h>
#import <ABI35_0_0EXBlur/ABI35_0_0EXBlurViewManager.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMUIManager.h>

@interface ABI35_0_0EXBlurViewManager ()

@property (weak, nonatomic) ABI35_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI35_0_0EXBlurViewManager

ABI35_0_0UM_EXPORT_MODULE(ExpoBlurViewManager);

- (void)setModuleRegistry:(ABI35_0_0UMModuleRegistry *)moduleRegistry {
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [[ABI35_0_0EXBlurView alloc] init];
}

- (NSString *)viewName
{
  return @"ExpoBlurView";
}

ABI35_0_0UM_VIEW_PROPERTY(tint, NSString *, ABI35_0_0EXBlurView)
{
  [view setTint:value];
  [view didSetProps:@[@"tint"]];
}

ABI35_0_0UM_VIEW_PROPERTY(intensity, NSNumber *, ABI35_0_0EXBlurView)
{
  [view setIntensity:value];
  [view didSetProps:@[@"intensity"]];
}

ABI35_0_0UM_EXPORT_METHOD_AS(updateProps,
                    updateProps:(NSDictionary *)props
                    onViewOfId:(id)viewId
                    resolve:(ABI35_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI35_0_0UMPromiseRejectBlock)rejecter)
{
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI35_0_0UMUIManager)] executeUIBlock:^(id view) {
    if ([view isKindOfClass:[ABI35_0_0EXBlurView class]]) {
      ABI35_0_0EXBlurView *blurView = view;
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
  } forView:viewId ofClass:[ABI35_0_0EXBlurView class]];
}

@end
