import { isJsonScalar, isPlainObject } from "../public/type_guards.ts";
import { JsonArray, JsonObject, JsonValue } from "../public/types.ts";

/** @internal */
export function escape(s: string): string {
    const regex = /(\s|\.)/;
    return regex.test(s) ? `\"${s}\"` : s;
}

/** @internal */
export function idFn<T = unknown>(x: T): T {
    return x;
}

/** @internal */
export function debugPath(pathList: Array<string>) {
    console.log(pathList.join("."));
}

/** @internal */
export function deepMapKeysInternal(
    value: unknown,
    iteratee: (p: string) => string,
    skipList: Array<RegExp>,
    refs: WeakSet<JsonObject | JsonArray> = new WeakSet<
        JsonObject | JsonArray
    >(),
    currentPath: Array<string> = [],
    enableDebug: boolean = false,
): JsonValue {
    if (enableDebug) {
        debugPath(currentPath);
    }

    if (isJsonScalar(value)) {
        return value;
    }

    if (refs.has(value as JsonArray | JsonObject)) {
        throw new TypeError("Converting circular structure");
    } else {
        refs.add(value as JsonArray | JsonObject);
    }

    if (Array.isArray(value)) {
        return value.map((item, idx) => {
            const mapped = deepMapKeysInternal(
                item,
                iteratee,
                skipList,
                refs,
                currentPath.concat(`[${idx}]`),
            );
            return mapped;
        }).filter((v) => typeof v !== "undefined");
    }

    if (isPlainObject(value)) {
        return Object.entries(value).reduce((accumulator, [k, v]) => {
            const nextPath = currentPath.concat(escape(k)).join(".");
            const newKey = skipList.some((re) => re.test(nextPath))
                ? k
                : iteratee(k);
            if (v !== undefined) {
                accumulator[newKey] = deepMapKeysInternal(
                    v,
                    iteratee,
                    skipList,
                    refs,
                    currentPath.concat(escape(k)),
                );
            }

            return accumulator;
        }, {} as JsonObject);
    }

    throw new TypeError("Invalid type received");
}
