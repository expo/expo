package expo.modules.notifications.notifications.categories;

import android.content.Context;
import android.os.Bundle;
import android.os.ResultReceiver;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.interfaces.ExpoMethod;

import java.util.ArrayList;
import java.util.Collection;

public class ExpoNotificationCategoriesModule extends ExportedModule {
  private static final String EXPORTED_NAME = "ExpoNotificationCategoriesModule";

  public ExpoNotificationCategoriesModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @ExpoMethod
  public void getNotificationCategoriesAsync(final Promise promise) {
    promise.resolve("it works");
  }

  @ExpoMethod
  public void setNotificationCategoryAsync(final String identifier, ArrayList actions, final Promise promise) {

  }

  @ExpoMethod
  public void deleteNotificationCategoryAsync(String identifier, final Promise promise) {
   
  }
}
