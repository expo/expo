//
// Project «InputMask»
// Created by Jeorge Taflanidi
//

#if canImport(UIKit) && canImport(Foundation) && !os(watchOS)

import Foundation
import UIKit

/**
 — Mom, can we have a neural network?
 — No, we have a neural network at home.
 
 Neural network at home:
 */

/**
 ### NumberInputListener
 
 A ``MaskedTextInputListener`` subclass for numbers.
 
 Use with caution, this module is still in development.
 
 - seealso: the ``NumberInputListener/formatter`` field
 */
open class NumberInputListener: MaskedTextInputListener {
    private static let decimalSeparator = "."
    
    open var formatter: NumberFormatter? = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.locale = Locale(identifier: "en_us")
        formatter.decimalSeparator = Locale.current.decimalSeparator ?? NumberInputListener.decimalSeparator
        formatter.minimumFractionDigits = 0
        formatter.roundingMode = .floor
        return formatter
    }()
    
    open override var placeholder: String {
        let text = "0"
        let mask: Mask = pickMask(
            forText: CaretString(
                string: text,
                caretPosition: text.endIndex,
                caretGravity: CaretString.CaretGravity.forward(autocomplete: autocomplete)
            )
        )
        return mask.placeholder
    }
    
    open override func pickMask(forText text: CaretString) -> Mask {
        guard let formatter = formatter
        else {
            return try! Mask.getOrCreate(withFormat: "[…]")
        }
        
        let sanitisedNumberString = extractNumberAndDecimalSeparator(formatter: formatter, text: text.string)
        
        guard let intNum = NumberFormatter().number(from: sanitisedNumberString.intPart), let intMaskFormat = formatter.string(from: intNum)
        else {
            return try! Mask.getOrCreate(withFormat: "[…]")
        }
        
        let intZero: Bool = intNum.isEqual(to: 0)
        let notationChar = assignNonZeroNumberNotation()
        
        var maskFormat = ""
        var first = true
        intMaskFormat.forEach { char in
            if CharacterSet.decimalDigits.isMember(character: char) {
                if first && !intZero {
                    maskFormat += "[\(notationChar)]"
                    first = false
                } else {
                    maskFormat += "[0]"
                }
            } else {
                maskFormat += "{\(char)}"
            }
        }
        
        if sanitisedNumberString.numberOfOccurrencesOfDecimalSeparator > 0 {
            maskFormat += "{\(sanitisedNumberString.expectedDecimalSeparator)}"
        }
        
        sanitisedNumberString.decPart.forEach { char in
            maskFormat += "[0]"
        }
        
        primaryMaskFormat = maskFormat
        return super.pickMask(forText: text)
    }
    
    open override func textFieldDidBeginEditing(_ textField: UITextField) {
        if autocompleteOnFocus && (textField.text ?? "").isEmpty {
            let result: Mask.Result = put(text: "0", into: textField, autocomplete: true)
            notifyOnMaskedTextChangedListeners(forTextInput: textField, result: result)
        }
    }
    
    open override func textFieldShouldClear(_ textField: UITextField) -> Bool {
        let result: Mask.Result = put(text: "0", into: textField, autocomplete: false)
        notifyOnMaskedTextChangedListeners(forTextInput: textField, result: result)
        return true
    }
    
    open override func textViewDidBeginEditing(_ textView: UITextView) {
        if autocompleteOnFocus && textView.text.isEmpty {
            let result: Mask.Result = put(text: "0", into: textView, autocomplete: true)
            notifyOnMaskedTextChangedListeners(forTextInput: textView, result: result)
        }
    }
    
    private struct SanitisedNumberString {
        let intPart: String
        let decPart: String
        let expectedDecimalSeparator: String
        let numberOfOccurrencesOfDecimalSeparator: Int
    }
    
    private func extractNumberAndDecimalSeparator(
        formatter: NumberFormatter,
        text: String
    ) -> SanitisedNumberString {
        let appliedDecimalSeparator = formatter.decimalSeparator ?? NumberInputListener.decimalSeparator
        let appliedCurrencyDecimalSeparator = formatter.currencyDecimalSeparator ?? NumberInputListener.decimalSeparator
        
        var expectedDecimalSeparator: String = appliedDecimalSeparator
        if text.contains(appliedCurrencyDecimalSeparator) {
            expectedDecimalSeparator = appliedCurrencyDecimalSeparator
        }
        
        var digitsAndDecimalSeparators = text
            .replacingOccurrences(of: appliedDecimalSeparator, with: NumberInputListener.decimalSeparator)
            .replacingOccurrences(of: appliedCurrencyDecimalSeparator, with: NumberInputListener.decimalSeparator)
            .filter { c in
                return CharacterSet.decimalDigits.isMember(character: c) || String(c) == NumberInputListener.decimalSeparator
            }
        
        let numberOfOccurrencesOfDecimalSeparator = digitsAndDecimalSeparators.numberOfOccurrencesOf(NumberInputListener.decimalSeparator)
        if numberOfOccurrencesOfDecimalSeparator > 1 {
            if #available(iOS 16.0, tvOS 16.0, *) {
                digitsAndDecimalSeparators =
                    digitsAndDecimalSeparators
                        .reversed
                        .replacing(NumberInputListener.decimalSeparator, with: "", maxReplacements: numberOfOccurrencesOfDecimalSeparator - 1)
                        .reversed
            } else {
                // TODO: remove
                digitsAndDecimalSeparators = digitsAndDecimalSeparators.reversed
                digitsAndDecimalSeparators = replace(
                    NumberInputListener.decimalSeparator,
                    in: digitsAndDecimalSeparators,
                    with: "",
                    maxReplacements: numberOfOccurrencesOfDecimalSeparator - 1
                )
                digitsAndDecimalSeparators = digitsAndDecimalSeparators.reversed
            }
        }
        
        let components = digitsAndDecimalSeparators.components(separatedBy: NumberInputListener.decimalSeparator)
        
        var intStr = ""
        var decStr = ""
        
        if components.count > 1 {
            intStr = components.first ?? ""
            decStr = components.last ?? ""
        } else {
            intStr = components.first ?? ""
        }
        
        intStr = intStr.isEmpty ? "0" : intStr
        intStr = String(intStr.prefix(formatter.maximumIntegerDigits))
        decStr = String(decStr.prefix(formatter.maximumFractionDigits))
        
        return SanitisedNumberString(
            intPart: intStr,
            decPart: decStr,
            expectedDecimalSeparator: expectedDecimalSeparator,
            numberOfOccurrencesOfDecimalSeparator: numberOfOccurrencesOfDecimalSeparator
        )
    }
    
    private func assignNonZeroNumberNotation() -> Character {
        let character: Character = "1"
        customNotations = [
            Notation(
                character: character,
                characterSet: CharacterSet(charactersIn: "123456789"),
                isOptional: false
            )
        ]
        return character
    }
    
    private func replace(
        _ substring: String,
        in origin: String,
        with replacementSubstring: String,
        maxReplacements: Int
    ) -> String {
        var string = origin
        var ranges: [Range<String.Index>] = []
        var start = string.startIndex
        while start < string.endIndex,
            let range = string.range(of: substring, range: start..<string.endIndex) {
            ranges.append(range)
            start = range.upperBound
            if ranges.count == maxReplacements { break }
        }

        for range in ranges.reversed() {
            string.replaceSubrange(range, with:  replacementSubstring)
        }
        return string
    }
}

#endif
