const test = require('tape');
const fn = require('../dist/regexparam');

function run(route, url, loose) {
	let i=0, out={}, result=fn(route, !!loose);
  let matches = result.pattern.exec(url);
  if (matches === null) return false;
  if (matches.groups) return matches.groups;
  while (i < result.keys.length) {
    out[ result.keys[i] ] = matches[++i] || null;
  }
  return out;
}

function raw(route, url, loose) {
	return fn(route, !!loose).pattern.exec(url);
}

test.Test.prototype.toExec = function (route, url, params) {
	let out = run(route, url);
	this.same(out, params, out ? `~> parsed "${url}" into correct params` : `~> route and "${url}" did not match`);
};

test.Test.prototype.toLooseExec = function (route, url, params) {
	let out = run(route, url, true);
	this.same(out, params, out ? `~> parsed "${url}" into correct params` : `~> route and "${url}" did not match`);
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
	let [url, value] = pattern.exec('/books/narnia');
	t.is(url, '/books/narnia', '~> executing pattern on correct trimming');
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
	let [url, value] = pattern.exec('/narnia/');
	t.is(url, '/narnia/', '~> executing pattern on correct trimming');
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
	let [url, value] = pattern.exec('/foo/bar/narnia');
	t.is(url, '/foo/bar/narnia', '~> executing pattern on correct trimming');
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
	let [url, author, title] = pattern.exec('/books/smith/narnia');
	t.is(url, '/books/smith/narnia', '~> executing pattern on correct trimming');
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
	// false = did not match

	console.log('/books');
	t.toExec('/books', '/', false);
	t.toExec('/books', '/books', {});
	t.toExec('/books', '/books/', {});
	t.toExec('/books', '/books/world/', false);
	t.toExec('/books', '/books/world', false);

	console.log('/:title');
	t.toExec('/:title', '/hello', { title:'hello' });
	t.toExec('/:title', '/hello/', { title:'hello' });
	t.toExec('/:title', '/hello/world/', false);
	t.toExec('/:title', '/hello/world', false);
	t.toExec('/:title', '/', false);

	console.log('/:title?');
	t.toExec('/:title?', '/', { title:null });
	t.toExec('/:title?', '/hello', { title:'hello' });
	t.toExec('/:title?', '/hello/', { title:'hello' });
	t.toExec('/:title?', '/hello/world/', false);
	t.toExec('/:title?', '/hello/world', false);

	console.log('/:title.mp4');
	t.toExec('/:title.mp4', '/hello.mp4', { title:'hello' });
	t.toExec('/:title.mp4', '/hello.mp4/', { title:'hello' });
	t.toExec('/:title.mp4', '/hello.mp4/history/', false);
	t.toExec('/:title.mp4', '/hello.mp4/history', false);
	t.toExec('/:title.mp4', '/', false);

	console.log('/:title/:genre');
	t.toExec('/:title/:genre', '/hello/world', { title:'hello', genre:'world' });
	t.toExec('/:title/:genre', '/hello/world/', { title:'hello', genre:'world' });
	t.toExec('/:title/:genre', '/hello/world/mundo/', false);
	t.toExec('/:title/:genre', '/hello/world/mundo', false);
	t.toExec('/:title/:genre', '/hello/', false);
	t.toExec('/:title/:genre', '/hello', false);

	console.log('/:title/:genre?');
	t.toExec('/:title/:genre?', '/hello', { title:'hello', genre:null });
	t.toExec('/:title/:genre?', '/hello/', { title:'hello', genre:null });
	t.toExec('/:title/:genre?', '/hello/world', { title:'hello', genre:'world' });
	t.toExec('/:title/:genre?', '/hello/world/', { title:'hello', genre:'world' });
	t.toExec('/:title/:genre?', '/hello/world/mundo/', false);
	t.toExec('/:title/:genre?', '/hello/world/mundo', false);

	console.log('/books/*');
	t.toExec('/books/*', '/books', false);
	t.toExec('/books/*', '/books/', { wild:null });
	t.toExec('/books/*', '/books/world', { wild:'world' });
	t.toExec('/books/*', '/books/world/', { wild:'world/' });
	t.toExec('/books/*', '/books/world/howdy', { wild:'world/howdy' });
	t.toExec('/books/*', '/books/world/howdy/', { wild:'world/howdy/' });

	console.log('/books/*?');
	t.toExec('/books/*?', '/books', false);
	t.toExec('/books/*?', '/books/', { wild:null });
	t.toExec('/books/*?', '/books/world', { wild:'world' });
	t.toExec('/books/*?', '/books/world/', { wild:'world/' });
	t.toExec('/books/*?', '/books/world/howdy', { wild:'world/howdy' });
	t.toExec('/books/*?', '/books/world/howdy/', { wild:'world/howdy/' });

	t.end();
});

