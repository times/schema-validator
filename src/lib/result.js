// @flow
import {
  addIndex,
  concat,
  map,
  mapObjIndexed as mapObj,
  merge,
  mergeWith,
  reduce,
} from 'ramda';

/**
 * Error messages are represented as strings
 */
export type Errors = Array<string>;

/**
 * A Result can be OK, which is valid, or an Err, which is invalid. An Err contains
 * an array of errors, an optional type, and optional nested error items
 */
type OK = {| valid: true |};

type Items = {
  [string]: Result,
};

type ErrType = 'array' | 'object';

type Err = {|
  valid: false,
  errors: Errors,
  type?: ErrType,
  items?: Items,
|};

export type Result = OK | Err;

/**
 * Constructs an OK result
 */
type _ok = () => OK;
export const ok: _ok = () => ({ valid: true });

/**
 * Constructs an Err result
 */
type _err = (errors?: string | Errors) => Result;
export const err: _err = (errors = []) => ({
  valid: false,
  errors: Array.isArray(errors) ? errors : [errors],
});

/**
 * Constructs an Err result with nested errors
 */
type NestedErr = (ErrType, Items) => Result;
export const nestedErr: NestedErr = (type, items) => ({
  valid: false,
  errors: [],
  type,
  items,
});

/**
 * Is the given result OK?
 */
type IsOK = Result => boolean;
export const isOK: IsOK = ({ valid }) => valid === true;

/**
 * Is the given result an Err?
 */
type IsErr = Result => boolean;
export const isErr: IsErr = ({ valid }) => valid === false;

/**
 * Applies a function to every error in a Result
 */
type MapErrors = ((string, number) => string) => Result => Result;
export const mapErrors: MapErrors = f => r => {
  if (r.valid) return r;

  const withMappedErrors = {
    valid: false,
    errors: addIndex(map)(f, r.errors),
  };

  return r.items
    ? merge(withMappedErrors, { items: mapObj(mapErrors(f), r.items) })
    : withMappedErrors;
};

/**
 * Combines two results, which must be of the same type ('array' or 'object').
 * Nested results will be recursively merged
 */
type MergeResults = (Result, Result) => Result;
export const mergeResults: MergeResults = (r1, r2) => {
  // If either result is valid we can safely return the other
  if (r1.valid) return r2;
  if (r2.valid) return r1;

  // Otherwise merge the errors
  const result = {
    valid: false,
    errors: concat(r1.errors, r2.errors),
    type: r1.type || r2.type,
  };

  return r1.items || r2.items
    ? merge(result, {
        items: mergeWith(mergeResults, r1.items || {}, r2.items || {}),
      })
    : result;
};

/**
 * Combines an array of results, which must all be of the same type ('array' or
 * 'object')
 */
type ConcatResults = (Array<Result>) => Result;
export const concatResults: ConcatResults = reduce(mergeResults, ok());
