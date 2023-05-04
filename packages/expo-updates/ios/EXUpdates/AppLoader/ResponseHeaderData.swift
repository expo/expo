// Copyright 2015-present 650 Industries. All rights reserved.

import EXStructuredHeaders

/**
 * Data from the update response headers.
 * For non-multipart responses, this is the data from the headers in the response.
 * For multipart responses, this is the data from the headers in the outer response (as opposed to the headers in a part).
 */
internal final class ResponseHeaderData {
  /**
   * expo-protocol-version header. Indicates which version of the expo-updates protocol the response is.
   */
  private let protocolVersionRaw: String?

  /**
   * expo-server-defined-headers header.  It defines headers that this library must store until overwritten by a newer dictionary.
   * They must be included in every subsequent update request.
   */
  private let serverDefinedHeadersRaw: String?

  /**
   * expo-manifest-filters header. It is used to filter updates stored by the client library by the
   * `metadata` attribute found in the manifest. If a field is mentioned in the filter, the corresponding
   * field in the metadata must either be missing or equal for the update to be included.
   * The client library must store the manifest filters until it is overwritten by a newer response.
   */
  private let manifestFiltersRaw: String?

  /**
   * Classic updates Expo Go manifest signature
   */
  let manifestSignature: String?

  required init(protocolVersionRaw: String?, serverDefinedHeadersRaw: String?, manifestFiltersRaw: String?, manifestSignature: String?) {
    self.protocolVersionRaw = protocolVersionRaw
    self.serverDefinedHeadersRaw = serverDefinedHeadersRaw
    self.manifestFiltersRaw = manifestFiltersRaw
    self.manifestSignature = manifestSignature
  }

  lazy var protocolVersion: Int? = {
    self.protocolVersionRaw.let { it in
      Int(it)
    }
  }()

  lazy var serverDefinedHeaders: [String: Any]? = {
    self.serverDefinedHeadersRaw.let { it in
      ResponseHeaderData.dictionaryWithStructuredHeader(it)
    }
  }()

  lazy var manifestFilters: [String: Any]? = {
    self.manifestFiltersRaw.let { it in
      ResponseHeaderData.dictionaryWithStructuredHeader(it)
    }
  }()

  static func dictionaryWithStructuredHeader(_ headerString: String) -> [String: Any]? {
    let parser = EXStructuredHeadersParser(
      rawInput: headerString,
      fieldType: EXStructuredHeadersParserFieldType.dictionary,
      ignoringParameters: true
    )
    let parserOutput: Any
    do {
      parserOutput = try parser.parseStructuredFields()
    } catch let error as NSError {
      NSLog("Error parsing header value: %@", error.localizedDescription)
      return nil
    }

    guard let parserOutputDictionary = parserOutput as? [String: Any] else {
      NSLog("Error parsing header value: %@", "Header was not a structured fields dictionary")
      return nil
    }

    // ignore any dictionary entries whose type is not string, number, or boolean
    // since this will be re-serialized to JSON
    // The only way I can figure out how to detect numbers is to do a is NSNumber (is any Numeric didn't work)
    // swiftlint:disable:next legacy_objc_type
    return parserOutputDictionary.filter { $0.value is String || $0.value is NSNumber || $0.value is Bool }
  }
}

/**
 * Data from the update response part headers.
 * For non-multipart responses, this is the data from the headers in the response.
 * For multipart responses, this is the data from the headers in the part.
 */
internal final class ResponsePartHeaderData: NSObject {
  /**
   * Code signing signature for response part.
   */
  let signature: String?

  required init(signature: String?) {
    self.signature = signature
  }
}

/**
 * Full info about a update response part.
 * For non-multipart responses, this is the info about the full response.
 * For multipart responses, this is the info about a single part (but includes the outer headers for processing).
 */
internal final class ResponsePartInfo {
  let responseHeaderData: ResponseHeaderData
  let responsePartHeaderData: ResponsePartHeaderData
  let body: Data

  required init(responseHeaderData: ResponseHeaderData, responsePartHeaderData: ResponsePartHeaderData, body: Data) {
    self.responseHeaderData = responseHeaderData
    self.responsePartHeaderData = responsePartHeaderData
    self.body = body
  }
}
