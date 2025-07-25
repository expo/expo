//
// Project «InputMask»
// Created by Jeorge Taflanidi
//

#if canImport(UIKit) && canImport(Foundation) && !os(watchOS)

import Foundation
import UIKit


@available(iOS 11, *)
public protocol OnMaskedTextChangedListener: AnyObject {
    func textInput(
        _ textInput: UITextInput,
        didExtractValue value: String,
        didFillMandatoryCharacters complete: Bool,
        didComputeTailPlaceholder tailPlaceholder: String
    )
}


@available(iOS 11, *)
@IBDesignable
open class MaskedTextInputListener: NSObject {

    open weak var listener: OnMaskedTextChangedListener?
    open var onMaskedTextChangedCallback: ((_ textInput: UITextInput, _ value: String, _ complete: Bool, _ tailPlaceholder: String) -> ())?
  
    open weak var textFieldDelegate: UITextFieldDelegate?
    open weak var textViewDelegate: UITextViewDelegate?

    @IBInspectable open var primaryMaskFormat:   String
    @IBInspectable open var autocomplete:        Bool
    @IBInspectable open var autocompleteOnFocus: Bool
    @IBInspectable open var autoskip:            Bool
    @IBInspectable open var rightToLeft:         Bool
    
    /**
     Allows input suggestions from keyboard
     */
    @IBInspectable open var allowSuggestions: Bool
    
    /**
     Shortly after new text is being pasted from the clipboard, ``UITextInput`` receives a new value for its
     ``UITextInput/`selectedTextRange`` property from the system. This new range is not consistent with the formatted text and
     calculated caret position most of the time, yet it's being assigned just after `set caretPosition` call.
     
     To ensure correct caret position is set, it is assigned asynchronously (presumably after a vanishingly
     small delay), if caret movement is set to be non-atomic.
     
     Default is `false`.
     */
    @IBInspectable open var atomicCaretMovement: Bool = false

    open var affineFormats:               [String]
    open var affinityCalculationStrategy: AffinityCalculationStrategy
    open var customNotations:             [Notation]
    
    open var primaryMask: Mask {
        return try! maskGetOrCreate(withFormat: primaryMaskFormat, customNotations: customNotations)
    }
    
    public init(
        primaryFormat: String = "",
        autocomplete: Bool = true,
        autocompleteOnFocus: Bool = true,
        autoskip: Bool = false,
        rightToLeft: Bool = false,
        affineFormats: [String] = [],
        affinityCalculationStrategy: AffinityCalculationStrategy = .wholeString,
        customNotations: [Notation] = [],
        onMaskedTextChangedCallback: ((_ textInput: UITextInput, _ value: String, _ complete: Bool, _ tailPlaceholder: String) -> ())? = nil,
        allowSuggestions: Bool = true
    ) {
        self.primaryMaskFormat = primaryFormat
        self.autocomplete = autocomplete
        self.autocompleteOnFocus = autocompleteOnFocus
        self.autoskip = autoskip
        self.rightToLeft = rightToLeft
        self.affineFormats = affineFormats
        self.affinityCalculationStrategy = affinityCalculationStrategy
        self.customNotations = customNotations
        self.onMaskedTextChangedCallback = onMaskedTextChangedCallback
        self.allowSuggestions = allowSuggestions
        super.init()
    }
    
    public override init() {
        /**
         Interface Builder support
         
         https://developer.apple.com/documentation/xcode_release_notes/xcode_10_2_release_notes/swift_5_release_notes_for_xcode_10_2
         From known issue no.2:
         
         > To reduce the size taken up by Swift metadata, convenience initializers defined in Swift now only allocate an
         > object ahead of time if they’re calling a designated initializer defined in Objective-C. In most cases, this
         > has no effect on your program, but if your convenience initializer is called from Objective-C, the initial
         > allocation from +alloc is released without any initializer being called.
         */
        self.primaryMaskFormat = ""
        self.autocomplete = true
        self.autocompleteOnFocus = true
        self.autoskip = false
        self.rightToLeft = false
        self.affineFormats = []
        self.affinityCalculationStrategy = .wholeString
        self.customNotations = []
        self.onMaskedTextChangedCallback = nil
        self.allowSuggestions = true
        super.init()
    }
    
    /**
     Maximal length of the text inside the field.
     
     - returns: Total available count of mandatory and optional characters inside the text field.
     */
    open var placeholder: String {
        return primaryMask.placeholder
    }
    
    /**
     Minimal length of the text inside the field to fill all mandatory characters in the mask.
     
     - returns: Minimal satisfying count of characters inside the text field.
     */
    open var acceptableTextLength: Int {
        return primaryMask.acceptableTextLength
    }
    
