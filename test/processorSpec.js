/**
 * @file Processor Spec
 * @author treelite(c.xinle@gmail.com)
 */

import path from 'path';
import {htmlProcess, cssProcess, jsProcess, resourceProcess} from '../lib/processor';

let root = path.resolve(__dirname, '../../test/sample');
let sample = file => path.resolve(root, file);

describe('Processor', () => {

    it('html', async (done) => {
        let file = sample('index.html');
        let cssFile = sample('src/main.css');
        let jsFile = sample('src/app.js');
        let iconFile = sample('favicon.ico');
        let res = await htmlProcess(file, root);
        expect(res.filename).toEqual(file);
        expect(res.type).toEqual('html');
        expect(res.refCount).toEqual(0);
        expect(res.dependences.length).toEqual(3);
        let deps = res.dependences;
        expect(deps[0].filename).toEqual(iconFile);
        expect(deps[1].filename).toEqual(jsFile);
        expect(deps[2].filename).toEqual(cssFile);
        done();
    });

    it('css', async (done) => {
        let file = sample('src/main.css');
        let imgFile = sample('src/img/avatar.jpg');
        let res = await cssProcess(file, root);
        expect(res.filename).toEqual(file);
        expect(res.type).toEqual('css');
        expect(res.refCount).toEqual(0);
        expect(res.dependences.length).toEqual(1);
        expect(res.dependences[0].filename).toEqual(imgFile);
        done();
    });

    it('resource', async (done) => {
        let file = sample('src/img/avatar.jpg');
        let res = await resourceProcess(file, root);
        expect(res.filename).toEqual(file);
        expect(res.type).toEqual('resource');
        expect(res.refCount).toEqual(0);
        expect(res.dependences.length).toEqual(0);
        done();
    });

    it('js', async (done) => {
        let file = sample('src/app.js');
        let formatFile = sample('src/util/format.js');
        let actionFile = sample('src/action.js');
        let res = await jsProcess(file, root);
        expect(res.filename).toEqual(file);
        expect(res.type).toEqual('js');
        expect(res.refCount).toEqual(0);
        expect(res.dependences.length).toEqual(2);
        let deps = res.dependences;
        expect(deps[0].filename).toEqual(formatFile);
        expect(deps[1].filename).toEqual(actionFile);
        done();
    });

});
