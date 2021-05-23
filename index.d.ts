export function parse(route: string, loose?: boolean): {
	keys: string[];
	pattern: RegExp;
}

export function parse(route: RegExp): {
	keys: false;
	pattern: RegExp;
}
