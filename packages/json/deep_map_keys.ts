import { isJsonScalar, isPlainObject } from "./type_guards.ts";
import type { JsonArray, JsonObject, JsonValue } from "./types.ts";

/** @private */
function escape(s: string): string {
  const regex = /(\s|\.)/;
  return regex.test(s) ? `\"${s}\"` : s;
}

/** @private */
function idFn<T = unknown>(x: T): T {
  return x;
}

/** @private */
function deepMapKeysInternal(
  value: unknown,
  iteratee: (p: string) => string,
  skipList: Set<string>,
  refs: WeakSet<JsonObject | JsonArray> = new WeakSet<JsonObject | JsonArray>(),
  currentPath: Array<string> = [],
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
      const newKey = skipList.has(currentPath.concat(escape(k)).join("."))
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

/**
 * Returns a *new* JSON serializable object with the same values as
 * `input` where each own enumerable key of `input` is recursively
 * transformed by `iteratee`.
 *
 * @public
 *
 * @param input - A JSON value to process.
 * @param iteratee - The iteratee is invoked with the key name, and the returned
 * value becomes the new key name. The default iteratee is the identity
 * function if it is not provided.
 * @param skipList - A list of strings representing the path to some key in the
 * input object. If the key contains a space or a dot ('.') the key must be
 * enclosed in double or single quotes. For more info see the examples below.
 *
 * @throws If there is a circular reference in `input` or when `input` is not
 * JSON serializable.
 *
 * @example
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
 * const result = deepMapKeys(jsonObject, camelCase, [street_name]);
 *
 * const expected = {
 *   firstName: "John",
 *   lastName: "Doe",
 *   address: { streetName: "Main St" },
 * };
 *
 * assertEquals(result, expected);
 * ```
 * @example Using the skipList parameter
 * ```ts
 * const subject = [{
 *     dates_data: {
 *       "2024-07-30T05:00:00.000Z": { item_value: 42 },
 *       "2024-08-30T05:02:01.000Z": { item_value: 43 },
 *     },
 *   }];
 *   const skipList = ['[0].dates_data."2024-07-30T05:00:00.000Z"'];
 *   const result = deepMapKeys(subject, camelCase, skipList);
 *
 *   const expected = [{
 *     datesData: {
 *       "2024-07-30T05:00:00.000Z": { itemValue: 42 },
 *       "20240830T050201000Z": { itemValue: 43 },
 *     },
 *   }];
 *
 *   assertEquals(result, expected);
 * ```
 */
export function deepMapKeys(
  input: unknown,
  iteratee: (p: string) => string = idFn,
  skipList: Array<string> = [],
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

  const dedupedSkipList = new Set(skipList);
  const result = deepMapKeysInternal(input, iteratee, dedupedSkipList);

  return result;
}
