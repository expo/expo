package expo.modules.clipboard

import android.content.ClipData
import android.content.ClipDescription
import android.content.Context
import android.os.Build
import android.os.PersistableBundle
import android.text.Html
import android.text.Spanned
import android.text.TextUtils

internal fun ClipData.applyIsSensitive(isSensitive: Boolean): ClipData {
  if (!isSensitive) {
    return this
  }

  val extraKey = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    ClipDescription.EXTRA_IS_SENSITIVE
  } else {
    "android.content.extra.IS_SENSITIVE"
  }

  description.extras = PersistableBundle().apply {
    putBoolean(extraKey, true)
  }

  return this
}

internal fun plainTextFromHtml(htmlContent: String): String {
  val styledText: Spanned =
    Html.fromHtml(htmlContent, Html.FROM_HTML_MODE_LEGACY)
  val chars = CharArray(styledText.length)
  TextUtils.getChars(styledText, 0, styledText.length, chars, 0)
  return String(chars)
}

/**
 * Turn this item into text, regardless of the type of data it
 * actually contains. It is the same as [coerceToText]
 * but this also supports HTML.
 *
 * The algorithm for deciding what text to return is:
 * - If [getHtmlText]  is non-null, strip HTML tags and return that.
 * See [plainTextFromHtml] for implementation details
 * - Otherwise, return the result of [coerceToText]
 *
 * @param context The caller's Context, from which its ContentResolver
 * and other things can be retrieved.
 * @return Returns the item's textual representation.
 */
internal fun ClipData.Item.coerceToPlainText(context: Context): String =
  if (text == null && htmlText != null) {
    plainTextFromHtml(htmlText)
  } else {
    coerceToText(context).toString()
  }

/**
 * True if clipboard contains plain text or HTML content
 */
internal val ClipDescription.hasTextContent: Boolean
  get() = hasMimeType(ClipDescription.MIMETYPE_TEXT_PLAIN) ||
    hasMimeType(ClipDescription.MIMETYPE_TEXT_HTML)
