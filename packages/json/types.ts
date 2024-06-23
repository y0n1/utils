/* Sourced from: https://github.com/backstage/backstage/blob/0c5aa5a0071aa5e7bebb68887cd0ebd238613685/packages/types/src/json.ts */

/** A type representing all allowed JSON scalar values. */
export type JsonScalar = number | string | boolean | null;

/** A type representing all allowed JSON object values. */
export type JsonObject = {
    [key in string]?: JsonValue;
};

/** A type representing all allowed JSON array values. */
export type JsonArray = Array<JsonValue>;

/** A type representing all allowed JSON values. */
export type JsonValue = JsonObject | JsonArray | JsonScalar;
