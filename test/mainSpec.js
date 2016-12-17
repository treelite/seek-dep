/**
 * @file Main spec
 * @author treelite(c.xinle@gmail.com)
 */

import path from 'path';
import seek from '../index';

describe('Main', () => {

    it('normal', async (done) => {
        let files = await seek(path.resolve(__dirname, '../../test/sample'));
        expect(files.length).toEqual(1);
        done();
    });

});
