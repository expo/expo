// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

@Record
internal struct MailComposerOptions {
  var recipients: [String]?

  var ccRecipients: [String]?

  var bccRecipients: [String]?

  var subject: String = ""

  var body: String = ""

  var isHtml: Bool = false

  var attachments: [URL]?
}
