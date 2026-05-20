package expo.modules.video.cache

import android.content.Context
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import expo.modules.video.managers.VideoManager
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.security.MessageDigest

/**
 * Per-URL on-disk index of cached response variants. Mirrors the Swift
 * implementation: each URL may have multiple variants when the server's
 * `Vary` header indicates the response differs by request headers.
 */
internal data class CacheVariant(
  val storageKey: String,
  val varyHeaders: List<String>,
  val varyValues: Map<String, String>,
  val identityValues: Map<String, String>,
  val allowsAuthorizedReuse: Boolean
)

internal object CacheVariantIndex {
  private const val INDEX_DIR = "ExpoVideoCacheVariants"
  private const val INDEX_SUFFIX = ".variants"
  private const val AUTHORIZATION = "authorization"

  /** Headers used to derive the storage key before any response is seen. */
  private val provisionalIdentityHeaders = listOf("authorization", "cookie", "proxy-authorization")

  /**
   * Returns the storage key for the variant matching this request, or a
   * provisional key when no variant matches yet. The storage key is appended
   * to the URL to form the Media3 cache key.
   */
  fun storageKey(context: Context, url: String, requestHeaders: Map<String, String>): String {
    val normalized = normalize(requestHeaders)
    val variants = pruneEvicted(context, url, load(context, url))

    if (variants.isEmpty() && hasLegacyCacheEntry(url) && identityValues(normalized).isEmpty()) {
      // Use legacy storage - the source does not specify auth headers.
      return ""
    }
    return matchingVariant(variants, normalized)?.storageKey
      ?: provisionalStorageKey(
        normalizedHeaders = normalized,
        knownVaryHeaders = variants.flatMap { it.varyHeaders },
        hasExistingVariants = variants.isNotEmpty()
      )
  }

  /**
   * Wipes the on-disk variants directory. Called by `VideoCache.clear()` so
   * an explicit cache clear doesn't leave behind orphaned variant records.
   */
  fun clearAll(context: Context) {
    File(context.cacheDir, INDEX_DIR).deleteRecursively()
  }

  fun recordVariant(
    context: Context,
    url: String,
    storageKey: String,
    requestHeaders: Map<String, String>,
    policy: CachePolicy
  ) {
    if (!policy.isCacheable) return
    val normalized = normalize(requestHeaders)
    val varyValues = policy.varyHeaders.associateWith { (normalized[it] ?: "") }
    val identityValues = identityValues(normalized)
    val variant = CacheVariant(
      storageKey = storageKey,
      varyHeaders = policy.varyHeaders,
      varyValues = varyValues,
      identityValues = identityValues,
      allowsAuthorizedReuse = policy.allowsAuthorizedReuse
    )
    val existing = load(context, url).filterNot { it.storageKey == storageKey } + variant
    save(context, url, existing)
  }

  private fun matchingVariant(variants: List<CacheVariant>, normalizedHeaders: Map<String, String>): CacheVariant? {
    val hasAuthorization = normalizedHeaders.containsKey(AUTHORIZATION)
    for (variant in variants) {
      val allMatch = variant.varyHeaders.all { name ->
        (normalizedHeaders[name] ?: "") == (variant.varyValues[name] ?: "")
      }
      if (!allMatch) {
        continue
      }

      val identityMatch = variant.identityValues.all { (name, value) ->
        (normalizedHeaders[name] ?: "") == value
      }

      if (!identityMatch) {
        continue
      }
      val identityHandledByVariant = variant.identityValues.containsKey(AUTHORIZATION)

      if (hasAuthorization && !identityHandledByVariant && !variant.allowsAuthorizedReuse) {
        continue
      }
      return variant
    }
    return null
  }

  @OptIn(UnstableApi::class)
  private fun hasLegacyCacheEntry(url: String): Boolean {
    return try {
      url in VideoManager.cache.instance.keys
    } catch (e: Throwable) {
      false
    }
  }

  /**
   * Drops variants whose corresponding data file has been LRU-evicted from
   * Media3's `SimpleCache`. Without this the index would grow over time with
   * entries pointing at keys whose payload was reclaimed. The check piggybacks
   * on `Cache.getKeys()`, which for `SimpleCache` is an in-memory lookup.
   */
  @OptIn(UnstableApi::class)
  private fun pruneEvicted(context: Context, url: String, variants: List<CacheVariant>): List<CacheVariant> {
    if (variants.isEmpty()) return variants
    val keys = try {
      VideoManager.cache.instance.keys
    } catch (e: Throwable) {
      // Cache not initialized yet; nothing to prune against.
      return variants
    }
    val live = variants.filter { variant ->
      val key = if (variant.storageKey.isEmpty()) url else "$url#${variant.storageKey}"
      key in keys
    }
    if (live.size != variants.size) {
      if (live.isEmpty()) {
        indexFile(context, url).delete()
      } else {
        save(context, url, live)
      }
    }
    return live
  }

