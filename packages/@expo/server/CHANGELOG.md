# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Add Bun adapter to expo server runtime. ([#38240](https://github.com/expo/expo/pull/38240) by [@daavidaviid](https://github.com/daavidaviid))
- Allow running server middleware with `+middleware.ts` ([#38330](https://github.com/expo/expo/pull/38330) by [@hassankhan](https://github.com/hassankhan))
- Add `workerd` adapter. ([#38531](https://github.com/expo/expo/pull/38531) by [@krystofwoldrich](https://github.com/krystofwoldrich))
- Add `mjs` build files. ([#38717](https://github.com/expo/expo/pull/38717) by [@krystofwoldrich](https://github.com/krystofwoldrich))

### 🐛 Bug fixes

- Fix Vercel adapter POST requests timeouts. Revert `Readable.toWeb` conversion back to `createReadableStreamFromReadable` from `remix-run/node`. ([#38603](https://github.com/expo/expo/pull/38603) by [@krystofwoldrich](https://github.com/krystofwoldrich))

### 💡 Others

- Bump Express types to `@types/express@5`. ([#37635](https://github.com/expo/expo/pull/37635) by [@byCedric](https://github.com/byCedric))
- Sync development and self host server behavior with EAS Hosting ([#38465](https://github.com/expo/expo/pull/38465) by [@krystofwoldrich](https://github.com/krystofwoldrich))

## 0.6.3 - 2025-06-18

### 💡 Others

- Remove "Please" from warnings and errors ([#36862](https://github.com/expo/expo/pull/36862) by [@brentvatne](https://github.com/brentvatne))
- Update dynamic name matching to be in line with `expo-router` changes ([#36961](https://github.com/expo/expo/pull/36961) by [@kitten](https://github.com/kitten))

## 0.6.2 — 2025-04-11

_This version does not introduce any user-facing changes._

## 0.6.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 0.6.0 — 2025-04-04

### 🎉 New features

- Expo Router static redirects ([#34734](https://github.com/expo/expo/pull/34734) by [@marklawlor](https://github.com/marklawlor))

## 0.5.2 - 2025-03-11

### 💡 Others

- Replace `@remix-run/node` with `undici` / Node.js native Fetch polyfills. ([#34589](https://github.com/expo/expo/pull/34589) by [@kitten](https://github.com/kitten))

## 0.5.1 - 2025-01-19

### 🐛 Bug fixes

- Handle server 404 better. ([#34211](https://github.com/expo/expo/pull/34211) by [@EvanBacon](https://github.com/EvanBacon))
- Throw server function errors in production. ([#33971](https://github.com/expo/expo/pull/33971) by [@EvanBacon](https://github.com/EvanBacon))

## 0.5.0 — 2024-11-11

_This version does not introduce any user-facing changes._

## 0.5.0-preview.1 — 2024-11-05

### 🎉 New features

- Add `expo-router/rsc/headers` for accessing request headers in server components. ([#32099](https://github.com/expo/expo/pull/32099) by [@EvanBacon](https://github.com/EvanBacon))

## 0.5.0-preview.0 — 2024-10-22

### 🎉 New features

- Add experimental support for React Server Actions in Expo Router. ([#31959](https://github.com/expo/expo/pull/31959) by [@EvanBacon](https://github.com/EvanBacon))
- Format API route execution errors in development. ([#31485](https://github.com/expo/expo/pull/31485) by [@EvanBacon](https://github.com/EvanBacon))
- Added production exports for experimental server renderer. ([#30850](https://github.com/expo/expo/pull/30850) by [@EvanBacon](https://github.com/EvanBacon))
- Add experimental support for server rendering middleware wrapper in development. ([#30334](https://github.com/expo/expo/pull/30334) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix search params in RSC. ([#31641](https://github.com/expo/expo/pull/31641) by [@EvanBacon](https://github.com/EvanBacon))
- Prevent RSC errors from crashing server. ([#31019](https://github.com/expo/expo/pull/31019) by [@EvanBacon](https://github.com/EvanBacon))
- Fix the Vercel adapter's `writeHead` call in the `respond` helper failing to pass raw headers ([#29616](https://github.com/expo/expo/pull/29616) by [@kitten](https://github.com/kitten))

### 💡 Others

- Support RSC only being hosted at platform subpaths. ([#30875](https://github.com/expo/expo/pull/30875) by [@EvanBacon](https://github.com/EvanBacon))
- Reduce side-effects and imports. ([#29647](https://github.com/expo/expo/pull/29647) by [@EvanBacon](https://github.com/EvanBacon))
- Upgrade to `@remix-run/node@2.10.0` and enable undici globals. ([#30070](https://github.com/expo/expo/pull/30070) by [@byCedric](https://github.com/byCedric))

## 0.4.4 - 2024-07-11

### 🐛 Bug fixes

- Fix support for `.cjs` API route files ([#30205](https://github.com/expo/expo/pull/30205) by [@bradleyayers](https://github.com/bradleyayers))

## 0.4.3 - 2024-06-10

### 🎉 New features

- Add assertions for `NODE_OPTIONS` and Node.js versions. ([#29155](https://github.com/expo/expo/pull/29155) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix `ExpoResponse` using incorrect object. ([#29154](https://github.com/expo/expo/pull/29154) by [@EvanBacon](https://github.com/EvanBacon))

## 0.4.2 — 2024-04-23

_This version does not introduce any user-facing changes._

## 0.4.1 — 2024-04-22

### 🐛 Bug fixes

- Fix 404 when serving routes using `[value]/index` pattern. ([#28348](https://github.com/expo/expo/pull/28348) by [@byCedric](https://github.com/byCedric))

## 0.4.0 — 2024-04-18

### 🛠 Breaking changes

- Update Node polyfills, removing `ExpoResponse` and `ExpoRequest` globals in the process. ([#27261](https://github.com/expo/expo/pull/27261) by [@kitten](https://github.com/kitten))

### 🐛 Bug fixes

- Fix using array syntax `(a,b)` with server output. ([#27462](https://github.com/expo/expo/pull/27462) by [@EvanBacon](https://github.com/EvanBacon))
- Fix issue with `duplex` streams not being properly handled. ([#27436](https://github.com/expo/expo/pull/27436) by [@EvanBacon](https://github.com/EvanBacon))
- Throw "method not found" when an API route has no exports. ([#27024](https://github.com/expo/expo/pull/27024) by [@EvanBacon](https://github.com/EvanBacon))

## 0.3.1 - 2024-02-01

### 🐛 Bug fixes

- Fix http server not properly handling headers with multiple values like Set-Cookie. ([#26652](https://github.com/expo/expo/pull/26652) by [@hdwatts](https://github.com/hdwatts))

## 0.3.0 — 2023-12-12

### 🎉 New features

- Add Vercel adapter. ([#25539](https://github.com/expo/expo/pull/25539) by [@kitten](https://github.com/kitten))

## 0.2.0 — 2023-10-17

### 🎉 New features

- Use `file` in manifest to support loading mjs/cjs API routes. ([#24739](https://github.com/expo/expo/pull/24739) by [@EvanBacon](https://github.com/EvanBacon))
- Add Netlify adapter. ([#24510](https://github.com/expo/expo/pull/24510) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Transpile for Node 18 (LTS). ([#24471](https://github.com/expo/expo/pull/24471) by [@EvanBacon](https://github.com/EvanBacon))

## 0.1.0 — 2023-09-15

_This version does not introduce any user-facing changes._
