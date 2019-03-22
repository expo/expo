// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentPagerAdapter;
import androidx.viewpager.widget.PagerAdapter;
import androidx.viewpager.widget.ViewPager;

import javax.inject.Inject;

import java.util.LinkedList;

import butterknife.BindView;
import butterknife.ButterKnife;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.Constants;
import host.exp.exponent.LauncherActivity;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExponentError;
import host.exp.expoview.R;
import host.exp.exponent.kernel.Kernel;
import host.exp.expoview.R2;

public class ErrorActivity extends FragmentActivity {

  public static final String IS_HOME_KEY = "isHome";
  public static final String MANIFEST_URL_KEY = "manifestUrl";
  public static final String USER_ERROR_MESSAGE_KEY = "userErrorMessage";
  public static final String DEVELOPER_ERROR_MESSAGE_KEY = "developerErrorMessage";
  public static final String DEBUG_MODE_KEY = "isDebugModeEnabled";

  private static ErrorActivity sVisibleActivity;

  private static LinkedList<ExponentError> sErrorList = new LinkedList<>();

  @BindView(R2.id.error_viewPager) ViewPager mPager;
  private PagerAdapter mPagerAdapter;
  private static ErrorConsoleFragment mErrorConsoleFragment;

  private String mManifestUrl;

  @Inject
  Context mContext;

  @Inject
  Kernel mKernel;

  public static ErrorActivity getVisibleActivity() {
    return sVisibleActivity;
  }

  public Context getContext() {
    return mContext;
  }

  public static void addError(ExponentError error) {
    synchronized (sErrorList) {
      sErrorList.addFirst(error);
    }
    // notify ErrorConsoleFragment of the update so that it can refresh its ListView
    if (sVisibleActivity != null && mErrorConsoleFragment != null) {
      sVisibleActivity.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          if (mErrorConsoleFragment.mAdapter != null) {
            mErrorConsoleFragment.mAdapter.notifyDataSetChanged();
          }
        }
      });
    }
  }

  public static void clearErrorList() {
    synchronized (sErrorList) {
      sErrorList.clear();
    }
  }

  public static LinkedList<ExponentError> getErrorList() {
    return sErrorList;
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.error_activity_new);
    ButterKnife.bind(this);

    NativeModuleDepsProvider.getInstance().inject(ErrorActivity.class, this);

    ExperienceActivity.removeNotification(this);

    Bundle bundle = getIntent().getExtras();
    mManifestUrl = bundle.getString(MANIFEST_URL_KEY);
    if (mManifestUrl == null && Constants.INITIAL_URL != null) {
      mManifestUrl = Constants.INITIAL_URL;
    }

    mPagerAdapter = new ViewPagerAdapter(getSupportFragmentManager());
    mPager.setAdapter(mPagerAdapter);
  }

  @Override
  protected void onResume() {
    super.onResume();

    sVisibleActivity = this;
    Analytics.logEventWithManifestUrl(Analytics.ERROR_APPEARED, mManifestUrl);
  }

  @Override
  protected void onPause() {
    super.onPause();

    if (sVisibleActivity == this) {
      sVisibleActivity = null;
    }
  }

  @Override
  public void onBackPressed() {
    if (mPager.getCurrentItem() == 0) {
      mKernel.killActivityStack(this);
    } else {
      mPager.setCurrentItem(mPager.getCurrentItem() - 1);
    }
  }

  public void onClickHome() {
    clearErrorList();

    Intent intent = new Intent(this, LauncherActivity.class);
    startActivity(intent);

    // Mark as not visible so that any new errors go to a new activity.
    if (sVisibleActivity == this) {
      sVisibleActivity = null;
    }

    mKernel.killActivityStack(this);
  }

  public void onClickReload() {
    if (mManifestUrl != null) {
      clearErrorList();

      // Mark as not visible so that any new errors go to a new activity.
      if (sVisibleActivity == this) {
        sVisibleActivity = null;
      }

      mKernel.killActivityStack(this);
      mKernel.reloadVisibleExperience(mManifestUrl);
    } else {
      // Mark as not visible so that any new errors go to a new activity.
      if (sVisibleActivity == this) {
        sVisibleActivity = null;
      }

      finish();
    }
  }

  public void onClickViewErrorLog() {
    if (mPager != null && mPager.getCurrentItem() == 0) {
      mPager.setCurrentItem(1);
    }
  }

  private class ViewPagerAdapter extends FragmentPagerAdapter {

    public ViewPagerAdapter(FragmentManager fm) {
      super(fm);
    }

    @Override
    public Fragment getItem(int pos) {
      Bundle args = getIntent().getExtras();
      args.putString("manifestUrl", mManifestUrl);
      switch (pos) {
        case 1:
          mErrorConsoleFragment = new ErrorConsoleFragment();
          mErrorConsoleFragment.setArguments(args);
          return mErrorConsoleFragment;
        case 0:
        default:
          Fragment errorFragment = new ErrorFragment();
          errorFragment.setArguments(args);
          return errorFragment;
      }
    }

    @Override
    public int getCount() {
      return 2;
    }
  }
}
