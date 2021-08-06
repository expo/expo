// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.storage;

import androidx.annotation.NonNull;

import com.raizlabs.android.dbflow.annotation.Database;
import com.raizlabs.android.dbflow.config.FlowManager;
import com.raizlabs.android.dbflow.sql.language.CursorResult;
import com.raizlabs.android.dbflow.sql.language.SQLite;
import com.raizlabs.android.dbflow.structure.database.transaction.QueryTransaction;

import org.jetbrains.annotations.NotNull;
import org.json.JSONException;
import org.json.JSONObject;

import androidx.annotation.Nullable;
import androidx.annotation.WorkerThread;

import expo.modules.updates.manifest.ManifestFactory;
import expo.modules.updates.manifest.raw.RawManifest;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;

@Database(version = ExponentDB.VERSION)
public class ExponentDB {

  private static final String TAG = ExponentDB.class.getSimpleName();

  public interface ExperienceResultListener {
    void onSuccess(ExponentDBObject exponentDBObject);
    void onFailure();
  }

  public static final String NAME = "ExponentKernel";
  public static final int VERSION = 1;

  public static void saveExperience(ExponentDBObject exponentDBObject) {
    try {
      ExperienceDBObject experience = new ExperienceDBObject();
      experience.scopeKey = exponentDBObject.getManifest().getScopeKey();
      experience.manifestUrl = exponentDBObject.getManifestUrl();
      experience.bundleUrl = exponentDBObject.getBundleUrl();
      experience.manifest = exponentDBObject.getManifest().toString();
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
            try {
              listener.onSuccess(
                new ExponentDBObject(
                  experienceDBObject.manifestUrl,
                  ManifestFactory.INSTANCE.getRawManifestFromJson(new JSONObject(experienceDBObject.manifest)),
                  experienceDBObject.bundleUrl
                )
              );
            } catch (JSONException e) {
              listener.onFailure();
            }
          }
        }).execute();
  }

  @WorkerThread
  public static @Nullable ExponentDBObject experienceScopeKeyToExperienceSync(String experienceScopeKey) throws JSONException {
    ExperienceDBObject experienceDBObject = SQLite.select()
      .from(ExperienceDBObject.class)
      .where(ExperienceDBObject_Table.id.is(experienceScopeKey))
      .querySingle();
    if (experienceDBObject == null) {
      return null;
    }

    return new ExponentDBObject(
      experienceDBObject.manifestUrl,
      ManifestFactory.INSTANCE.getRawManifestFromJson(new JSONObject(experienceDBObject.manifest)),
      experienceDBObject.bundleUrl
    );
  }
}
