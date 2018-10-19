package expo.modules.ar;

import android.Manifest;
import android.content.pm.PackageManager;

import com.google.ar.core.ArCoreApk;
import com.google.ar.core.exceptions.*;

import expo.core.ModuleRegistry;
import expo.core.interfaces.ActivityProvider;
import expo.interfaces.permissions.Permissions;

public class ARDependenciesHelper {
  private final ModuleRegistry mModuleRegistry;
  private final Permissions mPermissionsManager;
  private boolean mShouldRequestARCoreInstall = true;

  ARDependenciesHelper(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
    mPermissionsManager = mModuleRegistry.getModule(Permissions.class);
  }

  public void ensureARCoreInstalled() throws IllegalStateException {
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    if (activityProvider == null) {
      throw new IllegalStateException("ActivityProvider is not reachable. Are you sure all the installed Expo modules are properly linked?");
    }
    try {
      ArCoreApk.InstallStatus installStatus = (ArCoreApk.getInstance().requestInstall(activityProvider.getCurrentActivity(), !mShouldRequestARCoreInstall));
      if (installStatus == ArCoreApk.InstallStatus.INSTALL_REQUESTED) {
        mShouldRequestARCoreInstall = false;
        throw new IllegalStateException("ARCore is not installed on this device.");
      }
    } catch (UnavailableUserDeclinedInstallationException e) {
      throw new IllegalStateException("ARCore is not installed. Please install latest ARCore", e);
    } catch (SecurityException e) {
      throw new IllegalStateException(e.getMessage(), e);
    } catch (UnavailableDeviceNotCompatibleException e) {
      throw new IllegalStateException("AR is not supported on this device.", e);
    }
  }

  public void ensureCameraPermissionsGranted() throws IllegalStateException {
    if (mPermissionsManager == null) {
      throw new IllegalStateException("Permissions module is not available. Are you sure all the installed Expo modules are properly linked?");
    }

    int grantResult = mPermissionsManager.getPermission(Manifest.permission.CAMERA);
    if (grantResult != PackageManager.PERMISSION_GRANTED) {
      throw new IllegalStateException("Camera permission is not granted. Ensure that user permits Camera usage via permissions module.");
    }
  }
}
