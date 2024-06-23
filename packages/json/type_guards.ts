import type { JsonArray, JsonObject, JsonScalar, JsonValue } from "./types.ts";

/** Recusrsively check if `value` can be regarded as a JsonArray. */
export function isJsonArray(value: unknown): value is JsonArray {
    return Array.isArray(value) && value.every(isJsonValue);
}

/** Recusrsively check if `value` can be regarded as a JsonObject. */
export function isJsonObject(value: unknown): value is JsonObject {
    return (
        isPlainObject(value) &&
        Object.values(value).every(isJsonValue)
    );
}

/** Checks if `value` is a `number`, `string`, `boolean` or `null`. */
export function isJsonScalar(value: unknown): value is JsonScalar {
    return (
        typeof value === "number" ||
        typeof value === "string" ||
        typeof value === "boolean" ||
        value === null
    );
}

/** Recusrsively check if `value` can be regarded as a `JsonScalar`, `JsonArray` or `JsonObject`. */
export function isJsonValue(value: unknown): value is JsonValue {
    return isJsonScalar(value) || isJsonArray(value) || isJsonObject(value);
}

/** Checks if `value` is a plain object */
export function isPlainObject(value: unknown): value is object {
    return value?.constructor.name === "Object";
}
