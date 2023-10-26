// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import expo.modules.kotlin.sharedobjects.SharedRef

internal class NativeStatement : SharedRef<NativeStatementBinding>(NativeStatementBinding()) {
  override fun equals(other: Any?): Boolean {
    return other is NativeStatement && this.ref == other.ref
  }
}
