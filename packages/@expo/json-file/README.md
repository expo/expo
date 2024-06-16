<!-- Title -->
<h1 align="center">
👋 Welcome to <br><code>@expo/json-file</code>
</h1>

<p align="center">A library for reading and writing JSON files.</p>

<!-- Body -->

## 🏁 Setup

Install `@expo/json-file` in your project.

```sh
yarn add @expo/json-file
```

## ⚽️ Usage

```ts
import JsonFile, { JSONObject } from '@expo/json-file';

// Create a file instance
const jsonFile = new JsonFile<JSONObject>(filePath);

// Interact with the file
await jsonFile.readAsync();
await jsonFile.writeAsync({ some: 'data' });
```
