package abi29_0_0.host.exp.exponent.modules.universal;

import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.support.v4.content.ContextCompat;

import java.util.Collections;
import java.util.List;

import javax.inject.Inject;

import abi29_0_0.expo.core.interfaces.InternalModule;
import abi29_0_0.expo.interfaces.permissions.Permissions;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.ExpoKernelServiceRegistry;

/* package */ class PermissionsBinding implements InternalModule, Permissions {
  @Inject
  protected ExpoKernelServiceRegistry mKernelServiceRegistry;

  private Context mContext;
  private ExperienceId mExperienceId;

  /* package */ PermissionsBinding(Context context, ExperienceId experienceId) {
    mContext = context;
    mExperienceId = experienceId;
    NativeModuleDepsProvider.getInstance().inject(PermissionsBinding.class, this);
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(Permissions.class);
  }

  @Override
  public int[] getPermissions(String[] permissions) {
    int[] permissionsResults = new int[permissions.length];
    for (int i = 0; i < permissions.length; i++) {
      permissionsResults[i] = getPermission(permissions[i]);
    }
    return permissionsResults;
  }

  @Override
  public int getPermission(String permission) {
    int globalResult = PackageManager.PERMISSION_GRANTED;

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      globalResult = ContextCompat.checkSelfPermission(mContext, permission);
    }

    if (globalResult == PackageManager.PERMISSION_GRANTED &&
        mKernelServiceRegistry.getPermissionsKernelService().hasGrantedPermissions(permission, mExperienceId)) {
      return PackageManager.PERMISSION_GRANTED;
    } else {
      return PackageManager.PERMISSION_DENIED;
    }
  }
}
