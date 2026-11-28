package expo.modules.video.mediasession

/**
 * Keeps the volume that a player had before the system ducked it.
 * The value can only be reached through the synchronized functions, so any thread can call them.
 */
internal class DuckedVolume {
  private var volumeBeforeDuck: Float? = null

  /**
   * Returns the volume to set for the duck, or `null` when the player is already ducked.
   */
  @Synchronized
  fun duck(volume: Float): Float? {
    if (volumeBeforeDuck != null) {
      return null
    }
    volumeBeforeDuck = volume
    return volume / 2f
  }

  /**
   * Returns the volume to restore, or `null` when the player is not ducked.
   */
  @Synchronized
  fun restore(): Float? {
    val volume = volumeBeforeDuck
    volumeBeforeDuck = null
    return volume
  }
}
