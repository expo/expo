package expo.modules.webbrowser;

import android.content.ComponentName;
import android.content.Context;
import android.net.Uri;
import android.support.customtabs.CustomTabsClient;
import android.support.customtabs.CustomTabsServiceConnection;
import android.support.customtabs.CustomTabsSession;

import org.unimodules.core.interfaces.LifecycleEventListener;

public class CustomTabsConnectionHelper extends CustomTabsServiceConnection implements LifecycleEventListener {

  private Context mContext;
  private String mPackageName;
  private DeferredClientActionsQueue<CustomTabsClient> clientActions = new DeferredClientActionsQueue<>();
  private DeferredClientActionsQueue<CustomTabsSession> sessionActions = new DeferredClientActionsQueue<>();

  CustomTabsConnectionHelper(Context context) {
    this.mContext = context;
  }

  void warmUp(String packageName) {
    clientActions.executeOrQueueAction(client -> client.warmup(0));
    ensureConnection(packageName);
  }

  void mayInitWithUrl(String packageName, Uri uri) {
    sessionActions.executeOrQueueAction(session -> session.mayLaunchUrl(uri, null, null));
    ensureConnection(packageName);
    ensureSession();
  }

  private void ensureSession() {
    if (!sessionActions.hasClient()) {
      clientActions.executeOrQueueAction(
          client ->
              sessionActions.setClient(client.newSession(null)));
    }
  }

  boolean coolDown(String packageName) {
    if (packageName.equals(this.mPackageName)) {
      unbindService();
      return true;
    }
    return false;
  }

  private void ensureConnection(String packageName) {
    if (this.mPackageName != null && !this.mPackageName.equals(packageName)) {
      clearConnection();
    }
    if (!connectionStarted(packageName)) {
      CustomTabsClient.bindCustomTabsService(getContext(), packageName, this);
      this.mPackageName = packageName;
    }
  }

  private boolean connectionStarted(String packageName) {
    return packageName.equals(this.mPackageName);
  }

  @Override
  public void onBindingDied(ComponentName componentName) {
    if (componentName.getPackageName().equals(this.mPackageName)) {
      clearConnection();
    }
  }

  @Override
  public void onCustomTabsServiceConnected(ComponentName componentName, CustomTabsClient client) {
    if (componentName.getPackageName().equals(mPackageName)) {
      clientActions.setClient(client);
    }
  }

  @Override
  public void onServiceDisconnected(ComponentName componentName) {
    if (componentName.getPackageName().equals(this.mPackageName)) {
      clearConnection();
    }
  }

  @Override
  public void onHostResume() {
    // do nothing
  }

  @Override
  public void onHostPause() {
    // do nothing
  }

  @Override
  public void onHostDestroy() {
    unbindService();
  }

  private void unbindService() {
    getContext().unbindService(this);
    clearConnection();
  }

  private void clearConnection() {
    this.mPackageName = null;
    clientActions.clear();
    sessionActions.clear();
  }

  private Context getContext() {
    return mContext;
  }

}
