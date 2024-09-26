import Foundation
import AVFoundation
import UIKit
import CoreServices
import ExpoModulesCore

/**
 * Class used for easier management of loadingRequests. While loading stores the chunk of data that was requested.
 * After the request is fulfilled or cancelled the data chunk should be appended to the a
 */
class CachableRequest: Equatable {
  let loadingRequest: AVAssetResourceLoadingRequest
  var dataRequest: AVAssetResourceLoadingDataRequest
  let dataTask: URLSessionDataTask

  var isFulfilled = false
  var response: URLResponse?
  var receivedData = Data()
  private let dataOffset: Int64

  init(loadingRequest: AVAssetResourceLoadingRequest, dataTask: URLSessionDataTask, dataRequest: AVAssetResourceLoadingDataRequest) {
    self.loadingRequest = loadingRequest
    self.dataTask = dataTask
    self.dataRequest = dataRequest
    self.dataOffset = dataRequest.requestedOffset
  }

  func onFulfilled(urlResponse: URLResponse) {
    isFulfilled = true
  }


  func onReceivedData(data: Data){
    receivedData.append(data)
  }

  func saveData(to cachedResource: CachedResource) {
    cachedResource.writeData(data: receivedData, offset: dataOffset)
  }

  static func == (lhs: CachableRequest, rhs: CachableRequest) -> Bool {
    return lhs === rhs
  }
}
