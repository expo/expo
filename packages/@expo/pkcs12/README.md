<!-- Title -->
<h1 align="center">
👋 Welcome to <br><code>@expo/pkcs12</code>
</h1>

<p align="center">PKCS#12 utility functions to extract certificates from conventional and keystore PKCS#12 files.</p>

# Examples

## Extracting a certificate from a conventional PKCS#12 file

```js
const p12 = await parsePKCS12Async(base64EncodedP12, password);
const certificate = getX509Certificate(p12); // extracts single certificate from p12
const sha1Fingerprint = getCertificateFingerprint(certificate, {
  hashAlgorithm: 'sha1',
}); // Hash like 02ec75a7181c575757baa931fe3105b7125ff10a
```

## Extracting a certificate from a keystore in a PKCS#12 file

```js
const p12 = await parsePKCS12Async(base64EncodedP12, password);
const certificate = getCertificateDerByFriendlyName(p12, alias);
if (!certificate) {
  throw new Error('Certificate alias not found');
}
const sha1Fingerprint = getCertificateFingerprint(certificate, {
  hashAlgorithm: 'sha1',
}); // Hash like 02ec75a7181c575757baa931fe3105b7125ff10a
```

`parsePKCS12Async` verifies the password MAC when present and decrypts both safe contents and private-key bags. Containers without a MAC remain supported; they do not provide integrity protection. `null` and empty passwords are equivalent. Parsed results contain frozen certificate entries. Private keys are validated and discarded.

PBES2 uses standard UTF-8 passwords and PRFs first. It also reads Forge's legacy binary-password encoding and its SHA-512/224 derivation labeled with the SHA-224 PRF OID. These fallbacks share the aggregate KDF work limit.

The deprecated `parsePKCS12` function supports existing synchronous callers by running the parser in a separate Node.js process. It blocks the calling process until parsing finishes. Replace `parsePKCS12(...)` with `await parsePKCS12Async(...)` when migrating. Certificate extraction and hashing helpers remain synchronous.

Legacy ciphers such as RC2 use a child Node.js process with `--openssl-legacy-provider` when the current process cannot provide the cipher. This requires a Node.js build with the OpenSSL legacy provider. It does not require an `openssl` executable. Passwords and container bytes travel over stdin rather than command-line arguments.

Certificates use the package-owned `Certificate` compatibility view. It exposes `serialNumber` with its original hexadecimal spelling, `validity.notBefore` and `validity.notAfter`, subject and issuer `attributes` and `getField`, a native `publicKey`, and the original certificate DER as `raw`. `getField` accepts a short name, a long name, or an OID and returns the first matching attribute. Missing fields return `undefined`. Validity dates follow native whole-second precision. Dates, attributes, and DER buffers are copied. Use `certificate.nativeCertificate` for a separate Node.js `X509Certificate`. Forge mutators, signature methods, and big-integer key objects are not provided. Replace explicit Forge certificate annotations with the exported `Certificate` type. `Pkcs12Pfx` describes the immutable certificate result. Certificate helper diagnostics and first matching alias behavior remain supported. Use `getCertificateDerByFriendlyName` for RSA, EC, DSA, and unknown key algorithms.

`getCertificateFingerprint` accepts a certificate view or DER `Buffer`. It preserves existing RSA fingerprints by normalizing omitted outer signature parameters to NULL. For a hash of the original wire encoding, hash the DER returned by `getCertificateDerByFriendlyName` or `certificate.raw` with Node.js crypto.

The ASN.1 and general bag APIs have been removed:

| Removed API                                                 | Replacement                                                    |
| ----------------------------------------------------------- | -------------------------------------------------------------- |
| `getX509Asn1ByFriendlyName` and `Asn1`                      | `getCertificateDerByFriendlyName` returning `Buffer`           |
| `getAsn1Hash`                                               | `getCertificateFingerprint` accepting DER                      |
| `getBags`, `getBag`, `Bag`, and the `Pkcs12Pfx` constructor | Certificate accessor functions and the `Pkcs12Pfx` result type |

This package does not expose private-key extraction or PKCS12 generation APIs.

Parsing rejects containers larger than 16 MiB, ASN.1 structures deeper than 64 levels or with more than 10,000 nodes, safe contents nested more than 16 levels, and individual KDF iteration counts above 1,000,000. A container also has an aggregate budget of 10,000,000 KDF digest rounds. Subprocess parsing has a 30-second timeout.
