/**
 * @file Build file dependences
 * @author treelite(c.xinle@gmail.com)
 */

import path from 'path';
import traverse from './lib/traverse';
import {htmlProcess, cssProcess, jsProcess, resourceProcess} from './lib/processor';

const TYPE_RES = Symbol('res');

const PROCESSORS = {
    html: htmlProcess,
    css: cssProcess,
    js: jsProcess,
    [TYPE_RES]: resourceProcess
};

let allFileMap;
let leakDepMap;

function addFileNode(fileNode) {
    if (allFileMap.has(fileNode.filename)) {
        return;
    }

    // Save file
    allFileMap.set(fileNode.filename, fileNode);

    // Process self dependences
    for (let [index, dep] of fileNode.dependences.entries()) {
        let node = allFileMap.get(dep.filename);
        if (node) {
            dep.file = node;
            node.refCount++;
        }
        else {
            let nodes = leakDepMap.get(dep.filename) || [];
            nodes.push({fileNode, index});
            leakDepMap.set(dep.filename, nodes);
        }
    }

    // Try to fix dependences
    let items = leakDepMap.get(fileNode.filename) || [];
    for (let item of items) {
        item.fileNode.dependences[item.index].file = fileNode;
        fileNode.refCount++;
    }
    leakDepMap.delete(fileNode.filename);
}

async function fileProcess(root, file) {
    let extname = path.extname(file).substring(1).toLowerCase();
    let process = PROCESSORS[extname] || PROCESSORS[TYPE_RES];
    let fileNode = await process(file, root);
    addFileNode(fileNode);
}

export default async function (dir, excludes = []) {
    allFileMap = new Map();
    leakDepMap = new Map();
    await traverse(dir, excludes, fileProcess.bind(null, dir));
    if (leakDepMap.size) {
        let error = new Error('unreferenced dependences');
        error.files = Array.from(leakDepMap.values());
        throw error;
    }

    let res = [];
    let allFiles = allFileMap.values();
    for (let file of allFiles) {
        if (!file.refCount) {
            res.push(file);
        }
    }

    return res;
}
