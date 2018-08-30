package versioned.host.exp.exponent.modules.universal;

import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.support.v4.content.ContextCompat;

import javax.inject.Inject;

import expo.modules.permissions.PermissionsService;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.ExpoKernelServiceRegistry;

/* package */ class PermissionsServiceBinding extends PermissionsService {
  @Inject
  protected ExpoKernelServiceRegistry mKernelServiceRegistry;

  private ExperienceId mExperienceId;

  /* package */ PermissionsServiceBinding(Context context, ExperienceId experienceId) {
    super(context);
    mExperienceId = experienceId;
    NativeModuleDepsProvider.getInstance().inject(PermissionsServiceBinding.class, this);
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
