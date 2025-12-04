package expo.modules.devmenu.fab

import java.util.LinkedList

/**
 * Velocity tracker to calculate the rate of change of a 2D position
 * over a specific time window.
 *
 * @param timeFrameMillis Timeframe duration of the points for velocity calculation.
 * Positions older than this will be discarded.
 */
internal class ExpoVelocityTracker(private val timeFrameMillis: Long = 100L) {
  data class PointF(val x: Float, val y: Float)
  private data class PositionSnapshot(val point: PointF, val timestamp: Long)

  private val positions = LinkedList<PositionSnapshot>()

  fun registerPosition(x: Float, y: Float) {
    val snapshot = PositionSnapshot(PointF(x, y), System.currentTimeMillis())
    positions.add(snapshot)
    pruneOldPositions()
  }

  /**
   * Calculates the average velocity in pixels per second between the oldest and newest
   * data points within the defined `timeFrameMillis`.
   */
  fun calculateVelocity(): PointF {
    pruneOldPositions()

    if (positions.size < 2) {
      return PointF(0f, 0f)
    }

    val first = positions.first()
    val last = positions.last()

    val deltaTimeSeconds = (last.timestamp - first.timestamp) / 1000.0f

    if (deltaTimeSeconds == 0f) {
      return PointF(0f, 0f)
    }

    val deltaX = last.point.x - first.point.x
    val deltaY = last.point.y - first.point.y

    val velocityX = deltaX / deltaTimeSeconds
    val velocityY = deltaY / deltaTimeSeconds

    return PointF(velocityX, velocityY)
  }

  private fun pruneOldPositions() {
    val currentTime = System.currentTimeMillis()
    val cutoffTime = currentTime - timeFrameMillis

    while (positions.isNotEmpty() && positions.first().timestamp < cutoffTime) {
      positions.pollFirst()
    }
  }

  fun clear() {
    positions.clear()
  }
}
