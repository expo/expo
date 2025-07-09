// swiftlint:disable all
//
//  ASN1DERDecoder.swift
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

public class ASN1DERDecoder {

    public static func decode(data: Data) throws -> [ASN1Object] {
        var iterator = data.makeIterator()
        return try parse(iterator: &iterator)
    }

    private static func parse(iterator: inout Data.Iterator) throws -> [ASN1Object] {

        var result: [ASN1Object] = []
        
        while let nextValue = iterator.next() {

            let asn1obj = ASN1Object()
            asn1obj.identifier = ASN1Identifier(rawValue: nextValue)

            if asn1obj.identifier!.isConstructed() {

                let contentData = try loadSubContent(iterator: &iterator)

                if contentData.isEmpty {
                    asn1obj.sub = try parse(iterator: &iterator)
                } else {
                    var subIterator = contentData.makeIterator()
                    asn1obj.sub = try parse(iterator: &subIterator)
                }

                asn1obj.value = nil

                asn1obj.rawValue = Data(contentData)

                for item in asn1obj.sub! {
                    item.parent = asn1obj
                }
            } else {

                if asn1obj.identifier!.typeClass() == .universal {

                    var contentData = try loadSubContent(iterator: &iterator)

                    asn1obj.rawValue = Data(contentData)

                    // decode the content data with come more convenient format

                    switch asn1obj.identifier!.tagNumber() {

                    case .endOfContent:
                        return result

                    case .boolean:
                        if let value = contentData.first {
                            asn1obj.value = value > 0 ? true : false

                        }

                    case .integer:
                        while contentData.first == 0 {
                            contentData.remove(at: 0) // remove not significant digit
                        }
                        asn1obj.value = contentData

                    case .null:
                        asn1obj.value = nil

                    case .objectIdentifier:
                        asn1obj.value = decodeOid(contentData: &contentData)

                    case .utf8String,
                         .printableString,
                         .numericString,
                         .generalString,
                         .universalString,
                         .characterString,
                         .t61String:

                        asn1obj.value = String(data: contentData, encoding: .utf8)

                    case .bmpString:
                        asn1obj.value = String(data: contentData, encoding: .unicode)

                    case .visibleString,
                         .ia5String:

                        asn1obj.value = String(data: contentData, encoding: .ascii)

                    case .utcTime:
                        asn1obj.value = dateFormatter(contentData: &contentData,
                                                         formats: ["yyMMddHHmmssZ", "yyMMddHHmmZ"])

                    case .generalizedTime:
                        asn1obj.value = dateFormatter(contentData: &contentData,
                                                         formats: ["yyyyMMddHHmmssZ"])

                    case .bitString:
                        if contentData.count > 0 {
                            _ = contentData.remove(at: 0) // unused bits
                        }
                        asn1obj.value = contentData
                    
                    case .octetString:
                        do {
                            var subIterator = contentData.makeIterator()
                            asn1obj.sub = try parse(iterator: &subIterator)
                        } catch {
                            if let str = String(data: contentData, encoding: .utf8) {
                                asn1obj.value = str
                            } else {
                                asn1obj.value = contentData
                            }
                        }

                    default:
                        print("unsupported tag: \(asn1obj.identifier!.tagNumber())")
                        asn1obj.value = contentData
                    }
                } else {
                    // custom/private tag

                    let contentData = try loadSubContent(iterator: &iterator)
                    asn1obj.rawValue = Data(contentData)

                    if let str = String(data: contentData, encoding: .utf8) {
                        asn1obj.value = str
                    } else {
                        asn1obj.value = contentData
                    }
                }
            }
            result.append(asn1obj)
        }
        return result
    }

    // Decode DER OID bytes to String with dot notation
    static func decodeOid(contentData: inout Data) -> String? {
        if contentData.isEmpty {
            return nil
        }

        var oid: String = ""

        let first = Int(contentData.remove(at: 0))
        oid.append("\(first / 40).\(first % 40)")

        var t = 0
        while contentData.count > 0 {
            let n = Int(contentData.remove(at: 0))
            t = (t << 7) | (n & 0x7F)
            if (n & 0x80) == 0 {
                oid.append(".\(t)")
                t = 0
            }
        }
        return oid
    }

    private static func dateFormatter(contentData: inout Data, formats: [String]) -> Date? {
        guard let str = String(data: contentData, encoding: .utf8) else { return nil }
        for format in formats {
            let fmt = DateFormatter()
            fmt.locale = Locale(identifier: "en_US_POSIX")
            fmt.dateFormat = format
            if let dt = fmt.date(from: str) {
                return dt
            }
        }
        return nil
    }
}

enum ASN1Error: Error {
    case parseError
    case outOfBuffer
}

extension Data {
    public var uint64Value: UInt64? {
        guard count <= 8, !isEmpty else { // check if suitable for UInt64
            return nil
        }

        var value: UInt64 = 0
        for (index, byte) in self.enumerated() {
            value += UInt64(byte) << UInt64(8*(count-index-1))
        }
        return value
    }
}

extension Data {
    public var sequenceContent: Data {
        var iterator = self.makeIterator()
        _ = iterator.next()
        do {
            return try loadSubContent(iterator: &iterator)
        } catch {
            return self
        }
    }
}

// Decode the number of bytes of the content
private func getContentLength(iterator: inout Data.Iterator) -> UInt64 {
    let first = iterator.next()

    guard first != nil else {
        return 0
    }

    if (first! & 0x80) != 0 { // long
        let octetsToRead = first! - 0x80
        var data = Data()
        for _ in 0..<octetsToRead {
            if let n = iterator.next() {
                data.append(n)
            }
        }

        return data.uint64Value ?? 0

    } else { // short
        return UInt64(first!)
    }
}

private func loadSubContent(iterator: inout Data.Iterator) throws -> Data {

    let len = getContentLength(iterator: &iterator)

    guard len < Int.max else {
        return Data()
    }

    var byteArray: [UInt8] = []

    for _ in 0..<Int(len) {
        if let n = iterator.next() {
            byteArray.append(n)
        } else {
            throw ASN1Error.outOfBuffer
        }
    }
    return Data(byteArray)
}
// swiftlint:enable all
