package expo.modules.kotlin.types

import kotlin.contracts.ExperimentalContracts
import kotlin.contracts.contract

@OptIn(ExperimentalContracts::class)
inline fun <reified P0> enforceType(p0: Any?) {
  contract {
    returns() implies (p0 is P0)
  }
}

@OptIn(ExperimentalContracts::class)
inline fun <reified P0, reified P1> enforceType(p0: Any?, p1: Any?) {
  contract {
    returns() implies (p0 is P0 && p1 is P1)
  }
}

@OptIn(ExperimentalContracts::class)
inline fun <reified P0, reified P1, reified P2> enforceType(p0: Any?, p1: Any?, p2: Any?) {
  contract {
    returns() implies (p0 is P0 && p1 is P1 && p2 is P2)
  }
}

@OptIn(ExperimentalContracts::class)
inline fun <reified P0, reified P1, reified P2, reified P3> enforceType(p0: Any?, p1: Any?, p2: Any?, p3: Any?) {
  contract {
    returns() implies (p0 is P0 && p1 is P1 && p2 is P2 && p3 is P3)
  }
}

@OptIn(ExperimentalContracts::class)
inline fun <reified P0, reified P1, reified P2, reified P3, reified P4> enforceType(p0: Any?, p1: Any?, p2: Any?, p3: Any?, p4: Any?) {
  contract {
    returns() implies (p0 is P0 && p1 is P1 && p2 is P2 && p3 is P3 && p4 is P4)
  }
}

@OptIn(ExperimentalContracts::class)
inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> enforceType(p0: Any?, p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?) {
  contract {
    returns() implies (p0 is P0 && p1 is P1 && p2 is P2 && p3 is P3 && p4 is P4 && p5 is P5)
  }
}

@OptIn(ExperimentalContracts::class)
inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> enforceType(p0: Any?, p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?) {
  contract {
    returns() implies (p0 is P0 && p1 is P1 && p2 is P2 && p3 is P3 && p4 is P4 && p5 is P5 && p6 is P6)
  }
}

@OptIn(ExperimentalContracts::class)
inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> enforceType(p0: Any?, p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?) {
  contract {
    returns() implies (p0 is P0 && p1 is P1 && p2 is P2 && p3 is P3 && p4 is P4 && p5 is P5 && p6 is P6 && p7 is P7)
  }
}
