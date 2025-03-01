// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXGoReactNativeFeatureFlags.h"

#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/featureflags/ReactNativeFeatureFlagsDefaults.h>

@implementation EXGoReactNativeFeatureFlags

class ExpoGoReactNativeFeatureFlags : public facebook::react::ReactNativeFeatureFlagsDefaults {
 public:
  bool useModernRuntimeScheduler() {
    return true;
  }
  bool enableMicrotasks() {
    return true;
  }
  bool batchRenderingUpdatesInEventLoop() {
    return true;
  }
  bool fuseboxEnabledRelease() override {
    return true;
  }
  bool enableBridgelessArchitecture() override
  {
    return true;
  }
  bool enableFabricRenderer() override
  {
    return true;
  }
  bool useTurboModules() override
  {
    return true;
  }
  bool useNativeViewConfigsInBridgelessMode() override
  {
    return true;
  }
};

+ (void)setup
{
  facebook::react::ReactNativeFeatureFlags::override(std::make_unique<ExpoGoReactNativeFeatureFlags>());
}

@end
