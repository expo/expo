// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import AVFoundation
import UIKit
import CoreServices
import ExpoModulesCore

/**
 * Class used for easier management of loadingRequests and associating them with data tasks.
 * After the request is fulfilled or canceled, the data chunk should be saved to file holding the cache
 */
class CachableRequest: Equatable, Hashable {
  let loadingRequest: AVAssetResourceLoadingRequest
  let dataTask: URLSessionDataTask
  var dataRequest: AVAssetResourceLoadingDataRequest
  var response: URLResponse?
  private(set) var receivedData = Data()
  private let dataOffset: Int64

  init(loadingRequest: AVAssetResourceLoadingRequest, dataTask: URLSessionDataTask, dataRequest: AVAssetResourceLoadingDataRequest) {
    self.loadingRequest = loadingRequest
    self.dataTask = dataTask
    self.dataRequest = dataRequest
    self.dataOffset = dataRequest.requestedOffset
  }

  func onReceivedData(data: Data) {
    receivedData.append(data)
  }

  func saveData(to cachedResource: CachedResource) {
    // Capture the request in case the reference count drops to 0 while writing
    Task { [self] in
      await cachedResource.writeData(data: receivedData, offset: dataOffset)
    }
  }

  static func == (lhs: CachableRequest, rhs: CachableRequest) -> Bool {
    return lhs === rhs
  }

  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
}
