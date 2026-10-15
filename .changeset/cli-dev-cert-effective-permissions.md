---
'@expo/cli': patch
---

Request a development code signing certificate only when the credentials used for the request have the `RUN` permission on the account that owns the project. A user with the Runner role can now get a certificate. A scoped access token or session without `RUN` no longer requests a certificate.
