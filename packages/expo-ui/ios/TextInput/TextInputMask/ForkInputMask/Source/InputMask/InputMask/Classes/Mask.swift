//
// Project «InputMask»
// Created by Jeorge Taflanidi
//

#if canImport(Foundation)

import Foundation


/**
 ### Mask
 
 Iterates over user input. Creates formatted strings from it. Extracts value specified by mask format.
 
 Provided mask format string is translated by the ``Compiler`` class into a set of states, which define the formatting
 and value extraction.
 
 - seealso: ``Compiler``, ``State`` and ``CaretString`` classes.
 */
public class Mask: CustomDebugStringConvertible, CustomStringConvertible {
    
    /**
     ### Result
     
     The end result of mask application to the user input string.
     */
    public struct Result: CustomDebugStringConvertible, CustomStringConvertible {
        
        /**
         Formatted text with updated caret position.
         */
        public let formattedText: CaretString
        
        /**
         Value, extracted from formatted text according to mask format.
         */
        public let extractedValue: String
        
        /**
         Calculated absolute affinity value between the mask format and input text.
         */
        public let affinity: Int
        
        /**
         User input is complete.
         */
        public let complete: Bool
        
        /**
         Placeholder for remaining text.
         */
        public let tailPlaceholder: String
        
        public var debugDescription: String {
            return "FORMATTED TEXT: \(self.formattedText)\nEXTRACTED VALUE: \(self.extractedValue)\nAFFINITY: \(self.affinity)\nCOMPLETE: \(self.complete)"
        }
        
        public var description: String {
            return self.debugDescription
        }

        /**
         Produce a reversed ``Mask/Result`` with reversed formatted text (``CaretString``) and reversed extracted value.
         */
        func reversed() -> Result {
            return Result(
                formattedText: self.formattedText.reversed(),
                extractedValue: self.extractedValue.reversed,
                affinity: affinity,
                complete: complete,
                tailPlaceholder: tailPlaceholder.reversed
            )
        }
    }
    
    private let initialState: MaskState
    private static var cache: [String: Mask] = [:]
    
    /**
     Constructor.
     
     - parameter format: mask format.
     - parameter customNotations: a list of custom rules to compile square bracket `[]` groups of format symbols.
     
     - returns: Initialized ``Mask`` instance.
     
     - throws: ``Compiler/CompilerError`` if format string is incorrect.
     */
    public required init(format: String, customNotations: [Notation] = []) throws {
        self.initialState = try Compiler(customNotations: customNotations).compile(formatString: format)
    }
    
    /**
     Constructor.
     
     Operates over own ``Mask`` cache where initialized ``Mask`` objects are stored under corresponding format key:
     `[format : mask]`
     
     - returns: Previously cached ``Mask`` object for requested format string. If such it doesn't exist in cache, the
     object is constructed, cached and returned.
     */
    public class func getOrCreate(withFormat format: String, customNotations: [Notation] = []) throws -> Mask {
        if let cachedMask: Mask = cache[format] {
            return cachedMask
        } else {
            let mask: Mask = try Mask(format: format, customNotations: customNotations)
            cache[format] = mask
            return mask
        }
    }
    
    /**
     Check your mask format is valid.
     
     - parameter format: mask format.
     - parameter customNotations: a list of custom rules to compile square bracket `[]` groups of format symbols.
     
     - returns: `true` if this format coupled with custom notations will compile into a working ``Mask`` object.
     Otherwise `false`.
     */
    public class func isValid(format: String, customNotations: [Notation] = []) -> Bool {
        return nil != (try? self.init(format: format, customNotations: customNotations))
    }
    
