package expo.modules.updates.loader

import expo.modules.jsonutils.getNullable
import expo.modules.jsonutils.require
import expo.modules.updates.UpdatesUtils.parseDateString
import expo.modules.updates.manifest.ResponseHeaderData
import expo.modules.updates.manifest.Update
import org.json.JSONObject
import java.util.*

data class SigningInfo(val easProjectId: String, val scopeKey: String)

sealed class UpdateDirective(val signingInfo: SigningInfo?) {
  class NoUpdateAvailableUpdateDirective(signingInfo: SigningInfo?) : UpdateDirective(signingInfo)
  class RollBackToEmbeddedUpdateDirective(val commitTime: Date, signingInfo: SigningInfo?) : UpdateDirective(signingInfo)

  companion object {
    fun fromJSONString(jsonString: String): UpdateDirective {
      val json = JSONObject(jsonString)
      val signingInfo = json.getNullable<JSONObject>("extra")?.getNullable<JSONObject>("signingInfo")?.let {
        SigningInfo(it.require("projectId"), it.require("scopeKey"))
      }
      return when (val messageType = json.require<String>("type")) {
        "noUpdateAvailable" -> NoUpdateAvailableUpdateDirective(signingInfo)
        "rollBackToEmbedded" -> RollBackToEmbeddedUpdateDirective(
          parseDateString(json.require<JSONObject>("parameters").require("commitTime")),
          signingInfo
        )
        else -> throw Error("Invalid message messageType: $messageType")
      }
    }
  }
}

data class UpdateResponse(
  val responseHeaderData: ResponseHeaderData?,
  val manifestUpdateResponsePart: UpdateResponsePart.ManifestUpdateResponsePart?,
  val directiveUpdateResponsePart: UpdateResponsePart.DirectiveUpdateResponsePart?
)

sealed class UpdateResponsePart {
  data class ManifestUpdateResponsePart(val update: Update) : UpdateResponsePart()
  data class DirectiveUpdateResponsePart(val updateDirective: UpdateDirective) : UpdateResponsePart()
}
