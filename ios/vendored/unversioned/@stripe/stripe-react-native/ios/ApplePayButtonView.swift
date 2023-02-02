import Foundation
import UIKit

@objc(ApplePayButtonView)
class ApplePayButtonView: UIView {
    var applePayButton: PKPaymentButton?
    var stripeSdk: StripeSdk?
    
    @objc var onPressAction: RCTDirectEventBlock?
    @objc var onShippingMethodSelectedAction: RCTDirectEventBlock?
    @objc var onShippingContactSelectedAction: RCTDirectEventBlock?
    @objc var onCouponCodeEnteredAction: RCTDirectEventBlock?
    
    @objc var type: NSNumber?
    @objc var buttonStyle: NSNumber?
    @objc var borderRadius: NSNumber?
    @objc var disabled = false
    
    func doesNothing(_: Optional<Dictionary<AnyHashable, Any>>) {
        return
    }
    
    @objc func handleApplePayButtonTapped() {
        if onPressAction != nil {
            onPressAction!(["true": true])
            // JS Callbacks are all no-ops since in legacy code (useApplePay hook),
            // this behavior is controlled via the onDidSetShippingMethod and onDidSetShippingContact
            // events
            stripeSdk?.shippingMethodUpdateJSCallback = doesNothing
            stripeSdk?.shippingContactUpdateJSCallback = doesNothing
            stripeSdk?.couponCodeEnteredJSCallback = doesNothing
        } else {
            stripeSdk?.shippingMethodUpdateJSCallback = onShippingMethodSelectedAction
            stripeSdk?.shippingContactUpdateJSCallback = onShippingContactSelectedAction
            stripeSdk?.couponCodeEnteredJSCallback = onCouponCodeEnteredAction
        }
    }
    
    override func didSetProps(_ changedProps: [String]!) {
        if let applePayButton = self.applePayButton {
            applePayButton.removeFromSuperview()
        }
        let paymentButtonType = PKPaymentButtonType(rawValue: self.type as? Int ?? 0) ?? .plain
        let paymentButtonStyle = PKPaymentButtonStyle(rawValue: self.buttonStyle as? Int ?? 2) ?? .black
        self.applePayButton = PKPaymentButton(paymentButtonType: paymentButtonType, paymentButtonStyle: paymentButtonStyle)
        if #available(iOS 12.0, *) {
            self.applePayButton?.cornerRadius = self.borderRadius as? CGFloat ?? 4.0
        }
        
        if let applePayButton = self.applePayButton {
            applePayButton.isEnabled = !disabled
            applePayButton.addTarget(self, action: #selector(handleApplePayButtonTapped), for: .touchUpInside)
            self.addSubview(applePayButton)
        }
    }
    
    override init(frame: CGRect) {
        super.init(frame: frame)
    }
    
    override func layoutSubviews() {
        if let applePayButton = self.applePayButton {
            applePayButton.frame = self.bounds
        }
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
