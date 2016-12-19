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
const HTML_LINKS = /<link(?:\s.*)?\shref=["']([^"']+)/g;
const HTML_IMGS = /<img(?:\s.*)?\ssrc=["']([^"']+)/g;

let absoultePathFilter = file => file.startsWith('http://') || file.startsWith('https://');
let scriptModuleFilter = file => file.charAt(0) !== '.';
let scriptInHTMLFilter = file => absoultePathFilter(file) || extname(file) !== 'js';
let linksInHTMLFilter = file => absoultePathFilter(file) || (extname(file) !== 'css' && extname(file) !== 'ico');

function fileInfo(file) {
    let extname = path.extname(file);
    return {
        dir: path.dirname(file),
        name: path.basename(file, extname),
        extname: extname.substring(1),
        refCount: 0
    };
}

function collectDependences(reg, data, baseDir, root, filter, deps = []) {
    let res;
    reg.lastIndex = 0;
    while (res = reg.exec(data)) {
        let depFile = res[1];
        // Don't care absolute path
        if (filter(depFile)) {
            continue;
        }
        let filename;
        if (depFile.charAt(0) === '/') {
            filename = path.join(root, depFile.substring(1));
        }
        else {
            filename = path.join(baseDir, depFile);
        }
        let start = res[0].indexOf(depFile) + res.index;
        let len = depFile.length;
        let dep = {
            start,
            len,
            end: start + len,
            relativeDir: path.dirname(depFile) + '/',
            filename
        };
        let i;
        for (i = 0; i < deps.length; i++) {
            if (start < deps[i].start) {
                break;
            }
        }
        deps.splice(i, 0, dep);
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

export async function cssProcess(file, root) {
    let data = await readfile(file, 'utf8');
    return Object.assign(
        {
            filename: file,
            data: data,
            type: 'css',
            dependences: collectDependences(CSS_URL, data, path.dirname(file), root, absoultePathFilter)
        },
        fileInfo(file)
    );
}

export async function jsProcess(file, root) {
    let data = await readfile(file, 'utf8');
    let deps = collectDependences(JS_IMPORT, data, path.dirname(file), root, scriptModuleFilter);
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

export async function htmlProcess(file, root) {
    let data = await readfile(file, 'utf8');
    let dir = path.dirname(file);
    let deps = collectDependences(HTML_LINKS, data, dir, root, linksInHTMLFilter);
    deps = collectDependences(HTML_JS, data, dir, root, scriptInHTMLFilter, deps);
    deps = collectDependences(HTML_IMGS, data, dir, root, absoultePathFilter, deps);
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
