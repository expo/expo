// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

// Implement for each version.
public class MultipleVersionReactNativeActivity extends ReactNativeActivity implements
    // The 4-space indentation is used by android-build-aar.sh.
    // WHEN_DISTRIBUTING_REMOVE_FROM_HERE
    // WHEN_PREPARING_SHELL_REMOVE_FROM_HERE
    // BEGIN_SDK_41
    abi41_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler,
    abi41_0_0.com.facebook.react.modules.core.PermissionAwareActivity,
    // END_SDK_41
    // BEGIN_SDK_42
    abi42_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler,
    abi42_0_0.com.facebook.react.modules.core.PermissionAwareActivity,
    // END_SDK_42
    // BEGIN_SDK_43
    abi43_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler,
    abi43_0_0.com.facebook.react.modules.core.PermissionAwareActivity,
    // END_SDK_43
    // BEGIN_SDK_44
    abi44_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler,
    abi44_0_0.com.facebook.react.modules.core.PermissionAwareActivity,
    // END_SDK_44
    // ADD_NEW_SDKS_HERE
    // WHEN_PREPARING_SHELL_REMOVE_TO_HERE
    // WHEN_DISTRIBUTING_REMOVE_TO_HERE
    com.facebook.react.modules.core.DefaultHardwareBackBtnHandler {

    // WHEN_DISTRIBUTING_REMOVE_FROM_HERE
    // WHEN_PREPARING_SHELL_REMOVE_FROM_HERE
    // BEGIN_SDK_41
    @Override
    public void requestPermissions(String[] strings, int i, abi41_0_0.com.facebook.react.modules.core.PermissionListener permissionListener) {
      super.requestPermissions(strings, i, permissionListener::onRequestPermissionsResult);
    }
    // END_SDK_41
    // BEGIN_SDK_42
    @Override
    public void requestPermissions(String[] strings, int i, abi42_0_0.com.facebook.react.modules.core.PermissionListener permissionListener) {
      super.requestPermissions(strings, i, permissionListener::onRequestPermissionsResult);
    }
    // END_SDK_42
    // BEGIN_SDK_43
    @Override
    public void requestPermissions(String[] strings, int i, abi43_0_0.com.facebook.react.modules.core.PermissionListener permissionListener) {
      super.requestPermissions(strings, i, permissionListener::onRequestPermissionsResult);
    }
    // END_SDK_43
    // BEGIN_SDK_44
    @Override
    public void requestPermissions(String[] strings, int i, abi44_0_0.com.facebook.react.modules.core.PermissionListener permissionListener) {
      super.requestPermissions(strings, i, permissionListener::onRequestPermissionsResult);
    }
    // END_SDK_44
    // ADD_NEW_PERMISSION_AWARE_ACTIVITY_IMPLEMENTATION_HERE
    // WHEN_PREPARING_SHELL_REMOVE_TO_HERE
    // WHEN_DISTRIBUTING_REMOVE_TO_HERE
}
