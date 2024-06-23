import { isJsonScalar, isPlainObject } from "./type_guards.ts";
import type { JsonArray, JsonObject, JsonValue } from "./types.ts";

function idFn<T = unknown>(x: T): T {
  return x;
}

function deepMapKeysInternal(
  value: unknown,
  iteratee: (p: string) => string,
  refs: WeakSet<JsonObject | JsonArray>,
): JsonValue {
  if (isJsonScalar(value)) {
    return value;
  }

  if (refs.has(value as JsonArray | JsonObject)) {
    throw new TypeError("Converting circular structure");
  } else {
    refs.add(value as JsonArray | JsonObject);
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepMapKeysInternal(item, iteratee, refs));
  }

  if (isPlainObject(value)) {
    return Object.entries(value).reduce((accumulator, [k, v]) => {
      const newKey = iteratee(k);
      if (v !== undefined) {
        accumulator[newKey] = deepMapKeysInternal(v, iteratee, refs);
      }

      return accumulator;
    }, {} as JsonObject);
  }

  throw new TypeError("Invalid type received");
}

/**
 * Returns a *new* a JSON serializable object with the same values as
 * `input` where each own enumerable key of `input` is recursively transformed by
 * `iteratee`. The optional iteratee is invoked with the key name, and the returned
 * value becomes the new key name.
 * The default iteratee is the identity function (this is useful for deep cloning).
 *
 * @throws If there is a circular reference in `input` or when `input` is not JSON serializable.
 *
 * @example Usage
 * ```ts
 * import { deepMapKeys } from "jsr:@y0n1/json/deepMapKeys";
 * import camelCase from "npm:lodash/camelCase.js";
 *
 * const jsonObject = {
 *   first_name: "John",
 *   last_name: "Doe",
 *   address: { street_name: "Main St" },
 * };
 *
 * const result = deepMapKeys(jsonObject, camelCase);
 *
 * const expected = {
 *   firstName: "John",
 *   lastName: "Doe",
 *   address: { streetName: "Main St" },
 * };
 *
 * assertEquals(result, expected);
 * ```
 */
export function deepMapKeys(
  input: unknown,
  iteratee: (p: string) => string = idFn,
): JsonValue {
  if (
    input === undefined ||
    (
      !isJsonScalar(input) &&
      !isPlainObject(input) &&
      !Array.isArray(input)
    )
  ) {
    throw new TypeError("Invalid argument type");
  }

  const refs = new WeakSet<JsonObject | JsonArray>();
  const result = deepMapKeysInternal(input, iteratee, refs);

  return result;
}
