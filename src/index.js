let sep = '/';
function test(str) {
	let c, o, l, arr=str.split(sep);
	(arr[0] === '') && arr.shift();

	let i=0, tmp, keys=[], pattern='';
	for (; i < arr.length; i++) {
		l = (tmp=arr[i]).length;
		if (l === 0) continue;
		c = tmp.charCodeAt(0);
		if (c === 42) {
			keys.push('wild');
			pattern += sep + '(.*)';
		} else if (c === 58) {
			o = tmp.charCodeAt(l-1) === 63; // optional?
			keys.push( tmp.substring(1, o ? l-1 : l) );
			pattern += o ? '(?:/([^/]+?))?(?:/)?' : sep + '([^/]+?)?';
		} else {
			pattern += sep + tmp;
		}
	}
	pattern = new RegExp('^' + pattern + '\/?$', 'i');
	return { keys, pattern };
}
