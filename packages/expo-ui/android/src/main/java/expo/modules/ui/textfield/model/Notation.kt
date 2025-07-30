package expo.modules.ui.textfield.model

/**
 * ### Notation
 *
 * Custom rule for characters inside square brackets.
 *
 * Internal `Mask` compiler supports a series of symbols which represent letters and numbers in user input.
 * Each symbol stands for its own character set; for instance, `0` and `9` stand for numeric character set.
 * This means user can type any digit instead of `0` or `9`, or any letter instead of `A` or `a`.
 *
 * The difference between `0` and `9` is that `0` stands for a **mandatory** digit, while `9` stands for **optional**.
 * This means with the mask like `[099][A]` user may enter `1b`, `12c` or `123d`, while with the mask `[000][A]` user
 * won't be able to enter the last letter unless he has entered three digits: `1` or `12` or `123` or `123e`.
 *
 * Summarizing, each symbol supported by the compiler has its own **character set** associated with it,
 * and also has an option to be **mandatory** or not.
 */
data class Notation(
    /**
     * A symbol in format string.
     */
    val character: Char,
    /**
     * An associated character set of acceptable input characters.
     */
    val characterSet: String,
    /**
     * Is it an optional symbol or mandatory?
     */
    val isOptional: Boolean
)
