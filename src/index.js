export default function (str) {
	var c, o, tmp, keys=[], pattern='', arr=str.split('/');
	arr[0] || arr.shift();

	while (tmp = arr.shift()) {
		c = tmp[0];
		if (c === '*') {
			keys.push('wild');
			pattern += '/(.*)';
		} else if (c === ':') {
			o = tmp[tmp.length - 1] === '?'; // optional?
			keys.push( tmp.substring(1, o ? tmp.length - 1 : tmp.length) );
			pattern += o ? '(?:/([^/]+?))?' : '/([^/]+?)';
		} else {
			pattern += '/' + tmp;
		}
	}

	return {
		keys: keys,
		pattern: new RegExp('^' + pattern + (keys.length ? '(?:/)?' : '') + '\/?$', 'i')
	};
}
