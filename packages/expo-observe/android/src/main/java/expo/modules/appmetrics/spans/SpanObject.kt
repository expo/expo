package expo.modules.appmetrics.spans

import expo.modules.kotlin.sharedobjects.SharedObject

/** The JS `Span` object returned by `startSpan`. */
internal class SpanObject(val handle: SpanHandle) : SharedObject()
