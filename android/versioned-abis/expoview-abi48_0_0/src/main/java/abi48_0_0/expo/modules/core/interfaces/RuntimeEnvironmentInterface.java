package abi48_0_0.expo.modules.core.interfaces;

public interface RuntimeEnvironmentInterface {
  String platformName();
  PlatformVersion platformVersion();

  interface PlatformVersion {
    int major();
    int minor();
    int patch();
    String prerelease();
  }
}
