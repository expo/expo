// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum DevLauncherLoadErrorMessage {
  static func message(for error: NSError, url: String) -> String {
    if error.domain == "DevelopmentClient" {
      return error.localizedDescription
    }

    guard error.domain == NSURLErrorDomain else {
      return "Could not load the app from \(url). \(error.localizedDescription)"
    }

    let host = URL(string: url)?.host ?? ""

    switch error.code {
    case NSURLErrorCannotFindHost, NSURLErrorDNSLookupFailed:
      return "Could not find the server at \(url). The hostname could not be resolved. Check that the URL is correct and that this device is on the same network as the dev server."
    case NSURLErrorCannotConnectToHost:
      if isLocalhost(host) {
        return localhostMessage(url)
      }
      return "Could not connect to \(url). The server refused the connection. Make sure the dev server is running (npx expo start) and the port is correct."
    case NSURLErrorTimedOut:
      if isLocalhost(host) {
        return localhostMessage(url)
      }
      if isPrivateNetworkHost(host) {
        return "Could not reach \(url). This is a local network address. Make sure this device is on the same Wi-Fi network as the dev server."
      }
      return "The request to \(url) timed out. Check that the server is running and reachable from this device."
    case NSURLErrorNotConnectedToInternet:
      return "Could not load the app because this device is offline. Connect to a network and try again."
    case NSURLErrorNetworkConnectionLost:
      return "The connection to \(url) was interrupted. Try again."
    default:
      return "Could not load the app from \(url). \(error.localizedDescription)"
    }
  }

  private static func localhostMessage(_ url: String) -> String {
    return "Could not reach \(url). On a physical device, localhost points at the device itself, use your computer's LAN IP instead, or start the server with npx expo start and select it from the list."
  }

  private static func isLocalhost(_ host: String) -> Bool {
    return host == "localhost" || host.hasPrefix("127.")
  }

  private static func isPrivateNetworkHost(_ host: String) -> Bool {
    if host.hasSuffix(".local") {
      return true
    }
    if host.hasPrefix("10.") || host.hasPrefix("192.168.") || host.hasPrefix("169.254.") {
      return true
    }
    if host.hasPrefix("172.") {
      let octets = host.split(separator: ".")
      if octets.count == 4, let second = Int(octets[1]) {
        return (16...31).contains(second)
      }
    }
    return false
  }
}
