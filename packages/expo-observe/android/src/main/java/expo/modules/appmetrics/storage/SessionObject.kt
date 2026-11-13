package expo.modules.appmetrics.storage

import expo.modules.kotlin.runtime.Runtime
import expo.modules.kotlin.sharedobjects.SharedObject

/** The JS `Session` object. The module creates one per session, so JS always sees the same object. */
internal class SessionObject(val session: SessionHandle, runtime: Runtime?) : SharedObject(runtime)
