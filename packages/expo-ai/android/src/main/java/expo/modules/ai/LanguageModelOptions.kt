package expo.modules.ai

import org.json.JSONArray
import org.json.JSONObject

internal data class LanguageModelSessionOptions(val instructions: String?) {
  companion object {
    fun parse(json: String): LanguageModelSessionOptions {
      val value = parseObject(json, setOf("instructions", "tools"))
      val instructions = if (value.has("instructions")) {
        value.get("instructions") as? String ?: throw LanguageModelException.invalid("instructions must be a string.")
      } else {
        null
      }
      if (value.has("tools")) {
        val tools = value.get("tools") as? JSONArray ?: throw LanguageModelException.invalid("tools must be an array.")
        if (tools.length() > 0) {
          throw LanguageModelException("ERR_UNSUPPORTED_FEATURE", "ML Kit does not support native runtime tool declarations. Tools are handled by the shared library.")
        }
      }
      return LanguageModelSessionOptions(instructions)
    }
  }
}

internal data class LanguageModelRequestOptions(val stream: Boolean, val maximumOutputTokens: Int?) {
  companion object {
    fun parse(json: String): LanguageModelRequestOptions {
      val value = parseObject(json, setOf("schema", "stream", "maximumOutputTokens", "maximumToolCalls"))
      if (value.has("schema")) {
        throw LanguageModelException("ERR_SCHEMA_UNSUPPORTED", "ML Kit does not support native runtime output schemas. Structured output is handled by the shared library.")
      }
      val stream = if (value.has("stream")) {
        value.get("stream") as? Boolean ?: throw LanguageModelException.invalid("stream must be a boolean.")
      } else {
        false
      }
      val maximumToolCalls = value.optionalInteger("maximumToolCalls", 0) ?: 0
      if (maximumToolCalls > 16) throw LanguageModelException.invalid("maximumToolCalls must not exceed 16.")
      return LanguageModelRequestOptions(stream, value.optionalInteger("maximumOutputTokens", 1))
    }
  }
}

private fun parseObject(json: String, allowed: Set<String>): JSONObject {
  val value = try {
    JSONObject(json)
  } catch (error: Exception) {
    throw LanguageModelException.invalid("Options must be a JSON object.")
  }
  val unknown = value.keys().asSequence().filter { it !in allowed }.toList()
  if (unknown.isNotEmpty()) throw LanguageModelException.invalid("Unsupported options: ${unknown.joinToString()}.")
  return value
}

private fun JSONObject.optionalInteger(key: String, minimum: Int): Int? {
  if (!has(key)) return null
  val number = (get(key) as? Number)?.toDouble()
    ?: throw LanguageModelException.invalid("$key must be an integer of at least $minimum.")
  if (!number.isFinite() || number % 1 != 0.0 || number < minimum || number > Int.MAX_VALUE) {
    throw LanguageModelException.invalid("$key must be an integer from $minimum through ${Int.MAX_VALUE}.")
  }
  return number.toInt()
}
