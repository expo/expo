// swiftlint:disable all
//
//  PKCS7.swift
//
//  Copyright © 2017 Filippo Maguolo.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in all
//  copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//  SOFTWARE.

import Foundation

public class PKCS7 {
    public let mainBlock: ASN1Object

    public init(data: Data) throws {
        let asn1 = try ASN1DERDecoder.decode(data: data)

        guard let firstBlock = asn1.first,
            let mainBlock = firstBlock.sub(1)?.sub(0) else {
            throw PKCS7Error.parseError
        }

        self.mainBlock = mainBlock

        guard firstBlock.sub(0)?.value as? String == OID.pkcs7signedData.rawValue else {
            throw PKCS7Error.notSupported
        }
    }

    public var digestAlgorithm: String? {
        if let block = mainBlock.sub(1) {
            return firstLeafValue(block: block) as? String
        }
        return nil
    }

    public var digestAlgorithmName: String? {
        return OID.description(of: digestAlgorithm ?? "") ?? digestAlgorithm
    }

    public var certificate: X509Certificate? {
        return mainBlock.sub(3)?.sub?.first.map { try? X509Certificate(asn1: $0) } ?? nil
    }

    public var certificates: [X509Certificate] {
        return mainBlock.sub(3)?.sub?.compactMap { try? X509Certificate(asn1: $0) } ?? []
    }

    public var data: Data? {
        if let block = mainBlock.findOid(.pkcs7data) {
            if let dataBlock = block.parent?.sub?.last {
                var out = Data()
                if let value = dataBlock.value as? Data {
                    out.append(value)
                } else if dataBlock.value is String, let rawValue = dataBlock.rawValue {
                    out.append(rawValue)
                } else {
                    for sub in dataBlock.sub ?? [] {
                        if let value = sub.value as? Data {
                            out.append(value)
                        } else if sub.value is String, let rawValue = sub.rawValue {
                            out.append(rawValue)
                        } else {
                            for sub2 in sub.sub ?? [] {
                                if let value = sub2.rawValue {
                                    out.append(value)
                                }
                            }
                        }
                    }
                }
                return out.count > 0 ? out : nil
            }
        }
        return nil
    }
}

enum PKCS7Error: Error {
    case notSupported
    case parseError
}
// swiftlint:enable all