    /**
     Apply mask to the user input string.
     
     - parameter toText: user input string with current cursor position
     - parameter autocomplete: enable text autocompletion; `false` by default
     
     - returns: Formatted text with extracted value an adjusted cursor position.
     */
    public func apply(toText text: CaretString) -> Result {
        let iterator: CaretStringIterator = self.makeIterator(forText: text)
        
        var affinity:               Int     = 0
        var extractedValue:         String  = ""
        var modifiedString:         String  = ""
        var modifiedCaretPosition:  Int     = text.string.distanceFromStartIndex(to: text.caretPosition)
        
        var state: MaskState        = self.initialState
        var autocompletionStack = AutocompletionStack()
        
        var insertionAffectsCaret: Bool       = iterator.insertionAffectsCaret()
        var deletionAffectsCaret:  Bool       = iterator.deletionAffectsCaret()
        var character:             Character? = iterator.next()
        
        while let char: Character = character {
            if let next: Next = state.accept(character: char) {
                if deletionAffectsCaret {
                    autocompletionStack.pushBack(next: state.autocomplete())
                }
                state = next.state
                modifiedString += nil != next.insert ? String(next.insert!) : ""
                extractedValue += nil != next.value  ? String(next.value!)  : ""
                if next.pass {
                    insertionAffectsCaret = iterator.insertionAffectsCaret()
                    deletionAffectsCaret  = iterator.deletionAffectsCaret()
                    character   = iterator.next()
                    affinity   += 1
                } else {
                    if insertionAffectsCaret && nil != next.insert {
                        modifiedCaretPosition += 1
                    }
                    affinity -= 1
                }
            } else {
                if deletionAffectsCaret {
                    modifiedCaretPosition -= 1
                }
                insertionAffectsCaret = iterator.insertionAffectsCaret()
                deletionAffectsCaret  = iterator.deletionAffectsCaret()
                character   = iterator.next()
                affinity   -= 1
            }
        }
        
        while text.caretGravity.autocomplete && insertionAffectsCaret, let next: Next = state.autocomplete() {
            state = next.state
            modifiedString += nil != next.insert ? String(next.insert!) : ""
            extractedValue += nil != next.value  ? String(next.value!)  : ""
            if nil != next.insert {
                modifiedCaretPosition += 1
            }
        }
        
        var tailState = state
        var tail = ""
        
        while text.caretGravity.autoskip && !autocompletionStack.isEmpty {
            let skip: Next = autocompletionStack.pop()
            if modifiedString.count == modifiedCaretPosition {
                if nil != skip.insert && skip.insert == modifiedString.last {
                    modifiedString.removeLast()
                    modifiedCaretPosition -= 1
                }
                if nil != skip.value && skip.value == extractedValue.last {
                    extractedValue.removeLast()
                }
            } else {
                if nil != skip.insert {
                    modifiedCaretPosition -= 1
                }
            }
            tailState = skip.state
            if let insert = skip.insert {
                tail = String(insert)
            }
        }
        
        let tailPlaceholder = appendPlaceholder(withState: tailState, placeholder: tail)
        
        return Result(
            formattedText: CaretString(
                string: modifiedString,
                caretPosition: modifiedString.startIndex(offsetBy: modifiedCaretPosition),
                caretGravity: text.caretGravity
            ),
            extractedValue: extractedValue,
            affinity: affinity,
            complete: self.noMandatoryCharactersLeftAfterState(state),
            tailPlaceholder: tailPlaceholder
        )
    }
    
    /**
     Generate placeholder.
     
     - returns: Placeholder string.
     */
    public var placeholder: String {
        return self.appendPlaceholder(withState: self.initialState, placeholder: "")
    }
    
    /**
     Minimal length of the text inside the field to fill all mandatory characters in the mask.
     
     - returns: Minimal satisfying count of characters inside the text field.
     */
    public var acceptableTextLength: Int {
        return self.countStates(ofTypes: [FixedState.self, FreeState.self, ValueState.self])
    }
    
    /**
     Maximal length of the text inside the field.
     
     - returns: Total available count of mandatory and optional characters inside the text field.
     */
    public var totalTextLength: Int {
        return self.countStates(ofTypes: [FixedState.self, FreeState.self, ValueState.self, OptionalValueState.self])
    }
    
    /**
     Minimal length of the extracted value with all mandatory characters filled.
     
     - returns: Minimal satisfying count of characters in extracted value.
     */
    public var acceptableValueLength: Int {
        var state: MaskState? = self.initialState
        var length: Int = 0
        while let s: MaskState = state, !(state is EOLState) {
            if s is FixedState || s is ValueState {
                length += 1
            }
            state = s.child
        }
        
        return length
    }
    