test('execs :: loose', t => {
	// false = did not match

	console.log('/books');
	t.toLooseExec('/books', '/', false);
	t.toLooseExec('/books', '/books', {});
	t.toLooseExec('/books', '/books/', {});
	t.toLooseExec('/books', '/books/world/', {});
	t.toLooseExec('/books', '/books/world', {});

	console.log('/:title');
	t.toLooseExec('/:title', '/hello', { title:'hello' });
	t.toLooseExec('/:title', '/hello/', { title:'hello' });
	t.toLooseExec('/:title', '/hello/world/', { title:'hello' });
	t.toLooseExec('/:title', '/hello/world', { title:'hello' });
	t.toLooseExec('/:title', '/', false);

	console.log('/:title?');
	t.toLooseExec('/:title?', '/', { title:null });
	t.toLooseExec('/:title?', '/hello', { title:'hello' });
	t.toLooseExec('/:title?', '/hello/', { title:'hello' });
	t.toLooseExec('/:title?', '/hello/world/', { title:'hello' });
	t.toLooseExec('/:title?', '/hello/world', { title:'hello' });

	console.log('/:title.mp4');
	t.toLooseExec('/:title.mp4', '/hello.mp4', { title:'hello' });
	t.toLooseExec('/:title.mp4', '/hello.mp4/', { title:'hello' });
	t.toLooseExec('/:title.mp4', '/hello.mp4/history/', { title:'hello' });
	t.toLooseExec('/:title.mp4', '/hello.mp4/history', { title:'hello' });
	t.toLooseExec('/:title.mp4', '/', false);

	console.log('/:title/:genre');
	t.toLooseExec('/:title/:genre', '/hello/world', { title:'hello', genre:'world' });
	t.toLooseExec('/:title/:genre', '/hello/world/', { title:'hello', genre:'world' });
	t.toLooseExec('/:title/:genre', '/hello/world/mundo/', { title:'hello', genre:'world' });
	t.toLooseExec('/:title/:genre', '/hello/world/mundo', { title:'hello', genre:'world' });
	t.toLooseExec('/:title/:genre', '/hello/', false);
	t.toLooseExec('/:title/:genre', '/hello', false);

	console.log('/:title/:genre?');
	t.toLooseExec('/:title/:genre?', '/hello', { title:'hello', genre:null });
	t.toLooseExec('/:title/:genre?', '/hello/', { title:'hello', genre:null });
	t.toLooseExec('/:title/:genre?', '/hello/world', { title:'hello', genre:'world' });
	t.toLooseExec('/:title/:genre?', '/hello/world/', { title:'hello', genre:'world' });
	t.toLooseExec('/:title/:genre?', '/hello/world/mundo/', { title:'hello', genre:'world' });
	t.toLooseExec('/:title/:genre?', '/hello/world/mundo', { title:'hello', genre:'world' });

	console.log('/books/*');
	t.toLooseExec('/books/*', '/books', false);
	t.toLooseExec('/books/*', '/books/', { wild:null });
	t.toLooseExec('/books/*', '/books/world', { wild:'world' });
	t.toLooseExec('/books/*', '/books/world/', { wild:'world/' });
	t.toLooseExec('/books/*', '/books/world/howdy', { wild:'world/howdy' });
	t.toLooseExec('/books/*', '/books/world/howdy/', { wild:'world/howdy/' });

	console.log('/books/*?');
	t.toLooseExec('/books/*?', '/books', false);
	t.toLooseExec('/books/*?', '/books/', { wild:null });
	t.toLooseExec('/books/*?', '/books/world', { wild:'world' });
	t.toLooseExec('/books/*?', '/books/world/', { wild:'world/' });
	t.toLooseExec('/books/*?', '/books/world/howdy', { wild:'world/howdy' });
	t.toLooseExec('/books/*?', '/books/world/howdy/', { wild:'world/howdy/' });

	t.end();
});

