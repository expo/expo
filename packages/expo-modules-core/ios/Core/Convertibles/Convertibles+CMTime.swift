// Copyright 2024-present 650 Industries. All rights reserved.

import CoreMedia

extension CMTime: Convertible {
  public static func convert(from value: Any?, appContext: AppContext) throws -> CMTime {
    if let seconds = value as? Double {
      return CMTime(seconds: seconds, preferredTimescale: .max)
    }
    if let seconds = value as? any BinaryInteger {
      return CMTime(seconds: Double(seconds), preferredTimescale: .max)
    }
    if let time = value as? CMTime {
      return time
    }
    throw Conversions.ConvertingException<CMTime>(value)
  }
}
