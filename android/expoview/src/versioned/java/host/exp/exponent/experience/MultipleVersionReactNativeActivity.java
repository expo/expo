// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

// Implement for each version.
public class MultipleVersionReactNativeActivity extends ReactNativeActivity implements
    // The 4-space indentation is used by android-build-aar.sh.
    // WHEN_DISTRIBUTING_REMOVE_FROM_HERE
    // WHEN_PREPARING_SHELL_REMOVE_FROM_HERE
    // BEGIN_SDK_47
    abi47_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler,
    abi47_0_0.com.facebook.react.modules.core.PermissionAwareActivity,
    // END_SDK_47
    // BEGIN_SDK_48
    abi48_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler,
    abi48_0_0.com.facebook.react.modules.core.PermissionAwareActivity,
    // END_SDK_48
    // ADD_NEW_SDKS_HERE
    // WHEN_PREPARING_SHELL_REMOVE_TO_HERE
    // WHEN_DISTRIBUTING_REMOVE_TO_HERE
    com.facebook.react.modules.core.DefaultHardwareBackBtnHandler {

    // WHEN_DISTRIBUTING_REMOVE_FROM_HERE
    // WHEN_PREPARING_SHELL_REMOVE_FROM_HERE
    // BEGIN_SDK_47
    @Override
    public void requestPermissions(String[] strings, int i, abi47_0_0.com.facebook.react.modules.core.PermissionListener permissionListener) {
      super.requestPermissions(strings, i, permissionListener::onRequestPermissionsResult);
    }
    // END_SDK_47
    // BEGIN_SDK_48
    @Override
    public void requestPermissions(String[] strings, int i, abi48_0_0.com.facebook.react.modules.core.PermissionListener permissionListener) {
      super.requestPermissions(strings, i, permissionListener::onRequestPermissionsResult);
    }
    // END_SDK_48
    // ADD_NEW_PERMISSION_AWARE_ACTIVITY_IMPLEMENTATION_HERE
    // WHEN_PREPARING_SHELL_REMOVE_TO_HERE
    // WHEN_DISTRIBUTING_REMOVE_TO_HERE
}
