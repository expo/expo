package expo.modules.sharing;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.support.v4.content.FileProvider;

import java.io.File;
import java.net.URLConnection;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.arguments.ReadableArguments;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;

public class SharingModule extends ExportedModule implements ModuleRegistryConsumer {
  private static final String TAG = "ExpoSharing";
  private static final String MIME_TYPE_OPTIONS_KEY = "mimeType";

  private ModuleRegistry mModuleRegistry;
  private Context mContext;

  public SharingModule(Context context) {
    super(context);
    mContext = context;
  }

  @Override
  public String getName() {
    return TAG;
  }
  public ModuleRegistry getModuleRegistry() {
    return mModuleRegistry;
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @ExpoMethod
  public void shareAsync(String url, ReadableArguments params, final Promise promise) {
    Intent intent = new Intent(Intent.ACTION_SEND);
    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

    Uri uri = Uri.parse(url);
    String path = uri.getPath();

    if (path == null) {
      promise.reject(new Error(("Url is not valid")));
      return;
    }

    File file = new File(path);

    boolean localFile = "file".equals(uri.getScheme());

    if (!localFile) {
      promise.reject(new Error(("Only local files are supported")));
      return;
    }

    try {
      uri = FileProvider.getUriForFile(mContext, mContext.getApplicationInfo().packageName + ".provider", file);
    } catch (Exception e) {
      promise.reject(e);
      return;
    }


    String mimeType = params.getString(MIME_TYPE_OPTIONS_KEY);

    if (mimeType == null) {
      String guessedMimeType = URLConnection.guessContentTypeFromName(file.getName());
      if (guessedMimeType != null) {
        mimeType = guessedMimeType;
      } else {
        mimeType = "*/*";
      }
    }

    intent.setType(mimeType);
    intent.putExtra(Intent.EXTRA_STREAM, uri);
    mContext.startActivity(Intent.createChooser(intent, "Share to"));
  }
}
