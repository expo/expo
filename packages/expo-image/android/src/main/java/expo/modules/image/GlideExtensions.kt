package expo.modules.image

import com.bumptech.glide.RequestBuilder
import com.bumptech.glide.request.RequestOptions

/**
 * Conditionally applies the block to the RequestBuilder if the condition is true.
 */
fun <T> RequestBuilder<T>.customize(`when`: Boolean, block: RequestBuilder<T>.() -> RequestBuilder<T>): RequestBuilder<T> {
  if (!`when`) {
    return this
  }

  return block()
}

/**
 * Conditionally applies the block to the RequestBuilder if the value is not null.
 */
inline fun <T, P> RequestBuilder<T>.customize(value: P?, block: RequestBuilder<T>.(P) -> RequestBuilder<T>): RequestBuilder<T> {
  if (value == null) {
    return this
  }

  return block(value)
}

/**
 * Conditionally applies the block to the RequestOptions if the condition is true.
 */
inline fun RequestOptions.customize(`when`: Boolean, block: RequestOptions.() -> RequestOptions): RequestOptions {
  if (!`when`) {
    return this
  }

  return block()
}

/**
 * Conditionally applies the block to the RequestOptions if the value is not null.
 */
inline fun <T> RequestOptions.customize(value: T?, block: RequestOptions.(T) -> RequestOptions): RequestOptions {
  if (value == null) {
    return this
  }

  return block(value)
}

fun <T> RequestBuilder<T>.apply(options: RequestOptions?): RequestBuilder<T> {
  if (options == null) {
    return this
  }

  return apply(options)
}
