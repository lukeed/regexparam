const fs = require('fs');
const mkdir = require('mk-dirs');
const { minify } = require('terser');
const imports = require('rewrite-imports');
const pretty = require('pretty-bytes');
const sizer = require('gzip-size');
const pkg = require('./package');

let data = fs.readFileSync('src/index.js', 'utf8');

mkdir('dist').then(_ => {
	// Copy as is for ESM
	let es5 = data.replace(/let/g, 'var').replace('{ keys, pattern }', '{ keys:keys, pattern:pattern }');
	fs.writeFileSync(pkg.module, es5);

	// Mutate imports for CJS
	data = imports(data).replace(/export default/, 'module.exports =');
	fs.writeFileSync(pkg.main, data);

	// Uglify & print gzip size
	const { code } = minify(data, { toplevel:true });
	const int = sizer.sync(code);
	console.log(`> gzip size: ${pretty(int)}`);
});
