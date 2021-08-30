package expo.modules.webbrowser;

import android.content.ComponentName;
import android.content.Context;
import android.net.Uri;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsServiceConnection;
import androidx.browser.customtabs.CustomTabsSession;

import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.LifecycleEventListener;

import java.util.Collections;
import java.util.List;

public class InternalCustomTabsConnectionHelper extends CustomTabsServiceConnection implements LifecycleEventListener, CustomTabsConnectionHelper {

  private Context mContext;
  private String mPackageName;
  private DeferredClientActionsQueue<CustomTabsClient> clientActions = new DeferredClientActionsQueue<>();
  private DeferredClientActionsQueue<CustomTabsSession> sessionActions = new DeferredClientActionsQueue<>();

  InternalCustomTabsConnectionHelper(Context context) {
    this.mContext = context;
  }

  @Override
  public void warmUp(String packageName) {
    clientActions.executeOrQueueAction(client -> client.warmup(0));
    ensureConnection(packageName);
  }

  @Override
  public void mayInitWithUrl(String packageName, Uri uri) {
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

  @Override
  public boolean coolDown(String packageName) {
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

  @Override
  public List<? extends Class> getExportedInterfaces() {
    return Collections.singletonList(CustomTabsConnectionHelper.class);
  }
}
