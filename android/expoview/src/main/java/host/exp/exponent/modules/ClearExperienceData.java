// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.modules;

import android.content.Context;

import org.apache.commons.io.FileUtils;
import com.facebook.react.modules.storage.ReactDatabaseSupplier;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.utils.ScopedContext;
import versioned.host.exp.exponent.modules.internal.ExponentAsyncStorageModule;

public class ClearExperienceData {

  private static final String TAG = ClearExperienceData.class.getSimpleName();

  public static void clear(Context context, String experienceId) {
    try {
      String databaseName = ExponentAsyncStorageModule.experienceIdToDatabaseName(experienceId);
      ReactDatabaseSupplier supplier = new ReactDatabaseSupplier(context, databaseName);
      supplier.clearAndCloseDatabase();
    } catch (UnsupportedEncodingException e) {
      EXL.e(TAG, e);
    }

    try {
      String experienceIdEncoded = URLEncoder.encode(experienceId, "UTF-8");
      ScopedContext scopedContext = new ScopedContext(context, experienceIdEncoded);
      FileUtils.deleteDirectory(scopedContext.getFilesDir());
      FileUtils.deleteDirectory(scopedContext.getCacheDir());
    } catch (IOException e) {
      EXL.e(TAG, e);
    }
  }
}
