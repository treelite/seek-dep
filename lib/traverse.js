/**
 * @file File traverse
 * @author treelite(c.xinle@gmail.com)
 */

import fs from 'fs';
import path from 'path';

let readdir = dir => new Promise(
    (resolve, reject) => fs.readdir(dir, (error, files) => error ? reject(error) : resolve(files))
);

let readstat = file => new Promise(
    (resolve, reject) => fs.stat(file, (error, stats) => error ? reject(error) : resolve(stats))
);

export default async function traverse(dir, excludes, callback) {
    let dirs = [];
    let files = await readdir(dir);

    for (let file of files) {
        if (file.charAt(0) === '.') {
            continue;
        }
        file = path.join(dir, file);

        // Exclude file
        let index = excludes.indexOf(file);
        if (index >= 0) {
            excludes.splice(index, 1);
            continue;
        }

        let stat = await readstat(file);
        if (stat.isDirectory()) {
            dirs.push(file);
        }
        else {
            await callback(file);
        }
    }
    for (dir of dirs) {
        await traverse(dir, excludes, callback);
    }
}
