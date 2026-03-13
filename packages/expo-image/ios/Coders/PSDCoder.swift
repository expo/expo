// Copyright 2024-present 650 Industries. All rights reserved.

import SDWebImage

internal final class PSDCoder: NSObject, SDImageCoder {
  nonisolated(unsafe) static let shared = PSDCoder()
  
  func canDecode(from data: Data?) -> Bool {
    guard let data, data.count >= 4 else {
      return false
    }
    
    // verify PSD magic bytes
    let signatureData = data[0..<4]
    let signature = String(data: signatureData, encoding: .ascii)
    return signature == "8BPS"
  }
  
  func decodedImage(with data: Data?, options: [SDImageCoderOption : Any]? = nil) -> UIImage? {
    guard let data else {
      return nil
    }
    
    if let scale = options?[SDImageCoderOption.decodeScaleFactor] as? CGFloat {
      return UIImage(data: data, scale: scale)
    }
    
    // UIImage is able to directly handle PSD data
    return UIImage(data: data)
  }
  
  func canEncode(to format: SDImageFormat) -> Bool {
    return false
  }
  
  func encodedData(with image: UIImage?, format: SDImageFormat, options: [SDImageCoderOption : Any]? = nil) -> Data? {
    return nil
  }
}