test('(raw) exec', t => {
	console.log('/foo ~> "/foo"');
	let [url, ...vals] = raw('/foo', '/foo');
	t.is(url, '/foo', '~> parsed `url` correctly');
	t.same(vals, [], '~> parsed value segments correctly');

	console.log('/foo ~> "/foo/"');
	[url, ...vals] = raw('/foo/', '/foo/');
	t.is(url, '/foo/', '~> parsed `url` correctly');
	t.same(vals, [], '~> parsed value segments correctly');


	console.log('/:path ~> "/foo"');
	[url, ...vals] = raw('/:path', '/foo');
	t.is(url, '/foo', '~> parsed `url` correctly');
	t.same(vals, ['foo'], '~> parsed value segments correctly');

	console.log('/:path ~> "/foo/"');
	[url, ...vals] = raw('/:path', '/foo/');
	t.is(url, '/foo/', '~> parsed `url` correctly');
	t.same(vals, ['foo'], '~> parsed value segments correctly');


	console.log('/:path/:sub ~> "/foo/bar"');
	[url, ...vals] = raw('/:path/:sub', '/foo/bar');
	t.is(url, '/foo/bar', '~> parsed `url` correctly');
	t.same(vals, ['foo', 'bar'], '~> parsed value segments correctly');

	console.log('/:path/:sub ~> "/foo/bar/"');
	[url, ...vals] = raw('/:path/:sub', '/foo/bar/');
	t.is(url, '/foo/bar/', '~> parsed `url` correctly');
	t.same(vals, ['foo', 'bar'], '~> parsed value segments correctly');


	console.log('/:path/:sub? ~> "/foo"');
	[url, ...vals] = raw('/:path/:sub?', '/foo');
	t.is(url, '/foo', '~> parsed `url` correctly');
	t.same(vals, ['foo', undefined], '~> parsed value segments correctly');

	console.log('/:path/:sub? ~> "/foo/"');
	[url, ...vals] = raw('/:path/:sub?', '/foo/');
	t.is(url, '/foo/', '~> parsed `url` correctly');
	t.same(vals, ['foo', undefined], '~> parsed value segments correctly');


	console.log('/:path/:sub? ~> "/foo/bar"');
	[url, ...vals] = raw('/:path/:sub?', '/foo/bar');
	t.is(url, '/foo/bar', '~> parsed `url` correctly');
	t.same(vals, ['foo', 'bar'], '~> parsed value segments correctly');

	console.log('/:path/:sub? ~> "/foo/bar/"');
	[url, ...vals] = raw('/:path/:sub', '/foo/bar/');
	t.is(url, '/foo/bar/', '~> parsed `url` correctly');
	t.same(vals, ['foo', 'bar'], '~> parsed value segments correctly');


	console.log('/:path/* ~> "/foo/bar/baz"');
	[url, ...vals] = raw('/:path/*', '/foo/bar/baz');
	t.is(url, '/foo/bar/baz', '~> parsed `url` correctly');
	t.same(vals, ['foo', 'bar/baz'], '~> parsed value segments correctly');

	console.log('/:path/* ~> "/foo/bar/baz/"');
	[url, ...vals] = raw('/:path/*', '/foo/bar/baz/');
	t.is(url, '/foo/bar/baz/', '~> parsed `url` correctly');
	t.same(vals, ['foo', 'bar/baz/'], '~> parsed value segments correctly');


	console.log('/foo/:path ~> "/foo/bar"');
	[url, ...vals] = raw('/foo/:path', '/foo/bar');
	t.is(url, '/foo/bar', '~> parsed `url` correctly');
	t.same(vals, ['bar'], '~> parsed value segments correctly');

	console.log('/foo/:path ~> "/foo/bar/"');
	[url, ...vals] = raw('/foo/:path', '/foo/bar/');
	t.is(url, '/foo/bar/', '~> parsed `url` correctly');
	t.same(vals, ['bar'], '~> parsed value segments correctly');

	t.end();
});

