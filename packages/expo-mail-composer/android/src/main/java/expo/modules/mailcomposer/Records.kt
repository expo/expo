package expo.modules.mailcomposer

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

/**
 * Represents a mail client with a label, package name and icon.
 */
data class MailClient(
  @Field
  val label: String,
  @Field
  val packageName: String,
  @Field
  val icon: String
) : Record

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
