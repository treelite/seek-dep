/**
 * @file Files traverse spec
 * @author treelite(c.xinle@gmail.com)
 */

import path from 'path';
import traverse from '../lib/traverse';

describe('traverse', () => {

    it('normal', async (done) => {
        let dir = path.resolve(__dirname, '../../test/sample');
        let files = [];
        await traverse(dir, [path.resolve(dir, 'src/util')], file => files.push(file));
        expect(files.length).toEqual(6);
        done();
    });

});