    /**
     Maximal length of the text inside the field.
     
     - returns: Total available count of mandatory and optional characters inside the text field.
     */
    open var totalTextLength: Int {
        return primaryMask.totalTextLength
    }
    
    /**
     Minimal length of the extracted value with all mandatory characters filled.
     
     - returns: Minimal satisfying count of characters in extracted value.
     */
    open var acceptableValueLength: Int {
        return primaryMask.acceptableValueLength
    }
    
    /**
     Maximal length of the extracted value.
     
     - returns: Total available count of mandatory and optional characters for extracted value.
     */
    open var totalValueLength: Int {
        return primaryMask.totalValueLength
    }

    @discardableResult
    open func put(text: String, into field: UITextInput, autocomplete putAutocomplete: Bool? = nil) -> Mask.Result {
        let autocomplete: Bool = putAutocomplete ?? self.autocomplete
        let mask: Mask = pickMask(
            forText: CaretString(
                string: text,
                caretPosition: text.endIndex,
                caretGravity: CaretString.CaretGravity.forward(autocomplete: autocomplete)
            )
        )

        let result: Mask.Result = mask.apply(
            toText: CaretString(
                string: text,
                caretPosition: text.endIndex,
                caretGravity: CaretString.CaretGravity.forward(autocomplete: autocomplete)
            )
        )

        field.allText = result.formattedText.string
        setCaretPosition(
            result.formattedText.string.distanceFromStartIndex(to: result.formattedText.caretPosition),
            in: field
        )

        notifyOnMaskedTextChangedListeners(forTextInput: field, result: result)
        return result
    }
    
    @discardableResult
    open func textInput(
        _ textInput: UITextInput,
        isChangingCharactersIn range: NSRange,
        replacementString string: String
    ) -> Result {
        let updatedText: String = replaceCharacters(inText: textInput.allText, range: range, withCharacters: string)
        // https://stackoverflow.com/questions/52131894/shouldchangecharactersin-combined-with-suggested-text
        if (allowSuggestions && string == " " && updatedText == " ") {
            return .fallback
        }
        let isDeletion = isThisDeletion(inRange: range, string: string, field: textInput)
        let useAutocomplete = isDeletion ? false : autocomplete
        let useAutoskip = isDeletion ? autoskip : false
        let caretGravity: CaretString.CaretGravity =
            isDeletion ? .backward(autoskip: useAutoskip) : .forward(autocomplete: useAutocomplete)
        
        let caretPositionInt: Int = isDeletion ? range.location : range.location + string.count
        let caretPosition: String.Index = updatedText.startIndex(offsetBy: caretPositionInt)
        let text = CaretString(string: updatedText, caretPosition: caretPosition, caretGravity: caretGravity)
        
        let mask: Mask = pickMask(forText: text)
        let result: Mask.Result = mask.apply(toText: text)
        
        textInput.allText = result.formattedText.string
        setCaretPosition(
            result.formattedText.string.distanceFromStartIndex(to: result.formattedText.caretPosition),
            in: textInput
        )
        
        return .notifyListeners(result: result)
    }
    
    open func isThisDeletion(inRange range: NSRange, string: String, field: UITextInput) -> Bool {
        let isDeletion = 0 < range.length && 0 == string.count
        if field is UITextView {
            // UITextView edge case
            return isDeletion || (0 == range.length && 0 == range.location && 0 == string.count)
        }
        return isDeletion
    }
    
    open func replaceCharacters(inText text: String, range: NSRange, withCharacters newText: String) -> String {
        /**
         https://github.com/RedMadRobot/input-mask-ios/issues/84
         
         iOS Undo Manager might not consider text adjustments made by the library.
         Thus, the `range` might be out of bounds compared to the actual text.
         */
        var sanitisedRangeLocation = range.location
        var sanitisedRangeLength = range.length
        
        if text.count < sanitisedRangeLocation {
            sanitisedRangeLocation = text.count
        }
        
        if text.count < sanitisedRangeLocation + sanitisedRangeLength {
            sanitisedRangeLength = text.count - sanitisedRangeLocation
        }
        
        let sanitisedRange = NSRange(
            location: sanitisedRangeLocation,
            length: sanitisedRangeLength
        )
        // end
        
        if 0 < sanitisedRange.length {
            let result = NSMutableString(string: text)
            result.replaceCharacters(in: sanitisedRange, with: newText)
            return result as String
        } else {
            let result = NSMutableString(string: text)
            result.insert(newText, at: sanitisedRange.location)
            return result as String
        }
    }
    
