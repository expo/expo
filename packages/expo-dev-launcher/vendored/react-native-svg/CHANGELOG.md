# [12.1.0](https://github.com/react-native-community/react-native-svg/compare/v12.0.3...v12.1.0) (2020-04-09)


### Bug Fixes

* **web:** improve react-native-web version compatibility ([88953c3](https://github.com/react-native-community/react-native-svg/commit/88953c3f296e2ff3a201a53626e32b7cc4f6abcc))


### Features

* implement WithLocalSvg ([e66e87a](https://github.com/react-native-community/react-native-svg/commit/e66e87a5b5c090509d5e2127237963f83e60f1e9))
* Support local .svg files, fixes [#1306](https://github.com/react-native-community/react-native-svg/issues/1306) ([4e9e8b5](https://github.com/react-native-community/react-native-svg/commit/4e9e8b58b21d317cfc98c0a34ec5fb0bea5ae2ee))
* **svgUri:** add onError prop to SvgUri/Xml/Ast ([3c32a6f](https://github.com/react-native-community/react-native-svg/commit/3c32a6fdd580dea53ecc271288155117ce040b55))

## [12.0.3](https://github.com/react-native-community/react-native-svg/compare/v12.0.2...v12.0.3) (2020-03-08)


### Bug Fixes

* **android:** default cap, join and handling of null matrix ([df4ff9c](https://github.com/react-native-community/react-native-svg/commit/df4ff9caa7cedfabcbb8e470977ad92db3773830))
* **ios:** [#1290](https://github.com/react-native-community/react-native-svg/issues/1290) pointerEvents="none" gesture handling ([11d14fd](https://github.com/react-native-community/react-native-svg/commit/11d14fd3998152f7af9a5e103e349542f7be213d))
* [#1290](https://github.com/react-native-community/react-native-svg/issues/1290) pointerEvents="none" ([bd78998](https://github.com/react-native-community/react-native-svg/commit/bd78998a2bc7a028c3dbca26d36b2bb1753d31e2))

## [12.0.2](https://github.com/react-native-community/react-native-svg/compare/v12.0.1...v12.0.2) (2020-03-05)


### Bug Fixes

* [#1262](https://github.com/react-native-community/react-native-svg/issues/1262) support single dimension + aspectRatio syntax ([b2f7605](https://github.com/react-native-community/react-native-svg/commit/b2f76058550a542ef500b71b41f81f410fc9d1e4))

## [12.0.1](https://github.com/react-native-community/react-native-svg/compare/v12.0.0...v12.0.1) (2020-03-05)


### Bug Fixes

* [#1262](https://github.com/react-native-community/react-native-svg/issues/1262) allow setting width and height using stylesheet ([c5374b2](https://github.com/react-native-community/react-native-svg/commit/c5374b297e6145aa529ea2a51fe1ca6db61a3f0a))
* react-native 0.59 compat ([c4dba22](https://github.com/react-native-community/react-native-svg/commit/c4dba222a3d53d4222127d4877078977475de400))

# [12.0.0](https://github.com/react-native-community/react-native-svg/compare/v11.0.1...v12.0.0) (2020-03-04)


* fix!: #1262 default width and height on svg ([1d6798b](https://github.com/react-native-community/react-native-svg/commit/1d6798b08ff578cd9f7b5963fbf4d44bf4225a4e)), closes [#1262](https://github.com/react-native-community/react-native-svg/issues/1262)
* fix!: #1247 Animated view translation inside Svg tag ([0288d95](https://github.com/react-native-community/react-native-svg/commit/0288d95e7b5d6c9b4fb93f320f5787ca2dbd1599)), closes [#1247](https://github.com/react-native-community/react-native-svg/issues/1247) [#1258](https://github.com/react-native-community/react-native-svg/issues/1258)


### Bug Fixes

* **ios:** handle gradient and pattern transform when null ([715e9b8](https://github.com/react-native-community/react-native-svg/commit/715e9b82a89d813443c1e302d0339b446fc2707d))
* **ios:** pod install error ([675df92](https://github.com/react-native-community/react-native-svg/commit/675df924072223cb92b9f70e183755c4ac665f8a))
* **web:** [#1274](https://github.com/react-native-community/react-native-svg/issues/1274) Unable to build using babel-plugin-react-native-web ([80b5064](https://github.com/react-native-community/react-native-svg/commit/80b506415447d22962764700bd42a1b7a8597f6f))
* removed missing unnecessary React headers import error caused by non-framework style import ([f795029](https://github.com/react-native-community/react-native-svg/commit/f795029c2a21ce65279dc2dc3f090b46c3a6c08a))


### Performance Improvements

* optimize extraction of fill, stroke, responder, matrix & display ([279c3fc](https://github.com/react-native-community/react-native-svg/commit/279c3fcf84540ba12b18dd2056e3189af75c29b4))
* optimize handling of font properties in G elements ([0fa4177](https://github.com/react-native-community/react-native-svg/commit/0fa4177ed7e2e1ecacd729d92305c5406b767d4f))
* optimize handling of inherited styles ([363c1b4](https://github.com/react-native-community/react-native-svg/commit/363c1b491ff035b5f4c2666f7cacd6665029d2a8))
* optimize svg root prop handling, simplify element development ([f0cd11d](https://github.com/react-native-community/react-native-svg/commit/f0cd11d6f6cfc993bfb384866ce9b26efc918b58))


### BREAKING CHANGES

* default size might change if width or height is missing
* Behavior of native elements is reverted to pre v10

## [11.0.1](https://github.com/react-native-community/react-native-svg/compare/v11.0.0...v11.0.1) (2020-01-18)


### Bug Fixes

* snapshot ([a37afcb](https://github.com/react-native-community/react-native-svg/commit/a37afcb485b8804dbc212195bc5695738a3634f7))


### Performance Improvements

* optimize passing of colors to native ([f138c9b](https://github.com/react-native-community/react-native-svg/commit/f138c9b1aba568ac3ac0c272af1d62811519f526))

# [11.0.0](https://github.com/react-native-community/react-native-svg/compare/v10.1.0...v11.0.0) (2020-01-18)


### Bug Fixes

* compatibility with reanimated color, fixes [#1241](https://github.com/react-native-community/react-native-svg/issues/1241) ([4983766](https://github.com/react-native-community/react-native-svg/commit/498376678ea098eea9380f98b0e8eddd267b2fd1))
* **android:** NullPointerException when calling getBBox [#1215](https://github.com/react-native-community/react-native-svg/issues/1215) ([3eb82a9](https://github.com/react-native-community/react-native-svg/commit/3eb82a91b46264e98c168b99f9ffbb08cd560b05))
* **android:** support animating stroke color ([c5dd62f](https://github.com/react-native-community/react-native-svg/commit/c5dd62f47b3e9dfa538a94d78958966bfcfc1d0f))
* **android:** support setting path null ([2d34734](https://github.com/react-native-community/react-native-svg/commit/2d347347a32601ae680c4e7f91dc8846df52e65a))
* **ios:** iOS 10.3 renders opaque background when drawRect is defined ([61bc9bd](https://github.com/react-native-community/react-native-svg/commit/61bc9bd2cb6686edd6661e80429c65e8a6187cd7)), closes [#1252](https://github.com/react-native-community/react-native-svg/issues/1252)
* **web:** Allow createElement & unstable_createElement usage ([#1240](https://github.com/react-native-community/react-native-svg/issues/1240)) ([7a23968](https://github.com/react-native-community/react-native-svg/commit/7a23968f3db1772ae0c16330a382f3ec750a4945))


* fix(android)!: pivot point for RN transform array syntax ([db682f8](https://github.com/react-native-community/react-native-svg/commit/db682f87bc8c89f1cf72c7fcdcb4970041679214))


### BREAKING CHANGES

* Makes android specific transform origin adjustments
 unnecessary / broken. Renders exactly the same as web and ios instead.

# [10.1.0](https://github.com/react-native-community/react-native-svg/compare/v10.0.0...v10.1.0) (2020-01-12)


### Bug Fixes

* **android:** improve handling of native ancestors ([89f4432](https://github.com/react-native-community/react-native-svg/commit/89f443236eb1be9704c4475857e5623ad539936a))
* **ios:** compile warning ([e59c0fb](https://github.com/react-native-community/react-native-svg/commit/e59c0fb9c01623a8ceb2abd0a8f7fd0446002c8f))
* **ios:** initial render foreignObject / re-render on mount of sub views ([d549698](https://github.com/react-native-community/react-native-svg/commit/d54969846d28f57597baca33a653a88abc9a4dbf))
* **ios:** invalidate G / foreignObject on change in native children ([65cee78](https://github.com/react-native-community/react-native-svg/commit/65cee78a33024ba7112821ed656eac3014ed234d))
* foreignObject clipping and transform ([85e7943](https://github.com/react-native-community/react-native-svg/commit/85e7943448621f0d96adea89f89127ad07eadba6))


### Features

* ForeignObject documentation ([529b3bf](https://github.com/react-native-community/react-native-svg/commit/529b3bfaa0c2024fd7f66c8e635b46ec159d4f5e))

# [10.0.0](https://github.com/react-native-community/react-native-svg/compare/v9.14.0...v10.0.0) (2020-01-04)


* feat!: Masks now support native elements ([966881a](https://github.com/react-native-community/react-native-svg/commit/966881a67d302e4418ad302465aa4a6f9a7a2e8a))


### BREAKING CHANGES

* If you had native elements inside any Svg root before,
Then your content might change appearance when upgrading,
as e.g. transforms and masks now take effect.

# [9.14.0](https://github.com/react-native-community/react-native-svg/compare/v9.13.6...v9.14.0) (2020-01-04)


### Bug Fixes

* **android:** correct values for measureInWindow, fixes [#1231](https://github.com/react-native-community/react-native-svg/issues/1231) ([3bf07f8](https://github.com/react-native-community/react-native-svg/commit/3bf07f808554a80d09a3b40bc355715fe0bc0eea))
* **android:** elements not touchable if below opacity limit ([ebc7220](https://github.com/react-native-community/react-native-svg/commit/ebc7220f4d464d4a2e9306c9f18580ac9c2a1494)), closes [#1200](https://github.com/react-native-community/react-native-svg/issues/1200)
* **android:** fix radial gradient vertical center offset scaling ([d5bddd5](https://github.com/react-native-community/react-native-svg/commit/d5bddd5e2d45cea48de9410a3d5998ffb9049a32))
* **ios:** crash when offset is outside range [#1201](https://github.com/react-native-community/react-native-svg/issues/1201) ([a2ef51f](https://github.com/react-native-community/react-native-svg/commit/a2ef51fdfafae1bfb71879b477e6eef02cd1655d))
* **web:** fix gesture responder dimensions measurement ([36c20b3](https://github.com/react-native-community/react-native-svg/commit/36c20b3763fe4beb8d0ec2fa1ea54085f5131fc5))
* extraction of clip rule, fixes [#1233](https://github.com/react-native-community/react-native-svg/issues/1233) ([f93bdde](https://github.com/react-native-community/react-native-svg/commit/f93bdde26fd96944e20bb84fbcf3d4f9fd58eda3))
* Text color doesn't work with inlineSize [#1225](https://github.com/react-native-community/react-native-svg/issues/1225) ([027b8c1](https://github.com/react-native-community/react-native-svg/commit/027b8c16aa99267467b5aef0fcfd1aa8c2c8582a))


### Features

* **android:** support using other native views in e.g. masks ([15b4ac6](https://github.com/react-native-community/react-native-svg/commit/15b4ac63b93ac3f6b682de0f03f1822d90bcad34))
* **ios:** support using other native views in e.g. masks ([518a3b1](https://github.com/react-native-community/react-native-svg/commit/518a3b18360a9d04939e244db7f6b6d95e628d2e))
* **web:** Implement support for event, touch & responder handlers ([60561ec](https://github.com/react-native-community/react-native-svg/commit/60561ec38d4eab0cc39ae9106bd166651e6d2252))
* **web:** Optimize: only set responders if press handler exists ([23250ad](https://github.com/react-native-community/react-native-svg/commit/23250ad30af79e2f2b3a3bead52b0a02cdc72b09))
* Implement display="none" ([3e3ad13](https://github.com/react-native-community/react-native-svg/commit/3e3ad13b65ed70f606f6826947cbcfb4f7ce2c4b)), closes [#1220](https://github.com/react-native-community/react-native-svg/issues/1220)

## [9.13.6](https://github.com/react-native-community/react-native-svg/compare/v9.13.5...v9.13.6) (2019-12-10)


### Bug Fixes

* **android:** better npm ignores ([7bc717b](https://github.com/react-native-community/react-native-svg/commit/7bc717bfd533041e2a2dcd06f0c403a90b2bc138))

## [9.13.5](https://github.com/react-native-community/react-native-svg/compare/v9.13.4...v9.13.5) (2019-12-09)


### Bug Fixes

* **android:** deprecation warning in TSpanView ([6035d2d](https://github.com/react-native-community/react-native-svg/commit/6035d2df137be94c144135ede1e8f70934e1439a))

## [9.13.4](https://github.com/react-native-community/react-native-svg/compare/v9.13.3...v9.13.4) (2019-12-09)


### Bug Fixes

* initialize PathView with empty path ([45192bd](https://github.com/react-native-community/react-native-svg/commit/45192bd0864198ffe2573f404974fc3d17a2ec93))
* **ios:** Fix image size when calling getDataURL with bounds. fixes [#855](https://github.com/react-native-community/react-native-svg/issues/855) ([45b0859](https://github.com/react-native-community/react-native-svg/commit/45b0859b7f4fa0ee8c515b4e11f136ed3783c2e6))

## [9.13.3](https://github.com/react-native-community/react-native-svg/compare/v9.13.2...v9.13.3) (2019-10-25)


### Bug Fixes

* **android:** Image onPress [#1170](https://github.com/react-native-community/react-native-svg/issues/1170) ([5c967b7](https://github.com/react-native-community/react-native-svg/commit/5c967b7c6992246ebd602e9a86d2544f0662ce10))

## [9.13.2](https://github.com/react-native-community/react-native-svg/compare/v9.13.1...v9.13.2) (2019-10-23)


### Bug Fixes

* make css-select and css-tree dependencies instead of peers ([957914d](https://github.com/react-native-community/react-native-svg/commit/957914d59b27e22121d13f13cb54a051b893b446)), closes [#1166](https://github.com/react-native-community/react-native-svg/issues/1166)

## [9.13.1](https://github.com/react-native-community/react-native-svg/compare/v9.13.0...v9.13.1) (2019-10-23)


### Bug Fixes

* update flow types ([a50a856](https://github.com/react-native-community/react-native-svg/commit/a50a85671ea94e616eff761346875701f95d90ec))

# [9.13.0](https://github.com/react-native-community/react-native-svg/compare/v9.12.0...v9.13.0) (2019-10-23)


### Bug Fixes

* camelCase css from style elements ([9ee5a28](https://github.com/react-native-community/react-native-svg/commit/9ee5a28b37edf403c503aed4f37edbaebe201eb0))
* don't overwrite inline styles when inlining style elements ([6e1d825](https://github.com/react-native-community/react-native-svg/commit/6e1d8257a4b42b9888a6374ae203f07a932ca96f))
* handle basic css media query selectors ([168ee25](https://github.com/react-native-community/react-native-svg/commit/168ee25ee4b193d85757e01b20840baf54872cfc))
* handle style elements with CDATA ([b3fca84](https://github.com/react-native-community/react-native-svg/commit/b3fca84fb1b9091246310270d64dcef730ee05a9))
* improve style element inlining, support more selectors and optimize ([8c9de72](https://github.com/react-native-community/react-native-svg/commit/8c9de72bda2a4e00efb1747f7c8e922fac92e194))
* improve types for extractTransform ([a37ebbb](https://github.com/react-native-community/react-native-svg/commit/a37ebbbb1559b337b58327f79819c494029597fa))
* only compute selector specificity once per selector ([9f53e31](https://github.com/react-native-community/react-native-svg/commit/9f53e31b24c940052a8d25671f92074194856f05))
* types for css support ([c969159](https://github.com/react-native-community/react-native-svg/commit/c96915923e784607b14b7f437ae4dd58c31bde36))
* use correct import in test ([a57963e](https://github.com/react-native-community/react-native-svg/commit/a57963eb4d3ec0c1645bf4251cf2b54507441532))


### Features

* implement experiment to inline css from style elements ([5f3852b](https://github.com/react-native-community/react-native-svg/commit/5f3852bf9cb41e79d50a4fcb800fdd7ba895f023))
* implement SvgWithCss and SvgWithCssUri with Animated support ([6fb8dd5](https://github.com/react-native-community/react-native-svg/commit/6fb8dd53dba5af19ffc8f686a6310182fca87fd3))

# [9.12.0](https://github.com/react-native-community/react-native-svg/compare/v9.11.1...v9.12.0) (2019-10-19)


### Bug Fixes

* handle setting transform attribute on clipPath, fixes [#1152](https://github.com/react-native-community/react-native-svg/issues/1152) ([73b21d1](https://github.com/react-native-community/react-native-svg/commit/73b21d1))
* improve handling of transform attribute on clipPath, fixes [#1152](https://github.com/react-native-community/react-native-svg/issues/1152) ([3aa126e](https://github.com/react-native-community/react-native-svg/commit/3aa126e))
* **ios:** backwards compatible RCTImageLoader.h handling fixes [#1141](https://github.com/react-native-community/react-native-svg/issues/1141) ([3c22c97](https://github.com/react-native-community/react-native-svg/commit/3c22c97))
* **ios:** clipPath rendering, fixes [#1131](https://github.com/react-native-community/react-native-svg/issues/1131) ([2534537](https://github.com/react-native-community/react-native-svg/commit/2534537))
* **ios:** deprecation of RCTImageLoader fixes [#1141](https://github.com/react-native-community/react-native-svg/issues/1141) ([5452144](https://github.com/react-native-community/react-native-svg/commit/5452144))
* **ios:** fix changes in color/currentColor/tintColor, fixes [#1151](https://github.com/react-native-community/react-native-svg/issues/1151) ([0c7e94d](https://github.com/react-native-community/react-native-svg/commit/0c7e94d))
* **ios:** image viewBox opposite handling of y alignment, fixes [#1138](https://github.com/react-native-community/react-native-svg/issues/1138) ([c69e9e2](https://github.com/react-native-community/react-native-svg/commit/c69e9e2))
* **js:** allow setting stopColor/Opacity/Offset using styles, fix [#1153](https://github.com/react-native-community/react-native-svg/issues/1153) ([5984e06](https://github.com/react-native-community/react-native-svg/commit/5984e06))
* getPointAtLength signature ([2c57af2](https://github.com/react-native-community/react-native-svg/commit/2c57af2))
* getScreenCTM calculation ([5c5072d](https://github.com/react-native-community/react-native-svg/commit/5c5072d))
* improve native method spec conformance ([c63f9e2](https://github.com/react-native-community/react-native-svg/commit/c63f9e2))
* improve types for getBBox ([cecde7d](https://github.com/react-native-community/react-native-svg/commit/cecde7d))
* prepare script ([9a3dc4e](https://github.com/react-native-community/react-native-svg/commit/9a3dc4e))
* **ios:** memory leak in tspan, fixes [#1073](https://github.com/react-native-community/react-native-svg/issues/1073) ([974f3a8](https://github.com/react-native-community/react-native-svg/commit/974f3a8))
* fix native methods spec conformance ([ecedb21](https://github.com/react-native-community/react-native-svg/commit/ecedb21))
* Make native methods synchronous ([8ce7611](https://github.com/react-native-community/react-native-svg/commit/8ce7611))
* refine types for matrix helpers ([409af91](https://github.com/react-native-community/react-native-svg/commit/409af91))
* refine types for matrix helpers ([7a3f867](https://github.com/react-native-community/react-native-svg/commit/7a3f867))
* **android:** defineMarker/getDefinedMarker storage ([e6eda84](https://github.com/react-native-community/react-native-svg/commit/e6eda84))
* **android:** native method scaling and getScreenCTM offset ([f3e0b19](https://github.com/react-native-community/react-native-svg/commit/f3e0b19))
* native method signatures web compatibility / spec conformance ([8687a3d](https://github.com/react-native-community/react-native-svg/commit/8687a3d))
* **ios:** optimize extractPathData, clear PathMeasure when no textPath ([df69c26](https://github.com/react-native-community/react-native-svg/commit/df69c26))


### Features

* **flow:** add flowgen to generate flow types from typescript, [#1125](https://github.com/react-native-community/react-native-svg/issues/1125) ([fcd66fb](https://github.com/react-native-community/react-native-svg/commit/fcd66fb))
* implement getBBox, getCTM, getScreenCTM ([f13d54a](https://github.com/react-native-community/react-native-svg/commit/f13d54a))
* implement isPointInStroke ([2ba64df](https://github.com/react-native-community/react-native-svg/commit/2ba64df))
* initial implementation of isPointInFill ([203e53b](https://github.com/react-native-community/react-native-svg/commit/203e53b))
* support using native methods using promises instead of callbacks ([c28499b](https://github.com/react-native-community/react-native-svg/commit/c28499b))
* **android:** implement getTotalLength and getPointAtLength ([cd667d0](https://github.com/react-native-community/react-native-svg/commit/cd667d0))
* **ios:** implement getTotalLength and getPointAtLength ([78c4f20](https://github.com/react-native-community/react-native-svg/commit/78c4f20))

## [9.11.1](https://github.com/react-native-community/react-native-svg/compare/v9.11.0...v9.11.1) (2019-10-03)


### Bug Fixes

* marker onPress & gestures ([bff92f0](https://github.com/react-native-community/react-native-svg/commit/bff92f0))

# [9.11.0](https://github.com/react-native-community/react-native-svg/compare/v9.10.2...v9.11.0) (2019-10-03)


### Features

* implement support for context-fill and context-stroke color ([f9a7238](https://github.com/react-native-community/react-native-svg/commit/f9a7238))

## [9.10.2](https://github.com/react-native-community/react-native-svg/compare/v9.10.1...v9.10.2) (2019-10-02)


### Bug Fixes

* marker viewBox translation ([b111028](https://github.com/react-native-community/react-native-svg/commit/b111028))

## [9.10.1](https://github.com/react-native-community/react-native-svg/compare/v9.10.0...v9.10.1) (2019-10-01)


### Bug Fixes

* project.pbxproj for non cocoapods builds ([cd70134](https://github.com/react-native-community/react-native-svg/commit/cd70134)), closes [#1130](https://github.com/react-native-community/react-native-svg/issues/1130)

# [9.10.0](https://github.com/react-native-community/react-native-svg/compare/v9.9.9...v9.10.0) (2019-10-01)


### Features

* improve marker rendering ([9628830](https://github.com/react-native-community/react-native-svg/commit/9628830))
* improve marker rendering ([2e3069d](https://github.com/react-native-community/react-native-svg/commit/2e3069d))
* **android:** implement marker rendering ([ceee5ff](https://github.com/react-native-community/react-native-svg/commit/ceee5ff))
* **ios:** implement marker rendering ([589363d](https://github.com/react-native-community/react-native-svg/commit/589363d))
* define marker attributes ([61533c6](https://github.com/react-native-community/react-native-svg/commit/61533c6))
* define marker element ([e7b5978](https://github.com/react-native-community/react-native-svg/commit/e7b5978))

## [9.9.9](https://github.com/react-native-community/react-native-svg/compare/v9.9.8...v9.9.9) (2019-09-28)


### Bug Fixes

* handling of numeric id ([2fb39f5](https://github.com/react-native-community/react-native-svg/commit/2fb39f5)), closes [#1077](https://github.com/react-native-community/react-native-svg/issues/1077)

## [9.9.8](https://github.com/react-native-community/react-native-svg/compare/v9.9.7...v9.9.8) (2019-09-28)


### Bug Fixes

* **android:** mask height and vertical position calculation ([74b42a7](https://github.com/react-native-community/react-native-svg/commit/74b42a7)), closes [#1097](https://github.com/react-native-community/react-native-svg/issues/1097)

## [9.9.7](https://github.com/react-native-community/react-native-svg/compare/v9.9.6...v9.9.7) (2019-09-28)


### Bug Fixes

* add gradientTransform to d.ts ([3f08c46](https://github.com/react-native-community/react-native-svg/commit/3f08c46)), closes [#1069](https://github.com/react-native-community/react-native-svg/issues/1069)
* handling of gradients without stops ([18828c0](https://github.com/react-native-community/react-native-svg/commit/18828c0)), closes [#1099](https://github.com/react-native-community/react-native-svg/issues/1099)
* handling of rounded rect ([c12d66e](https://github.com/react-native-community/react-native-svg/commit/c12d66e)), closes [#1112](https://github.com/react-native-community/react-native-svg/issues/1112)
* units in linear and radial gradients ([70c54e6](https://github.com/react-native-community/react-native-svg/commit/70c54e6)), closes [#1110](https://github.com/react-native-community/react-native-svg/issues/1110) [#1118](https://github.com/react-native-community/react-native-svg/issues/1118)

## [9.9.6](https://github.com/react-native-community/react-native-svg/compare/v9.9.5...v9.9.6) (2019-09-27)


### Bug Fixes

* **ios:** animation of clipPath contents, fixes [#1119](https://github.com/react-native-community/react-native-svg/issues/1119) ([8bb5b22](https://github.com/react-native-community/react-native-svg/commit/8bb5b22))
* handling of focusable, fixes [#1117](https://github.com/react-native-community/react-native-svg/issues/1117) ([bd7e492](https://github.com/react-native-community/react-native-svg/commit/bd7e492))

## [9.9.5](https://github.com/react-native-community/react-native-svg/compare/v9.9.4...v9.9.5) (2019-09-25)


### Bug Fixes

* handling of color/tintColor, fixes [#1088](https://github.com/react-native-community/react-native-svg/issues/1088) and [#1115](https://github.com/react-native-community/react-native-svg/issues/1115) ([1eaf3a6](https://github.com/react-native-community/react-native-svg/commit/1eaf3a6))

## [9.9.4](https://github.com/react-native-community/react-native-svg/compare/v9.9.3...v9.9.4) (2019-09-16)


### Bug Fixes

* release process ([79bbaf1](https://github.com/react-native-community/react-native-svg/commit/79bbaf1))
