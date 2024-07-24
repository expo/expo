package expo.modules.mailcomposer

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

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
