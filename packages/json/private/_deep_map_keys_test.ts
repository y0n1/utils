import {
  assert,
  assertEquals,
  assertFalse,
  assertThrows,
} from "jsr:@std/assert";
import camelCase from "npm:lodash/camelCase.js";
import { deepMapKeys } from "../public/deep_map_keys.ts";
import type { JsonArray } from "../public/types.ts";

Deno.test("deepMapKeys", async (t) => {
  await t.step({
    ignore: false,
    name: "should throw if there is a circular reference",
    fn: () => {
      const a = { prop: {} };
      a.prop = a;

      try {
        assertThrows(() => deepMapKeys(a), TypeError);
      } catch (error) {
        assert(error.message, "Converting circular structure");
      }
    },
  });

  await t.step({
    ignore: false,
    name: "should throw if the passed value is not a JSON scalar",
    fn: () => {
      try {
        assertThrows(() => deepMapKeys(new Set()), TypeError);
      } catch (error) {
        assert(error.message, "Invalid argument type received");
      }
    },
  });

  await t.step({
    ignore: false,
    name: "should return a new empty object when an empty object is passed",
    fn: () => {
      const expected = {};

      const actual = deepMapKeys({});

      assertEquals(actual, expected);
      assertFalse(actual === expected);
    },
  });

  await t.step({
    ignore: false,
    name: "should return a new empty array when an empty array is passed",
    fn: () => {
      const expected: JsonArray = [];

      const actual = deepMapKeys(expected, camelCase);

      assertEquals(actual, expected);
      assertFalse(actual === expected);
    },
  });

  await t.step({
    ignore: false,
    name: "should return the same value when the given value is a JSON scalar",
    fn: () => {
      const scalars = [null, false, true, "some_string", 42];

      for (const v of scalars) {
        assertEquals(deepMapKeys(v, camelCase), v);
      }
    },
  });

  await t.step({
    ignore: false,
    name: "should transform all the keys in the passed value",
    fn: () => {
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
    },
  });

  await t.step({
    ignore: false,
    name: "should discard keys with undefined values",
    fn: () => {
      const expected = {};
      const actual = deepMapKeys({ prop: undefined });

      assertEquals(actual, expected);
    },
  });

  await t.step({
    ignore: false,
    name: "should transform the keys of nested objects into JSON arrays",
    fn: () => {
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
  });

  await t.step({
    ignore: false,
    name: "should throw when passed undefined",
    fn: () => {
      try {
        assertThrows(() => deepMapKeys(undefined), TypeError);
      } catch (error) {
        assertEquals(error.message, "Invalid argument type");
      }
    },
  });

  await t.step({
    ignore: false,
    name: "should omit keys matching patterns in the skip list",
    fn: () => {
      const KEY1 = "some-very weird:key";
      const KEY2 = "2024-07-30T05:13:15.416Z";

      const subject = {
        first_key: {
          second_key: {
            third_key: {
              [KEY1]: { item_value: 42 },
            },
            [KEY2]: { item_value: 43 },
          },
        },
      };

      const skipList = [
        /first_key\.second_key\.third_key\."some-very weird:key"$/,
        /first_key\.second_key\."2024-07-30T05:13:15\.416Z"$/,
      ];

      const result = deepMapKeys(subject, camelCase, skipList);
      const expected = {
        firstKey: {
          secondKey: {
            thirdKey: {
              [KEY1]: { itemValue: 42 },
            },
            [KEY2]: { itemValue: 43 },
          },
        },
      };
      assertEquals(result, expected);
    },
  });

  await t.step({
    ignore: false,
    name: "should omit keys listed in the skip list for JSON arrays",
    fn: () => {
      const KEY1 = "some-very weird:key";
      const KEY2 = "2024-07-30T05:13:15.416Z";

      const subject = [{
        first_key: {
          second_key: {
            third_key: {
              [KEY1]: { item_value: 42 },
            },
            [KEY2]: { item_value: 43 },
          },
        },
      }];

      const skipList = [
        /\[0\]\.first_key\.second_key\.third_key\."some-very weird:key"$/,
        /\[0\]\.first_key\.second_key\."2024-07-30T05:13:15\.416Z"$/,
      ];

      const result = deepMapKeys(subject, camelCase, skipList);
      const expected = [{
        firstKey: {
          secondKey: {
            thirdKey: {
              [KEY1]: { itemValue: 42 },
            },
            [KEY2]: { itemValue: 43 },
          },
        },
      }];

      assertEquals(result, expected);
    },
  });

  await t.step({
    ignore: false,
    name:
      "should process all entries when the skip list contains an empty string",
    fn: () => {
      const KEY1 = "some-very weird:key";
      const KEY2 = "2024-07-30T05:13:15.416Z";

      const subject = [{
        first_key: {
          second_key: {
            third_key: {
              [KEY1]: { item_value: 42 },
            },
            [KEY2]: { item_value: 43 },
          },
        },
      }];

      const skipList = [/""/];

      const result = deepMapKeys(subject, camelCase, skipList);
      assertEquals(result, [{
        firstKey: {
          secondKey: {
            thirdKey: {
              "someVeryWeirdKey": { itemValue: 42 },
            },
            "20240730T051315416Z": { itemValue: 43 },
          },
        },
      }]);
    },
  });

  await t.step({
    ignore: false,
    name: "should work with the 2nd example from the docs",
    fn: () => {
      const subject = [{
        dates_data: {
          "2024-07-30T05:00:00.000Z": { item_value: 42 },
          "2024-08-30T05:02:01.000Z": { item_value: 43 },
        },
      }];
      const skipList = [/"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z"$/];
      const result = deepMapKeys(subject, camelCase, skipList);

      const expected = [{
        datesData: {
          "2024-07-30T05:00:00.000Z": { itemValue: 42 },
          "2024-08-30T05:02:01.000Z": { itemValue: 43 },
        },
      }];

      assertEquals(result, expected);
    },
  });
});
