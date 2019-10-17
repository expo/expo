package expo.modules.notifications.postoffice;

import android.os.Bundle;

import org.unimodules.core.interfaces.Function;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

public class PostOfficeProxy implements ExpoPostOffice {

  private Executor mSingleThreadExecutor = Executors.newSingleThreadExecutor();

  private static volatile PostOfficeProxy instance = null;

  private ExpoPostOffice mPostOffice;

  private PostOfficeProxy() {
    mPostOffice = new PostOffice();
  }

  public static synchronized ExpoPostOffice getInstance() {
    if (instance == null) {
      instance = new PostOfficeProxy();
    }
    return instance;
  }

  @Override
  public void notifyAboutUserInteraction(final String appId, final Bundle userInteraction) {
    mSingleThreadExecutor.execute(() -> mPostOffice.notifyAboutUserInteraction(appId, userInteraction));
  }

  @Override
  public void registerModuleAndGetInitialUserInteraction(String appId, Mailbox mailbox, Function<Bundle, Boolean> callback) {
    mSingleThreadExecutor.execute(() -> mPostOffice.registerModuleAndGetInitialUserInteraction(appId, mailbox, callback));
  }

  @Override
  public void unregisterModule(final String appId) {
    mSingleThreadExecutor.execute(() -> mPostOffice.unregisterModule(appId));
  }

  public void tryToSendForegroundNotificationToMailbox(String appId, Bundle notification, Function<Boolean, Boolean> completionHandler) {
    mSingleThreadExecutor.execute(() -> mPostOffice.tryToSendForegroundNotificationToMailbox(appId, notification, completionHandler));
  }
}
