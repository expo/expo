// Copyright 2015-present 650 Industries. All rights reserved.

package abi42_0_0.host.exp.exponent;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;
import android.util.Pair;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.common.logging.FLog;
import abi42_0_0.com.facebook.hermes.reactexecutor.HermesExecutorFactory;
import abi42_0_0.com.facebook.react.ReactInstanceManager;
import abi42_0_0.com.facebook.react.ReactInstanceManagerBuilder;
import abi42_0_0.com.facebook.react.bridge.JavaScriptExecutorFactory;
import abi42_0_0.com.facebook.react.bridge.NativeModule;
import abi42_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi42_0_0.com.facebook.react.common.LifecycleState;
import abi42_0_0.com.facebook.react.common.ReactConstants;
import abi42_0_0.com.facebook.react.jscexecutor.JSCExecutorFactory;
import abi42_0_0.com.facebook.react.modules.systeminfo.AndroidInfoHelpers;
import abi42_0_0.com.facebook.react.packagerconnection.NotificationOnlyHandler;
import abi42_0_0.com.facebook.react.packagerconnection.RequestHandler;
import abi42_0_0.com.facebook.react.shell.MainReactPackage;

import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.lang.reflect.Field;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import host.exp.exponent.Constants;
import host.exp.exponent.RNObject;
import host.exp.exponent.experience.ExperienceActivity;
import host.exp.exponent.experience.ReactNativeActivity;
import host.exp.exponent.kernel.KernelProvider;
import host.exp.expoview.Exponent;
import abi42_0_0.host.exp.exponent.modules.api.reanimated.ReanimatedJSIModulePackage;

public class VersionedUtils {
  // Update this value when hermes-engine getting updated.
  // Currently there is no way to retrieve Hermes bytecode version from Java,
  // as an alternative, we maintain the version by hand.
  private static final int HERMES_BYTECODE_VERSION = 74;

  private static void toggleExpoDevMenu() {
    Activity currentActivity = Exponent.getInstance().getCurrentActivity();
    if (currentActivity instanceof ExperienceActivity) {
      ExperienceActivity reactNativeActivity = (ExperienceActivity) currentActivity;
      reactNativeActivity.toggleDevMenu();
    } else {
      FLog.e(ReactConstants.TAG, "Unable to toggle the Expo dev menu because the current activity could not be found.");
    }
  }

  private static void reloadExpoApp() {
    Activity currentActivity = Exponent.getInstance().getCurrentActivity();
    if (currentActivity instanceof ReactNativeActivity) {
      ReactNativeActivity reactNativeActivity = (ReactNativeActivity) currentActivity;
      reactNativeActivity.getDevSupportManager().callRecursive("reloadExpoApp");
    } else {
      FLog.e(ReactConstants.TAG, "Unable to reload the app because the current activity could not be found.");
    }
  }

  private static void toggleElementInspector() {
    Activity currentActivity = Exponent.getInstance().getCurrentActivity();
    if (currentActivity instanceof ReactNativeActivity) {
      ReactNativeActivity reactNativeActivity = (ReactNativeActivity) currentActivity;
      reactNativeActivity.getDevSupportManager().callRecursive("toggleElementInspector");
    } else {
      FLog.e(ReactConstants.TAG, "Unable to toggle the element inspector because the current activity could not be found.");
    }
  }