    open func pickMask(forText text: CaretString) -> Mask {
        guard !affineFormats.isEmpty
        else { return primaryMask }

        let primaryAffinity: Int = affinityCalculationStrategy.calculateAffinity(ofMask: primaryMask, forText: text, autocomplete: autocomplete)
        
        var masksAndAffinities: [MaskAndAffinity] = affineFormats.map { (affineFormat: String) -> MaskAndAffinity in
            let mask = try! maskGetOrCreate(withFormat: affineFormat, customNotations: customNotations)
            let affinity = affinityCalculationStrategy.calculateAffinity(ofMask: mask, forText: text, autocomplete: autocomplete)
            return MaskAndAffinity(mask: mask, affinity: affinity)
        }.sorted { (left: MaskAndAffinity, right: MaskAndAffinity) -> Bool in
            return left.affinity > right.affinity
        }
        
        var insertIndex: Int = -1

        for (index, maskAndAffinity) in masksAndAffinities.enumerated() {
            if primaryAffinity >= maskAndAffinity.affinity {
                insertIndex = index
                break
            }
        }
        
        if (insertIndex >= 0) {
            masksAndAffinities.insert(MaskAndAffinity(mask: primaryMask, affinity: primaryAffinity), at: insertIndex)
        } else {
            masksAndAffinities.append(MaskAndAffinity(mask: primaryMask, affinity: primaryAffinity))
        }
        
        return masksAndAffinities.first!.mask
    }
    
    open func notifyOnMaskedTextChangedListeners(forTextInput textInput: UITextInput, result: Mask.Result) {
        listener?.textInput(
            textInput,
            didExtractValue: result.extractedValue,
            didFillMandatoryCharacters: result.complete,
            didComputeTailPlaceholder: result.tailPlaceholder
        )
        onMaskedTextChangedCallback?(textInput, result.extractedValue, result.complete, result.tailPlaceholder)
    }
    
    open func setCaretPosition(_ position: Int, in textInput: UITextInput) {
        if atomicCaretMovement {
            textInput.caretPosition = position
        } else {
            DispatchQueue.main.asyncAfter(deadline: DispatchTime.now()) {
                textInput.caretPosition = position
            }
        }
    }

    private func maskGetOrCreate(withFormat format: String, customNotations: [Notation]) throws -> Mask {
        if rightToLeft {
            return try RTLMask.getOrCreate(withFormat: format, customNotations: customNotations)
        }
        return try Mask.getOrCreate(withFormat: format, customNotations: customNotations)
    }

    private struct MaskAndAffinity {
        let mask: Mask
        let affinity: Int
    }
    
    public enum Result {
        case notifyListeners(result: Mask.Result)
        case fallback
    }

    /**
     Workaround to support Interface Builder delegate outlets.

     Allows assigning ``MaskedTextInputListener/listener`` within the Interface Builder.

     Consider using ``MaskedTextInputListener/listener`` property from your source code instead of
     ``MaskedTextInputListener/delegate`` outlet.
     */
    @IBOutlet public var delegate: NSObject? {
        get {
            return self.listener as? NSObject
        }

        set(newDelegate) {
            if let listener = newDelegate as? OnMaskedTextChangedListener {
                self.listener = listener
            }
        }
    }

}


@available(iOS 11, *)
extension MaskedTextInputListener: UITextFieldDelegate {

    open func textFieldDidBeginEditing(_ textField: UITextField) {
        textFieldDelegate?.textFieldDidBeginEditing?(textField)
        if autocompleteOnFocus && (textField.text ?? "").isEmpty {
            let result: Mask.Result = put(text: "", into: textField, autocomplete: true)
            notifyOnMaskedTextChangedListeners(forTextInput: textField, result: result)
        }
    }

    open func textField(
        _ textField: UITextField,
        shouldChangeCharactersIn range: NSRange,
        replacementString string: String
    ) -> Bool {
        // NOTE: lib logic depends on controlling the returned value, so no full control forwarding is allowed here
        if textFieldDelegate?.textField?(textField, shouldChangeCharactersIn: range, replacementString: string) == false {
            return false
        }
        
        switch textInput(textField, isChangingCharactersIn: range, replacementString: string) {
            case .fallback:
                return true
            case .notifyListeners(let result):
                notifyOnMaskedTextChangedListeners(forTextInput: textField, result: result)
                return false
        }
    }

