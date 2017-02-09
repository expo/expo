// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.chrometabs;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.Nullable;

import de.greenrobot.event.EventBus;

/**
 * Manages the custom chrome tabs intent by detecting when it is dismissed by the user and allowing
 * to close it programmatically when needed.
 */
public class ChromeTabsManagerActivity extends Activity {

  public static class ChromeTabsDismissedEvent {}

  static final String KEY_BROWSER_INTENT = "browserIntent";

  private boolean mOpened = false;

  public static Intent createStartIntent(Context context, Intent authIntent) {
    Intent intent = createBaseIntent(context);
    intent.putExtra(KEY_BROWSER_INTENT, authIntent);
    intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);
    return intent;
  }

  public static Intent createDismissIntent(Context context) {
    Intent intent = createBaseIntent(context);
    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
    return intent;
  }

  private static Intent createBaseIntent(Context context) {
    return new Intent(context, ChromeTabsDismissedEvent.class);
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // This activity gets opened in 2 different ways. If the extra KEY_BROWSER_INTENT is present we
    // start that intent and if it is not it means this activity was started with FLAG_ACTIVITY_CLEAR_TOP
    // in order to close the intent that was started previously so we just close this.
    if (getIntent().hasExtra(KEY_BROWSER_INTENT)) {
      Intent browserIntent = getIntent().getParcelableExtra(KEY_BROWSER_INTENT);
      browserIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
      startActivity(browserIntent);
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
      EventBus.getDefault().post(new ChromeTabsDismissedEvent());
      finish();
    }
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
  }
}