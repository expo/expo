#ifdef RN_FABRIC_ENABLED

#import <React/RCTFabricComponentsPlugins.h>

Class<RCTComponentViewProtocol> RNGestureHandlerRootViewCls(void)
{
  // RNGestureHandlerRootView is Android-only.
  // However, if we set `excludedPlatforms: ['iOS']` in `codegenNativeComponent`,
  // codegen still generates `RNGestureHandlerRootViewShadowNode` (which it shouldn't)
  // and thus the project fails to compile due to missing `RNGestureHandlerRootViewProps`.
  // As a workaround, we could set `interfaceOnly: true` to disable autogenerating ShadowNode
  // but then we would have to implement ComponentDescriptor and ShadowNode ourselves
  // (probably just generate it once and keep the generated files in the repo)
  // as well as make additional configuration so these files are actually compiled for Android.
  // This simple trick allows us to have all the necessary files generated
  // and compiled on Android while avoiding compilation errors on iOS.
  // TODO: remove this file once `excludedPlatforms` option properly disables generating ShadowNode
  return nil;
}

#endif // RN_FABRIC_ENABLED
