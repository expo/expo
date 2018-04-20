package host.exp.exponent.kernel.services;

import android.content.Context;

import org.json.JSONException;
import org.json.JSONObject;

import host.exp.exponent.Constants;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.storage.ExponentSharedPreferences;

public class PermissionsKernelService extends BaseKernelService {

  ExponentSharedPreferences mExponentSharedPreferences;

  public PermissionsKernelService(Context context, ExponentSharedPreferences exponentSharedPreferences) {
    super(context);
    mExponentSharedPreferences = exponentSharedPreferences;
  }

  public void grantPermissions(String permission, ExperienceId experienceId) {
    try {
      JSONObject metadata = mExponentSharedPreferences.getExperienceMetadata(experienceId.get());
      if (metadata == null) {
        metadata = new JSONObject();
      }

      JSONObject permissions;
      if (metadata.has(ExponentSharedPreferences.EXPERIENCE_METADATA_PERMISSIONS)) {
        permissions = metadata.getJSONObject(ExponentSharedPreferences.EXPERIENCE_METADATA_PERMISSIONS);
      } else {
        permissions = new JSONObject();
      }

      JSONObject permissionObject;
      if (permissions.has(permission)) {
        permissionObject = permissions.getJSONObject(permission);
      } else {
        permissionObject = new JSONObject();
      }

      permissionObject.put("status", "granted");
      permissions.put(permission, permissionObject);
      metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_PERMISSIONS, permissions);

      mExponentSharedPreferences.updateExperienceMetadata(experienceId.get(), metadata);
    } catch (JSONException e) {
      e.printStackTrace();
    }
  }

  public void revokePermissions(String permission, ExperienceId experienceId) {
    try {
      JSONObject metadata = mExponentSharedPreferences.getExperienceMetadata(experienceId.get());
      if (metadata == null) {
        return;
      }

      if (metadata.has(ExponentSharedPreferences.EXPERIENCE_METADATA_PERMISSIONS)) {
        JSONObject permissions = metadata.getJSONObject(ExponentSharedPreferences.EXPERIENCE_METADATA_PERMISSIONS);
        if (permissions.has(permission)) {
          permissions.remove(permission);
          metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_PERMISSIONS, permissions);
          mExponentSharedPreferences.updateExperienceMetadata(experienceId.get(), metadata);
        }
      }
    } catch (JSONException e) {
      e.printStackTrace();
    }
  }

  public boolean hasGrantedPermissions(String permission, ExperienceId experienceId) {
    // we don't want to worry about per-experience permissions for shell apps
    if (Constants.isShellApp()) {
      return true;
    }
    JSONObject metadata = mExponentSharedPreferences.getExperienceMetadata(experienceId.get());
    if (metadata == null) {
      return false;
    }
    try {
      if (metadata.has(ExponentSharedPreferences.EXPERIENCE_METADATA_PERMISSIONS)) {
        JSONObject permissions = metadata.getJSONObject(ExponentSharedPreferences.EXPERIENCE_METADATA_PERMISSIONS);
        if (permissions.has(permission)) {
          JSONObject permissionsObject = permissions.getJSONObject(permission);
          return permissionsObject.has("status") &&
              permissionsObject.getString("status").equals("granted");
        }
      }
    } catch (JSONException e) {
      e.printStackTrace();
    }
    return false;
  }

  @Override
  public void onExperienceForegrounded(ExperienceId experienceId) {

  }

  @Override
  public void onExperienceBackgrounded(ExperienceId experienceId) {

  }
}
