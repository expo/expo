package expo.modules.sharing;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Bundle;
import androidx.core.content.FileProvider;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.InvalidArgumentException;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.interfaces.ActivityEventListener;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.services.UIManager;
import org.unimodules.interfaces.filesystem.FilePermissionModuleInterface;
import org.unimodules.interfaces.filesystem.Permission;

import java.io.File;
import java.net.URLConnection;
import java.util.List;

public class SharingModule extends ExportedModule implements ActivityEventListener {
  private static final int REQUEST_CODE = 8524;
  private static final String TAG = "ExpoSharing";
  private static final String MIME_TYPE_OPTIONS_KEY = "mimeType";
  private static final String DIALOG_TITLE_OPTIONS_KEY = "dialogTitle";

  private ModuleRegistry mModuleRegistry;
  private Context mContext;
  private Promise mPendingPromise;

  public SharingModule(Context context) {
    super(context);
    mContext = context;
  }

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
    UIManager uiManager = mModuleRegistry.getModule(UIManager.class);
    uiManager.registerActivityEventListener(this);
  }

  @Override
  public void onDestroy() {
    UIManager uiManager = mModuleRegistry.getModule(UIManager.class);
    uiManager.unregisterActivityEventListener(this);

    mModuleRegistry = null;
  }

  @ExpoMethod
  public void shareAsync(String url, ReadableArguments params, final Promise promise) {
    if (mPendingPromise != null) {
      promise.reject("ERR_SHARING_MUL", "Another share request is being processed now.");
      return;
    }

    try {
      File fileToShare = getLocalFileFoUrl(url);
      Uri contentUri = FileProvider.getUriForFile(mContext, mContext.getApplicationInfo().packageName + ".SharingFileProvider", fileToShare);

      String mimeType = params.getString(MIME_TYPE_OPTIONS_KEY);
      if (mimeType == null) {
        String guessedMimeType = URLConnection.guessContentTypeFromName(fileToShare.getName());
        if (guessedMimeType != null) {
          mimeType = guessedMimeType;
        } else {
          mimeType = "*/*";
        }
      }

      Intent intent = Intent.createChooser(createSharingIntent(contentUri, mimeType), params.getString(DIALOG_TITLE_OPTIONS_KEY));

      List<ResolveInfo> resInfoList = mContext.getPackageManager().queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);

      for (ResolveInfo resolveInfo : resInfoList) {
        String packageName = resolveInfo.activityInfo.packageName;
        mContext.grantUriPermission(packageName, contentUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
      }

      mModuleRegistry.getModule(ActivityProvider.class).getCurrentActivity().startActivityForResult(intent, REQUEST_CODE);

      mPendingPromise = promise;
    } catch (InvalidArgumentException e) {
      promise.reject("ERR_SHARING_URL", e.getMessage(), e);
    } catch (Exception e) {
      promise.reject("ERR_SHARING", "Failed to share the file: " + e.getMessage(), e);
    }
  }

  private File getLocalFileFoUrl(String url) throws InvalidArgumentException {
    if (url == null) {
      throw new InvalidArgumentException("URL to share cannot be null.");
    }

    Uri uri = Uri.parse(url);
    if (uri.getPath() == null) {
      throw new InvalidArgumentException("Path component of the URL to share cannot be null.");
    }

    if (!"file".equals(uri.getScheme())) {
      throw new InvalidArgumentException("Only local file URLs are supported (expected scheme to be 'file', got '" + uri.getScheme() + "'.");
    }

    if (!isAllowedToRead(uri.getPath())) {
      throw new InvalidArgumentException("Not allowed to read file under given URL.");
    }

    return new File(uri.getPath());
  }

  private boolean isAllowedToRead(String url) {
    if (mModuleRegistry != null) {
      FilePermissionModuleInterface permissionModuleInterface = mModuleRegistry.getModule(FilePermissionModuleInterface.class);
      if (permissionModuleInterface != null) {
        return permissionModuleInterface.getPathPermissions(mContext, url).contains(Permission.READ);
      }
    }
    return true;
  }

  protected Intent createSharingIntent(Uri uri, String mimeType) {
    Intent intent = new Intent(Intent.ACTION_SEND);
    intent.putExtra(Intent.EXTRA_STREAM, uri);
    intent.setTypeAndNormalize(mimeType);
    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    return intent;
  }

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
    if (requestCode == REQUEST_CODE && mPendingPromise != null) {
      mPendingPromise.resolve(Bundle.EMPTY);
      mPendingPromise = null;
    }
  }

  @Override
  public void onNewIntent(Intent intent) {
    // do nothing
  }
}
