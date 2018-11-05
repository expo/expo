package host.exp.exponent.experience;

import android.app.Activity;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ListView;

import java.util.List;

import butterknife.BindView;
import butterknife.ButterKnife;
import butterknife.OnClick;
import host.exp.exponent.Constants;
import host.exp.exponent.kernel.ExponentError;
import host.exp.expoview.R;
import host.exp.expoview.R2;

public class ErrorConsoleFragment extends Fragment {

  public ArrayAdapter<ExponentError> mAdapter;

  @BindView(R2.id.console_home_button) View mHomeButton;
  @BindView(R2.id.list_view) ListView mListView;

  @OnClick(R2.id.console_home_button)
  public void onClickHome() {
    Activity activity = getActivity();
    if (activity instanceof ErrorActivity) {
      ((ErrorActivity) activity).onClickHome();
    }
  }

  @OnClick(R2.id.console_reload_button)
  public void onClickReload() {
    Activity activity = getActivity();
    if (activity instanceof ErrorActivity) {
      ((ErrorActivity) activity).onClickReload();
    }
  }

  @Override
  public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
    View view = inflater.inflate(R.layout.error_console_fragment, container, false);
    ButterKnife.bind(this, view);

    Bundle bundle = getArguments();
    String manifestUrl = bundle.getString(ErrorActivity.MANIFEST_URL_KEY);
    boolean isHomeError = bundle.getBoolean(ErrorActivity.IS_HOME_KEY, false);

    if (isHomeError || manifestUrl == null || manifestUrl.equals(Constants.INITIAL_URL)) {
      // Cannot go home in any of these cases
      mHomeButton.setVisibility(View.GONE);
    }

    List<ExponentError> errorQueue = ErrorActivity.getErrorList();
    synchronized (errorQueue) {
      ErrorQueueAdapter adapter = new ErrorQueueAdapter(getContext(), errorQueue);
      mListView.setAdapter(adapter);
      mAdapter = adapter;
    }
    return view;
  }
}
