import {
  assert,
  assertEquals,
  assertFalse,
  assertThrows,
} from "jsr:@std/assert";
import camelCase from "npm:lodash/camelCase.js";
import { deepMapKeys } from "./deep_map_keys.ts";

Deno.test("json.ts/deepMapKeys", async (t) => {
  await t.step("should throw if there is a circular reference", () => {
    const a = { prop: {} };
    a.prop = a;

    try {
      assertThrows(() => deepMapKeys(a), TypeError);
    } catch (error) {
      assert(error.message, "Converting circular structure");
    }
  });

  await t.step("should throw if the passed value is not a JSON scalar", () => {
    try {
      assertThrows(() => deepMapKeys(new Set()), TypeError);
    } catch (error) {
      assert(error.message, "Invalid argument type received");
    }
  });

  await t.step(
    "should return a new empty object when an empty object is passed",
    () => {
      const expected = {};
      const actual = deepMapKeys({});

      assertEquals(actual, expected);
      assertFalse(actual === expected);
    },
  );

  await t.step(
    "should return the same value when the given value is a JSON scalar",
    () => {
      const scalars = [null, false, true, "some_string", 42];

      for (const v of scalars) {
        assertEquals(deepMapKeys(v, camelCase), v);
      }
    },
  );

  await t.step("should transform all the keys in the passed value", () => {
    const jsonObject = {
      first_name: "John",
      last_name: "Doe",
      address: { street_name: "Main St" },
    };

    const result = deepMapKeys(jsonObject, camelCase);

    assertEquals(result, {
      firstName: "John",
      lastName: "Doe",
      address: {
        streetName: "Main St",
      },
    });
  });

  await t.step("should discard keys with undefined values", () => {
    const expected = {};
    const actual = deepMapKeys({ prop: undefined });

    assertEquals(actual, expected);
  });

  await t.step(
    "should transform the keys of nested objects in JsonArrays",
    () => {
      const jsonArray = [
        {
          item_name: "Apple",
          item_price: 20,
        },
        [
          {
            l_1: {
              second_level: undefined,
              third_level: true,
            },
          },
        ],
        10,
        null,
        true,
        "foo_bar",
      ];

      const result = deepMapKeys(
        jsonArray,
        camelCase,
      );

      assertEquals(result, [
        {
          itemName: "Apple",
          itemPrice: 20,
        },
        [
          {
            l1: {
              thirdLevel: true,
            },
          },
        ],
        10,
        null,
        true,
        "foo_bar",
      ]);
    },
  );

  await t.step("should throw when passed undefined", () => {
    try {
      assertThrows(() => deepMapKeys(undefined), TypeError);
    } catch (error) {
      assertEquals(error.message, "Invalid argument type");
    }
  });
});
