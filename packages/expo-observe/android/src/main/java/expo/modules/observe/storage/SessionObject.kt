package expo.modules.observe.storage

import expo.modules.kotlin.runtime.Runtime
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.observe.shared.storage.SessionHandle

/** The JS `Session` object. The module creates one per session, so JS always sees the same object. */
internal class SessionObject(val session: SessionHandle, runtime: Runtime?) : SharedObject(runtime)
