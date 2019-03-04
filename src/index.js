export default function (str) {
	// This captures:
	//   1. Leading slash, if any (unused... non-capturing group adds bytes).
	//   2. Key type, if any.
	//   3. Key name (or constant path component).
	//   4. Optional flag.
	var match, keys=[], pattern='', re=/(\/|^)([:*])?([^\/]*?)(\?)?(?=\/|$)/g;

	// An empty input string will match and not update `lastIndex`, leading to
	// an infinite loop. The default to '/' avoids this.
	while (match = re.exec(str || '/')) {
		if (match[2] === '*') {
			keys.push('wild');
			pattern += '/(.*)';
		} else if (match[2] === ':') {
			keys.push( match[3] );
			pattern += match[4] ? '(?:/([^/]+?))?' : '/([^/]+?)';
		} else {
			pattern += '/' + match[3];
		}
	}

	return {
		keys: keys,
		pattern: new RegExp('^' + pattern + (keys.length ? '(?:/)?' : '') + '\/?$', 'i')
	};
}
