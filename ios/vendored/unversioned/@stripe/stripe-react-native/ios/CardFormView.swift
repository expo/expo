import Foundation
import UIKit
import Stripe

class CardFormView: UIView, STPCardFormViewDelegate {
    public var cardForm: STPCardFormView?
    
    public var cardParams: STPPaymentMethodCardParams? = nil
    
    @objc var dangerouslyGetFullCardDetails: Bool = false
    @objc var onFormComplete: RCTDirectEventBlock?
    @objc var autofocus: Bool = false
    @objc var disabled: Bool = false
    
    override func didSetProps(_ changedProps: [String]!) {
        if let cardForm = self.cardForm {
            cardForm.removeFromSuperview()
        }
        
        let style = self.cardStyle["type"] as? String == "borderless" ? STPCardFormViewStyle.borderless : STPCardFormViewStyle.standard
        let _cardForm = STPCardFormView(style: style)
        _cardForm.delegate = self
        _cardForm.isUserInteractionEnabled = !disabled
        
        if autofocus == true {
            let _ = _cardForm.becomeFirstResponder()
        }
        
        self.cardForm = _cardForm
        self.addSubview(_cardForm)
        setStyles()
    }
    
    @objc var cardStyle: NSDictionary = NSDictionary() {
        didSet {
            setStyles()
        }
    }
    
    func cardFormView(_ form: STPCardFormView, didChangeToStateComplete complete: Bool) {
        if onFormComplete != nil {
            let brand = STPCardValidator.brand(forNumber: cardForm?.cardParams?.card?.number ?? "")
            var cardData: [String: Any?] = [
                "expiryMonth": cardForm?.cardParams?.card?.expMonth ?? NSNull(),
                "expiryYear": cardForm?.cardParams?.card?.expYear ?? NSNull(),
                "complete": complete,
                "brand": Mappers.mapFromCardBrand(brand) ?? NSNull(),
                "last4": cardForm?.cardParams?.card?.last4 ?? "",
                "postalCode": cardForm?.cardParams?.billingDetails?.address?.postalCode ?? "",
                "country": cardForm?.cardParams?.billingDetails?.address?.country
            ]
            
            if (dangerouslyGetFullCardDetails) {
                cardData["number"] = cardForm?.cardParams?.card?.number ?? ""
                cardData["cvc"] = cardForm?.cardParams?.card?.cvc ?? ""
            }
            if (complete) {
                self.cardParams = cardForm?.cardParams?.card
            } else {
                self.cardParams = nil
            }
            onFormComplete!(cardData as [AnyHashable : Any])
        }
    }
    
    func focus() {
        let _ = cardForm?.becomeFirstResponder()
    }
    
    func blur() {
        let _ = cardForm?.resignFirstResponder()
    }
    
    func setStyles() {
        if let backgroundColor = cardStyle["backgroundColor"] as? String {
            cardForm?.backgroundColor = UIColor(hexString: backgroundColor)
        }
        /**
         The following reveals a bug in STPCardFormView where there's a extra space in the layer,
         and thus must remain commented out for now.
         
         if let borderWidth = cardStyle["borderWidth"] as? Int {
         cardForm?.layer.borderWidth = CGFloat(borderWidth)
         } else {
         cardForm?.layer.borderWidth = CGFloat(0)
         }
         
         */
        if let borderColor = cardStyle["borderColor"] as? String {
            cardForm?.layer.borderColor = UIColor(hexString: borderColor).cgColor
        }
        if let borderRadius = cardStyle["borderRadius"] as? Int {
            cardForm?.layer.cornerRadius = CGFloat(borderRadius)
        }
        if let cursorColor = cardStyle["cursorColor"] as? String {
            cardForm?.tintColor = UIColor(hexString: cursorColor)
        }
        // if let disabledBackgroundColor = cardStyle["disabledBackgroundColor"] as? String {
        //     cardForm?.disabledBackgroundColor = UIColor(hexString: disabledBackgroundColor)
        // }
    }
    
    override init(frame: CGRect) {
        super.init(frame: frame)
    }
    
    override func layoutSubviews() {
        cardForm?.frame = self.bounds
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
