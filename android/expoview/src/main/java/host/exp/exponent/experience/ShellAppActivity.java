// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.os.Bundle;

import org.json.JSONException;
import org.json.JSONObject;

import host.exp.exponent.Constants;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.kernel.ExponentUrls;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.expoview.Exponent;

public class ShellAppActivity extends ExperienceActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    mExponentManifest.fetchManifest(Constants.INITIAL_URL, new ExponentManifest.ManifestListener() {
      @Override
      public void onCompleted(final JSONObject manifest) {
        Exponent.getInstance().runOnUiThread(new Runnable() {
          @Override
          public void run() {
            try {
              String bundleUrl = ExponentUrls.toHttp(manifest.getString("bundleUrl"));
              JSONObject opts = new JSONObject();
              opts.put(KernelConstants.OPTION_LOAD_NUX_KEY, false);

              loadExperience(Constants.INITIAL_URL, manifest, bundleUrl, opts);
            } catch (JSONException e) {
              mKernel.handleError(e);
            }
          }
        });
      }

      @Override
      public void onError(Exception e) {
        mKernel.handleError(e);
      }

      @Override
      public void onError(String e) {
        mKernel.handleError(e);
      }
    });
  }
}

