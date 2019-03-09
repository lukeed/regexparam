const test = require('tape');
const fn = require('../dist/regexparam');

test.Test.prototype.isMatch = function (route, url, params) {
  let i=0, out={}, result=fn(route);
  let matches = result.pattern.exec(url);
  if (matches !== null) {
	  while (i < result.keys.length) {
	    out[ result.keys[i] ] = matches[++i] || null;
	  }
  }
  this.same(out, params, `~> parsed "${url}" into correct params`);
};

test('regexparam', t => {
	t.is(typeof fn, 'function', 'exports a function');

	let foo = fn('/');
	t.is(typeof foo, 'object', 'output is an object');
	t.ok(foo.pattern, '~> has "pattern" key');
	t.ok(foo.pattern instanceof RegExp, '~~> is a RegExp')
	t.ok(foo.keys, '~> has "keys" key');
	t.ok(Array.isArray(foo.keys), '~~> is an Array');

	t.end();
});

test('ensure lead slash', t => {
	t.same(fn('/'), fn(''), '~> root');
	t.same(fn('/books'), fn('books'), '~> static');
	t.same(fn('/books/:title'), fn('books/:title'), '~> param');
	t.same(fn('/books/:title?'), fn('books/:title?'), '~> optional');
	t.same(fn('/books/*'), fn('books/*'), '~> wildcard');
	t.end();
});

test('static', t => {
	let { keys, pattern } = fn('/books');
	t.same(keys, [], '~> empty keys');
	t.true(pattern.test('/books'), '~> matches route');
	t.true(pattern.test('/books/'), '~> matches trailing slash');
	t.false(pattern.test('/books/author'), '~> does not match extra bits');
	t.false(pattern.test('books'), '~> does not match path without lead slash');
	t.end();
});

test('static :: multiple', t => {
	let { keys, pattern } = fn('/foo/bar');
	t.same(keys, [], '~> empty keys');
	t.true(pattern.test('/foo/bar'), '~> matches route');
	t.true(pattern.test('/foo/bar/'), '~> matches trailing slash');
	t.false(pattern.test('/foo/bar/baz'), '~> does not match extra bits');
	t.false(pattern.test('foo/bar'), '~> does not match path without lead slash');
	t.end();
});

test('param', t => {
	let { keys, pattern } = fn('/books/:title');
	t.same(keys, ['title'], '~> keys has "title" value');
	t.false(pattern.test('/books'), '~> does not match naked base');
	t.false(pattern.test('/books/'), '~> does not match naked base w/ trailing slash');
	t.true(pattern.test('/books/narnia'), '~> matches definition');
	t.true(pattern.test('/books/narnia/'), '~> matches definition w/ trailing slash');
	t.false(pattern.test('/books/narnia/hello'), '~> does not match extra bits');
	t.false(pattern.test('books/narnia'), '~> does not match path without lead slash');
	let [_, value] = pattern.exec('/books/narnia');
	t.is(value, 'narnia', '~> executing pattern gives correct value');
	t.end();
});

test('param :: static :: none', t => {
	let { keys, pattern } = fn('/:title');
	t.same(keys, ['title'], '~> keys has "title" value');
	t.false(pattern.test('/'), '~> does not match naked base w/ trailing slash');
	t.true(pattern.test('/narnia'), '~> matches definition');
	t.true(pattern.test('/narnia/'), '~> matches definition w/ trailing slash');
	t.false(pattern.test('/narnia/reviews'), '~> does not match extra bits');
	t.false(pattern.test('narnia'), '~> does not match path without lead slash');
	let [_, value] = pattern.exec('/narnia');
	t.is(value, 'narnia', '~> executing pattern gives correct value');
	t.end();
});

test('param :: static :: multiple', t => {
	let { keys, pattern } = fn('/foo/bar/:title');
	t.same(keys, ['title'], '~> keys has "title" value');
	t.false(pattern.test('/foo/bar'), '~> does not match naked base');
	t.false(pattern.test('/foo/bar/'), '~> does not match naked base w/ trailing slash');
	t.true(pattern.test('/foo/bar/narnia'), '~> matches definition');
	t.true(pattern.test('/foo/bar/narnia/'), '~> matches definition w/ trailing slash');
	t.false(pattern.test('/foo/bar/narnia/hello'), '~> does not match extra bits');
	t.false(pattern.test('foo/bar/narnia'), '~> does not match path without lead slash');
	t.false(pattern.test('/foo/narnia'), '~> does not match if statics are different');
	t.false(pattern.test('/bar/narnia'), '~> does not match if statics are different');
	let [_, value] = pattern.exec('/foo/bar/narnia');
	t.is(value, 'narnia', '~> executing pattern gives correct value');
	t.end();
});

