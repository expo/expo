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
  val allowsAuthorizedReuse: Boolean,
  val cacheable: Boolean = true
)

internal data class CacheStorageKey(
  val storageKey: String,
  // Whether the caller may serve bytes already in the Media3 cache for this request.
  val canReadFromCache: Boolean,
  val cacheable: Boolean = true
)

internal object CacheVariantIndex {
  private const val INDEX_DIR = "ExpoVideoCacheVariants"
  private const val INDEX_SUFFIX = ".variants"
  private const val AUTHORIZATION = "authorization"

  /**
   * Headers used to derive the storage key before any response is seen.
   * On Android, cookies are considered only when callers pass them in `VideoSource.headers`.
   */
  private val provisionalIdentityHeaders = listOf("authorization", "cookie", "proxy-authorization")

  /**
   * Returns the storage key for the variant matching this request, or a
   * provisional key when no variant matches yet. The storage key is appended
   * to the URL to form the Media3 cache key.
   */
  @Synchronized
  fun storageKey(context: Context, url: String, requestHeaders: Map<String, String>): String {
    return storageKeyResult(context, url, requestHeaders).storageKey
  }

  @Synchronized
  fun storageKeyResult(context: Context, url: String, requestHeaders: Map<String, String>): CacheStorageKey {
    val normalized = normalize(requestHeaders)
    val variants = pruneEvicted(context, url, load(context, url))

    if (variants.isEmpty() && hasLegacyCacheEntry(url) && identityValues(normalized).isEmpty()) {
      // A pre-upgrade, URL-only cache entry exists for an anonymous request.
      // It is safe (and required for offline playback) to keep reading it: the
      // request carries no identity headers, so it can't cross-pollinate. The
      // recorder promotes it to a proper variant on the next network fetch.
      // `canReadFromCache` must stay `true` here, otherwise the caller would
      // evict this entry and break offline downloads made before upgrading.
      return CacheStorageKey(
        storageKey = "",
        canReadFromCache = true
      )
    }
    matchingVariant(variants, normalized)?.let {
      return CacheStorageKey(
        storageKey = it.storageKey,
        canReadFromCache = it.cacheable,
        cacheable = it.cacheable
      )
    }
    return CacheStorageKey(
      storageKey = provisionalStorageKey(
        normalizedHeaders = normalized,
        knownVaryHeaders = variants.flatMap { it.varyHeaders },
        hasExistingVariants = variants.isNotEmpty()
      ),
      canReadFromCache = false
    )
  }

  /**
   * Wipes the on-disk variants directory. Called by `VideoCache.clear()` so
   * an explicit cache clear doesn't leave behind orphaned variant records.
   */
  fun clearAll(context: Context) {
    File(context.cacheDir, INDEX_DIR).deleteRecursively()
  }

  // A non-cacheable response (e.g. `Vary: *`) is stored as a `cacheable = false`
  // marker so later reads bypass the cache instead of serving leftover bytes.
  @Synchronized
  fun recordVariant(
    context: Context,
    url: String,
    storageKey: String,
    requestHeaders: Map<String, String>,
    policy: CachePolicy
  ) {
    val normalized = normalize(requestHeaders)
    val varyValues = policy.varyHeaders.associateWith { (normalized[it] ?: "") }
    val identityValues = identityValues(normalized)
    val variant = CacheVariant(
      storageKey = storageKey,
      varyHeaders = policy.varyHeaders,
      varyValues = varyValues,
      identityValues = identityValues,
      allowsAuthorizedReuse = policy.allowsAuthorizedReuse,
      cacheable = policy.isCacheable
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
    } catch (e: IllegalStateException) {
      // SimpleCache released.
      false
    } catch (e: UninitializedPropertyAccessException) {
      // `VideoManager.cache` not assigned yet (runs before `onModuleCreated`).
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
    } catch (e: IllegalStateException) {
      // SimpleCache released; nothing to prune against.
      return variants
    } catch (e: UninitializedPropertyAccessException) {
      // `VideoManager.cache` not assigned yet; nothing to prune against.
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
      .put("cacheable", v.cacheable)
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
      allowsAuthorizedReuse = json.optBoolean("allowsAuthorizedReuse", false),
      cacheable = json.optBoolean("cacheable", true)
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
