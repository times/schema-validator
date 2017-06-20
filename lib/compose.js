const { isOK, ok, isErr, err } = require('./result');
const {
  validateIsObject,
  validateIsArray,
  validateRequiredFields,
  validateExtraFields,
  validateFieldPredicates,
  validateArrayPredicates,
  validateFieldsTypecheck,
  validateItemsTypecheck,
  validateFieldSchemaValidators,
  validateArraySchemaValidator,
} = require('./validators');

/**
 * Composes a series of validators (left-to-right) such that all of the
 * validators must succeed. Otherwise, returns the first set of errors.
 * All validators are passed the same schema and data
 */
const allOf = (...validators) => schema => data =>
  validators.reduce((res, v) => (isOK(res) ? v(schema)(data) : res), ok());

/**
 * Composes a series of validators that are already applied to schemas,
 * such that at least one of the validators must succeed. Otherwise, returns
 * all of the errors
 */
const someOf = (...validatorsWithSchemas) => data =>
  validatorsWithSchemas.reduce((res, v) => {
    if (isOK(res)) return res;
    const vRes = v(data);
    return isErr(vRes) ? err([...res.errors, ...vRes.errors]) : vRes;
  }, err());

/**
 * Precomposed validator for objects
 */
const objectValidator = allOf(
  validateIsObject,
  validateRequiredFields,
  validateExtraFields,
  validateFieldsTypecheck,
  validateFieldPredicates,
  validateFieldSchemaValidators
);

/**
 * Precomposed validator for arrays
 */
const arrayValidator = allOf(
  validateIsArray,
  validateItemsTypecheck,
  validateArrayPredicates,
  validateArraySchemaValidator
);

module.exports = {
  allOf,
  someOf,
  objectValidator,
  arrayValidator,
};