test('param :: multiple', t => {
	let { keys, pattern } = fn('/books/:author/:title');
	t.same(keys, ['author', 'title'], '~> keys has "author" & "title" values');
	t.false(pattern.test('/books'), '~> does not match naked base');
	t.false(pattern.test('/books/'), '~> does not match naked base w/ trailing slash');
	t.false(pattern.test('/books/smith'), '~> does not match insufficient parameter counts');
	t.false(pattern.test('/books/smith/'), '~> does not match insufficient paramters w/ trailing slash');
	t.true(pattern.test('/books/smith/narnia'), '~> matches definition');
	t.true(pattern.test('/books/smith/narnia/'), '~> matches definition w/ trailing slash');
	t.false(pattern.test('/books/smith/narnia/reviews'), '~> does not match extra bits');
	t.false(pattern.test('books/smith/narnia'), '~> does not match path without lead slash');
	let [_, author, title] = pattern.exec('/books/smith/narnia');
	t.is(author, 'smith', '~> executing pattern gives correct value');
	t.is(title, 'narnia', '~> executing pattern gives correct value');
	t.end();
});

test('param :: suffix', t => {
	let { keys, pattern } = fn('/movies/:title.mp4');
	t.same(keys, ['title'], '~> keys has "title" only (no suffix)');
	t.false(pattern.test('/movies'), '~> does not match naked base');
	t.false(pattern.test('/movies/'), '~> does not match naked base w/ trailing slash');
	t.false(pattern.test('/movies/foo'), '~> does not match without suffix');
	t.false(pattern.test('/movies/foo.mp3'), '~> does not match with wrong suffix');
	t.true(pattern.test('/movies/foo.mp4'), '~> does match with correct suffix');
	t.true(pattern.test('/movies/foo.mp4/'), '~> does match with trailing slash');
	t.end();
});

test('param :: suffices', t => {
	let { keys, pattern } = fn('/movies/:title.(mp4|mov)');
	t.same(keys, ['title'], '~> keys has "title" only (no suffix)');
	t.false(pattern.test('/movies'), '~> does not match naked base');
	t.false(pattern.test('/movies/'), '~> does not match naked base w/ trailing slash');
	t.false(pattern.test('/movies/foo'), '~> does not match without suffix');
	t.false(pattern.test('/movies/foo.mp3'), '~> does not match with wrong suffix');
	t.true(pattern.test('/movies/foo.mp4'), '~> does match with correct suffix (mp4)');
	t.true(pattern.test('/movies/foo.mp4/'), '~> does match with trailing slash (mp4)');
	t.true(pattern.test('/movies/foo.mov'), '~> does match with correct suffix (mov)');
	t.true(pattern.test('/movies/foo.mov/'), '~> does match with trailing slash (mov)');
	t.end();
});

test('param :: optional', t => {
	let { keys, pattern } = fn('/books/:author/:title?');
	t.same(keys, ['author', 'title'], '~> keys has "author" & "title" values');
	t.false(pattern.test('/books'), '~> does not match naked base');
	t.false(pattern.test('/books/'), '~> does not match naked base w/ trailing slash');
	t.true(pattern.test('/books/smith'), '~> matches when optional parameter is missing counts');
	t.true(pattern.test('/books/smith/'), '~> matches when optional paramter is missing w/ trailing slash');
	t.true(pattern.test('/books/smith/narnia'), '~> matches when fully populated');
	t.true(pattern.test('/books/smith/narnia/'), '~> matches when fully populated w/ trailing slash');
	t.false(pattern.test('/books/smith/narnia/reviews'), '~> does not match extra bits');
	t.false(pattern.test('books/smith/narnia'), '~> does not match path without lead slash');
	let [_, author, title] = pattern.exec('/books/smith/narnia');
	t.is(author, 'smith', '~> executing pattern gives correct value');
	t.is(title, 'narnia', '~> executing pattern gives correct value');
	t.end();
});

test('param :: optional :: static :: none', t => {
	let { keys, pattern } = fn('/:title?');
	t.same(keys, ['title'], '~> keys has "title" value');
	t.true(pattern.test('/'), '~> matches root w/ trailing slash');
	t.true(pattern.test('/narnia'), '~> matches definition');
	t.true(pattern.test('/narnia/'), '~> matches definition w/ trailing slash');
	t.false(pattern.test('/narnia/reviews'), '~> does not match extra bits');
	t.false(pattern.test('narnia'), '~> does not match path without lead slash');
	let [_, value] = pattern.exec('/narnia');
	t.is(value, 'narnia', '~> executing pattern gives correct value');
	t.end();
});

