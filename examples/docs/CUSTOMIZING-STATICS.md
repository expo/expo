# Customizing Static Files

> This is akin to ejecting in **`create-react-app`**

To use your own version of the static files which are located at `@expo/webpack-config/web-default`. You can simply add a `web/` folder in your root directory. `@expo/webpack-config` will check for this before using `web-default`.

```
- web
|- index.html
|- favicon.ico
|- serve.json
```
