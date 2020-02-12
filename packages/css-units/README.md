<h1 align="center">@expo/css-units</h1>

<p align="center">
  <!-- iOS -->
  <img alt="Supports Expo iOS" longdesc="Supports Expo iOS" src="https://img.shields.io/badge/iOS-4630EB.svg?style=flat-square&logo=APPLE&labelColor=999999&logoColor=fff" />
  <!-- Android -->
  <img alt="Supports Expo Android" longdesc="Supports Expo Android" src="https://img.shields.io/badge/Android-4630EB.svg?style=flat-square&logo=ANDROID&labelColor=A4C639&logoColor=fff" />
  <!-- Web -->
  <img alt="Supports Expo Web" longdesc="Supports Expo Web" src="https://img.shields.io/badge/web-4630EB.svg?style=flat-square&logo=GOOGLE-CHROME&labelColor=4285F4&logoColor=fff" />
  <a aria-label="Circle CI" href="https://circleci.com/gh/expo/expo/tree/master">
    <img alt="Circle CI" src="https://flat.badgen.net/circleci/github/expo/expo?label=Circle%20CI&labelColor=555555&icon=circleci">
  </a>
</p>

Universal CSS units measured for universal Expo apps.

## Usage

```sh
yarn add @expo/css-units
```

```tsx
import { rem, rm } from '@expo/css-units';
import { P } from '@expo/html-elements';

export default () => <P style={{ fontSize: rem(1) }} />;
```

## API

### `rem`

```tsx
import { rem } from '@expo/css-units';

const unit = rem(1);
```

### `rm`

```tsx
import { rm } from '@expo/css-units';

const unit = rm(1);
```

### `px`

Don't use, this method just returns the input value.

```tsx
import { px } from '@expo/css-units';

const unit = px(1);
```

### `vw`

```tsx
import { vw } from '@expo/css-units';

const unit = vw(50);
```

### `vh`

```tsx
import { vh } from '@expo/css-units';

const unit = vh(50);
```