    /**
     Maximal length of the extracted value.
     
     - returns: Total available count of mandatory and optional characters for extracted value.
     */
    public var totalValueLength: Int {
        var state: MaskState? = self.initialState
        var length: Int = 0
        while let s: MaskState = state, !(state is EOLState) {
            if s is FixedState || s is ValueState || s is OptionalValueState {
                length += 1
            }
            state = s.child
        }
        
        return length
    }
    
    public var debugDescription: String {
        return self.initialState.debugDescription
    }
    
    public var description: String {
        return self.debugDescription
    }
    
    func makeIterator(forText text: CaretString) -> CaretStringIterator {
        return CaretStringIterator(caretString: text)
    }
    
    /**
     While scanning through the input string in the `.apply(…)` method, the mask builds a graph of autocompletion steps.
     This graph accumulates the results of `.autocomplete()` calls for each consecutive ``State``, acting as a `stack` of
     ``Next`` object instances.
     
     Each time the ``State`` returns `null` for its `.autocomplete()`, the graph resets empty.
     */
    private struct AutocompletionStack {
        private var stack = [Next]()
        
        var isEmpty: Bool { stack.isEmpty }
        
        mutating func pushBack(next: Next?) {
            if let next: Next = next {
                stack.append(next)
            } else {
                stack.removeAll()
            }
        }
        
        mutating func pop() -> Next { return stack.removeLast() }
        
        mutating func removeAll() { stack.removeAll() }
    }
    
}


private extension Mask {
    
    func appendPlaceholder(withState state: MaskState?, placeholder: String) -> String {
        guard let state: MaskState = state
        else { return placeholder }
        
        if state is EOLState {
            return placeholder
        }
        
        if let state = state as? FixedState {
            return self.appendPlaceholder(withState: state.child, placeholder: placeholder + String(state.ownCharacter))
        }
        
        if let state = state as? FreeState {
            return self.appendPlaceholder(withState: state.child, placeholder: placeholder + String(state.ownCharacter))
        }
        
        if let state = state as? OptionalValueState {
            switch state.type {
                case .alphaNumeric:
                    return self.appendPlaceholder(withState: state.child, placeholder: placeholder + "-")
                
                case .literal:
                    return self.appendPlaceholder(withState: state.child, placeholder: placeholder + "a")
                
                case .numeric:
                    return self.appendPlaceholder(withState: state.child, placeholder: placeholder + "0")
                
                case .custom(let char, _):
                    return self.appendPlaceholder(withState: state.child, placeholder: placeholder + String(char))
            }
        }
        
        if let state = state as? ValueState {
            switch state.type {
                case .alphaNumeric:
                    return self.appendPlaceholder(withState: state.child, placeholder: placeholder + "-")
                    
                case .literal:
                    return self.appendPlaceholder(withState: state.child, placeholder: placeholder + "a")
                    
                case .numeric:
                    return self.appendPlaceholder(withState: state.child, placeholder: placeholder + "0")
                
                case .ellipsis:
                    return placeholder
                
                case .custom(let char, _):
                    return self.appendPlaceholder(withState: state.child, placeholder: placeholder + String(char))
            }
        }
        
        return placeholder
    }
    
    func noMandatoryCharactersLeftAfterState(_ state: MaskState) -> Bool {
        if (state is EOLState) {
            return true
        } else if let valueState = state as? ValueState {
            return valueState.isElliptical
        } else if (state is FixedState) {
            return false
        } else {
            return self.noMandatoryCharactersLeftAfterState(state.nextState())
        }
    }
        
    func countStates(ofTypes stateTypes: [MaskState.Type]) -> Int {
        var state: MaskState? = self.initialState
        var length: Int = 0
        while let s: MaskState = state, !(state is EOLState) {
            for stateType in stateTypes {
                if type(of: s) == stateType {
                    length += 1
                }
            }
            state = s.child
        }
        
        return length
    }
    
}

#endif
