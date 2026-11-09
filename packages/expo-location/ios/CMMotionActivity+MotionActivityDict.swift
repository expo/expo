// Copyright 2024-present 650 Industries. All rights reserved.

#if !EXPO_LOCATION_DISABLE_MOTION
import CoreMotion

extension CMMotionActivity {
  func toMotionActivityDict() -> [String: Any] {
    // CMMotionActivity reports one confidence value for the whole reading.
    // Detected entries receive that confidence; undetected entries receive 0 (Low).
    let confidence = self.confidence.rawValue
    func entry(_ detected: Bool) -> [String: Any] {
      ["detected": detected, "confidence": detected ? confidence : 0]
    }
    return [
      "activities": [
        "automotive": entry(automotive),
        "cycling": entry(cycling),
        "running": entry(running),
        "walking": entry(walking),
        "stationary": entry(stationary),
        "unknown": entry(unknown),
      ],
      "timestamp": startDate.timeIntervalSince1970 * 1000
    ]
  }
}
#endif
