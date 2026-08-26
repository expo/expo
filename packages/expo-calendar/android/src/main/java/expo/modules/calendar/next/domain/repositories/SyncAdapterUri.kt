package expo.modules.calendar.next.domain.repositories

import android.net.Uri
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.model.calendar.CalendarAccount

/**
 * Marks [this] URI as coming from the sync adapter of [account].
 *
 * `CalendarProvider2` reserves some tables and columns for sync adapters, and decides who is one
 * by reading these query parameters — there is no signature check behind them. Reads never need
 * them; only the writes the provider would otherwise reject.
 *
 * Writing through this URI also tells the provider that the row is already in sync with the
 * server, so the affected event has to be marked dirty afterwards for the change to be pushed.
 * See [expo.modules.calendar.next.domain.repositories.event.EventRepository.markDirty].
 */
internal fun Uri.asSyncAdapter(account: CalendarAccount): Uri = buildUpon()
  .appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
  .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME, account.name)
  .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE, account.type)
  .build()
