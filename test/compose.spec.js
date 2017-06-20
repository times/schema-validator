const { expect } = require('chai');
const {
  allOf,
  someOf,
  objectValidator,
  arrayValidator,
} = require('../lib/compose');
const { isOK, isErr, ok, err } = require('../lib/result');
const {
  validateIsObject,
  validateIsArray,
  validateRequiredFields,
  validateExtraFields,
  validateItemsTypecheck,
} = require('../lib/validators');

describe('compose', () => {
  describe('#allOf()', () => {
    it('should compose multiple validators into a single validator such that they all must succeed', () => {
      const schema = {
        field1: {
          required: true,
        },
        field2: {
          required: false,
        },
      };

      const validate = allOf(validateIsObject, validateRequiredFields)(schema);

      expect(isErr(validate('not an object'))).to.be.true;
      expect(isErr(validate({}))).to.be.true;
      expect(isErr(validate({ field2: 'here' }))).to.be.true;

      expect(isOK(validate({ field1: 'here' }))).to.be.true;
    });

    it('can compose multiple times', () => {
      const schema = {
        field1: {
          required: true,
        },
        field2: {
          required: false,
        },
      };

      const v1 = allOf(validateIsObject);
      const v2 = allOf(v1, validateRequiredFields);
      const v3 = allOf(v2, validateExtraFields);
      const validate = v3(schema);

      expect(isErr(validate('not an object'))).to.be.true;
      expect(isErr(validate({}))).to.be.true;
      expect(isErr(validate({ field2: 'here' }))).to.be.true;
      expect(isErr(validate({ field1: 'here', field3: 'also here' }))).to.be
        .true;

      expect(isOK(validate({ field1: 'here' }))).to.be.true;
      expect(isOK(validate({ field1: 'here', field2: 'also here' }))).to.be
        .true;
    });

    it('runs the composed validators in order', () => {
      const schema = {
        field1: {
          required: true,
        },
        field2: {
          required: false,
        },
      };

      const validate = allOf(
        validateIsObject,
        validateRequiredFields,
        validateExtraFields
      )(schema);

      expect(validate('not an object').errors).to.deep.equal([
        `Data was not an object`,
      ]);
      expect(validate({}).errors).to.deep.equal([
        `Missing required field "field1"`,
      ]);
      expect(validate({ field2: 'here' }).errors).to.deep.equal([
        `Missing required field "field1"`,
      ]);
      expect(
        validate({ field1: 'here', field3: 'also here' }).errors
      ).to.deep.equal([`Extra field "field3"`]);
    });

    it('can compose with a brand new validator', () => {
      const arbitraryValidator = schema => data =>
        (data.hasOwnProperty('arbitraryField')
          ? ok()
          : err([`Couldn't find arbitraryField`]));

      const validate = allOf(validateIsObject, arbitraryValidator)({});

      expect(isErr(validate(''))).to.be.true;
      expect(isErr(validate({}))).to.be.true;
      expect(isOK(validate({ arbitraryField: 'boo' }))).to.be.true;
    });
  });

  describe('#someOf()', () => {
    it('should compose multiple validators such that only one needs to succeed', () => {
      const validate = someOf(validateIsObject(), validateIsArray());

      expect(isErr(validate('neither object nor array'))).to.be.true;
      expect(isErr(validate(123))).to.be.true;

      expect(isOK(validate({}))).to.be.true;
      expect(isOK(validate([]))).to.be.true;
    });

    it('returns errors from all the validators if it fails', () => {
      const validate = someOf(validateIsObject(), validateIsArray());

      expect(validate(123).errors).to.deep.equal([
        'Data was not an object',
        'Data was not an array',
      ]);
    });

    it('works as part of a schema', () => {
      const objectSchema = {
        field2: {
          required: true,
          type: 'string',
        },
      };

      const arraySchema = {
        type: 'number',
        predicates: [
          {
            test: n => n <= 3,
            onError: n => `${n} was greater than 3`,
          },
        ],
      };

      const schema = {
        field1: {
          schemaValidator: someOf(
            objectValidator(objectSchema),
            arrayValidator(arraySchema)
          ),
        },
      };

      const validate = objectValidator(schema);

      expect(isErr(validate({ field1: 123 }))).to.be.true;
      expect(isErr(validate({ field1: 'abc' }))).to.be.true;

      expect(isOK(validate({ field1: [] }))).to.be.true;
      expect(isOK(validate({ field1: [1, 2, 3] }))).to.be.true;
      expect(isErr(validate({ field1: [2, 3, 4] }))).to.be.true;

      expect(isOK(validate({ field1: { field2: 'abc' } }))).to.be.true;
      expect(isErr(validate({ field1: { field2: 123 } }))).to.be.true;
      expect(isErr(validate({ field1: { field3: 'abc' } }))).to.be.true;
    });

    it('can be composed multiple times', () => {
      const v1 = someOf(validateIsObject());
      const validate = someOf(v1, validateIsArray());

      expect(isErr(validate(123))).to.be.true;
      expect(isErr(validate('abc'))).to.be.true;
      expect(isOK(validate({}))).to.be.true;
      expect(isOK(validate([]))).to.be.true;
    });
  });

  describe('#objectValidator()', () => {
    it('exports a default composed validator for objects', () => {
      const schema = {
        field1: {
          required: true,
          type: 'string',
        },
        field2: {
          type: 'number',
          predicates: [
            {
              test: x => x < 10,
              onError: x => `${x} was >= 10`,
            },
          ],
        },
        field3: {
          type: 'array',
          schemaValidator: validateItemsTypecheck({ type: 'object' }),
        },
      };

      const validate = objectValidator(schema);

      expect(isErr(validate('not an object'))).to.be.true;
      expect(isErr(validate({}))).to.be.true;
      expect(isErr(validate({ field2: 123 }))).to.be.true;
      expect(isErr(validate({ field1: 123 }))).to.be.true;
      expect(isErr(validate({ field1: 'here', field2: [] }))).to.be.true;
      expect(isErr(validate({ field1: 'here', field2: 11 }))).to.be.true;
      expect(isErr(validate({ field1: 'here', field4: 'also here' }))).to.be
        .true;
      expect(isErr(validate({ field1: 'here', field3: [1, 2, 3] }))).to.be.true;

      expect(isOK(validate({ field1: 'here' }))).to.be.true;
      expect(isOK(validate({ field1: 'here', field2: 6 }))).to.be.true;
      expect(isOK(validate({ field1: 'here', field2: 6, field3: [{ a: 1 }] })))
        .to.be.true;
    });
  });

  describe('#arrayValidator()', () => {
    it('exports a default composed validator for arrays', () => {
      const schema = {
        type: 'object',
        predicates: [
          {
            test: o => Object.keys(o).length < 3,
            onError: o => `${o} did not include abc`,
          },
        ],
        schemaValidator: validateRequiredFields({ field1: { required: true } }),
      };

      const validate = arrayValidator(schema);

      expect(isErr(validate('not an array'))).to.be.true;
      expect(isErr(validate([1, 2, 3]))).to.be.true;
      expect(isErr(validate(['one', 'two', 'three']))).to.be.true;
      expect(isErr(validate([{ field1: '' }, {}]))).to.be.true;
      expect(isErr(validate([{ field1: '', field2: '', field3: '' }]))).to.be
        .true;

      expect(isOK(validate([]))).to.be.true;
      expect(isOK(validate([{ field1: 'abc' }]))).to.be.true;
    });
  });
});
