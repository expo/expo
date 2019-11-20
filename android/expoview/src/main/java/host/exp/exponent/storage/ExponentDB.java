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

  public static void saveExperience(String manifestUrl, JSONObject manifest, String bundleUrl) {
    try {
      ExperienceDBObject experience = new ExperienceDBObject();
      experience.id = manifest.getString(ExponentManifest.MANIFEST_ID_KEY);
      experience.manifestUrl = manifestUrl;
      experience.bundleUrl = bundleUrl;
      experience.manifest = manifest.toString();
      FlowManager.getDatabase(ExponentDB.class).getTransactionManager().getSaveQueue().add(experience);
    } catch (JSONException e) {
      EXL.e(TAG, e.getMessage());
    }
  }

  public static void experienceIdToExperience(String experienceId, final ExperienceResultListener listener) {
    SQLite.select()
        .from(ExperienceDBObject.class)
        .where(ExperienceDBObject_Table.id.is(experienceId))
        .async()
        .queryResultCallback(new QueryTransaction.QueryResultCallback<ExperienceDBObject>() {
          @Override
          public void onQueryResult(QueryTransaction<ExperienceDBObject> transaction, @NonNull CursorResult<ExperienceDBObject> tResult) {
            if (tResult.getCount() == 0) {
              listener.onFailure();
            } else {
              listener.onSuccess(tResult.getItem(0));
            }
          }
        }).execute();
  }
}
