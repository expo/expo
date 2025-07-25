<img src="Documentation/Assets/logo.png" alt="Input Mask" />

[![](https://img.shields.io/endpoint?url=https%3A%2F%2Fswiftpackageindex.com%2Fapi%2Fpackages%2FRedMadRobot%2Finput-mask-ios%2Fbadge%3Ftype%3Dswift-versions&style=for-the-badge)](https://swiftpackageindex.com/RedMadRobot/input-mask-ios) [![](https://img.shields.io/endpoint?url=https%3A%2F%2Fswiftpackageindex.com%2Fapi%2Fpackages%2FRedMadRobot%2Finput-mask-ios%2Fbadge%3Ftype%3Dplatforms&style=for-the-badge)](https://swiftpackageindex.com/RedMadRobot/input-mask-ios) [![Pod Version Badge](https://img.shields.io/badge/POD-v7.3.2-blue?logo=cocoapods&style=for-the-badge)](https://cocoapods.org/pods/InputMask) [![Awesome](https://img.shields.io/badge/-mentioned_in_awesome_iOS-CCA6C4.svg?colorA=CCA6C4&colorB=261120&logoWidth=20&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI%2BICAgIDxwYXRoIGZpbGw9IiMyNjExMjAiIGQ9Ik0xOS4xNCA0LjVMMTQuMjMgMGwtLjY5Ljc1IDQuMDkgMy43NUgxLjUxTDUuNi43NSA0LjkxIDAgMCA0LjV2Mi45N0MwIDguODEgMS4yOSA5LjkgMi44OCA5LjloMy4wM2MxLjU5IDAgMi44OC0xLjA5IDIuODgtMi40M1Y1LjUyaDEuNTd2MS45NWMwIDEuMzQgMS4yOSAyLjQzIDIuODggMi40M2gzLjAzYzEuNTkgMCAyLjg4LTEuMDkgMi44OC0yLjQzbC0uMDEtMi45N3oiLz48L3N2Zz4%3D&style=for-the-badge)](https://github.com/vsouza/awesome-ios) [![Actions](https://img.shields.io/github/actions/workflow/status/RedMadRobot/input-mask-ios/swift.yml?style=for-the-badge)](https://github.com/RedMadRobot/input-mask-ios/actions/workflows/swift.yml) [![Android](https://img.shields.io/badge/-android_version-red?color=teal&logo=android&style=for-the-badge)](https://github.com/RedMadRobot/input-mask-android) [![Telegram](https://img.shields.io/badge/-telegram_author-red?color=blue&logo=telegram&style=for-the-badge)](https://t.me/jeorge_taflanidi) [![license](https://img.shields.io/github/license/mashape/apistatus.svg?style=for-the-badge)](#license)

Input masks restrict data input and allow you to guide users to enter correct values.  
Check out our [wiki](https://github.com/RedMadRobot/input-mask-ios/wiki) for quick start and further reading.  

## ⚙️ Features

- Apply formatting to your text fields, see [examples](#examples)
- Filter out nonessential symbols (e.g. extract `0123456` from `+1 (999) 012-34-56`)
- For international phone numbers 
    - guess the country from the entered digits
    - apply corresponding value restrictions (e.g. a 🇺🇸US phone will have a format like `+1 201 456-7890`)
- Apply number/currency formatting 
- SwiftUI support
- macOS support

<a name="examples" />

## 💳 Examples

- Phone numbers: `+1 ([000]) [000] [00] [00]`
- Dates: `[00]{.}[00]{.}[9900]`
- Serial numbers: `[AA]-[00000099]`
- IPv4: `[099]{.}[099]{.}[099]{.}[099]`
- Visa/MasterCard numbers: `[0000] [0000] [0000] [0000]`
- UK IBAN: `GB[00] [____] [0000] [0000] [0000] [00]`

<a name="installation" />

## 🛠️ Installation

### Swift Package Manager

```swift
dependencies: [
    .Package(url: "https://github.com/RedMadRobot/input-mask-ios", majorVersion: 7)
]
```

### CocoaPods

```ruby
pod 'InputMask'
```

### Manual

0. `git clone` this repository;
1. Add `InputMask.xcodeproj` into your project/workspace;
2. Go to your target's settings, add `InputMask.framework` under the `Embedded Binaries` section
3. For `ObjC` projects:
	* (~Xcode 8.x) make sure `Build Options` has `Embedded Content Contains Swift Code` enabled;
	* import bridging header.

## 📢 Communication, Questions & Issues

Please take a closer look at our [Known issues](#knownissues) section before you incorporate our library into your project.

For your bugreports and feature requests please file new issues [via GitHub](https://github.com/RedMadRobot/input-mask-ios/issues/new/choose).

Should you have any questions, please search for closed [issues](https://github.com/RedMadRobot/input-mask-ios/issues?q=is%3Aclosed) or ask questions at **[StackOverflow](https://stackoverflow.com/questions/tagged/input-mask)** with the `input-mask` tag.

<a name="knownissues" />

## ❗Known issues

### `UITextFieldTextDidChange` notification and target-action `editingChanged` event

`UITextField` with assigned `MaskedTextFieldDelegate` object won't issue `UITextFieldTextDidChange` notifications and `editingChanged` control events. This happens due to the `textField(_:shouldChangeCharactersIn:replacementString:)` method implementation, which always returns `false`.

Consider using following workaround in case if you do really need to catch editing events:

```swift
class NotifyingMaskedTextFieldDelegate: MaskedTextFieldDelegate {
    weak var editingListener: NotifyingMaskedTextFieldDelegateListener?
    
    override func textField(
        _ textField: UITextField,
        shouldChangeCharactersIn range: NSRange,
        replacementString string: String
    ) -> Bool {
        defer {
            self.editingListener?.onEditingChanged(inTextField: textField)
        }
        return super.textField(textField, shouldChangeCharactersIn: range, replacementString: string)
    }
}


protocol NotifyingMaskedTextFieldDelegateListener: class {
    func onEditingChanged(inTextField: UITextField)
}
```

Please, avoid at all costs sending SDK events and notifications manually.

### Carthage vs. IBDesignables, IBInspectables, views and their outlets

Interface Builder struggles to support modules imported in a form of a dynamic framework. For instance, custom views annotated as IBDesignable, containing IBInspectable and IBOutlet fields aren't recognized properly from the drag'n'dropped \*.framework.

In case you are using our library as a Carthage-built dynamic framework, be aware you won't be able to easily wire your `MaskedTextFieldDelegate` objects and their listeners from storyboards in your project. There is a couple of workarounds described in [the corresponding discussion](https://github.com/Carthage/Carthage/issues/335), though.

Also, consider filing a radar to Apple, like [this one](https://openradar.appspot.com/23114017).

### Cut action doesn't put text into the pasteboard

When you cut text, characters get deleted yet you won't be able to paste them somewhere as they aren't actually in your pasteboard.

iOS hardwires `UIMenuController`'s cut action to the `UITextFieldDelegate`'s `textField(_:shouldChangeCharactersIn:replacementString:)` return value. This means "Cut" behaviour actually depends on the ability to edit the text.

Bad news are, our library returns `false` in `textField(_:shouldChangeCharactersIn:replacementString:)`, and heavily depends on this `false`. It would require us to rewrite a lot of logic in order to change this design, and there's no guarantee we'll be able to do so.

Essentially, there's no distinct way to differentiate "Cut selection" and "Delete selection" actions on the `UITextFieldDelegate` side. However, you may consider using a workaround, which will require you to subclass `UITextField` overriding its `cut(sender:)` method like this:

```swift
class UITextFieldMonkeyPatch: UITextField {
    override func cut(_ sender: Any?) {
        copy(sender)
        super.cut(sender)
    }
}
```

From our library perspective, this looks like a highly invasive solution. Thus, in the long term, we are going to investigate a "costly" method to bring the behaviour matching the iOS SDK logic. Yet, here "long term" might mean months.

### Incorrect cursor position after pasting

Shortly after new text is being pasted from the clipboard, every ```UITextInput``` receives a new value for its `selectedTextRange` property from the system. This new range is not consistent with the formatted text and calculated caret position most of the time, yet it's being assigned just after ```set caretPosition``` call.
     
To ensure correct caret position is set, it might be assigned asynchronously (presumably after a vanishingly small delay), if caret movement is set to be non-atomic; see `MaskedTextFieldDelegate.atomicCursorMovement` property.

### `MaskedTextInputListener`

In case you are wondering why do we have two separate `UITextFieldDelegate` and `UITextViewDelegate` implementations, the answer is simple: prior to **iOS 11** `UITextField` and `UITextView` had different behaviour in some key situations, which made it difficult to implement common logic. 

Both had the same [bug](http://jon-nolen.blogspot.com/2013/10/uitextview-returns-nil-for-uitextinput.html) with the `UITextInput.beginningOfDocument` property, which rendered impossible to use the generic `UITextInput` protocol `UITextField` and `UITextView` have in common.

Since **iOS 11** most of the things received their fixes (except for the `UITextView` [edge case](https://github.com/RedMadRobot/input-mask-ios/blob/master/Source/InputMask/InputMask/Classes/View/MaskedTextInputListener.swift#L140)). In case your project is not going to support anything below 11, consider using the modern `MaskedTextInputListener`.

## 🙏 Special thanks

These folks rock:

* Mikhail [while366](https://github.com/while366) Zhadko
* Sergey [SergeyCHiP](https://github.com/SergeyCHiP) Germanovich
* Luiz [LuizZak](https://github.com/LuizZak) Fernando
* Ivan [vani](https://github.com/vani2) Vavilov
* Diego [diegotl](https://github.com/diegotl) Trevisan
* Martin [martintreurnicht](https://github.com/martintreurnicht) Treurnicht
* Alexander [CFIFok](https://github.com/CFIFok) Kurilovich

<a name="license" />

## ♻️ License

The library is distributed under the MIT [LICENSE](https://github.com/RedMadRobot/input-mask-ios/blob/master/LICENSE).
