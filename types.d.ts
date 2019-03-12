export interface RouteParsed {
	keys: Array<string>,
	pattern: RegExp
}
declare const regexparam: (route: string, loose?: boolean) => RouteParsed;
export default regexparam;
