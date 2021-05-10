package abi39_0_0.org.unimodules.adapters.react.services;

import abi39_0_0.com.facebook.react.modules.systeminfo.ReactNativeVersion;

import abi39_0_0.org.unimodules.core.interfaces.InternalModule;
import abi39_0_0.org.unimodules.core.interfaces.RuntimeEnvironmentInterface;

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
