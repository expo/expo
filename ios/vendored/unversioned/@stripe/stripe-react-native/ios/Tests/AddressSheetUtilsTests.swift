//
//  AddressSheetUtilsTests.swift
//  stripe-react-native-Unit-Tests
//
//  Created by Charles Cruzan on 10/13/22.
//

import XCTest
@testable import stripe_react_native
import StripePaymentSheet

class AddressSheetUtilsTests: XCTestCase {
    let testCity = "testCity"
    let testCountry = "testCountry"
    let testLine1 = "testLine1"
    let testLine2 = "testLine2"
    let testPostalCode = "testPostalCode"
    let testState = "testState"
    let testName = "testName"
    let testPhone = "testPhone"
    
    func test_buildDefaultValues_whenPassedNil() throws {
        let result = AddressSheetUtils.buildDefaultValues(params: nil)
        XCTAssertEqual(
            result.address, PaymentSheet.Address()
        )
        XCTAssertEqual(
            result.name, nil
        )
        XCTAssertEqual(
            result.phone, nil
        )
        XCTAssertEqual(
            result.isCheckboxSelected, nil
        )
    }
    
    func test_buildDefaultValues_whenPassedValues() throws {
        let result = AddressSheetUtils.buildDefaultValues(
            params: ["name": testName,
                     "phone": testPhone,
                     "address": ["city": testCity],
                     "isCheckboxSelected": true]
        )
        XCTAssertEqual(
            result.address.city, testCity
        )
        XCTAssertEqual(
            result.name, testName
        )
        XCTAssertEqual(
            result.phone, testPhone
        )
        XCTAssertEqual(
            result.isCheckboxSelected, true
        )
    }
    
    func test_buildAddressDetails_whenPassedNil() throws {
        let result = AddressSheetUtils.buildAddressDetails(params: nil)
        XCTAssertEqual(
            result.address.country, ""
        )
        XCTAssertEqual(
            result.address.line1, ""
        )
        XCTAssertEqual(
            result.name, nil
        )
        XCTAssertEqual(
            result.phone, nil
        )
        XCTAssertEqual(
            result.isCheckboxSelected, nil
        )
    }
    
    func test_buildAddressDetails_whenPassedValues() throws {
        let result = AddressSheetUtils.buildAddressDetails(
            params: ["name": testName,
                     "phone": testPhone,
                     "address": ["city": testCity],
                     "isCheckboxSelected": true]
        )
        
        XCTAssertEqual(
            result.address.city, testCity
        )
        XCTAssertEqual(
            result.address.line1, ""
        )
        XCTAssertEqual(
            result.name, testName
        )
        XCTAssertEqual(
            result.phone, testPhone
        )
        XCTAssertEqual(
            result.isCheckboxSelected, true
        )
    }
    
    func test_buildAddress_forPaymentSheet_whenPassedNil() throws {
        let result: PaymentSheet.Address = AddressSheetUtils.buildAddress(params: nil)
        
        XCTAssertEqual(
            result.city, nil
        )
        XCTAssertEqual(
            result.line1, nil
        )
        XCTAssertEqual(
            result.line2, nil
        )
        XCTAssertEqual(
            result.country, nil
        )
        XCTAssertEqual(
            result.postalCode, nil
        )
        XCTAssertEqual(
            result.state, nil
        )
    }
    
    func test_buildAddress_forPaymentSheet_whenPassedValues() throws {
        let result: PaymentSheet.Address = AddressSheetUtils.buildAddress(
            params: ["city": testCity, "country": testCountry, "line1": testLine1, "line2": testLine2, "postalCode": testPostalCode, "state": testState]
        )
        
        XCTAssertEqual(
            result.city, testCity
        )
        XCTAssertEqual(
            result.line1, testLine1
        )
        XCTAssertEqual(
            result.line2, testLine2
        )
        XCTAssertEqual(
            result.country, testCountry
        )
        XCTAssertEqual(
            result.postalCode, testPostalCode
        )
        XCTAssertEqual(
            result.state, testState
        )
    }
    
    func test_buildAddress_forAddressViewController_whenPassedNil() throws {
        let result: AddressViewController.AddressDetails.Address = AddressSheetUtils.buildAddress(params: nil)
        
        XCTAssertEqual(
            result.city, nil
        )
        XCTAssertEqual(
            result.line1, ""
        )
        XCTAssertEqual(
            result.line2, nil
        )
        XCTAssertEqual(
            result.country, ""
        )
        XCTAssertEqual(
            result.postalCode, nil
        )
        XCTAssertEqual(
            result.state, nil
        )
    }
    
    func test_buildAddress_forAddressViewController_whenPassedValues() throws {
        let result: AddressViewController.AddressDetails.Address = AddressSheetUtils.buildAddress(
            params: ["city": testCity, "country": testCountry, "line1": testLine1, "line2": testLine2, "postalCode": testPostalCode, "state": testState]
        )
        
        XCTAssertEqual(
            result.city, testCity
        )
        XCTAssertEqual(
            result.line1, testLine1
        )
        XCTAssertEqual(
            result.line2, testLine2
        )
        XCTAssertEqual(
            result.country, testCountry
        )
        XCTAssertEqual(
            result.postalCode, testPostalCode
        )
        XCTAssertEqual(
            result.state, testState
        )
    }
    
    func test_buildAdditionalFieldsConfiguration_whenPassedNil() throws {
        let result = AddressSheetUtils.buildAdditionalFieldsConfiguration(params: nil)
        
        XCTAssertEqual(
            result.phone, .hidden
        )
        XCTAssertEqual(
            result.checkboxLabel, nil
        )
    }
    
    func test_buildAdditionalFieldsConfiguration_whenPassedValues() throws {
        let testCheckboxLabel = "testCheckboxLabel"
        let result = AddressSheetUtils.buildAdditionalFieldsConfiguration(
            params: ["name": "hidden", "phoneNumber": "optional", "checkboxLabel": testCheckboxLabel]
        )
        
        XCTAssertEqual(
            result.phone, .optional
        )
        XCTAssertEqual(
            result.checkboxLabel, testCheckboxLabel
        )
    }
    
    func test_getFieldConfiguration() throws {
        XCTAssertEqual(
            AddressSheetUtils.getFieldConfiguration(input: nil, default: .hidden), .hidden
        )
        
        XCTAssertEqual(
            AddressSheetUtils.getFieldConfiguration(input: "optional", default: .hidden), .optional
        )
        
        XCTAssertEqual(
            AddressSheetUtils.getFieldConfiguration(input: "required", default: .hidden), .required
        )
        
        XCTAssertEqual(
            AddressSheetUtils.getFieldConfiguration(input: "hidden", default: .hidden), .hidden
        )
        
        XCTAssertEqual(
            AddressSheetUtils.getFieldConfiguration(input: "hidden", default: .optional), .hidden
        )
    }
    
    func test_buildResult() throws {
        let input = AddressViewController.AddressDetails(
            address: AddressViewController.AddressDetails.Address(
                city: testCity, country: testCountry, line1: testLine1, line2: testLine2, postalCode: testPostalCode, state: testState
            ),
            name: testName,
            phone: testPhone,
            isCheckboxSelected: true
        )
        
        XCTAssertEqual(
            AddressSheetUtils.buildResult(address: input) as NSDictionary,
            [
                "name": testName,
                "phone": testPhone,
                "isCheckboxSelected": true,
                "address": [
                    "city": testCity,
                    "country": testCountry,
                    "line1": testLine1,
                    "line2": testLine2,
                    "postalCode": testPostalCode,
                    "state": testState
                ]
            ] as NSDictionary
        )
    }
}
