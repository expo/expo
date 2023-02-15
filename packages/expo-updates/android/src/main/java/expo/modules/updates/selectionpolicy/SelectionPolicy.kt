package expo.modules.updates.selectionpolicy

import expo.modules.updates.db.entity.UpdateEntity
import org.json.JSONObject

/**
 * Pluggable class whose essential responsibility is to determine an ordering of the updates stored
 * locally. Ordering updates is important in three separate cases, which map to the three methods
 * here.
 *
 * The default/basic implementations of these methods use an ordering based on `commitTime` (with
 * allowances for EAS Update branches). This has implications for rollbacks (rolled back updates
 * must have a new `id` and `commitTime` in order to take effect), amongst other things, and so this
 * class was designed to be pluggable in order to allow different implementations to be swapped in
 * with relative ease, in situations with different tradeoffs.
 *
 * The three methods are individually pluggable to allow for different behavior of specific parts of
 * the module in different situations. For example, in a development client, our policy for
 * retaining and deleting updates is different than in a release build, so we use a different
 * implementation of [ReaperSelectionPolicy].
 *
 * Importantly (and non-trivially), expo-updates must be able to make all these determinations
 * without talking to any server. This is because the embedded update can change at any time,
 * without warning, and without the opportunity to talk to the updates server - when a new build is
 * installed via the Play Store/sideloading - and this class must be able to decide which update to
 * launch in that case.
 */
class SelectionPolicy(
  val launcherSelectionPolicy: LauncherSelectionPolicy,
  val loaderSelectionPolicy: LoaderSelectionPolicy,
  val reaperSelectionPolicy: ReaperSelectionPolicy
) {
  /**
   * Given a list of updates, decide which one should be launched (i.e. pick the "newest" update
   * based on this class's ordering).
   */
  fun selectUpdateToLaunch(updates: List<UpdateEntity>, filters: JSONObject?): UpdateEntity? {
    return launcherSelectionPolicy.selectUpdateToLaunch(updates, filters)
  }

  /**
   * Given a list of updates along with a currently running update, decide which ones should be
   * deleted from the database / disk (i.e. pick the updates that are sufficiently "older" than the
   * currently running update, according to this class's ordering).
   */
  fun selectUpdatesToDelete(
    updates: List<UpdateEntity>,
    launchedUpdate: UpdateEntity,
    filters: JSONObject?
  ): List<UpdateEntity> {
    return reaperSelectionPolicy.selectUpdatesToDelete(updates, launchedUpdate, filters)
  }

  /**
   * Given a new update along with a currently running update, decide whether the new update should
   * be loaded into the database (i.e. decide whether or not the new update is "newer" than the
   * currently running update, according to this class's ordering).
   */
  fun shouldLoadNewUpdate(
    newUpdate: UpdateEntity?,
    launchedUpdate: UpdateEntity?,
    filters: JSONObject?
  ): Boolean {
    return loaderSelectionPolicy.shouldLoadNewUpdate(newUpdate, launchedUpdate, filters)
  }
}
