package com.otabare.generated;

import java.util.Arrays;
import java.util.List;
import org.unimodules.core.interfaces.Package;

public class BasePackageList {
  public List<Package> getPackageList() {
    return Arrays.<Package>asList(
        new expo.modules.application.ApplicationPackage(),
        new expo.modules.constants.ConstantsPackage(),
        new expo.modules.device.DevicePackage(),
        new expo.modules.filesystem.FileSystemPackage(),
        new expo.modules.intentlauncher.IntentLauncherPackage(),
        new expo.modules.keepawake.KeepAwakePackage(),
        new expo.modules.lineargradient.LinearGradientPackage(),
        new expo.modules.localauthentication.LocalAuthenticationPackage(),
        new expo.modules.network.NetworkPackage(),
        new expo.modules.ota.OtaPackage(),
        new expo.modules.permissions.PermissionsPackage(),
        new expo.modules.random.RandomPackage(),
        new expo.modules.sharing.SharingPackage()
    );
  }
}
