package expo.modules.adapters.react.services;

import com.facebook.react.modules.systeminfo.ReactNativeVersion;

import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.RuntimeEnvironmentInterface;

import java.util.Collections;
import java.util.List;
import java.util.Map;

public class RuntimeEnvironmentModule implements InternalModule, RuntimeEnvironmentInterface {

  @Override
  public List<? extends Class> getExportedInterfaces() {
    return Collections.singletonList(RuntimeEnvironmentInterface.class);
  }

  @Override
  public String platformName() {
    return "React Native";
  }

  @Override
  public RuntimeEnvironmentInterface.PlatformVersion platformVersion() {
    final Map<String, Object> version = ReactNativeVersion.VERSION;

    return new RuntimeEnvironmentInterface.PlatformVersion() {
      @Override
      public int major() {
        return (int) version.get("major");
      }

      @Override
      public int minor() {
        return (int) version.get("minor");
      }

      @Override
      public int patch() {
        return (int) version.get("patch");
      }

      @Override
      public String prerelease() {
        return (String) version.get("prerelease");
      }
    };
  }
}
