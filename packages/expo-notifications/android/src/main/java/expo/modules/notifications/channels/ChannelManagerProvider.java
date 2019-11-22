package expo.modules.notifications.channels;

public class ChannelManagerProvider {

  private static ChannelManager mChannelManager;

  static {
    ChannelManager persistentChannelManager = new PersistentChannelManager();
    ChannelManager androidAwareChannelManager = new AndroidAwareChannelManager();
    ChannelManager threadSafeChannelManager = new ThreadSafeChannelManager();
    threadSafeChannelManager.setNextChannelManager(androidAwareChannelManager);
    androidAwareChannelManager.setNextChannelManager(persistentChannelManager);
    mChannelManager = threadSafeChannelManager;
  }

  public static ChannelManager getChannelManager() {
    return mChannelManager;
  }
}
