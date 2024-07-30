import { deepMapKeysInternal, idFn } from "../private/deep_map_keys_lib.ts";
import { isJsonScalar, isPlainObject } from "./type_guards.ts";
import type { JsonValue } from "./types.ts";

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
 * @param skipList - A list of regular expresions representing the path to some
 * key in the input object. If the key contains a space or a dot the key must
 * be enclosed in double quotes.
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
 *   const skipList = [/"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z"$/];
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
  skipList: Array<RegExp> = [],
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

  const result = deepMapKeysInternal(input, iteratee, skipList);

  return result;
}
