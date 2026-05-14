/**
 A session that tracks the duration when the app is in the foreground and actively visible to the user.

 A new foreground session starts when the AppDelegate's `applicationDidBecomeActive` is called and
 ends when `applicationDidEnterBackground` is called. Each app foregrounding creates a new session.
 */
internal final class ForegroundSession: Session {
  init() {
    super.init(type: .foreground)
  }
}