test('(raw) exec :: loose', t => {
	console.log('/foo ~> "/foo"');
	let [url, ...vals] = raw('/foo', '/foo', 1);
	t.is(url, '/foo', '~> parsed `url` correctly');
	t.same(vals, [], '~> parsed value segments correctly');

	console.log('/foo ~> "/foo/"');
	[url, ...vals] = raw('/foo/', '/foo/', 1);
	t.is(url, '/foo', '~> parsed `url` correctly');
	t.same(vals, [], '~> parsed value segments correctly');


	console.log('/:path ~> "/foo"');
	[url, ...vals] = raw('/:path', '/foo', 1);
	t.is(url, '/foo', '~> parsed `url` correctly');
	t.same(vals, ['foo'], '~> parsed value segments correctly');

	console.log('/:path ~> "/foo/"');
	[url, ...vals] = raw('/:path', '/foo/', 1);
	t.is(url, '/foo', '~> parsed `url` correctly');
	t.same(vals, ['foo'], '~> parsed value segments correctly');


	console.log('/:path/:sub ~> "/foo/bar"');
	[url, ...vals] = raw('/:path/:sub', '/foo/bar', 1);
	t.is(url, '/foo/bar', '~> parsed `url` correctly');
	t.same(vals, ['foo', 'bar'], '~> parsed value segments correctly');

	console.log('/:path/:sub ~> "/foo/bar/"');
	[url, ...vals] = raw('/:path/:sub', '/foo/bar/', 1);
	t.is(url, '/foo/bar', '~> parsed `url` correctly');
	t.same(vals, ['foo', 'bar'], '~> parsed value segments correctly');


	console.log('/:path/:sub? ~> "/foo"');
	[url, ...vals] = raw('/:path/:sub?', '/foo', 1);
	t.is(url, '/foo', '~> parsed `url` correctly');
	t.same(vals, ['foo', undefined], '~> parsed value segments correctly');

	console.log('/:path/:sub? ~> "/foo/"');
	[url, ...vals] = raw('/:path/:sub?', '/foo/', 1);
	t.is(url, '/foo', '~> parsed `url` correctly');
	t.same(vals, ['foo', undefined], '~> parsed value segments correctly');


	console.log('/:path/:sub? ~> "/foo/bar"');
	[url, ...vals] = raw('/:path/:sub?', '/foo/bar', 1);
	t.is(url, '/foo/bar', '~> parsed `url` correctly');
	t.same(vals, ['foo', 'bar'], '~> parsed value segments correctly');

	console.log('/:path/:sub? ~> "/foo/bar/"');
	[url, ...vals] = raw('/:path/:sub', '/foo/bar/', 1);
	t.is(url, '/foo/bar', '~> parsed `url` correctly');
	t.same(vals, ['foo', 'bar'], '~> parsed value segments correctly');


	console.log('/:path/* ~> "/foo/bar/baz"');
	[url, ...vals] = raw('/:path/*', '/foo/bar/baz', 1);
	t.is(url, '/foo/bar/baz', '~> parsed `url` correctly');
	t.same(vals, ['foo', 'bar/baz'], '~> parsed value segments correctly');

	console.log('/:path/* ~> "/foo/bar/baz/"');
	[url, ...vals] = raw('/:path/*', '/foo/bar/baz/', 1);
	t.is(url, '/foo/bar/baz/', '~> parsed `url` correctly'); // trail
	t.same(vals, ['foo', 'bar/baz/'], '~> parsed value segments correctly');


	console.log('/foo/:path ~> "/foo/bar"');
	[url, ...vals] = raw('/foo/:path', '/foo/bar', 1);
	t.is(url, '/foo/bar', '~> parsed `url` correctly');
	t.same(vals, ['bar'], '~> parsed value segments correctly');

	console.log('/foo/:path ~> "/foo/bar/"');
	[url, ...vals] = raw('/foo/:path', '/foo/bar/', 1);
	t.is(url, '/foo/bar', '~> parsed `url` correctly');
	t.same(vals, ['bar'], '~> parsed value segments correctly');

	t.end();
});

