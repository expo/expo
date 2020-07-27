package expo.modules.notifications.notifications.interfaces;

import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Parcel;

import java.lang.reflect.InvocationTargetException;

import expo.modules.notifications.notifications.model.NotificationRequest;

public interface NotificationsReconstructor {

  NotificationRequest reconstructNotificationRequest(Parcel parcel);

  static NotificationsReconstructor create(Context context) {
    Class<? extends NotificationsReconstructor> reconstructorClass;
    try {
      String reconstructorClassName = context.getApplicationContext().getPackageManager().getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA).metaData.getString("expo.modules.notifications#NotificationsReconstructor");
      if (reconstructorClassName != null) {
        reconstructorClass = (Class<? extends NotificationsReconstructor>) Class.forName(reconstructorClassName);
        return reconstructorClass.getConstructor().newInstance();
      } else {
        throw new IllegalStateException("Unable to instantiate AppLoader!");
      }
    } catch (PackageManager.NameNotFoundException | NoSuchMethodException | ClassNotFoundException | IllegalAccessException | InstantiationException | InvocationTargetException e) {
      throw new IllegalStateException("Unable to instantiate AppLoader!", e);
    }
  }

}
