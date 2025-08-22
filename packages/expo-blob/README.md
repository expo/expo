# ExpoBlob

A Expo package that provides a Blob implementation for handling binary data, similar to the web Blob API.

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/blob/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```bash
npx expo install expo-blob
```

### Configure for Android

No additional set up necessary.

### Configure for iOS

Run `npx pod-install` after installing the npm package.

## Usage

### Basic Blob Creation

```typescript
import { ExpoBlob as Blob } from 'expo-blob';

// Create an empty blob
const emptyBlob = new Blob();

// Create a blob from text
const textBlob = new Blob(['Hello, World!'], { type: 'text/plain' });

// Create a blob from binary data
const binaryBlob = new Blob([new Uint8Array([1, 2, 3, 4])], {
  type: 'application/octet-stream',
});

// Create a blob from mixed content
const mixedBlob = new Blob(
  [
    'Text content',
    new Uint8Array([65, 66, 67]), // ABC in ASCII
    'More text',
  ],
  { type: 'text/plain' }
);
```

### Blob Properties

```typescript
const blob = new Blob(['Hello, World!'], { type: 'text/plain' });

console.log(blob.size); // 13 (bytes)
console.log(blob.type); // "text/plain"
```

### Reading Blob Content

```typescript
const blob = new Blob(['Hello, World!'], { type: 'text/plain' });

// Read as text
const text = await blob.text();
console.log(text); // "Hello, World!"

// Read as bytes
const bytes = await blob.bytes();
console.log(bytes); // Uint8Array(13) [72, 101, 108, 108, 111, 44, 32, 87, 111, 114, 108, 100, 33]

// Read as ArrayBuffer
const arrayBuffer = await blob.arrayBuffer();
console.log(arrayBuffer); // ArrayBuffer(13)
```

### Slicing Blobs

```typescript
const blob = new Blob(['Hello, World!'], { type: 'text/plain' });

// Slice from position 0 to 5
const slice1 = blob.slice(0, 5);
console.log(await slice1.text()); // "Hello"

// Slice from position 7 to end
const slice2 = blob.slice(7);
console.log(await slice2.text()); // "World!"

// Slice with custom type
const slice3 = blob.slice(0, 5, 'text/html');
console.log(slice3.type); // "text/html"
```

### Streaming

```typescript
const blob = new Blob(['Large content...'], { type: 'text/plain' });

// Create a readable stream
const stream = blob.stream();
const reader = stream.getReader();

// Read chunks
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log('Chunk:', value);
}
```

## API Reference

### Constructor

```typescript
new Blob(blobParts?: BlobPart[], options?: BlobPropertyBag)
```

**Parameters:**

- `blobParts` (optional): Array of data to include in the blob
- `options` (optional): Configuration object with:
  - `type`: MIME type string
  - `endings`: Line ending normalization ('transparent' or 'native')

### Properties

- `size`: The size of the blob in bytes (read-only)
- `type`: The MIME type of the blob (read-only)

### Methods

- `slice(start?, end?, contentType?)`: Returns a new Blob containing a subset of the data
- `text()`: Returns a Promise that resolves with the blob's content as a string
- `bytes()`: Returns a Promise that resolves with the blob's content as a Uint8Array
- `arrayBuffer()`: Returns a Promise that resolves with the blob's content as an ArrayBuffer
- `stream()`: Returns a ReadableStream for streaming the blob's content

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
