//
//  AddressSheetView.swift
//  stripe-react-native
//
//  Created by Charles Cruzan on 10/11/22.
//

import Foundation
import StripePaymentSheet

@objc(AddressSheetView)
class AddressSheetView: UIView {
    @objc var visible = false
    @objc var presentationStyle: String = "popover"
    @objc var animationStyle: String = ""
    @objc var appearance: NSDictionary? = nil
    @objc var defaultValues: NSDictionary? = nil
    @objc var additionalFields: NSDictionary? = nil
    @objc var allowedCountries: [String] = []
    @objc var autocompleteCountries: [String] = []
    @objc var primaryButtonTitle: String? = nil
    @objc var sheetTitle: String? = nil
    @objc var onSubmitAction: RCTDirectEventBlock?
    @objc var onErrorAction: RCTDirectEventBlock?

    private var wasVisible = false
    private var addressViewController: AddressViewController? = nil
    internal var addressDetails: AddressViewController.AddressDetails? = nil
    
    override init(frame: CGRect) {
        super.init(frame: frame)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func didSetProps(_ changedProps: [String]!) {
        if (visible && !wasVisible) {
            presentAddressSheet()
            wasVisible = true
        } else if (!visible && wasVisible) {
            addressViewController?.dismiss(animated: true)
            wasVisible = false
        }
    }
    
    private func presentAddressSheet() {
        if (STPAPIClient.shared.publishableKey == nil) {
            onErrorAction!(
                Errors.createError(ErrorType.Failed, "No publishable key set. Stripe has not been initialized. Initialize Stripe in your app with the StripeProvider component or the initStripe method.") as? [AnyHashable : Any]
            )
            return
        }
        var config: AddressViewController.Configuration
        do {
            config = try buildAddressSheetConfiguration()
        } catch {
            onErrorAction!(
                Errors.createError(ErrorType.Failed, error.localizedDescription) as? [AnyHashable : Any]
            )
            return
        }
        
        self.addressViewController = AddressViewController(
            configuration: config,
            delegate: self
        )
                
        let navigationController = UINavigationController(rootViewController: addressViewController!)
        navigationController.modalPresentationStyle = getModalPresentationStyle()
        navigationController.modalTransitionStyle = getModalTransitionStyle()
        let vc = findViewControllerPresenter(from: UIApplication.shared.delegate?.window??.rootViewController ?? UIViewController())
        vc.present(navigationController, animated: true)
    }
    
    private func buildAddressSheetConfiguration() throws -> AddressViewController.Configuration {
        let appearanceConfiguration = try PaymentSheetAppearance.buildAppearanceFromParams(userParams: appearance)
        
        return AddressViewController.Configuration(
            defaultValues: AddressSheetUtils.buildDefaultValues(params: defaultValues),
            additionalFields: AddressSheetUtils.buildAdditionalFieldsConfiguration(params: additionalFields),
            allowedCountries: allowedCountries,
            appearance: appearanceConfiguration,
            buttonTitle: primaryButtonTitle,
            title: sheetTitle
          )
    }
    
    private func getModalPresentationStyle() -> UIModalPresentationStyle {
        switch (presentationStyle) {
        case "fullscreen":
            return .fullScreen
        case "pageSheet":
            return .pageSheet
        case "formSheet":
            return .formSheet
        case "automatic":
            return .automatic
        case "overFullScreen":
            return .overFullScreen
        case "popover":
            fallthrough
        default:
            return .popover
        }
    }
    
    private func getModalTransitionStyle() -> UIModalTransitionStyle {
        switch (animationStyle) {
        case "flip":
            return .flipHorizontal
        case "curl":
            return .partialCurl
        case "dissolve":
            return .crossDissolve
        case "slide":
            fallthrough
        default:
            return .coverVertical
        }
    }
}

extension AddressSheetView: AddressViewControllerDelegate {
    func addressViewControllerDidFinish(_ addressViewController: AddressViewController, with address: AddressViewController.AddressDetails?) {
        guard let address = address else {
            onErrorAction!(
                Errors.createError(
                    ErrorType.Canceled,
                    "The flow has been canceled."
                ) as? [AnyHashable : Any]
            )
            return
        }
        self.addressDetails = address
        onSubmitAction!(AddressSheetUtils.buildResult(address: address))
    }
}