    open func textFieldShouldClear(_ textField: UITextField) -> Bool {
        if textFieldDelegate?.textFieldShouldClear?(textField) == false {
            return false
        }

        let result: Mask.Result = put(text: "", into: textField, autocomplete: false)
        notifyOnMaskedTextChangedListeners(forTextInput: textField, result: result)
        return true
    }
    
    // MARK: - Call forwarding
    
    public func textFieldShouldBeginEditing(_ textField: UITextField) -> Bool {
        return textFieldDelegate?.textFieldShouldBeginEditing?(textField) ?? true
    }
    
    public func textFieldShouldEndEditing(_ textField: UITextField) -> Bool {
        return textFieldDelegate?.textFieldShouldEndEditing?(textField) ?? true
    }
    
    public func textFieldDidEndEditing(_ textField: UITextField) {
        textFieldDelegate?.textFieldDidEndEditing?(textField)
    }
    
    public func textFieldDidEndEditing(_ textField: UITextField, reason: UITextField.DidEndEditingReason) {
        textFieldDelegate?.textFieldDidEndEditing?(textField, reason: reason)
    }
    
    @available(iOS 13.0, tvOS 13.0, *)
    public func textFieldDidChangeSelection(_ textField: UITextField) {
        textFieldDelegate?.textFieldDidChangeSelection?(textField)
    }
    
    public func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        return textFieldDelegate?.textFieldShouldReturn?(textField) ?? true
    }
    
    @available(iOS 16.0, tvOS 16.0, *)
    public func textField(_ textField: UITextField, editMenuForCharactersIn range: NSRange, suggestedActions: [UIMenuElement]) -> UIMenu? {
        return textFieldDelegate?.textField?(textField, editMenuForCharactersIn: range, suggestedActions: suggestedActions)
    }

}


@available(iOS 11, *)
extension MaskedTextInputListener: UITextViewDelegate {

    open func textViewDidBeginEditing(_ textView: UITextView) {
        textViewDelegate?.textViewDidBeginEditing?(textView)
        if autocompleteOnFocus && textView.text.isEmpty {
            let result: Mask.Result = put(text: "", into: textView, autocomplete: true)
            notifyOnMaskedTextChangedListeners(forTextInput: textView, result: result)
        }
    }

    open func textView(
        _ textView: UITextView,
        shouldChangeTextIn range: NSRange,
        replacementText text: String
    ) -> Bool {
        // NOTE: lib logic depends on controlling the returned value, so no full control forwarding is allowed here
        if textViewDelegate?.textView?(textView, shouldChangeTextIn: range, replacementText: text) == false {
            return false
        }
        
        switch textInput(textView, isChangingCharactersIn: range, replacementString: text) {
            case .fallback:
                return true
            case .notifyListeners(let result):
                notifyOnMaskedTextChangedListeners(forTextInput: textView, result: result)
                return false
        }
    }
    
    // MARK: - Call forwarding
    
    public func textViewShouldBeginEditing(_ textView: UITextView) -> Bool {
        return textViewDelegate?.textViewShouldBeginEditing?(textView) ?? true
    }
    
    public func textViewShouldEndEditing(_ textView: UITextView) -> Bool {
        return textViewDelegate?.textViewShouldEndEditing?(textView) ?? true
    }
    
    public func textViewDidEndEditing(_ textView: UITextView) {
        textViewDelegate?.textViewDidEndEditing?(textView)
    }
    
    public func textViewDidChange(_ textView: UITextView) {
        textViewDelegate?.textViewDidChange?(textView)
    }
    
    public func textViewDidChangeSelection(_ textView: UITextView) {
        textViewDelegate?.textViewDidChangeSelection?(textView)
    }
    
    public func textView(
        _ textView: UITextView,
        shouldInteractWith URL: URL,
        in characterRange: NSRange,
        interaction: UITextItemInteraction
    ) -> Bool {
        return textViewDelegate?.textView?(textView, shouldInteractWith: URL, in: characterRange, interaction: interaction) ?? true
    }
    
    public func textView(
        _ textView: UITextView,
        shouldInteractWith textAttachment: NSTextAttachment,
        in characterRange: NSRange,
        interaction: UITextItemInteraction
    ) -> Bool {
        return textViewDelegate?.textView?(textView, shouldInteractWith: textAttachment, in: characterRange, interaction: interaction) ?? true
    }
    
    @available(iOS 16.0, tvOS 16.0, *)
    public func textView(_ textView: UITextView, editMenuForTextIn range: NSRange, suggestedActions: [UIMenuElement]) -> UIMenu? {
        return textViewDelegate?.textView?(textView, editMenuForTextIn: range, suggestedActions: suggestedActions)
    }

}

#endif
