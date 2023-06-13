# @expo/fingerprint

A library to generate a fingerprint from a React Native project

## Usage

```ts
import * as Fingerprint from '@expo/fingerprint';

await Fingerprint.createFingerprintAsync('/projectRoot');
```

### `async function createFingerprintAsync(projectRoot: string, options?: Options): Promise<Fingerprint>`

Create a fingerprint from project

Example:

```ts
const fingerprint = await createFingerprintAsync('/app');
console.log(fingerprint);
```

```json
{
  "sources": [
    {
      "type": "file",
      "filePath": "app.json",
      "reasons": ["expoConfig"],
      "hash": "378083de0c6e6bb6caf8fb72df658b0b26fb29ef"
    },
    {
      "type": "file",
      "filePath": "eas.json",
      "reasons": ["easBuild"],
      "hash": "f723802b6ea916d1a6c4767b2299cc81ddb22eb4"
    },
    {
      "type": "dir",
      "filePath": "node_modules/expo",
      "reasons": ["expoAutolinkingIos", "expoAutolinkingAndroid", "bareRncliAutolinking"],
      "hash": "1faee4057fa943300905750b51c3b0cbf05f4b0d"
    }
  ],
  "hash": "bf8a3b08935f056270b1688333b02f1ef5fa25bf"
}
```

### `async function createProjectHashAsync(projectRoot: string, options?: Options): Promise<string>`

Create a native hash value from project

Example:

```ts
const hash = await createProjectHashAsync('/app');
console.log(hash);
```

```json
bf8a3b08935f056270b1688333b02f1ef5fa25bf
```

### `diffFingerprintChangesAsync(fingerprint: Fingerprint, projectRoot: string, options?: Options): Promise<FingerprintSource[]>`

Differentiate given `fingerprint` with the current project fingerprint state

Example:

```ts
const fingerprint = {
  sources: [
    {
      type: 'file',
      filePath: 'app.json',
      reasons: ['expoConfig'],
      hash: '378083de0c6e6bb6caf8fb72df658b0b26fb29ef',
    },
    {
      type: 'file',
      filePath: 'eas.json',
      reasons: ['easBuild'],
      hash: 'f723802b6ea916d1a6c4767b2299cc81ddb22eb4',
    },
    {
      type: 'dir',
      filePath: 'node_modules/expo',
      reasons: ['expoAutolinkingIos', 'expoAutolinkingAndroid', 'bareRncliAutolinking'],
      hash: '1faee4057fa943300905750b51c3b0cbf05f4b0d',
    },
  ],
  hash: 'bf8a3b08935f056270b1688333b02f1ef5fa25bf',
};
const result = await diffFingerprintChangesAsync(fingerprint, '/app');
console.log(result);
```

```json
[
  {
    "filePath": "ios",
    "hash": "e4190c0af9142fe4add4842777d9aec713213cd4",
    "reasons": ["bareNativeDir"],
    "type": "dir"
  },
  {
    "filePath": "app.json",
    "hash": "9ff1b51ca9b9435e8b849bcc82e3900d70f0feee",
    "reasons": ["expoConfig"],
    "type": "file"
  }
]
```

## CLI Usage

`npx @expo/fingerprint /path/to/projectRoot`
