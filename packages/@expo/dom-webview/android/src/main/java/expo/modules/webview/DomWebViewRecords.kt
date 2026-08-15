// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.webview

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
internal data class DomWebViewSource(
  @Field val uri: String?
) : Record

@OptimizedRecord
internal data class ScrollToParam(
  @Field val x: Double = 0.0,
  @Field val y: Double = 0.0,
  @Field val animated: Boolean = true
) : Record
