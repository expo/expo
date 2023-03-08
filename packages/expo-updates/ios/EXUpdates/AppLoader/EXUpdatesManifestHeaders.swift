//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

public final class EXUpdatesManifestHeaders {
  public let protocolVersion: String?
  public let serverDefinedHeaders: String?
  public let manifestFilters: String?

  /// Classic updates Expo Go manifest signature
  public let manifestSignature: String?

  /// Code signing manifest signature
  public let signature: String?

  public required init(protocolVersion: String?, serverDefinedHeaders: String?, manifestFilters: String?, manifestSignature: String?, signature: String?) {
    self.protocolVersion = protocolVersion
    self.serverDefinedHeaders = serverDefinedHeaders
    self.manifestFilters = manifestFilters
    self.manifestSignature = manifestSignature
    self.signature = signature
  }
}
