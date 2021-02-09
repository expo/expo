// Copyright 2020-present 650 Industries. All rights reserved.

package expo.modules.firebase.core;

import android.content.Context;

import androidx.annotation.Nullable;

import java.util.Map;
import java.util.HashMap;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;

public class FirebaseCoreModule extends ExportedModule {
  private static final String NAME = "ExpoFirebaseCore";
  private static final String DEFAULT_APP_NAME = "[DEFAULT]";

  private ModuleRegistry mModuleRegistry;
  private Map<String, String> mDefaultOptions;

  public FirebaseCoreModule(Context context) {
    super(context);
  }

  @Nullable
  public Map<String, Object> getConstants() {
    FirebaseCoreInterface firebaseCore = mModuleRegistry.getModule(FirebaseCoreInterface.class);
    FirebaseApp defaultApp = firebaseCore.getDefaultApp();

    final Map<String, Object> constants = new HashMap<>();
    constants.put("DEFAULT_APP_NAME", (defaultApp != null) ? defaultApp.getName() : DEFAULT_APP_NAME);

    if (mDefaultOptions == null) {
      FirebaseOptions options = (defaultApp != null) ? defaultApp.getOptions() : null;
      mDefaultOptions = FirebaseCoreOptions.toJSON(options);
    }

    if (mDefaultOptions != null) {
      constants.put("DEFAULT_APP_OPTIONS", mDefaultOptions);
    }

    return constants;
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }
}
