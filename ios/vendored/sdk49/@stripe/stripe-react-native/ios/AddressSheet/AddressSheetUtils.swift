//
//  AddressSheetUtils.swift
//  stripe-react-native
//
//  Created by Charles Cruzan on 10/12/22.
//

import Foundation
import StripePaymentSheet

class AddressSheetUtils {
    internal class func buildDefaultValues(params: NSDictionary?) -> AddressViewController.Configuration.DefaultAddressDetails {
        guard let params = params else {
            return AddressViewController.Configuration.DefaultAddressDetails()
        }
        
        return AddressViewController.Configuration.DefaultAddressDetails(
            address: buildAddress(params: params["address"] as? NSDictionary),
            name: params["name"] as? String,
            phone: params["phone"] as? String,
            isCheckboxSelected: params["isCheckboxSelected"] as? Bool
        )
    }
    
    internal class func buildAddressDetails(params: NSDictionary?) -> AddressViewController.AddressDetails {
        guard let params = params else { return AddressViewController.AddressDetails(address: buildAddress(params: nil)) }
        return AddressViewController.AddressDetails(
            address: buildAddress(params: params["address"] as? NSDictionary),
            name: params["name"] as? String,
            phone: params["phone"] as? String,
            isCheckboxSelected: params["isCheckboxSelected"] as? Bool)
    }
    
    internal class func buildAddress(params: NSDictionary?) -> PaymentSheet.Address {
        guard let params = params else { return PaymentSheet.Address() }
        return PaymentSheet.Address(
            city: params["city"] as? String,
            country: params["country"] as? String,
            line1: params["line1"] as? String,
            line2: params["line2"] as? String,
            postalCode: params["postalCode"] as? String,
            state: params["state"] as? String
        )
    }
    
    internal class func buildAddress(params: NSDictionary?) -> AddressViewController.AddressDetails.Address {
        guard let params = params else { return AddressViewController.AddressDetails.Address(country: "", line1: "") }
        return AddressViewController.AddressDetails.Address(
            city: params["city"] as? String,
            country: params["country"] as? String ?? "",
            line1: params["line1"] as? String ?? "",
            line2: params["line2"] as? String,
            postalCode: params["postalCode"] as? String,
            state: params["state"] as? String
        )
    }
    
    internal class func buildAdditionalFieldsConfiguration(params: NSDictionary?) -> AddressViewController.Configuration.AdditionalFields {
        guard let params = params else {
            return AddressViewController.Configuration.AdditionalFields(phone: .hidden, checkboxLabel: nil)
        }

        return AddressViewController.Configuration.AdditionalFields(
            phone: getFieldConfiguration(input: params["phoneNumber"] as? String, default: .hidden),
            checkboxLabel: params["checkboxLabel"] as? String
        )
    }
    
    internal class func getFieldConfiguration(input: String?, default: AddressViewController.Configuration.AdditionalFields.FieldConfiguration) -> AddressViewController.Configuration.AdditionalFields.FieldConfiguration {
        switch (input) {
        case "optional":
            return .optional
        case "required":
            return .required
        case "hidden":
            return .hidden
        default:
            return `default`
        }
    }
    
    internal class func buildResult(address: AddressViewController.AddressDetails) -> [AnyHashable : Any] {
        return [
            "name": address.name ?? NSNull(),
            "address": [
                "country": address.address.country,
                "state": address.address.state,
                "line1": address.address.line1,
                "line2": address.address.line2,
                "postalCode": address.address.postalCode,
                "city": address.address.city,
            ],
            "phone": address.phone ?? NSNull(),
            "isCheckboxSelected": address.isCheckboxSelected ?? NSNull(),
        ] as [AnyHashable : Any]
    }

}
