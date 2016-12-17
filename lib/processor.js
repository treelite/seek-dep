/**
 * @file File processor
 * @author treelite(c.xinle@gmail.com)
 */

import fs from 'fs';
import path from 'path';

let readfile = (file, type) => new Promise(
    (resolve, reject) => fs.readFile(file, type, (error, data) => error ? reject(error) : resolve(data))
);

let extname = file => path.extname(file).substring(1).toLowerCase();

const CSS_URL = /:\s*url\(["']?([^"')]+)/g;
const JS_IMPORT = /^\s*import\s+.*\s+from\s+["']([^"']+)/mg;
const HTML_JS = /<script(?:\s.*)?\ssrc=["']([^"']+)/g;
const HTML_CSS = /<link(?:\s.*)?\shref=["']([^"']+)/g;

let absoultePathFilter = file => file.startsWith('/') || file.startsWith('http://') || file.startsWith('https://');
let scriptModuleFilter = file => file.charAt(0) !== '.';
let scriptInHTMLFilter = file => absoultePathFilter(file) || extname(file) !== 'js';
let cssInHTMLFilter = file => absoultePathFilter(file) || extname(file) !== 'css';

function fileInfo(file) {
    let extname = path.extname(file);
    return {
        dir: path.dirname(file),
        name: path.basename(file, extname),
        extname: extname.substring(1),
        refCount: 0
    };
}

function collectDependences(reg, data, baseDir, filter) {
    let res;
    let deps = [];
    reg.lastIndex = 0;
    while (res = reg.exec(data)) {
        let depFile = res[1];
        // Don't care absolute path
        if (filter(depFile)) {
            continue;
        }
        deps.push({
            start: res.index,
            end: res.index + depFile.length,
            relativeDir: path.dirname(depFile) + '/',
            filename: path.resolve(baseDir, depFile)
        });
    }
    return deps;
}

export async function resourceProcess(file) {
    let data = await readfile(file);
    return Object.assign(
        {
            filename: file,
            data: data,
            type: 'resource',
            dependences: []
        },
        fileInfo(file)
    );
}

export async function cssProcess(file) {
    let data = await readfile(file, 'utf8');
    return Object.assign(
        {
            filename: file,
            data: data,
            type: 'css',
            dependences: collectDependences(CSS_URL, data, path.dirname(file), absoultePathFilter)
        },
        fileInfo(file)
    );
}

export async function jsProcess(file) {
    let data = await readfile(file, 'utf8');
    let deps = collectDependences(JS_IMPORT, data, path.dirname(file), scriptModuleFilter);
    deps.forEach(item => {
        if (item.filename.indexOf('.js') < 0) {
            item.filename += '.js';
        }
    });
    return Object.assign(
        {
            filename: file,
            data: data,
            type: 'js',
            dependences: deps
        },
        fileInfo(file)
    );
}

export async function htmlProcess(file) {
    let data = await readfile(file, 'utf8');
    let dir = path.dirname(file);
    let deps = collectDependences(HTML_CSS, data, dir, cssInHTMLFilter);
    deps = deps.concat(collectDependences(HTML_JS, data, dir, scriptInHTMLFilter));
    return Object.assign(
        {
            filename: file,
            data: data,
            type: 'html',
            dependences: deps
        },
        fileInfo(file)
    );
}
