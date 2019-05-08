// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

// Implement for each version.
public class MultipleVersionReactNativeActivity extends ReactNativeActivity implements
    // The 4-space indentation is used by android-build-aar.sh.
    // WHEN_DISTRIBUTING_REMOVE_FROM_HERE
    // WHEN_PREPARING_SHELL_REMOVE_FROM_HERE
    // BEGIN_SDK_31
    abi31_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler,
    // END_SDK_31
    // BEGIN_SDK_32
    abi32_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler,
    // END_SDK_32
    // WHEN_PREPARING_SHELL_REMOVE_TO_HERE
    // WHEN_DISTRIBUTING_REMOVE_TO_HERE
    com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
{

}
