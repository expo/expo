package expo.modules.image

import com.bumptech.glide.RequestBuilder
import com.bumptech.glide.request.BaseRequestOptions
import com.bumptech.glide.request.RequestOptions
import com.github.penfeizhou.animation.glide.AnimationDecoderOption

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
 * Conditionally applies the block to the RequestBuilder if both values aren't null.
 */
inline fun <T, P1, P2> RequestBuilder<T>.customize(first: P1?, second: P2?, block: RequestBuilder<T>.(P1, P2) -> RequestBuilder<T>): RequestBuilder<T> {
  if (first == null || second == null) {
    return this
  }

  return block(first, second)
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

/**
 * APNG4Android's animated WebP, APNG and AVIF checks can read the whole input stream. Glide can't
 * rewind a stream after 5 MB, so larger images that aren't cached on disk fail to load.
 * `AnimatedImageModule` finds these images with bounded reads and still decodes them with APNG4Android.
 */
fun <T : BaseRequestOptions<T>> T.disableUnboundedAnimationChecks(): T {
  return set(AnimationDecoderOption.DISABLE_ANIMATION_WEBP_DECODER, true)
    .set(AnimationDecoderOption.DISABLE_ANIMATION_APNG_DECODER, true)
    .set(AnimationDecoderOption.DISABLE_ANIMATION_AVIF_DECODER, true)
}
