package host.exp.exponent.headless;

import android.os.Handler;
import android.os.Looper;

import host.exp.exponent.taskManager.AppRecordInterface;
import host.exp.exponent.RNObject;

public class HeadlessAppRecord implements AppRecordInterface {
  private RNObject mReactInstanceManager;

  public void setReactInstanceManager(RNObject reactInstanceManager) {
    mReactInstanceManager = reactInstanceManager;
  }

  public void invalidate() {
    if (mReactInstanceManager != null) {
      final RNObject reactInstanceManager = mReactInstanceManager;
      mReactInstanceManager = null;

      // `destroy` must be called on UI thread.
      new Handler(Looper.getMainLooper()).post(new Runnable() {
        @Override
        public void run() {
          if (reactInstanceManager.isNotNull()) {
            reactInstanceManager.call("destroy");
          }
        }
      });
    }
  }
}
