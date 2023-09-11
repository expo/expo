// swiftlint:disable all
//
//  ASN1Encoder.swift
//  ASN1Decoder
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

public class ASN1DEREncoder {
    
    public static func encodeSequence(content: Data) -> Data {
        var encoded = Data()
        encoded.append(ASN1Identifier.constructedTag | ASN1Identifier.TagNumber.sequence.rawValue)
        encoded.append(contentLength(of: content.count))
        encoded.append(content)
        return encoded
    }
 
    private static func contentLength(of size: Int) -> Data {
        if size >= 128 {
            var lenBytes = byteArray(from: size)
            while lenBytes.first == 0 { lenBytes.removeFirst() }
            let len: UInt8 = 0x80 | UInt8(lenBytes.count)
            return Data([len] + lenBytes)
        } else {
            return Data([UInt8(size)])
        }
    }
    
    private static func byteArray<T>(from value: T) -> [UInt8] where T: FixedWidthInteger {
        return withUnsafeBytes(of: value.bigEndian, Array.init)
    }
    
}

extension Data {
    public var derEncodedSequence: Data {
        return ASN1DEREncoder.encodeSequence(content: self)
    }
}
// swiftlint:enable all
