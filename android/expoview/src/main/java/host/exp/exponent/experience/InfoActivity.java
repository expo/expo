// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.content.Context;
import android.graphics.Bitmap;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import org.json.JSONException;
import org.json.JSONObject;

import javax.inject.Inject;

import butterknife.BindView;
import butterknife.ButterKnife;
import butterknife.OnClick;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.modules.ClearExperienceData;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.expoview.R;
import host.exp.expoview.R2;

public class InfoActivity extends AppCompatActivity {

  private static final String TAG = InfoActivity.class.getSimpleName();

  public static final String MANIFEST_URL_KEY = "manifestUrl";

  private String mManifestUrl;
  private JSONObject mManifest;
  private String mExperienceId;
  private boolean isShowingManifest = false;

  @BindView(R2.id.toolbar) Toolbar mToolbar;
  @BindView(R2.id.app_icon_small) ImageView mImageView;
  @BindView(R2.id.app_name) TextView mAppNameView;
  @BindView(R2.id.experience_id) TextView mExperienceIdView;
  @BindView(R2.id.sdk_version) TextView mSdkVersionView;
  @BindView(R2.id.published_time) TextView mPublishedTimeView;
  @BindView(R2.id.is_verified) TextView mIsVerifiedView;
  @BindView(R2.id.manifest) TextView mManifestTextView;
  @BindView(R2.id.toggle_manifest) Button mToggleManifestButton;

  @Inject
  Context mContext;

  @Inject
  Kernel mKernel;

  @Inject
  ExponentManifest mExponentManifest;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    NativeModuleDepsProvider.getInstance().inject(InfoActivity.class, this);

    Bundle bundle = getIntent().getExtras();
    mManifestUrl = bundle.getString(MANIFEST_URL_KEY);
    if (mManifestUrl != null) {
      ExponentSharedPreferences.ManifestAndBundleUrl manifestAndBundleUrl = mExponentSharedPreferences.getManifest(mManifestUrl);
      if (manifestAndBundleUrl != null) {
         mManifest = manifestAndBundleUrl.manifest;
      }
    }

    setContentView(R.layout.info_activity);
    ButterKnife.bind(this);
    setSupportActionBar(mToolbar);

    getSupportActionBar().setDisplayHomeAsUpEnabled(true);
    getSupportActionBar().setDisplayShowHomeEnabled(true);

    if (mManifest != null) {
      mExperienceId = mManifest.optString(ExponentManifest.MANIFEST_ID_KEY);

      String iconUrlString = mManifest.optString(ExponentManifest.MANIFEST_ICON_URL_KEY);
      if (iconUrlString != null) {
        mExponentManifest.loadIconBitmap(iconUrlString, new ExponentManifest.BitmapListener() {
          @Override
          public void onLoadBitmap(Bitmap bitmap) {
            mImageView.setImageBitmap(bitmap);
          }
        });
      }

      mAppNameView.setText(mManifest.optString(ExponentManifest.MANIFEST_NAME_KEY, getString(R.string.info_app_name_placeholder)));
      mSdkVersionView.setText(getString(R.string.info_sdk_version, mManifest.optString(ExponentManifest.MANIFEST_SDK_VERSION_KEY)));
      mExperienceIdView.setText(getString(R.string.info_id, mExperienceId));
      mPublishedTimeView.setText(getString(R.string.info_published_time, mManifest.optString(ExponentManifest.MANIFEST_PUBLISHED_TIME_KEY)));
      mIsVerifiedView.setText(getString(R.string.info_is_verified, String.valueOf(mManifest.optBoolean(ExponentManifest.MANIFEST_IS_VERIFIED_KEY, false))));
    }
  }

  @Override
  public boolean onSupportNavigateUp() {
    onBackPressed();
    return true;
  }

  @OnClick(R2.id.clear_data)
  public void onClickClearData() {
    ClearExperienceData.clear(mContext, mExperienceId);
    mKernel.reloadVisibleExperience(mManifestUrl);
  }

  @OnClick(R2.id.toggle_manifest)
  public void onClickToggleManifest() {
    if (!isShowingManifest) {
      isShowingManifest = true;
      if (mManifestTextView != null) {
        try {
          mManifestTextView.setText(mManifest.toString(4));
        } catch (JSONException e) {
          EXL.e(TAG, "Could not stringify manifest: " + e.getMessage());
        }
      }
      mToggleManifestButton.setText(R.string.info_hide_manifest);
    } else {
      isShowingManifest = false;
      if (mManifestTextView != null) {
        mManifestTextView.setText("");
      }
      mToggleManifestButton.setText(R.string.info_show_manifest);
    }
  }
}
