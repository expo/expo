package versioned.host.exp.exponent.modules.api.screens;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.Nullable;
import androidx.appcompat.widget.Toolbar;
import androidx.fragment.app.Fragment;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;

public class ScreenFragment extends Fragment {

  protected Screen mScreenView;

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

  public Screen getScreen() {
    return mScreenView;
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    ((ReactContext) mScreenView.getContext())
            .getNativeModule(UIManagerModule.class)
            .getEventDispatcher()
            .dispatchEvent(new ScreenDismissedEvent(mScreenView.getId()));
  }
}
