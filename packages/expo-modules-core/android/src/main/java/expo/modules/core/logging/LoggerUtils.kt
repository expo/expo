package expo.modules.core.logging

fun Throwable.localizedMessageWithCauseLocalizedMessage(): String {
  return listOfNotNull(localizedMessage, cause?.localizedMessageWithCauseLocalizedMessage()).joinToString(": ")
}
