package abi49_0_0.host.exp.exponent.modules.api.safeareacontext

import java.util.*

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
