package expo.modules.device

import io.github.expo.modules.v2.Enumerable

enum class DeviceType(val JSValue: Int) : Enumerable {
  UNKNOWN(0),
  PHONE(1),
  TABLET(2),
  DESKTOP(3),
  TV(4)
}
