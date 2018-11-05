package host.exp.exponent;

import android.os.Handler;

/*
 * Use this instead of directly doing `new Handler(Looper.getMainLooper())` so that we can
 * easily mock it out in tests.
 */
public class ExpoHandler {

  private Handler mHandler;

  public ExpoHandler(Handler handler) {
    mHandler = handler;
  }

  public boolean post(Runnable r) {
    return mHandler.post(r);
  }

  public boolean postDelayed(Runnable r, long delayMillis) {
    return mHandler.postDelayed(r, delayMillis);
  }

  public void removeCallbacks(Runnable r) {
    mHandler.removeCallbacks(r);
  }
}
