// swiftlint:disable all
//
//  X509ExtensionClasses.swift
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

extension X509Certificate {
    
    /// Recognition for Basic Constraint Extension (2.5.29.19)
    public class BasicConstraintExtension: X509Extension {
        
        public var isCA: Bool {
            return (valueAsBlock?.sub(0)?.sub(0)?.value as? Bool) ?? false
        }
        
        public var pathLenConstraint: UInt64? {
            guard let data = valueAsBlock?.sub(0)?.sub(1)?.value as? Data else {
                return nil
            }
            return data.uint64Value
        }
    }

    /// Recognition for Subject Key Identifier Extension (2.5.29.14)
    public class SubjectKeyIdentifierExtension: X509Extension {
        
        public override var value: Any? {
            guard let rawValue = valueAsBlock?.rawValue else {
                return nil
            }
            return rawValue.sequenceContent
        }
    }
    
    // MARK: - Authority Extensions
    
    public struct AuthorityInfoAccess {
        public let method: String
        public let location: String
    }
    
    /// Recognition for Authority Info Access Extension (1.3.6.1.5.5.7.1.1)
    public class AuthorityInfoAccessExtension: X509Extension {
        
        public var infoAccess: [AuthorityInfoAccess]? {
            guard let valueAsBlock = valueAsBlock else {
                return nil
            }
            let subs = valueAsBlock.sub(0)?.sub ?? []
            
            return subs.compactMap { sub in
                guard var oidData = sub.sub(0)?.rawValue,
                      let nameBlock = sub.sub(1) else {
                    return nil
                }
                if
                    let oid = ASN1DERDecoder.decodeOid(contentData: &oidData),
                    let location = generalName(of: nameBlock) {
                    return AuthorityInfoAccess(method: oid, location: location)
                } else {
                    return nil
                }
            }
        }
    }
    
    /// Recognition for Authority Key Identifier Extension (2.5.29.35)
    public class AuthorityKeyIdentifierExtension: X509Extension {
        
        /*
        AuthorityKeyIdentifier ::= SEQUENCE {
           keyIdentifier             [0] KeyIdentifier           OPTIONAL,
           authorityCertIssuer       [1] GeneralNames            OPTIONAL,
           authorityCertSerialNumber [2] CertificateSerialNumber OPTIONAL  }
        */
        
        public var keyIdentifier: Data? {
            guard let sequence = valueAsBlock?.sub(0)?.sub else {
                return nil
            }
            if let sub = sequence.first(where: { $0.identifier?.tagNumber().rawValue == 0 }) {
                return sub.rawValue
            }
            return nil
        }

        public var certificateIssuer: [String]? {
            guard let sequence = valueAsBlock?.sub(0)?.sub else {
                return nil
            }
            if let sub = sequence.first(where: { $0.identifier?.tagNumber().rawValue == 1 }) {
                return sub.sub?.compactMap { generalName(of: $0) }
            }
            return nil
        }

        public var serialNumber: Data? {
            guard let sequence = valueAsBlock?.sub(0)?.sub else {
                return nil
            }
            if let sub = sequence.first(where: { $0.identifier?.tagNumber().rawValue == 2 }) {
                return sub.rawValue
            }
            return nil
        }
    }
    
    // MARK: - Certificate Policies Extension
    
    public struct CertificatePolicyQualifier {
        public let oid: String
        public let value: String?
    }
    public struct CertificatePolicy {
        public let oid: String
        public let qualifiers: [CertificatePolicyQualifier]?
    }
    
    /// Recognition for Certificate Policies Extension (2.5.29.32)
    public class CertificatePoliciesExtension: X509Extension {
        
        public var policies: [CertificatePolicy]? {
            guard let valueAsBlock = valueAsBlock else {
                return nil
            }
            let subs = valueAsBlock.sub(0)?.sub ?? []
            
            return subs.compactMap { sub in
                guard
                    var data = sub.sub(0)?.rawValue,
                    let oid = ASN1DERDecoder.decodeOid(contentData: &data) else {
                    return nil
                }
                var qualifiers: [CertificatePolicyQualifier]?
                if let subQualifiers = sub.sub(1) {
                    qualifiers = subQualifiers.sub?.compactMap { sub in
                        if var rawValue = sub.sub(0)?.rawValue, let oid = ASN1DERDecoder.decodeOid(contentData: &rawValue) {
                            let value = sub.sub(1)?.asString
                            return CertificatePolicyQualifier(oid: oid, value: value)
                        } else {
                            return nil
                        }
                    }
                }
                return CertificatePolicy(oid: oid, qualifiers: qualifiers)
            }
        }
    }
    
    // MARK: - CRL Distribution Points
    
    public class CRLDistributionPointsExtension: X509Extension {
        
        public var crls: [String]? {
            guard let valueAsBlock = valueAsBlock else {
                return nil
            }
            let subs = valueAsBlock.sub(0)?.sub ?? []
            return subs.compactMap { $0.asString }
        }
    }
}
// swiftlint:enable all
