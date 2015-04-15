`walk(folder, [options])` can walk through your file system. For example to list all files and folders (default implementation) or to compute a hash (See [hash-tree-as-promised](https://github.com/MajorBreakfast/hash-tree-as-promised))

# Installation
`npm install walk-tree-as-promised --save`

# Usage
``` JavaScript
var walk = require('walk-tree-as-promised');

walk(__dirname)
.then(function(files) {
  // files is an array with all the file and subdirectory names
});
```

# Options
- `sync` Default: false. If you set `sync: true`, then the synchronous file API functions are used internally. This might be faster on Linux systems. However the function still returns a promise.
- `before` Default: `undefined`. `function(callback)` that is executed before the walking starts
- `after` Default: `undefined`. `function(result, callback)` that is executed after the walking finished
- `processDirectory` Default: `undefined`. `function(baseDir, relativePath, stat, entries, callback)` that is executed for each directory
- `processFile` Default: `undefined`. `function(baseDir, relativePath, stat, callback)` that is executed for each directory

To get a sense of how you can use these functions, have a look at the default implementations.