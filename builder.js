const fs = require('fs');
const mkdir = require('mk-dirs');
const { minify } = require('terser');
const pretty = require('pretty-bytes');
const sizer = require('gzip-size');
const pkg = require('./package');

let data = fs.readFileSync('src/index.js', 'utf8');

mkdir('dist').then(_ => {
	// Copy as is for ESM
	fs.writeFileSync(pkg.module, data);

	// Mutate exports for CJS
	data = data.replace(/export default/, 'module.exports =');
	fs.writeFileSync(pkg.main, data);

	// Uglify & print gzip size
	const { code } = minify(data, { toplevel:true });
	console.log(`> gzip size: ${pretty(sizer.sync(code))}`);
});
