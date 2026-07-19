package host.exp.exponent.home.auth

enum class AuthRequestType(internal val type: String) {
  LOGIN("login"),
  SIGNUP("signup");

  companion object {
    fun fromString(type: String): AuthRequestType {
      return entries.firstOrNull { it.type == type } ?: LOGIN
    }
  }
}
