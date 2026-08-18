package expo.modules.mailcomposer

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

/**
 * Represents a mail client with a label and package name.
 */
@OptimizedRecord
data class MailClient(
  @Field
  val label: String,
  @Field
  val packageName: String
) : Record

@OptimizedRecord
data class MailComposerOptions(
  @Field
  val recipients: List<String>?,
  @Field
  val ccRecipients: List<String>?,
  @Field
  val bccRecipients: List<String>?,
  @Field
  val subject: String?,
  @Field
  val body: String?,
  @Field
  val isHtml: Boolean?,
  @Field
  val attachments: List<String>?
) : Record
