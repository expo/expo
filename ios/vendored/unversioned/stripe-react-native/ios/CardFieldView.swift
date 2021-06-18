import Foundation
import UIKit
import Stripe

let CARD_FIELD_INSTANCE_ID = "CardFieldInstance"

class CardFieldView: UIView, STPPaymentCardTextFieldDelegate {
    @objc var onCardChange: RCTDirectEventBlock?
    @objc var onFocusChange: RCTDirectEventBlock?
    @objc var dangerouslyGetFullCardDetails: Bool = false
    
    private var cardField = STPPaymentCardTextField()
    
    public var cardParams: STPPaymentMethodCardParams? = nil
    
    public var delegate: CardFieldDelegate?
    
    @objc var postalCodeEnabled: Bool = true {
        didSet {
            cardField.postalCodeEntryEnabled = postalCodeEnabled
        }
    }

    @objc var placeholder: NSDictionary = NSDictionary() {
        didSet {
            if let numberPlaceholder = placeholder["number"] as? String {
                cardField.numberPlaceholder = numberPlaceholder
            } else {
                cardField.numberPlaceholder = "1234123412341234"
            }
            if let expirationPlaceholder = placeholder["expiration"] as? String {
                cardField.expirationPlaceholder = expirationPlaceholder
            }
            if let cvcPlaceholder = placeholder["cvc"] as? String {
                cardField.cvcPlaceholder = cvcPlaceholder
            }
            if let postalCodePlaceholder = placeholder["postalCode"] as? String {
                cardField.postalCodePlaceholder = postalCodePlaceholder
            }
        }
    }
    
    @objc var autofocus: Bool = false {
        didSet {
            if autofocus == true {
                cardField.reactFocus()
            }
        }
    }
    
    @objc var cardStyle: NSDictionary = NSDictionary() {
        didSet {
            if let borderWidth = cardStyle["borderWidth"] as? Int {
                cardField.borderWidth = CGFloat(borderWidth)
            } else {
                cardField.borderWidth = CGFloat(0)
            }
            if let backgroundColor = cardStyle["backgroundColor"] as? String {
                cardField.backgroundColor = UIColor(hexString: backgroundColor)
            }
            if let borderColor = cardStyle["borderColor"] as? String {
                cardField.borderColor = UIColor(hexString: borderColor)
            }
            if let borderRadius = cardStyle["borderRadius"] as? Int {
                cardField.cornerRadius = CGFloat(borderRadius)
            }
            if let cursorColor = cardStyle["cursorColor"] as? String {
                cardField.cursorColor = UIColor(hexString: cursorColor)
            }
            if let textColor = cardStyle["textColor"] as? String {
                cardField.textColor = UIColor(hexString: textColor)
            }
            if let textErrorColor = cardStyle["textErrorColor"] as? String {
                cardField.textErrorColor = UIColor(hexString: textErrorColor)
            }
            let fontSize = cardStyle["fontSize"] as? Int ?? 14

            if let fontFamily = cardStyle["fontFamily"] as? String {
                cardField.font = UIFont(name: fontFamily, size: CGFloat(fontSize)) ?? UIFont.systemFont(ofSize: CGFloat(fontSize))
            } else {
                if let fontSize = cardStyle["fontSize"] as? Int {
                    cardField.font = UIFont.systemFont(ofSize: CGFloat(fontSize))
                }
            }
            if let placeholderColor = cardStyle["placeholderColor"] as? String {
                cardField.placeholderColor = UIColor(hexString: placeholderColor)
            }
        }
    }
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        cardField.delegate = self

        self.addSubview(cardField)
    }
    
    convenience init(delegate: CardFieldDelegate) {
        self.init(frame: CGRect.zero)
        self.delegate = delegate
        
        self.delegate?.onDidCreateViewInstance(id: CARD_FIELD_INSTANCE_ID, reference: self)
    }
    
    override func removeFromSuperview() {
        self.delegate?.onDidDestroyViewInstance(id: CARD_FIELD_INSTANCE_ID)
    }
    
    func paymentCardTextFieldDidBeginEditingNumber(_ textField: STPPaymentCardTextField) {
        onFocusChange?(["focusedField": "CardNumber"])
    }
    
    func paymentCardTextFieldDidBeginEditingCVC(_ textField: STPPaymentCardTextField) {
        onFocusChange?(["focusedField": "Cvc"])
    }
    
    func paymentCardTextFieldDidBeginEditingExpiration(_ textField: STPPaymentCardTextField) {
        onFocusChange?(["focusedField": "ExpiryDate"])
    }
    
    func paymentCardTextFieldDidBeginEditingPostalCode(_ textField: STPPaymentCardTextField) {
        onFocusChange?(["focusedField": "PostalCode"])
    }
    
    func paymentCardTextFieldDidChange(_ textField: STPPaymentCardTextField) {
        if onCardChange != nil {
            let brand = STPCardValidator.brand(forNumber: textField.cardParams.number ?? "")
            var cardData: [String: Any?] = [
                "expiryMonth": textField.cardParams.expMonth ?? NSNull(),
                "expiryYear": textField.cardParams.expYear ?? NSNull(),
                "complete": textField.isValid,
                "brand": Mappers.mapCardBrand(brand) ?? NSNull(),
                "last4": textField.cardParams.last4 ?? ""
            ]
            if (cardField.postalCodeEntryEnabled) {
                cardData["postalCode"] = textField.postalCode ?? ""
            }
            if (dangerouslyGetFullCardDetails) {
                cardData["number"] = textField.cardParams.number ?? ""
            }
            onCardChange!(cardData as [AnyHashable : Any])
        }
        if (textField.isValid) {
            self.cardParams = textField.cardParams
        } else {
            self.cardParams = nil
        }
    }
    
    override func layoutSubviews() {
        cardField.frame = self.bounds
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func paymentContext(_ paymentContext: STPPaymentContext, didFailToLoadWithError error: Error) {
        //
    }
    
    func paymentContextDidChange(_ paymentContext: STPPaymentContext) {
        //
    }
    
    func paymentContext(_ paymentContext: STPPaymentContext, didCreatePaymentResult paymentResult: STPPaymentResult, completion: @escaping STPPaymentStatusBlock) {
        //
    }
    
    func paymentContext(_ paymentContext: STPPaymentContext, didFinishWith status: STPPaymentStatus, error: Error?) {
        //
    }
    
}
