package expo.modules.observe.spans

import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.observe.shared.spans.SpanHandle

/** The JS `Span` object returned by `startSpan`. */
internal class SpanObject(val handle: SpanHandle) : SharedObject()
