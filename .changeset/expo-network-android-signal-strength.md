---
'expo-network': patch
---

[Android] Add signal strength APIs. `getCellSignalStrengthAsync` and `getWifiSignalStrengthAsync` read the current signal strength, returning a value from 0 to 4, or `-1` (`INVALID_SIGNAL_STRENGTH`) if it is unavailable. `addCellSignalStrengthListener` and `addWifiSignalStrengthListener` subscribe to changes, and the `useCellSignalStrength`, `useWifiSignalStrength`, and `useActiveSignalStrength` hooks track the value reactively, with `useActiveSignalStrength` switching between cellular and Wi-Fi based on the active network type.
