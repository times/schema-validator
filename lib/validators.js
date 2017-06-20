/**
 * Check functions should return an array of error strings
 */

const { isObject, isArray, isDate, typechecks } = require('./helpers');
const { ok, err, toResult } = require('./result');

// This will move later
Array.prototype.toResult = toResult;

/**
 * Is the given data an object?
 */
module.exports.validateIsObject = schema => data =>
  (isObject(data) ? ok() : err([`Data was not an object`]));

/**
 * Is the given data an array?
 */
module.exports.validateIsArray = schema => data =>
  (isArray(data) ? ok() : err([`Data was not an array`]));

/**
 * Are all the required object fields present?
 */
module.exports.validateRequiredFields = schema => data =>
  Object.keys(schema)
    .filter(k => schema[k].required)
    .filter(k => !data.hasOwnProperty(k))
    .map(k => `Missing required field "${k}"`)
    .toResult();

/**
 * Are there any extra object fields present?
 */
module.exports.validateExtraFields = schema => data =>
  Object.keys(data)
    .filter(k => !schema.hasOwnProperty(k))
    .map(k => `Extra field "${k}"`)
    .toResult();

/**
 * Does each object field typecheck?
 */
module.exports.validateFieldsTypecheck = schema => data =>
  Object.keys(data)
    .filter(k => schema[k] && schema[k].hasOwnProperty('type'))
    .filter(k => !typechecks(data[k], schema[k].type))
    .map(k => `Field "${k}" failed to typecheck (expected ${schema[k].type})`)
    .toResult();

/**
 * Does each array item typecheck?
 */
module.exports.validateItemsTypecheck = ({ type }) => data =>
  data
    .filter(d => !typechecks(d, type))
    .map(d => `Item "${d}" failed to typecheck (expected ${type})`)
    .toResult();

/**
 * For each object field, check that its predicates succeed (if it has any)
 */
module.exports.validateFieldPredicates = schema => data =>
  Object.keys(data)
    .filter(k => schema[k] && schema[k].hasOwnProperty('predicates'))
    // Apply all the predicates for the given field and flatten the result
    .reduce(
      (errs, k) => [
        ...errs,
        ...schema[k].predicates
          .filter(p => !p.test(data[k]))
          .map(p => p.onError(data[k])),
      ],
      []
    )
    .toResult();

/**
 * If there are predicates, do they succeed for every array item?
 */
module.exports.validateArrayPredicates = ({ predicates }) => data =>
  (predicates
    ? predicates
        // Apply the predicates to every array item and flatten the error arrays
        .reduce(
          (errs, p) => [
            ...errs,
            ...data.filter(d => !p.test(d)).map(p.onError),
          ],
          []
        )
    : []).toResult();

/**
 * If any object fields have schemaValidators attached, do they succeed?
 */
module.exports.validateFieldSchemaValidators = schema => data =>
  Object.keys(data)
    .filter(k => schema[k].hasOwnProperty('schemaValidator'))
    // Apply the nested schemaValidator and flatten the error arrays
    .reduce(
      (errs, k) => [
        ...errs,
        ...schema[k]
          .schemaValidator(data[k])
          .errors.map(e => `At field "${k}": ${e}`),
      ],
      []
    )
    .toResult();

/**
 * If the array has a schemaValidator attached, does it succeed?
 */
module.exports.validateArraySchemaValidator = ({ schemaValidator }) => data =>
  (schemaValidator
    ? data
        // Apply the schemaValidator to every item and flatten the error arrays
        .map(schemaValidator)
        .reduce(
          (errs, res, i) => [
            ...errs,
            ...res.errors.map(e => `At item ${i}: ${e}`),
          ],
          []
        )
    : []).toResult();