  private fun provisionalStorageKey(
    normalizedHeaders: Map<String, String>,
    knownVaryHeaders: List<String>,
    hasExistingVariants: Boolean
  ): String {
    val headers = (provisionalIdentityHeaders + knownVaryHeaders)
      .map { it.lowercase() }
      .distinct()
      .sorted()
    val hasVariantInput = hasExistingVariants ||
      knownVaryHeaders.isNotEmpty() ||
      provisionalIdentityHeaders.any { it in normalizedHeaders }
    if (!hasVariantInput) {
      // Preserve the pre-variant URL-only cache key for anonymous videos so
      // existing offline downloads remain playable after upgrading.
      return ""
    }
    val composite = headers
      .joinToString(separator = ";") { name -> "$name:${normalizedHeaders[name] ?: ""}" }
    return sha256(composite)
  }

  private fun identityValues(normalizedHeaders: Map<String, String>): Map<String, String> {
    return provisionalIdentityHeaders
      .filter { it in normalizedHeaders }
      .associateWith { normalizedHeaders[it].orEmpty() }
  }

  private fun normalize(headers: Map<String, String>): Map<String, String> {
    return headers.mapKeys { it.key.lowercase() }
  }

  private fun load(context: Context, url: String): List<CacheVariant> {
    val file = indexFile(context, url)
    if (!file.exists()) {
      return emptyList()
    }

    return try {
      val arr = JSONArray(file.readText())
      List(arr.length()) { i -> decode(arr.getJSONObject(i)) }
    } catch (e: Exception) {
      emptyList()
    }
  }

  private fun save(context: Context, url: String, variants: List<CacheVariant>) {
    val arr = JSONArray()
    variants.forEach { arr.put(encode(it)) }
    val file = indexFile(context, url)
    file.parentFile?.mkdirs()
    file.writeText(arr.toString())
  }

  private fun encode(v: CacheVariant): JSONObject {
    val values = JSONObject()
    v.varyValues.forEach { (k, value) -> values.put(k, value) }

    val identityValues = JSONObject()
    v.identityValues.forEach { (k, value) -> identityValues.put(k, value) }

    val headers = JSONArray()
    v.varyHeaders.forEach { headers.put(it) }

    return JSONObject()
      .put("storageKey", v.storageKey)
      .put("varyHeaders", headers)
      .put("varyValues", values)
      .put("identityValues", identityValues)
      .put("allowsAuthorizedReuse", v.allowsAuthorizedReuse)
  }

  private fun decode(json: JSONObject): CacheVariant {
    val headersArr = json.optJSONArray("varyHeaders") ?: JSONArray()
    val headers = List(headersArr.length()) { i -> headersArr.getString(i) }
    val valuesObj = json.optJSONObject("varyValues") ?: JSONObject()
    val values = mutableMapOf<String, String>()
    val keysIt = valuesObj.keys()
    while (keysIt.hasNext()) {
      val key = keysIt.next()
      values[key] = valuesObj.optString(key, "")
    }
    val identityValuesObj = json.optJSONObject("identityValues") ?: JSONObject()
    val identityValues = mutableMapOf<String, String>()
    val identityKeysIt = identityValuesObj.keys()
    while (identityKeysIt.hasNext()) {
      val key = identityKeysIt.next()
      identityValues[key] = identityValuesObj.optString(key, "")
    }
    return CacheVariant(
      storageKey = json.getString("storageKey"),
      varyHeaders = headers,
      varyValues = values,
      identityValues = identityValues,
      allowsAuthorizedReuse = json.optBoolean("allowsAuthorizedReuse", false)
    )
  }

  private fun indexFile(context: Context, url: String): File {
    val dir = File(context.cacheDir, INDEX_DIR)
    return File(dir, sha256(url) + INDEX_SUFFIX)
  }

  private fun sha256(input: String): String {
    val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray(Charsets.UTF_8))
    return bytes.joinToString("") { "%02x".format(it) }
  }
}
