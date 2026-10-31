package expo.modules.mailcomposer

import io.github.expo.modules.v2.Record

/**
 * Represents a mail client with a label and package name.
 */
@Record
data class MailClient(
  val label: String,
  val packageName: String
)

@Record
data class MailComposerOptions(
  val recipients: List<String>? = null,
  val ccRecipients: List<String>? = null,
  val bccRecipients: List<String>? = null,
  val subject: String? = null,
  val body: String? = null,
  val isHtml: Boolean? = null,
  val attachments: List<String>? = null
)

@Record
data class MailComposerResult(
  val status: String
)
