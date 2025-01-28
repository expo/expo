// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXGoReactNativeFeatureFlags.h"

#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/featureflags/ReactNativeFeatureFlagsDefaults.h>

@implementation EXGoReactNativeFeatureFlags

class ExpoGoReactNativeFeatureFlags : public facebook::react::ReactNativeFeatureFlagsDefaults {
 public:
  bool useModernRuntimeScheduler() override {
    return true;
  }
  bool enableMicrotasks() override {
    return true;
  }
  bool batchRenderingUpdatesInEventLoop() override {
    return true;
  }
  bool fuseboxEnabledRelease() override {
    return true;
  }
};

+ (void)setup
{
  facebook::react::ReactNativeFeatureFlags::override(std::make_unique<ExpoGoReactNativeFeatureFlags>());
}

@end
