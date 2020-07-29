package expo.modules.notifications.notifications.interfaces;

import android.content.Context;
import android.content.pm.PackageManager;

import java.lang.reflect.InvocationTargetException;

public interface NotificationsScoper {

  NotificationsReconstructor createReconstructor();

  NotificationsBuilderCreator createBuilderCreator();

  static NotificationsScoper create(Context context) {
    Class<? extends NotificationsScoper> scoperClass;
    try {
      synchronized (NotificationScoperSingleton.INSTANCE) {
        if (NotificationScoperSingleton.INSTANCE.getInstance() == null) {
          String scoperClassName = context.getApplicationContext().getPackageManager().getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA).metaData.getString("expo.modules.notifications#NotificationsScoper");
          if (scoperClassName != null) {
            scoperClass = (Class<? extends NotificationsScoper>) Class.forName(scoperClassName);
            NotificationScoperSingleton.INSTANCE.setInstance(scoperClass.getConstructor().newInstance());
          } else {
            throw new IllegalStateException("Unable to instantiate AppLoader!");
          }
        }
      }
      return NotificationScoperSingleton.INSTANCE.getInstance();
    } catch (PackageManager.NameNotFoundException | NoSuchMethodException | ClassNotFoundException | IllegalAccessException | InstantiationException | InvocationTargetException e) {
      throw new IllegalStateException("Unable to instantiate AppLoader!", e);
    }
  }

}

enum NotificationScoperSingleton {
  INSTANCE;
  private NotificationsScoper sInstance;

  public void setInstance(NotificationsScoper scoper) {
    this.sInstance = scoper;
  }

  public NotificationsScoper getInstance() {
    return sInstance;
  }
}
