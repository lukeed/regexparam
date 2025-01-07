export function parse(route: string, loose?: boolean): {
	keys: string[];
	pattern: RegExp;
}

export function parse(route: RegExp): {
	keys: false;
	pattern: RegExp;
}

type KeyRecord<T extends string> =
	T extends `${infer P}?` // :id?
		? { [K in P]?: string | undefined }
	: T extends `${infer P}.${string}` // :id.ext
		? { [K in P]: string }
	: { [K in T]: string };

export type RouteParams<T extends string> =
	T extends `${infer Prev}/*/${infer Rest}`
		? RouteParams<Prev> & { wild: string } & RouteParams<`/${Rest}`>
	: T extends `:${infer Rest}`
		? RouteParams<`/:${Rest}`>
	: T extends `${string}/:${infer P}/${infer Rest}`
		? KeyRecord<P> & RouteParams<`/${Rest}`>
	: T extends `${string}/:${infer P}`
		? KeyRecord<P>
	: T extends `${string}/*`
		? { "*": string }
	: T extends `${string}/*?`
		? { "*"?: string | undefined }
	: {};

export function inject<T extends string>(route: T, values: RouteParams<T>): string;
