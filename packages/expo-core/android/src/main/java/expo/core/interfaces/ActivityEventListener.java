package expo.core.interfaces;

import android.app.Activity;
import android.content.Intent;

public interface ActivityEventListener {
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data);
}
