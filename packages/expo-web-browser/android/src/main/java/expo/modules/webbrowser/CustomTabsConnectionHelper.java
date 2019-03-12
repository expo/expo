package expo.modules.webbrowser;

import android.content.ComponentName;
import android.content.Context;
import android.net.Uri;
import android.support.customtabs.CustomTabsClient;
import android.support.customtabs.CustomTabsServiceConnection;
import android.support.customtabs.CustomTabsSession;

import java.util.LinkedList;
import java.util.Queue;

import expo.core.interfaces.Consumer;
import expo.core.interfaces.LifecycleEventListener;

public class CustomTabsConnectionHelper extends CustomTabsServiceConnection implements LifecycleEventListener {

  private Context mContext;
  private String mPackageName;
  private CustomTabsClient mClient;
  private CustomTabsSession mSession;
  private Queue<Consumer<CustomTabsClient>> clientActions = new LinkedList<>();
  private Queue<Consumer<CustomTabsSession>> sessionActions = new LinkedList<>();

  CustomTabsConnectionHelper(Context context) {
    this.mContext = context;
  }

  void warmUp(String packageName) {
    executeActionOnClient(client -> client.warmup(0));
    ensureConnection(packageName);
  }

  void mayInitWithUrl(String packageName, Uri uri) {
    executeActionOnSession(session -> session.mayLaunchUrl(uri, null, null));
    ensureConnection(packageName);
    ensureSession();
  }

  private void ensureSession() {
    if (mSession == null) {
      executeActionOnClient(
          client -> {
            mSession = client.newSession(null);
            executeQueuedSessionActions();
          }
      );
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
      mClient = client;
      executeQueuedClientActions();
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
    this.mClient = null;
    this.mSession = null;
    clientActions.clear();
    sessionActions.clear();
  }

  private void executeQueuedClientActions() {
    if (mClient != null) {
      Consumer<CustomTabsClient> action = clientActions.poll();
      while (action != null) {
        action.apply(mClient);
        action = clientActions.poll();
      }
    }
  }

  private void addActionToClientQueue(Consumer<CustomTabsClient> consumer) {
    clientActions.add(consumer);
  }

  private void executeActionOnClient(Consumer<CustomTabsClient> action) {
    if (mClient != null) {
      action.apply(mClient);
    } else {
      addActionToClientQueue(action);
    }
  }

  private void executeQueuedSessionActions() {
    if (mSession != null) {
      Consumer<CustomTabsSession> action = sessionActions.poll();
      while (action != null) {
        action.apply(mSession);
        action = sessionActions.poll();
      }
    }
  }

  private void addActionToSessionQueue(Consumer<CustomTabsSession> consumer) {
    sessionActions.add(consumer);
  }

  private void executeActionOnSession(Consumer<CustomTabsSession> action) {
    if (mSession != null) {
      action.apply(mSession);
    } else {
      addActionToSessionQueue(action);
    }
  }

  private Context getContext() {
    return mContext;
  }

}
