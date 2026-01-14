package host.exp.exponent.home.auth

sealed interface AuthResult {
  data class Success(val sessionSecret: String) : AuthResult
  object Canceled : AuthResult
}