test('(extra) exec', t => {
	// Not matches!
	console.log('/foo ~> "/foo/bar" (extra)');
	t.is(raw('/foo', '/foo/bar'), null, '~> does not match');

	console.log('/foo ~> "/foo/bar/" (extra)');
	t.is(raw('/foo/', '/foo/bar/'), null, '~> does not match');


	console.log('/:path ~> "/foo/bar" (extra)');
	t.is(raw('/:path', '/foo/bar'), null, '~> does not match');

	console.log('/:path ~> "/foo/bar/" (extra)');
	t.is(raw('/:path', '/foo/bar/'), null, '~> does not match');

	t.end();
});

test('(extra) exec :: loose', t => {
	console.log('/foo ~> "/foo/bar" (extra)');
	let [url, ...vals] = raw('/foo', '/foo/bar', 1);
	t.is(url, '/foo', '~> parsed `url` correctly');
	t.same(vals, [], '~> parsed value segments correctly');

	console.log('/foo ~> "/foo/bar/" (extra)');
	[url, ...vals] = raw('/foo/', '/foo/bar/', 1);
	t.is(url, '/foo', '~> parsed `url` correctly');
	t.same(vals, [], '~> parsed value segments correctly');


	console.log('/:path ~> "/foo/bar" (extra)');
	[url, ...vals] = raw('/:path', '/foo/bar', 1);
	t.is(url, '/foo', '~> parsed `url` correctly');
	t.same(vals, ['foo'], '~> parsed value segments correctly');

	console.log('/:path ~> "/foo/bar/" (extra)');
	[url, ...vals] = raw('/:path', '/foo/bar/', 1);
	t.is(url, '/foo', '~> parsed `url` correctly');
	t.same(vals, ['foo'], '~> parsed value segments correctly');

	t.end();
});

// ---

test('(RegExp) static', t => {
	let rgx = /^\/?books/;
	let { keys, pattern } = fn(rgx);
	t.same(keys, false, '~> keys = false');
	t.same(rgx, pattern, '~> pattern = input');
	t.true(pattern.test('/books'), '~> matches route');
	t.true(pattern.test('/books/'), '~> matches trailing slash');
	t.true(pattern.test('/books/'), '~> matches without leading slash');
	t.end();
});

test('(RegExp) param', t => {
	let rgx = /^\/(?<year>[0-9]{4})/i;
	let { keys, pattern } = fn(rgx);
	t.same(keys, false, '~> keys = false');
	t.same(rgx, pattern, '~> pattern = input');

	// RegExp testing (not regexparam related)
	t.false(pattern.test('/123'), '~> does not match 3-digit string');
	t.false(pattern.test('/asdf'), '~> does not match 4 alpha characters');
	t.true(pattern.test('/2019'), '~> matches definition');
	t.true(pattern.test('/2019/'), '~> matches definition w/ trailing slash');
	t.false(pattern.test('2019'), '~> does not match without lead slash');
	t.true(pattern.test('/2019/narnia/hello'), '~> allows extra bits');

	// exec results, array access
	let [url, value] = pattern.exec('/2019/books');
	t.is(url, '/2019', '~> executing pattern on correct trimming');
	t.is(value, '2019', '~> executing pattern gives correct value');

	// exec results, named object
	t.toExec(rgx, '/2019/books', { year: '2019' });
	t.toExec(rgx, '/2019/books/narnia', { year: '2019' });

	t.end();
});

