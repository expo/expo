package host.exp.exponent.experience;

import android.app.Activity;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import org.json.JSONObject;

import butterknife.BindString;
import butterknife.BindView;
import butterknife.ButterKnife;
import butterknife.OnClick;
import host.exp.exponent.Constants;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.analytics.EXL;
import host.exp.expoview.R;
import host.exp.expoview.R2;

public class ErrorFragment extends Fragment {

  private static String TAG = ErrorFragment.class.getSimpleName();

  @BindView(R2.id.error_message) TextView mErrorMessageView;
  @BindView(R2.id.home_button) View mHomeButton;
  @BindString(R2.string.error_default_client) String mDefaultError;
  @BindString(R2.string.error_default_shell) String mDefaultErrorShell;

  @OnClick(R2.id.home_button)
  public void onClickHome() {
    Activity activity = getActivity();
    if (activity instanceof ErrorActivity) {
      ((ErrorActivity) activity).onClickHome();
    }
  }

  @OnClick(R2.id.reload_button)
  public void onClickReload() {
    Activity activity = getActivity();
    if (activity instanceof ErrorActivity) {
      ((ErrorActivity) activity).onClickReload();
    }
  }

  @OnClick(R2.id.view_error_log)
  public void onClickViewErrorLog() {
    Activity activity = getActivity();
    if (activity instanceof ErrorActivity) {
      ((ErrorActivity) activity).onClickViewErrorLog();
    }
  }

  @Override
  public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
    View view = inflater.inflate(R.layout.error_fragment, container, false);
    ButterKnife.bind(this, view);

    Bundle bundle = getArguments();
    Boolean isDebugModeEnabled = bundle.getBoolean(ErrorActivity.DEBUG_MODE_KEY);
    String userErrorMessage = bundle.getString(ErrorActivity.USER_ERROR_MESSAGE_KEY);
    String developerErrorMessage = bundle.getString(ErrorActivity.DEVELOPER_ERROR_MESSAGE_KEY);
    String defaultErrorMessage = userErrorMessage;

    String manifestUrl = bundle.getString(ErrorActivity.MANIFEST_URL_KEY);
    boolean isHomeError = bundle.getBoolean(ErrorActivity.IS_HOME_KEY, false);
    boolean isShellApp = manifestUrl != null && manifestUrl.equals(Constants.INITIAL_URL);

    String userFacingErrorMessage = isShellApp ? mDefaultErrorShell : mDefaultError;
    if (defaultErrorMessage == null || defaultErrorMessage.length() == 0) {
      defaultErrorMessage = isDebugModeEnabled ? developerErrorMessage : userFacingErrorMessage;
    }

    try {
      JSONObject eventProperties = new JSONObject();
      eventProperties.put(Analytics.USER_ERROR_MESSAGE, userErrorMessage);
      eventProperties.put(Analytics.DEVELOPER_ERROR_MESSAGE, developerErrorMessage);
      eventProperties.put(Analytics.MANIFEST_URL, manifestUrl);
      Analytics.logEvent(Analytics.ERROR_SCREEN, eventProperties);
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
    }

    if (isHomeError || manifestUrl == null || manifestUrl.equals(Constants.INITIAL_URL)) {
      // Cannot go home in any of these cases
      mHomeButton.setVisibility(View.GONE);
    }

    mErrorMessageView.setText(defaultErrorMessage);

    EXL.e(TAG, "ErrorActivity message: " + defaultErrorMessage);

    return view;
  }
}
