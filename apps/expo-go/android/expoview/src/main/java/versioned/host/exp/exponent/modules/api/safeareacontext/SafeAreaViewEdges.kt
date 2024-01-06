package versioned.host.exp.exponent.modules.api.safeareacontext

enum class SafeAreaViewEdgeModes {
  OFF,
  ADDITIVE,
  MAXIMUM
}

data class SafeAreaViewEdges(
    val top: SafeAreaViewEdgeModes,
    val right: SafeAreaViewEdgeModes,
    val bottom: SafeAreaViewEdgeModes,
    val left: SafeAreaViewEdgeModes
)

class Safe
