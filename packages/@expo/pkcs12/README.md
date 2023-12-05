<!-- Title -->
<h1 align="center">
👋 Welcome to <br><code>@expo/pkcs12</code>
</h1>

<p align="center">PKCS#12 utility functions to extract certificates from conventional and keystore PKCS#12 files
.</p>

<p align="center">
  <img src="https://flat.badgen.net/packagephobia/install/@expo/pkcs12">

  <a href="https://www.npmjs.com/package/@expo/pkcs12">
    <img src="https://flat.badgen.net/npm/dw/@expo/pkcs12" target="_blank" />
  </a>
</p>

<!-- Body -->

# Examples

## Extracting a certificate from a conventional PKCS#12 file

```js
const p12 = parsePKCS12(base64EncodedP12, password); // deserializes encodedP12
const certificate = getX509Certificate(p12); // extracts single certificate from p12
const sha1Fingerprint = getCertificateFingerprint(certificate, {
  hashAlgorithm: 'sha1',
}); // Hash like 02ec75a7181c575757baa931fe3105b7125ff10a
```

## Extracting a certificate from a keystore in a PKCS#12 file

```js
const p12 = parsePKCS12(base64EncodedP12, password); // deserializes encodedP12
const certificate = getX509CertificateByFriendlyName(p12, alias); // extracts single certificate stored under alias in p12
const sha1Fingerprint = getCertificateFingerprint(certificate, {
  hashAlgorithm: 'sha1',
}); // Hash like 02ec75a7181c575757baa931fe3105b7125ff10a
```
