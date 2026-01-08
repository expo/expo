package host.exp.exponent.home

import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Parses an ISO 8601 date string and formats it into a human-readable format.
 * Example: "2024-05-15T03:03:00.000Z" -> "May 15 2024, 3:03 AM"
 *
 * @param dateString The ISO 8601 date string from the GraphQL response.
 * @return A formatted, readable date-time string, or the original string if parsing fails.
 */
fun formatIsoDateTime(dateString: String?): String {
    if (dateString == null) return "Unknown date"

    return try {
        val instant = Instant.parse(dateString)
        val formatter = DateTimeFormatter.ofPattern("MMM d, yyyy, h:mm a", Locale.ENGLISH)
        instant.atZone(ZoneId.systemDefault()).format(formatter)
    } catch (e: Exception) {
        dateString
    }
}