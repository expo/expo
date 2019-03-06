package expo.modules.webbrowser;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.Bundle;

import java.util.List;

public class ChromeTabsManagerActivity extends Activity {
  static final int DISMISSED_CODE = 1;
  static final int UNSUPPORTED_INTENT_CODE = 2;
  static final String KEY_BROWSER_INTENT = "browserIntent";

  private boolean mOpened = false;

  public static Intent createStartIntent(Context context, Intent authIntent) {
    Intent intent = createBaseIntent(context);
    intent.putExtra(KEY_BROWSER_INTENT, authIntent);
    return intent;
  }

  public static Intent createDismissIntent(Context context) {
    Intent intent = createBaseIntent(context);
    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
    return intent;
  }

  private static Intent createBaseIntent(Context context) {
    return new Intent(context, ChromeTabsManagerActivity.class);
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // This activity gets opened in 2 different ways. If the extra KEY_BROWSER_INTENT is present we
    // start that intent and if it is not it means this activity was started with FLAG_ACTIVITY_CLEAR_TOP
    // in order to close the intent that was started previously so we just close this.
    if (getIntent().hasExtra(KEY_BROWSER_INTENT)) {
      PackageManager pm = getPackageManager();
      Intent browserIntent = getIntent().getParcelableExtra(KEY_BROWSER_INTENT);
      List<ResolveInfo> activities = pm.queryIntentActivities(browserIntent, 0);
      if (activities.size() > 0) {
        browserIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        startActivity(browserIntent);
      } else {
        setResult(UNSUPPORTED_INTENT_CODE);
        finish();
      }
    } else {
      finish();
    }
  }

  @Override
  protected void onResume() {
    super.onResume();

    // onResume will get called twice, the first time when the activity is created and a second
    // time if the user closes the chrome tabs activity. Knowing this we can detect if the user
    // dismissed the activity and send an event accordingly.
    if (!mOpened) {
      mOpened = true;
    } else {
      setResult(DISMISSED_CODE);
      finish();
    }
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
  }
}