test('(RegExp) param :: w/ static', t => {
	let rgx = /^\/books\/(?<title>[a-z]+)/i;
	let { keys, pattern } = fn(rgx);
	t.same(keys, false, '~> keys = false');
	t.same(rgx, pattern, '~> pattern = input');

	// RegExp testing (not regexparam related)
	t.false(pattern.test('/books'), '~> does not match naked base');
	t.false(pattern.test('/books/'), '~> does not match naked base w/ trailing slash');
	t.true(pattern.test('/books/narnia'), '~> matches definition');
	t.true(pattern.test('/books/narnia/'), '~> matches definition w/ trailing slash');
	t.true(pattern.test('/books/narnia/hello'), '~> allows extra bits');
	t.false(pattern.test('books/narnia'), '~> does not match path without lead slash');

	// exec results, array access
	let [url, value] = pattern.exec('/books/narnia');
	t.is(url, '/books/narnia', '~> executing pattern on correct trimming');
	t.is(value, 'narnia', '~> executing pattern gives correct value');

	// exec results, named object
	t.toExec(rgx, '/books/narnia', { title: 'narnia' });
	t.toExec(rgx, '/books/narnia/hello', { title: 'narnia' });

	t.end();
});

test('(RegExp) param :: multiple', t => {
	let rgx = /^\/(?<year>[0-9]{4})-(?<month>[0-9]{2})\/(?<day>[0-9]{2})/i;
	let { keys, pattern } = fn(rgx);
	t.same(keys, false, '~> keys = false');
	t.same(rgx, pattern, '~> pattern = input');

	// RegExp testing (not regexparam related)
	t.false(pattern.test('/123-1'));
	t.false(pattern.test('/123-10'));
	t.false(pattern.test('/1234-10'));
	t.false(pattern.test('/1234-10/1'));
	t.false(pattern.test('/1234-10/as'));
	t.true(pattern.test('/1234-10/01/'));
	t.true(pattern.test('/2019-10/30'));

	// exec results, array access
	let [url, year, month, day] = pattern.exec('/2019-05/30/');
	t.is(url, '/2019-05/30', '~> executing pattern on correct trimming');
	t.is(year, '2019', '~> executing pattern gives correct "year" value');
	t.is(month, '05', '~> executing pattern gives correct "month" value');
	t.is(day, '30', '~> executing pattern gives correct "day" value');

	// exec results, named object
	t.toExec(rgx, '/2019-10/02', { year:'2019', month:'10', day:'02' });
	t.toExec(rgx, '/2019-10/02/narnia', { year:'2019', month:'10', day:'02' });

	t.end();
});

test('(RegExp) param :: suffix', t => {
	let rgx = /^\/movies[/](?<title>\w+)\.mp4/i;
	let { keys, pattern } = fn(rgx);
	t.same(keys, false, '~> keys = false');
	t.same(rgx, pattern, '~> pattern = input');

	// RegExp testing (not regexparam related)
	t.false(pattern.test('/movies'));
	t.false(pattern.test('/movies/'));
	t.false(pattern.test('/movies/foo'));
	t.false(pattern.test('/movies/foo.mp3'));
	t.true(pattern.test('/movies/foo.mp4'));
	t.true(pattern.test('/movies/foo.mp4/'));

	// exec results, array access
	let [url, title] = pattern.exec('/movies/narnia.mp4');
	t.is(url, '/movies/narnia.mp4', '~> executing pattern on correct trimming');
	t.is(title, 'narnia', '~> executing pattern gives correct "title" value');

	// exec results, named object
	t.toExec(rgx, '/movies/narnia.mp4', { title: 'narnia' });
	t.toExec(rgx, '/movies/narnia.mp4/', { title: 'narnia' });

	t.end();
});

