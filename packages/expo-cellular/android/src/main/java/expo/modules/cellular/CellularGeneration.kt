package expo.modules.cellular

import io.github.expo.modules.v2.Enumerable

enum class CellularGeneration(val value: Int) : Enumerable {
  UNKNOWN(0),
  CG_2G(1),
  CG_3G(2),
  CG_4G(3),
  CG_5G(4)
}
