<!-- Title -->
<h1 align="center">
👋 Welcome to <br><code>@expo/osascript</code>
</h1>

<p align="center">Tools for running osascripts in Node.</p>

<p align="center">
  <img src="https://flat.badgen.net/packagephobia/install/@expo/osascript">

  <a href="https://www.npmjs.com/package/@expo/osascript">
    <img src="https://flat.badgen.net/npm/dw/@expo/osascript" target="_blank" />
  </a>
</p>

<!-- Body -->

## Example

```sh
  ccheever@Charless-MacBook-Air:~/projects/osascript$nesh -y
  .Node v4.1.0
  Type .help for more information
  nesh*> .require .
  osascript = require("/Users/ccheever/projects/osascript")
  nesh*> yield osascript.execAsync('tell app "System Events" to count processes whose name is "Simulator"')
  '1\n'
  nesh*> yield osascript.spawnAsync('quit app "Safari"')
  0
  nesh*>
```
