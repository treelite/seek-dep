# seek-dep

Find out all dependencies between HTML, CSS, JavaScript(ES6 Modules) and images.

## Usage

```js
import seek from 'seek-dep';

seek('static_dir').then(res => JSON.stringify(res, null, 2));
```

## Data Structure

`seek-dep` return a array of `File`:

```js
interface File {
    type: string; // 'html', 'css', 'js' or 'resource'
    filename: string; // full path name base on searching dir
    data: string | buffer;
    name: string; // file name with out extname
    extname: string;
    dir: string;
    refCount: number; // the count of referenced by other files
    dependences: [Dependence];
}
```

The `refCount` property of each `File` in the array is 0, it's meaning that the `File` is a root file, no other files depend on it. According to the `dependences` property of root `File`, we can traverse all static files.

```js
interface Dependence {
    filename: string;
    start: number; // the start of location in the host file
    end: number; // the end of location in the host file
    len: number; // the reference path's length
    relativeDir: string; // dir name of the reference path
    file: File;
}
```
