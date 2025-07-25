//
// Project «InputMask»
// Created by Jeorge Taflanidi
//

#if canImport(AppKit) && canImport(Foundation)

import Foundation
import AppKit

public protocol OnMaskedTextViewChangedListener: AnyObject {
    func textView(
        _ textView: NSTextView,
        didExtractValue value: String,
        didFillMandatoryCharacters complete: Bool,
        didComputeTailPlaceholder tailPlaceholder: String
    )
}

@IBDesignable
open class TextViewListener: NSObject, NSTextViewDelegate {
    
    open weak var listener: OnMaskedTextViewChangedListener?
    open var onMaskedTextViewChangedCallback: ((_ textView: NSTextView, _ value: String, _ complete: Bool, _ tailPlaceholder: String) -> ())?
  
    @IBInspectable open var primaryMaskFormat:   String
    @IBInspectable open var autocomplete:        Bool
    @IBInspectable open var autoskip:            Bool
    @IBInspectable open var rightToLeft:         Bool
    
    open var affineFormats:               [String]
    open var affinityCalculationStrategy: AffinityCalculationStrategy
    open var customNotations:             [Notation]
    
    open var primaryMask: Mask {
        return try! maskGetOrCreate(withFormat: primaryMaskFormat, customNotations: customNotations)
    }
    
    /**
     TODO: write doc
     */
    private var textBefore: String = ""
    
    open func attachDelegateToTextView(_ textView: NSTextView) {
        textView.delegate = self
        textBefore = textView.string
    }
    
    public init(
        primaryFormat: String = "",
        autocomplete: Bool = true,
        autoskip: Bool = false,
        rightToLeft: Bool = false,
        affineFormats: [String] = [],
        affinityCalculationStrategy: AffinityCalculationStrategy = .wholeString,
        customNotations: [Notation] = [],
        onMaskedTextViewChangedCallback: ((_ textView: NSTextView, _ value: String, _ complete: Bool, _ tailPlaceholder: String) -> ())? = nil,
        allowSuggestions: Bool = true
    ) {
        self.primaryMaskFormat = primaryFormat
        self.autocomplete = autocomplete
        self.autoskip = autoskip
        self.rightToLeft = rightToLeft
        self.affineFormats = affineFormats
        self.affinityCalculationStrategy = affinityCalculationStrategy
        self.customNotations = customNotations
        self.onMaskedTextViewChangedCallback = onMaskedTextViewChangedCallback
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
        self.autoskip = false
        self.rightToLeft = false
        self.affineFormats = []
        self.affinityCalculationStrategy = .wholeString
        self.customNotations = []
        self.onMaskedTextViewChangedCallback = nil
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
    open func put(text: String, into field: NSTextView, autocomplete putAutocomplete: Bool? = nil) -> Mask.Result {
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

        field.string = result.formattedText.string
        field.setSelectedRange(
            NSRange(
                location: result.formattedText.string.distanceFromStartIndex(to: result.formattedText.caretPosition),
                length: 0
            )
        )

        notifyOnMaskedTextChangedListeners(forTextView: field, result: result)
        return result
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
    
    open func notifyOnMaskedTextChangedListeners(forTextView textView: NSTextView, result: Mask.Result) {
        listener?.textView(
            textView,
            didExtractValue: result.extractedValue,
            didFillMandatoryCharacters: result.complete,
            didComputeTailPlaceholder: result.tailPlaceholder
        )
        onMaskedTextViewChangedCallback?(textView, result.extractedValue, result.complete, result.tailPlaceholder)
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
            if let listener = newDelegate as? OnMaskedTextViewChangedListener {
                self.listener = listener
            }
        }
    }
    
    public func textView(_ textView: NSTextView, willChangeSelectionFromCharacterRange oldSelectedCharRange: NSRange, toCharacterRange newSelectedCharRange: NSRange) -> NSRange {
        guard textBefore != textView.string
        else {
            // regular cursor movement/selection change
            return newSelectedCharRange
        }
        
        let updatedText = textView.string
        let isDeletion: Bool
        if oldSelectedCharRange.length > 0 {
            // deleting selected symbols?
            isDeletion =
                textBefore.count > updatedText.count
             && textBefore.count - updatedText.count == oldSelectedCharRange.length
        } else {
            // backspace?
            isDeletion =
                textBefore.count > updatedText.count
             && oldSelectedCharRange.location > newSelectedCharRange.location
             && textBefore.count - updatedText.count == oldSelectedCharRange.location - newSelectedCharRange.location
        }
        
        let useAutocomplete = isDeletion ? false : autocomplete
        let useAutoskip = isDeletion ? autoskip : false
        
        let caretPositionInt = newSelectedCharRange.location
        let caretPosition: String.Index = updatedText.startIndex(offsetBy: caretPositionInt)
        
        let caretGravity: CaretString.CaretGravity = isDeletion
            ? .backward(autoskip: useAutoskip)
            : .forward(autocomplete: useAutocomplete)
        
        let text = CaretString(string: updatedText, caretPosition: caretPosition, caretGravity: caretGravity)
        
        let mask = pickMask(forText: text)
        let result = mask.apply(toText: text)
        
        defer {
            notifyOnMaskedTextChangedListeners(forTextView: textView, result: result)
        }
        
        textView.string = result.formattedText.string
        textBefore = result.formattedText.string
        return NSRange(
            location: result.formattedText.string.distanceFromStartIndex(to: result.formattedText.caretPosition),
            length: 0
        )
    }
    
}

#endif
