//
//  ApplePayViewController.swift
//  stripe-react-native
//
//  Created by Charles Cruzan on 9/15/22.
//

import Foundation
import Stripe

extension StripeSdk : PKPaymentAuthorizationViewControllerDelegate, STPApplePayContextDelegate {
    func paymentAuthorizationViewController(
        _ controller: PKPaymentAuthorizationViewController,
        didAuthorizePayment payment: PKPayment,
        handler completion: @escaping (PKPaymentAuthorizationResult) -> Void
    ) {
        applePaymentMethodFlowCanBeCanceled = false
        
        if (platformPayUsesDeprecatedTokenFlow) {
            STPAPIClient.shared.createToken(with: payment) { token, error in
                if let error = error {
                    self.createPlatformPayPaymentMethodResolver?(Errors.createError(ErrorType.Failed, error))
                } else {
                    let promiseResult = [
                        "token": token != nil ? Mappers.mapFromToken(token: token!.splitApplePayAddressByNewline()) : [:]
                    ]
                    self.createPlatformPayPaymentMethodResolver?(promiseResult)
                }
                completion(PKPaymentAuthorizationResult.init(status: .success, errors: nil))
            }
        } else {
            STPAPIClient.shared.createPaymentMethod(with: payment) { paymentMethod, error in
                if let error = error {
                    self.createPlatformPayPaymentMethodResolver?(Errors.createError(ErrorType.Failed, error))
                } else {
                    let promiseResult = [
                        "paymentMethod": Mappers.mapFromPaymentMethod(paymentMethod?.splitApplePayAddressByNewline()) ?? [:]
                    ]
                    self.createPlatformPayPaymentMethodResolver?(promiseResult)
                }
                completion(PKPaymentAuthorizationResult.init(status: .success, errors: nil))
            }
        }
    }
    
    func paymentAuthorizationViewControllerDidFinish(
        _ controller: PKPaymentAuthorizationViewController
    ) {
        if (applePaymentMethodFlowCanBeCanceled) {
            self.createPlatformPayPaymentMethodResolver?(Errors.createError(ErrorType.Canceled, "The payment has been canceled"))
            applePaymentMethodFlowCanBeCanceled = false
        }
        _ = maybeDismissApplePay()
    }
    
    func maybeDismissApplePay() -> Bool {
        if let applePaymentAuthorizationController = applePaymentAuthorizationController {
            DispatchQueue.main.async {
                applePaymentAuthorizationController.dismiss(animated: true)
            }
            return true
        }
        return false
    }
    
    @available(iOS 15.0, *)
    func paymentAuthorizationViewController(
        _ controller: PKPaymentAuthorizationViewController,
        didChangeCouponCode couponCode: String,
        handler completion: @escaping (PKPaymentRequestCouponCodeUpdate) -> Void
    ) {
        if let callback = self.couponCodeEnteredJSCallback {
            self.couponCodeUpdateCompletion = completion
            callback(["couponCode": couponCode])
        } else {
            completion(
                PKPaymentRequestCouponCodeUpdate.init(
                     errors: self.applePayCouponCodeErrors,
                     paymentSummaryItems: self.applePaySummaryItems,
                     shippingMethods: self.applePayShippingMethods
                )
            )
        }
    }
    
    func paymentAuthorizationViewController(
        _ controller: PKPaymentAuthorizationViewController,
        didSelect shippingMethod: PKShippingMethod,
        handler completion: @escaping (PKPaymentRequestShippingMethodUpdate) -> Void
    ) {
        if let callback = self.shippingMethodUpdateJSCallback {
            self.shippingMethodUpdateCompletion = completion
            callback(["shippingMethod": Mappers.mapFromShippingMethod(shippingMethod: shippingMethod)])
        } else {
            completion(
                PKPaymentRequestShippingMethodUpdate.init(paymentSummaryItems: applePaySummaryItems)
            )
        }
    }
    
    func paymentAuthorizationViewController(
        _ controller: PKPaymentAuthorizationViewController,
        didSelectShippingContact contact: PKContact,
        handler completion: @escaping (PKPaymentRequestShippingContactUpdate) -> Void
    ) {
        if let callback = self.shippingContactUpdateJSCallback {
            self.shippingContactUpdateCompletion = completion
            callback(["shippingContact": Mappers.mapFromShippingContact(shippingContact: contact)])
        } else {
            completion(
                PKPaymentRequestShippingContactUpdate.init(
                    errors: applePayShippingAddressErrors,
                    paymentSummaryItems: applePaySummaryItems,
                    shippingMethods: applePayShippingMethods
                )
            )
        }
    }
    
    func applePayContext(
        _ context: STPApplePayContext,
        didSelect shippingMethod: PKShippingMethod,
        handler: @escaping (PKPaymentRequestShippingMethodUpdate) -> Void
    ) {
        if let callback = self.shippingMethodUpdateJSCallback {
            self.shippingMethodUpdateCompletion = handler
            callback(["shippingMethod": Mappers.mapFromShippingMethod(shippingMethod: shippingMethod)])
            if (self.hasLegacyApplePayListeners) {
                // Legacy, remove when useApplePay hook is removed
                sendEvent(withName: "onDidSetShippingMethod", body: ["shippingMethod": Mappers.mapFromShippingMethod(shippingMethod: shippingMethod)])
            }
        } else {
            handler(
                PKPaymentRequestShippingMethodUpdate.init(paymentSummaryItems: applePaySummaryItems)
            )
        }
    }
    
