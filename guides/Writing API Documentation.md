# Writing API documentation

The quality of the Expo docs reflects on the quality of the overall project. Just as we take care to structure our code well, avoid sloppiness, and be consistent, we also need to write well and with care. This guide covers our expectations for documentation and some guidance for writing in a way that's consistent with the rest of the project.

## We (the authors) are responsible for what we write

Like code reviews, the author is responsible for their work. The reviewer will help provide a second opinion and catch oversights, but the reviewer is not the person primarily responsible for the quality of your writing: you are.

## Care

Developers can tell from our writing when we care and when we don't. We'll sometimes have mistakes and will fix them up, but it will come across to readers that we put care and thought into our writing. In turn, this evokes the sense that we put similar care into our code and services.

## Grammar

This starts with objectively correct writing. Developers reading the Expo docs shouldn't find obvious mistakes and come away feeling less confident in Expo. Write with correct grammar, punctuation, and spelling. These are a few grammar-related points that we historically could have improved:

- Use double quotes in prose.
  - Write:
    > Set the field named "id" to your project's ID.
  - Don't write:
    > Set the field named 'id' to your project's ID.
- Use em dashes (—), semicolons, or colons rather than commas to split phrases that read as separate sentences.
  - Write:
    > JavaScript has come a long way; it was originally written in 10 days.
  - Don't write:
    > JavaScript has come a long way, it was originally written in 10 days.
- Use the Oxford comma.

These aren't the only points to consider; we're looking to be fully grammatically correct.

## Spelling and wording

We use American English like other relevant documentation including the W3C and WHATWG HTML specifications, Apple's iOS documentation, and Google's Android documentation.

Some words have multiple legitimate ways to spell them. One of the most notorious examples in the Expo codebase is "canceled" vs. "cancelled". We tend to write "cancellation" instead of "cancelation" but are undecided between "canceled" and "cancelled". (This isn't just a problem for Expo; even the TC39 proposal for JS cancellation tokens is inconsistent!) Prefer "canceled" and "canceling".

Write out words instead of abbreviating them, unless the abbreviations are ubiquitous. For example, write out "parameter" and "configuration" instead of using "param" and "config", and use abbreviations like "HTML", "API", "laser", and "mutex".

Succinctness > verbosity > ambiguity.

Properly capitalize "Git", "GitHub", "JavaScript", "macOS", "Node", and "Yarn". Properly lowercase "npm".

## Technical accuracy and precision

Writing our documentation to be accurate and precise helps developers use our APIs correctly. This is especially true when developers are knowledgeable about the topics at hand and inaccurate documentation could mislead them.

Teaching or explaining a concept usually requires understanding it well. We need to have clarity of mind and a correct understanding of various programming concepts to write good documentation.

These are some topics that often come up with Expo development:

### Concurrency and parallelism

- Concurrency describes two tasks logically running together. Two concurrent tasks may each start before the other finishes.
- Parallelism describes two tasks physically running at the same time. Two network requests or processes running on two CPU cores are examples of parallelism.
- It is possible, and very common with JavaScript, to have concurrency without parallelism. Two async functions without external I/O will run concurrently but not in parallel because the JavaScript microtask scheduler will interleave the async functions but run them single-threadedly.

### Promises

- On the receiving side, promises are either fulfilled, rejected, or pending.
- A promise that is fulfilled or rejected (that is, not pending) is settled.
- On the creating side, promises can be resolved to either another promise or a non-promise value.
  - A promise can resolve to a promise: `new Promise(resolve => resolve(anotherPromise))`
  - A promise is never fulfilled with a promise: `await aPromise` is never a promise.
- For API documentation, the developer typically wants to know the value with which the promise is fulfilled and does not care about how the promise is resolved.
- Typically write:
    > The returned promise is fulfilled with a `CameraPhoto` object.
  - The developer cares about the value of `await capturePhotoAsync()`.
- Typically don't write:
    > The returned promise resolves to a `CameraPhoto` object.
  - The developer does not care about how the promise returned from `capturePhotoAsync()` is resolved.
- Sometimes write:
    > The returned promise is resolved with the given promise if it settles before the specified timeout.
  - The creator of a promise may call its `resolve` function with another promise. This settles the first promise with the result of the second.
- [MDN's documentation on promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [An explanation of "States and Fates" and the difference between resolving and fulfilling](https://github.com/domenic/promises-unwrapping/blob/master/docs/states-and-fates.md)

### URLs and URIs

- Unless you have a specific reason to use "URI", use "URL" everywhere. This follows the [WHATWG URL specification's goals](https://url.spec.whatwg.org/#goals).
- "Standardize on the term URL. URI and IRI are just confusing. In practice a single algorithm is used for both so keeping them distinct is not helping anyone. URL also easily wins the search result popularity contest."

### Kilobytes (kB), kibibytes (KiB), and kilobits (kbit, kb)

- A kilobyte, and other SI units for bytes, sometimes refers to 1,000 bytes (kB) and othertimes refers to 1,024 bytes (KB).
- A kibibyte ("kilo binary byte") always refers to 1,024 bytes and is abbreviated as "KiB".
- Most Expo APIs work with powers of two like kibibytes. Write "KiB", "MiB", and "GiB" to communicate clearly to developers. We do not need to explain that a KiB refers to 1,024 bytes.
- Some APIs, especially those related to disk storage and transmission rates like baud rates, use powers of 10. Write "kB", "MB", and "GB" **and** be clear we're referring to 1,000 bytes, 1,000,000 bytes, and so on.
- Typically write "kbit", "Mbit", and "Gbit" when referring to bits to remove ambiguity between bits and bytes. When describing rates, both "kbit/s" and "kbps" are acceptable.
- Always use a capital "B" for bytes. Write "bit" or a lowercase "b" for bits.
- Insert a space between the number and unit, like "10 MiB".
- Decimal byte units: kB, MB, GB, TB
- Binary byte units: kiB, MiB, GiB, TiB
- Decimal bit units: kbit, Mbit, Gbit, Tbit
- Binary bit units: kibit, Mibit, Gibit, Tibit

## Docblocks

Use `/** ... */` for multiline docblocks that describe functions, methods, classes, and other types.

Format them to fit the column width of the file at hand, which is 100 columns for most of our files. The Rewrap (`stkb.rewrap`) VS Code extension makes it easy to reflow most docblocks.

Write descriptions using the third-person declarative instead of second-person imperative.

Write:
> Resolves the given hostname to its IP address using the device's DNS configuration.

Don't write:
> Resolve the given hostname to its IP address using the device's DNS configuration.

Explain the behavior of functions beyond their parameters and return values. Those are easy to see, but it's less clear what the failure modes, side effects, expected preconditions, and concurrency safety are. Document the parts of the iceberg below the surface.

Write useful descriptions of parameters and fields. Teach the developer something useful. If you don't have anything useful to say, leave out the documentation and put quality over quantity.

```ts
type CameraResult = {
  // WRITE:
  /**
   * The width of the captured photo, measured in pixels
   */
  width: number;

  // DON'T WRITE:
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

```ts
/**
 * Captures a still photo with the camera's current settings and given configuration options. The
 * image will be encoded using the specified format. If the format is not supported by the device,
 * this method throws an error.
 *
 * Upon capturing the photo, it is written to the device's temporary file storage. The file will be
 * accessible right after this method completes but may be cleared by the device OS at an arbitrary
 * time afterwards; do not assume the file is permanent.
 *
 * @param options configuration options that specify the file format, image quality, and more
 * @returns a promise fulfilled with information about the captured photo, including its location on
 *   disk
 */
```
