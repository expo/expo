package abi30_0_0.host.exp.exponent.modules.api.screens;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

public class Screen extends ViewGroup {

  public static class ScreenFragment extends Fragment {

    private Screen mScreenView;

    public ScreenFragment() {
      throw new IllegalStateException("Screen fragments should never be restored");
    }

    @SuppressLint("ValidFragment")
    public ScreenFragment(Screen screenView) {
      super();
      mScreenView = screenView;
    }

    @Override
    public View onCreateView(LayoutInflater inflater,
                             @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
      return mScreenView;
    }
  }

  private final Fragment mFragment;
  private @Nullable ScreenContainer mContainer;
  private boolean mActive;

  public Screen(Context context) {
    super(context);
    mFragment = new ScreenFragment(this);
  }

  @Override
  protected void onLayout(boolean b, int i, int i1, int i2, int i3) {
    // no-op
  }

  protected void setContainer(@Nullable ScreenContainer mContainer) {
    this.mContainer = mContainer;
  }

  protected @Nullable ScreenContainer getContainer() {
    return mContainer;
  }

  protected Fragment getFragment() {
    return mFragment;
  }

  public void setActive(boolean active) {
    if (active == mActive) {
      return;
    }
    mActive = active;
    if (mContainer != null) {
      mContainer.notifyChildUpdate();
    }
  }

  public boolean isActive() {
    return mActive;
  }
}