  private static void requestOverlayPermission(Context context) {
    // From the unexposed DebugOverlayController static helper
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      // Get permission to show debug overlay in dev builds.
      if (!Settings.canDrawOverlays(context)) {
        Intent intent =
          new Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:" + context.getPackageName()));
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        FLog.w(
          ReactConstants.TAG,
          "Overlay permissions needs to be granted in order for React Native apps to run in development mode");
        if (intent.resolveActivity(context.getPackageManager()) != null) {
          context.startActivity(intent);
        }
      }
    }
  }

  private static void togglePerformanceMonitor() {
    Activity currentActivity = Exponent.getInstance().getCurrentActivity();
    if (currentActivity instanceof ReactNativeActivity) {
      ReactNativeActivity reactNativeActivity = (ReactNativeActivity) currentActivity;
      RNObject devSettings = reactNativeActivity.getDevSupportManager().callRecursive("getDevSettings");

      if (devSettings != null) {
        boolean isFpsDebugEnabled = (boolean) devSettings.call("isFpsDebugEnabled");
        if (!isFpsDebugEnabled) {
          // Request overlay permission if needed when "Show Perf Monitor" option is selected
          requestOverlayPermission(currentActivity);
        }
        devSettings.call("setFpsDebugEnabled", !isFpsDebugEnabled);
      }
    } else {
      FLog.e(ReactConstants.TAG, "Unable to toggle the performance monitor because the current activity could not be found.");
    }
  }

  private static void toggleRemoteJSDebugging() {
    Activity currentActivity = Exponent.getInstance().getCurrentActivity();
    if (currentActivity instanceof ReactNativeActivity) {
      ReactNativeActivity reactNativeActivity = (ReactNativeActivity) currentActivity;
      RNObject devSettings = reactNativeActivity.getDevSupportManager().callRecursive("getDevSettings");
      if (devSettings != null) {
        boolean isRemoteJSDebugEnabled = (boolean) devSettings.call("isRemoteJSDebugEnabled");
        devSettings.call("setRemoteJSDebugEnabled", !isRemoteJSDebugEnabled);
      }
    } else {
      FLog.e(ReactConstants.TAG, "Unable to toggle remote JS debugging because the current activity could not be found.");
    }
  }

  private static Map<String, RequestHandler> createPackagerCommandHelpers() {
    // Attach listeners to the bundler's dev server web socket connection.
    // This enables tools to automatically reload the client remotely (i.e. in expo-cli).
    Map<String, RequestHandler> packagerCommandHandlers = new HashMap<>();

    // Enable a lot of tools under the same command namespace
    packagerCommandHandlers.put("sendDevCommand", new NotificationOnlyHandler() {
      @Override
      public void onNotification(@Nullable Object params) {
        if (params != null && params instanceof JSONObject) {
          JSONObject _params = (JSONObject) params;
          String name = _params.optString("name");
          if (name != null) {
            if (name.equals("reload")) {
              reloadExpoApp();
            } else if (name.equals("toggleDevMenu")) {
              toggleExpoDevMenu();
            } else if (name.equals("toggleRemoteDebugging")) {
              toggleRemoteJSDebugging();
              // Reload the app after toggling debugging, this is based on what we do in DevSupportManagerBase.
              reloadExpoApp();
            } else if (name.equals("toggleElementInspector")) {
              toggleElementInspector();
            } else if (name.equals("togglePerformanceMonitor")) {
              togglePerformanceMonitor();
            }
          }
        }
      }
    });

    // These commands (reload and devMenu) are here to match RN dev tooling.

    // Reload the app on "reload"
    packagerCommandHandlers.put("reload", new NotificationOnlyHandler() {
      @Override
      public void onNotification(@Nullable Object params) {
        reloadExpoApp();
      }
    });

    // Open the dev menu on "devMenu"
    packagerCommandHandlers.put("devMenu", new NotificationOnlyHandler() {
      @Override
      public void onNotification(@Nullable Object params) {
        toggleExpoDevMenu();
      }
    });

    return packagerCommandHandlers;
  }

  public static ReactInstanceManagerBuilder getReactInstanceManagerBuilder(Exponent.InstanceManagerBuilderProperties instanceManagerBuilderProperties) {

    // Build the instance manager
    ReactInstanceManagerBuilder builder = ReactInstanceManager.builder()
        .setApplication(instanceManagerBuilderProperties.getApplication())
        .setJSIModulesPackage((reactApplicationContext, jsContext) -> {
          RNObject devSupportManager = getDevSupportManager(reactApplicationContext);
          if (devSupportManager == null) {
            Log.e("Exponent", "Couldn't get the `DevSupportManager`. JSI modules won't be initialized.");
            return Collections.emptyList();
          }

          RNObject devSettings = devSupportManager.callRecursive("getDevSettings");
          boolean isRemoteJSDebugEnabled = devSettings != null && (boolean) devSettings.call("isRemoteJSDebugEnabled");
          if (!isRemoteJSDebugEnabled) {
            return new ReanimatedJSIModulePackage().getJSIModules(reactApplicationContext, jsContext);
          }

          return Collections.emptyList();
        })
        .addPackage(new MainReactPackage())
        .addPackage(new ExponentPackage(
                instanceManagerBuilderProperties.getExperienceProperties(),
                instanceManagerBuilderProperties.getManifest(),
                null, null,
                instanceManagerBuilderProperties.getSingletonModules()))
        .addPackage(new ExpoTurboPackage(
          instanceManagerBuilderProperties.getExperienceProperties(),
          instanceManagerBuilderProperties.getManifest()))
        .setInitialLifecycleState(LifecycleState.BEFORE_CREATE)
        .setCustomPackagerCommandHandlers(createPackagerCommandHelpers())
        .setJavaScriptExecutorFactory(createJSExecutorFactory(instanceManagerBuilderProperties));

    if (instanceManagerBuilderProperties.getJsBundlePath() != null && instanceManagerBuilderProperties.getJsBundlePath().length() > 0) {
      builder = builder.setJSBundleFile(instanceManagerBuilderProperties.getJsBundlePath());
    }

    return builder;
  }

  private static RNObject getDevSupportManager(ReactApplicationContext reactApplicationContext) {
    Activity currentActivity = Exponent.getInstance().getCurrentActivity();
    if (currentActivity != null) {
      if (currentActivity instanceof ReactNativeActivity) {
        ReactNativeActivity reactNativeActivity = (ReactNativeActivity) currentActivity;
        return reactNativeActivity.getDevSupportManager();
      } else {
        return null;
      }
    }

    try {
      NativeModule devSettingsModule = reactApplicationContext.getCatalystInstance().getNativeModule("DevSettings");
      Field devSupportManagerField = devSettingsModule.getClass().getDeclaredField("mDevSupportManager");
      devSupportManagerField.setAccessible(true);
      return RNObject.wrap(devSupportManagerField.get(devSettingsModule));
    } catch (Throwable e) {
      e.printStackTrace();
      return null;
    }
  }

  private static JavaScriptExecutorFactory createJSExecutorFactory(
          @NonNull final Exponent.InstanceManagerBuilderProperties instanceManagerBuilderProperties) {
    String appName = instanceManagerBuilderProperties.getManifest().getName();
    if (appName == null) {
      appName = "";
    }
    final String deviceName = AndroidInfoHelpers.getFriendlyDeviceName();

    if (Constants.isStandaloneApp()) {
      return new JSCExecutorFactory(appName, deviceName);
    }

    final Pair<Boolean, Integer> hermesBundlePair = parseHermesBundleHeader(instanceManagerBuilderProperties.getJsBundlePath());
    if (hermesBundlePair.first && hermesBundlePair.second != HERMES_BYTECODE_VERSION) {
      final String message = String.format(Locale.US,
              "Unable to load unsupported Hermes bundle.\n\tsupportedBytecodeVersion: %d\n\ttargetBytecodeVersion: %d",
              HERMES_BYTECODE_VERSION, hermesBundlePair.second);
      KernelProvider.getInstance().handleError(new RuntimeException(message));
      return null;
    }

    final String jsEngineFromManifest = instanceManagerBuilderProperties.getManifest().getAndroidJsEngine();
    return (jsEngineFromManifest != null && jsEngineFromManifest.equals("hermes"))
            ? new HermesExecutorFactory()
            : new JSCExecutorFactory(appName, deviceName);
  }

  @NonNull
  private static Pair<Boolean, Integer> parseHermesBundleHeader(@Nullable final String jsBundlePath) {
    if (jsBundlePath == null || jsBundlePath.length() == 0) {
      return Pair.create(false, 0);
    }

    // https://github.com/facebook/hermes/blob/release-v0.5/include/hermes/BCGen/HBC/BytecodeFileFormat.h#L24-L25
    final byte[] HERMES_MAGIC_HEADER = {
            (byte) 0xc6, (byte) 0x1f, (byte) 0xbc, (byte) 0x03,
            (byte) 0xc1, (byte) 0x03, (byte) 0x19, (byte) 0x1f };

    final File file = new File(jsBundlePath);
    try (final FileInputStream in = new FileInputStream(file)) {
      final byte[] bytes = new byte[12];
      in.read(bytes, 0, bytes.length);

      // Magic header
      for (int i = 0; i < HERMES_MAGIC_HEADER.length; ++i) {
        if (bytes[i] != HERMES_MAGIC_HEADER[i]) {
          return Pair.create(false, 0);
        }
      }

      // Bytecode version
      final int bundleBytecodeVersion = (bytes[11] << 24) | (bytes[10] << 16) | (bytes[9] << 8) | bytes[8];
      return Pair.create(true, bundleBytecodeVersion);
    } catch (FileNotFoundException e) {
    } catch (IOException e) {
    }

    return Pair.create(false, 0);
  }

  /* package */ static boolean isHermesBundle(@Nullable final String jsBundlePath) {
    return parseHermesBundleHeader(jsBundlePath).first;
  }

  /* package */ static int getHermesBundleBytecodeVersion(@Nullable final String jsBundlePath) {
    return parseHermesBundleHeader(jsBundlePath).second;
  }
}
