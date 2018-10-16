package expo.modules.payments.stripe;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.util.Log;

/**
 * Created by remer on 11/8/17.
 */

public class RedirectUriReceiver extends Activity {
  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    Uri data = getIntent().getData();

    int tag = StripeModule.getLastTag();

    try {
      tag = Integer.parseInt(data.getHost());
    } catch (Exception e) {
      // do nothing
    }

    if (StripeModule.getInstance(tag) == null) {
      sendResult(RESULT_CANCELED);
    }

    StripeModule.getInstance(tag).processRedirect(getIntent().getData());
    sendResult(RESULT_OK);
  }

  private void sendResult(int resultCode) {
    setResult(resultCode);
    finish();
  }
}
