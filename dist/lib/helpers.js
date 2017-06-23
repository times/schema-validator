'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Helper functions should return booleans
 */

/**
 * Is the parameter a valid ISO 8601 date string?
 *
 * Ref: http://stackoverflow.com/questions/3143070/javascript-regex-iso-datetime
 */
var isISOString = function isISOString(str) {
  return typeof str === 'string' && str.match(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/) !== null;
};

/**
 * Is the parameter a valid date object or string?
 */
var isDate = function isDate(val) {
  return val instanceof Date || isISOString(val);
};

/**
 * Is the parameter a non-array, non-date object?
 */
var isObject = function isObject(data) {
  return data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' && !isArray(data) && !isDate(data);
};

/**
 * Is the parameter an array?
 */
var isArray = function isArray(arr) {
  return Array.isArray(arr);
};

/**
 * Does the given value match the given type?
 */
var typechecks = function typechecks(val, type) {
  switch (type) {
    case 'array':
      return isArray(val);
    case 'date':
      return isDate(val);
    case 'object':
      return isObject(val);
    default:
      return (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === type;
  }
};

module.exports = {
  isISOString: isISOString,
  isDate: isDate,
  isObject: isObject,
  isArray: isArray,
  typechecks: typechecks
};