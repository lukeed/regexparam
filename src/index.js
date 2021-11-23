export function parse(str, loose) {
	if (str instanceof RegExp) return { keys: false, pattern: str };
	var c, o, p, tmp, ext, keys = [], pattern = '', arr = str.split('/');
	arr[0] || arr.shift();

	while (tmp = arr.shift()) {
		c = tmp[0];
		if (c === '*') {
			keys.push('wild');
			pattern += '/(.*)';
		} else if (c === ':') {
			p = tmp.indexOf('(', 1);
			ext = tmp.indexOf('.', 1);
			if (~p  && (ext < 0 || ext > p)) {
				o = tmp.slice(p);
				tmp = tmp.slice(0, p);
				p = o;
			} else {
				p = '([^/]+?)';
			}
			o = tmp.indexOf('?', 1);
			keys.push(tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length));
			pattern += !!~o && !~ext ? '(?:/' + p + ')?' : '/' + p;
			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
		} else {
			pattern += '/' + tmp;
		}
	}

	return {
		keys: keys,
		pattern: new RegExp('^' + pattern + (loose ? '(?=$|/)' : '/?$'), 'i'),
	};
}

var RGX = /*#__PURE__*/ /(\/|^)([:*][^/]*?)(\?|\(.+?\))?(?=[/.]|$)/g;

// error if key missing?
export function inject(route, values) {
	return route.replace(RGX, (x, lead, key, optional) => {
		x = values[key == '*' ? 'wild' : key.substring(1)];
		return x ? '/' + x : optional || key == '*' ? '' : '/' + key;
	});
}
