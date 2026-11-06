package expo.modules.battery

import io.github.expo.modules.v2.Record

@Record
internal data class BatteryLevelEvent(val batteryLevel: Float)

@Record
internal data class BatteryStateEvent(val batteryState: BatteryState)

@Record
internal data class PowerModeEvent(val lowPowerMode: Boolean)
