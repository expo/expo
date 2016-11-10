// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.modules;

import android.content.Context;

import com.facebook.react.modules.storage.ReactDatabaseSupplier;

import java.io.IOException;
import java.io.UnsupportedEncodingException;

import host.exp.exponent.analytics.EXL;
import versioned.host.exp.exponent.modules.api.FileSystemModule;
import versioned.host.exp.exponent.modules.internal.ExponentAsyncStorageModule;

public class ClearExperienceData {

  private static final String TAG = ClearExperienceData.class.getSimpleName();

  public static void clear(Context context, String experienceId, String manifestUrl) {
    try {
      String databaseName = ExponentAsyncStorageModule.experienceIdToDatabaseName(experienceId);
      ReactDatabaseSupplier supplier = new ReactDatabaseSupplier(context, databaseName);
      supplier.clearAndCloseDatabase();
    } catch (UnsupportedEncodingException e) {
      EXL.e(TAG, e);
    }

    try {
      FileSystemModule.clearDataForExperience(context, experienceId);
    } catch (IOException e) {
      EXL.e(TAG, e);
    }
  }
}
