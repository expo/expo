package expo.modules.updates;

import android.content.Context;

import androidx.annotation.Nullable;

import org.json.JSONObject;

import java.io.File;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import expo.modules.updates.db.entity.UpdateEntity;

public interface UpdatesDevClientInterface {

  interface FetchCallback {
    void onFailure(Exception e);
    void onSuccess();
    void onProgress(int downloadedAssets, int totalAssets);
  }

  interface ReloadCallback {
    void onFailure(Exception e);
    void onSuccess();
  }

  interface Update {
    UUID getID();
    Date getPublishedDate();
    File getBundlePath();
    @Nullable JSONObject getManifest();
  }

  List<Update> getAvailableUpdates(Context context);
  void fetchUpdateWithConfiguration(UpdatesConfiguration configuration, Context context, FetchCallback callback);
  void reload(Context context, ReloadCallback callback);
  void setCurrentUpdate(Update update);
}
