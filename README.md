# Data Validator

The Times `data-validator` library provides a simple, composable way to verify the structures and values of your JavaScript data.

```js
const { objectValidator, getErrors } = require('@times/data-validator');

const personSchema = {
  name: { type: 'string', required: true },
  age: { type: 'number', required: false },
};

const validatePerson = objectValidator(personSchema);

const result1 = validatePerson({ name: 'Alice', age: 23 });
getErrors(result1); //=> []

const result2 = validatePerson({ name: 'Bob', age: 'thirty' });
getErrors(result2); //=> [`At field "age": "thirty" failed to typecheck (expected number)`]
```

You can install the package from [npm](https://www.npmjs.com/package/@times/data-validator):

    yarn add @times/data-validator

## Contributing

[![Build Status](https://travis-ci.org/times/data-validator.svg?branch=master)](https://travis-ci.org/times/data-validator) [![Code coverage](https://codecov.io/gh/times/data-validator/branch/master/graph/badge.svg)](https://codecov.io/gh/times/data-validator) [![npm version](https://badge.fury.io/js/%40times%2Fdata-validator.svg)](https://badge.fury.io/js/%40times%2Fdata-validator)

Pull requests are very welcome. Please include a clear description of any changes, and full test coverage.

During development you can run tests with

    yarn test

The library uses Flow for type checking. You can run Flow with

    yarn flow

You can build the project with

    yarn build

The build process uses Rollup to generate UMD and ES module versions of the bundle.

## Docs

- [Typechecking](#typechecking)
  - [isISOString](#isisostring)
  - [isDate](#isdate)
  - [isObject](#isobject)
  - [isArray](#isarray)
  - [isNull](#isnull)
  - [isType](#istype)
- [Default validators](#default-validators)
  - [alwaysErr](#alwayserr)
  - [alwaysOK](#alwaysok)
  - [fromPredicate](#frompredicate)
  - [validateIsType](#validateistype)
  - [validateIsIn](#validateisin)
  - [validateIsObject](#validateisobject)
  - [validateObjHasKey](#validateobjhaskey)
  - [validateObjFields](#validateobjfields)
  - [validateObjPropHasType](#validateobjprophastype)
  - [validateObjPropPasses](#validateobjproppasses)
  - [validateObjOnlyHasKeys](#validateobjonlyhaskeys)
  - [validateIsArray](#validateisarray)
  - [validateArrayItems](#validatearrayitems)
  - [validateArrayItemsHaveType](#validatearrayitemshavetype)
- [Composing validators](#composing-validators)
  - [allWhileOK](#allwhileok)
  - [all](#all)
  - [some](#some)
- [Results](#results)
  - [ok](#ok)
  - [err](#err)
  - [nestedErr](#nestederr)
  - [isOK](#isok)
  - [isErr](#iserr)
  - [mapErrors](#maperrors)
  - [mergeResults](#mergeresults)
  - [concatResults](#concatresults)
- [Extracting errors](#extracting-errors)
  - [printVerbose](#printverbose)
  - [getErrors](#geterrors)
- [Working with schemas](#working-with-schemas)

### Typechecking

The validator library provides some typechecking helper functions out of the box. They all accept a value and return a boolean.

#### isISOString

Tests whether the value is a valid ISO8601 date string.

```js
isISOString('2018-07-04'); //=> true

isISOString('tuesday'); //=> false
```

#### isDate

Tests whether the value is either a date object or a valid (ISO8601) date string.

```js
isDate(new Date('2017-07-07')); //=> true

isDate(new Array()); //=> false
```

#### isObject

Tests whether the value is an object (but not an array or date).

```js
isObject({ x: 1, y: 2 };); //=> true

isObject([1, 2]); //=> false
```

#### isArray

Tests whether the value is an array.

```js
isArray(['a', 'b']); //=> true

isArray({ a: 'b' }); //=> false
```

#### isNull

Tests whether the value is null.

```js
isNull(null); //=> true

isNull(undefined); //=> false
```

#### isType

Tests whether the value is of the given type, using `typeof`. This is useful for cases where the library doesn't have a specific function built in.

```js
const isNumber = isType('number');

isNumber(47); //=> true

isNumber('47'); //=> false
```

### Default validators

A validator is a function that accepts some data and returns a [Result](#results). Most of the time you will probably want to write your own custom logic or use a [schema](#working-with-schemas), but the library exports some default validators for common use cases.

#### alwaysErr

Creates a validator that always returns the given error. Accepts either an error string or an array of error strings.

```js
const validate = alwaysErr('Uh oh');

getErrors(validate(5)); //=> ["Uh oh"]
```

#### alwaysOK

Creates a validator that always succeeds.

```js
const validate = alwaysOK();

isOK(validate(123)); //=> true
```

#### fromPredicate

Creates a validator from a predicate function. The first argument is the predicate, which accepts data and returns a boolean. The second is a function that accepts the same data and returns an error string, which will be used if the predicate fails.

```js
const validate = fromPredicate(
  n => n >= 3,
  n => `Validation failed: ${n} was less than 3`
);

isOK(validate(5)); //=> true

getErrors(validate(2)); //=> ["Validation failed: 2 was less than 3"]
```

#### validateIsType

Validates that the data is of the specified type.

```js
const validate = validateIsType('number');

isOK(validate(5)); //=> true

isErr(validate('thirty')); //=> true
```

#### validateIsIn

Validates that the data is in the specified array, according to the ES6 [`.includes`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes) method.

```js
const validate = validateIsIn(['a', 'b']);

getErrors(validate('c')); //=> [`Value must be one of a, b (got "c")`]
```

#### validateIsObject

Validates that the data is an object.

```js
isOK(validateIsObject({ x: 1 })); //=> true
```

#### validateObjHasKey

Validates that an object has the specified key, according to [`.hasOwnProperty`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty).

```js
const validate = validateObjHasKey('name');

getErrors(validate({ age: 23 })); //=> [`Missing required field "name"`]
```

#### validateObjFields

Runs a validator on every field of an object and aggregates the results.

```js
const validateFieldsAreObjects = validateObjFields(validateIsObject);

const result = validateFieldsAreObjects({ a: {}, b: {}, c: 2 });

getErrors(result); //=> [`At field "c": 2 failed to typecheck (expected object)`]
```

#### validateObjPropHasType

Validates that the given object property typechecks. If the property does not exist the validation will succeed.

```js
const validate = validateObjPropHasType('number')('y');

isOK(validate({ x: 1 })); //=> true

getErrors(validate({ x: 1, y: '2' })); //=> [`At field "y": "2" failed to typecheck (expected number)`]
```

#### validateObjPropPasses

Validates that the given object property passes the given validator. If the property does not exist the validation will succeed.

```js
const validate = validateObjPropPasses(validateIsIn([1, 2]))('y');

isOK(validate({ x: 1 })); //=> true

getErrors(validate({ x: 1, y: 3 })); //=> [`At field "y": Value must be one of 1, 2 (got "3")`]
```

#### validateObjOnlyHasKeys

Validates that an object only has keys in the specified array. The object does not have to have all of the keys in the array.

```js
const validate = validateObjOnlyHasKeys(['x', 'y']);

isOK(validate({ x: 1 })); //=> true

getErrors(validate({ x: 1, y: 2, z: 3 })); //=> [`Extra field "z"`]
```

#### validateIsArray

Validates that the data is an array.

```js
isOK(validateIsArray([1, 2, 3])); //=> true
```

#### validateArrayItems

Runs a validator on every item in an array and aggregates the results. An empty array will succeed.

```js
const validateItemsAreObjects = validateArrayItems(validateIsObject);

const result = validateItemsAreObjects([{ x: 1 }, { y: 2 }, 3]);

getErrors(result); //=> [`At item 2: "3" failed to typecheck (expected object)`]
```

#### validateArrayItemsHaveType

Validates that every item in an array has the specified type. An empty array will succeed.

```js
const validate = validateArrayItemsHaveType('string');

getErrors(validate(['one', 2, 'three'])); //=> [`At item 1: "2" failed to typecheck (expected string)`]
```

### Composing validators

For more complex validation logic you will probably want to combine a series of smaller validators into one larger validator. The library provides several functions to compose validators like this.

Each composition function accepts an array of validators (functions that accept some data and return a [Result](#results)) and returns a new validator. The data passed to the composed validator will be passed to each of the validators in turn.

#### allWhileOK

Runs an array of validators in order until one of them fails. The failing validator's errors will be returned. Succeeds if all of the validators succeed.

This is useful for when one validator depends on another - for example, to check that a value is a string before checking its `length` property.

```js
const validateIsString = validateIsType('string');

const validateIsShortWord = fromPredicate(
  word => word.length < 5,
  word => `"${word}" was too long`
);

const validateStartsWithA = fromPredicate(
  word => word.charAt(0) === 'A',
  word => `"${word}" did not start with A`
);

const validateWord = allWhileOK([
  validateIsString,
  validateIsShortWord,
  validateStartsWithA,
]);

getErrors(validateWord(123)); //=> [`123 failed to typecheck (expected string)`]

getErrors(validateWord('abracadabra')); //=> [`"abracadabra" was too long`]

getErrors(validateWord('tea')); //=> [`"tea" did not start with A`]

isOK(validateWord('Andy')); //=> true
```

#### all

Runs an array of validators in order and returns the combined errors of any validators that fail. Succeeds if all of the validators succeed.

This is well suited for times when the individual validators do not depend on each other.

```js
const validateIsNotNull = fromPredicate(
  val => !isNull(val),
  () => `Value was null`
);

const validateIsNotUndefined = fromPredicate(
  val => !isType('undefined')(val),
  () => `Value was undefined`
);

const validateIsNotVoid = all([validateIsNotNull, validateIsNotUndefined]);

getErrors(validateIsNotVoid(null)); //=> [`Value was null`]

getErrors(validateIsNotVoid(undefined)); //=> [`Value was undefined`]

isOK(validateIsNotVoid(123)); //=> true
```

#### some

Runs an array of validators in order until one of them succeeds. If all of the validators fail, returns their combined errors.

This is a good way to present a choice where you are happy for any of the options to succeed.

```js
const validateIsLarge = fromPredicate(
  n => n > 100,
  n => `${n} was not greater than 100`
);

const validateIsSmall = fromPredicate(
  n => n < 5,
  n => `${n} was not smaller than 5`
);

const validateNumber = some([validateIsLarge, validateIsSmall]);

getErrors(validateNumber(50)); //=> [`50 was not greater than 100`, `50 was not smaller than 5`]

isOK(validateNumber(123)); //=> true
isOK(validateNumber(2)); //=> true
```

### Results

Validators are functions that accept some data and return a `Result`, which will be `OK` if the validator succeeded or an `Err` if it failed. An `Err` can contain one or more error message strings.

The library provides several helper functions to work with the `Result` data type.

#### ok

Constructs an `OK` result. This is useful when you are writing your own validator and need to return a success.

```js
const result = ok();

isOK(result); //=> true
```

#### err

Constructs an `Err` result. This is useful when you are writing your own validator and need to return a failure.

`err` accepts either an error message string or an array of error message strings.

```js
const result = err('Validation failed');

getErrors(result); //=> [`Validation failed`]
```

#### nestedErr

Constructs an `Err` result that contains nested errors. This is sometimes needed when writing more complex validators that work with arrays and objects.

For example, when writing a validator that performs validation on every item in an array, `nestedErr` allows you to gather up those `Result`s and store them in a single structure.

`nestedErr` accepts two arguments: the type of nested error (either `array` or `object`); and an object of nested results.

```js
const nestedArrayResult = nestedErr('array', {
  0: 'Item 0 failed',
  1: 'Item 1 failed',
});

getErrors(nestedArrayResult); //=> [`At item 0: Item 0 failed`, `At item 1: Item 1 failed`]

const nestedObjectResult = nestedErr('object', {
  x: 'Field x failed',
  y: 'Field y failed',
});

getErrors(nestedObjectResult); //=> [`At field "x": Field x failed`, `At field "y": Field y failed`]
```

#### isOK

Checks whether the given result is `OK`.

```js
const success = ok();
const failure = err('Some error');

isOK(success); //=> true
isOK(failure); //=> false
```

#### isErr

Checks whether the given result is an `Err`.

```js
const success = ok();
const failure = err('Some error');

isErr(success); //=> false
isErr(failure); //=> true
```

#### mapErrors

Applies a function to every error in a `Result`. The mapping function will receive two arguments: the error string, and the index of the error in the internal error array.

The function will also be applied to nested errors, where the index will be reset.

```js
const result = err(['Error one', 'Error two']);

const prefixErrors = mapErrors((error, index) => `${index}: ${error}`);

const mappedResult = prefixErrors(result);

getErrors(mappedResult); //=> [`0: Error one`, `1: Error two`]
```

#### mergeResults

Recursively combines two results. If the results are nested they must be of the same type (`array` or `object`). The internal arrays of errors are merged by concatenating the arrays.

```js
const result1 = err('Error one');
const result2 = err(['Error two', 'Error three']);

const mergedResult = mergeResults(result1, result2);

getErrors(mergedResult); //=> [`Error one`, `Error two`, `Error three`]
```

#### concatResults

Combines an array of results using `mergeResults`. The results should all be of the same type (`array` or `object`).

```js
const results = [err('Error one'), ok(), err(['Error two', 'Error three'])];

const combinedResult = concatResults(results);

getErrors(mergedResult); //=> [`Error one`, `Error two`, `Error three`]
```

### Extracting errors

To extract errors from a `Result` you should normally use the `getErrors` function. In future there will be several functions available that will format the errors in different ways.

#### printVerbose

Formats errors in a "verbose" way. For example: `At item 0: at field "a": 123 failed to typecheck (expected string)`.

```js
const result = nestedError('object', {
  // @todo
});

printVerbose(result); // => @todo
```

#### getErrors

Alias of `printVerbose`.

### Working with schemas

---

Validate an object based on a schema:

```js
const christopher = {
  name: 'Christopher',
};
validatePerson(christopher); // { valid: false, errors: [ `At field "name": "Christopher" was longer than 10` ] }
```

Validate an array based on a schema:

```js
const { arrayValidator, ok, err } = require('@times/data-validator');

const numberSchema = {
  type: 'number',
  validator: n => (n >= 10 ? ok() : err([`${n} was less than 10`])),
};

const validateNumber = arrayValidator(numberSchema);

const numbers1 = [9, 10, 11];
validateNumber(numbers1); // { valid: false, errors: [ `At item 0: 9 was less than 10` ] }

const numbers2 = ['ten', 11];
validateNumber(numbers2); // { valid: false, errors: [ `Item "ten" failed to typecheck (expected number)` ] }
```

## Schema properties

An object schema consists of field names that map to sets of properties. Each set of properties can optionally include:

- `type`: the type of the field. Can be string, number, date, array, object, function...
- `required`: whether the field is required. Should be true or false
- `validator`: a nested validator that should be applied to the contents of the field

An array schema can similarly have the following optional properties:

- `type`: the type of the items in the array
- `validator`: a nested validator that should be applied to each item in the array

## Compose

Two useful functions, `objectValidator` and `arrayValidator`, are provided by default. Both accept a schema and turn it into a validator.

If these functions are insufficient, however, there are several functions available for you to build and compose your own validators.

A validator is any function with the signature `data -> Result`, where a Result can be constructed using the provided `ok()` or `err()` functions. `err()` accepts a single error message or an array of error messages.

To chain multiple validators together you can use the `all` or `some` composition functions. For example:

```js
const validatorOne = data => data <= 3 ? ok() : err(`Data was greater than three`);

const validatorTwo = ...

// Composing with `all` returns a validator that will succeed if all of the given validators succeed
const composedValidator1 = all([
  validatorOne,
  validatorTwo
]);
const result1 = composedValidator1(data);

// Using `some` returns a validator that will succeed if at least one of the given validators succeeds
const composedValidator2 = some([
  validatorOne,
  validatorTwo,
]);
const result2 = composedValidator2(data);
```

You can of course write your own composition functions. A composition function must accept an array of validators and run them, somehow combining the Results into a single Result.

## Converting from schemas

If you would like to use a schema beyond the supported object and array schemas, you can make use of the following exported functions:

- `fromObjectSchema`: Converts an object schema to an array of validators
- `fromObjectSchemaStrict`: Converts an object schema to an array of validators, including a validator that checks the object has no extra fields
- `fromArraySchema`: Converts an array schema to an array of validators

You can also write your own schema conversion functions should you wish.

The resulting list of validators can then be combined into a single validator using `all`, `some` or your own composition function; this is how the default `objectValidator` and `arrayValidator` helpers work.
