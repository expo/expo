#ifdef ABI48_0_0RN_FABRIC_ENABLED

#import <ABI48_0_0React/ABI48_0_0RCTFabricComponentsPlugins.h>

Class<ABI48_0_0RCTComponentViewProtocol> ABI48_0_0RNGestureHandlerRootViewCls(void)
{
  // ABI48_0_0RNGestureHandlerRootView is Android-only.
  // However, if we set `excludedPlatforms: ['iOS']` in `codegenNativeComponent`,
  // codegen still generates `ABI48_0_0RNGestureHandlerRootViewShadowNode` (which it shouldn't)
  // and thus the project fails to compile due to missing `ABI48_0_0RNGestureHandlerRootViewProps`.
  // As a workaround, we could set `interfaceOnly: true` to disable autogenerating ShadowNode
  // but then we would have to implement ComponentDescriptor and ShadowNode ourselves
  // (probably just generate it once and keep the generated files in the repo)
  // as well as make additional configuration so these files are actually compiled for Android.
  // This simple trick allows us to have all the necessary files generated
  // and compiled on Android while avoiding compilation errors on iOS.
  // TODO: remove this file once `excludedPlatforms` option properly disables generating ShadowNode
  return nil;
}

#endif // ABI48_0_0RN_FABRIC_ENABLED
