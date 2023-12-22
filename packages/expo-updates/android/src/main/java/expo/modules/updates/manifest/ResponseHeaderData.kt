package expo.modules.updates.manifest

import android.util.Log
import expo.modules.structuredheaders.BooleanItem
import expo.modules.structuredheaders.NumberItem
import expo.modules.structuredheaders.Parser
import expo.modules.structuredheaders.StringItem
import org.json.JSONException
import org.json.JSONObject

/**
 * Data from the update response headers.
 * For non-multipart responses, this is the data from the headers in the response.
 * For multipart responses, this is the data from the headers in the outer response (as opposed to the headers in a part).
 */
data class ResponseHeaderData(
  /**
   * expo-protocol-version header. Indicates which version of the expo-updates protocol the response is.
   */
  private val protocolVersionRaw: String? = null,
  /**
   * expo-server-defined-headers header.  It defines headers that this library must store until overwritten by a newer dictionary.
   * They must be included in every subsequent update request.
   */
  private val serverDefinedHeadersRaw: String? = null,
  /**
   * expo-manifest-filters header. It is used to filter updates stored by the client library by the
   * `metadata` attribute found in the manifest. If a field is mentioned in the filter, the corresponding
   * field in the metadata must either be missing or equal for the update to be included.
   * The client library must store the manifest filters until it is overwritten by a newer response.
   */
  private val manifestFiltersRaw: String? = null
) {
  val protocolVersion = protocolVersionRaw?.let { Integer.valueOf(it) }

  val serverDefinedHeaders: JSONObject? by lazy {
    serverDefinedHeadersRaw?.let { headerDictionaryToJSONObject(it) }
  }

  val manifestFilters: JSONObject? by lazy {
    manifestFiltersRaw?.let { headerDictionaryToJSONObject(it) }
  }

  companion object {
    private val TAG = ResponseHeaderData::class.java.simpleName

    fun headerDictionaryToJSONObject(headerDictionary: String?): JSONObject? {
      val jsonObject = JSONObject()
      val parser = Parser(headerDictionary)
      try {
        val filtersDictionary = parser.parseDictionary()
        val map = filtersDictionary.get()
        for (key in map.keys) {
          val element = map[key]!!
          // ignore any dictionary entries whose type is not string, number, or boolean
          if (element is StringItem || element is BooleanItem || element is NumberItem<*>) {
            jsonObject.put(key, element.get())
          }
        }
      } catch (e: expo.modules.structuredheaders.ParseException) {
        Log.e(TAG, "Failed to parse manifest header content", e)
        return null
      } catch (e: JSONException) {
        Log.e(TAG, "Failed to parse manifest header content", e)
        return null
      }
      return jsonObject
    }
  }
}

/**
 * Data from the update response part headers.
 * For non-multipart responses, this is the data from the headers in the response.
 * For multipart responses, this is the data from the headers in the part.
 */
data class ResponsePartHeaderData(
  /**
   * Code signing signature for response part.
   */
  val signature: String? = null
)

/**
 * Full info about a update response part.
 * For non-multipart responses, this is the info about the full response.
 * For multipart responses, this is the info about a single part (but includes the outer headers for processing).
 */
data class ResponsePartInfo(
  val responseHeaderData: ResponseHeaderData,
  val responsePartHeaderData: ResponsePartHeaderData,
  val body: String
)
