package expo.modules.calendar.next.domain.model.extendedproperty

/**
 * Rules a property has to follow to survive a round trip through Google Calendar.
 *
 * Its sync adapter maps `private:name` and `shared:name` onto `extendedProperties.private` and
 * `extendedProperties.shared` in the Google Calendar API, and drops every other name on the next
 * sync, silently, and only once the write has already been reported as successful locally. It
 * treats a name or a value longer than [Google's limits][limits] the same way: the name goes away,
 * the value comes back truncated, and nothing reports either.
 *
 * Nothing in the calendar provider imposes this: it is that one adapter's convention. Another
 * adapter may well keep an unprefixed name, so these rules apply to Google accounts only.
 *
 * [limits]: https://developers.google.com/workspace/calendar/api/guides/extended-properties#limits
 */
object ExtendedPropertyName {
  /** Prefix for a property only the owning account can read. */
  const val PRIVATE_PREFIX = "private:"

  /** Prefix for a property shared with the guests of the event. */
  const val SHARED_PREFIX = "shared:"

  /** Longest part following the prefix Google Calendar keeps in a name. */
  const val MAX_LENGTH_AFTER_PREFIX = 44

  /** Longest value Google Calendar stores without truncating it. */
  const val MAX_VALUE_LENGTH = 1024

  /**
   * Whether [name] survives being pushed to Google Calendar and downloaded again.
   */
  fun isSyncSafe(name: String) =
    name.startsWith(PRIVATE_PREFIX) || name.startsWith(SHARED_PREFIX)

  /**
   * Length of [name] as Google Calendar counts it, the prefix left out.
   *
   * The two prefixes differ in length, so a name carrying neither counts whole rather than
   * borrowing one of them.
   */
  fun lengthAfterPrefix(name: String) = when {
    name.startsWith(PRIVATE_PREFIX) -> name.length - PRIVATE_PREFIX.length
    name.startsWith(SHARED_PREFIX) -> name.length - SHARED_PREFIX.length
    else -> name.length
  }
}
