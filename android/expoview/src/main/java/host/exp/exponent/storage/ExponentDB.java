// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.storage;

import androidx.annotation.NonNull;

import com.raizlabs.android.dbflow.annotation.Database;
import com.raizlabs.android.dbflow.config.FlowManager;
import com.raizlabs.android.dbflow.sql.language.CursorResult;
import com.raizlabs.android.dbflow.sql.language.SQLite;
import com.raizlabs.android.dbflow.structure.database.transaction.QueryTransaction;

import org.json.JSONException;
import org.json.JSONObject;

import androidx.annotation.Nullable;
import androidx.annotation.WorkerThread;

import expo.modules.updates.manifest.raw.RawManifest;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;

@Database(version = ExponentDB.VERSION)
public class ExponentDB {

  private static final String TAG = ExponentDB.class.getSimpleName();

  public interface ExperienceResultListener {
    void onSuccess(ExperienceDBObject experience);
    void onFailure();
  }

  public static final String NAME = "ExponentKernel";
  public static final int VERSION = 1;

  public static void saveExperience(String manifestUrl, RawManifest manifest, String bundleUrl) {
    try {
      ExperienceDBObject experience = new ExperienceDBObject();
      experience.scopeKey = manifest.getScopeKey();
      experience.manifestUrl = manifestUrl;
      experience.bundleUrl = bundleUrl;
      experience.manifest = manifest.toString();
      FlowManager.getDatabase(ExponentDB.class).getTransactionManager().getSaveQueue().add(experience);
    } catch (JSONException e) {
      EXL.e(TAG, e.getMessage());
    }
  }

  public static void experienceScopeKeyToExperience(String experienceScopeKey, final ExperienceResultListener listener) {
    SQLite.select()
        .from(ExperienceDBObject.class)
        .where(ExperienceDBObject_Table.id.is(experienceScopeKey))
        .async()
        .querySingleResultCallback((transaction, experienceDBObject) -> {
          if (experienceDBObject == null) {
            listener.onFailure();
          } else {
            listener.onSuccess(experienceDBObject);
          }
        }).execute();
  }

  @WorkerThread
  public static @Nullable ExperienceDBObject experienceScopeKeyToExperienceSync(String experienceScopeKey) {
    return SQLite.select()
      .from(ExperienceDBObject.class)
      .where(ExperienceDBObject_Table.id.is(experienceScopeKey))
      .querySingle();
   }
}
