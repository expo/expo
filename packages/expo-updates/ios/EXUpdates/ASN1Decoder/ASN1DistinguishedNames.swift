// swiftlint:disable all
//
//  ASN1DistinguishedNames.swift
//
//  Copyright © 2019 Filippo Maguolo.
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

@available(*, deprecated, message: "Use OID instead")
public class ASN1DistinguishedNames {

    public let oid: String
    public let representation: String

    init(oid: String, representation: String) {
        self.oid = oid
        self.representation = representation
    }

    public static let commonName             = ASN1DistinguishedNames(oid: "2.5.4.3", representation: "CN")
    public static let dnQualifier            = ASN1DistinguishedNames(oid: "2.5.4.46", representation: "DNQ")
    public static let serialNumber           = ASN1DistinguishedNames(oid: "2.5.4.5", representation: "SERIALNUMBER")
    public static let givenName              = ASN1DistinguishedNames(oid: "2.5.4.42", representation: "GIVENNAME")
    public static let surname                = ASN1DistinguishedNames(oid: "2.5.4.4", representation: "SURNAME")
    public static let organizationalUnitName = ASN1DistinguishedNames(oid: "2.5.4.11", representation: "OU")
    public static let organizationName       = ASN1DistinguishedNames(oid: "2.5.4.10", representation: "O")
    public static let streetAddress          = ASN1DistinguishedNames(oid: "2.5.4.9", representation: "STREET")
    public static let localityName           = ASN1DistinguishedNames(oid: "2.5.4.7", representation: "L")
    public static let stateOrProvinceName    = ASN1DistinguishedNames(oid: "2.5.4.8", representation: "ST")
    public static let countryName            = ASN1DistinguishedNames(oid: "2.5.4.6", representation: "C")
    public static let email                  = ASN1DistinguishedNames(oid: "1.2.840.113549.1.9.1", representation: "E")
}

public class ASN1DistinguishedNameFormatter {
    
    public static var separator = ", "

    // Format subject/issuer information in RFC1779
    class func string(from block: ASN1Object) -> String? {
        var result: String?
        for sub in block.sub ?? [] {
            if let subOid = sub.sub(0)?.sub(0), subOid.identifier?.tagNumber() == .objectIdentifier,
               let oidString = subOid.value as? String, let value = sub.sub(0)?.sub(1)?.value as? String {
                if result == nil {
                    result = ""
                } else {
                    result?.append(separator)
                }
                if let oid = OID(rawValue: oidString) {
                    if let representation = shortRepresentation(oid: oid) {
                        result?.append(representation)
                    } else {
                        result?.append("\(oid)")
                    }
                } else {
                    result?.append(oidString)
                }
                result?.append("=")
                result?.append(quote(string: value))
            }
        }
        return result
    }
    
    class func quote(string: String) -> String {
        let specialChar = ",+=\n<>#;\\"
        if string.contains(where: { specialChar.contains($0) }) {
            return "\"" + string + "\""
        } else {
            return string
        }
    }
    
    class func shortRepresentation(oid: OID) -> String? {
        switch oid {
        case .commonName: return "CN"
        case .dnQualifier: return "DNQ"
        case .serialNumber: return "SERIALNUMBER"
        case .givenName: return "GIVENNAME"
        case .surname: return "SURNAME"
        case .organizationalUnitName: return "OU"
        case .organizationName: return "O"
        case .streetAddress: return "STREET"
        case .localityName: return "L"
        case .stateOrProvinceName: return "ST"
        case .countryName: return "C"
        case .emailAddress: return "E"
        case .domainComponent: return "DC"
        case .jurisdictionLocalityName: return "jurisdictionL"
        case .jurisdictionStateOrProvinceName: return "jurisdictionST"
        case .jurisdictionCountryName: return "jurisdictionC"
        default: return nil
        }
    }
}
// swiftlint:enable all
