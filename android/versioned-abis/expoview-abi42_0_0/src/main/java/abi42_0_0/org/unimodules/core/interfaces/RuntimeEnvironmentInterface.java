package abi42_0_0.org.unimodules.core.interfaces;

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
