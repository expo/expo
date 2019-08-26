// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.storage;

import com.raizlabs.android.dbflow.annotation.Database;
import com.raizlabs.android.dbflow.runtime.TransactionManager;
import com.raizlabs.android.dbflow.runtime.transaction.BaseTransaction;
import com.raizlabs.android.dbflow.runtime.transaction.SelectSingleModelTransaction;
import com.raizlabs.android.dbflow.runtime.transaction.TransactionListener;
import com.raizlabs.android.dbflow.sql.builder.Condition;

import org.json.JSONException;
import org.json.JSONObject;

import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;

@Database(name = ExponentDB.NAME, version = ExponentDB.VERSION)
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
      TransactionManager.getInstance().saveOnSaveQueue(experience);
    } catch (JSONException e) {
      EXL.e(TAG, e.getMessage());
    }
  }

  public static void experienceIdToExperience(String experienceId, final ExperienceResultListener listener) {
    TransactionManager.getInstance().addTransaction(new SelectSingleModelTransaction<>(ExperienceDBObject.class, new TransactionListener<ExperienceDBObject>() {
      @Override
      public void onResultReceived(ExperienceDBObject result) {
        if (result == null) {
          listener.onFailure();
        } else {
          listener.onSuccess(result);
        }
      }

      @Override
      public boolean onReady(BaseTransaction<ExperienceDBObject> transaction) {
        return true;
      }

      @Override
      public boolean hasResult(BaseTransaction<ExperienceDBObject> transaction, ExperienceDBObject result) {
        return true;
      }
    }, Condition.column(ExperienceDBObject$Table.ID).eq(experienceId)));
  }
}
