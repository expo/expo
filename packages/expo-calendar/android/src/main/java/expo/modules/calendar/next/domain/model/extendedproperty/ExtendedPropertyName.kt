package expo.modules.calendar.next.domain.model.extendedproperty

/**
 * Naming rules a property has to follow to survive a round trip through a sync adapter.
 *
 * Google Calendar's sync adapter maps `private:name` and `shared:name` onto
 * `extendedProperties.private` and `extendedProperties.shared` in its API, and drops every other
 * name on the next sync — silently, and only once the write has already been reported as
 * successful locally. Names on calendars that no account syncs are unaffected.
 */
object ExtendedPropertyName {
  /** Prefix for a property only the owning account can read. */
  const val PRIVATE_PREFIX = "private:"

  /** Prefix for a property shared with the guests of the event. */
  const val SHARED_PREFIX = "shared:"

  /**
   * Whether [name] survives being pushed to a server and downloaded again.
   */
  fun isSyncSafe(name: String) =
    name.startsWith(PRIVATE_PREFIX) || name.startsWith(SHARED_PREFIX)
}
