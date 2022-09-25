package expo.modules.updates.db.enums

/**
 * Download status that indicates whether or under what conditions an
 * update is able to be launched.
 */
enum class UpdateStatus {
  /**
   * The update has been fully downloaded and is ready to launch.
   */
  READY,
  /**
   * The update manifest has been download from the server but not all assets have finished
   * downloading successfully.
   */
  PENDING,
  /**
   * The update has been partially loaded (copied) from its location embedded in the app bundle, but
   * not all assets have been copied successfully. The update may be able to be launched directly
   * from its embedded location unless a new binary version with a new embedded update has been
   * installed.
   */
  EMBEDDED,
  /**
   * The update manifest has been downloaded and indicates that the update is being served from a
   * developer tool. It can be launched by a host application that can run a development bundle.
   */
  DEVELOPMENT
}
