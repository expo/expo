package host.exp.exponent;

import android.os.Handler;

public class ExpoHandler {

  private Handler mHandler;

  public ExpoHandler(Handler handler) {
    mHandler = handler;
  }

  public boolean postDelayed(Runnable r, long delayMillis) {
    return mHandler.postDelayed(r, delayMillis);
  }

  public void removeCallbacks(Runnable r) {
    mHandler.removeCallbacks(r);
  }
}
