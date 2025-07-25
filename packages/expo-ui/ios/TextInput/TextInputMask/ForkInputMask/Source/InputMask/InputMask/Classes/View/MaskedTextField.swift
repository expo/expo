//
// Project «InputMask»
// Created by Jeorge Taflanidi
//

#if canImport(SwiftUI) && !os(watchOS) && !os(macOS)

import SwiftUI

/**
 ### MaskedTextField
 
 A ``UITextField`` wrapper for SwiftUI, with a ``MaskedTextInputListener`` attached.
 */
@available(iOS 13.0, tvOS 13.0, *)
public struct MaskedTextField: UIViewRepresentable {
    public typealias UITextFieldEvent = (_ textField: UITextField) -> Void
    
    /**
     Text contents binding.
     */
    @Binding public var text: String
    
    /**
     Extracted value binding.
     */
    @Binding public var value: String
    
    /**
     Value completeness binding.
     */
    @Binding public var complete: Bool
    
    // - MARK: UITextField properties
    
    /**
     ``UITextField/placeholder``
     */
    public var placeholder: String
    
    /**
     ``UITextField/textColor``
     */
    public var textColor: UIColor?
    
    /**
     ``UITextField/font``
     */
    public var font: UIFont?
    
    /**
     ``UITextField/textAlignement``
     */
    public var textAlignement: NSTextAlignment?
    
    /**
     ``UITextField/borderStyle``
     */
    public var borderStyle: UITextField.BorderStyle?
    
    /**
     ``UITextField/tintColor``
     */
    public var tintColor: UIColor?
    
    /**
     ``UITextField/clearsOnBeginEditing``
     */
    public var clearsOnBeginEditing: Bool?
    
    /**
     ``UITextField/clearsOnInsertion``
     */
    public var clearsOnInsertion: Bool?
    
    /**
     ``UITextField/adjustsFontSizeToFitWidth``
     */
    public var adjustsFontSizeToFitWidth: Bool?
    
    /**
     ``UITextField/minimumFontSize``
     */
    public var minimumFontSize: CGFloat?
    
    /**
     ``UITextField/background``
     */
    public var background: UIImage?
    
    /**
     ``UITextField/disabledBackground``
     */
    public var disabledBackground: UIImage?
    
    /**
     ``UITextField/clearButtonMode``
     */
    public var clearButtonMode: UITextField.ViewMode?
    
    /**
     ``UITextField/leftView``
     */
    public var leftView: UIView?
    
    /**
     ``UITextField/leftViewMode``
     */
    public var leftViewMode: UITextField.ViewMode?
    
    /**
     ``UITextField/rightView``
     */
    public var rightView: UIView?
    
    /**
     ``UITextField/rightViewMode``
     */
    public var rightViewMode: UITextField.ViewMode?
    
    /**
     ``UITextField/inputView``
     */
    public var inputView: UIView?
    
    /**
     ``UITextField/inputAccessoryView``
     */
    public var inputAccessoryView: UIView?
    
    /**
     ``UITextField/isUserInteractionEnabled``
     */
    public var isUserInteractionEnabled: Bool?
    
    /**
     ``UITextField/autocapitalizationType``
     */
    public var autocapitalizationType: UITextAutocapitalizationType?
    
    /**
     ``UITextField/autocorrectionType``
     */
    public var autocorrectionType: UITextAutocorrectionType?
    
    /**
     ``UITextField/spellCheckingType``
     */
    public var spellCheckingType: UITextSpellCheckingType?
    
    /**
     ``UITextField/smartQuotesType``
     */
    public var smartQuotesType: UITextSmartQuotesType?
    
    /**
     ``UITextField/smartDashesType``
     */
    public var smartDashesType: UITextSmartDashesType?
    
    /**
     ``UITextField/smartInsertDeleteType``
     */
    public var smartInsertDeleteType: UITextSmartInsertDeleteType?
    
    /**
     ``UITextField/keyboardType``
     */
    public var keyboardType: UIKeyboardType?
    
    /**
     ``UITextField/keyboardAppearance``
     */
    public var keyboardAppearance: UIKeyboardAppearance?
    
    /**
     ``UITextField/returnKeyType``
     */
    public var returnKeyType: UIReturnKeyType?
    
    /**
     ``UITextField/enablesReturnKeyAutomatically``
     */
    public var enablesReturnKeyAutomatically: Bool?
    
