// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.internal;

import org.json.JSONException;

import java.io.UnsupportedEncodingException;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.storage.AsyncStorageModule;
import com.facebook.react.modules.storage.ReactDatabaseSupplier;

import expo.modules.manifests.core.Manifest;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.kernel.KernelProvider;

@ReactModule(name = ExponentAsyncStorageModule.NAME, canOverrideExistingModule = true)
public class ExponentAsyncStorageModule extends AsyncStorageModule {

  public static String experienceKeyToDatabaseName(ExperienceKey experienceKey) throws UnsupportedEncodingException {
    return "RKStorage-scoped-experience-" + experienceKey.getUrlEncodedScopeKey();
  }

  public ExponentAsyncStorageModule(ReactApplicationContext reactContext, Manifest manifest) {
    super(reactContext);

    try {
      ExperienceKey experienceKey = ExperienceKey.fromManifest(manifest);
      String databaseName = experienceKeyToDatabaseName(experienceKey);
      mReactDatabaseSupplier = new ReactDatabaseSupplier(reactContext, databaseName);
    } catch (JSONException e) {
      KernelProvider.getInstance().handleError("Requires Experience Id");
    } catch (UnsupportedEncodingException e) {
      KernelProvider.getInstance().handleError("Couldn't URL encode Experience Id");
    }
  }

  @Override
  public boolean canOverrideExistingModule() {
    return true;
  }
}
