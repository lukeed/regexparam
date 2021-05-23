import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { inject } from '../src';

/**
 * @param {string} pattern
 * @param {string} expected
 * @param {Record<string, any>} values
 */
function run(pattern, expected, values) {
	let keys = Object.keys(values);
	test(`inject "${pattern}" with [${keys}]`, () => {
		let output = inject(pattern, values);
		assert.type(output, 'string');
		assert.is(output, expected);
	});
}

test('exports', () => {
	assert.type(inject, 'function');
});

test('returns', () => {
	let output = inject('/', {});
	assert.type(output, 'string');
});

test('throws', () => {
	try {
		inject('/:foo/:bar');
		assert.unreachable('should throw');
	} catch (err) {
		assert.instance(err, TypeError);
		assert.is(err.message, `Cannot read property 'foo' of undefined`);
	}
});

// Test Outputs
// ---

run('/foo/:id', '/foo/123', { id: 123 });
run('/foo/:id/', '/foo/123/', { id: 123 });

run('/:a/:b/:c', '/1/2/3', { a: 1, b: 2, c: 3 });
run('/:a/:b/:c/', '/1/2/3/', { a: 1, b: 2, c: 3 });

run('/assets/:video.mp4', '/assets/demo.mp4', { video: 'demo' });
run('/assets/:video.mp4/extra', '/assets/demo.mp4/extra', { video: 'demo' });
run('/assets/:video.mp4?foo=bar', '/assets/demo.mp4?foo=bar', { video: 'demo' });
run('/assets/:video/.hidden', '/assets/demo/.hidden', { video: 'demo' });

run('/foo/:id/:bar?', '/foo/123', { id: 123 });
run('/foo/:id/:bar?/', '/foo/123/', { id: 123 });

run('/foo/:id/:bar?', '/foo/123/xxx', { id: 123, bar: 'xxx' });
run('/foo/:id/:bar?/', '/foo/123/xxx/', { id: 123, bar: 'xxx' });

run('/foo/:id/:bar?/extra', '/foo/123/extra', { id: 123 });
run('/foo/:id/:bar?/extra', '/foo/123/xxx/extra', { id: 123, bar: 'xxx' });

run('/foo/:id/:a?/:b?/:bar?', '/foo/123', { id: 123 });
run('/foo/:id/:a?/:b?/:bar?', '/foo/123/bb', { id: 123, b: 'bb' });
run('/foo/:id/:a?/:b?/:bar?', '/foo/123/xxx', { id: 123, bar: 'xxx' });
run('/foo/:id/:a?/:b?/:bar?', '/foo/123/aa/xxx', { id: 123, a: 'aa', bar: 'xxx' });

run('/foo/:bar/*', '/foo/123', { bar: '123' });
run('/foo/:bar/*', '/foo/123/aa/bb/cc', { bar: '123', wild: 'aa/bb/cc' });

// NOTE: Missing non-optional values
// ---
run('/foo/:id', '/foo/:id', { /* empty */ });
run('/foo/:id/', '/foo/:id/', { /* empty */ });

run('/:a/:b/:c', '/1/:b/:c', { a: 1 });
run('/:a/:b/:c', '/1/:b/3', { a: 1, c: 3 });

test.run();
