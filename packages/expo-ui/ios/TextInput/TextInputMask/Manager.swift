//
//  Manager.swift
//  teste4
//
//  Created by Joao Morais on 18/07/25.
//

class MaskManager{
    
    public func applyMask(text: String,mask:String) -> String {

        let caretString = CaretString(
            string: text,
            caretPosition: text.endIndex,
            caretGravity: .forward(autocomplete: false)
        )
        do {
            let result = try Mask(format: mask).apply(toText: caretString)
            return result.formattedText.string
        } catch {
            return ""
        }
    }
}
