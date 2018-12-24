export default function (str) {
	var c, o, tmp, keys=[], pattern='', arr=str.split('/');
	arr[0] || arr.shift();

	while (tmp = arr.shift()) {
		c = tmp.charCodeAt(0);
		if (c === 42) {
			keys.push('wild');
			pattern += '/(.*)';
		} else if (c === 58) {
			o = tmp.charCodeAt(tmp.length - 1) === 63; // optional?
			keys.push( tmp.substring(1, o ? tmp.length - 1 : tmp.length) );
			pattern += o ? '(?:/([^/]+?))?' : '/([^/]+?)';
		} else {
			pattern += '/' + tmp;
		}
	}
	keys.length && (pattern += '(?:/)?');
	return {
		keys: keys,
		pattern: new RegExp('^' + pattern + '\/?$', 'i')
	};
}
