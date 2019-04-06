# JSTeGraphics

## Setup

### Classic web with \<script\> tag

Include the js-files which you can find in the `dist` folder.

```html
<script src="dist/tcs.bundle.min.js"></script>
```

### ES6
Install module using npm:

```
cd ./
npm
```

or using yarn:

```
cd ./
yarn
```

And import:

```import TeGraphics from "path/app.js";```

### Example
See [demo](http://darkridder.github.io/js-te-graphics/example/).

### Scripts

Build:

```yarn build```

Dev:

```yarn dev```

## Include polyfills and code transforms
For example, to only include polyfills and code transforms needed for users whose browsers have >0.25% market share (ignoring browsers without security updates like IE 10 and BlackBerry):

Options

```
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "entry"
      }
    ]
  ]
}
```