    /**
     ``UITextField/isSecureTextEntry``
     */
    public var isSecureTextEntry: Bool?
    
    /**
     ``UITextField/textContentType``
     */
    public var textContentType: UITextContentType?
    
    /**
     ``UITextField/passwordRules``
     */
    public var passwordRules: UITextInputPasswordRules?
    
    // - MARK: Layout options
    
    public var contentHuggingPriorityVertical: UILayoutPriority = .defaultHigh
    
    public var contentHuggingPriorityHorizontal: UILayoutPriority?
    
    public var contentCompressionResistancePriorityHorizontal: UILayoutPriority = .defaultLow
    
    public var contentCompressionResistancePriorityVertical: UILayoutPriority?
    
    // - MARK: Handles for events
    
    public var onSubmit: UITextFieldEvent?
    public var onFocus: UITextFieldEvent?
    
    // - MARK: MaskedTextFieldDelegate properties
    
    public let primaryMaskFormat:   String
    public let autocomplete:        Bool
    public let autocompleteOnFocus: Bool
    public let autoskip:            Bool
    public let rightToLeft:         Bool
    
    public let allowSuggestions: Bool
    
    public let atomicCursorMovement: Bool = false
    
    public let affineFormats:               [String]
    public let affinityCalculationStrategy: AffinityCalculationStrategy
    public let customNotations:             [Notation]
    
    public init(
        text: Binding<String>,
        value: Binding<String>,
        complete: Binding<Bool>,
        placeholder: String,
        primaryMaskFormat: String = "",
        autocomplete: Bool = true,
        autocompleteOnFocus: Bool = true,
        autoskip: Bool = false,
        rightToLeft: Bool = false,
        allowSuggestions: Bool = true,
        affineFormats: [String] = [],
        affinityCalculationStrategy: AffinityCalculationStrategy = .wholeString,
        customNotations: [Notation] = []
    ) {
        self._text = text
        self._value = value
        self._complete = complete
        self.placeholder = placeholder
        self.primaryMaskFormat = primaryMaskFormat
        self.autocomplete = autocomplete
        self.autocompleteOnFocus = autocompleteOnFocus
        self.autoskip = autoskip
        self.rightToLeft = rightToLeft
        self.allowSuggestions = allowSuggestions
        self.affineFormats = affineFormats
        self.affinityCalculationStrategy = affinityCalculationStrategy
        self.customNotations = customNotations
    }
    
    public func makeUIView(context: Context) -> UITextField {
        let textField = UITextField()
        updateTextFieldAttributes(textField, context: context)
        textField.delegate = context.coordinator
        return textField
    }
    
    public func updateUIView(_ uiView: UITextField, context: Context) {
        let coordinator = context.coordinator
        
        coordinator.onSubmit = onSubmit
        coordinator.onFocus = onFocus
        
        updateTextFieldAttributes(uiView, context: context)
        uiView.delegate = coordinator
        uiView.text = text
    }
    
    public func makeCoordinator() -> Coordinator {
        Coordinator(
            primaryFormat: primaryMaskFormat,
            autocomplete: autocomplete,
            autocompleteOnFocus: autocompleteOnFocus,
            autoskip: autoskip,
            rightToLeft: rightToLeft,
            affineFormats: affineFormats,
            affinityCalculationStrategy: affinityCalculationStrategy,
            customNotations: customNotations,
            onMaskedTextChangedCallback: { input, value, complete, tailPlaceholder in
                self.text = input.allText
                self.value = value
                self.complete = complete
            },
            allowSuggestions: allowSuggestions,
            onSubmit: onSubmit,
            onFocus: onFocus
        )
    }
    
    public final class Coordinator: MaskedTextInputListener {
        public var onSubmit: UITextFieldEvent?
        public var onFocus: UITextFieldEvent?
        
        public init(
            primaryFormat: String = "",
            autocomplete: Bool = true,
            autocompleteOnFocus: Bool = true,
            autoskip: Bool = false,
            rightToLeft: Bool = false,
            affineFormats: [String] = [],
            affinityCalculationStrategy: AffinityCalculationStrategy = .wholeString,
            customNotations: [Notation] = [],
            onMaskedTextChangedCallback: ((UITextInput, String, Bool, String) -> ())? = nil,
            allowSuggestions: Bool = true,
            onSubmit: UITextFieldEvent? = nil,
            onFocus: UITextFieldEvent? = nil
        ) {
            self.onSubmit = onSubmit
            self.onFocus = onFocus
            super.init(
                primaryFormat: primaryFormat,
                autocomplete: autocomplete,
                autocompleteOnFocus: autocompleteOnFocus,
                autoskip: autoskip,
                rightToLeft: rightToLeft,
                affineFormats: affineFormats,
                affinityCalculationStrategy: affinityCalculationStrategy,
                customNotations: customNotations,
                onMaskedTextChangedCallback: onMaskedTextChangedCallback,
                allowSuggestions: allowSuggestions
            )
        }
        