test('param :: optional :: multiple', t => {
	let { keys, pattern } = fn('/books/:genre/:author?/:title?');
	t.same(keys, ['genre', 'author', 'title'], '~> keys has "genre", "author" & "title" values');
	t.false(pattern.test('/books'), '~> does not match naked base');
	t.false(pattern.test('/books/'), '~> does not match naked base w/ trailing slash');
	t.true(pattern.test('/books/horror'), '~> matches when optional parameter is missing counts');
	t.true(pattern.test('/books/horror/'), '~> matches when optional paramter is missing w/ trailing slash');
	t.true(pattern.test('/books/horror/smith'), '~> matches when optional parameter is missing counts');
	t.true(pattern.test('/books/horror/smith/'), '~> matches when optional paramter is missing w/ trailing slash');
	t.true(pattern.test('/books/horror/smith/narnia'), '~> matches when fully populated');
	t.true(pattern.test('/books/horror/smith/narnia/'), '~> matches when fully populated w/ trailing slash');
	t.false(pattern.test('/books/horror/smith/narnia/reviews'), '~> does not match extra bits');
	t.false(pattern.test('books/horror/smith/narnia'), '~> does not match path without lead slash');
	let [_, genre, author, title] = pattern.exec('/books/horror/smith/narnia');
	t.is(genre, 'horror', '~> executing pattern gives correct value');
	t.is(author, 'smith', '~> executing pattern gives correct value');
	t.is(title, 'narnia', '~> executing pattern gives correct value');
	t.end();
});

test('wildcard', t => {
	let { keys, pattern } = fn('/books/*');
	t.same(keys, ['wild'], '~> keys has "wild" value');
	t.false(pattern.test('/books'), '~> does not match naked base');
	t.true(pattern.test('/books/'), '~> does not match naked base w/ trailing slash');
	t.true(pattern.test('/books/narnia'), '~> matches definition');
	t.true(pattern.test('/books/narnia/'), '~> matches definition w/ trailing slash');
	t.true(pattern.test('/books/narnia/reviews'), '~> does not match extra bits');
	t.false(pattern.test('books/narnia'), '~> does not match path without lead slash');
	let [_, value] = pattern.exec('/books/narnia/reviews');
	t.is(value, 'narnia/reviews', '~> executing pattern gives ALL values after base');
	t.end();
});

test('wildcard :: root', t => {
	let { keys, pattern } = fn('*');
	t.same(keys, ['wild'], '~> keys has "wild" value');
	t.true(pattern.test('/'), '~> matches root path');
	t.true(pattern.test('/narnia'), '~> matches definition');
	t.true(pattern.test('/narnia/'), '~> matches definition w/ trailing slash');
	t.true(pattern.test('/narnia/reviews'), '~> does not match extra bits');
	t.false(pattern.test('narnia'), '~> does not match path without lead slash');
	let [_, value] = pattern.exec('/foo/bar/baz');
	t.is(value, 'foo/bar/baz', '~> executing pattern gives ALL values together');
	t.end();
});

test('execs', t => {
	console.log('/:title');
	t.isMatch('/:title', '/hello', { title:'hello' });
	t.isMatch('/:title', '/hello/', { title:'hello' });

	console.log('/:title?');
	t.isMatch('/:title?', '/', { title:null });
	t.isMatch('/:title?', '/hello', { title:'hello' });
	t.isMatch('/:title?', '/hello/', { title:'hello' });

	console.log('/:title.mp4');
	t.isMatch('/:title.mp4', '/', {});
	t.isMatch('/:title.mp4', '/hello.mp4', { title:'hello' });
	t.isMatch('/:title.mp4', '/hello.mp4/', { title:'hello' });

	console.log('/:title/:genre');
	t.isMatch('/:title/:genre', '/hello', {});
	t.isMatch('/:title/:genre', '/hello/', {});
	t.isMatch('/:title/:genre', '/hello/world', { title:'hello', genre:'world' });
	t.isMatch('/:title/:genre', '/hello/world/', { title:'hello', genre:'world' });

	console.log('/:title/:genre?');
	t.isMatch('/:title/:genre?', '/hello', { title:'hello', genre:null });
	t.isMatch('/:title/:genre?', '/hello/', { title:'hello', genre:null });
	t.isMatch('/:title/:genre?', '/hello/world', { title:'hello', genre:'world' });
	t.isMatch('/:title/:genre?', '/hello/world/', { title:'hello', genre:'world' });

	console.log('/books/*');
	t.isMatch('/books/*', '/books', {});
	t.isMatch('/books/*', '/books/', { wild:null });
	t.isMatch('/books/*', '/books/world', { wild:'world' });
	t.isMatch('/books/*', '/books/world/', { wild:'world/' });
	t.isMatch('/books/*', '/books/world/howdy', { wild:'world/howdy' });
	t.isMatch('/books/*', '/books/world/howdy/', { wild:'world/howdy/' });

	console.log('/books/*?');
	t.isMatch('/books/*?', '/books', {});
	t.isMatch('/books/*?', '/books/', { wild:null });
	t.isMatch('/books/*?', '/books/world', { wild:'world' });
	t.isMatch('/books/*?', '/books/world/', { wild:'world/' });
	t.isMatch('/books/*?', '/books/world/howdy', { wild:'world/howdy' });
	t.isMatch('/books/*?', '/books/world/howdy/', { wild:'world/howdy/' });

	t.end();
});
