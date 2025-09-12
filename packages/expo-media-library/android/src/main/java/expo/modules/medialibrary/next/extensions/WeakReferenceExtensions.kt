package expo.modules.medialibrary.next.extensions

import android.content.Context
import expo.modules.kotlin.exception.Exceptions
import java.lang.ref.WeakReference

fun WeakReference<Context>.getOrThrow(): Context {
  return get() ?: throw Exceptions.ReactContextLost()
}
