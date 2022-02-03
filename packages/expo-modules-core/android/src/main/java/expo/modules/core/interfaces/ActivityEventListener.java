package expo.modules.core.interfaces;

import android.app.Activity;
import android.content.Intent;

import androidx.annotation.Nullable;

public interface ActivityEventListener {
  public void onActivityResult(Activity activity, int requestCode, int resultCode, @Nullable Intent data);

  // Called when a new intent is passed to the activity
  public void onNewIntent(Intent intent);
}