    func applePayContext(
        _ context: STPApplePayContext,
        didSelectShippingContact contact: PKContact,
        handler: @escaping (PKPaymentRequestShippingContactUpdate) -> Void
    ) {
        if let callback = self.shippingContactUpdateJSCallback {
            self.shippingContactUpdateCompletion = handler
            callback(["shippingContact": Mappers.mapFromShippingContact(shippingContact: contact)])
            if (self.hasLegacyApplePayListeners) {
                // Legacy, remove when useApplePay hook is removed
                sendEvent(withName: "onDidSetShippingContact", body: ["shippingContact": Mappers.mapFromShippingContact(shippingContact: contact)])
            }
        } else {
            handler(
                PKPaymentRequestShippingContactUpdate.init(
                    errors: applePayShippingAddressErrors,
                    paymentSummaryItems: applePaySummaryItems,
                    shippingMethods: applePayShippingMethods
                )
            )
        }
    }
    
    func applePayContext(
        _ context: STPApplePayContext,
        didCreatePaymentMethod paymentMethod: STPPaymentMethod,
        paymentInformation: PKPayment,
        completion: @escaping STPIntentClientSecretCompletionBlock
    ) {
        if let clientSecret = self.confirmApplePayPaymentClientSecret {
            completion(clientSecret, nil)
        } else if let clientSecret = self.confirmApplePaySetupClientSecret {
            completion(clientSecret, nil)
        } else {
            self.applePayCompletionCallback = completion
            let method = Mappers.mapFromPaymentMethod(paymentMethod.splitApplePayAddressByNewline())
            self.deprecatedApplePayRequestResolver?(Mappers.createResult("paymentMethod", method))
            self.deprecatedApplePayRequestRejecter = nil
        }
    }
    
    func applePayContext(
        _ context: STPApplePayContext,
        didCompleteWith status: STPPaymentStatus,
        error: Error?
    ) {
        switch status {
        case .success:
            if let resolve = self.confirmApplePayResolver {
                if let clientSecret = self.confirmApplePayPaymentClientSecret {
                    STPAPIClient.shared.retrievePaymentIntent(withClientSecret: clientSecret) { (paymentIntent, error) in
                        guard error == nil else {
                            if let lastPaymentError = paymentIntent?.lastPaymentError {
                                resolve(Errors.createError(ErrorType.Unknown, lastPaymentError))
                            } else {
                                resolve(Errors.createError(ErrorType.Unknown, error as NSError?))
                            }
                            return
                        }

                        if let paymentIntent = paymentIntent {
                            resolve(Mappers.createResult("paymentIntent", Mappers.mapFromPaymentIntent(paymentIntent: paymentIntent)))
                        } else {
                            resolve(Mappers.createResult("paymentIntent", nil))
                        }
                    }
                } else if let clientSecret = self.confirmApplePaySetupClientSecret {
                    STPAPIClient.shared.retrieveSetupIntent(withClientSecret: clientSecret) { (setupIntent, error) in
                        guard error == nil else {
                            if let lastSetupError = setupIntent?.lastSetupError {
                                resolve(Errors.createError(ErrorType.Unknown, lastSetupError))
                            } else {
                                resolve(Errors.createError(ErrorType.Unknown, error?.localizedDescription))
                            }
                            return
                        }

                        if let setupIntent = setupIntent {
                            resolve(Mappers.createResult("setupIntent", Mappers.mapFromSetupIntent(setupIntent: setupIntent)))
                        } else {
                            resolve(Mappers.createResult("setupIntent", nil))
                        }
                    }
                }
                
            } else {
                deprecatedConfirmApplePayPaymentResolver?([])
            }
            break
        case .error:
            if let resolve = self.confirmApplePayResolver {
                resolve(Errors.createError(ErrorType.Failed, error as NSError?))
            } else {
                let message = "Payment not completed"
                deprecatedApplePayCompletionRejecter?(ErrorType.Failed, message, nil)
                deprecatedApplePayRequestRejecter?(ErrorType.Failed, message, nil)
            }
            break
        case .userCancellation:
            let message = "The payment has been canceled"
            if let resolve = self.confirmApplePayResolver {
                resolve(Errors.createError(ErrorType.Canceled, message))
            } else {
                deprecatedApplePayCompletionRejecter?(ErrorType.Canceled, message, nil)
                deprecatedApplePayRequestRejecter?(ErrorType.Canceled, message, nil)
            }
            break
        @unknown default:
            if let resolve = self.confirmApplePayResolver {
                resolve(Errors.createError(ErrorType.Unknown, error as NSError?))
            } else {
                let message = "Payment not completed"
                deprecatedApplePayCompletionRejecter?(ErrorType.Unknown, message, nil)
                deprecatedApplePayRequestRejecter?(ErrorType.Unknown, message, nil)
            }
            break
        }
        confirmApplePayResolver = nil
        confirmApplePayPaymentClientSecret = nil
        confirmApplePaySetupClientSecret = nil
        deprecatedApplePayCompletionRejecter = nil
        deprecatedApplePayRequestRejecter = nil
    }
    
}

extension STPPaymentMethod {
    func splitApplePayAddressByNewline() -> STPPaymentMethod {
        let address = self.billingDetails?.address?.line1?.split(whereSeparator: \.isNewline)
        if (address?.indices.contains(0) == true) {
            self.billingDetails?.address?.line1 = String(address?[0] ?? "")
        }
        if (address?.indices.contains(1) == true) {
            self.billingDetails?.address?.line2 = String(address?[1] ?? "")
        }
        return self
    }
}

extension STPToken {
    func splitApplePayAddressByNewline() -> STPToken {
        let address = self.card?.address?.line1?.split(whereSeparator: \.isNewline)
        if (address?.indices.contains(0) == true) {
            self.card?.address?.line1 = String(address?[0] ?? "")
        }
        if (address?.indices.contains(1) == true) {
            self.card?.address?.line2 = String(address?[1] ?? "")
        }
        return self
    }
}