        public override func textFieldShouldReturn(_ textField: UITextField) -> Bool {
            onSubmit?(textField)
            return super.textFieldShouldReturn(textField)
        }

        public override func textFieldDidBeginEditing(_ textField: UITextField) {
            super.textFieldDidBeginEditing(textField)
            onFocus?(textField)
        }
    }
    
    private func updateTextFieldAttributes(_ field: UITextField, context: Context) {
        field.text = text
        field.placeholder = placeholder
        
        field.textColor = textColor
        field.font = font
        field.textAlignment = textAlignement ?? field.textAlignment
        
        field.borderStyle = borderStyle ?? field.borderStyle
        field.tintColor = tintColor ?? field.tintColor
        
        field.clearsOnBeginEditing = clearsOnBeginEditing ?? field.clearsOnBeginEditing
        field.clearsOnInsertion = clearsOnInsertion ?? field.clearsOnInsertion
        
        field.adjustsFontSizeToFitWidth = adjustsFontSizeToFitWidth ?? field.adjustsFontSizeToFitWidth
        
        field.minimumFontSize = minimumFontSize ?? field.minimumFontSize
        
        field.background = background ?? field.background
        field.disabledBackground = disabledBackground ?? field.disabledBackground
        
        field.clearButtonMode = clearButtonMode ?? field.clearButtonMode
        field.leftView = leftView
        field.leftViewMode = leftViewMode ?? field.leftViewMode
        field.rightView = rightView
        field.rightViewMode = rightViewMode ?? field.rightViewMode
        
        field.inputView = inputView
        field.inputAccessoryView = inputAccessoryView
        
        field.isUserInteractionEnabled = isUserInteractionEnabled ?? field.isUserInteractionEnabled
        
        field.autocapitalizationType = autocapitalizationType ?? field.autocapitalizationType
        field.autocorrectionType = autocorrectionType ?? field.autocorrectionType
        field.spellCheckingType = spellCheckingType ?? field.spellCheckingType
        field.smartQuotesType = smartQuotesType ?? field.smartQuotesType
        field.smartDashesType = smartDashesType ?? field.smartDashesType
        field.smartInsertDeleteType = smartInsertDeleteType ?? field.smartInsertDeleteType
        
        field.keyboardType = keyboardType ?? field.keyboardType
        field.keyboardAppearance = keyboardAppearance ?? field.keyboardAppearance
        
        field.returnKeyType = returnKeyType ?? field.returnKeyType
        field.enablesReturnKeyAutomatically = enablesReturnKeyAutomatically ?? field.enablesReturnKeyAutomatically
        
        field.isSecureTextEntry = isSecureTextEntry ?? field.isSecureTextEntry
        
        field.textContentType = textContentType ?? field.textContentType
        
        field.passwordRules = passwordRules ?? field.passwordRules
        
        field.setContentHuggingPriority(contentHuggingPriorityVertical, for: .vertical)
        if let contentHuggingPriorityHorizontal = contentHuggingPriorityHorizontal {
            field.setContentHuggingPriority(contentHuggingPriorityHorizontal, for: .horizontal)
        }
        
        field.setContentCompressionResistancePriority(contentCompressionResistancePriorityHorizontal, for: .horizontal)
        if let contentCompressionResistancePriorityVertical = contentCompressionResistancePriorityVertical {
            field.setContentCompressionResistancePriority(contentCompressionResistancePriorityVertical, for: .vertical)
        }
        
        field.isEnabled = context.environment.isEnabled
        
        if context.environment.autocorrectionDisabled {
            field.autocorrectionType = .no
        }
        
        if #available(iOS 14.0, tvOS 14.0, *) {
            if let textCase = context.environment.textCase {
                switch textCase {
                    case .uppercase:
                        field.autocapitalizationType = .allCharacters
                    case .lowercase:
                        field.autocapitalizationType = .none
                    @unknown default:
                        break
                }
            }
        }
    }
}

#endif
