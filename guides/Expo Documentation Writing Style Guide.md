# Expo Documentation Writing Style Guide

The Expo documentation is the single source of truth for all implementations and usage of Expo SDK with tooling and related services. It evolves continuously with new features and services.

This style guide provides editorial guidelines for writing clear and consistent Expo-related documentation. Aim for clarity, accuracy, and completeness when contributing to the documentation with improvements. Use this style guide as a reference document for specific questions.

This page is divided into two main sections:

- [Writing General documentation](#writing-general-documentation)
- [Writing API documentation](#writing-api-documentation)

# Writing General documentation

The "General" documentation contains all mechanics and formatting guidelines that we follow when writing Expo documentation.

> All Expo documentation is written in [Markdown](https://en.wikipedia.org/wiki/Markdown).

## Spelling and word choices

Developers reading the Expo docs shouldn't find obvious mistakes and feel less confident in Expo. Write with correct grammar, punctuation, and spelling.

Always **show and don't tell**. Instead of explaining a concept to the reader, give them an example. Providing examples helps grab the reader's attention.

Some words have multiple legitimate ways to spell them. One of the most notorious examples in the Expo codebase is "canceled" vs. "cancelled". We tend to write "cancellation" instead of "cancelation". Prefer "canceled" and "canceling".

### Voice and tone

Developers read documentation to find answers to their problems. Documentation exists because it can translate complex information into easily digestible pieces. Voice and tone directly influence the translation of complex information and remove any friction.

Writing clearly and concisely using plain American English is the approach we take at Expo. We also use [curb-effect](https://ssir.org/articles/entry/the_curb_cut_effect) when approaching technical documentation. We aim for clarity for all English speakers.

### Write in the second person

Generally, we prefer to write in the second rather than the first person. Use "you" instead of "we".

The word "we" is reserved when "we" as the Expo team directly want to interact with the audience or convey an important message.

### Use present tense

Writing in the present tense allows our audience to understand the current benefits of our offering. Developers already face complex tradeoffs when selecting their stack.

### Use active voice

Avoid writing sentences in the passive voice. Common passive voice usage uses words such as "was" or "by". Use [Hemingway](https://hemingwayapp.com/) or Grammarly to check your passive voice usage.

### Write and edit for clarity

Write short sentences. One thought per sentence is punchier and pithier. When you try cramming multiple thoughts and ideas into a single sentence, your copy becomes painful to read.

Use action verbs and subject verb-object construction, cut clunky phrases, and avoid jargon. Remove any adjectives or adverbs that don't modify the meaning of a sentence.

If you have to write a long sentence, follow it up with a short one. This can snap the reader back to attention. Don't repeat the same word in the same sentence. Furthermore, don't start or end a sentence with the same word you used to start or end the previous sentence.

### Use gender-neutral terms

Use "they" that can be used as a singular pronoun. When necessary, address a group of readers as "developers" or "app users".

### Symbols as words

When it is correct to use words instead of symbols:

- **Ampersands (&)**: Don't use "&" instead of "and" in headings, text, navigation, or tables of contents. Spell out "and" instead of using the ampersand.
- **Plus (+)**: Don't use "+" instead of "plus" in text, navigation, or tables of contents. Spell out "plus" instead of using the plus sign.
  - An exception to this rule is when [referencing keyboard shortcuts](#referencing-keyboard-shortcuts).

### Referencing "app stores"

When referencing multiple app stores, use "app stores" as a general indicator without capitalization.

When referencing a specific platform app store, use "Apple App Store" or "Google Play Store" (with capitalization).

### Referencing "apps"

The words "app" or "application" are used interchangeably since we use both at different places. However, use "app" or "application" when generally referring to an .ipa, .apk or .aab file.

Use ".ipa" or ".apk" or ".aab" only when referring specifically to that extension.

Before an app is built into an app archive, it is a project. For example, "EAS Build takes a project and produces an app".

### Abbreviations

When using an abbreviation for the first time on an individual documentation page, start with the full form of an abbreviated word followed by the abbreviation in parentheses (). For example, "source (src)".

The following abbreviations are acceptable in their shortened form:

- HTML, JPEG, HTTP, PNG, URL, npm, .ipa, .apk., .aab, CSV, etc.

Also, avoid Latin abbreviations such as: "i.e." or "e.g.", etc. Instead, spell them out, "that is" or "for example".

### Follow external product casing

Use external product names in the same way as they are used industry-wide. For example, CocoaPods, iOS, Android, React Native, npm, Yarn, macOS, GitHub, Node.js, ESLint, JavaScript, TypeScript, etc.

### Referencing Bytes and Bits

Always use a capital "B" for bytes. Write "bit" or a lowercase "b" for bits. For example:

- byte units: kB, MB, GB, TB
- bit units: kbit, Mbit, Gbit, Tbit

For an in-detail reference on Bytes and Bits, read the [Writing API documentation](#writing-api-documentation).

### Platform order when referencing Android, iOS, and Web or multiple platforms

In most cases, to refer to multiple platforms (Android, iOS, and Web) in one sentence or to order sections on a particular page, follow the pattern: **"Android, iOS, and Web"**.

### Referencing Expo Go

When referencing Expo Go, the supported text should avoid implying: "running an app", "developing an app", or "previewing an app". One alternative to avoid these constraints is: "testing your project".

## Punctuation

### Use double quotes in prose

- Correct: Set the field named "id" to your project's ID.
- Incorrect: Set the field named 'id' to your project's ID.

### Using Oxford commas

Generally, use Oxford commas. The need for an exception is often because it proliferates the population of commas in a copy block. Try instead to avoid this problem altogether (maybe one "," can become a "—" or a ":", or you need a simpler sentence) rather than omitting the Oxford comma.

One exception to avoid them is in headings for sections or sub-sections.

### Using the possessive form

The possessive of singular nouns is formed by adding an apostrophe **'s**. This is true no matter the final consonant. The possessive of plural nouns that end in **s** is formed by adding just the apostrophe at the end.

- Example: Expo's logo.

Exceptions to this guideline are the following:

- Pronoun possessives use no apostrophe (for example, its, hers, yours, theirs, ours), but indefinite pronouns do (for example, one's own opinions are not somebody else's problem). However, in technical writing, always consider whether using a pronoun adds too much work for the reader, who must find its antecedent.
- Ancient names that end in "-es" and "-is" are simply peculiar and take just an apostrophe (for example, Osiris' mummification, not Osiris's mummification). Still, you are unlikely to come across this in your technical writing.

### Do not add a space between the words and "/"

Do not add extra space between preceding and succeeding words and "/" just to emphasize them.

- Correct: Android device/emulator
- Incorrect: Android device / emulator

### Splitting phrases

Try splitting phrases into separate sentences. Our goal is to make documentation easier to read and understand.

In rare cases when it is necessary to split phrases, [use em dashes](#use-mdash) (—) or use connections (such as then, however, and so on) rather than commas to split phrases that read as separate sentences.

- Correct: JavaScript has come a long way since it was originally written in 10 days.
- Incorrect: JavaScript has come a long way, it was originally written in 10 days.

## Formatting

Guidelines for formatting in different situations, such as file names, inline code blocks, and so on.

### Headings

On a page, top-level headers should use H2 in the markdown files. Also, do not skip heading levels just to emphasize a sub-section.

Use sentence case for section or sub-section headings inside an individual page except when the header uses an Expo tool, a service, or an external product name. Developers are familiar with Expo or external product names. Following these ubiquitous naming conventions makes the documentation more readable and scannable.

- Correct: Workflow comparison
- Incorrect: Workflow Comparison

If the section or the sub-section heading refers to a product name such as Expo, Expo CLI, Expo Application Service, and so on, then capitalize them.

- Correct: Creating your first EAS build
- Incorrect: Creating your first eas build

### Buttons

We, sometimes, have buttons that lead to an Expo Snack. Use title case for these or any type of text on buttons. While following the title case, we have a rule of thumb to not to capitalize articles, prepositions, and conjunctions.

- Correct: Try this example on Snack
- Incorrect: Try This Example On Snack

### Filenames as bold text

Filenames are used as bold text in the markdown files.

- Correct: Your app's configuration is located in **app.json/app.config.js**
- Incorrect: Your app's configuration is loaded in `app.json/app.config.js`

### Capitalization

Do not use capitalized words to emphasize them.

Exception: Always capitalize product phrases:

- Correct: Expo Developer Server
- Incorrect: expo developer server

### Linking to other docs

Link the appropriate text rather than using the word "here". The linked text should describe the destination page and act as a Call to Action (CTA):

- Correct: More information on [building your own standalone app](https://docs.expo.dev/index.html) is available.
- Incorrect: Information on building your own standalone app is available [here](https://docs.expo.dev/index.html).

Use [internal links](https://github.com/expo/expo/blob/main/docs/README.md#internal-linking) when referencing a documentation page/topic that already exists. This helps avoid referencing the same piece of information copied from multiple places and gives the subject a single source of truth. For example:

- When referencing Expo CLI in a standalone apps document, instead of going through the steps of installing the Expo CLI from scratch, mention that Expo CLI is required and use internal linking to Expo CLI installation steps mentioned in the "Getting Started" section.

### Accessibility

An accessible document is created to be as easily readable by a sighted reader as a low vision or non-sighted reader. One of the key points to keep in mind when writing documentation and using images and videos is to add an "alt" text to them.

When referring to images or videos in Markdown (.md files), use the "alt" text. You can add the alt text in square brackets "[]" when adding an image or a video. For example:

```markdown
![alt text](/path/to/img.jpg)
```

### Using inline code blocks

Only apply inline code formatting using back-ticks (``) on programming words and commands:

- Correct: Make sure you write `async` before the `function` keyword to set up an asynchronous function.
- Incorrect: Click the `File` menu, then click `Save As` to export the file as a specific file type.

### Use `&mdash;`

In some scenarios, when you split two sentences and use `-` or `--`, instead use `&mdash;`. Markdown renders that em dash nicely instead of a hyphen (`-`).

### Referencing Keyboard shortcuts

Keyboard shortcuts mentioned in the text should use the `<kbd>` element in markdown files. Each key should be wrapped with a separate tag, and plus signs should remain outside the elements:

- Correct: Open the app, press <kbd>Cmd ⌘</kbd> + <kbd>T</kbd> or <kbd>Ctrl</kbd> + <kbd>T</kbd> to open a new window.
- Incorrect: Open the app, press `⌘+t` or `ctrl+t` to open a new window.

A few points to remember:

- Always add a space before and after the plus (+) symbol
- For macOS commands, use ⌘ symbol with the prefix Cmd
- For Windows, use the keyboard markings such as Ctrl, Alt, etc.
- Capitalize the shortcut/alphabet key, for example, <kbd>Ctrl</kbd> + <kbd>T</kbd>

### Do not use emojis

Do not use emojis in the documentation.

### When to use npm or Yarn

To avoid inconsistency when referencing to install global packages with a package manager like npm or Yarn, use npm.

- Correct: npm install expo-cli
- Incorrect: yarn install expo-cli

### For collapsible components

When a collapsible component has a single item or a paragraph to represent text, do not use a list item (or a bullet point) to emphasize it. It is unnecessary.

### Avoiding using outdated workflows

Avoid mentioning or using the terms to represent outdated/archived workflows, such as managed or bare workflow.

To avoid using the term "managed workflow", use "using Expo" to represent the current state of the Expo ecosystem. This is now the default way of explaining things.

When offering guidance for projects that require manually editing native code/directories, put those instructions in a dropdown saying "manual setup", or "usage in bare React Native projects", or "usage in existing React Native projects".

### Numbered Lists

Any numbered list should start with `1` instead of `0`. This avoids inconsistency across all areas in the documentation.

## Tools to use when using visualization or interactivity to communicate

Using a visual or an interactive example approach to communicate the correct information to our reader is another guideline we follow throughout the documentation. Consider using one of the following tools when necessary:

- **Diagrams** communicate complex ideas. They allow readers to digest relationships between concepts more easily than text.
- **Screenshots** let the reader immediately understand a visual feature and confirm the page is discussing the thing they are searching for.
- **Videos** allow readers to see flows without the upfront cost of launching snacks or installing Expo Go. Videos are ideal for demonstrating interactions or guiding the reader through a flow, especially if they are not already developing using Expo.
- **Snacks** allow the reader to see real code running on their phone, experience interactions, or see the result of changing parameters.

## Glossary

Terms referred in this section are meant to be used consistently throughout the documentation:

- Module
  - An **Expo module** is a unit of code that can be packaged up and used in multiple apps. It may or may not include native code. A native Expo module includes native code, such as Swift (iOS), Kotlin (Android), or DOM JavaScript (web).
  - A JavaScript module (also known as an ECMAScript module or ESM) is a JS file that typically imports values from other modules and exports its own values. See the ECMAScript specification for the definition of a module.
  - A React Native module is similar to an Expo module but for React Native apps. Similarly, a Flutter module is shared code that can be used in other Flutter apps.
  - A Swift module is a namespaced unit of code that can be distributed. It includes a module map and conforms to some other technical details.
- Library
  - An overarching name for code that application developers call into as a part of their apps. Examples of libraries are Expo modules, npm packages, and iOS APIs.
  - **"Expo libraries" is a synonym for Expo modules** and for consistency reasons, let's use **Expo Libraries**.
- Package
  - **npm packages** are units of code that include a file named package.json and are typically installed with npm or Yarn. They almost always include JavaScript code.
  - Expo modules are distributed as npm packages.
  - Java and Kotlin packages are namespaced units of code — a Java package is a namespace, not a single distributable file. They are often distributed as JAR files.
  - An Android package is a .apk (Android PacKage) file, which is a zip file containing the application class/DEX files, icons, fonts, and other app resources. With side-loading, it is possible to install and run a .apk file on an Android device directly.
- Archive
  - A compressed set of files, like a zip or tar file.
  - An iOS archive is a .ipa file that is a zip file containing the main application binary, icons, fonts, dynamically linked frameworks, etc.
- Bundle
  - An Android bundle is an .aab (Android Application Bundle) file that is similar to an .apk file but is designed to be submitted to Google Play, which will generate and sign .apk files for distribution.
  - A JavaScript bundle is a conglomerate of JS application code and dependencies (typically from npm packages) generated by a bundler like Webpack.
    - Like the web, Expo has no concept of bundles.
- **"Standalone build"** is a build you submit to the store (within the production use case).
- **"Bare apps"** refer to React Native.
- **"Custom clients"** refer to development builds.

_A complete list of [Expo related glossary terms](https://docs.expo.dev/more/glossary-of-terms/) is available for further reference._

# Writing API documentation

Writing API documentation accurately and precisely helps developers use our APIs correctly. In the following sections, we discuss the guidelines for properly documenting comments and some formatting tips to take care of when writing API docs.

## General approach

- Properly inline docs into the code using [TSDoc](https://tsdoc.org/)
- Use supported TSDoc and [TypeDoc](https://typedoc.org/guides/doccomments/) annotations:
  - `@return` / `@returns`
  - `@param`
    - Used for adding a description to the method arguments, syntax:
      - `@param [param_name] [description]`
  - `@default`
    - Currently, does not support Markdown formatting, all the content will be placed directly in the `InlineCode` block, so there is no need to wrap the value with ``` manually.
  - `@platform`
    - Available platforms: `android` , `ios` , `web` and `expo` (Expo Go).
    - You can also specify the minimum platform version, range, or add any other comment to the label, for example, `@platform ios 11+`.
    - Currently, specifying multiple platforms (or lists) per one tag is not possible. However, you can include multiple `@platform` tags in the doc block.
  - `@example`
    - Adds the "Example" header and puts content at the bottom of the description block.
  - `@see`
    - Wraps the message in a note/quote block and adds "See:" at the beginning of the message.
    - See section is placed after the main comment content.
  - `@deprecated`
    - Wraps the message in note/quote block and adds "Deprecated" at the beginning of the message automatically. However, a message is not required.
    - The deprecation note will always be placed at the top of the generated doc comment, no matter where you put it in the doc block content.
  - `@internal` / `@private` / `@hidden`
    - Any of those annotations will hide the code and comments from the autogenerated API docs output.
  - `@header`
    - Allows grouping methods by the custom headers, which should be used with `headersMapping` prop for the `APISection` component to control the actual header titles
      and their order (see `expo-notifications` source and doc page for an example usage).
- When linking other SDK packages in a comment, use `./` instead of `../` at the beginning of the URL
  - For more information, check out [detect broken internal links in generated doc comments](https://github.com/expo/expo/pull/16771) PR on GitHub.
- To add a subscript or superscript in the comment content, use the following custom syntax:
  ```markdown
  21^st^ Century <!-- sup -->
  H~2~O <!-- sub -->
  ```

## Accuracy

These are some topics that often come up with Expo development:

### Concurrency and parallelism

Concurrency describes two tasks logically running together. Two concurrent tasks may each start before the other finishes.
Parallelism describes two tasks physically running at the same time. Two network requests or processes running on two CPU cores are examples of parallelism.

It is possible, and very common with JavaScript, to have concurrency without parallelism. Two async functions without external I/O will run concurrently but not in parallel because the JavaScript micro task scheduler will interleave the async functions but run them single-threadedly.

### Promises

- On the receiving side, promises are either fulfilled, rejected, or pending.
- A promise that is fulfilled or rejected (that is, not pending) is settled.
- On the creating side, promises can be resolved to either another promise or a non-promise value.
  - A promise can resolve to a promise: `new Promise(resolve => resolve(anotherPromise))`
  - A promise is never fulfilled with a promise: `await Promise` is never a promise.
- For API documentation, the developer typically wants to know the value with which the promise is fulfilled and does not care about how the promise is resolved.
- Typically write:
  > The returned promise is fulfilled with a `CameraPhoto` object.
  - The developer cares about the value of `await capturePhotoAsync()`.
- Typically, don't write:
  > The returned promise resolves to a `CameraPhoto` object.
  - The developer does not care how the promise returned from `capturePhotoAsync()` is resolved.
- Sometimes write:
  > The returned promise is resolved with the given promise if it settles before the specified timeout.
  - The creator of a promise may call its `resolve` function with another promise. This settles the first promise with the result of the second.

### Additional resources on Promises

- [MDN's documentation on promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [An explanation of "States and Fates" and the difference between resolving and fulfilling](https://github.com/domenic/promises-unwrapping/blob/master/docs/states-and-fates.md)

### URLs and URIs

Unless you have a specific reason to use "URI", use "URL" everywhere. This follows the [WHATWG URL specification's goals](https://url.spec.whatwg.org/#goals).

Standardize on the term URL. URI and IRI are just confusing. In practice, a single algorithm is used for both, so keeping them distinct is not helping anyone. URL also easily wins the search result popularity contest.

### Kilobytes (kB), kibibytes (KiB), and kilobits (kbit, kb)

- A kilobyte, and other SI units for bytes, sometimes refers to 1,000 bytes (kB) and othertimes refers to 1,024 bytes (KB).
- A kibibyte ("kilo binary byte") always refers to 1,024 bytes and is abbreviated as "KiB".
- Most Expo APIs work with powers of two like kibibytes. Write "KiB", "MiB", and "GiB" to communicate clearly to developers. We do not need to explain that a KiB refers to 1,024 bytes.
- Some APIs, especially those related to disk storage and transmission rates like baud rates, use powers of 10. Write "kB", "MB", and "GB" **and** be clear we're referring to 1,000 bytes, 1,000,000 bytes, and so on.
- Typically, write "kbit", "Mbit", and "Gbit" when referring to bits to remove ambiguity between bits and bytes. Both "kbit/s" and "kbps" are acceptable when describing rates.
  Always use a capital "B" for bytes. Write "bit" or a lowercase "b" for bits.
- Insert a space between the number and unit, like "10 MiB".
- Decimal byte units: kB, MB, GB, TB
- Binary byte units: kiB, MiB, GiB, TiB
- Decimal bit units: kbit, Mbit, Gbit, Tbit
- Binary bit units: kibit, Mibit, Gibit, Tibit

### Docblocks

Use `/** ... */` for multiline docblocks that describe functions, methods, classes, and other types. Format them to fit the column width of the file at hand, which is 100 columns for most of our files. The Rewrap (`stkb.rewrap`) VS Code extension makes it easy to reflow most docblocks.

Write descriptions using the third-person declarative instead of the second-person imperative.

- Correct: Resolves the given hostname to its IP address using the device's DNS configuration.
- Incorrect: Resolve the given hostname to its IP address using the device's DNS configuration.

Explain the behavior of functions beyond their parameters and return values. Those are easy to see, but it's less clear what the failure modes, side effects, expected preconditions, and concurrency safety are. Document the parts of the iceberg below the surface.

Write useful descriptions of parameters and fields. Teach the developer something useful. If you don't have anything useful to say, leave out the documentation and put quality over quantity.

```tsx
type CameraResult = {
  // CORRECT:
  /**
   * The width of the captured photo, measured in pixels
   */
  width: number;

  // INCORRECT:
  /**
   * The width
   */
  width: number;

  // ACCEPTABLE BUT WE CAN DO BETTER:
  width: number;

  ...
};

```

Leave off a period if the description of a function, parameter, return value, etc... is just one phrase. Use a period when writing subsequent sentences.

Example:

```tsx
/**
 * Captures a still photo with the camera's current settings and given configuration options. The
 * image will be encoded using the specified format. If the format is not supported by the device,
 * this method throws an error.
 *
 * Upon capturing the photo, it is written to the device's temporary file storage. The file will be
 * accessible right after this method completes but may be cleared by the device OS at an arbitrary
 * time afterward; do not assume the file is permanent.
 *
 * @param options configuration options that specify the file format, image quality, and more
 * @returns a promise fulfilled with information about the captured photo, including its location on
 *   disk
 */
```

---

## References and additional resources

- Learn how to set up the `expo/docs` repository locally and what the requirements are for contributing to the [expo/docs/README.md file](https://github.com/expo/expo/blob/main/docs/README.md).
- On how to structure your document and write headings and page titles, see [Writing headings optimized for search](./Wrtiting%20scannable%20titles%20and%20headings.md)
- **External references**: This guide is by no means exhaustive. It covers the most common things that come up as we write and is mostly focused on Expo-related things. We also refer to other style guides that are exhaustive, well maintained and have become industry standards, such as the [Google developer documentation style guide](https://developers.google.com/style?hl=en).
- General tips on [what words to avoid and during which situations](https://css-tricks.com/words-avoid-educational-writing/) when writing educational material or technical documentation.
