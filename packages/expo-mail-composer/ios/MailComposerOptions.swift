// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal struct MailComposerOptions: Record {
  @Field
  var recipients: [String]?

  @Field
  var ccRecipients: [String]?

  @Field
  var bccRecipients: [String]?

  @Field
  var subject: String = ""

  @Field
  var body: String = ""

  @Field
  var isHtml: Bool = false

  @Field
  var attachments: [URL]?
}
