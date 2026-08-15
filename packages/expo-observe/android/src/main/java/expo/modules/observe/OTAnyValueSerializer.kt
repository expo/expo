package expo.modules.observe

import kotlinx.serialization.KSerializer
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonEncoder
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull

/**
 * Custom serializer that emits the OTLP-correct wire shape for `OTAnyValue`.
 * Each variant becomes a single-key JSON object:
 *   - Str   -> {"stringValue": "..."}
 *   - Int64 -> {"intValue": "42"}        (string per OTLP int64 mapping)
 *   - Dbl   -> {"doubleValue": 3.14}
 *   - Bln   -> {"boolValue": true}
 *   - Arr   -> {"arrayValue": {"values": [...]}}
 *   - KvList -> {"kvlistValue": {"values": [{"key": "...", "value": ...}]}}
 */
internal object OTAnyValueSerializer : KSerializer<OTAnyValue> {
  override val descriptor: SerialDescriptor =
    buildClassSerialDescriptor("expo.modules.observe.OTAnyValue")

  override fun serialize(encoder: Encoder, value: OTAnyValue) {
    val jsonEncoder = encoder as? JsonEncoder
      ?: error("OTAnyValue is only serializable to JSON (got ${encoder::class}).")

    val element: JsonElement = when (value) {
      is OTAnyValue.Str -> buildJsonObject { put("stringValue", JsonPrimitive(value.value)) }
      is OTAnyValue.Int64 -> buildJsonObject { put("intValue", JsonPrimitive(value.value.toString())) }
      is OTAnyValue.Dbl -> buildJsonObject { put("doubleValue", JsonPrimitive(value.value)) }
      is OTAnyValue.Bln -> buildJsonObject { put("boolValue", JsonPrimitive(value.value)) }
      is OTAnyValue.Arr -> buildJsonObject {
        put(
          "arrayValue",
          buildJsonObject {
            put(
              "values",
              jsonEncoder.json.encodeToJsonElement(
                ListSerializer(OTAnyValueSerializer),
                value.values
              )
            )
          }
        )
      }
      is OTAnyValue.KvList -> buildJsonObject {
        put(
          "kvlistValue",
          buildJsonObject {
            put(
              "values",
              jsonEncoder.json.encodeToJsonElement(
                ListSerializer(OTKeyValue.serializer()),
                value.values
              )
            )
          }
        )
      }
    }

    jsonEncoder.encodeJsonElement(element)
  }

  override fun deserialize(decoder: Decoder): OTAnyValue {
    val jsonDecoder = decoder as? JsonDecoder
      ?: error("OTAnyValue is only deserializable from JSON (got ${decoder::class}).")
    val obj = jsonDecoder.decodeJsonElement().jsonObject

    obj["stringValue"]?.let {
      return OTAnyValue.Str(it.jsonPrimitive.contentOrNull ?: "")
    }
    obj["intValue"]?.let {
      val parsed = it.jsonPrimitive.contentOrNull?.toLongOrNull()
        ?: it.jsonPrimitive.longOrNull
        ?: error("OTAnyValue.intValue could not be parsed as Long: $it")
      return OTAnyValue.Int64(parsed)
    }
    obj["doubleValue"]?.let {
      return OTAnyValue.Dbl(it.jsonPrimitive.doubleOrNull ?: error("OTAnyValue.doubleValue not a number: $it"))
    }
    obj["boolValue"]?.let {
      return OTAnyValue.Bln(it.jsonPrimitive.booleanOrNull ?: it.jsonPrimitive.boolean)
    }
    obj["arrayValue"]?.let { arr ->
      val values = arr.jsonObject["values"]?.jsonArray
        ?: error("OTAnyValue.arrayValue is missing `values`")
      return OTAnyValue.Arr(values.map { jsonDecoder.json.decodeFromJsonElement(OTAnyValueSerializer, it) })
    }
    obj["kvlistValue"]?.let { kv ->
      val values = kv.jsonObject["values"]?.jsonArray
        ?: error("OTAnyValue.kvlistValue is missing `values`")
      return OTAnyValue.KvList(values.map { jsonDecoder.json.decodeFromJsonElement(OTKeyValue.serializer(), it) })
    }
    error("OTAnyValue has no recognized variant: $obj")
  }
}
