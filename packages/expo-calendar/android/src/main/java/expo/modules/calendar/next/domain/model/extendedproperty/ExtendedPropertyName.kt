package expo.modules.calendar.next.domain.model.extendedproperty

/**
 * Naming rules a property has to follow to survive a round trip through Google Calendar.
 *
 * Its sync adapter maps `private:name` and `shared:name` onto `extendedProperties.private` and
 * `extendedProperties.shared` in the Google Calendar API, and drops every other name on the next
 * sync — silently, and only once the write has already been reported as successful locally.
 *
 * Nothing in the calendar provider imposes this: it is that one adapter's convention. Another
 * adapter may well keep an unprefixed name, so these rules apply to Google accounts only.
 */
object ExtendedPropertyName {
  /** Prefix for a property only the owning account can read. */
  const val PRIVATE_PREFIX = "private:"

  /** Prefix for a property shared with the guests of the event. */
  const val SHARED_PREFIX = "shared:"

  /**
   * Whether [name] survives being pushed to Google Calendar and downloaded again.
   */
  fun isSyncSafe(name: String) =
    name.startsWith(PRIVATE_PREFIX) || name.startsWith(SHARED_PREFIX)
}
