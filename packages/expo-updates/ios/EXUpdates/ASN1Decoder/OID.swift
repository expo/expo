// swiftlint:disable all
//
//  OID.swift
//  ASN1Decoder
//
//  Created by Filippo Maguolo on 01/12/2019.
//  Copyright © 2019 Filippo Maguolo. All rights reserved.
//

import Foundation

public enum OID: String {
    case etsiQcsCompliance = "0.4.0.1862.1.1"
    case etsiQcsRetentionPeriod = "0.4.0.1862.1.3"
    case etsiQcsQcSSCD = "0.4.0.1862.1.4"
    case dsa = "1.2.840.10040.4.1"
    case ecPublicKey = "1.2.840.10045.2.1"
    case prime256v1 = "1.2.840.10045.3.1.7"
    case ecdsaWithSHA256 = "1.2.840.10045.4.3.2"
    case ecdsaWithSHA512 = "1.2.840.10045.4.3.4"
    case rsaEncryption = "1.2.840.113549.1.1.1"
    case sha256WithRSAEncryption = "1.2.840.113549.1.1.11"
    case md5WithRSAEncryption = "1.2.840.113549.1.1.4"
    case sha1WithRSAEncryption = "1.2.840.113549.1.1.5"
    
    // Digest algorithms
    case sha1 = "1.3.14.3.2.26"
    case pkcsSha256 = "1.3.6.1.4.1.22554.1.2.1"
    case sha2Family = "1.3.6.1.4.1.22554.1.2"
    case sha3_244 = "2.16.840.1.101.3.4.2.7"
    case sha3_256 = "2.16.840.1.101.3.4.2.8"
    case sha3_384 = "2.16.840.1.101.3.4.2.9"
    case md5 = "0.2.262.1.10.1.3.2"
    
    case pkcs7data = "1.2.840.113549.1.7.1"
    case pkcs7signedData = "1.2.840.113549.1.7.2"
    case pkcs7envelopedData = "1.2.840.113549.1.7.3"
    case emailAddress = "1.2.840.113549.1.9.1"
    case signingCertificateV2 = "1.2.840.113549.1.9.16.2.47"
    case contentType = "1.2.840.113549.1.9.3"
    case messageDigest = "1.2.840.113549.1.9.4"
    case signingTime = "1.2.840.113549.1.9.5"
    case certificateExtension = "1.3.6.1.4.1.11129.2.4.2"
    case jurisdictionLocalityName = "1.3.6.1.4.1.311.60.2.1.1"
    case jurisdictionStateOrProvinceName = "1.3.6.1.4.1.311.60.2.1.2"
    case jurisdictionCountryName = "1.3.6.1.4.1.311.60.2.1.3"
    case authorityInfoAccess = "1.3.6.1.5.5.7.1.1"
    case qcStatements = "1.3.6.1.5.5.7.1.3"
    case cps = "1.3.6.1.5.5.7.2.1"
    case unotice = "1.3.6.1.5.5.7.2.2"
    case serverAuth = "1.3.6.1.5.5.7.3.1"
    case clientAuth = "1.3.6.1.5.5.7.3.2"
    case ocsp = "1.3.6.1.5.5.7.48.1"
    case caIssuers = "1.3.6.1.5.5.7.48.2"
    case dateOfBirth = "1.3.6.1.5.5.7.9.1"
    case sha256 = "2.16.840.1.101.3.4.2.1"
    case VeriSignEVpolicy = "2.16.840.1.113733.1.7.23.6"
    case extendedValidation = "2.23.140.1.1"
    case organizationValidated = "2.23.140.1.2.2"
    case subjectKeyIdentifier = "2.5.29.14"
    case keyUsage = "2.5.29.15"
    case subjectAltName = "2.5.29.17"
    case issuerAltName = "2.5.29.18"
    case basicConstraints = "2.5.29.19"
    case cRLDistributionPoints = "2.5.29.31"
    case certificatePolicies = "2.5.29.32"
    case authorityKeyIdentifier = "2.5.29.35"
    case extKeyUsage = "2.5.29.37"
    case subjectDirectoryAttributes = "2.5.29.9"
    
    // X.500 attributes
    case commonName = "2.5.4.3"
    case surname = "2.5.4.4"
    case serialNumber = "2.5.4.5"
    case countryName = "2.5.4.6"
    case localityName = "2.5.4.7"
    case stateOrProvinceName = "2.5.4.8"
    case streetAddress = "2.5.4.9"
    case organizationName = "2.5.4.10"
    case organizationalUnitName = "2.5.4.11"
    case businessCategory = "2.5.4.15"
    case postalCode = "2.5.4.17"
    case givenName = "2.5.4.42"
    case dnQualifier = "2.5.4.46"
    
    case domainComponent = "0.9.2342.19200300.100.1.25"

    case userId = "0.9.2342.19200300.100.1.1"
    
    static func description(of value: String) -> String? {
        guard let oid = OID(rawValue: value) else {
            return nil
        }
        return "\(oid)"
    }
}
// swiftlint:enable all
