// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import expo.modules.kotlin.sharedobjects.SharedRef

internal class NativeSession : SharedRef<NativeSessionBinding>(NativeSessionBinding()) {
  override fun sharedObjectDidRelease() {
    super.sharedObjectDidRelease()
    this.ref.close()
  }

  override fun equals(other: Any?): Boolean {
    return other is NativeSession && this.ref == other.ref
  }

  override fun hashCode(): Int {
    return ref.hashCode()
  }
}
