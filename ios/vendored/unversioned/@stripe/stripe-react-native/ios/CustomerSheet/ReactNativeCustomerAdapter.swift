//
//  ReactNativeCustomerAdapter.swift
//  stripe-react-native
//
//  Created by Charlie Cruzan on 9/5/23.
//

import Foundation
@_spi(PrivateBetaCustomerSheet) @_spi(STP) import StripePaymentSheet

class ReactNativeCustomerAdapter: StripeCustomerAdapter {
    var overridesFetchPaymentMethods: Bool
    var overridesAttachPaymentMethod: Bool
    var overridesDetachPaymentMethod: Bool
    var overridesSetSelectedPaymentOption: Bool
    var overridesFetchSelectedPaymentOption: Bool
    var overridesSetupIntentClientSecretForCustomerAttach: Bool
    var stripeSdk: StripeSdk
    
    init(
        fetchPaymentMethods: Bool,
        attachPaymentMethod: Bool,
        detachPaymentMethod: Bool,
        setSelectedPaymentOption: Bool,
        fetchSelectedPaymentOption: Bool,
        setupIntentClientSecretForCustomerAttach: Bool,
        customerId: String,
        ephemeralKeySecret: String,
        setupIntentClientSecret: String?,
        stripeSdk: StripeSdk
    ) {
        self.overridesFetchPaymentMethods = fetchPaymentMethods
        self.overridesAttachPaymentMethod = attachPaymentMethod
        self.overridesDetachPaymentMethod = detachPaymentMethod
        self.overridesSetSelectedPaymentOption = setSelectedPaymentOption
        self.overridesFetchSelectedPaymentOption = fetchSelectedPaymentOption
        self.overridesSetupIntentClientSecretForCustomerAttach = setupIntentClientSecretForCustomerAttach
        self.stripeSdk = stripeSdk
        
        if let setupIntentClientSecret = setupIntentClientSecret {
            super.init(
                customerEphemeralKeyProvider: {
                    return CustomerEphemeralKey(customerId: customerId, ephemeralKeySecret: ephemeralKeySecret)
                },
                setupIntentClientSecretProvider: {
                    return setupIntentClientSecret
                }
            )
        } else {
            super.init(
                customerEphemeralKeyProvider: {
                    return CustomerEphemeralKey(customerId: customerId, ephemeralKeySecret: ephemeralKeySecret)
                }
            )
        }
    }
    
    override func fetchPaymentMethods() async throws -> [STPPaymentMethod] {
        if (self.overridesFetchPaymentMethods) {
            return await withCheckedContinuation({ continuation in
                fetchPaymentMethods { paymentMethods in
                    continuation.resume(returning: paymentMethods)
                }
            })
        } else {
            return try await super.fetchPaymentMethods()
        }
    }
    
    override func attachPaymentMethod(_ paymentMethodId: String) async throws {
        if (self.overridesAttachPaymentMethod) {
            return await withCheckedContinuation({ continuation in
                attachPaymentMethod(paymentMethodId) {
                    continuation.resume(returning: ())
                }
            })
        } else {
            return try await super.attachPaymentMethod(paymentMethodId)
        }
    }
    
    override func detachPaymentMethod(paymentMethodId: String) async throws {
        if (self.overridesDetachPaymentMethod) {
            return await withCheckedContinuation({ continuation in
                detachPaymentMethod(paymentMethodId) {
                    continuation.resume(returning: ())
                }
            })
        } else {
            return try await super.detachPaymentMethod(paymentMethodId: paymentMethodId)
        }
    }
    
    override func setSelectedPaymentOption(paymentOption: CustomerPaymentOption?) async throws {
        if (self.overridesSetSelectedPaymentOption) {
            return await withCheckedContinuation({ continuation in
                setSelectedPaymentOption(paymentOption) {
                    continuation.resume(returning: ())
                }
            })
        } else {
            return try await super.setSelectedPaymentOption(paymentOption: paymentOption)
        }
    }
    
    override func fetchSelectedPaymentOption() async throws -> CustomerPaymentOption? {
        if (self.overridesFetchSelectedPaymentOption) {
            return await withCheckedContinuation({ continuation in
                fetchSelectedPaymentOption { paymentOption in
                    continuation.resume(returning: paymentOption)
                }
            })
        } else {
            return try await super.fetchSelectedPaymentOption()
        }
    }
    
    override func setupIntentClientSecretForCustomerAttach() async throws -> String {
        if (self.overridesSetupIntentClientSecretForCustomerAttach) {
            return await withCheckedContinuation({ continuation in
                setupIntentClientSecretForCustomerAttach { clientSecret in
                    continuation.resume(returning: clientSecret)
                }
            })
        } else {
            return try await super.setupIntentClientSecretForCustomerAttach()
        }
    }
}

extension ReactNativeCustomerAdapter {
    func fetchPaymentMethods(completion: @escaping ([STPPaymentMethod]) -> Void) {
        DispatchQueue.main.async {
            self.stripeSdk.fetchPaymentMethodsCallback = completion
            self.stripeSdk.sendEvent(withName: "onCustomerAdapterFetchPaymentMethodsCallback", body: [:])
        }
    }
    
    func attachPaymentMethod(_ paymentMethodId: String, completion: @escaping () -> Void) {
        DispatchQueue.main.async {
            self.stripeSdk.attachPaymentMethodCallback = completion
            self.stripeSdk.sendEvent(withName: "onCustomerAdapterAttachPaymentMethodCallback", body: ["paymentMethodId": paymentMethodId])
        }
    }
    
    func detachPaymentMethod(_ paymentMethodId: String, completion: @escaping () -> Void) {
        DispatchQueue.main.async {
            self.stripeSdk.detachPaymentMethodCallback = completion
            self.stripeSdk.sendEvent(withName: "onCustomerAdapterDetachPaymentMethodCallback", body: ["paymentMethodId": paymentMethodId])
        }
    }
    
    func setSelectedPaymentOption(_ paymentOption: CustomerPaymentOption?, completion: @escaping () -> Void) {
        DispatchQueue.main.async {
            self.stripeSdk.setSelectedPaymentOptionCallback = completion
            self.stripeSdk.sendEvent(withName: "onCustomerAdapterSetSelectedPaymentOptionCallback", body: ["paymentOption": paymentOption?.value])
        }
    }
    
    func fetchSelectedPaymentOption(completion: @escaping (CustomerPaymentOption?) -> Void) {
        DispatchQueue.main.async {
            self.stripeSdk.fetchSelectedPaymentOptionCallback = completion
            self.stripeSdk.sendEvent(withName: "onCustomerAdapterFetchSelectedPaymentOptionCallback", body: [:])
        }
    }
    
    func setupIntentClientSecretForCustomerAttach(completion: @escaping (String) -> Void) {
        DispatchQueue.main.async {
            self.stripeSdk.setupIntentClientSecretForCustomerAttachCallback = completion
            self.stripeSdk.sendEvent(withName: "onCustomerAdapterSetupIntentClientSecretForCustomerAttachCallback", body: [:])
        }
    }
}