test('(RegExp) param :: suffices', t => {
	let rgx = /^\/movies[/](?<title>\w+)\.(mp4|mov)/i;
	let { keys, pattern } = fn(rgx);
	t.same(keys, false, '~> keys = false');
	t.same(rgx, pattern, '~> pattern = input');

	// RegExp testing (not regexparam related)
	t.false(pattern.test('/movies'));
	t.false(pattern.test('/movies/'));
	t.false(pattern.test('/movies/foo'));
	t.false(pattern.test('/movies/foo.mp3'));
	t.true(pattern.test('/movies/foo.mp4'));
	t.true(pattern.test('/movies/foo.mp4/'));
	t.true(pattern.test('/movies/foo.mov/'));

	// exec results, array access
	let [url, title] = pattern.exec('/movies/narnia.mov');
	t.is(url, '/movies/narnia.mov', '~> executing pattern on correct trimming');
	t.is(title, 'narnia', '~> executing pattern gives correct "title" value');

	// exec results, named object
	t.toExec(rgx, '/movies/narnia.mov', { title: 'narnia' });
	t.toExec(rgx, '/movies/narnia.mov/', { title: 'narnia' });

	t.end();
});

test('(RegExp) param :: optional', t => {
	let rgx = /^\/books[/](?<author>[^/]+)[/]?(?<title>[^/]+)?[/]?$/
	let { keys, pattern } = fn(rgx);
	t.same(keys, false, '~> keys = false');
	t.same(rgx, pattern, '~> pattern = input');

	// RegExp testing (not regexparam related)
	t.false(pattern.test('/books'));
	t.false(pattern.test('/books/'));
	t.true(pattern.test('/books/smith'));
	t.true(pattern.test('/books/smith/'));
	t.true(pattern.test('/books/smith/narnia'));
	t.true(pattern.test('/books/smith/narnia/'));
	t.false(pattern.test('/books/smith/narnia/reviews'));
	t.false(pattern.test('books/smith/narnia'));

	// exec results, array access
	let [url, author, title] = pattern.exec('/books/smith/narnia/');
	t.is(url, '/books/smith/narnia/', '~> executing pattern on correct trimming');
	t.is(author, 'smith', '~> executing pattern gives correct value');
	t.is(title, 'narnia', '~> executing pattern gives correct value');

	// exec results, named object
	t.toExec(rgx, '/books/smith/narnia', { author: 'smith', title: 'narnia' });
	t.toExec(rgx, '/books/smith/narnia/', { author: 'smith', title: 'narnia' });
	t.toExec(rgx, '/books/smith/', { author: 'smith', title: undefined });

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

test('(RegExp) nameless', t => {
	// For whatever reason~
	// ~> regexparam CANNOT give `keys` list cuz unknown
	let rgx = /^\/books[/]([^/]\w+)[/]?(\w+)?(?=\/|$)/i;
	let { keys, pattern } = fn(rgx);
	t.same(keys, false, '~> keys = false');
	t.same(rgx, pattern, '~> pattern = input');

	// RegExp testing (not regexparam related)
	t.false(pattern.test('/books'));
	t.false(pattern.test('/books/'));
	t.true(pattern.test('/books/smith'));
	t.true(pattern.test('/books/smith/'));
	t.true(pattern.test('/books/smith/narnia'));
	t.true(pattern.test('/books/smith/narnia/'));
	t.false(pattern.test('books/smith/narnia'));

	// exec results, array access
	let [url, author, title] = pattern.exec('/books/smith/narnia/');
	t.is(url, '/books/smith/narnia', '~> executing pattern on correct trimming');
	t.is(author, 'smith', '~> executing pattern gives correct value');
	t.is(title, 'narnia', '~> executing pattern gives correct value');

	// exec results, named object
	// Note: UNKNOWN & UNNAMED KEYS
	t.toExec(rgx, '/books/smith/narnia', {});
	t.toExec(rgx, '/books/smith/narnia/', {});
	t.toExec(rgx, '/books/smith/', {});

	t.end();
});
