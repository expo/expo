// swiftlint:disable all
//
//  X509ExtensionAltName.swift
//
//  Copyright © 2020 Filippo Maguolo.
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

extension X509Extension {
    
    // Used for SubjectAltName and IssuerAltName
    // Every name can be one of these subtype:
    //  - otherName      [0] INSTANCE OF OTHER-NAME,
    //  - rfc822Name     [1] IA5String,
    //  - dNSName        [2] IA5String,
    //  - x400Address    [3] ORAddress,
    //  - directoryName  [4] Name,
    //  - ediPartyName   [5] EDIPartyName,
    //  - uniformResourceIdentifier [6] IA5String,
    //  - IPAddress      [7] OCTET STRING,
    //  - registeredID   [8] OBJECT IDENTIFIER
    //
    // Result does not support: x400Address and ediPartyName
    //
    var alternativeNameAsStrings: [String] {
        var result: [String] = []
        for item in block.sub?.last?.sub?.last?.sub ?? [] {
            guard let name = generalName(of: item) else {
                continue
            }
            result.append(name)
        }
        return result
    }
    
    func generalName(of item: ASN1Object) -> String? {
        guard let nameType = item.identifier?.tagNumber().rawValue else {
            return nil
        }
        switch nameType {
        case 0:
            if let name = item.sub?.last?.sub?.last?.value as? String {
                return name
            }
        case 1, 2, 6:
            if let name = item.value as? String {
                return name
            }
        case 4:
            if let sequence = item.sub(0) {
                return ASN1DistinguishedNameFormatter.string(from: sequence)
            }
        case 7:
            if let ip = item.value as? Data {
                return ip.map({ "\($0)" }).joined(separator: ".")
            }
        case 8:
            if let value = item.value as? String, var data = value.data(using: .utf8) {
                let oid = ASN1DERDecoder.decodeOid(contentData: &data)
                return oid
            }
        default:
            return nil
        }
        return nil
    }
}
// swiftlint:enable all
