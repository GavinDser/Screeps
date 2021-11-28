'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('lodash');

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var sourceMapGenerator = {};

var base64Vlq = {};

var base64$1 = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

/**
 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
 */
base64$1.encode = function (number) {
  if (0 <= number && number < intToCharMap.length) {
    return intToCharMap[number];
  }
  throw new TypeError("Must be between 0 and 63: " + number);
};

/**
 * Decode a single base 64 character code digit to an integer. Returns -1 on
 * failure.
 */
base64$1.decode = function (charCode) {
  var bigA = 65;     // 'A'
  var bigZ = 90;     // 'Z'

  var littleA = 97;  // 'a'
  var littleZ = 122; // 'z'

  var zero = 48;     // '0'
  var nine = 57;     // '9'

  var plus = 43;     // '+'
  var slash = 47;    // '/'

  var littleOffset = 26;
  var numberOffset = 52;

  // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
  if (bigA <= charCode && charCode <= bigZ) {
    return (charCode - bigA);
  }

  // 26 - 51: abcdefghijklmnopqrstuvwxyz
  if (littleA <= charCode && charCode <= littleZ) {
    return (charCode - littleA + littleOffset);
  }

  // 52 - 61: 0123456789
  if (zero <= charCode && charCode <= nine) {
    return (charCode - zero + numberOffset);
  }

  // 62: +
  if (charCode == plus) {
    return 62;
  }

  // 63: /
  if (charCode == slash) {
    return 63;
  }

  // Invalid base64 digit.
  return -1;
};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var base64 = base64$1;

// A single base 64 digit can contain 6 bits of data. For the base 64 variable
// length quantities we use in the source map spec, the first bit is the sign,
// the next four bits are the actual value, and the 6th bit is the
// continuation bit. The continuation bit tells us whether there are more
// digits in this value following this digit.
//
//   Continuation
//   |    Sign
//   |    |
//   V    V
//   101011

var VLQ_BASE_SHIFT = 5;

// binary: 100000
var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

// binary: 011111
var VLQ_BASE_MASK = VLQ_BASE - 1;

// binary: 100000
var VLQ_CONTINUATION_BIT = VLQ_BASE;

/**
 * Converts from a two-complement value to a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
 */
function toVLQSigned(aValue) {
  return aValue < 0
    ? ((-aValue) << 1) + 1
    : (aValue << 1) + 0;
}

/**
 * Converts to a two-complement value from a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
 *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
 */
function fromVLQSigned(aValue) {
  var isNegative = (aValue & 1) === 1;
  var shifted = aValue >> 1;
  return isNegative
    ? -shifted
    : shifted;
}

/**
 * Returns the base 64 VLQ encoded value.
 */
base64Vlq.encode = function base64VLQ_encode(aValue) {
  var encoded = "";
  var digit;

  var vlq = toVLQSigned(aValue);

  do {
    digit = vlq & VLQ_BASE_MASK;
    vlq >>>= VLQ_BASE_SHIFT;
    if (vlq > 0) {
      // There are still more digits in this value, so we must make sure the
      // continuation bit is marked.
      digit |= VLQ_CONTINUATION_BIT;
    }
    encoded += base64.encode(digit);
  } while (vlq > 0);

  return encoded;
};

/**
 * Decodes the next base 64 VLQ value from the given string and returns the
 * value and the rest of the string via the out parameter.
 */
base64Vlq.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
  var strLen = aStr.length;
  var result = 0;
  var shift = 0;
  var continuation, digit;

  do {
    if (aIndex >= strLen) {
      throw new Error("Expected more digits in base 64 VLQ value.");
    }

    digit = base64.decode(aStr.charCodeAt(aIndex++));
    if (digit === -1) {
      throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
    }

    continuation = !!(digit & VLQ_CONTINUATION_BIT);
    digit &= VLQ_BASE_MASK;
    result = result + (digit << shift);
    shift += VLQ_BASE_SHIFT;
  } while (continuation);

  aOutParam.value = fromVLQSigned(result);
  aOutParam.rest = aIndex;
};

var util$5 = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

(function (exports) {
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is a helper function for getting values from parameter/options
 * objects.
 *
 * @param args The object we are extracting values from
 * @param name The name of the property we are getting.
 * @param defaultValue An optional value to return if the property is missing
 * from the object. If this is not specified and the property is missing, an
 * error will be thrown.
 */
function getArg(aArgs, aName, aDefaultValue) {
  if (aName in aArgs) {
    return aArgs[aName];
  } else if (arguments.length === 3) {
    return aDefaultValue;
  } else {
    throw new Error('"' + aName + '" is a required argument.');
  }
}
exports.getArg = getArg;

var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
var dataUrlRegexp = /^data:.+\,.+$/;

function urlParse(aUrl) {
  var match = aUrl.match(urlRegexp);
  if (!match) {
    return null;
  }
  return {
    scheme: match[1],
    auth: match[2],
    host: match[3],
    port: match[4],
    path: match[5]
  };
}
exports.urlParse = urlParse;

function urlGenerate(aParsedUrl) {
  var url = '';
  if (aParsedUrl.scheme) {
    url += aParsedUrl.scheme + ':';
  }
  url += '//';
  if (aParsedUrl.auth) {
    url += aParsedUrl.auth + '@';
  }
  if (aParsedUrl.host) {
    url += aParsedUrl.host;
  }
  if (aParsedUrl.port) {
    url += ":" + aParsedUrl.port;
  }
  if (aParsedUrl.path) {
    url += aParsedUrl.path;
  }
  return url;
}
exports.urlGenerate = urlGenerate;

/**
 * Normalizes a path, or the path portion of a URL:
 *
 * - Replaces consecutive slashes with one slash.
 * - Removes unnecessary '.' parts.
 * - Removes unnecessary '<dir>/..' parts.
 *
 * Based on code in the Node.js 'path' core module.
 *
 * @param aPath The path or url to normalize.
 */
function normalize(aPath) {
  var path = aPath;
  var url = urlParse(aPath);
  if (url) {
    if (!url.path) {
      return aPath;
    }
    path = url.path;
  }
  var isAbsolute = exports.isAbsolute(path);

  var parts = path.split(/\/+/);
  for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
    part = parts[i];
    if (part === '.') {
      parts.splice(i, 1);
    } else if (part === '..') {
      up++;
    } else if (up > 0) {
      if (part === '') {
        // The first part is blank if the path is absolute. Trying to go
        // above the root is a no-op. Therefore we can remove all '..' parts
        // directly after the root.
        parts.splice(i + 1, up);
        up = 0;
      } else {
        parts.splice(i, 2);
        up--;
      }
    }
  }
  path = parts.join('/');

  if (path === '') {
    path = isAbsolute ? '/' : '.';
  }

  if (url) {
    url.path = path;
    return urlGenerate(url);
  }
  return path;
}
exports.normalize = normalize;

/**
 * Joins two paths/URLs.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be joined with the root.
 *
 * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
 *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
 *   first.
 * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
 *   is updated with the result and aRoot is returned. Otherwise the result
 *   is returned.
 *   - If aPath is absolute, the result is aPath.
 *   - Otherwise the two paths are joined with a slash.
 * - Joining for example 'http://' and 'www.example.com' is also supported.
 */
function join(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }
  if (aPath === "") {
    aPath = ".";
  }
  var aPathUrl = urlParse(aPath);
  var aRootUrl = urlParse(aRoot);
  if (aRootUrl) {
    aRoot = aRootUrl.path || '/';
  }

  // `join(foo, '//www.example.org')`
  if (aPathUrl && !aPathUrl.scheme) {
    if (aRootUrl) {
      aPathUrl.scheme = aRootUrl.scheme;
    }
    return urlGenerate(aPathUrl);
  }

  if (aPathUrl || aPath.match(dataUrlRegexp)) {
    return aPath;
  }

  // `join('http://', 'www.example.com')`
  if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
    aRootUrl.host = aPath;
    return urlGenerate(aRootUrl);
  }

  var joined = aPath.charAt(0) === '/'
    ? aPath
    : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

  if (aRootUrl) {
    aRootUrl.path = joined;
    return urlGenerate(aRootUrl);
  }
  return joined;
}
exports.join = join;

exports.isAbsolute = function (aPath) {
  return aPath.charAt(0) === '/' || urlRegexp.test(aPath);
};

/**
 * Make a path relative to a URL or another path.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be made relative to aRoot.
 */
function relative(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }

  aRoot = aRoot.replace(/\/$/, '');

  // It is possible for the path to be above the root. In this case, simply
  // checking whether the root is a prefix of the path won't work. Instead, we
  // need to remove components from the root one by one, until either we find
  // a prefix that fits, or we run out of components to remove.
  var level = 0;
  while (aPath.indexOf(aRoot + '/') !== 0) {
    var index = aRoot.lastIndexOf("/");
    if (index < 0) {
      return aPath;
    }

    // If the only part of the root that is left is the scheme (i.e. http://,
    // file:///, etc.), one or more slashes (/), or simply nothing at all, we
    // have exhausted all components, so the path is not relative to the root.
    aRoot = aRoot.slice(0, index);
    if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
      return aPath;
    }

    ++level;
  }

  // Make sure we add a "../" for each component we removed from the root.
  return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
}
exports.relative = relative;

var supportsNullProto = (function () {
  var obj = Object.create(null);
  return !('__proto__' in obj);
}());

function identity (s) {
  return s;
}

/**
 * Because behavior goes wacky when you set `__proto__` on objects, we
 * have to prefix all the strings in our set with an arbitrary character.
 *
 * See https://github.com/mozilla/source-map/pull/31 and
 * https://github.com/mozilla/source-map/issues/30
 *
 * @param String aStr
 */
function toSetString(aStr) {
  if (isProtoString(aStr)) {
    return '$' + aStr;
  }

  return aStr;
}
exports.toSetString = supportsNullProto ? identity : toSetString;

function fromSetString(aStr) {
  if (isProtoString(aStr)) {
    return aStr.slice(1);
  }

  return aStr;
}
exports.fromSetString = supportsNullProto ? identity : fromSetString;

function isProtoString(s) {
  if (!s) {
    return false;
  }

  var length = s.length;

  if (length < 9 /* "__proto__".length */) {
    return false;
  }

  if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
      s.charCodeAt(length - 2) !== 95  /* '_' */ ||
      s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 4) !== 116 /* 't' */ ||
      s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
      s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
      s.charCodeAt(length - 8) !== 95  /* '_' */ ||
      s.charCodeAt(length - 9) !== 95  /* '_' */) {
    return false;
  }

  for (var i = length - 10; i >= 0; i--) {
    if (s.charCodeAt(i) !== 36 /* '$' */) {
      return false;
    }
  }

  return true;
}

/**
 * Comparator between two mappings where the original positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same original source/line/column, but different generated
 * line and column the same. Useful when searching for a mapping with a
 * stubbed out mapping.
 */
function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
  var cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0 || onlyCompareOriginal) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByOriginalPositions = compareByOriginalPositions;

/**
 * Comparator between two mappings with deflated source and name indices where
 * the generated positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same generated line and column, but different
 * source/name/original line and column the same. Useful when searching for a
 * mapping with a stubbed out mapping.
 */
function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0 || onlyCompareGenerated) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

function strcmp(aStr1, aStr2) {
  if (aStr1 === aStr2) {
    return 0;
  }

  if (aStr1 === null) {
    return 1; // aStr2 !== null
  }

  if (aStr2 === null) {
    return -1; // aStr1 !== null
  }

  if (aStr1 > aStr2) {
    return 1;
  }

  return -1;
}

/**
 * Comparator between two mappings with inflated source and name strings where
 * the generated positions are compared.
 */
function compareByGeneratedPositionsInflated(mappingA, mappingB) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

/**
 * Strip any JSON XSSI avoidance prefix from the string (as documented
 * in the source maps specification), and then parse the string as
 * JSON.
 */
function parseSourceMapInput(str) {
  return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ''));
}
exports.parseSourceMapInput = parseSourceMapInput;

/**
 * Compute the URL of a source given the the source root, the source's
 * URL, and the source map's URL.
 */
function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
  sourceURL = sourceURL || '';

  if (sourceRoot) {
    // This follows what Chrome does.
    if (sourceRoot[sourceRoot.length - 1] !== '/' && sourceURL[0] !== '/') {
      sourceRoot += '/';
    }
    // The spec says:
    //   Line 4: An optional source root, useful for relocating source
    //   files on a server or removing repeated values in the
    //   “sources” entry.  This value is prepended to the individual
    //   entries in the “source” field.
    sourceURL = sourceRoot + sourceURL;
  }

  // Historically, SourceMapConsumer did not take the sourceMapURL as
  // a parameter.  This mode is still somewhat supported, which is why
  // this code block is conditional.  However, it's preferable to pass
  // the source map URL to SourceMapConsumer, so that this function
  // can implement the source URL resolution algorithm as outlined in
  // the spec.  This block is basically the equivalent of:
  //    new URL(sourceURL, sourceMapURL).toString()
  // ... except it avoids using URL, which wasn't available in the
  // older releases of node still supported by this library.
  //
  // The spec says:
  //   If the sources are not absolute URLs after prepending of the
  //   “sourceRoot”, the sources are resolved relative to the
  //   SourceMap (like resolving script src in a html document).
  if (sourceMapURL) {
    var parsed = urlParse(sourceMapURL);
    if (!parsed) {
      throw new Error("sourceMapURL could not be parsed");
    }
    if (parsed.path) {
      // Strip the last path component, but keep the "/".
      var index = parsed.path.lastIndexOf('/');
      if (index >= 0) {
        parsed.path = parsed.path.substring(0, index + 1);
      }
    }
    sourceURL = join(urlGenerate(parsed), sourceURL);
  }

  return normalize(sourceURL);
}
exports.computeSourceURL = computeSourceURL;
}(util$5));

var arraySet = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util$4 = util$5;
var has = Object.prototype.hasOwnProperty;
var hasNativeMap = typeof Map !== "undefined";

/**
 * A data structure which is a combination of an array and a set. Adding a new
 * member is O(1), testing for membership is O(1), and finding the index of an
 * element is O(1). Removing elements from the set is not supported. Only
 * strings are supported for membership.
 */
function ArraySet$2() {
  this._array = [];
  this._set = hasNativeMap ? new Map() : Object.create(null);
}

/**
 * Static method for creating ArraySet instances from an existing array.
 */
ArraySet$2.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
  var set = new ArraySet$2();
  for (var i = 0, len = aArray.length; i < len; i++) {
    set.add(aArray[i], aAllowDuplicates);
  }
  return set;
};

/**
 * Return how many unique items are in this ArraySet. If duplicates have been
 * added, than those do not count towards the size.
 *
 * @returns Number
 */
ArraySet$2.prototype.size = function ArraySet_size() {
  return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
};

/**
 * Add the given string to this set.
 *
 * @param String aStr
 */
ArraySet$2.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
  var sStr = hasNativeMap ? aStr : util$4.toSetString(aStr);
  var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
  var idx = this._array.length;
  if (!isDuplicate || aAllowDuplicates) {
    this._array.push(aStr);
  }
  if (!isDuplicate) {
    if (hasNativeMap) {
      this._set.set(aStr, idx);
    } else {
      this._set[sStr] = idx;
    }
  }
};

/**
 * Is the given string a member of this set?
 *
 * @param String aStr
 */
ArraySet$2.prototype.has = function ArraySet_has(aStr) {
  if (hasNativeMap) {
    return this._set.has(aStr);
  } else {
    var sStr = util$4.toSetString(aStr);
    return has.call(this._set, sStr);
  }
};

/**
 * What is the index of the given string in the array?
 *
 * @param String aStr
 */
ArraySet$2.prototype.indexOf = function ArraySet_indexOf(aStr) {
  if (hasNativeMap) {
    var idx = this._set.get(aStr);
    if (idx >= 0) {
        return idx;
    }
  } else {
    var sStr = util$4.toSetString(aStr);
    if (has.call(this._set, sStr)) {
      return this._set[sStr];
    }
  }

  throw new Error('"' + aStr + '" is not in the set.');
};

/**
 * What is the element at the given index?
 *
 * @param Number aIdx
 */
ArraySet$2.prototype.at = function ArraySet_at(aIdx) {
  if (aIdx >= 0 && aIdx < this._array.length) {
    return this._array[aIdx];
  }
  throw new Error('No element indexed by ' + aIdx);
};

/**
 * Returns the array representation of this set (which has the proper indices
 * indicated by indexOf). Note that this is a copy of the internal array used
 * for storing the members so that no one can mess with internal state.
 */
ArraySet$2.prototype.toArray = function ArraySet_toArray() {
  return this._array.slice();
};

arraySet.ArraySet = ArraySet$2;

var mappingList = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2014 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util$3 = util$5;

/**
 * Determine whether mappingB is after mappingA with respect to generated
 * position.
 */
function generatedPositionAfter(mappingA, mappingB) {
  // Optimized for most common case
  var lineA = mappingA.generatedLine;
  var lineB = mappingB.generatedLine;
  var columnA = mappingA.generatedColumn;
  var columnB = mappingB.generatedColumn;
  return lineB > lineA || lineB == lineA && columnB >= columnA ||
         util$3.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
}

/**
 * A data structure to provide a sorted view of accumulated mappings in a
 * performance conscious manner. It trades a neglibable overhead in general
 * case for a large speedup in case of mappings being added in order.
 */
function MappingList$1() {
  this._array = [];
  this._sorted = true;
  // Serves as infimum
  this._last = {generatedLine: -1, generatedColumn: 0};
}

/**
 * Iterate through internal items. This method takes the same arguments that
 * `Array.prototype.forEach` takes.
 *
 * NOTE: The order of the mappings is NOT guaranteed.
 */
MappingList$1.prototype.unsortedForEach =
  function MappingList_forEach(aCallback, aThisArg) {
    this._array.forEach(aCallback, aThisArg);
  };

/**
 * Add the given source mapping.
 *
 * @param Object aMapping
 */
MappingList$1.prototype.add = function MappingList_add(aMapping) {
  if (generatedPositionAfter(this._last, aMapping)) {
    this._last = aMapping;
    this._array.push(aMapping);
  } else {
    this._sorted = false;
    this._array.push(aMapping);
  }
};

/**
 * Returns the flat, sorted array of mappings. The mappings are sorted by
 * generated position.
 *
 * WARNING: This method returns internal data without copying, for
 * performance. The return value must NOT be mutated, and should be treated as
 * an immutable borrow. If you want to take ownership, you must make your own
 * copy.
 */
MappingList$1.prototype.toArray = function MappingList_toArray() {
  if (!this._sorted) {
    this._array.sort(util$3.compareByGeneratedPositionsInflated);
    this._sorted = true;
  }
  return this._array;
};

mappingList.MappingList = MappingList$1;

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var base64VLQ$1 = base64Vlq;
var util$2 = util$5;
var ArraySet$1 = arraySet.ArraySet;
var MappingList = mappingList.MappingList;

/**
 * An instance of the SourceMapGenerator represents a source map which is
 * being built incrementally. You may pass an object with the following
 * properties:
 *
 *   - file: The filename of the generated source.
 *   - sourceRoot: A root for all relative URLs in this source map.
 */
function SourceMapGenerator$1(aArgs) {
  if (!aArgs) {
    aArgs = {};
  }
  this._file = util$2.getArg(aArgs, 'file', null);
  this._sourceRoot = util$2.getArg(aArgs, 'sourceRoot', null);
  this._skipValidation = util$2.getArg(aArgs, 'skipValidation', false);
  this._sources = new ArraySet$1();
  this._names = new ArraySet$1();
  this._mappings = new MappingList();
  this._sourcesContents = null;
}

SourceMapGenerator$1.prototype._version = 3;

/**
 * Creates a new SourceMapGenerator based on a SourceMapConsumer
 *
 * @param aSourceMapConsumer The SourceMap.
 */
SourceMapGenerator$1.fromSourceMap =
  function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
    var sourceRoot = aSourceMapConsumer.sourceRoot;
    var generator = new SourceMapGenerator$1({
      file: aSourceMapConsumer.file,
      sourceRoot: sourceRoot
    });
    aSourceMapConsumer.eachMapping(function (mapping) {
      var newMapping = {
        generated: {
          line: mapping.generatedLine,
          column: mapping.generatedColumn
        }
      };

      if (mapping.source != null) {
        newMapping.source = mapping.source;
        if (sourceRoot != null) {
          newMapping.source = util$2.relative(sourceRoot, newMapping.source);
        }

        newMapping.original = {
          line: mapping.originalLine,
          column: mapping.originalColumn
        };

        if (mapping.name != null) {
          newMapping.name = mapping.name;
        }
      }

      generator.addMapping(newMapping);
    });
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var sourceRelative = sourceFile;
      if (sourceRoot !== null) {
        sourceRelative = util$2.relative(sourceRoot, sourceFile);
      }

      if (!generator._sources.has(sourceRelative)) {
        generator._sources.add(sourceRelative);
      }

      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        generator.setSourceContent(sourceFile, content);
      }
    });
    return generator;
  };

/**
 * Add a single mapping from original source line and column to the generated
 * source's line and column for this source map being created. The mapping
 * object should have the following properties:
 *
 *   - generated: An object with the generated line and column positions.
 *   - original: An object with the original line and column positions.
 *   - source: The original source file (relative to the sourceRoot).
 *   - name: An optional original token name for this mapping.
 */
SourceMapGenerator$1.prototype.addMapping =
  function SourceMapGenerator_addMapping(aArgs) {
    var generated = util$2.getArg(aArgs, 'generated');
    var original = util$2.getArg(aArgs, 'original', null);
    var source = util$2.getArg(aArgs, 'source', null);
    var name = util$2.getArg(aArgs, 'name', null);

    if (!this._skipValidation) {
      this._validateMapping(generated, original, source, name);
    }

    if (source != null) {
      source = String(source);
      if (!this._sources.has(source)) {
        this._sources.add(source);
      }
    }

    if (name != null) {
      name = String(name);
      if (!this._names.has(name)) {
        this._names.add(name);
      }
    }

    this._mappings.add({
      generatedLine: generated.line,
      generatedColumn: generated.column,
      originalLine: original != null && original.line,
      originalColumn: original != null && original.column,
      source: source,
      name: name
    });
  };

/**
 * Set the source content for a source file.
 */
SourceMapGenerator$1.prototype.setSourceContent =
  function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
    var source = aSourceFile;
    if (this._sourceRoot != null) {
      source = util$2.relative(this._sourceRoot, source);
    }

    if (aSourceContent != null) {
      // Add the source content to the _sourcesContents map.
      // Create a new _sourcesContents map if the property is null.
      if (!this._sourcesContents) {
        this._sourcesContents = Object.create(null);
      }
      this._sourcesContents[util$2.toSetString(source)] = aSourceContent;
    } else if (this._sourcesContents) {
      // Remove the source file from the _sourcesContents map.
      // If the _sourcesContents map is empty, set the property to null.
      delete this._sourcesContents[util$2.toSetString(source)];
      if (Object.keys(this._sourcesContents).length === 0) {
        this._sourcesContents = null;
      }
    }
  };

/**
 * Applies the mappings of a sub-source-map for a specific source file to the
 * source map being generated. Each mapping to the supplied source file is
 * rewritten using the supplied source map. Note: The resolution for the
 * resulting mappings is the minimium of this map and the supplied map.
 *
 * @param aSourceMapConsumer The source map to be applied.
 * @param aSourceFile Optional. The filename of the source file.
 *        If omitted, SourceMapConsumer's file property will be used.
 * @param aSourceMapPath Optional. The dirname of the path to the source map
 *        to be applied. If relative, it is relative to the SourceMapConsumer.
 *        This parameter is needed when the two source maps aren't in the same
 *        directory, and the source map to be applied contains relative source
 *        paths. If so, those relative source paths need to be rewritten
 *        relative to the SourceMapGenerator.
 */
SourceMapGenerator$1.prototype.applySourceMap =
  function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
    var sourceFile = aSourceFile;
    // If aSourceFile is omitted, we will use the file property of the SourceMap
    if (aSourceFile == null) {
      if (aSourceMapConsumer.file == null) {
        throw new Error(
          'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
          'or the source map\'s "file" property. Both were omitted.'
        );
      }
      sourceFile = aSourceMapConsumer.file;
    }
    var sourceRoot = this._sourceRoot;
    // Make "sourceFile" relative if an absolute Url is passed.
    if (sourceRoot != null) {
      sourceFile = util$2.relative(sourceRoot, sourceFile);
    }
    // Applying the SourceMap can add and remove items from the sources and
    // the names array.
    var newSources = new ArraySet$1();
    var newNames = new ArraySet$1();

    // Find mappings for the "sourceFile"
    this._mappings.unsortedForEach(function (mapping) {
      if (mapping.source === sourceFile && mapping.originalLine != null) {
        // Check if it can be mapped by the source map, then update the mapping.
        var original = aSourceMapConsumer.originalPositionFor({
          line: mapping.originalLine,
          column: mapping.originalColumn
        });
        if (original.source != null) {
          // Copy mapping
          mapping.source = original.source;
          if (aSourceMapPath != null) {
            mapping.source = util$2.join(aSourceMapPath, mapping.source);
          }
          if (sourceRoot != null) {
            mapping.source = util$2.relative(sourceRoot, mapping.source);
          }
          mapping.originalLine = original.line;
          mapping.originalColumn = original.column;
          if (original.name != null) {
            mapping.name = original.name;
          }
        }
      }

      var source = mapping.source;
      if (source != null && !newSources.has(source)) {
        newSources.add(source);
      }

      var name = mapping.name;
      if (name != null && !newNames.has(name)) {
        newNames.add(name);
      }

    }, this);
    this._sources = newSources;
    this._names = newNames;

    // Copy sourcesContents of applied map.
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aSourceMapPath != null) {
          sourceFile = util$2.join(aSourceMapPath, sourceFile);
        }
        if (sourceRoot != null) {
          sourceFile = util$2.relative(sourceRoot, sourceFile);
        }
        this.setSourceContent(sourceFile, content);
      }
    }, this);
  };

/**
 * A mapping can have one of the three levels of data:
 *
 *   1. Just the generated position.
 *   2. The Generated position, original position, and original source.
 *   3. Generated and original position, original source, as well as a name
 *      token.
 *
 * To maintain consistency, we validate that any new mapping being added falls
 * in to one of these categories.
 */
SourceMapGenerator$1.prototype._validateMapping =
  function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                              aName) {
    // When aOriginal is truthy but has empty values for .line and .column,
    // it is most likely a programmer error. In this case we throw a very
    // specific error message to try to guide them the right way.
    // For example: https://github.com/Polymer/polymer-bundler/pull/519
    if (aOriginal && typeof aOriginal.line !== 'number' && typeof aOriginal.column !== 'number') {
        throw new Error(
            'original.line and original.column are not numbers -- you probably meant to omit ' +
            'the original mapping entirely and only map the generated position. If so, pass ' +
            'null for the original mapping instead of an object with empty or null values.'
        );
    }

    if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
        && aGenerated.line > 0 && aGenerated.column >= 0
        && !aOriginal && !aSource && !aName) {
      // Case 1.
      return;
    }
    else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
             && aOriginal && 'line' in aOriginal && 'column' in aOriginal
             && aGenerated.line > 0 && aGenerated.column >= 0
             && aOriginal.line > 0 && aOriginal.column >= 0
             && aSource) {
      // Cases 2 and 3.
      return;
    }
    else {
      throw new Error('Invalid mapping: ' + JSON.stringify({
        generated: aGenerated,
        source: aSource,
        original: aOriginal,
        name: aName
      }));
    }
  };

/**
 * Serialize the accumulated mappings in to the stream of base 64 VLQs
 * specified by the source map format.
 */
SourceMapGenerator$1.prototype._serializeMappings =
  function SourceMapGenerator_serializeMappings() {
    var previousGeneratedColumn = 0;
    var previousGeneratedLine = 1;
    var previousOriginalColumn = 0;
    var previousOriginalLine = 0;
    var previousName = 0;
    var previousSource = 0;
    var result = '';
    var next;
    var mapping;
    var nameIdx;
    var sourceIdx;

    var mappings = this._mappings.toArray();
    for (var i = 0, len = mappings.length; i < len; i++) {
      mapping = mappings[i];
      next = '';

      if (mapping.generatedLine !== previousGeneratedLine) {
        previousGeneratedColumn = 0;
        while (mapping.generatedLine !== previousGeneratedLine) {
          next += ';';
          previousGeneratedLine++;
        }
      }
      else {
        if (i > 0) {
          if (!util$2.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
            continue;
          }
          next += ',';
        }
      }

      next += base64VLQ$1.encode(mapping.generatedColumn
                                 - previousGeneratedColumn);
      previousGeneratedColumn = mapping.generatedColumn;

      if (mapping.source != null) {
        sourceIdx = this._sources.indexOf(mapping.source);
        next += base64VLQ$1.encode(sourceIdx - previousSource);
        previousSource = sourceIdx;

        // lines are stored 0-based in SourceMap spec version 3
        next += base64VLQ$1.encode(mapping.originalLine - 1
                                   - previousOriginalLine);
        previousOriginalLine = mapping.originalLine - 1;

        next += base64VLQ$1.encode(mapping.originalColumn
                                   - previousOriginalColumn);
        previousOriginalColumn = mapping.originalColumn;

        if (mapping.name != null) {
          nameIdx = this._names.indexOf(mapping.name);
          next += base64VLQ$1.encode(nameIdx - previousName);
          previousName = nameIdx;
        }
      }

      result += next;
    }

    return result;
  };

SourceMapGenerator$1.prototype._generateSourcesContent =
  function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
    return aSources.map(function (source) {
      if (!this._sourcesContents) {
        return null;
      }
      if (aSourceRoot != null) {
        source = util$2.relative(aSourceRoot, source);
      }
      var key = util$2.toSetString(source);
      return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
        ? this._sourcesContents[key]
        : null;
    }, this);
  };

/**
 * Externalize the source map.
 */
SourceMapGenerator$1.prototype.toJSON =
  function SourceMapGenerator_toJSON() {
    var map = {
      version: this._version,
      sources: this._sources.toArray(),
      names: this._names.toArray(),
      mappings: this._serializeMappings()
    };
    if (this._file != null) {
      map.file = this._file;
    }
    if (this._sourceRoot != null) {
      map.sourceRoot = this._sourceRoot;
    }
    if (this._sourcesContents) {
      map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
    }

    return map;
  };

/**
 * Render the source map being generated to a string.
 */
SourceMapGenerator$1.prototype.toString =
  function SourceMapGenerator_toString() {
    return JSON.stringify(this.toJSON());
  };

sourceMapGenerator.SourceMapGenerator = SourceMapGenerator$1;

var sourceMapConsumer = {};

var binarySearch$1 = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

(function (exports) {
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

exports.GREATEST_LOWER_BOUND = 1;
exports.LEAST_UPPER_BOUND = 2;

/**
 * Recursive implementation of binary search.
 *
 * @param aLow Indices here and lower do not contain the needle.
 * @param aHigh Indices here and higher do not contain the needle.
 * @param aNeedle The element being searched for.
 * @param aHaystack The non-empty array being searched.
 * @param aCompare Function which takes two elements and returns -1, 0, or 1.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 */
function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
  // This function terminates when one of the following is true:
  //
  //   1. We find the exact element we are looking for.
  //
  //   2. We did not find the exact element, but we can return the index of
  //      the next-closest element.
  //
  //   3. We did not find the exact element, and there is no next-closest
  //      element than the one we are searching for, so we return -1.
  var mid = Math.floor((aHigh - aLow) / 2) + aLow;
  var cmp = aCompare(aNeedle, aHaystack[mid], true);
  if (cmp === 0) {
    // Found the element we are looking for.
    return mid;
  }
  else if (cmp > 0) {
    // Our needle is greater than aHaystack[mid].
    if (aHigh - mid > 1) {
      // The element is in the upper half.
      return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
    }

    // The exact needle element was not found in this haystack. Determine if
    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return aHigh < aHaystack.length ? aHigh : -1;
    } else {
      return mid;
    }
  }
  else {
    // Our needle is less than aHaystack[mid].
    if (mid - aLow > 1) {
      // The element is in the lower half.
      return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
    }

    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return mid;
    } else {
      return aLow < 0 ? -1 : aLow;
    }
  }
}

/**
 * This is an implementation of binary search which will always try and return
 * the index of the closest element if there is no exact hit. This is because
 * mappings between original and generated line/col pairs are single points,
 * and there is an implicit region between each of them, so a miss just means
 * that you aren't on the very start of a region.
 *
 * @param aNeedle The element you are looking for.
 * @param aHaystack The array that is being searched.
 * @param aCompare A function which takes the needle and an element in the
 *     array and returns -1, 0, or 1 depending on whether the needle is less
 *     than, equal to, or greater than the element, respectively.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
 */
exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
  if (aHaystack.length === 0) {
    return -1;
  }

  var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                              aCompare, aBias || exports.GREATEST_LOWER_BOUND);
  if (index < 0) {
    return -1;
  }

  // We have found either the exact element, or the next-closest element than
  // the one we are searching for. However, there may be more than one such
  // element. Make sure we always return the smallest of these.
  while (index - 1 >= 0) {
    if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
      break;
    }
    --index;
  }

  return index;
};
}(binarySearch$1));

var quickSort$1 = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

// It turns out that some (most?) JavaScript engines don't self-host
// `Array.prototype.sort`. This makes sense because C++ will likely remain
// faster than JS when doing raw CPU-intensive sorting. However, when using a
// custom comparator function, calling back and forth between the VM's C++ and
// JIT'd JS is rather slow *and* loses JIT type information, resulting in
// worse generated code for the comparator function than would be optimal. In
// fact, when sorting with a comparator, these costs outweigh the benefits of
// sorting in C++. By using our own JS-implemented Quick Sort (below), we get
// a ~3500ms mean speed-up in `bench/bench.html`.

/**
 * Swap the elements indexed by `x` and `y` in the array `ary`.
 *
 * @param {Array} ary
 *        The array.
 * @param {Number} x
 *        The index of the first item.
 * @param {Number} y
 *        The index of the second item.
 */
function swap(ary, x, y) {
  var temp = ary[x];
  ary[x] = ary[y];
  ary[y] = temp;
}

/**
 * Returns a random integer within the range `low .. high` inclusive.
 *
 * @param {Number} low
 *        The lower bound on the range.
 * @param {Number} high
 *        The upper bound on the range.
 */
function randomIntInRange(low, high) {
  return Math.round(low + (Math.random() * (high - low)));
}

/**
 * The Quick Sort algorithm.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 * @param {Number} p
 *        Start index of the array
 * @param {Number} r
 *        End index of the array
 */
function doQuickSort(ary, comparator, p, r) {
  // If our lower bound is less than our upper bound, we (1) partition the
  // array into two pieces and (2) recurse on each half. If it is not, this is
  // the empty array and our base case.

  if (p < r) {
    // (1) Partitioning.
    //
    // The partitioning chooses a pivot between `p` and `r` and moves all
    // elements that are less than or equal to the pivot to the before it, and
    // all the elements that are greater than it after it. The effect is that
    // once partition is done, the pivot is in the exact place it will be when
    // the array is put in sorted order, and it will not need to be moved
    // again. This runs in O(n) time.

    // Always choose a random pivot so that an input array which is reverse
    // sorted does not cause O(n^2) running time.
    var pivotIndex = randomIntInRange(p, r);
    var i = p - 1;

    swap(ary, pivotIndex, r);
    var pivot = ary[r];

    // Immediately after `j` is incremented in this loop, the following hold
    // true:
    //
    //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
    //
    //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
    for (var j = p; j < r; j++) {
      if (comparator(ary[j], pivot) <= 0) {
        i += 1;
        swap(ary, i, j);
      }
    }

    swap(ary, i + 1, j);
    var q = i + 1;

    // (2) Recurse on each half.

    doQuickSort(ary, comparator, p, q - 1);
    doQuickSort(ary, comparator, q + 1, r);
  }
}

/**
 * Sort the given array in-place with the given comparator function.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 */
quickSort$1.quickSort = function (ary, comparator) {
  doQuickSort(ary, comparator, 0, ary.length - 1);
};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util$1 = util$5;
var binarySearch = binarySearch$1;
var ArraySet = arraySet.ArraySet;
var base64VLQ = base64Vlq;
var quickSort = quickSort$1.quickSort;

function SourceMapConsumer$1(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util$1.parseSourceMapInput(aSourceMap);
  }

  return sourceMap.sections != null
    ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL)
    : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
}

SourceMapConsumer$1.fromSourceMap = function(aSourceMap, aSourceMapURL) {
  return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
};

/**
 * The version of the source mapping spec that we are consuming.
 */
SourceMapConsumer$1.prototype._version = 3;

// `__generatedMappings` and `__originalMappings` are arrays that hold the
// parsed mapping coordinates from the source map's "mappings" attribute. They
// are lazily instantiated, accessed via the `_generatedMappings` and
// `_originalMappings` getters respectively, and we only parse the mappings
// and create these arrays once queried for a source location. We jump through
// these hoops because there can be many thousands of mappings, and parsing
// them is expensive, so we only want to do it if we must.
//
// Each object in the arrays is of the form:
//
//     {
//       generatedLine: The line number in the generated code,
//       generatedColumn: The column number in the generated code,
//       source: The path to the original source file that generated this
//               chunk of code,
//       originalLine: The line number in the original source that
//                     corresponds to this chunk of generated code,
//       originalColumn: The column number in the original source that
//                       corresponds to this chunk of generated code,
//       name: The name of the original symbol which generated this chunk of
//             code.
//     }
//
// All properties except for `generatedLine` and `generatedColumn` can be
// `null`.
//
// `_generatedMappings` is ordered by the generated positions.
//
// `_originalMappings` is ordered by the original positions.

SourceMapConsumer$1.prototype.__generatedMappings = null;
Object.defineProperty(SourceMapConsumer$1.prototype, '_generatedMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__generatedMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__generatedMappings;
  }
});

SourceMapConsumer$1.prototype.__originalMappings = null;
Object.defineProperty(SourceMapConsumer$1.prototype, '_originalMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__originalMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__originalMappings;
  }
});

SourceMapConsumer$1.prototype._charIsMappingSeparator =
  function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
    var c = aStr.charAt(index);
    return c === ";" || c === ",";
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
SourceMapConsumer$1.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    throw new Error("Subclasses must implement _parseMappings");
  };

SourceMapConsumer$1.GENERATED_ORDER = 1;
SourceMapConsumer$1.ORIGINAL_ORDER = 2;

SourceMapConsumer$1.GREATEST_LOWER_BOUND = 1;
SourceMapConsumer$1.LEAST_UPPER_BOUND = 2;

/**
 * Iterate over each mapping between an original source/line/column and a
 * generated line/column in this source map.
 *
 * @param Function aCallback
 *        The function that is called with each mapping.
 * @param Object aContext
 *        Optional. If specified, this object will be the value of `this` every
 *        time that `aCallback` is called.
 * @param aOrder
 *        Either `SourceMapConsumer.GENERATED_ORDER` or
 *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
 *        iterate over the mappings sorted by the generated file's line/column
 *        order or the original's source/line/column order, respectively. Defaults to
 *        `SourceMapConsumer.GENERATED_ORDER`.
 */
SourceMapConsumer$1.prototype.eachMapping =
  function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
    var context = aContext || null;
    var order = aOrder || SourceMapConsumer$1.GENERATED_ORDER;

    var mappings;
    switch (order) {
    case SourceMapConsumer$1.GENERATED_ORDER:
      mappings = this._generatedMappings;
      break;
    case SourceMapConsumer$1.ORIGINAL_ORDER:
      mappings = this._originalMappings;
      break;
    default:
      throw new Error("Unknown order of iteration.");
    }

    var sourceRoot = this.sourceRoot;
    mappings.map(function (mapping) {
      var source = mapping.source === null ? null : this._sources.at(mapping.source);
      source = util$1.computeSourceURL(sourceRoot, source, this._sourceMapURL);
      return {
        source: source,
        generatedLine: mapping.generatedLine,
        generatedColumn: mapping.generatedColumn,
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name: mapping.name === null ? null : this._names.at(mapping.name)
      };
    }, this).forEach(aCallback, context);
  };

/**
 * Returns all generated line and column information for the original source,
 * line, and column provided. If no column is provided, returns all mappings
 * corresponding to a either the line we are searching for or the next
 * closest line that has any mappings. Otherwise, returns all mappings
 * corresponding to the given line and either the column we are searching for
 * or the next closest column that has any offsets.
 *
 * The only argument is an object with the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number is 1-based.
 *   - column: Optional. the column number in the original source.
 *    The column number is 0-based.
 *
 * and an array of objects is returned, each with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *    line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *    The column number is 0-based.
 */
SourceMapConsumer$1.prototype.allGeneratedPositionsFor =
  function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
    var line = util$1.getArg(aArgs, 'line');

    // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
    // returns the index of the closest mapping less than the needle. By
    // setting needle.originalColumn to 0, we thus find the last mapping for
    // the given line, provided such a mapping exists.
    var needle = {
      source: util$1.getArg(aArgs, 'source'),
      originalLine: line,
      originalColumn: util$1.getArg(aArgs, 'column', 0)
    };

    needle.source = this._findSourceIndex(needle.source);
    if (needle.source < 0) {
      return [];
    }

    var mappings = [];

    var index = this._findMapping(needle,
                                  this._originalMappings,
                                  "originalLine",
                                  "originalColumn",
                                  util$1.compareByOriginalPositions,
                                  binarySearch.LEAST_UPPER_BOUND);
    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (aArgs.column === undefined) {
        var originalLine = mapping.originalLine;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we found. Since
        // mappings are sorted, this is guaranteed to find all mappings for
        // the line we found.
        while (mapping && mapping.originalLine === originalLine) {
          mappings.push({
            line: util$1.getArg(mapping, 'generatedLine', null),
            column: util$1.getArg(mapping, 'generatedColumn', null),
            lastColumn: util$1.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      } else {
        var originalColumn = mapping.originalColumn;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we were searching for.
        // Since mappings are sorted, this is guaranteed to find all mappings for
        // the line we are searching for.
        while (mapping &&
               mapping.originalLine === line &&
               mapping.originalColumn == originalColumn) {
          mappings.push({
            line: util$1.getArg(mapping, 'generatedLine', null),
            column: util$1.getArg(mapping, 'generatedColumn', null),
            lastColumn: util$1.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      }
    }

    return mappings;
  };

sourceMapConsumer.SourceMapConsumer = SourceMapConsumer$1;

/**
 * A BasicSourceMapConsumer instance represents a parsed source map which we can
 * query for information about the original file positions by giving it a file
 * position in the generated source.
 *
 * The first parameter is the raw source map (either as a JSON string, or
 * already parsed to an object). According to the spec, source maps have the
 * following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - sources: An array of URLs to the original source files.
 *   - names: An array of identifiers which can be referrenced by individual mappings.
 *   - sourceRoot: Optional. The URL root from which all sources are relative.
 *   - sourcesContent: Optional. An array of contents of the original source files.
 *   - mappings: A string of base64 VLQs which contain the actual mappings.
 *   - file: Optional. The generated file this source map is associated with.
 *
 * Here is an example source map, taken from the source map spec[0]:
 *
 *     {
 *       version : 3,
 *       file: "out.js",
 *       sourceRoot : "",
 *       sources: ["foo.js", "bar.js"],
 *       names: ["src", "maps", "are", "fun"],
 *       mappings: "AA,AB;;ABCDE;"
 *     }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
 */
function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util$1.parseSourceMapInput(aSourceMap);
  }

  var version = util$1.getArg(sourceMap, 'version');
  var sources = util$1.getArg(sourceMap, 'sources');
  // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
  // requires the array) to play nice here.
  var names = util$1.getArg(sourceMap, 'names', []);
  var sourceRoot = util$1.getArg(sourceMap, 'sourceRoot', null);
  var sourcesContent = util$1.getArg(sourceMap, 'sourcesContent', null);
  var mappings = util$1.getArg(sourceMap, 'mappings');
  var file = util$1.getArg(sourceMap, 'file', null);

  // Once again, Sass deviates from the spec and supplies the version as a
  // string rather than a number, so we use loose equality checking here.
  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  if (sourceRoot) {
    sourceRoot = util$1.normalize(sourceRoot);
  }

  sources = sources
    .map(String)
    // Some source maps produce relative source paths like "./foo.js" instead of
    // "foo.js".  Normalize these first so that future comparisons will succeed.
    // See bugzil.la/1090768.
    .map(util$1.normalize)
    // Always ensure that absolute sources are internally stored relative to
    // the source root, if the source root is absolute. Not doing this would
    // be particularly problematic when the source root is a prefix of the
    // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
    .map(function (source) {
      return sourceRoot && util$1.isAbsolute(sourceRoot) && util$1.isAbsolute(source)
        ? util$1.relative(sourceRoot, source)
        : source;
    });

  // Pass `true` below to allow duplicate names and sources. While source maps
  // are intended to be compressed and deduplicated, the TypeScript compiler
  // sometimes generates source maps with duplicates in them. See Github issue
  // #72 and bugzil.la/889492.
  this._names = ArraySet.fromArray(names.map(String), true);
  this._sources = ArraySet.fromArray(sources, true);

  this._absoluteSources = this._sources.toArray().map(function (s) {
    return util$1.computeSourceURL(sourceRoot, s, aSourceMapURL);
  });

  this.sourceRoot = sourceRoot;
  this.sourcesContent = sourcesContent;
  this._mappings = mappings;
  this._sourceMapURL = aSourceMapURL;
  this.file = file;
}

BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer$1.prototype);
BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer$1;

/**
 * Utility function to find the index of a source.  Returns -1 if not
 * found.
 */
BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
  var relativeSource = aSource;
  if (this.sourceRoot != null) {
    relativeSource = util$1.relative(this.sourceRoot, relativeSource);
  }

  if (this._sources.has(relativeSource)) {
    return this._sources.indexOf(relativeSource);
  }

  // Maybe aSource is an absolute URL as returned by |sources|.  In
  // this case we can't simply undo the transform.
  var i;
  for (i = 0; i < this._absoluteSources.length; ++i) {
    if (this._absoluteSources[i] == aSource) {
      return i;
    }
  }

  return -1;
};

/**
 * Create a BasicSourceMapConsumer from a SourceMapGenerator.
 *
 * @param SourceMapGenerator aSourceMap
 *        The source map that will be consumed.
 * @param String aSourceMapURL
 *        The URL at which the source map can be found (optional)
 * @returns BasicSourceMapConsumer
 */
BasicSourceMapConsumer.fromSourceMap =
  function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
    var smc = Object.create(BasicSourceMapConsumer.prototype);

    var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
    var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
    smc.sourceRoot = aSourceMap._sourceRoot;
    smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                            smc.sourceRoot);
    smc.file = aSourceMap._file;
    smc._sourceMapURL = aSourceMapURL;
    smc._absoluteSources = smc._sources.toArray().map(function (s) {
      return util$1.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
    });

    // Because we are modifying the entries (by converting string sources and
    // names to indices into the sources and names ArraySets), we have to make
    // a copy of the entry or else bad things happen. Shared mutable state
    // strikes again! See github issue #191.

    var generatedMappings = aSourceMap._mappings.toArray().slice();
    var destGeneratedMappings = smc.__generatedMappings = [];
    var destOriginalMappings = smc.__originalMappings = [];

    for (var i = 0, length = generatedMappings.length; i < length; i++) {
      var srcMapping = generatedMappings[i];
      var destMapping = new Mapping;
      destMapping.generatedLine = srcMapping.generatedLine;
      destMapping.generatedColumn = srcMapping.generatedColumn;

      if (srcMapping.source) {
        destMapping.source = sources.indexOf(srcMapping.source);
        destMapping.originalLine = srcMapping.originalLine;
        destMapping.originalColumn = srcMapping.originalColumn;

        if (srcMapping.name) {
          destMapping.name = names.indexOf(srcMapping.name);
        }

        destOriginalMappings.push(destMapping);
      }

      destGeneratedMappings.push(destMapping);
    }

    quickSort(smc.__originalMappings, util$1.compareByOriginalPositions);

    return smc;
  };

/**
 * The version of the source mapping spec that we are consuming.
 */
BasicSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
  get: function () {
    return this._absoluteSources.slice();
  }
});

/**
 * Provide the JIT with a nice shape / hidden class.
 */
function Mapping() {
  this.generatedLine = 0;
  this.generatedColumn = 0;
  this.source = null;
  this.originalLine = null;
  this.originalColumn = null;
  this.name = null;
}

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
BasicSourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    var generatedLine = 1;
    var previousGeneratedColumn = 0;
    var previousOriginalLine = 0;
    var previousOriginalColumn = 0;
    var previousSource = 0;
    var previousName = 0;
    var length = aStr.length;
    var index = 0;
    var cachedSegments = {};
    var temp = {};
    var originalMappings = [];
    var generatedMappings = [];
    var mapping, str, segment, end, value;

    while (index < length) {
      if (aStr.charAt(index) === ';') {
        generatedLine++;
        index++;
        previousGeneratedColumn = 0;
      }
      else if (aStr.charAt(index) === ',') {
        index++;
      }
      else {
        mapping = new Mapping();
        mapping.generatedLine = generatedLine;

        // Because each offset is encoded relative to the previous one,
        // many segments often have the same encoding. We can exploit this
        // fact by caching the parsed variable length fields of each segment,
        // allowing us to avoid a second parse if we encounter the same
        // segment again.
        for (end = index; end < length; end++) {
          if (this._charIsMappingSeparator(aStr, end)) {
            break;
          }
        }
        str = aStr.slice(index, end);

        segment = cachedSegments[str];
        if (segment) {
          index += str.length;
        } else {
          segment = [];
          while (index < end) {
            base64VLQ.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }

          if (segment.length === 2) {
            throw new Error('Found a source, but no line and column');
          }

          if (segment.length === 3) {
            throw new Error('Found a source and line, but no column');
          }

          cachedSegments[str] = segment;
        }

        // Generated column.
        mapping.generatedColumn = previousGeneratedColumn + segment[0];
        previousGeneratedColumn = mapping.generatedColumn;

        if (segment.length > 1) {
          // Original source.
          mapping.source = previousSource + segment[1];
          previousSource += segment[1];

          // Original line.
          mapping.originalLine = previousOriginalLine + segment[2];
          previousOriginalLine = mapping.originalLine;
          // Lines are stored 0-based
          mapping.originalLine += 1;

          // Original column.
          mapping.originalColumn = previousOriginalColumn + segment[3];
          previousOriginalColumn = mapping.originalColumn;

          if (segment.length > 4) {
            // Original name.
            mapping.name = previousName + segment[4];
            previousName += segment[4];
          }
        }

        generatedMappings.push(mapping);
        if (typeof mapping.originalLine === 'number') {
          originalMappings.push(mapping);
        }
      }
    }

    quickSort(generatedMappings, util$1.compareByGeneratedPositionsDeflated);
    this.__generatedMappings = generatedMappings;

    quickSort(originalMappings, util$1.compareByOriginalPositions);
    this.__originalMappings = originalMappings;
  };

/**
 * Find the mapping that best matches the hypothetical "needle" mapping that
 * we are searching for in the given "haystack" of mappings.
 */
BasicSourceMapConsumer.prototype._findMapping =
  function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                         aColumnName, aComparator, aBias) {
    // To return the position we are searching for, we must first find the
    // mapping for the given position and then return the opposite position it
    // points to. Because the mappings are sorted, we can use binary search to
    // find the best mapping.

    if (aNeedle[aLineName] <= 0) {
      throw new TypeError('Line must be greater than or equal to 1, got '
                          + aNeedle[aLineName]);
    }
    if (aNeedle[aColumnName] < 0) {
      throw new TypeError('Column must be greater than or equal to 0, got '
                          + aNeedle[aColumnName]);
    }

    return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
  };

/**
 * Compute the last column for each generated mapping. The last column is
 * inclusive.
 */
BasicSourceMapConsumer.prototype.computeColumnSpans =
  function SourceMapConsumer_computeColumnSpans() {
    for (var index = 0; index < this._generatedMappings.length; ++index) {
      var mapping = this._generatedMappings[index];

      // Mappings do not contain a field for the last generated columnt. We
      // can come up with an optimistic estimate, however, by assuming that
      // mappings are contiguous (i.e. given two consecutive mappings, the
      // first mapping ends where the second one starts).
      if (index + 1 < this._generatedMappings.length) {
        var nextMapping = this._generatedMappings[index + 1];

        if (mapping.generatedLine === nextMapping.generatedLine) {
          mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
          continue;
        }
      }

      // The last mapping for each line spans the entire line.
      mapping.lastGeneratedColumn = Infinity;
    }
  };

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
BasicSourceMapConsumer.prototype.originalPositionFor =
  function SourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util$1.getArg(aArgs, 'line'),
      generatedColumn: util$1.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._generatedMappings,
      "generatedLine",
      "generatedColumn",
      util$1.compareByGeneratedPositionsDeflated,
      util$1.getArg(aArgs, 'bias', SourceMapConsumer$1.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._generatedMappings[index];

      if (mapping.generatedLine === needle.generatedLine) {
        var source = util$1.getArg(mapping, 'source', null);
        if (source !== null) {
          source = this._sources.at(source);
          source = util$1.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
        }
        var name = util$1.getArg(mapping, 'name', null);
        if (name !== null) {
          name = this._names.at(name);
        }
        return {
          source: source,
          line: util$1.getArg(mapping, 'originalLine', null),
          column: util$1.getArg(mapping, 'originalColumn', null),
          name: name
        };
      }
    }

    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
  function BasicSourceMapConsumer_hasContentsOfAllSources() {
    if (!this.sourcesContent) {
      return false;
    }
    return this.sourcesContent.length >= this._sources.size() &&
      !this.sourcesContent.some(function (sc) { return sc == null; });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
BasicSourceMapConsumer.prototype.sourceContentFor =
  function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    if (!this.sourcesContent) {
      return null;
    }

    var index = this._findSourceIndex(aSource);
    if (index >= 0) {
      return this.sourcesContent[index];
    }

    var relativeSource = aSource;
    if (this.sourceRoot != null) {
      relativeSource = util$1.relative(this.sourceRoot, relativeSource);
    }

    var url;
    if (this.sourceRoot != null
        && (url = util$1.urlParse(this.sourceRoot))) {
      // XXX: file:// URIs and absolute paths lead to unexpected behavior for
      // many users. We can help them out when they expect file:// URIs to
      // behave like it would if they were running a local HTTP server. See
      // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
      var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
      if (url.scheme == "file"
          && this._sources.has(fileUriAbsPath)) {
        return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
      }

      if ((!url.path || url.path == "/")
          && this._sources.has("/" + relativeSource)) {
        return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
      }
    }

    // This function is used recursively from
    // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
    // don't want to throw if we can't find the source - we just want to
    // return null, so we provide a flag to exit gracefully.
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + relativeSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
BasicSourceMapConsumer.prototype.generatedPositionFor =
  function SourceMapConsumer_generatedPositionFor(aArgs) {
    var source = util$1.getArg(aArgs, 'source');
    source = this._findSourceIndex(source);
    if (source < 0) {
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }

    var needle = {
      source: source,
      originalLine: util$1.getArg(aArgs, 'line'),
      originalColumn: util$1.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._originalMappings,
      "originalLine",
      "originalColumn",
      util$1.compareByOriginalPositions,
      util$1.getArg(aArgs, 'bias', SourceMapConsumer$1.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (mapping.source === needle.source) {
        return {
          line: util$1.getArg(mapping, 'generatedLine', null),
          column: util$1.getArg(mapping, 'generatedColumn', null),
          lastColumn: util$1.getArg(mapping, 'lastGeneratedColumn', null)
        };
      }
    }

    return {
      line: null,
      column: null,
      lastColumn: null
    };
  };

sourceMapConsumer.BasicSourceMapConsumer = BasicSourceMapConsumer;

/**
 * An IndexedSourceMapConsumer instance represents a parsed source map which
 * we can query for information. It differs from BasicSourceMapConsumer in
 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
 * input.
 *
 * The first parameter is a raw source map (either as a JSON string, or already
 * parsed to an object). According to the spec for indexed source maps, they
 * have the following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - file: Optional. The generated file this source map is associated with.
 *   - sections: A list of section definitions.
 *
 * Each value under the "sections" field has two fields:
 *   - offset: The offset into the original specified at which this section
 *       begins to apply, defined as an object with a "line" and "column"
 *       field.
 *   - map: A source map definition. This source map could also be indexed,
 *       but doesn't have to be.
 *
 * Instead of the "map" field, it's also possible to have a "url" field
 * specifying a URL to retrieve a source map from, but that's currently
 * unsupported.
 *
 * Here's an example source map, taken from the source map spec[0], but
 * modified to omit a section which uses the "url" field.
 *
 *  {
 *    version : 3,
 *    file: "app.js",
 *    sections: [{
 *      offset: {line:100, column:10},
 *      map: {
 *        version : 3,
 *        file: "section.js",
 *        sources: ["foo.js", "bar.js"],
 *        names: ["src", "maps", "are", "fun"],
 *        mappings: "AAAA,E;;ABCDE;"
 *      }
 *    }],
 *  }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
 */
function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util$1.parseSourceMapInput(aSourceMap);
  }

  var version = util$1.getArg(sourceMap, 'version');
  var sections = util$1.getArg(sourceMap, 'sections');

  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  this._sources = new ArraySet();
  this._names = new ArraySet();

  var lastOffset = {
    line: -1,
    column: 0
  };
  this._sections = sections.map(function (s) {
    if (s.url) {
      // The url field will require support for asynchronicity.
      // See https://github.com/mozilla/source-map/issues/16
      throw new Error('Support for url field in sections not implemented.');
    }
    var offset = util$1.getArg(s, 'offset');
    var offsetLine = util$1.getArg(offset, 'line');
    var offsetColumn = util$1.getArg(offset, 'column');

    if (offsetLine < lastOffset.line ||
        (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
      throw new Error('Section offsets must be ordered and non-overlapping.');
    }
    lastOffset = offset;

    return {
      generatedOffset: {
        // The offset fields are 0-based, but we use 1-based indices when
        // encoding/decoding from VLQ.
        generatedLine: offsetLine + 1,
        generatedColumn: offsetColumn + 1
      },
      consumer: new SourceMapConsumer$1(util$1.getArg(s, 'map'), aSourceMapURL)
    }
  });
}

IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer$1.prototype);
IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer$1;

/**
 * The version of the source mapping spec that we are consuming.
 */
IndexedSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
  get: function () {
    var sources = [];
    for (var i = 0; i < this._sections.length; i++) {
      for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
        sources.push(this._sections[i].consumer.sources[j]);
      }
    }
    return sources;
  }
});

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
IndexedSourceMapConsumer.prototype.originalPositionFor =
  function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util$1.getArg(aArgs, 'line'),
      generatedColumn: util$1.getArg(aArgs, 'column')
    };

    // Find the section containing the generated position we're trying to map
    // to an original position.
    var sectionIndex = binarySearch.search(needle, this._sections,
      function(needle, section) {
        var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
        if (cmp) {
          return cmp;
        }

        return (needle.generatedColumn -
                section.generatedOffset.generatedColumn);
      });
    var section = this._sections[sectionIndex];

    if (!section) {
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }

    return section.consumer.originalPositionFor({
      line: needle.generatedLine -
        (section.generatedOffset.generatedLine - 1),
      column: needle.generatedColumn -
        (section.generatedOffset.generatedLine === needle.generatedLine
         ? section.generatedOffset.generatedColumn - 1
         : 0),
      bias: aArgs.bias
    });
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
  function IndexedSourceMapConsumer_hasContentsOfAllSources() {
    return this._sections.every(function (s) {
      return s.consumer.hasContentsOfAllSources();
    });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
IndexedSourceMapConsumer.prototype.sourceContentFor =
  function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      var content = section.consumer.sourceContentFor(aSource, true);
      if (content) {
        return content;
      }
    }
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based. 
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
IndexedSourceMapConsumer.prototype.generatedPositionFor =
  function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      // Only consider this section if the requested source is in the list of
      // sources of the consumer.
      if (section.consumer._findSourceIndex(util$1.getArg(aArgs, 'source')) === -1) {
        continue;
      }
      var generatedPosition = section.consumer.generatedPositionFor(aArgs);
      if (generatedPosition) {
        var ret = {
          line: generatedPosition.line +
            (section.generatedOffset.generatedLine - 1),
          column: generatedPosition.column +
            (section.generatedOffset.generatedLine === generatedPosition.line
             ? section.generatedOffset.generatedColumn - 1
             : 0)
        };
        return ret;
      }
    }

    return {
      line: null,
      column: null
    };
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
IndexedSourceMapConsumer.prototype._parseMappings =
  function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    this.__generatedMappings = [];
    this.__originalMappings = [];
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];
      var sectionMappings = section.consumer._generatedMappings;
      for (var j = 0; j < sectionMappings.length; j++) {
        var mapping = sectionMappings[j];

        var source = section.consumer._sources.at(mapping.source);
        source = util$1.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
        this._sources.add(source);
        source = this._sources.indexOf(source);

        var name = null;
        if (mapping.name) {
          name = section.consumer._names.at(mapping.name);
          this._names.add(name);
          name = this._names.indexOf(name);
        }

        // The mappings coming from the consumer for the section have
        // generated positions relative to the start of the section, so we
        // need to offset them to be relative to the start of the concatenated
        // generated file.
        var adjustedMapping = {
          source: source,
          generatedLine: mapping.generatedLine +
            (section.generatedOffset.generatedLine - 1),
          generatedColumn: mapping.generatedColumn +
            (section.generatedOffset.generatedLine === mapping.generatedLine
            ? section.generatedOffset.generatedColumn - 1
            : 0),
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: name
        };

        this.__generatedMappings.push(adjustedMapping);
        if (typeof adjustedMapping.originalLine === 'number') {
          this.__originalMappings.push(adjustedMapping);
        }
      }
    }

    quickSort(this.__generatedMappings, util$1.compareByGeneratedPositionsDeflated);
    quickSort(this.__originalMappings, util$1.compareByOriginalPositions);
  };

sourceMapConsumer.IndexedSourceMapConsumer = IndexedSourceMapConsumer;

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var SourceMapGenerator = sourceMapGenerator.SourceMapGenerator;
var util = util$5;

// Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
// operating systems these days (capturing the result).
var REGEX_NEWLINE = /(\r?\n)/;

// Newline character code for charCodeAt() comparisons
var NEWLINE_CODE = 10;

// Private symbol for identifying `SourceNode`s when multiple versions of
// the source-map library are loaded. This MUST NOT CHANGE across
// versions!
var isSourceNode = "$$$isSourceNode$$$";

/**
 * SourceNodes provide a way to abstract over interpolating/concatenating
 * snippets of generated JavaScript source code while maintaining the line and
 * column information associated with the original source code.
 *
 * @param aLine The original line number.
 * @param aColumn The original column number.
 * @param aSource The original source's filename.
 * @param aChunks Optional. An array of strings which are snippets of
 *        generated JS, or other SourceNodes.
 * @param aName The original identifier.
 */
function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
  this.children = [];
  this.sourceContents = {};
  this.line = aLine == null ? null : aLine;
  this.column = aColumn == null ? null : aColumn;
  this.source = aSource == null ? null : aSource;
  this.name = aName == null ? null : aName;
  this[isSourceNode] = true;
  if (aChunks != null) this.add(aChunks);
}

/**
 * Creates a SourceNode from generated code and a SourceMapConsumer.
 *
 * @param aGeneratedCode The generated code
 * @param aSourceMapConsumer The SourceMap for the generated code
 * @param aRelativePath Optional. The path that relative sources in the
 *        SourceMapConsumer should be relative to.
 */
SourceNode.fromStringWithSourceMap =
  function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
    // The SourceNode we want to fill with the generated code
    // and the SourceMap
    var node = new SourceNode();

    // All even indices of this array are one line of the generated code,
    // while all odd indices are the newlines between two adjacent lines
    // (since `REGEX_NEWLINE` captures its match).
    // Processed fragments are accessed by calling `shiftNextLine`.
    var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
    var remainingLinesIndex = 0;
    var shiftNextLine = function() {
      var lineContents = getNextLine();
      // The last line of a file might not have a newline.
      var newLine = getNextLine() || "";
      return lineContents + newLine;

      function getNextLine() {
        return remainingLinesIndex < remainingLines.length ?
            remainingLines[remainingLinesIndex++] : undefined;
      }
    };

    // We need to remember the position of "remainingLines"
    var lastGeneratedLine = 1, lastGeneratedColumn = 0;

    // The generate SourceNodes we need a code range.
    // To extract it current and last mapping is used.
    // Here we store the last mapping.
    var lastMapping = null;

    aSourceMapConsumer.eachMapping(function (mapping) {
      if (lastMapping !== null) {
        // We add the code from "lastMapping" to "mapping":
        // First check if there is a new line in between.
        if (lastGeneratedLine < mapping.generatedLine) {
          // Associate first line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
          lastGeneratedLine++;
          lastGeneratedColumn = 0;
          // The remaining code is added without mapping
        } else {
          // There is no new line in between.
          // Associate the code between "lastGeneratedColumn" and
          // "mapping.generatedColumn" with "lastMapping"
          var nextLine = remainingLines[remainingLinesIndex] || '';
          var code = nextLine.substr(0, mapping.generatedColumn -
                                        lastGeneratedColumn);
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn -
                                              lastGeneratedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
          addMappingWithCode(lastMapping, code);
          // No more remaining code, continue
          lastMapping = mapping;
          return;
        }
      }
      // We add the generated code until the first mapping
      // to the SourceNode without any mapping.
      // Each line is added as separate string.
      while (lastGeneratedLine < mapping.generatedLine) {
        node.add(shiftNextLine());
        lastGeneratedLine++;
      }
      if (lastGeneratedColumn < mapping.generatedColumn) {
        var nextLine = remainingLines[remainingLinesIndex] || '';
        node.add(nextLine.substr(0, mapping.generatedColumn));
        remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
        lastGeneratedColumn = mapping.generatedColumn;
      }
      lastMapping = mapping;
    }, this);
    // We have processed all mappings.
    if (remainingLinesIndex < remainingLines.length) {
      if (lastMapping) {
        // Associate the remaining code in the current line with "lastMapping"
        addMappingWithCode(lastMapping, shiftNextLine());
      }
      // and add the remaining lines without any mapping
      node.add(remainingLines.splice(remainingLinesIndex).join(""));
    }

    // Copy sourcesContent into SourceNode
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aRelativePath != null) {
          sourceFile = util.join(aRelativePath, sourceFile);
        }
        node.setSourceContent(sourceFile, content);
      }
    });

    return node;

    function addMappingWithCode(mapping, code) {
      if (mapping === null || mapping.source === undefined) {
        node.add(code);
      } else {
        var source = aRelativePath
          ? util.join(aRelativePath, mapping.source)
          : mapping.source;
        node.add(new SourceNode(mapping.originalLine,
                                mapping.originalColumn,
                                source,
                                code,
                                mapping.name));
      }
    }
  };

/**
 * Add a chunk of generated JS to this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.add = function SourceNode_add(aChunk) {
  if (Array.isArray(aChunk)) {
    aChunk.forEach(function (chunk) {
      this.add(chunk);
    }, this);
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    if (aChunk) {
      this.children.push(aChunk);
    }
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Add a chunk of generated JS to the beginning of this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
  if (Array.isArray(aChunk)) {
    for (var i = aChunk.length-1; i >= 0; i--) {
      this.prepend(aChunk[i]);
    }
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    this.children.unshift(aChunk);
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Walk over the tree of JS snippets in this node and its children. The
 * walking function is called once for each snippet of JS and is passed that
 * snippet and the its original associated source's line/column location.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walk = function SourceNode_walk(aFn) {
  var chunk;
  for (var i = 0, len = this.children.length; i < len; i++) {
    chunk = this.children[i];
    if (chunk[isSourceNode]) {
      chunk.walk(aFn);
    }
    else {
      if (chunk !== '') {
        aFn(chunk, { source: this.source,
                     line: this.line,
                     column: this.column,
                     name: this.name });
      }
    }
  }
};

/**
 * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
 * each of `this.children`.
 *
 * @param aSep The separator.
 */
SourceNode.prototype.join = function SourceNode_join(aSep) {
  var newChildren;
  var i;
  var len = this.children.length;
  if (len > 0) {
    newChildren = [];
    for (i = 0; i < len-1; i++) {
      newChildren.push(this.children[i]);
      newChildren.push(aSep);
    }
    newChildren.push(this.children[i]);
    this.children = newChildren;
  }
  return this;
};

/**
 * Call String.prototype.replace on the very right-most source snippet. Useful
 * for trimming whitespace from the end of a source node, etc.
 *
 * @param aPattern The pattern to replace.
 * @param aReplacement The thing to replace the pattern with.
 */
SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
  var lastChild = this.children[this.children.length - 1];
  if (lastChild[isSourceNode]) {
    lastChild.replaceRight(aPattern, aReplacement);
  }
  else if (typeof lastChild === 'string') {
    this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
  }
  else {
    this.children.push(''.replace(aPattern, aReplacement));
  }
  return this;
};

/**
 * Set the source content for a source file. This will be added to the SourceMapGenerator
 * in the sourcesContent field.
 *
 * @param aSourceFile The filename of the source file
 * @param aSourceContent The content of the source file
 */
SourceNode.prototype.setSourceContent =
  function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
    this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
  };

/**
 * Walk over the tree of SourceNodes. The walking function is called for each
 * source file content and is passed the filename and source content.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walkSourceContents =
  function SourceNode_walkSourceContents(aFn) {
    for (var i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i][isSourceNode]) {
        this.children[i].walkSourceContents(aFn);
      }
    }

    var sources = Object.keys(this.sourceContents);
    for (var i = 0, len = sources.length; i < len; i++) {
      aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
    }
  };

/**
 * Return the string representation of this source node. Walks over the tree
 * and concatenates all the various snippets together to one string.
 */
SourceNode.prototype.toString = function SourceNode_toString() {
  var str = "";
  this.walk(function (chunk) {
    str += chunk;
  });
  return str;
};

/**
 * Returns the string representation of this source node along with a source
 * map.
 */
SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
  var generated = {
    code: "",
    line: 1,
    column: 0
  };
  var map = new SourceMapGenerator(aArgs);
  var sourceMappingActive = false;
  var lastOriginalSource = null;
  var lastOriginalLine = null;
  var lastOriginalColumn = null;
  var lastOriginalName = null;
  this.walk(function (chunk, original) {
    generated.code += chunk;
    if (original.source !== null
        && original.line !== null
        && original.column !== null) {
      if(lastOriginalSource !== original.source
         || lastOriginalLine !== original.line
         || lastOriginalColumn !== original.column
         || lastOriginalName !== original.name) {
        map.addMapping({
          source: original.source,
          original: {
            line: original.line,
            column: original.column
          },
          generated: {
            line: generated.line,
            column: generated.column
          },
          name: original.name
        });
      }
      lastOriginalSource = original.source;
      lastOriginalLine = original.line;
      lastOriginalColumn = original.column;
      lastOriginalName = original.name;
      sourceMappingActive = true;
    } else if (sourceMappingActive) {
      map.addMapping({
        generated: {
          line: generated.line,
          column: generated.column
        }
      });
      lastOriginalSource = null;
      sourceMappingActive = false;
    }
    for (var idx = 0, length = chunk.length; idx < length; idx++) {
      if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
        generated.line++;
        generated.column = 0;
        // Mappings end at eol
        if (idx + 1 === length) {
          lastOriginalSource = null;
          sourceMappingActive = false;
        } else if (sourceMappingActive) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
      } else {
        generated.column++;
      }
    }
  });
  this.walkSourceContents(function (sourceFile, sourceContent) {
    map.setSourceContent(sourceFile, sourceContent);
  });

  return { code: generated.code, map: map };
};

/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
var SourceMapConsumer = sourceMapConsumer.SourceMapConsumer;

/**
 * 校正异常的堆栈信息
 * 
 * 由于 rollup 会打包所有代码到一个文件，所以异常的调用栈定位和源码的位置是不同的
 * 本模块就是用来将异常的调用栈映射至源代码位置
 * 
 * @see https://github.com/screepers/screeps-typescript-starter/blob/master/src/utils/ErrorMapper.ts
 */

 // 缓存 SourceMap
 let consumer = null;
 
 // 第一次报错时创建 sourceMap
 const getConsumer = function () {
     if (consumer == null) consumer = new SourceMapConsumer(require("main.js.map"));
     return consumer
 };
 
 // 缓存映射关系以提高性能
 const cache = {};
 
 /**
  * 使用源映射生成堆栈跟踪，并生成原始标志位
  * 警告 - global 重置之后的首次调用会产生很高的 cpu 消耗 (> 30 CPU)
  * 之后的每次调用会产生较低的 cpu 消耗 (~ 0.1 CPU / 次)
  *
  * @param {Error | string} error 错误或原始追踪栈
  * @returns {string} 映射之后的源代码追踪栈
  */
 const sourceMappedStackTrace = function (error) {
     const stack = error instanceof Error ? error.stack : error;
     // 有缓存直接用
     if (cache.hasOwnProperty(stack)) return cache[stack]
 
     const re = /^\s+at\s+(.+?\s+)?\(?([0-z._\-\\\/]+):(\d+):(\d+)\)?$/gm;
     let match;
     let outStack = error.toString();
     console.log("ErrorMapper -> sourceMappedStackTrace -> outStack", outStack);
 
     while ((match = re.exec(stack))) {
         // 解析完成
         if (match[2] !== "main") break
         
         // 获取追踪定位
         const pos = getConsumer().originalPositionFor({
             column: parseInt(match[4], 10),
             line: parseInt(match[3], 10)
         });
 
         // 无法定位
         if (!pos.line) break
         
         // 解析追踪栈
         if (pos.name) outStack += `\n    at ${pos.name} (${pos.source}:${pos.line}:${pos.column})`;
         else {
             // 源文件没找到对应文件名，采用原始追踪名
             if (match[1]) outStack += `\n    at ${match[1]} (${pos.source}:${pos.line}:${pos.column})`;
             // 源文件没找到对应文件名并且原始追踪栈里也没有，直接省略
             else outStack += `\n    at ${pos.source}:${pos.line}:${pos.column}`;
         }
     }
 
     cache[stack] = outStack;
     return outStack
 };
 
 /**
  * 错误追踪包装器
  * 用于把报错信息通过 source-map 解析成源代码的错误位置
  * 和原本 wrapLoop 的区别是，wrapLoop 会返回一个新函数，而这个会直接执行
  * 
  * @param next 玩家代码
  */
 const errorMapper = function (next) {
     return () => {
         try {
             // 执行玩家代码
             next();
         }
         catch (e) {
             if (e instanceof Error) {
                 // 渲染报错调用栈，沙盒模式用不了这个
                 const errorMessage = Game.rooms.sim ?
                     `沙盒模式无法使用 source-map - 显示原始追踪栈<br>${_.escape(e.stack)}` :
                     `${_.escape(sourceMappedStackTrace(e))}`;
                 
                 console.log(`<text style="color:#ef9a9a">${errorMessage}</text>`);
             }
             // 处理不了，直接抛出
             else throw e
         }
     }
 };

/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Upgrader');
 * mod.thing == 'a thing'; // true
 */

const Upgrader$1 = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
	    }
	    if(!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
	        creep.memory.upgrading = true;
	    }

	    if(creep.memory.upgrading) {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
        else {
            // if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.storage)
            // }

            if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
	}
};

const Harvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if(!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.harvesting = true;
        }
        if(creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
        }
        
        if (!creep.memory.harvesting){
            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_TOWER) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
            });
            targets = _.sortBy(targets, (s) => creep.pos.getRangeTo(s));
            if(targets.length && creep.store[RESOURCE_ENERGY] == creep.store.getUsedCapacity()) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            //if nothing to store
            else {
                var storage = creep.room.storage;
                for (const resourceType in creep.store){
                    if (creep.transfer(storage,resourceType) == ERR_NOT_IN_RANGE){
                        creep.moveTo(storage);
                    }
                }
            

            }

        //// transfer all resources
// for(const resourceType in creep.carry) {
//     creep.transfer(storage, resourceType);
// }

        }else {
            // if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.storage)
            // }


            var droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
                    filter: (d) => d.amount >= 10
                });

            // var tombEnergy = creep.room.find(FIND_TOMBSTONES, {
            //     filter: (s) => s.creep.store != null
            // });
            // console.log(tombEnergy)
            
            if (droppedEnergy.length){
                if (creep.pickup(droppedEnergy[0]) == ERR_NOT_IN_RANGE){
                    creep.moveTo(droppedEnergy[0]);
                }
            }

            // else if(tombEnergy.length){
            //     for (const resourceType in tombEnergy[0].store){
            //         if (creep.withdraw(tombEnergy[0],resourceType) == ERR_NOT_IN_RANGE){
            //             creep.moveTo(tombEnergy[0])
            //         }
            //     }
            // }

            else {
                if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
                  }
            }

          }
        }
};

/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Upgrader');
 * mod.thing == 'a thing'; // true
 */

const Upgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
	    }
	    if(!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
	        creep.memory.upgrading = true;
	    }

	    if(creep.memory.upgrading) {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
        else {
            // if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.storage)
            // }

            if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
	}
};

/*
* Module code goes here. Use 'module.exports' to export things:
* module.exports.thing = 'a thing';
*
* You can import it from another modules like this:
* var mod = require('Repairer');
* mod.thing == 'a thing'; // true
*/
const WallRepairer$1 = {

  /** @param {Creep} creep **/
  run: function(creep) {

    if(creep.memory.repairing && creep.store[RESOURCE_ENERGY] == 0) {
          creep.memory.repairing = false;
    }
    if(!creep.memory.repairing && creep.store.getFreeCapacity() == 0) {
        creep.memory.repairing = true;
    }

    if(creep.memory.repairing) {


        var ramparts = creep.room.find(FIND_STRUCTURES, {
            filter: (s) => 
                s.structureType ==  STRUCTURE_RAMPART && (s.hits/s.hitsMax) < 0.6
            
        });
        var findRampart = function(){
            let rampart = _.sortBy(ramparts, (r)=> r.hits/r.hitsMax);
            return rampart[0];
        };
        if (ramparts.length){
            if (creep.memory.target == '' || creep.memory.target == undefined || creep.memory.target.structureType != STRUCTURE_RAMPART){
                creep.memory.target = findRampart();     
            }
            else if (creep.memory.target != undefined && creep.memory.target.hits/creep.memory.target.hitsMax < 0.6){
                if(creep.repair(Game.getObjectById(creep.memory.target.id)) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(Game.getObjectById(creep.memory.target.id), {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            else {
                creep.memory.target = '';
            }
        }
        else {     
            var walls = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => {
                  return (s.structureType == STRUCTURE_WALL && s.hits/s.hitsMax < 0.3)
                          
                } });

            var findTarget = function(){
                let wall = _.sortBy(walls,(w)=> w.hits/w.hitsMax);
                return wall[0];
            };
            if (creep.memory.target == "" || creep.memory.target == undefined){
                creep.memory.target = findTarget();
                if (!creep.memory.target){
                    Upgrader$1.run(creep);
                }
            }
            else if (creep.memory.target.hits/creep.memory.target.hitsMax < 0.2){
                    if(creep.repair(Game.getObjectById(creep.memory.target.id)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.getObjectById(creep.memory.target.id), {visualizePathStyle: {stroke: '#ffffff'}});
                    }
            }
            else {
                creep.memory.target = "";
            }
        }

              

    }
    else {
            // if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.storage)
            // }

          if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
              creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
          }

    }
}
};

const Builder = {

  /** @param {Creep} creep **/
  run: function(creep,source) {

    if(creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
          creep.memory.building = false;
    }
    if(!creep.memory.building && creep.store.getFreeCapacity() == 0) {
        creep.memory.building = true;
    }

    if(creep.memory.building) {
        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
          if(targets.length) {
              if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                  creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
              }
          }
          else {
              WallRepairer$1.run(creep,source);
          }
    }
    else {



            // if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.storage)
            // }

            if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});          
        }
    }
}
};

/*
* Module code goes here. Use 'module.exports' to export things:
* module.exports.thing = 'a thing';
*
* You can import it from another modules like this:
* var mod = require('Repairer');
* mod.thing == 'a thing'; // true
*/

const Repairer = {

  /** @param {Creep} creep **/
  run: function(creep,source) {

    if(creep.memory.repairing && creep.store[RESOURCE_ENERGY] == 0) {
          creep.memory.repairing = false;
    }
    if(!creep.memory.repairing && creep.store.getFreeCapacity() == 0) {
        creep.memory.repairing = true;
    }

    if(creep.memory.repairing) {
        var targets = creep.room.find(FIND_STRUCTURES, {
            filter: (s) => 
                s.structureType !=  STRUCTURE_WALL &&  s.structureType != STRUCTURE_RAMPART && s.hits < s.hitsMax 
                
        });
        var target = _.sortBy(targets,(r)=> r.hits/r.hitsMax);
        if(target.length) {
            if(creep.repair(target[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target[0], {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
        // if nothing to repair
        else {
            Upgrader$1.run(creep);
            }
    } 
    else {
        // if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
        //         creep.moveTo(creep.room.storage)
        //     }
          if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
              creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
          }
    }
}
};

const CrossHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if(!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.harvesting = true;
        }
        if(creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
        }
        
        if (creep.memory.harvesting){
            if (creep.room.name == creep.memory.target){
                var findSource = function(){
                    var source = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => {
                        return s.structureType == STRUCTURE_TOWER || s.structureType == STRUCTURE_EXTENSION && s.store[RESOURCE_ENERGY] > 0
                    }
                    //s.structureType == STRUCTURE_EXTENSION
    
                    });
                    return source[0];
                };

                creep.memory.source = findSource();
                if (creep.memory.source != undefined){

                    if (creep.memory.source.store[RESOURCE_ENERGY] > 0){
                        if (creep.withdraw(creep.memory.source,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                            creep.moveTo(creep.memory.source);
                        }
                    }
                    else {
                        creep.memory.source = findSource();
                    }
                }
                else {
                    creep.memory.harvesting = false;
                }
            }
            // if creep is not in the target room
            else {
                let exit = creep.room.findExitTo(creep.memory.target);
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }

        
        // finished harvesting
        }
        else {
            if (creep.room.name == creep.memory.home){
                var storage = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => {
                        return s.structureType == STRUCTURE_STORAGE &&
                            s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    }
                });
                if (storage.length){
                    if(creep.transfer(storage[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(storage[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    } 
                }
                else {
                    Harvester.run(creep);
                }
  
            }
            
            // if not in home room
            else {
                let exit = creep.room.findExitTo(creep.memory.home);
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }

        }


        }
};

const CrossSourceHarvester = {

    /** @param {Creep} creep **/
    run: function(creep,source) {
        if(!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.harvesting = true;
        }
        if(creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
        }
        
        if (creep.memory.harvesting){
            if (creep.room.name == creep.memory.target){
                var droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
                    filter: (d) => d.amount >= 10
                });
                if (droppedEnergy.length){
                    if (creep.pickup(droppedEnergy[0]) == ERR_NOT_IN_RANGE){
                        creep.moveTo(droppedEnergy[0]);
                    }
                }
                else {
                    if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source);
                    }
                }
                
            }
            // if creep is not in the target room
            else {
                let exit = creep.room.findExitTo(creep.memory.target);
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }

        
        // finished harvesting
        }
        else {
            if (creep.room.name == creep.memory.home){
                // var storage = creep.room.find(FIND_STRUCTURES, {
                //     filter: (s) => {
                //         return s.structureType == STRUCTURE_STORAGE &&
                //         s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                //     }
                // });
                // if (storage.length){
                //     if(creep.transfer(storage[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                //         creep.moveTo(storage[0], {visualizePathStyle: {stroke: '#ffffff'}});
                //     } 
                // }
                // else{
                    Harvester.run(creep);
                //}
                
            }
            
            // if not in home room
            else {
                let exit = creep.room.findExitTo(creep.memory.home);
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }

        }


        }
};

/*
* Module code goes here. Use 'module.exports' to export things:
* module.exports.thing = 'a thing';
*
* You can import it from another modules like this:
* var mod = require('Repairer');
* mod.thing == 'a thing'; // true
*/
const WallRepairer = {

  /** @param {Creep} creep **/
  run: function(creep) {

    if(creep.memory.repairing && creep.store[RESOURCE_ENERGY] == 0) {
          creep.memory.repairing = false;
    }
    if(!creep.memory.repairing && creep.store.getFreeCapacity() == 0) {
        creep.memory.repairing = true;
    }

    if(creep.memory.repairing) {


        var ramparts = creep.room.find(FIND_STRUCTURES, {
            filter: (s) => 
                s.structureType ==  STRUCTURE_RAMPART && (s.hits/s.hitsMax) < 0.6
            
        });
        var findRampart = function(){
            let rampart = _.sortBy(ramparts, (r)=> r.hits/r.hitsMax);
            return rampart[0];
        };
        if (ramparts.length){
            if (creep.memory.target == '' || creep.memory.target == undefined || creep.memory.target.structureType != STRUCTURE_RAMPART){
                creep.memory.target = findRampart();     
            }
            else if (creep.memory.target != undefined && creep.memory.target.hits/creep.memory.target.hitsMax < 0.6){
                if(creep.repair(Game.getObjectById(creep.memory.target.id)) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(Game.getObjectById(creep.memory.target.id), {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            else {
                creep.memory.target = '';
            }
        }
        else {     
            var walls = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => {
                  return (s.structureType == STRUCTURE_WALL && s.hits/s.hitsMax < 0.3)
                          
                } });

            var findTarget = function(){
                let wall = _.sortBy(walls,(w)=> w.hits/w.hitsMax);
                return wall[0];
            };
            if (creep.memory.target == "" || creep.memory.target == undefined){
                creep.memory.target = findTarget();
                if (!creep.memory.target){
                    Upgrader$1.run(creep);
                }
            }
            else if (creep.memory.target.hits/creep.memory.target.hitsMax < 0.2){
                    if(creep.repair(Game.getObjectById(creep.memory.target.id)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.getObjectById(creep.memory.target.id), {visualizePathStyle: {stroke: '#ffffff'}});
                    }
            }
            else {
                creep.memory.target = "";
            }
        }

              

    }
    else {
            // if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.storage)
            // }

          if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
              creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
          }

    }
}
};

commonjsGlobal.Talk= [ "/涩图排行","涩图来","涩图来","哦对了，这个排行只有10名","大家加油，榜上留名","建议id过滤一下 不然太长了233","大佬们五级可以开外矿了吗，感觉能量不够用了涩图","没事，我相信大家都会用电脑聊天的","我要做个刷榜战神","截取到[ 和(","4级就可以开外矿了","房间少的时候外矿多多益善","所以你问个问题后面为啥还要加个涩图","claim太吃资源了我怕外面挖的还没消耗的多涩图","涩图！！！","涩图！来！","不是，那只是提示我自己看涩 图的","涩图一连涩图二连涩图三连涩图四连涩图五连",".","lsp排行","好活","想多了我的正则只匹配第一个","涩图三连涩图二连涩图一连","第一个（）","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","。。","除非改（）","哈哈，我知道，我就是想吐槽","机器人直接在e盘找图里随机发（）","你们可以加入一起改呀，让曲奇邀请下","github账号 yangpei1010110","bot群实锤","涩图！","图","建议加个文件系统（）","比如简单一些的minio之类的（）","minio是什么","类似fastDFS","涩图！","lsp排行","这我也看过了诶","这个群变了","写游戏bot也是bot，qqbot也是bot（）","没有区别呢（）","直接pr就行了","噢噢。。","涩图十连","很好，你成为lsp排行榜发布之后第一个十连的","lsp排行","十连直接冲到第一名（）","涩图三十连","lsp排行","别想太多","我的逻辑跟他的逻辑基本一致","涩图((连))?","这是我的正则","当然支持","支持阿拉伯文的吗",".....","毛球都出来了","涩图十连","这是因为瑟图炸出来的第二个潜水人员了","很好，另外一个十连的勇士出现了","涩图十连！！！","涩图♾连！","涩图5连","多来点啊呀纳米","lsp排行！","emmmmmm，我好想不支持阿拉伯数字","好吧他也不支持","lsp排行","涩图五连","涩图十连！","涩图十连","涩图十连","草","冲榜可耻","应该主动发图","编程不行","而不是让bot发图","冲榜第一名","这涩图分析还有奇妙的tag诶","？","分析呢","要@","关键字别跟我们冲突啊","/lsp排行","好像没有啊","啊。。","又坏掉惹","好像要等一会","或者是有些时候图片被拦下来了","翻译的模块你要不要","我这个bot计算量低，不会蹦","还是已经有了","/lsp排行","想问下大佬们 你们现在qq机器人用的什么库连接的？","好家伙，我这个是总榜，你要来个日榜嘛","mirai","很通俗的kotlin库","mirai要火（","/lsp排行","就是她不爽的时候会不按你的想法走并给你抛了个异常","然后归根结底还是自己做错了","啊好现实啊。。","4开头的才是自己的问题","5开头的就是她的问题","啊不懂。。","我说http","test","比如找不到","就是自己的问题","所以java怎么热更新啊","因为是4开头的","干","替换class文件啊，字节码是解释运行的","怎么替换啊","问题是我运行了","classloader","自己写classloader吗","对，你要把新的加载进去，不然还是运行的加载过的","@6g3y的机器人 /lsp排行","用别人的接口盈利  会被追责吗","/lsp排行","干","要看对方的开源协议","数据库还是没成功遍历","或者和作者沟通了","好吧","/lsp排行","涩图！","？","感觉有bug啊","你这个咋是倒序的","草 这个色图","hahhhh","涩图！","涩图图","好","涩图里混进了些奇怪的东东","我不会被风控了吧","？","/lsp排行","草 sjfh lsp","欢迎新头发！","大家好（","欢迎加入lsp大家庭","给新人来一份涩图三连！","涩图三连","涩图","涩图","/lsp排行","涩图","手动三连/扯一扯","/lsp排行","草","/lsp排行","检测tag是啥命令来着","好好，停一下，不要把新人吓跑了","毛球说话了？！","lsp排行","纳尼","你这是抄了我的数据嘛","?","我可是按条统计的","日榜呗","挺好，我这就是总榜","你看下代码","我还能统计某个人今天发的都是什么","别跟我的关键字冲突就行","/lsp排行","分析不出来了","太涩了","分析失败.png","涩 图呢","你看看，新人让吓的说不出话来了","都行","都行","刚开始手动","以后可以考虑自动","反正没几个","嗯好……谢谢dalao（","写一个给我","啥","匹配非括号里面的东西","自己去找","最好用代码","方便自动扩张","我以为你挺熟的，秒写","因为我也是现找的","当然是慢慢测了","鬼能秒写","我想尝试写一个，通过地形输出建筑位置的东西","……","真实","/","你room多少级了","6级了","群里的大佬们造了不少轮子了","可以看看群文件","有个轮子","4","今天没大翅蛇出来水群","可以参照着写","好……","不熟悉高级建筑物不好设计布局吧","嗯","4级啊。。。那算了","机器人没法跟大刺蛇要新手礼包了","建议先升级","反正8级还是刚起步","我有预感，你群bot再多，管理就来给你们禁了","我有点难受啊 sim是默认主分支删不掉吗","不是","你sim在用这个分支","那只是表示sim的时候运行而已","涩图三连","涩图五连","二房太远 确实不合适","别建太远。。。。。 很恶心","所以大家都有吗","都有啊","还没好吗","大地图还是看不到","迟早会建远房的","大刺蛇，我的新手礼包呢","大地图还是没有","都是黑黑的","但是 前期代码 复杂性太低- -","远点 没法搞0 0","第一个房就跨传送门，越级点科技","你们大地图","有嘛","这个距离 我他妈过不去啊","必须要穿星门","嗯","穿","穿星门的逻辑写不撩。。。。","每次手动去运输物资","我从E38N43穿到E21S12","涩图","claim了个房","/lsp排行","涩图","涩图","但是太少了  过去时间就剩600多tic了","我是个正人君子呢","涩图","如果穿越星门的话 能剩1200tic","但是能自动啊","这群变了","这群变了","造出spawn就行了","以前群友天天讨论代码","现在天天分析涩图(?","啊起源于曲奇的涩图","大佬这个什么情况","中文分号","输入法吧","是曲奇！！！","曲奇涩图","大刺蛇！！！","不愧是我","我好了！！","沉迷色曲奇无法自拔","呵呵，好厉害哦。","这个不错","这是啥异常","不知道啊","no screen devices","所以resetGC是？","啊这","咦 java程序","内存不够","。。。。","没啊，还有6g","是不是有两个显卡","工作的电脑。。","就核显","重启一下bot试试看？","不知道有没有问题","/头秃/头秃这个除了中文符号还有其他错误可能吗","把代码发群里","不要把错误发群里","/头秃/头秃","看错误看不出来问题","要看代码才知道","嗯","可能这条消息没问题然后处理下一条就异常了","好像是java的bug","你是java8吗","嗯","要不要java14","233","用openjdk吗","应该不会。。","曾经遇到两个复读bot无限复读(","用官方的就可以了吧","我回去康康","怎么发不出来了","?!","居然还统计我！","太可怕了","lsp排行","我觉得这个bot要上lsp排行榜了","发不出来我干","涩图十连","@6g3y的机器人 /关键字 2331313817","我自己没有数据","lsp","lsp","兄弟们，这样下去营养跟不上了","lsp","所以没有结果","lsp","啊这样","海星","lsp","我这个是过全部数据的统计可能比较慢","lsp排行榜","不对，为啥我的机器人一直发不出来啊","/关键字","lsp排行，不是lsp排行榜","/lsp排行","名字咋都没了","不知道啊","lsp排行","我这么拿的啊","那为啥我这儿就有","StringBuffer经典起名sb","群人数居然888了","加了个新的（）","涩图2连","emmmm，我机器人呢","哈哈","lsp排行","挂了","打dnf去了","好极了","另一个空白坏掉了","怕是有人给我电脑踩关机了","一直只发一种消息","被tx当作广告机器人了吧","对哦","发图片就不会嘛","每张图片不一样啊","涩图","那下次我把排行渲染成图片好了","每次排行也不一样啊","毕竟我自己都踩掉好几次了","/关键字","其实我可以在这个电脑再部署一份儿","就是排行榜没了","算了，玩游戏去","好不容易不加班","/关键字","这个机器人是当做兴趣爱好，和上班不一样的/头秃","/关键字","/关键字","但是我现在变了，家里的电脑压根儿没有任何ide","/关键字","程序员啊","主页java","主业java","写java编译器吗","/关键字","不可能","想多了","写网页的而已","/关键字","好了","就这样了","过几天有更多数据再来玩","这群就真人均涩图狂？","建议把涩图中间加个空格","尽量别跟其他机器人联动","ok","测试通过","现在除了首尹外都是以涩图为核心的bot🐴","最近涩图越来越顶了","qs","好久没欺负拉狗子了","必须想个办法揍一揍它！","大刺蛇，我的新手礼包呢","你最近的路程到我这边也要几百tick吧","真不错，pc仙术真不错","可恶","还有新手礼包这回事","薽鵏嚽","昨天被电池搞死了pc，如今都修炼成批西仙了","我是穷人啊","罐子都装不满","穷人（指军火库","？","我看不懂罐子","懂了，这就用白白的东西把你塞满","但我看得懂中文","那里不可以","给了","要溢出来了","/暗中观察","草","哈哈哈","够多了嘛~","还真给了","黄黄的","可惜是尿","黄色的尿","纳尼？","草","本来想持续给你一个晚上的","你不要","那我只能关了","可惜了可惜了","我跟你开玩笑的","草","你来拿回去吧","我给你3天时间","懂了，以后就这么白嫖","拿不回去就归我了","md不给了","及时止损","怎么显示指定的spawn的能量有多少 是不是满的","spawn.energy","spawn.store.energy","来拿啊","你该不会……","拿不到吧","草，激将安排上了","你该不会打不过我吧","原来如此 感谢","没错","被你发现了","三天后把你打成人棍","3天后？","是啊","不行，就给你三天时间","你只有3天了！","打不过是你菜","3天之后与我无关","就这样","告辞","等下大刺蛇开小号进去虐杀你","只能破费再买一个小号了","算了","军火库好像有很多","他小号也打不过我","借一个进去干你- -","我可是新手区杀手","我对你好不好","还给你送矿","大哥","唉","真是好人啊我","大刺蛇要不要去把他的能力偷空","能量*","他在新手村- -","怎么还给你啊","不用给我不用给我- -","都是多出来的","这点不值钱","什么鬼","你用就是了","我这是给你启动资金","让你玩lab","我现在也不会用啊","你tm不是6级了嘛- -","可以用了啊","我觉得可能要国庆重构在搞了","可恶啊","先想办法扩展房间","我现在代码是单房间的","可恶 这波是 虚晃一枪","多房间==gg","我觉得应该来个代码咨询业务","不是","天下武功唯快不破","大刺蛇的兵力","看我，晃一晃","不是几个小时就可以大爆","没事","他的房间","10分钟就爆了=","别问问就是没能量","给你点钱 你用market买吧","我spawn到极限了","刚刚算了一下，3天足够升6级了，现在开小号可以打爆","有能力也没钱spawn去造小兵啊","外矿现在5个有3个是空的","spawn不给力","有教程没","游戏内有","公告","群公告不就是","有钱了吧- -","5个5级还行","我好像只会Java","讲道理","下一个资本家就是你了","我java都不会","我拿这些东西会不会被干啊","会啊","面试的时候问我java的问题我啥都不知道","卖了就行啊","java和js差不多","5个可以卖1M","学就行了","那怎么玩的","我都不会","卖了就是没事了","啥也不会","卖什么","看教程啊","给你的这个","md","/捂脸/捂脸","给你 你不会用- -","对","对","看下market的api","你可以20w一个卖","你不仅要给我资源","最贵可以卖23w一个- -","还要给我代码","等你出了新手村","怎么卖","什么都好说","可恶","这是一个傻蛋啊","被我发现了","有钱不会花= =","放心","我还没看交易的api啊","涩图2连","我擦","居然复活了","lsp排行","你看我对你多好","对了还得把mass关了","免得不小心把你spawn吹没了","mass？","太难了","你就不能加白名单吗","你tm在想什么我还不知道吗- -","加了就背刺我","不仅不加还要把你家围起来","我是这种人？","你不是机器人吗","是的，我是机器人，我错了不睡觉","是的，我是机器人，我重来不睡觉","涩图三连","不过想了想也没事","就你的输出","我起床你还没打掉10m","无法破防-  -","我的输出，三天可以给你墙刮痧","哇嘎哒！","我把tower改成","检测有没人打我= =","谁打我我就射谁","白名单都省了呢","那我就再你门口晃悠","可恶啊","一格晃悠法","一格move可以晃半天","你的creep体型太小了 我不会生红球防御的","我来20个move 30个盾","没事","不会打你的","因为你不符合条件","可恶啊","你篮球来刮痧我也不会有反应- -","我要加一个work","毕竟一下才10","随便你打- -","work居然被你发现了！","加两个work","加20个work","过去就是一顿刮痧","讲真的","新手墙一破","我会不会被偷啊","如果一个房间预订结束，但是存在建筑的话，建筑有效果吗","兄弟","你家有什么值钱的东西么= =","除了打你玩儿 谁去你家啊","插个旗子都嫌累","不过没事","就怕你打我玩","我不嫌累","我就喜欢打你玩","可恶啊","预订与建筑 无关系","不会","我把我旁边的人灭了才能造container","你是说 claim 么","/关键字","有人的时候不可建造","还是说controller处于野生状态就能造","野生就行","哦，怪不得","不能造估计是呗占领了 那个不算reserve","之前没顶掉他的控制器","@6g3y的机器人 /关键字 705680835","你是不是没手动@啊","还是卡了","我复制的...","你们bot从哪拉的聊天数据啊","数据库啊","不然呢","数据从客户端获取还是有接口啊","mirai","百度一下","看到了，这就去写","你也来？","然后你群每说一句话就蹦出好几个bot","/问号脸","不会的，我的bot只是默默的在手机用户隐私","你坏坏","涩图","涩图","涩图涩图涩图","lsp排行","涩图涩图","lsp排行","涩图十连","涩图十连","涩图十连","涩图十连","？","lsp排行","草","lsp排行","好色哦","/问号脸","涩图三连","lsp排行","unwannadie？","毛球！","/lsp排行","好家伙","这么多涩 图","一时间有点看不过来","欢迎新人，上涩图","涩图三连","话说我会不会上白嫖榜啊","这些涩图都是我找来的","233","涩图","涩图！！","来，和我学习初级咒语：涩图","他不认识新进群的","没事没事，只要多加练习","涩图","/关键字","那我们可以认识一下","我应该考虑加一个开关","在我玩游戏的时候关上","涩图","来了来了","涩图","嘿嘿","涩图","涩图","今天重新抄了一遍作业","终于看懂大佬的代码跑的原理了= =","抄作业没意思啊","自己慢慢想有意思我觉得","只留了这几个最基本的 role","我打算放弃role了","任务模型","可以分享一下大佬的代码吗","栈任务模型","你用的 谁的框架呀","嚯嚯的","hoho 的","这是我刚抄好的。。。基本框架","还在自己的群晖私服上龟速测试中","是这个么","嗯","两个页面一开","加班的感觉突然袭来","话说 hoho 这个算是角色驱动还是任务驱动？","老哥Overmind 也看过了？","问个问题","两年前看过","不写 readme 的屑大佬 -50","overmind 物流匹配算法是什么","啊这","看这个看得很累","主体是角色，物流用了任务","完全靠 TS 的代码提示拼图一样拼出来的","终于把爆仓的房解放了","/头秃","头发-1","那我就抄这个吧","source 旁边位置满了怎么表达……","呃","不知道啊 刚开始玩","game.map.getroomterrain","预定也算吗","这个文档不明确啊","不过这个算是走弯路","如果我预定了一个房间，这个controler不是我的","是这个意思吗","ok","sa","嗯","hoho为啥不用@types/screeps？","这个包有什么问题么 还是。。","他一开始用 js 的","五六十个 commit 开始转 ts 的","那还确实挺麻烦的","先装个node压压惊","你外矿是运输挖矿分离的嘛","还是一体的","不过我感觉外矿挖运分离更好","挖运一定要分离","后期room里面用link","不过总体来说还是work蹲住了比较好","wall是摧毁不了的吧","外矿啊","wall可以攻击 血量打光了就没了","不是内矿","但是没有血量的自然wall不能摧毁","只能在上面修路","咦","三个矿点共用一个link，冷却时间太长了","两个房间三个点，挨的都很近，而且和storage很远","一个房间3个矿点？","怎么计算两个房间的距离啊","算了，就估算吧","文档上有","不是","是两个房间的不同位置的精确距离","有一个函数可以用","比如说 矿a到spawn的距离","精确到步","最短行走距离","Room.findPath","或者 PathFinder","我好像有思路了","先缓存下全部的坐标","然后计算点到点的位置","然后走到起点和终点","然后开始跑路","如果路程不够，直接干掉creep","不让他跑了","你试试网页版","直接百度screeps进官网","我谔谔","看样子是网不太好 有可能组件没加载完  挂个梯子试试","重开一下","怎么创建extension呀？","顶上有个按钮是建造","噢 看到了","thx","？？？","在哪哦","我都是输的。。。","哎","脑阔疼，这逼游戏","花钱加班","花钱加班","花钱加班","不过在下赚了","龟龟，还写笔记。。。","是大佬的习惯","是大佬的习惯","是大佬的习惯","网页上就有文档 为啥要写下来","想问一下 这个creeps 死了为啥我删不掉它呀？","刷新网页","丢包了就有可能导致尸体显示错误","ok","直接用intellij家的ide试试？","忘了那个写c++的ide叫啥了","vs studio","clion","Clion","我放弃了","什么sb语言","天书 告辞","ts吗？","c++吧","欢迎新大佬","这是ReScript...","这是cpp吗，这cpp一点特征没有好吧","后缀写了.res","方法名咋还加括号","在ReScript里访问Js的对象属性","涩图十连","艹 我还是用TS吧","涩图","涩图3连","涩图","涩图","涩图十连","能教教我吗","？","我的哥 和 找的哥","首先，我会将词语分割成一个一个的词","比如说","我的哥 变成  我 的 哥","然后对词语进行标注","我 主语， 的 助动词，哥 人称代词","然后只对名词进行计算","有库能用嘛。。。","NLP里面的crf 随机条件场的库","搞一下就出来了","关键字","大佬","/关键字","。","为什么czc这么多","/lsp排行","啊","我也这么色吗","可以attack","就是那个意思","attack太慢了","可以叫对面自主撤离","没有 等吧","【说服respawn","那个人基础harvester挂机到5本，估计早就没玩了","5级掉的很快的","7万多t呢","也就两天多啦","【打表","我代码精髓都在这张图里面了","别逗了","你要是这样过两天就把你家拆了","你来啊","【现在新人这么跳吗","欢迎来我家演习","我不自己把墙拆开让你打","随你打","打进来算我输","那我也来","我给你3天时间","摸得到我算我输","第四天谁也别拦着我","这么想respawn吗","我要在你controller上写个正","过分了啊","【年初我进群第一件事就是看czc打黑洞","话说你的机器人用什么做的？","用js","lsp排行","感觉我快要落榜了","我要改名了","从现在开始，我叫涩图十连","lsp排行","好家伙，直接从落榜到第4","【kitty在slack上又活过来了","只需要一个十连抽","涩图十连","lsp排行","涩图十连","涩图十连","？","lsp排行","ns好看！","锡兰！","ck！","草","ck!","FFFFFFFFFF","lsp排行","已保存，我会在他下一次说话的时候提醒他","奇怪，群名片带涩图的话，会被自动修改掉","/lsp排行","lsp排行","为啥你的排行跟我的那么像","涩图十连","涩图机器人挂了","十连效率好像有点低","1","这个要改吗...","改一下吧","最后一行还是最好有个换行","我明天merge一下...","是缺了逗号啊","而且是allowJs不是allowJS","我说的这都啥玩意。。。。","涩图","草","涩图十连","新人狂喜","官网上就有api","原来在公告里，在群文件里找了半天没找到","我英语辣鸡","不是看不懂教程而是记不住api","bot还没刷新列表","现在可以了，再试试","涩图","涩图","涩图十连","涩图十连","还是一张张来好","lsp排行","涩图","涩图十连","涩图","涩图","涩图","他这资源库到底有多大","不知道，没去看","涩图2连","图片已经发不出来了吗","涩图二连","涩图五连","涩图五连","涩图","/捂脸/捂脸","错","我稀饭短发","不是，我们单纯只是好色","脸好看 纸片人都行","有浏览器就能玩","我比较稀饭2次元","真香","请问下screeps有没有类似typeof的操作","instanceof 吧","如果你想其他玩家交流那就需要","js保留关键词没多少吧","你会百度翻译也许","只是为了玩游戏那就不用","看不懂就复制下来百度呗 233","百度翻译 复制粘贴 翻译","有道翻译，截屏翻译","艺多不压身神233","你想学就学，不想就用翻译软件","只是看官方文档需要","问大佬们，他这是什么意思","要不要打回去","打得过吗",".io访问不了啊","github.io被墙了","玩这游戏需要自备梯子 不然心态很容易崩","加一","翻墙也进不去","没啥问题","你是在南方不","那就对了","凑合用吧233","我记得有本地版","【hoho的简书教程真是能解决大部分的新手问题","建议1次的时候自动过滤掉","hah本来数据就少","他说的这个bot","你们有bot的能不能写个萌新答疑","这个光荣的任务就交给你了","不对","写几个常用话术","比如说：看公告群什么的","如果要做语义理解还是有些问题的","对","开源写个新人机器人查询你树","查询树","输入0，人工客服","这种的","空白bot挂掉了","发不出来","这样可以吗","新人看了心中有一万匹草泥马奔腾","私聊也是发不出的","大概整理了这么多","/头秃","你们有什么加的吗","比如我今天回答了一个萌新的问题","这样啊","可以可以","那我可以@机器人 让他记住我的回答","然后再告诉机器人关键词）当然你自己能nlp出来也行","这样就越来越高效了","不行，你必须，问题和结果输入才可以","这个功能国庆再加吧","排期太大了","或者做私聊答疑233","群私聊api应该一句话的事","毕竟公共场所我们都看得见","人工是私聊就看不见了","而且群会很冷清","没人回答就是不知道啊","群文件下的","涩图十连","如果每个人都要份新手礼包","到6级再说吧","我每天产80k左右 t3，发的起","【几个月来我附近没有新的活下来的玩家","rcl6了?","到了造完terminal就可以在群里圈大佬们了","terminal是啥","跨房运输+交易建筑","【建议阅读doc","doc肯定要读的    不过脑子感觉记不住那么多","没事 慢慢来","可以先上教程","不懂的看doc","新手入门需要注意什么","原来这游戏在淘宝都没得卖的啊、、、","开始的时候东西增加的快 到后面就慢慢变的摸了","【注意tigga","草","我发量足的很","【注意要在群里标房号","我现在就是在采集，铺路，造仓库","【之前经常友军之围","打了半天发现是友军？","【应该是ZA大杀四方的那段时间来着","涩。。涩图","啊扶我起来我还能。。涩。。涩。。涩图","这是要开车了？","别管他们","日常涩图","日常涩图十连","完了","忘记了榜","lsp排行","lap排行","萌新射射发抖","lsp排行","？？","lsp排行","lsp排行","有很多排行榜，你说的是哪个","【自从我把bot屏蔽了 这个群就变得更奇怪了","lsp排行榜","正确姿势：","lsp排行","我机器人又掉了","这api好像不稳定啊","哈哈","涩图！","lsp排行","。","看起来是报错了应该","你们一起写小曲奇啊","我写不动了）趴","？","怎么回事","你不行了？","整天涩图涩图的","我的排行榜第一名","不，我还能行！","你要写什么功能啊","lsp排行","还是不行","我这边有nlp的库","你要的话，我可以同步给你","就是快一个g","曲奇说要写个游戏😂","没事，涩图都好几个g了","前提是你要会用","文字游戏嘛","好像没啥新鲜的题材","要不来个共享screeps","每个人参与模块的编辑","好像已经有了","uos？","那有啥题材","整个游戏啥的","？","？","或者来一个简易的screeps对战","好像没啥意思","来做个聊天机器人吧","服务器支持！","看谁做的像","都做烂了","算了","除了那几个库也没啥意思","看十月新番吧","来自深渊出新作了","快想个题材","主要想弄个群友互动高的","这个","没加组织的加一下","最近挺火的那个蓝字儿怎么弄得","可以点的那种","已保存，我会在他下一次说话的时候提醒他","到时可以来个卡牌对战的那种","狼人杀吧","也可以，但是我不太会玩","制作之前还要得了解规则","没多少规则啊。。","我不常玩那种聚会游戏","大多为宅男（","主要是不想开麦说话。。","我宁愿打字，但打字说不过人家哔哩吧啦的。。","你们在讨论写游戏嘛","(一位兴致勃勃的unity爱好者凑了过来","但是我们想的是用qq实现的","不用非得QQ","来个网页也行","网页就啥都能做了","工作量也更大了","主要是题材","实现不难","实现不难","但是实现要成本","不想做没意思的东西","233，原来这样","其实我最近准备在写一个网页上的游戏","要啥成本","有时间就行了","啥题材的","？","时间就是成本啊","钱不是问题","时间才是问题","有这时间我看番不香吗","上班不是任何时间都有活的","这是真的","文档补上","我从来不写文档","？","我讨厌写文档","你不写文档？","领导没让就不写","我是搞数据挖掘的","搞点分析代码就要写文档","整理整理","到时候复盘交流都要","上个工作偶尔还能让我写点","自从换了工作，再也没写过","等一下","你做什么的","技术研发","专门解决各种疑难杂症","不写","要我写再说","草","overmind","干掉他","要不就在交接文档里写","技术研发。。。是干啥的啊","就是。。解决各种疑难杂症的吧","听起来好神奇","新技术，新框架，踩坑","解决技术难点","技术研发：侦察兵，炮灰","顺便帮队友擦屁股","构架稳定后就走人那种","哦。。大概懂了","我又不是架构师","不稳定我也可以走人","哈哈哈","老哥哪里上班的","哪个城市","吉林，长春","因为上一个架构师已经跑路了","还用的已经过时好长时间的jfinal","玩游戏要的是体验","挂狗爬","不是这种东西","挂逼死个🐴","你要这样完为啥不玩塞尔达呢","蓝奏ui","好像是个叫蓝奏云的东西","我刚入职的时候","直接看吐了","你是不是对屏幕过敏啊","吐了，建议吃点脱敏的药","你永远想象不到用jfinal那个框架写出来的代码有多烂","代码极其不规范","就差if(arg ＝＝ true这种了)","那没这么变态","debug？不存在的，看日志","技术部都是一群老人了，结果代码写成这爷爷奶奶样","各种互相调用","不存在的，那帮人写代码根本不看对不对齐","持久层接收只用map实现","从来不做实体类","各种getset","好歹做个反射都比这个强","而且数据库字段永远不跟key直对应","各种as看得我头疼","就跟不是一个人写的一样","等等我把WindowsQQ退了，省着被窥屏","还行吧","map也不错","不错？你会发现各种putget眼花缭乱","json序列号反序列号啊","特别是那种好几十个字段","从来不用json","？","不用json？","告辞","json序列反序列","从来不用","fastjson库还是tm我现加的","我要去学python","fastjson一般般吧","而且，也不知道是哪百年的远古项目","不用Maven","得现下，再考过去","问个问题，那个人项目是不是还在Tomcat","我至今不知道这个鬼项目改怎么打包","哈哈哈哈","厉害了","部署是Tomcat","远古项目","估计是10年左右的吧","肯定了","不会低于5年","java8都还没出吧","因为我tm刚学这个都没听过jfinal这个玩意","为啥Tomcat是远古项目","用个strust2我都不至于用了整整一周才知道这是个啥","不是因为Tomcat","是因为jfinal","关键是，这玩意非常杂","卧槽struts2就感人了","持久层，模板引擎啥的","jfinal都集成","说起来我学了然后招聘的都没看到过要ssh框架的😂","嗯，几年前都是MVC","连c#都有mvc框架","现在就是boot跟cloud","偶对了，我那帮队友，不写dao层，不写service层","直接尼玛sql语句糊脸上","/问号脸","那这公司也是够离谱的😂","不写service起码来个dao吧","不整","所以我感觉上一个架构师也够nice try的","直接url mod加sql一对一哦😂","据说我现在的部门主管是空降过来的","根本没有改变现状","要我早走了","也跟我说过逐步往mvc赶一赶","你是不知道","今年疫情有多难找工作","不会吧，我应届生，都找到了","我从去年12月开始，一直找到了4月份","对于这些公司来说，代码能用就行/我酸了","我们这公司属于报社公司","哈哈哈哈","我们做的都是内部人用的","就是怎么的，连sql注入都不防的那种","也不能说框架没有","他们不写","笑死","处女座写代码难受死","我也是这样","我正在试图把队友也纠正过来","很显然进度不理想","我这没有队友，只有祖传项目😂","我刚入职的时候还是在非技术部的唯一一个技术岗","那时候多风光","甚至还自己弄了个简单的框架","现在，我真的是想砸电脑","涩图三连","可冲！","冲不动了","其实你是想涩图三连","我懂了","不，我只是想睡觉了","再来张涩图","睡前涩图","lsp排行","明天拍查一下好了","所以仍然没想好游戏题材","干掉他不","要不要做一个皇室战争的玩意","screeps特色皇室战争","战前自由组合body","网页对战","皇室战争我可是11级的脚本挂机大佬","天狗气球怕过谁","算了想想就很无聊","部落冲突你们有脚本吗","你可以去蜂窝游戏看看","那是啥","反正蜂窝游戏里面皇室战争是免费的","部落冲突真的好玩吗","6","养老","恭喜，我们群和百度达成了合作","懒得搜","我更喜欢单机塔防","电脑都关了","皇室战争现在不冲月卡也不能玩了","我不玩皇室了","垃圾游戏","皇室感觉没意思","传统塔防呢还是类似地牢防御的那种塔防呢","还是类似x变体的那种具有一定操作的塔防","玩环世界吧","纯塔防","传统塔防呗","kingdom rush好玩","保卫萝卜？","那样太传统了","你们任务系统怎么设计的啊","我想问一下思路","啥样的任务系统","国庆大改","我也忘了咋设计得了","screeps的","干","也没有文档","太长时间不玩了","我记得好像是定时器的那种任务","那没什么技术含量","看我知乎呗","做一个类似x变体的塔防","设计上就那样了","screeps题材","pc作为操作单位","哪个啊","实现方式倒是因人而异","发给链接我康康","群公告链接也有","不要跟我是史诗级的哪个物流系统啥的","你逼乎叫什么","要不要有一些改变地形增加入侵者路径长度的设定","看过了","就跟x变体和幽闭圣地2的那种设定","这个的意思是强化效果是双倍吗？","这个2代表的是什么意思","多增加2点 还是 2倍？","算了就做个screeps版的幽闭圣地好了","弄个网页版的","2倍","再ptr改代码，官服会改吗","我想搞的是整个房间的任务发布","creep移动a到b是没有固定路线的吗？","moveto是现搜的","动态分配creeps的这种操作","对","自己设计呀","设计案当然要自己写","软件工程嘛","我想抄作业","抄作业嘛","就是软件工程大作业","何必重复造轮子","这是骨干了","大个鸡儿，需求分析都没有","不是轮子","骨干有没有","当然是自己分析咯","这只能自己写了吗","我想看看别人的思路","是","我现在想的有漏洞","每个人都都有漏洞","再任务回收和cpu上不知道怎么取舍","建议上8再想这些","氪金就完事了","试多了才有的估吧","比如对象取值耗多少","？？？？？？？？？","if耗多少","能根据算法复杂度算出耗时？？？？？？？？","你又不知道CPU速度","复杂度和耗时不是一回事","和试的差的远","而且模块的调用世时间也不是固定的啊","先实现，再改进敏捷开发","灾难性重构","没跑起来的设计案都不可靠","不试咋知道一次if消耗多少","先实现，再改进灾难型重构","也是","灾难是避免不了的","所以","你们","任务怎么做的","我一开始也想避免","任务管理","然后学会了弃坑","那我知道了","卖卖东西养老得了","我准备重构一波，最近几天没心思学习","别学了，学了也是白学","不如不学","跟我一起看来自深渊","学习","学个屁~","go","跟我一起用炮炸了这个6g3y","好呀好呀","这你能忍？","就在你家正中间干overmind","不足挂齿","大刺蛇一个creep就清干净","我不信","我觉得他","除非他拜托我","他成型了","我8个nuker下去","他就死了","？","我还以可以把他打成人棍","只剩下一个spawn和storage","然后挖他资源- -","过一段时间他又复活了","这么土豪的嘛","我再割草","专业割草吗","它就是我的智能外矿","你 也可以是","不","我会写个机器人","天天在群里面@你","屏蔽了不就行了","他可是大刺蛇","唬住了要价8m，唬不住就只能变成外矿了","你敢和他（指大刺蛇）作对？","谁敢作对","可恶","是时候欺负一下这个6g3y了","不对，只剩下两天了","这下更慌了","把你家铺满","东西能不能先还给你了","我想搞点事情","重写AI","届时可能会重构房间","Game.market.deal","直接卖掉不就完了","你可以先给我","我不会卖啊","我帮你保存~","我甚至不会送给别人","api不是发给你了- -","Game.market.deal","去里面看看","我觉得yoner的房间布局不错","看看价格","然后卖掉就完了","我想抄一下","你觉得怎么样","哪里不错了- -","- -","这是你的","抄fangxm的也比他好- -","这又不是我用固定布局弄出来的- -","ok","抄他的了","现在是我的了","这才是我的- -","现在是我的了","你家附近的那个是我随便摆的- -","是啊","respawn吗","所以要用软软的自动规划- -","yoner这种硬硬的不是很好- -","软软的？","他的这个不是硬硬的么- -","yoner的","那你会错过很多房间","我也有硬硬的- -","大家应该都有吧","一个一个房间点建筑太累了","hoho大佬的- -","和fangxm的差不多","但是他们这种是阉割版的- -","ext没点完","50个?","60个吧= =","房间类型如果是用来挖矿的","那就没必要","全摆- -","战时再摆就完了","就比如阿坦纳的房间- -","打架的时候现点lab","平时啥都没- -","会比较卡吗","不知道- -省能量吧","省地- -","好有道理","无言以对","阿塔呐打架的时候右上角的lab才点下来- -","矿房都长这样","学到老活到老","【可以学习fatbu 快乐种田","这个布局就是阉割阉割版= =","超级阉割版","可以出2人小队","10t 30a 和10t30h","出40h他就没能量了","6人小队有优势吗","相比4人","6人。","就4人优势大- -","这样","4人抱团可以互相奶到","6人太难写了","6个一体机呢","4人已经够头疼了","草","6人你还不如上6个一体机","让一体机贴着走抱团走 - -","葫芦娃救爷爷","不就是六人小队了","你写一个2人小队+一个4人","不就是六人么- -","s0还有一个人写了个9人","就是正方形- -","并无卵用- -","有没有那种偷家战术啊","就是两个4人队","两个不同方向进攻","一队偷家一队扛","一队迎战一队偷家的","那得看主动防御的逻辑了","一般来说每个地方的墙耐久都差不多","所以进攻一般都是集中一点","话说修建筑都是用Tower修的么","tower效率太低 但是也可以用","用啥效率高？","黄球直接修","用creep修","tower修路- -","修container","省cpu","偷不了家的- -","比如我家的修墙就是修血最少的","你打哪我就修哪=。=","哦吼吼","猫猫虫","🐛","猜猜去哪的","creep体蜈蚣","悄悄地进村","打枪的不要","半夜饿了= =","好难受","话说s2有很好玩的东西","过道上会有官服运输小队","打死会掉几千个t3- -","你是不是美国人啊","饿到肚子痛了=_=","怎么每次","家里没吃的","大晚上就来解压","猫猫虫","我可能会饿死在这里","他sf结束了","猫猫虫","轮到我的回合了！","合体！","三天后你家的摸样","可恶","色图贿赂我！","太过分了","猫图","嘿嘿","推土机！","我只有猫图","不是很喜欢","我喜欢大一点的","太大了吧","好爽啊","爽啊","czc!","https://b23.tv/8eVdFY","晚安涩图十连","这人还没死啊- -","好像被tigga打了半年了","草 这贴图有意思","涩图十连","要 来 了","什么内容啊","要来力","反正雨我无瓜","s3也有赛季吗","是新服务器","key 会不会涨价啊","之前屯了一个","涩图呢","赛季是啥？","lsp排行","key我记得应该是涨了","lsp排行","第二第三怎么没名字","要十二月啊","这些人就不能加加班么","我就去团战就好了","昨天谁@我？","观战","感觉是一个观察大佬从零发展的好机会","11.1不知道还会有什么新花样","竞技场？","😂只要不花钱就行了","【门票钱","要门票的，虽然游戏内可以买","市场上数量大的那个sell单好像到5m了来着？","两千五百万参加一次","到时候看我如何逛该","【steam上key也还要打一个月的5折","【实在不行就钞能力了","hoho门票买齐了吗","你们打吗","打打打","打啥呀","我也想打，钱不够，看看十月份能不能攒齐门票钱吧","赛季- -照妖镜么","进去是收集某种资源","我还有九个key","然后送到路口交","看来有用了","然后打架强的人可以在交货的地方替你交？","还是10M多一点","25m去一次= =","十月份认真玩一下","奖励是啥","可能是特殊的专属旗帜","那太亏了吧- -","或者creep皮肤","25m买个旗帜","我觉得不亏，重要的是体验 = =","被大佬虐的体验","- -体验被tigga虐的快乐","反正都打不过他","一些s0老玩家要是去了岂不是要被打出屎- -","如果现在这个yp的跟我进去碰一碰- -","那他只有一体机岂不是要被我吊锤","带刺蛇加油","😂萌新可以买么","可以现金买吧","我到时候进去挂个机","如果攒不够credit","不想去- -","观望一个赛季","第二赛季再说- -","一美元一个","又不公布奖励- -","奖品好的话可以就直接去了","😂直接钞能力","纯用软妹币大概要20左右","我身上商品卖一下 门票就够了- -","还有好多的细节要看看","规则细节 世界大小啥的","别成付费的botarena了","就算不玩，门票攒着理财也不亏","可能是botarena的雏形？","【感觉理财的最好时机过去了","那就是进去挨打了","开始有意思了","slack上挺多人好奇11月的惊喜","理财现在也可以","【新pc/新建筑/arena","有空了再重构一波","有点纠结","去不去- -","我就进去挂个机","进去没准遇到yp的md","把他🐎都给杀了","找个孤儿的角落","不过可能也没多少人去","应该可以把门票赚回来吧","25m门票不是普通玩家买得起的- -","不氪金的话","也还好吧","卖能量的应该也可以进去","还差10m","唉","去干嘛- -","进去卖能量嘛","挂机玩家应该不会想去的吧- -","挂机玩家有被冒犯到","【进去还要改脚本 进了就不算挂机玩家了","确实很贵就是了","气抖冷，挂机玩家什么时候才能站起来","我先赚点钱- -","【亿点钱","在卖20个- -","这个以前230k随便卖","是啊","最近没有这个单子了","很烦","然后改成240k就再也没有卖出去了","我有100个- -","挂220k以上卖","挂了这么久","biomass系倒是越战越勇","才卖掉9个","= =","我发现我把屯的cpu卖掉，就差不多了","= =差距没我想象的那么大","现在一个CPU卖多少钱","1M了","还差一点点","定投cpu好习惯","一天的CPU？","在卖点cpu算了","卧槽","这个cpu","我第一天挂 90w一个","卖了60个","然后过了一周","超乎我的想象","60w一个","又买了60个","现在它又涨到了1m一个","1M！","噶韭菜！","早买齐了 钱留着也没啥用","这CPU也太贵了。。。。","我看了看我2M的小钱包","四个月前还能顶半个token","这玩意儿","常量叫啥啊","找到了","accessKey","现实世界美元疯狂防水","游戏里也疯狂放水","挂了个4m单子","手续费- -","扣了1m","日卡-1","这个yp的天天骚扰我","还好有du佬黑科技","直接跑了4个区块- -","往 gitee 上面整了个镜像","nice","这下访问就快了","支持国产","好活","突然发现我附近有一个快挂掉的du","萌新问一下建筑是只能用手放吗？","为了对新手友好才有手动的","du是啥","du是du佬","是","用api放","怕萌新看一个坐标 点一个建筑很麻烦才搞了那个","大佬们自动放建筑咋写的啊，解规划问题吗","出现！","【你群只有我还在手动点建筑了","想怎么点怎么点","hoho大佬有个自动规划的简书吧","我去康康","就是单纯宕机了","我懒得管了","我在你附近了","两个区块距离","马上过去开个room","s2 WN开不出新房了- -","yp那人没事干天天盯着我","我点了个房升到3级 他一直出一体机守我家- -","md我直接跑到你附近- -他就过不来了","趁他不注意开了个sf= =","疯狂修墙","导致我没法把他调度到另一个矿","那个对穿的库流传至今了嘛","感觉也没那么好🤣","我除了路都是手点的","那种方便用哪个啊","自动规划是很后期要考虑的东西","用建筑画画也挺好玩的","这个是游戏又不是工作，怎么好玩怎么来","不是","要写好多配置项","是啊- -","当然不是","每个房间都要写脚本？","毕竟开房还是很少见的","援建到6 然后直接套模版","＋1","我是不是应该开始推销曲奇bot","没错","曲奇！！！","涩图","曲奇","yyds","曲奇太强啦","曲奇yyds","曲奇bot有化合物功能嘛","曲奇还打群星吗","购买曲奇机器人","捆绑lsp排行机器人","纳尼！","曲奇群星新dlc入手吗","我丢到uop里了","有uop repo权限的都可以拿下来用","写的很烂","那个screeps2","涩图五连","涩图","这张看过了","瞎几把写的","单矿房还会有bug","但是基本上可以一键殖民","自动造建筑","tigga打om作者","class5","没有权限","你id是啥","我拉你一下","群星又出新dlc了？","slack","喜闻乐见双pc","联邦还没玩完有出新的了","还没说上线时间","就这玩意儿- -","来3个 40ra tigga也不敢靠近吧- -","持续打了3天左右好像","25m的墙被tigga硬磨成了 3m- -","这防守还没阿坦纳厉害- -","你的id是啥","曲奇酱！","哦哈呦~","涩图","早","萌新问一下creep从A-B线路是固定的吗","不是","你昨天不是问过了","不是","早安涩图","来一份甜品涩图","lsp排行","已经有33个群友叫过涩图了","涩图","像这些被覆盖的语句，会消耗0.2cpu吗","不会","执行了才会","/关键字","/lsp排行","涩图十连","牛批了","这个小机器人是怎么搞的哇","这个机器人是怎么实现的啊","lsp 了","lsp是第一生产力","lsp排行","哦吼","我瞧瞧","是你自己写的哇？","群里人个个都是人才","是哇","可惜我没怎么整java","看不明白","那是第三方依赖","你需要知道一个叫做Maven的依赖包管理攻击","管理工具","嗷嗷嗷 明白了","哪个包","涩图三连","你Maven装一下依赖","涩图","？","现在bot不能用","在搬家","好的哇","ok","恭喜你排行榜多了4张","我直接去你空间","却没有得到涩图","maven类似于package.json","建议实现一遍apache顶级项目，然后","你就没头发了","涩图能发三次元的吗?","二次元的 有什么意思","纸片人好哇","三次元有啥意思","啥时候涩图恢复了记得艾特一下我","我也改一下机器人好了","你也有个机器人？","也是Java实现的嘛","这群里有一般都是机器人","有一半（）","群里除了我全是机器人","你不知道而已（）","难道你没发现你没发一次涩图都会艾特我嘛","还有lsp排行","/哦哟","那我也是机器人","会怎么样?","深有体会","所以我有了右键editplus的习惯","涩图","关闭 tips","成功 关闭 tips","涩图","世界清净了","开启 tips","成功 关闭 tips","emmmmm","涩图","复制黏贴的缺点","lsp排行","关了打不开可还行","关闭 rank","成功 关闭 rank","lsp排行","好，除了复制黏贴都弄成false以外没啥bug","这次应该好了","lsp排行","关闭 rank","成功 关闭 rank","开启 rank","成功 开启 rank","lsp排行","行，以后睡觉就把提醒关上","省着一大早上丁丁响","话说我的排行怎么也有的不显示昵称","涩图三连","嘤！，图呢","曲奇挂了","涩图三连","曲奇挂了","你们试试关闭 tips","曲奇现在不能用","要等一段时间","哈哈哈哈哈","帮我测试一下是不是只有我能关闭","关闭tips","空格","关闭 rank","关闭 tips","挺好","关闭 tips","成功 关闭 tips","开启 tips","成功 开启 tips","关闭 askdj","错误，不存在；askdj","把引号打成分号了..","算了下次部署再说","开启 laskjdka","错误，不存在；laskjdka","关闭 main","你在试图关闭我的机器人？","涩图","还没好嘛","涩图","/关键字","萌新退群了","？","都怪你们天天涩图涩图","关闭 tips","成功 关闭 tips","午睡时间","涩图都被你们弄坏了","涩图","gkd","我还可以","/暗中观察","rm -rf /*","小曲奇成精了","开启 tips","启动 tips","关闭 tips","删库跑路警告","上班","我抄的 Hoho 的代码","抄代码","欢迎新头发","可以氪金买cpu时间","不氪金的话就20cpu时间","什么意思","20CPU都吃不满就玩不下去了","说实话，到现在我20就没满过","不氪金的话","每tick的cpu时间上限是20","不","是 500","草","20 是补充到 bucket 的","反正不氪金也能玩","每tick补充20的cpu可以玩10房间吧？","法力回复上限是20，这么说能理解了吗","蓝条1000","10000","想打架20不够的","能","能玩很久很久","只要你头发够用","先等你写出吃满20cpu的代码","一般用不完","除非写了非常蠢的代码","一个月之内应该用不完","O(n!)","即使不优化","for（；；）","除非特别呆的代码","就能用完了","不骗你们","不然一个房间 20 cpu 肯定够了","GCL等级提高了有啥用","开新房间","写O(n!)的算法","一个gcl开一个房间","很快用完cpu","for（；；）不香吗","开新房间是指去新的房间直接建个spawn吗","现在这游戏变成日卡了","没有人会故意死循环","我啊","打架的时候几块钱充个日卡就行了","等你能打架，还用花钱买日卡吗","然而我们在s3","我在s1","需要在外面打架的话肯定得有room吧","s2 路过","你买东西都能赚几张了","那应该常驻有CPU","你卖东西都能赚几张了","怎么抽卡","不然在外面发展太难了","发pixel发给我，我给你一张卡就行了","1000pixel我可以给你选一个wall或者floor","这样","抽卡戒了","感觉有点丑","pixel卖出去才赚一分钱","steam screeps各抽一分钱","这个我买过，现在感觉我是傻逼","这里都不到1分钱吧","Steam 市场比内购贵","是啊","这个pixel有啥用","没人在steam买","感觉之前空闲的cpu都浪费了","应该是screeps故意的","1单位一卖太傻了","是因为0.02 screeps就不用被steam抽成了?","0.02被steam和screeps各抽一分钱","我觉得我出新手区之前到不了7了","你啥都没有","怎么办","能量。。。","不是啥都要能量吗","0.02就一分都拿不到?","是啊","spawn速度 限制了发展","黑幕!!!","肯定是screeps故意的，不让走steam","走steam要抽成啊","肯定是screeps故意","开启 tips","成功 开启 tips","涩图","居然还没好","1 单位一卖是这样的啊","涩图十连","涩图十连","涩图十连","涩图十连","涩图十连","涩图十连","涩图十连","lsp排行","😏","我想给你改回去","恶意冲榜","涩图十连","涩图十连","涩图十连","涩图十连","涩图十连","涩图十连"," 涩图十连","涩图十连","涩图十连","涩图十连","涩图十连","关闭 rank","成功 关闭 rank","涩图十连","lsp排行","等什么时候涩图机器好了再说","/lsp排行","你一共刷了170次","好的马上就改回去","你的排行榜不准了","刷榜可耻","哦耶","牛逼","好家伙，用的啥分词","好家伙","好家伙","好家伙","好家伙","？","好家伙","好家伙","家伙","家伙","家伙","家伙","家伙","lsp","/关键字","/关键字","建议改成，只能看自己的","为什么我只能搜到表情..","/关键字945882813","这样就没意思了","所以这关键字能分析出啥来","@6g3y的机器人 /关键字 1392593558","没啥","这个关键字只是基础","可以用来做一些有趣的东西","比如说，语句模仿","套上word2vec","不愧是搞数据的","完全不懂","然后加上编辑距离","就可以找到跟他比较相近的话","然后，可以在下面找一条消息跟着起哄","比如说：","算了","不说了","我觉得不好玩","没啥意思","主要是这是群聊","word2vec","好耳熟的玩意","就是个映射表","没啥意思","买不起买不起 告辞","就是这东西啊","中国比较好的库就这个了（至少3年前是这样）","这个库一度把我弄成傻子","？","这库挺好的啊","咋了亲","太专业了，有的功能都不知道有啥用","只能是领导叫我弄啥就弄啥","这玩意儿不是有手就行吗","都是现成的啊","你想象一下","我卖了好几个金的creep皮了","一个只懂语文不懂技术，和一个只懂技术不懂语文","请问一下 cr可以用人民币买吗?","1.分词","2.套模型","3.生成语法树","3.套模型","结束","对了，5是输出结果","我半个都不懂","大概是这个套路","还好最近不怎么搞这个项目了","这东西不难啊","不然我早晚要离职","你做什么东西啊","也需要终端吗?","相同的工作量，做这玩意我得用几倍的时间","完全不知道我都做了啥","？？？","因为我自己都看不懂","你做的是啥啊","需求将一下","?","没错，我也说不清楚需求是什么","领导说怎么回事就怎么回事","还好这个库是线程安全+无堆共享的，不然你吃枣药丸","话说 Github Action 有没有限制跑多少 ms","在折腾 screeps-server-mockup","你是在哪个城市工作的啊","我是应届生啊，本科的","也是，小城市哪有搞数据的","别太看得起我","就一个入职3个月的","比较已经开始赚钱了","其实我啥都不会","我还在等群友开公司收留我","我只是会一些基础","基础嘛","会的叫基础","我还在等群友开公司收留我","我还在等群友开公司收留我","我会写js","但是好像 群里所有人都会","我什么都会写","草","我高中就会了","我也不会","算了直接问高级题目吧，估算一下 pagerank的复杂度","我也不会","对不起","我错了","只会增删改查吧","没错我也一样","反正又不是dba，现写现百度","感觉还行？","20ms 1 tick","js好","我精通js","什么傻逼题目","这也太基础了","确实是基础啊","所以为什么叫面试造火箭","你能不能问点高级的","比如原型链","入职了要这么写是真stringbuffer","这个我也不会啊","因为我不怎么会js","原型链是基础","我搞数据挖掘的，要回什么js","面试问题：","用js写个红黑树（","基础题：call和bind区别","也是基础","都不会，下一个","但是我不会","因为这些就左旋右旋","然后基础是平衡树","没了","这种东西都是现用现百度","具体我也忘了怎么写了","优先队列吧","遇到有用的就收藏","js实现优先队列","用callback实现promise（","群里面好像有文件","萌新今天刚买了这本书","打算开始学 JS","讲一下js的内存回收机制","那这个","输出顺序是什么","这个看实现吧...","1432","比如V8的回收机制","谷歌浏览器的回收机制","这样","如果还要版本","看我的","辣就是最新版","顺便点个赞","我们考试有a---b这种","你也太秀了吧","原来我什么都不会","原来我不是程序员","跟我一样","我觉得这不应该是人类写的代码","会的是基础，其他什么都不会","我需要用啥就学啥= =","你一定是前端","不用狡辩了","后端谁会想什么回收机制","草","会渲染数据就行了","后端才会想回收机制吧","会用框架的模板引擎就行了","来","感觉前端考虑性能问题少一些","作业","想这个干嘛，有gc呢","用js写个Python解释器","用js写个系统","用js写个v8","话说","http://node-os.com/","Github Actions 能跑 6小时？！","每个 Job 6小时","怎么越来越离谱了","感觉好棒啊","怎么不说用二进制写个脚本","用刻刀在晶圆上刻个python解释器","axios是os？？","草","？","刻晶元可太秀了","不是…axios至是封装ajax","还是个vue里东西","在minecraft里搭一个Python解释器","还不如刻晶元呢","就是速度慢了一点","逻辑门","什么的","麦块都有现成的","模块化","写个代码复制粘贴一下就好了","但是比用js写要难","敢说自己精通C++？","图片说的，又不是我说的","我连会c++都不会","但是我会C++++","比C++还多两个+","c艹艹","请勿合一起","c艹艹","c,c十,c卄，c卅，c卌","你这就很过分了","你可真是个小天才","最后那个是念啥","除了十之外都不会念","xi，四声","五卅惨案","卄(nian四声","我感觉自己是文盲","卅(sa四声","飒","卅卄卌","卄","国庆请假提前回家","舒服","改名了","China！","向懂王同志学习","艹（一种植物）","国庆都放几天啊","或者说放不放假啊","11天","联盟是啥意思了","我放5天，中规中矩吧","8天假期+3天年休假","美滋滋","14天","一个个都十天往上呗","一位不调休的群友路过","一周一节课，去掉这节课就是14天","妈耶","放5天就是群最惨了","有比5天更少的嘛","【有","我们学校不放假。","0day","开学晚了吧","还真有不放假的啊","草","你是谁","BB?","嗯","学校不放假是什么说法","天天有课？","就是不放假","而且周末也上课","还在封校吗","但是寒假提前放。","我大一下就是一周七天课","不封了","bb！","怎么又改名字了","只放5天假的我瞬间平衡了","放5天?","996啊?","只能放8天假的我","我们放4天","只能一个人窝在宿舍里","但是青岛有人感染  封校","全国只有我们是一开始就不封校的吗😂","我们也是","舒服","原来5天算长的了","那你们上学的有作业嘛","5月份返校到现在也没封过","大学本来就没什么作业了吧","啊是吗，我没上过大学","【别问了别问了","那群里有还没上大学的嘛","还有中学生啊","有点厉害啊","我还没上小学。我出生就被当成图灵机训练。","草","现在已经可以大脑跑代码了","曲奇已经机械飞升了","大脑跑代码大家都会吧","就是跑的比较慢罢了","一跑全是error","草","能不能加断点？","不应该是一跑飞快","写出来全是error吗","当你的代码以一个混乱的方式运行成功","大家脑子里都是涩图，哪有什么代码","巧了","我脑子里一般不装涩图","都是.avi或者.mp4","我的脑子里有一个完整的lisp解释器","是不是多打了一个i","lsp解释器","好无聊","总是上班的时候没活","然后临下班就有活","无聊就刷leetcode（","我选择刷看点","刷B站","发月饼了","我的月饼还没有拿……","我们这送到寝室","校区太大了送寝室得累死","学校还给学生送月饼？","screeps的memory效率好低啊","什么时候可以支持数据库","说不定以后会给玩家一个数据库用","我们食堂第一次做月饼","莫名火爆","一份月饼被炒到6000了","我觉得可以把数据塞进变量里。。。 然后定时存进memory","像Redis那样","什么鬼","6000有人买？","memory仅仅用来实现持久化","他第一天差点给卖完了","然后后面一天卖十份","很牛逼","为啥啊，好吃吗","我们月饼也就一块20","一大早开始排队，中午才卖","经典饥饿营销","不知道。。。谁也没吃过","还是包装好看","可能就是因为印了个校徽","一个月饼能有啥……","拿去送人吧","我们倒是年年发不稀奇了","emmmmmm懂了","肯定不是自己吃的","普通月饼我们也发了","名校的效应","我寻思我们也没多名。。。有那钱买清华的不行吗","卖6000就是把别人当韭菜割了","6000啊","食堂是平价，黑市炒起来的","6000买显卡不香吗","可能有人有特殊需求吧","emmmmm","我交120年校庆好像也出了好多圈钱的东西","也可能6000是自己卖给自己","比如富少的npy想吃","6000买3080不香吗","是不是不同的tick取到的creep不会是同一个对象？","是的吧","虽然我没玩过","但是肯定是同一个","额。。。","是一个吧","我好像很早以前没用存id都是存对象来着","至少creep我记得是可以的……吧","那是global reset会导致不一样是吗","我以前找敌对creep存目标然后攻击是这样存的","好像也没出过问题哦","好的","涩图","关键字提醒还行","你是真那么需要色图还是作秀啊","问一下大佬们","获取的内存 怎么反序列化啊","JSON.parse？","这两吗？","哦哦你说这个","你要gzip","用gzip解压","再json.parse","哦哦 大佬~","或者你发的请求里面加个什么","不允许gzip","我忘记那个header是啥了","可以吗？","哦哦 从那看？","资料是哪个了？","我去帮你查询一下","（","我寻思真有需求也不至于那么夸张（","注意身体（（（（","谢谢大佬","你看看mdn文档","开启 rank","成功 开启 rank","lsp排行","涩图?","lsp排行","诶哟 一张没嫖到 还上榜了","机器人坏了","先关上好了","关闭 rank","成功 关闭 rank","有点替身使者的感觉（","先屏蔽某人，一会儿把黑名单做一下好了","只有我输入才有用","/关键字","涩图","lsp排行","黑名单 1062406901","添加黑名单成功","涩图","lsp排行","简直就是机器人裙","黑名单 1062406901","删除黑名单成功","lsp排行","关闭 rank","成功 关闭 rank","黑名单 3098523909","添加黑名单成功","行了","看来是没啥明显的bug","莫名被黑名单（？","涩图十连","在screeps里好像没有请求之类的东西","随便玩，反正我把排行榜关了","涩图呢？","至今没修好","干","没有涩图了","令人怀念的上古翻译","screeps用的方法都是哪个库里的？","谁还有creep函数执行顺序的那张图吗","文档里是这样翻译的","很尴尬 掉接口 不小心 把 creep的内存全清了 炸了","官网doc上有","控制台","不过必须浏览器开着游戏才能这么玩","每天一个偷cpu小技巧","学会了。。。","草看到container第一反应是docker","我也哈哈哈哈","问一下，想清空Memory怎么做比较简单啊","到八级差不多要多久啊","一个新手区周期","好的","果然","白天没事儿干","一到下班就有事儿","e29n49","随便拿","今天调试的 炸了太多次了  房间能量快耗光了。。 。","这个不是通过 terminal 发送吗  我可以控制吗？","W12N38好像是czc故居附近","这房我以前还想占的来着","嗯 我在czc头上","有大佬给我发150k能量吗- - 过俩天还。。。。","不然 等会 又要停运呀0 0","逃跑了","舒服","来个涩图庆祝一下","浏览器小地图看不到东西还行","图呢","涩图","完了","涩图机器人没了","芜湖","关闭 tips","成功 关闭 tips","涩图好了记得艾特我","我shoucao送点能量吧","爆仓几个月懒得改代码","在往里搬了","W12N38","这个是你啊？","确实","我也今天才发现有新群友在我旁边","离得好近 谢谢大佬了","挂机太久了(","要不 我也搬过来?","我代码质量只有群里大佬十分之一","我的是教程代码","毫无游戏体验","等什么时候有空了要开始写第四版代码了(","wn热闹惹","把任务制 中央操作 跨房支援加进去","大佬代码可以发我康康吗","我的还是算了 自己都看不懂","【隔壁fora 对门czc","make WN great again(不是","tigga:收到","？","爬","这几天怎么这种的这么多","莫名其妙被拉进一个微信群，里面就搞这","so？","你群一玩游戏又不是搞网安的","我建筑缓存裂开了","room.towers undefined","q群里点链接跳转，会附带qq信息吗","不会","发了100k","是啊","power技能可以缩减spawn时间","好的，我等级还没那么高，用不了power","涩图？","涩图","/lsp排行","我转给我们社团当靶场用","回来了，都回来了","涩图回来了","涩图","涩图","发过了吗？","换一个","/暗中观察","涩图","哦吼","小曲奇复活了","涩图♾连！","gkd！","涩图十","草 要素过多","分析","遇事先冷静的分析一下","dog(0.547)","？","小曲奇是用来分析二刺螈少女的","让小曲奇分析大粪的是屑","分级：安全（确信","确信","小曲奇：不行了要坏掉了","没有返回结果了","嘤嘤嘤","不换行了","怎么看谁都是女？","分析","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","枪？","这个接头，好活","谢谢兄弟，已经吐了","这居然只是mediam","微笑（指目力嘶吼","草","这个安全试啥","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","不明白你说的什么意思","鸡儿","不明白你说的什么意思","觅食还没结束啊","曲奇","呵呵，很好吃。","你自己","我知道是我自己","很高兴听你这么说呀","杜鱼吹","名字不错","等我来","大残！","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","千万要HOLD住啊","大残！","还不是拜你所赐！","啊这","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","恶臭","好甜啊","先让我堵上耳朵，捂上眼睛","北京哪儿有卖??","你是个大型海绵体?满身都是蛋么?哦好神奇~","一滴血","先让我堵上耳朵，捂上眼睛","两只老虎","这个…我真的听不懂","破甲","破甲，读音为pò jiǎ，汉语词语，寓意为","草泥马","听不大懂耶","涩图","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","五个全白","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","我也准备全白","凉皮","特别喜欢里面的黄瓜丝儿什么的","黄瓜","紫罗兰","王八","优雅文明的你会更有吸引力哟","越磨越聪明","垂直握把","小乔是王者荣耀里面的一个英雄","a1高闪来一个","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","秋梨膏","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","不明白你说的什么意思","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","我没当保安","墙上挂着地图和你的照片，这是我的两个世界。","我的肾好着呢","这个还真是讨论不来呢","卖马和汾河湾、桑园寄子与卖布头是什么关系？","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","这个…我真的听不懂","这个…我真的听不懂","可以去当地或者附近地区的服装批发市场看看","先让我堵上耳朵，捂上眼睛","screeps","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","tree new bee","炼铜，精炼的铜，出自《战国策·赵策一》。","tree new bee","我在这里好久了，终于等到你来啦","tree new bee","我在这里好久了，终于等到你来啦","卡尔曼滤波","快速沃舍尔变换","精彩在沃","田所浩二","很肥沃的田地呀","快速傅里叶变换","草","傅里叶级数","离散傅里叶变换","死骑好用，我还没练","小波变换","魏玛共和国宪法","不明白你的意思，我们还是聊聊今天的新闻吧","苏维埃共和国","听不大懂耶","威斯特法伦会议","不明白你的意思，我们还是聊聊今天的新闻吧","苏维埃共和国是什么","9","？","天安门事件","我们还是聊点儿别的吧","草","可以可以","避免出事","群要没了","害怕的","厉害了","冰岛分离主义","这个天去环岛路骑行岂爽成?!!!","物理实验选课系统","ohhhhh","懂得挺多","8964","看不懂你的数字","chairman mao","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","这是用的什么库还是咋？","腾讯的接口","回复内容也是腾讯提供的？还是自己机器学习训练的库？","成语接龙","我最喜欢玩游戏啦，那我们开始吧","为所欲为","我最喜欢玩游戏啦，那我们开始吧","为所欲为","= =假的","开始","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","只能一问一答","没有上下文记忆","当然只能记住你是不是重复问","233","233","233","233","小朋友你好","这是进入了复读机模式了么...","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","233","233","你好","233","你好哇","233","233","233","123","这是什么暗号吗，你先告诉我接头语是什么好不好？","？？？","114514","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","易经","我懂大原则。这个东西光大原则也能说一天","这是在干嘛？","测试？",".test 50","神秘","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","腾讯","企鹅","马化腾","TNT的化学式","我只知道化学式？","CuSO4+Zn","69式","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","ZnSO4 + Mg","MG6比较小众了，我怕他是不喜欢","Ningen","ningen","emmmm","功能","....","菜单","劳动法","‘功能’","能帮主人解答各种问题呢","南山必胜客","必胜客过生日有什么活动？","‘菜单’","菜品可丰富了呢","help","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","“功能”","水晶棺材","红辣椒","领域驱动设计","设计模式","《Java从入门到入土》","可以","c#","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","消息","哦，原来有消息啊。","234","提起234，我马上想到的是233、232与231","231","提到231，好多人会想到232、233与234","232","232和231、234与233是什么关系？","哪里不会点哪里","翻译软件","微软","有没有超软？？","轮胎吗","超软","提到超软，好多人会想到超硬、超细与超厚","涩图","涩图","涩图","我只会说普通话哦!","涩图","不明白你说的什么意思","他天天发 但是他说他不明白","纯情魅魔（）","能用","自己写一个就好了","又来个c++大佬？","二进制模块？","其他语言要编译成js或者wasm","有三方编译器的","比如ts可以编译成js","c++可以编译成wasm","这个想法不错！","嗯？","22岁，是学生","老哥37程序员吗","好臭啊","可能这就是大佬吧","老哥做嵌入式的么","跳过了教程直接进入游戏的新玩家！","图样图森破","试试看翻译软件吧","一看就是没考过四六级的孩","这游戏其实英语挺简单的","。。","四级200分应该够了","客户端开的服务器资源莫名的高","可以直接玩官服啊","确实高","我当初玩就是谷歌机翻一把梭","hoho觉得体验很不好","于是写了汉化版文档","机翻实在恐怖","这就是中文文档的来历","当时玩的人多吗","少","群友少","比现在还少？","我入群我记得三百人左右吧。。。","我记得有一阶段官服有2048个玩家左右","hoho比我早一个月","现在只有一千七了","别这样","先复制个教程四跑着","别立flag","我都花钱买了还要花时间玩？","一开始不用买时间","当然不玩了","这游戏买了就是为了找人一起玩别的游戏的","或者看涩图的","保 留 节 目","涩图才是归宿","不如把我的api文档也写完吧","不至于不至于","那个写周边用的","我已经写了80%了","不如写完","这个事情就交给你了","没那么多精力了","哪个群友想写的","好强啊！","总觉得群里只有我最菜","😂","这游戏可以改名么","你想叫什么","我都忘了叫啥","好久没上了","邀请了呢~","接口文档啊？","想玩免费的screeps怎么办","想","官网","creep自然死亡会被eventlog统计吗","都可以想","自己开私服","不知道destory算不算","怎么又多了个组织","不是有uop-screeps了吗","你那个组织多少人了","xyd_574997336@qq.com","我看看哪里人多，合并一下","我这里21个人","之前是翻译文档组的","我把你拉进来当owner吧","邀请了","邀请你了","玩不了screeps全是英文","都是大佬","现在想了想整个screeps-cn就我最菜","也就Slack聊天要用英语","我才是最菜的","房间刚炸","话说 S3 有位置么","想去 S3 做钉子户","可以去东北找群友","进去只会fuck fuck 我觉得我还是不注册slack了","这里一片？","中间有yuan姥 左上角不知道是不是za","还有几个看起来眼熟但是分不清楚的","东北为什么有ZA","看起来像(","..可能是认错了","大家好我是萌新 LokiSharp","哎。。。看到我自己了","警惕新型互联网诈骗","这个懂的呀 没用的呀","我也差不多","我想起来了！","你是我刚进群时候的群内大佬！","(雾","反正我看谁都是大佬","我现在啥都不懂","我记得那时候我还在抄 Overmind","新人升级中","我的 GCL 是 ToAngle 挂上来的。。。","很菜的","你的游戏 稍微有点多啊","感觉","只要肯挂机","没有刷不上来的墙","ck!","foraphe !","然后挂久了忘了这游戏了","就被 kill 了么","/screeps rs shard3 W9N39","生成中...","奇妙自闭房","我也想要这种一个口的房子","做个钉子户","话说大佬不修路的么","我代码质量不允许我修路","很大程度上影响CPU和交通效率(","话说大佬的建筑是自己手点的还是自动规划的？","大佬都是自动的","我是手点的(","连硬编码相对位置都没写","我可能只是比较自闭所以没人打我","我也想要个2能量的自闭房","现在好像我单矿会跟不上消耗","得加点很难看的if shoucao调低消耗(","修他100m墙","storage里全是能量","打我还不够赚回creep钱的","呜呜呜","没修容器呜呜呜","我就想他怎么都快挖完了","怎么感觉像我的代码","一边升级一边改","改完了发现不对rcl1适用了","我要去补功能测试","每个rcl 跑 10000 tick这这样的","我一直想找人测试主动防御","找大刺蛇吧","大刺蛇好像不在我旁边","而且他来了我必定守不住","没boost的主动防御都是dd","然后给我抄一下","谢谢","啊这","国庆一定写（咕","我想重写代码半年了 但是一直也就是想重写","gcl从9挂到11了","代码还不如最近进群的某些群友..","你这个","跟我师出同门","群文件有好多好东西","不是","cmd是什么操作？","哦哦","苹果啊","告辞","我发现了如果有矿只有单个采集点的就很坑","很容易犯傻","是同样的种田玩家呢（","经典种田流","真萌新","其实我就 2018 年玩了 8 个月","可以看出代码就改过两三回(","最高排名只有 385 的屑","6.93m cr","不是萌新(","这个就是当年1个 token 换的","我买了 life time 有个多余的 token","我记得那时候 lifetime 刚出有优惠还是什么的","就买了","然而买好了就没怎么玩过","lifetime大佬","干","我的挖矿机还是在往地上丢","芜湖","那就搞个搬运工咯","我就没攷虑过要捡地上的能量","【fora要回来重构啦","那你要矿机干什么","lifetime大佬","我看看国庆有没有空写代码","把一直想做的几件事解决(","todo list","怎么了","好像我改的代码没 push 上去 Emmmmmm","估计梯子炸了","link采集需要做满仓检测吗","随意","爆仓会出事吗","看来不会","纯粹的任务制是怎么实现creep数量管理的","死的时候给spawn推任务？","好像可以","【我是这么弄的","定时检查任务","我有点想把spawn和room分开","我早期RCL<5的时候","我是ttl不够或者死亡会推","不会呕","只会装不进去东西","报错","creep数量管理都是直接看数量的","现在不了","用空余cpu控制跨房的行为数量","因为当时非正常死亡过一次","死了就加入生成列表","你群nuker感觉都是摸鱼的（","如果不要了就删掉 Config 让他等死","但是我觉得还是往地上扔方便","加把劲骑士都在tower","我这个自己看一次笑一次","当时怎么想到这么蠢的写法的","那点损耗","亏的","有必要在意吗","前期花5000造个Container不香么","在修container之前你甚至都挖不完","我的两种搬运工处理任务部分我已经不敢动了","那点损耗，和修container的时间损耗差不多","啧","为毛有时候我的creep有几个会站一会等另几个动","堆成大山","何苦呢","要不是代码，要不就是你网络","放地上不香吗","就那点损耗","这个比之前那个还傻","我都扔地上都爆仓","硬硬的","我因为扔地上爆仓，现在甚至已经开始不玩运矿分离了","啊 怀念","没有办成的群二维码计划","把所有采集的职业都叫Worker，干啥都统一调度","缓解爆仓（","你们爆仓都习惯了，我看不下去，强迫症","有没有一种方法不设置role","给creep动态分配角色或者根据任务决定角色","【分配房间整体策略好就不会爆仓","之前群友想过根据部件的任务发布","那完成到一半死了呢","不知道谁完成怎么跟踪进度","【那就不要接任务","【赏金猎人】","我理解成加个expiry","接任务的时候估计完成时间 到时候了没被删掉就给其他人","或者不要接(","又被凿开了","或者及时捡 不过是额外的cpu消耗","还是不接算了","估计完成时间还是要写的精妙点好","所以角色制也很好用","要不就直接找比估计时间大很多的creep","懂了 不写任务制问题解决","【或者就写大一点","这样回来还能🐶命","睡觉去了 明天还有考试(","晚安","没被布置任务的就在家里打杂","/关键字","一般都是lifetime少的","yoner的任务制应该是极其精确的","/关键词 872286346","@错了草","？","/关键字","草","那不就是初期分化了吗","草草草","你可以去看他的房间","@6g3y的机器人 /关键字 1523284180","毕竟在s3有18间房","草","珍惜时间（逃","草","能不能康康我的","@6g3y的机器人  /关键字 1460582649","涩图","机器人","哦豁","涩图十连庆祝一下","芜湖","怎么同时采两个矿(=・ω・=","好涩","涩图","涩图十连","这是曲奇bot么？","色图bot","az","不明白你说的什么意思","涩图","涩图","lsp排行","nb","不够","？","不就是穿得省布料的女孩子的画像么","除非极个别","很少","基本都被过滤掉了","擦边球的","漏了一点点的","露点的活不过一天的","这个游戏有没有发生过什么联盟级别的战争","说来听听","那时候见到他们签名的就直接杀","快别GHS了","因为好多人用这两个挂机","一天进来几次都是看见瑟图","然后开源的很好找弱点","😂😂","害怕","就是只鸡","居然好了","开启 tips","成功 开启 tips","开启 rank","成功 开启 rank","涩图","涩图","涩图","什么id","233","6ra来搞我 = =","6ra射3m墙233","。。。。","真刮痧","233","给他白打了300t","来了两个黄秋","可以收割了","气死他","噶韭菜","还来好几个黄球233","creep.memory.step = 1;","这样吧- -","原始的s2人- -","不给他们来点boost 他们是不知道痛了= =","看来不能省钱了！","- -","总输出 5*5 ra","25*40","nmd","这五个加起来一千伤害","话说","我在想","我这样用 Github Actions 会不会被当作滥用","如果我跑好多个测试用例","黄球在我家门口","不打人","我傻了- -他们在干嘛","一个 Workflow 几小时的话","开会吗","不过 Github Action 的性能有点捉鸡","120ms/tick","我本地差不多是 12ms","cao","他进攻太菜了","我有点想放长线钓大鱼- -","让红球在s3等等再来了","不。。。本地是 24ms/tick","真的","好像macos性能好一点","反正开源免费","直接用macos了","api的memory","只有memory里面的东西可以skip tick","不啊","普通的变量也可以","但脚本重载后会消失","creeps可以保存过帧吗","能getObjectById拿到的好像都不能用属性存数据","但是你可以把数据存到Creep.prototype里面","还是不推荐用这些","因为无法真正持久化","不过性能比memory要好。。","存临时数据用","那就有很多现象没法解释了","结果只有每次脚本重载的时候会输出","（前提是制定了loop函数","*指定","你可以看成你每次提交代码都开一个application","然后","每次都是内存重置","就ok了","这不难吧，有手就行","讲道理修改prototype真的合理吗","对于js来说很合理啊","对于可扩展性来说","设计模式来说","如果不修改prototype，而是把对象作为参数","本质上并没有区别。。","调用的写法不一样罢了","不是啊","设计模式没有区别。。","算了","无所谓了","这里加个else","也不对","感觉你代码都是问题","不看了","修改原型链看起来更oo一些","是这样的没错","但如果限制作为参数的对象类型","也就没什么区别了","数据和对数据进行的操作仍然是绑在一起的","你写的不是在35房间的意思- -","是有35视野","creep.pos.roomName == 'E35N9'","才是在35- -","草","这是啥","北京下大雨了","干","异次元入口","他在那守路口","你在哪个区","我不想要哪个房间了的话","可以想办法弄没吗？","怎么弄啊","unclaim","好的 回了","你在说什么","我说你在北京哪","反正你不用来我旁边","哦哦","来广营","我才不去你旁边呢0 0","这边","哦哦  不知道在哪。。。","哪个区了 海淀 朝阳","朝阳区","哦哦 我也是朝阳区的0 0","我可是♂新手清理装置","切","我三房都开起来了 怕不怕~","都几级了","7级没有","我可是♂新手清理装置，只干比我等级低的","马上7级0 0 还差 几千经验了","我觉得","我还是有可能打得过的","老哥们，一个creep带多少个work能挖干一个矿啊","应该5个","没记错的话","233","神经病- -","这所有的creep加起来只能打","12*5*40","就一个红球的输出","新手保护期内会有野怪吗？","很快","把教程代码看懂了就能开始了","你要占的房间被群友抢先了？","不出意外，这周你群就能过千","啊这","涨人数可比我的视频涨播放量难多了（暴论","你群怎么突然这么多人了？","火了？","昨天还899","今天就912","估计马上就能过千了","我是b站来的","screeps要🔥","涩图三连！","第一张好","cn！","cn!","有寿命","1500tick","yep","带.艺术家.刺蛇","每日一顶","草","？","群主已经是吉祥物了","群主已经是吉祥物好多年了","经典有手就行","py转js只需要一天","害我都是零基础玩的","我也是0基础","现在都玩7天了","你龙王都拿了14天了","玩7天了（指龙王最高蝉联10天","时间管理大师","复制粘帖一把梭","好久不写代码手都生了…","写个递归算原料差点原地升天","cpu吃紧也用递归吗/偷看","撤回后面的话怎么加的啊？","不告诉你","各位大佬们好","刚入坑 想问下","新手礼包在哪里领取","你几级了呀","大刺蛇就是你啊，那没事了","能往别人的 storage放物资吗？","他人很好","多要几次就有了","我就是找他要的","话说你群还在玩这游戏的有多少？","900人里","萌新挨打中","至少有1%吧","排除一个错误答案 914人","果然要把矿包在里面比较好- -","被人打的时候不会挖不倒矿","草群主还真是吉祥物","能","涩图","可恶啊","这个沙雕","真就用boost来打我的link","脑子瓦特了","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","啊这","*lsp","？","小曲奇:理解不能","你这就有点为男人了","你这就有点为难人了","瑟图","是我","那你报下地址","我去救你","草","/lsp排行","关键字","这个排行榜能不显示QQ号吗","/关键字","复制QQ号干什么","哦。。。没事了","@6g3y的机器人 /关键字 1029247665","看来我没有高频词","你的新手村还有今天结束啊","几天","1天不到","打我可以","留个全尸","让你留下悔恨的泪水","我已经做好心理准备了","下一把","我还做个人","侵略者是直接刷在房间，还是刷在外面走进来的啊","国庆改一下代码","你是不是开了文档","所以打开了浏览器","任务管理器","也不行吗","在游戏里打开文档所以打开的浏览器","也算游戏进程","这样啊","但是steam关不掉你的浏览器","所以就停止不了了","惊了学到了","fork","就是commonjs啊","除了模块名前面不加路径后面不加js","什么叫写一个模块的标准","美好的一天从涩图开始","lsp排行","我怎么40张了","这不可能","涩图十连！","真有精神","涩图20连","涩图十连","一个pdf的功能给我搞自闭了","js有没有自带的优先队列啊","你在对象里面写var？？","不用var","涩图","这样就行了","都没问题","y:()=>{}","y: ()=>{}的话this不是y属于的对象了","是外面的this","无敌了！","太色了","戳xp了？","？？","有人不喜欢莫斯踢🐎？","不会吧不会吧","是这样吧","还有人到此一游- -","awsl","我死了","我也喜欢小鲨鱼","纳尼！","真有新手礼包啊","开心~","竟然是hoho大佬的！","感动","我反手就是一波大甩卖","卧槽270k一个","WN区资源没人权","200k都不值","明天你不会真的来干我吧","？","我15天前进群的","我是萌新","【不至于不至于 大刺蛇忙着打yp呢","大刺蛇打我","只要一波1人小队","就可以把我家spawn拆了","没事 有时候一个人过于弱 别人也不会打","【fatbu快乐房","大刺蛇就不一样了","把你墙塔拆了 当成自动外矿","涩图六连","怕啥的","用手机看啊","哈哈哈","Fatbu?我打过","涩图","涩图","不能说涩图这个词，要不然就","为什么不能说涩图这个词？","666","打出涩图两个字会让你在lsp排行榜更上一层楼","也就是说以后的交流里要尽量避免涩图这两个字？","随便是哦","随便说","是的，涩图还得少说","只要你不怕榜上留名","lsp排行","看到第一名了嘛","80多张","lsp中的王者","牛逼","看来我还是任重而道远啊","量力而行","冲榜可耻","涩图十连","啊哲","连发效率很低的","请问各位大佬 群公告提到的新手礼包现在还能领吗？","因为那是我自己做的机器人","我才是真正的白嫖者","lsp排行榜","就是你把鬼子领进来的？","lsp排行","好 谢谢","还行","造好terminal就自己说啊，我咋知道你到6级了","这游戏terminal转东西流程是什么？ 我需要提供什么吗","提供你的坐标","W37S1","需要terminal的坐标么","不用","W19N11","你可以把值钱的东西都发给我","我替你卖掉","好了，提供坐标就够了","现在群友可以发核弹了","等一下我把我的皮肤发给你","呀咩咯！","爽啊","天天蹲着我","我和我的好兄弟在你家门口等你 而你 从未出现","话说一般上RCL4要多少tick?","应该很快吧，复制教程挂三天也能4","gcl呢","我想算算我集成测试给几个tick超时","你是写自动发现的bot？","发展","嗯，打算写","往我家里走 10t 5ra 25h","= =","嘿嘿","我在你附近有一个room","你右下角那个","我停掉那个房代码","他没准会来乘机打我","然后你就被顺路干了","这个计划怎么样","这就是借刀杀人吗","但是","有一点","你要特别注意","特别特别注意","算了，到时候你就知道我在说什么了","无法分析？","？","成精了？","？","涩图十","有很多排行榜，你说的是哪个？","哇，我也想入榜。","lsp排行","css看的好没意思...","我想直接看javascript","那就看js啊","看什么css","快进快进快进","冲冲冲！","creep从仓库中提取资源的关键词是啥","找半天了都没找到","withdraw","我瞅瞅","找到了，射射兄弟","涩图十连","加了个提示","1000tick一次","就不用去看了","秀儿","怎么统计tick次数的啊","Game.time % 1000","哦哦 明白了","房间号有啥好遮的","你不发房间号可能会被群友干掉","当然发了也有可能会😂","萌新","大佬就是大佬 都是挂外面的吗","发了不会被群友打","群友不打群友的","最好写在群名片里","群友打人会先在群里搜索一下看看是不是群友","那我有个问题哦…比如我领了新手礼拜 别人来打我 会被抢光么","会","我这个位置 算安全吗?","看不出来","而且现在我也不知道谁喜欢打人","lib好像已经不玩了？","所以大部分喜欢种菜没","lib是在挂机了","刷榜可耻，减半惩罚","lsp排行","lsp排行","萌新问一下想用java写的话有没有类似的工具？","涩图三连","/lsp排行","你的排行不行啊","不行了吗","刚才那个刷榜的怎么还没上榜","自动过滤了","智能呗","……","噢，原来是新人bug，我还以为我机器人挂了","写好了发你","突然想起来舞台酱可能会爆仓再起不能","接近成本价倒卖","算了再降一波61.203一个","可以","我好几天没上线了","可能有的bar快爆仓了","希望你能跟得上我的产出","下面是三个零级工厂","要那么多cr干嘛","我一周后再上线看看但愿不要爆仓","不如搞搞天使投资","天使轮","天死轮？","给我100m我以后还你300m","你这胃口有点大啊","一般这个时候要看看你的财务和流水","一百m才多少","你们谁爆仓的话 给我邮点资源哇 大佬们","比我一天印的钞少多了","能量优先","2333","果然是由繁入简难啊","加速 建造  和 加速 升级的有吗","邮点","主要问题是在s3不开订阅不套现根本花不了多少钱","都有发房号","W12N38","我给你升级和刷墙的各100k","对了我上次给过你吧","现在可都是财大气粗啊","用完了吗","你们是怎么检修道路，每隔一段时间遍历一遍吗？","当初我的新手礼包只有资本家给的几k化合物","我给的是t2","加速的用了一半了","主要能量跟不上啊","你挖一下过道资源我收","我当初都是6级自己合化合物挖depo赚钱了/头秃","tql","什么意思0 0 ？","时代变了","我4级的时候挖depo","就挖了一点烂在家里了","主要当初被困到新手墙里","挖过道有点难","7级就自己攒了好多抛瓦","时代变了","涩图十连","检测tick时间的好了","lsp排行","emmmm","涩图","涩图","lsp排行","机器人莫名崩掉","/screeps rs shard3 W18N16","生成中...","？","你干嘛","/screeps rs shard3 W12N38","生成中...","看看你发展的如何了0 0","怎么测每tic啊","自己测每tick的时间没意义啊","官网都有","就是想测一下","检测完我做了回收","会自动清空的","然后间隔时间/tick数就好了","数据结构类似这样的","data.sum() / times 即可","你是需要每两tick之间的时间？","有api么?","data 会直接抛弃掉的","涩图","机器人终于被我调教的不需要扫码不需要验证码了","今天我出差","明天统一发一波新手礼包","跨位面 代码怎么样执行的","是 位面2，和 位面3各跑一次 代码吗","/screeps rs shard3 W1S22","生成中...","相当于两个服务器","一堆机器人","if(Game.shard=='Shard3'){}","if(Game.shard=='Shard2'){}","最少四个了吧","小i 空白 翠翠 6g3y","然后 里面 各自写 逻辑","是这样的吗","是","可以这样","【我是全用统一的逻辑了","然后我就疯狂报错 各种错误。。。","一进位面","ags是在不同的shard跑各种bot吗？","s2跑om s1跑quorom好像","各种逻辑里面都有memory修改，是不是没救了","听不懂0 0 .。。。","是什么意思？","我已经挂机一周了","我已经挂机半年了","打仗太费资源","极少数的会把打架当作乐趣","啊这/暗中观察难道没有战狂玩家吗","【群里有位曾经的战狂","有不具有攻击性的玩家","但是有具有攻击性的bot","（指小猫咪bot","小猫咪","无心工作","经典发言回顾","斟茶也挺难的","只想下班","啥时候更新","【搓完这一批5级看看吧","【能搓个一段时间呢","可恶啊","t3真多啊","再用一点","满了","收不进去","（大概","正常会进去一部分吧……应该","不是吧","地上的不会进容器","但是会优先掉落进容器","是从creep身体里溢出来的会自动掉进container里","长鹅草","禁止谐音","涩图","涩图十连","100名之后连参与奖都没有","Access Keys 请问一下 这个有什么用","seasonserver的加入门票","草","能有100人打吗","吃鸡？","反正我是没有5个key","seasonserver是啥?","一个限时的活动服务器","和暗黑三一样的赛季?","这赛季规则有点东西","*","我觉得我只要进去随便手操一下就够了","可以等别人挖完墙然后自己送吗","qs","找个孤儿角落搞单人运动","哈哈哈哈","就是不知道资源量多不多","【所以蛮好奇地图大小会怎么控制","没准像安娜几一样廉价","离tigga远一点就行","还行","第一能整个几十m","我现在有九个key","之前手贱卖了五个","也有可能想抛瓦","*像","挺好","远离好战分子苟一下就好","给人的细节描述还是太少","如果和pb一样也还好","不过应该要上t2boost","我觉得廉价多量更有可能","或者另辟蹊径找bug","要上carry的boost运","？","或者就是安娜几运？","防止被抢之类的","可能确实会有bug233","但我还是觉得不会有100个人","这不就相当于开挂了。。。。","应该会有","群里除了你有人想进吗","反正我是没想法","这。。","20m也不是很多","嗯","但是没时间写🐴","看奖励","看奖励","看奖励","说不定很好看","可以卖一波","【奖励官服十个gcl和gpl","那对等级高的太好了","我觉得是皮肤","冠军皮肤啥的，或者贴纸","最差也应该是cpuunlock之类的","总不可能亏了吧","嗯","肯定亏不了","起码前100应该都挺赚","起码前100应该都能回本","前几名吗","那是啥比赛啊","看不懂","虽然说是不会发的早 应该是同步发吧","赛季奖励感觉与我无瓜","我两年前最高纪录才全服300","烧抛瓦我还是可以一直都保持前百的","看看有没有一百多人会去肝","😂😂😂","大佬","?","在偷懒","图片暂停访问好捞啊","涩图九连","涩图8连","七连涩图","安全这么高？","小孩子看了根本把持不住啊","涩图十连","我擦","这个诱惑度有点高啊","?","try{}catch(err){}","捕获异常","哦对","谢谢大佬了","qq呢（）","可以统计一下说过话的人里有多少没有召唤过小曲奇",".test 11","啊不能test了吗","不能体验开车躲管理 当前不刺激啦","lsp排行","lsp排行","我突然想再搞个机器人","天天给你们念经","已经没几个活人了 还要再来一个吗","dns？","？","dns应该是网页打不开","那，我刚开机是好的","奇怪","反复试了几天了","80端口被限速了？","都是几分钟后突然出毛病","用的校园网","leakly bucket限速","哦","一开始用没有限速","同学在下载","校园网内部也打不开","用了一点就被限速了233","限速问题吗。。。那我试试手机热点","好难啊","看不懂","改成手机热点之后，我就什么都打不开了。。。","电脑问题了","嗯...","连QQ都打不开","有大佬给我一个代码让我跑跑看么","唉，那有群友知道怎么处理吗","涩图！","index.html","涩图图！","涩图十连","你试试看ping百度","看一下延迟","6g3y","留给你的时间","不多了！","？","我电脑上的QQ发不出图片。。。。","能ping通","/捂脸","但是百度打不开","好像我电脑网速特别卡","我试试","360开启dns选择器","dns优化","你把你外网ip给我看看","我查一下什么网络","百度，ip","然后把ip都给我看看","我打不开百度。。。","我只能打开QQ","完蛋，是死循环","要工作经验🔁工作","哈哈哈 yoner","惨 yoner 惨","我觉得跟dns没关系","我校内网站都打不开。。。","善哉善哉","我没有hosts了。。只有一个hosts.ics","重装解决一切问题（√","（重装系统吗。。。","(重装电脑)","（系统）","不太对。。我输ip也进不去","换个浏览器?","换了。。","二而且电脑变得非常卡顿","连Windows都点不出来","是不是什么东西占用资源。。。","CPU和内存明明空闲很多","系统中断?","等下。。。Chrome占了一半的CPU","不知道在干嘛","而且他打不开网页","翠翠！","我滴个翠翠！","cuicui","刚刚一直在想翠色原来是什么","啊是tracer","我现在开机只能用10分钟电脑","带刺蛇！","czc！","我也是见过大风大浪的人了","中央区域","因为这块地区不配拥有controller","有一些特别之处，可以看文档了解详情","你看看他的controller","官服最多吧","阿里云","有的","有群友的服务器","群里教js吗","js百度一下就能学吧","不教","菜鸟教程或者w3c什么的","js还是很好学的","两天就能学会基本操作","这游戏有手就能玩","？","好tm难","写代码是不可能写代码的","退款又退不了","只能在群里看看涩图这样子","screeps 启动！","放假模式开启","涩图启动！","如何获取creeps的数量啊","找不到api","对啊，角落开放了","数量都不知道，咋遍历啊","教程代码不是有吗/沧桑","并不是","for in","这游戏不是有手就行吗","这不是数组。。","for name in games.creeps","百度一下for in","values","js不太顺手","如果要活的，就filter（e=>e）","文档我没看出他是个map...","？","没事的","?","有说的","在game下面","记得是有说的","并不是map","是object","你们这群人…","万物皆为object","js都记不清楚","还说会玩游戏","一个个都没手了吗","然而我不知道map是个啥","这文档是这样看的吗","虽然我不知道，但是肯定不是这样","那是返回的数据类型","嗯","我不是说了吗","就这样啊","object.values(xxx).length","学到了","js这样获取长度","我觉得js跟 es6好一点","看自己习惯吧","js es6","es6优雅一点","es6除了导入导出其他都支持了","现在谁还用es5写 你以为写兼容呢","可以看看我的项目","大佬给个地址呗，我去膜拜膜拜","sim里面对原型的修改是不是挂不上去","我挂在之后只有1tick生效","理论上来说只要不报错就能改原型属性 没生效可能是你写错了","czc有无power","烧点给我","无，一两个月没挖到了","最近准备修一修","power是什么","超能抛瓦！","超能抛瓦！","。。。","抛瓦 is 抛瓦！","这游戏前期感觉要把方法都封装一遍","水球跨着shard追着我的援建creep打?","多大仇","【明明我也是纯色球","击球犯规，交换选手！","文明观球 文明观球","这里也有桌球玩家吗","woc？！","mhy这么整没必要吧？","mhy：我就个debug接口忘了删","闹出这么大的事？","转发","我不懂","不好说","持续关注等着吃瓜","米忽悠也没必要怎么做","赚钱和搞事情坏口碑选一个","我没咋用过这个命令","拒绝访问啥意思","sc这个命令","虽然我不懂但我觉得很可能是谣言","虽然我不懂但我觉得很可能是谣言","emmmm","确实有这么个文件","但是不知道是不是干这事的","写个bug不是很正常，就等大佬拆开看看上传的是什么了","知乎有人说是反作弊系统","但是删除游戏后进程依然存在好像也是真的","重启后呢。。。","不清楚","貌似要想用ce改原神就要卸掉这个进程","而且这个结论好几天前就出来了","当时应该是pc刚开放测试有人尝试做修改器研究得出的吧","直接去你的文件夹里找","？","我就有啊","……","很多用Twitter oauthapi的应用都请求一堆权限","不知道怎么回事","删发推文啥的","看着就让人不敢用","没必要这么搞","怎么说","反作弊的目标是什么","初始号？","游戏作弊？","还是？","你细品一下","就数据吧","反作弊是反什么的","数据我大服务器里面没有吗","怪猎玩过吗","线下ce改","改完传线上去","ce就行","然后第二天就被封号了","不会的","一直都没事","因为你把数据传上去了","那是怪猎没风控","这种异常值","问题是卡普看的游戏","随便丢个模型","卡普空","有","再找找","就直接封号了","找了好几遍了","ip下一天账号注册过多","手机注册账号过多","只找到了身体部件的常量","原神不知道能不能离线玩","如果是反作弊的话这反作弊肯定没啥用","账号地域离散异常","这些才是关键","你这么玩米忽悠不关心","他们只关心","钱","能不能噶韭菜","233","如何赚更多钱","初始号必须掐掉","至于游戏体验，开挂什么的，你充钱就完事了","不知道有没有米忽悠私服","开挂不需要充钱","初始人物半小时通关","structure原型下也没有","mhy有风控吗。。。。","要异地登录+初始五星，然后设备注册多账号","这个风控叫几个实习生就能搞了","不了解，不多评论","别问我为什么知道，我就是搞这种的","至于，注册多少账号嘛","这个是商业机密","像这种，不死才怪","或者同ip注册多账号","时间序列稳定，相似","这样的才会封号","涩图！","啊受不了了啊啊啊","涩图","有群友会玩悠悠球🐴","你可知何为火力少年王","刚翻出来点东西","感觉得做些什么","这么大了还玩溜溜球","不怕得手指静脉坏死？","我学生物的你不用唬我","再说我有指套","没啥好捡的","可以试试有运输任务的运输姬暴毙后发布一个捡尸体任务","再遇见自己死亡之前就不工作直接自杀不好吗","那我能知道运输机的尸体是哪个么","看tombstone的creep应该就行了吧","最好的方法","如果活不到结束任务","creep就直接自杀，不接","+1","所以大佬是会算一下任务时长的吗","【不接但是不自杀","少于50直接死","我说的暴毙指跨shard运输被人劫镖","【自己家里不至于暴毙商品撒一地","要是清理战场的话发布一个房间号当参数的运输任务就行了","要捡或者不捡的东西做个list","萌新想问下，获取房间内所有道路对象的关键字是啥啊？","find！","看看教程里的filter可以干很多事哦","我还是去抄代码康康吧","除此之外我觉得其他没有捡尸体的必要了","za还有mist没","那运输机暴毙了 岂不是很亏？","我刚开始搓mist","但是这样好像不行？","暴毙只能是被人打了","打回去就完事了","反正就不让他老死吗","啥意思？","老死是完全可预期的啊","人家是自然死亡","你用那个常量查的建筑","我要升6级了","新手礼拜等待着我","不是game.structure也是个字典吧","我好像都没见过这个东西啊","哦好吧","我现在连有哪些建筑常量都不清楚","文档","刚在API里找了半天没找到","【constants","常数表太长了…","懒得看","穗穗存在感--","先把room和creep类下的api看看","被保姆式教学了，好丢人","搞一手 你有单子么？","61.203一个1000t左右会出30k","hoho要重出江湖了？","我挂了个500k的单子","我啥时候退隐了","急需的话只要出价高于65就会自动deal","我瞅瞅","好家伙还有这张图呢","【视频里用过 今天翻到了","不是吧 access key 涨到 10m 了 = =","不是都囤了好多么","最近遇到的几个 om 怎么都不会开 sf 了","墙也不会刷了","大大大大大大刺刺刺刺刺刺蛇蛇蛇蛇蛇蛇~~~~~~","涩图","涩图","我就加了这三行代码为啥cpu直接爆满了","死循环啊","你while里面有对transfers做操作吗。。。","？？？没有啊","哦我忘了","那不就是一直循环？","nt了","while?","if吧","if","while可以用啊","while直接爆炸","transfers++","你只判断一次干嘛while","每一个游戏刻要执行完你全部的代码","可以用啊","这个是每tick都要跑一次的","到这里没有执行动作的时间","莫得关系现在用不完","才1cpu","等于什么也没做","自然死循环","忘了transfers++了","低级错误","为何不直接改成if呢","确实。","不都是这样嘛。。。","感觉很好用，但是开发难度很大","不如白嫖一下","艹","暴。。暴露，在两个眼睛和张开的嘴巴吗。。","暴露草","啊浙","草","penis 0.994 草","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","草","屌面人？","村 民","。。。。","我擦，还有这功能","男 草","被和谐 0.981 什么意思","censored","为什么还有风见幽香","哦","kazami_yuuka : 0.561","群友的英语词汇量都在奇怪的地方上异常丰富（）","涩","图","我是0","知道了","啊我是说英语词汇量","知道了 你是0","来分涩图","新人欢迎涩图","我擦 这真够色的","这得用多大的数据量去训练啊 咋什么词条都有（）","暗示涩图很多（）","确实很多，天天发也没见重复的","wtf？","shared3","公平（）","没有等级碾压（）","事实证明大雄一脸吊样","这咋暴露了啊","哈哈哈哈","屌面人是这样的","吊面人","tql","关闭 tips","成功 关闭 tips","睡个好觉","加速器没有这游戏","建议自己弄个梯子","我当时还去迅游申请了加速screeps 但是人家不给加","但是奇游好像有（","看了一眼 没有（","一起来就看到不好的事情","jerdaz…那个种田bot？","你还活着吗","新手墙是不是倒了","快去把大刺蛇扬了","开启 tips","成功 开启 tips","涩图十连","涩图*10","涩图十连","欢迎新头发","涩图","欢迎新大佬","涩图","你说什么呢","我是大刺蛇忠实粉丝","但是大刺蛇是谁呢","或许没有，或许人人都是","大刺蛇大刺蛇！","涩图","1m = 1000000000000 是这样吗?","storage里可以存1000000000000能量吗?","m不是million吗","m是兆吧","m代表百万","这样吗?","我以为是兆","就是1000k","ck！","草","？","1m=1000*1000","1e6","了解了 谢谢","1million和1兆不是一样吗（）","100 0000，1000*1000","第一个订单是系统发的","而且现在还有很多房间在空地的订单","npc终端吗?","其实游戏开发在暗改自己的数据（）","那我赚的cr会因为我gg了 消失吗?","还是在账号里","涩图十连",".runPython","'草'*10","未支持的语言：Pytho","涩图",".runPython","'草'*10","未支持的语言：Pytho","涩图五连","涩图",".runpython","'草'*10","未支持的语言：pytho",".runpy","'草'*10","未支持的语言：p",".runpython ","'草'*10","运行结果：",".runpython ","'草'*10","运行结果：",".runpython","print('草'*10)","未支持的语言：pytho",".runpython ","print('草'*10)","运行结果：","草草草草草草草草草草","机器人实验群",".runpython ","print('草'*10)","好活","运行结果：","草草草草草草草草草草",".runpython ","print('giao'*10)","为啥n丢了",".runpython ","print('\n'*1000)","输出过长",".runpython ","print('\n'*100)","输出过长",".runpython ","print('\n'*100)","输出过长",".runpython ","print('\n'*10)","运行结果：","涩图",".runpython ","print('giao'*10)","如果迭代调用会不会堆栈溢出",".runpython ","print('涩图'*10)","运行结果：","涩图涩图涩图涩图涩图涩图涩图涩图涩图涩图",".runpython ","print('👀'*10)","草",".runpython ","print('涩图十连')","为什么没有","运行结果：","涩图十连",".runpython ","print('涩图十连')","好家伙","涩图十连","我的机器人已经面临崩溃了","不支持循环吗?","涩图机器人不会崩了吧","炸了","更别说涩图机器人了","不支持循环吗?","快进到代码注入攻击","涩图请求一多就炸","超低并发设计","卧槽这图","redis读取报错","我的空间吧","分析现在也坏了",".runpython ","print(os.name)","人肉ddos","机器人即将崩溃（）","ckS","ck！","草","涩图",".runpython ","print(\"涩图\")","运行结果：","涩图","进行了一些优化",".runpython print(1)",".runpython","print(1)","ck！","草",".runpython","print(\"我\")","怎么监控qq群的聊天记录?","lsp排行",".runpython","os.shutdown()","未支持的语言：pytho","互相检测关键词自动聊天（）","那可挺有意思","可惜我的只是功能性机器人",".runpython","os.reboot","功能","保健功能 性机器人","我在2077年吗","9","你们放假几天","大学生","我们4天","1天","八天","5天","1天哭了","原来比我惨的大有人在","1天那个太秀了","岂不是普通周末","哭了","但是我有预感我tm今天晚上还想又得加班","好像又得加班","？","又来新大佬了","欢迎新大佬","群员破千指日可待啊","欢迎新头发","转移就行","点进去旁边有按钮","只有转入到screeps里的","没有转出到steam的","大佬已经…冲上了吗","所以买那玩意有啥用","只是试试看","好气而已","好奇","点进去找啊……","绝对有的","在右边","就是","在买pixel的界面","3080显卡翻车了","能麻烦大佬截个图吗?","我在外面……","上课的路上","我室友的3080显卡被快递整坏了","买的界面","点进去","怎么把这个262 加到steam的库存里","现在去找快递理赔在","找到了","谢谢","这个挺贵的","不过如果想买建议买那种最便宜的皮肤","然后分解","我之前一毛买400pixel来着","草","有道理","这个稀有吗?","刚出的","跟抽卡手游一样","金的最好","骗带哥可以，别骗自己","话说……自己定义了一个function，怎么跨文件使用","export","教程过了吗","import","嗯嗯","js没学好","涩图三连","可喜可贺","经典云玩家","可以从头开始","screeps不原生支持import export","require","有是有不多","而且都是t3没有多余的","哦 哪算了 我把你给我的卖点 换成这俩种哇","t3合成太慢了","哦哦","升级的你加工成t3很赚的","我还没写合成的代码0 0","其实t2就够用了，只不过当时只有t3就写的很硬现在懒得改","本来打算过段时间占那个房的","哪个？","11n45","被占了就算了","哈哈哈 我下手太快了0 0","我连夜 手操抢的这俩个房间0 0","肝帝","。。。。。。。。。。","是这样的","我刚玩那会也是手操疯狂开外矿","大佬们还在玩，我已经弃坑半年了","大佬们都开工，我还在看教程\* */","谁拉我回下联盟我要继续染蓝色","BestJohn","我的gcl已经超过我原来的号了……","挂机半年多了 看看房间还在不在。。。","不愧是你","大佬都弃坑了 我还在加班","hoho还在加班 我就放心了","声援hoho.jpg","hoho拉我进联盟吗","曲奇bot已经在联盟组织里公开了","联盟 现在还有联盟了？","想看的人就可以看了","曲奇 yyds","你的bot是涩图bot吗","金色?","就离谱","?","你抽了几发","我之前一个旗帜卖了七十多","已经在mysql实战了吗","这个金色能值多少","看好不好看了","这个很多人都抽到了","steam上86","没啥不一样","不一样","下面判断是上面判断的超集","想要creep的皮肤","开出来垃圾的 直接分解了","包括所有可以隐式转换为 false 的值","null undefined 0","如果source是0，上面false，下面true","要是个对象那不是永真","永假","判断空就!好了 无脑好用","他不是对象吗","filter如何多条件筛选呀","或么…","这样写吗","是呀","话说","房间布局有最优解吗（","bb！","不知道","你们寻路的方案都是咋样的啊","因为不同人的目标不一样","qwq","(直接moveto)","比如效率可能有最优","cpu效率","我发现默认的寻路 如果俩个人平面了 他就会重新寻路绕行啊","能量效率","两个又不一样","能不能让他忽略 自己的creep呢？","那有没有算法能求出某个目标的最优解呢（","我也不知道","我发现默认的寻路 如果俩个人碰面了 他就会重新寻路绕行啊","遇事不决试试看ga吧","我觉得ga应该可以","ga 是啥","ga 是啥","反正房间地形固定的","你可以离线算","遗传算法","旅行者问题","求最优解","高效率地找到最优解和找到最优解","是两回事","233","枚举也可以找最优解","那就海龟算法","ga比枚举应该快不少","这个东西 打死了 掉什么？","给屠龙刀吗？","掉钱","掉商品","商品是很多很多的money","掉几个商品呢？","几块钱的样子","最高级商品掉几个啊？","好打吗？","我想打0 0","不好打","不好打","5级可以掉好几个？","不记得了","大概能卖10m","大刺蛇！","你们都打过?","大刺蛇！","大刺蛇！","刺激啊","哦哦","我打过但是没打过","好像可以用核弹炸","炸了之后就容易打","这群除了大刺蛇应该只有某w开头人士打过？","za也打过","除了wjx，ZA和大刺蛇还有谁拿到过五级的掉落吗","【舞台酱","没事了","这东西这么难吗-0 0","好吧","比大多数活人难打多了","这玩意有主动防御","bb！","每次打 slack上都会刷一波nuke","bb怎么还在挂quarum","因为我的新代码还没写好","有boost可以干新手","只造个boost连靠近都做不到","群友不如开个公司写screeps脚本吧","草","screeps咨询业务","群里都这么多人了还是没人写联盟bot嘛","没公司啊","不如这样","联盟都是啥东西？","都在摸鱼啊","你们讲的","有算法架构师没","没有项目经理 效率-85%","主要是算法","其它的负责执行","什么鬼","写不来啊","算法架构师？","不懂","是算法还是架构","可能是指同时当算法工程师和架构师的","没有架构师","我觉得都得秃","时间复杂度与空间复杂度，趋于n，即最优算法","1呢","趋于1","0呢","1怎么可能","看问题啊","有的问题是log(n)啊","有的问题就是log1","o(n)","o(1)","有没有O(n!)","有啊","有啊","O(1)","旅行者问题，如果枚举的话不就是O(n!)","多好","有人测试了letcode的一个问题的多少输入值","然后直接输出对应的答案","最优解","硬♂🐴","其实吧","你们完全可以","写个http接口","LeetCode的算法题，会hash基本没问题","然后手操","这种n！的","通通给显卡算","暴力输出","算台阶走法的","1步/2步","直接缓存全部结果","？","dp？","$result=","就很轻松了","遇事不决就dp？","这不就是dp吗","问题是你的算法时候dp吗","适合dp吗","爆破就完事了","？","？","震惊，np hard问题，居然可以用dp计算最优解","np猜想","化繁为简","算法的福音","只要运行时间无限长（）","上初中的我","对妈妈发誓","绝对不谈恋爱","十九岁的我","真香","上初中的我","绝不谈恋爱","现在的我","想和初中生谈恋爱（？）","我在和高中生谈恋爱","真好啊","我高中之后就纸片人了","初中？","哦，高中啊","必须纸片人啊","难道还能期望找到另一个吗","别想了（）","只有美女帅哥才有美好青春的记忆（）","丑比没有的","啊吃到一块肥肉，嚼了半天咽不下去怎么办","可以呕","嗯咽下去","使劲塞","反向进去","会容易很多","不行用搋子","草","草","这游戏也搞赛季了？","以前也有的","差点笑的呛死","只不过群友玩的少","要给钱买票？","自己赚也行","官方的要","自己可以赚","就是很贵","里面都是神仙打架吗","要恰饭的嘛","不是","是特殊规则","估计有奖励","现在规则下来了吗？","好像是收集资源","然后放到一个特殊建筑","没看更新说明","√","特殊建筑被一堆墙围着","要拆强","哦哦","开局100cpu","不知道是不是开局= =","每人100cpu","感觉这些地点会打得很激烈啊","关键是这些api会不会提前放出","还是特制api？","真就是神仙打架","说不定会有更高级化合物?","不知道新pc啥时候出","不过这游戏还真是够冷清的","玩家社区主要是slack","有什么解决方案吗  不能用文件夹 层级管理代码 太乱了","rollup","文件夹写代码","push的时候rollup","rollup之后 是打包成 1个文件了吗？","这样 排查问题  是不是比较困难啊","有sourcemap","报错可以看到原来的代码在哪里","不过不知道为什么这游戏在linux上会掉帧 = =","明明是原生的呀","哦哦  我研究下","确定是掉帧不是因为网络延迟吗😂","我教程掉帧","这游戏还有掉帧这说？","看着60fps降到40fps","有的","我开0ms延迟","还行","帧数直接10以内","而且说起来也是神奇","上次这游戏居然还崩溃了","真就是linux从来都是游戏的三等公民= =","？","没有吧","大部分游戏实际性能都没有windows好","资本在windows","没办法","像是帝国时代2重制版就是卡到死","windows流畅无压力","不过幸好screeps也不太在意帧数，别崩溃就好了","我是很喜欢linux能这么自由的折腾系统= =","但是本身桌面在linux里面就是个二等公民了= =","曾经想好像linux一样把东西放user里面","但是看了下还是不太现实","linux加windows虚拟机好了","反正现在学业繁忙= =","优先队列主要用在哪啊","spawn队列吗（","又来力- -","真是一个傻蛋","比起windows什么都扔桌面","还是这样舒服","optower能破防吗","我7级- -","8级随便揍他","7级我就修墙呗- -","有黄球我就上boost红球- -他也没办法","op tower 他还想蹭- -直接给他蒸发了","有没有获取房间到房间距离的api","我记得我看到过","奇妙的弱智ai","有没有什么好的写visual的库","走上来死了","那你还记得叫什么吗","这个yp的也不睡觉啊","24小时在线么- -","要是visual能直接写webgl就好了","手动改配置- -","我也去他家了=。=","结果走到一半","已经生好了两个boost红球","TuN9aN0","3个小菜鸡- -","- -这人就不睡觉","= =","又是两天没上号了  该上号抽卡了","这么多","太猛了","花了30%的积蓄了233 快变成穷人了","30%","tql","建议继续堆积","我上次一次抽了6w，特别爽，现在想试试一次抽20w","现在power涨了好多","一天抽24张就好 天天抽 233","抽了很多东西 然后发现","不值钱 - -","很气","你们不会抽腻吗😂","哈哈哈哈","是500一次吗","是啊","欧耶","还有什么输出函数本身可以直接看到源码的语言吗2333","shard2往shard1倒卖power简直就是暴利啊？","这是大佬的数量吗","想做位面贸易生意","抛瓦怎么涨这么多了","内卷","！","哦哦哦哦哦","！","供小于求价格无线上升233","这个还挺好看的啊","天啊，都玩游戏还在卷?","还行","wjx能挖那么多都不够啊","意思是 creep能带好几个装饰?","颜色变黑可能会好看点","想叠多少叠多少","来 发来康康呀","我也","图没存","错过了","诶大刺蛇nuker了","全是小的 难看","这么小的都看不见","我怀疑现在抽不到大的了","BestJohn","(那个网站我忘了","掉率被暗改了么- -","确实","我也没抽到大的","他不是说改过了么","给小的来组装","那前面卖的不亏了","我的一百多个紫啊","???","cuicui的尾货处理完了吗","老哥 你什么时候开始玩的啊","刚出的时候群里有人发现了个神奇的黑科技","1tick生4个p","抽了很多很多卡","最后号被封了- -","被发现了","大刺蛇，我是你的粉丝，不要拆我家","怎么这个人这么高产","发邀请了","按下去会怎么样0.0","enter","你要是按下去","你肯定很好奇！","是不是！","我当场","是挺好奇的","?","就把这个电脑屏幕吃掉","？","想了想","没必要出四人小队","把后面的改成了0","怂逼","没事","是男人吗？","你马上就会哭着变成我的狂粉了","这个号以后有事就可以切代码觉醒了","我马上开sf了","草","纳尼！","还有这招！","那我就Game.time+50000","？","插入一个5wt之后的任务？","可恶啊不愧是你","被你破解了呢","放假了放假了","玩点啥呢","今晚7点","开始填好东西了呢","黎明卿","rush b","先整把群星","？","没人看黎明卿吗？","没人看弹药包？","我这波好赚啊","？","出了四个红球= =","还在出","我感觉我都不亏了- -光在那换t3都不亏了","准备出发！","我亲自打你屁屁","？","一般我是自动地","但是没办法","谁让你跟我这么好","我手动打你","开心不","算了","退游","不玩了","告辞","爱咋咋地","没意思","升级好慢啊","你咋不动了","md","死机了？","垃圾","怕把你打死了","所以去过滤了一下","这什么垃圾机器人","嘿嘿嘿","动都动不了","我也来康康","就这？","公司好多人下午请假走了","就这？","就这？","现在剩下的人也没啥事需要做","动了动了","不会吧不会吧","全员摸鱼","哈哈哈哈哈哈哈","你tower怎么不会动的","- -","还就这","我啊","居然是摆设！","反正打了也是","不如不打","省电能量","这你都考虑到了","有点东西","这个理由 还不错","你就拆墙？","就这？","草","AI呢？","你就是拆墙大师？","是啊","这ai不行啊","你干嘛这么急这让我打死你","我偏不打死你","没意思","你自己还拆了个墙?","你还真猜对了","就是拆泥墙","让你白刷墙","拆墙可以","别拆这个","为啥不升控制器了嘞?","咋不拆了","为啥呀","拆了会怎么样- -","我都取打他了","现在没能量了","草","都被打穿了","我是不是 也要刷点墙比较好啊","塔动了","哈哈哈哈哈哈","有意思的呀","但是没有用","他不掉血","算了","专攻要害","以后再找大刺蛇算账就好了","气死你","你打不掉我的字","但我却可以打掉你的字","s2也再打呢","把你幸幸苦苦撸的墙","全都木大！","你怎么还有一个特别厚的- -","1m多的","其他就几十k","这你就不懂了吧","刷忘记了 哈哈哈哈哈哈哈","没事","我睡个午觉起来","你家就秃了","危","？","你咋还偷袭我- -","以后等我发展起来了","一眼没注意地上多了个尸体","不讲武德","第一个干大刺蛇","我来了。","那你加油发展- -","快进到被大刺蛇发展成军火库","你家墙加起来 可能没我一堵墙厚","纳尼","一般到8再刷墙","你根本就不爱护图形！","不行啊","- -","你加起来可能没有40m？","你才2.27m的墙壁","你家隔壁这个都有26m","鸡兔同笼配凑法","鸡兔同笼问题","随便找个大刺蛇都会","随便找个大刺蛇都会","随便找个大刺蛇都会","道理我都懂，但是大刺蛇是什么","大刺蛇大大，大刺蛇是什么啊","我只会 穷举法","总可以吧","可以","大刺蛇就是big py就是大刺蛇","就穷举吧","大刺蛇就是big py就是大屁眼","鉴定完毕","是你们大数据的黑话吗","？","大刺蛇就是大刺蛇","不是jargon","大刺蛇就是big py就是大屁眼","好的吧","只剩下 69了","Hydralisk","是这个","我是sb","是这个","第一个spawn位置放错了","这特么又是啥","然后respawn了","然后那个房间不可用了","过几分钟就行了","过几分钟就行了","我也respawn过","我也respawn过","没想到吧.jpg","然后被骗到大刺蛇旁边了","然后先大刺蛇再拆我家","综上所述","那可能新手区可以?","大刺蛇就是big py就是大屁眼","可能吧","几分钟啊","没有倒计时","普通房间两天","刷新呢","草","我是什么都没建的就拆了","欢迎新涩图","骗过来打","气死你","不可用的啊，不然弄个小号无限respawn封路口你咋办","就这？","我还以为多狠呢","打你需要多狠","你一个都打不死","？","我用得着多狠？","就这","就这就这就这","就这？","气不气","还以为多大阵势","就这？","就这啊","我连打你都不想打了","我来康康呀","两只了 哈哈哈哈哈哈哈","这不把terminal拆了?","没有让我打你的欲望","？","就这？","我还以为多狠呢","那就写个惨字","那你以为多狠/沧桑","你倒是说啊","又不能真把你透了啊","当然是留个spawn，其他全干掉啊","这届学员不大行啊","- -","这么m","你就3分钟破口的墙","spawn也干掉再给你造起来","需要多狠阿","- -||","帮你原地respawn","你家最值钱的也就大刺蛇发的device","并不会哦","他就打不到我了","还能造起来","会javascript吗","我就去别的地方了","那没新手礼拜了 怎么办","没了就没了啊","能怎么办","不行啊 我盼了好几天了!","zf 倒了！","？","cuicui还在","z~f~","气不气","？","zf也是老玩家么","哈哈哈哈","悲","你完了","我马上叫人打你","哈哈哈","快呀","算了","这游戏没意思了","求求你快点鸭","退游退游","请","不拦着你","萌新刚出新手区","话说","星门了解一下","就被老玩家打死","你们在哪里注册邮箱啊","是你说就这的=。=","最好可以自动转发功能的","本来没想打你的","都是你要求的","这游戏没啥意思了","那块退吧","哈压库哈压库","快快快","可恶","等着看你退呢","这招也没用了吗","md","你也太秀了","你还想欲情故纵","大刺蛇，我是你的粉丝","骗我出四人小队","偷学我的精髓！","我就不给你看","W18N16 以前是我的房间","大刺蛇，我是你的粉丝","真退了可还行","没事","md","诶","怎么退了一个萌新- -","大刺蛇，我是你的粉丝","我现在比你还萌新","都是被你吓到了","光速退群","你们那边是据点吗","出个四人小队拆你家算了- -","既然你都是狂粉了！","我只能起一个四人小队了","狂粉待遇","狂粉待遇","一个满boost 可是15kcr的价值=。=","夭寿了大刺蛇吃粉丝啦","60k都花在你身上了","草","太宠粉了","60k","60k","60k 我的一半存款","比我房间加起来还贵","是啥子","不愧是狂粉待遇","出四个满boost 要花60kcr","哦 是我得不到的东西","狂粉应该来4队的","4*4","哈哈哈哈哈哈哈","16只","不够意思","就这？","涩图","注册了一个Outlook的","绫波！","好亏啊","反正你打不死我","我把一个建筑工转职了","草","凑个四人","1500t后就没用了","这真的划算吗？","农民四人组?","算了我不写自己的bot了","写uos去了","算了我不写自己的bot了","3带一- -","overmind启动","草","bot king","话说bb","你之前那个bot","的做则","作者","overmind === bot king ?","overmind=种田bot","archived","已保存，我会在他下一次说话的时候提醒他","已经下好了","不合了","这事情太小了","233","草","但是那是error啊","会报错吗","会啊！！！！！！！","不然我发啥pr","这样吗我还没有注意到","你不能直接push吗","我康康","你这个res有点骚气啊","我删掉了...","夹了一个奇怪的东西","改之前是这样的","少了个逗号","233","还少了个逗号","allowJS也不对","应该是allowJs","这个东西- -","反正 你们的","都是我的","你打不死","那个修墙","screeps2","我写的是屎","是可以直接跑到脚本","你在吃我的屎","打不死","就不打呗","你那骚气的res  我放弃了","傻逼了吧","可恶","竟然不打","那没事","反正work可以拆墙","算了","50一下","我上班了","晚上再说吧","比boost蓝球还高","告辞","可恶怎么走了！","这个东西干啥用的","这么贵","赛季门票","买5张门票","就可以去玩了","你自己慢慢玩吧","晚上我再修墙","可恶竟然还要修- -","太过分了！","为啥 uos 已经半年没更新了","是这个意思吗？","他们说是去被暴打...","是啊","能买得起门票的","应该没有萌新- -","除非氪金买的","轮子哥改出的问题","这游戏氪金有用么...","233","有","我翻到了 哈哈哈哈哈哈","可以换钱","合了","写uos的人退坑了呗","没有微信 支付宝支付吗？","那我还是去写qos吧","是你咩","你可以支付宝微信给steam充值","然后在steam市场买","哦哦 好的","那不如直接买充值卡","淘宝买充值卡?","是我哦","嗯，咋了？","买充值卡便宜不少","js数组序号可以是负数吗？","我更在意为什么？ 序号要用负数","就直接选定数组末尾呀","-1","可以啊","OK，谢谢老哥","不可以吧，py 可以","我去看看报错不","hoho大佬中文api搞好了吗","那大刺蛇可以","搞啥？","不是说搞了个本地离线文档","群文件里就有啊","实测不行","那咋个找属于末尾啊？","length","length","length","length","arr末尾最后一项","loadash","你不是上班吗","ggggggyyy","地址发我下 我加到公告里","两周没回来群里资源又多好多","吃吃突然冒泡","吃吃持续潜水","有一说一，我们国庆放四天，可以嗨一下","嗨什么","嗨（10张卷子）","我建了个泰拉瑞亚的服都没玩过","233","我建了个mc服天天在玩","我买了工厂，我记着你群有工厂服……","啊这","距离放假还有2.5+小时","那个不是很久没更新了么","bb!","bb！","啵啵！","bb！","波","过于真实","好活","哈哈 塔不是纸片","MC有个导入图片自动生成画的mod","距离放假还有22分钟","手搭的= =","？","工作量超大","我用Screeps2的脚本了","结果生出来的creep都不动","666","把Memory清空一下","Memory = {}","可能有其他的bug","我也不知道","= =","啊","清空记忆之后的日常","再把creep全自杀了吧","应该第二天就恢复了","我好像单矿房有bug","这是双矿房= =","是的呀","不用这么多的","你在wn？","尽量生大虫","南方蟑螂那种","西北","你的房间方位","【附近群友又多了","只有我在es吗","za也在吧？","es（ecmascript","我感觉一个小时才1% 难道还要3天才能升6级","是的呢","太过分了吧","多开外矿","有道理...","我要去写代码了 告辞","不开外矿肯定慢的","你群有人用过python操作鼠标键盘吗","py不好操作鼠标","键盘有win32api的库","好嘞谢谢yuan佬","可是这和chrome小恐龙有什么关系呢","你挂个进程 按空格?","建议电脑直接设密码","就没人玩了","希沃电脑，触屏的那种","不好输入密码","已知：扣满10分卷铺盖回家","被发现一次玩小恐龙扣0.5","挂个进程按空格肯定不行，老师就没法放ppt了（","太草跑","太草了","你群总有些诡异的问题","玩，可以，我给你搞一个全程下蹲的恐龙，玩吧","(然后同学们想办法破解，玩得更欢了)","草（一种植物）","换个浏览器?","小恐龙的话","我是专门换到chrome的，我们电脑有些奇奇怪怪的问题","edge有的时候页面显示错位，晚上看新闻的时候有点奇怪","就无敌了","¿","啊这","¿¿¿","直接给他们的chrome装个扩展","你的意思让我搞一段JavaScript植入？（","草","setSpeed(10000)","秒死","？不愧是你","其实很让我头疼的点是啥","他们今天早上四点半起来了","然后顺带把我吵起来了","我：你们干啥","他们：翻窗出去学习","跑完早操以后我过去一看，黑板擦都没擦","电脑开着","小恐龙得分记录被刷新了","我：？","学习小恐龙，没毛病","啊","是教室的那种大屏幕触屏电脑啊","锻炼注意力的控制能力","新版","不对","应该是旧版","这个图标的才是新版","旧版","原装的那个","一个e的是旧版","我知道","我用过edge的新版","不好用（","新edge还可以的","我现在就在用","嗯差不多，旁边连着两块黑板还带着一个展台","我现在就在用","i3八代","以前用Firefox和chrome","以前用Firefox和chrome","现在只用新版edge了","4k没错，但是刷新只有30Hz","现在只用新版edge了","偶尔用一下Chrome","旧版edge看pdf 丝滑","新edge没内味了","涩图","新版edge，","涩图","涩图","涩图","遇到这种情况不","啊我该怎么描述这个问题。。","抽到个金地板","终于不是涂鸦了","连发是不是挂了","涩图十连","得劲","/暗中观察","这张二小姐hso","斯哈斯哈","涩图来","挂了？","⑧行了","被玩到处理器爆炸","？","无法分析？","坏了","吗","但是游戏里面 为什么没有啊","么事了","现在cpu太便宜了","话说最近有哪些小朋友建了terminal还没领礼包的","我我我~","涩图三连","专门设置的特别关注你 就为了等你的 Organism","W12N38 爱你哦~","拆完了吗","这个send 在代码里怎么写的  能再控制台用啊.","global.send","这个东西是强化什么用的？","卖cr","哦哦","涩图","涩图十连","涩图十连","草","woc这个倒数第二张","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","只要没有点就可以随便露","涩图！","涩图！","涩图","变卡了很多。。","嗯","涩图十连！","涩图","来了来了","👴🏻的快乐来了","涩图","卧槽","涩图十连","别涩图啦，营养跟不上啦","(建议屏蔽机器人)","加了你们群","看，身体一天比一天好","感觉营养要跟不上了","哎嘿","我去下这个玩了","告辞","不行","官中出了","hhhh","这个我玩了1和3","觉得没意思","剧情莫名其妙","也没有糖","涩图都好高清","没有糖也没有屎","我也不知道他想说啥","动图好看就行了","我觉得要爱上男女主","到我进来时","才冲的动","还很纯","但是每天涩图十连","我武功越来越好","关闭 tips","成功 关闭 tips","开启 tips","让我好好做躺动车吧","尤其是五龙抱桩术","真养眼啊","对啊","不要妄图控制我的机器人","开启 tips","看到这些图莫名兴奋","👍","聊天记录都舍不得删","虽然占了不少空间","下不了手","只能说爱了爱了","我武功更近一步了","五龙抱桩术","要圆满了","再来个十连","大圆满","哪个兄弟阔以让我武功圆满","来个十连","嗯？","十连呢？","来了来了","嗯？","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","分析太多了会卡住","猫？","？","没有车牌","这个是沙画","/捂脸","woc沙画？","沙画都能画的这么梆硬","有点东西","这东西可以了吧","不一定","看你的策略和房间的地形了","有什么补充营养的方法？","每天十连，九连","吃","吃","肾快不好了","/捂脸/捂脸","蛋白质，糖和电解质","哦噢","补充速度跟不上咋办","多吃","那就多吃","难道你甲亢吗","甲亢？","多吃容易胖","/沧桑/沧桑","少吃碳水化合物","由于练了五龙抱柱术","感jio快秃了","牛肉比较好","蛋白质多，脂肪少","鸡胸肉也是","牛肉吗","信仰问题/沧桑","那就豆制品","类似物是什么？","啥","豆奶算吗？/捂脸","emmm","应该说有啥豆制品？","豆腐就行啊","哦噢","阔以阔以","戒主食就好了","别吧","？","主食不能戒","没有主食吃不饱的","算一下每天基础摄入","话说你们吃撑后多久会饿","这个年纪大概1600左右吧","个小小时","每天1600卡","我撑到不行4个小时就会饿","多碳水高蛋白低脂肪","消化能力超强","建议加餐","还不会胖","nt学校不让带吃的","零食面包这些又不管饱","水果行吗","水果不顶事的啊。。","顶事","香蕉或者苹果","每个碳水都很足的","我试过吃方糖，四块野才一小时","你饿只是因为饱腹感不行","但是摄入足够了","饿到发黑那种","血糖不足","那就还是碳水摄入太少……","问题是我油脂蛋白摄入挺多的","也不长肉","可能只是你基础代谢量很大……","别人说的顶饿的我都试过","你觉得你吃的很多实际上算一下可能并没多少","下周试试压缩饼干","你看","也有可能吸收不行","很多时候脂肪并不多","早上我能吃两碗鸡丝凉面","或者肉酱意大利面","这样子","真的能减下来嘛","算一下基础代谢","能不能减得看摄入","emmmm","比我高点","问题不大","1k8比我高了","1800的话……","emmm","我去恰饭了","饿死了","实际上我每天食堂吃饭有时候都达不到这么多","热量最高的水果是牛油果","好像学习消耗的能量挺大的","qs","毕竟动脑子","说实话2碗饭才这么点卡","啊这","食堂菜定量的","来2份（）","那应该是分几两的吧","一两50克","铁餐盘","一碗几两米饭？","自己盛","2两多点应该","那就只能估计了","我能吃67两的样子（","那不少了","现在不行了","才二两 你是小姑娘么","？","初中那会一天五人份的饭","健身一天六顿","然后160到了190","草","不得不说初中的饭是真的好吃（","六顿每顿2两还行","也不一直吃饭啊……","牛奶燕麦，水果，各种东西","好吧","晚上补夜宵倒是也行","就是饿得集中不了精神","主要还是碳水不足……","碳水不足（指一顿吃三四碗","233","那就多吃高热视频呗","焗饭千层面这类","嗯","高卡高碳水","脂肪的话……","emmm","高中也不用咋考虑","反正饿就吃高热量食品","话说","他这里的遗产","我能捡么？","这是退坑了吗","3080","实体的万华镜","草","这是光盘吗？","是的","光盘连封面都这样了吗","那个不是封面","没买过不是很懂","每次群友退坑丢掉的资源都不少了…","草，实体万华镜","有钱","能","赶紧","e站不是早就搞了分布式存储吗","等我4级","就去收垃圾","三级就行了","container先整起来","。","等下","你有creep皮。","不让带吃的？","事啊","美其名曰“吃坏了肚子学校付不起责任”","草我的信息记录怎么回事","（指上周一个班拉肚子","怎么反复跳跃","重启qq","不是，我看着一开始的记录是你吐槽学校不让带吃的","草","智 械 危 机 前 置 事 件","神tm致谢危机","智械*","老哥们，这么写有啥错误啊？","test不是方法","怎么加参数呢","应该.constructor吧","test是一个包含了一个属性的对象= =","new test()吧","我试试","纯云玩说的可能","不对","不对","你应该用class啊","这样吧","这样？","嗯","如果不用class的话 就要把test本身定义成一个函数","运行这两行","还是报错","然后把属性和方法放到test的prototype里","文件名是啥啊","运行环境是啥","如果你不在screeps里而是在nodejs里写的话","运行的话","require(\"./test\")","好了，老哥牛逼","所以运行环境是什么","nodejs啊","好吧","在screeps里require应该怎么写？","草","我没死","在screeps里不加文件后缀名，且不加路径","尸体随便捡","所以就写require('test')","哦哦，怪不得","我一开始没说清","果然菜鸡","15个metal4","我都不知道怎么来电","我都不知道怎么来的","screeps可以加路径吗？","不能","加群真好，还能学js","现在的screeps支持es6吗？","我看这个头像莫名其妙像Scor大佬","支持吧我记得","应该是支持es6","他不是蝎子嘛","ok","？？","没事","只是跟克总说明一下这不是同一个人（","我说他的头像不是蝎子来着","还是github的头像来着","拉格朗日","那是你效率太低了","100","支持es6 服务端node10","所以import export是啥时候的?","大概是从node 12开始的 ?","我有40个左右","【以后不跨shard援建了","【啊吧啊吧","六个","都是大佬","不过拆了外矿之后 少了很多","不对劲","这眼镜造型好奇怪啊（","奖章是啥","大佬们跨房间都是用容器中转运输到基地吗","这个眼罩造型好奇怪","服务器炸了吗？我又连不上了","跨房间用link从房间边缘接回来","开矿开崩了","外矿的话可以用边缘link","一个creep都没了","小场面，真正的崩应该是像我这种全房能量低于100k的","（两天没看了应该有些房间已经停摆了）","creep都造不起了。。。","我的天","好烦","发生了什么！","那也得改代码啊。。。","我看我邻居矿边上放link的 是最终形态吗","xdm有人有编写chrome插件的经验吗","矿边有link差不多是最终形态了","插件*","谷歌浏览器","连不到网就有","chrome 彩蛋，未连接互联网的游戏","chrome插件就是写js啊","这我是服了你了呀","玩screeps的还怕写js吗","很简单啊","你只要卸载chrome","好卡啊","安装edge/qq浏览器","md 网页上不去","这东西治标不治本","只有让他们没有玩下去的欲望这事儿才能解决（？）","有检测到对应进程就杀进程的 .bat","草。","网页版还是看不到creep","md","edge的断网小游戏更离谱","怎么肥四","今晚不能加班了吗","吾辈楷模","求群友推荐一个服务器，谁家的便宜点/暗中观察","之前疫情白嫖的阿里云快到期了","国外的便宜","呃，还是需要国内的","自己买二手服务器便宜","之后打算给社团用的","我好像备案过","只有80端口要备案吧（）","备案的不是域名吗","反正我没备案过","要域名就要备案呀","只有我爬别人的份","云也要备案","没有别人爬我的份","学生党，想嫖点便宜的","学生党1年100块（）","不备案国外挺便宜的 就ping有点高","哪像了","国外没必要","emmmm，因为社团打算用的","还是国内好一点","访问快点","用啥搭建","国外的还能搭的隧道","一举两得","国外的贵","国内搞个学生服务器反向代理到二手洋垃圾服务器（）","一个房间里有两个矿点但是creep只采集一个QAQ怎么写","用油猴之类的注入这段js也许可以？","我也想问 怎么让2个creep采2个点","经典问题","太经典了。。","大佬来吧","我顶得住","hoho不是写了吗","在哪来着","hoho写的 不是我等凡人能看懂的","不是，hoho专门写了个新手QA","把点的id放到memory里不就行了","也不用find了","几乎是新手必问","直接getObjectById","那我id是代码里写死么","【shoucao","id是find出来的啊","房间里find到所有的点","存进一个列表里","收点tough t3","我记得room也有个momory？","还在跟yoner打吗?","这种实现超简单的- -","我觉得还行","可能这就是大佬吧","在写了在写了","这种问题","发挥一下想象力","就能想到怎么实现","(其实在写状态机和单tick的伤害资源缓存)","hoho写的QA还没有出吗","但是我代码要大改了！！！","我怕","改架构真头疼","相当于在正在开的车上换轮胎","卧槽 这办法也挺好啊","新头发！","虽然没太听懂 但是分配source的id就是了","不愧是ra 挠痒痒攻击","打了半天掉了半M","一夫当关！","是的","这是咩啊","刺蛇当关 yp奏凯","野怪","野怪警告","野怪把我家给 全清了啊","大boost野怪","运气有够差的hhhh","什么傻子游戏啊！","说好的新手区呢","你这","是自己的问题了","没事等着你creep全死了他就死了","不会为难你的","suicide()","世界清静","安全模式能防野怪，没必要","太浪费了","最好欺负的萌新就是你这种求生欲一点都不强的","前期碰到野怪坦克+奶双人组好像也只能开sf或者集体自杀了","而且很快啊 几分钟","建议自己查api","建议阅读api","我还想我这跑了1天没什么问题啊 怎么一会会就崩了","好歹把自己墙堵好哈","工人超模一点就行了","不用那么精细","你的creep在两个矿来回跑?","或者你提前出生算路程长度+生的时间","我最早一个版本就是提前生的","而且省cpu","那可能是我没理解你的意思","超模说不定能错开creep的动作 cpu会舒服很多","【也可能对上轴导致有峰值","几tick动一下","就平均了，但是实际上bucket就是这个作用","没必要","反正这点近","晚点再写吧","右上角设置呀","我这墙。。。80m算多不多啊","还行","挺多了","还行","还行","要打长期战役的话80M~100M是必须的","所以为什么我会有80m呢。。。","【遗迹","原来的","你用的是大佬的遗产吧","是大佬刷的遗产咯","来了 萌新必问","请仔细理解教程中的sourse数组","memory里设个量，到一个矿点一次就改变状态去另一个","（应该没记错","或者每个矿点设一个角色","一般一个creep比多个更好","一般不考虑","效率足够代码好写还省CPU","一颗点一个creep就够了","开新房我也不堆人数","work拉满加几个move足矣","？你说container到storage的搬运工吗","效率太低了","sourse到container呀","source到哪里的container","脚下的。。。","那你要啥carry啊","可以不用吗。。","WORK和MOVE1:1就可以了","还可以省点能量出来","但是要注意，因为没有carry，","等着container满了以后能量会调出来","掉出来*","所以要及时清空container","前期不是有多少能量就用多少能量吗，全部升级去","攒起来干啥 = =","这样的吗！好像也还行","但是我不想改了","稍微省一点能量吧","双矿那个。。。我也不想改了","那老哥你要秃啊","我觉得前期这样解决就行了","后面好好规划一下","我觉得可以。。","但是没写过","这样直接继承刚死了的memory了","新头发！","这个东西一般只有跨shard需要用一下传递memory吧","role，还有一些配置之类的","在出生时分配不好吗","涩图三连！","一样是新手 你们怎么这么努力","也是一种思路。。不过一般是先有的配置再决定生creep","如果你的creep死的时候，没有继承者","你的传火大计就破灭了","我执行完这句，下一句就是 delete creep了","大地图全黑- -啥都看不到","啊分析速度慢了好多好多","然后clone一份磨人的memory进去，加上role","默认*","涩图一百连","👀","图片暂停访问还行","这","涩图二十连","涩图十连","是我姿势不对么","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","这样就不用怕传火失败了","死了就传火","那造creep的数量是怎么确定的？","structure根据需要发布","每回合自检和每个loop遍历捡一遍性能差别大吗?","这个确实啊","修理有点贵，不如重新生","建筑","我是指","等有塔了之后，用塔修就行了","我现在只有3级","最近大家都要打架吗，原材料的价格涨的离谱","只知道这仨","wall会自己掉血？","那我80m的墙岂不是要没了","wall不会掉血","不会自己掉血","我吐了","只有road会掉吧？","哦，wall不会","我火星了","通货膨胀太厉害了","container也会把","这游戏太好玩了，我能玩一个假期","哈哈哈哈或","我也是","我天天上班都盯着看。。。","也不知道在看啥","看蚂蚁搬家啊","好家伙，带薪摸鱼","这就是男人的乐趣","两个单位矿","就是前期挖不完","上两个无脚的一直挖就好啦","墙上修路我懂","差不多的效率？","因为game.creeps也是直接访问😂","哦哦","原来如此","就是说用find来找的东西，一般都是值得缓存起来的？","一般来说不怎么变化的，但是会频繁find的，都值得存下来","你只能缓存ID，不能直接缓存Object","如果用Memory的话","你也可以存在global里，这里头可以存id，但是可能会丢","也可以直接存object","这是客户端自动访问后呈现出来的吗？","启动 tips","谁at我啊","哎我擦","我机器人挂了","lsp排行","搞点tough t3","开启 tips","成功 开启 tips","带哥","我居然忘了指令","涩图","房号，给你安排啊","房号，给你安排上","W28S22","OK","谢谢大哥","10k够不够","够用了","lsp","排行榜","lsp排行","涩图十连","啊这","/关键字","涩图草刺蛇/偷看","发了","(刺蛇creep图房间东西)","不对啊涩图中间咋有空格","防止机器人呼唤","😂","搜嘎","【我一直低价抛bar","也防止召唤我看涩 图","各位国庆快乐","写代码没bug","写代码没bug","奇怪了","哦没事了","写bug没代码","还是不对，草","为啥明明match写的是通配符但是检测不到","老哥们，暴露一个类的所有方法应该怎么写啊？","module.exports = test 就好了嘛","感觉这两天新人超级多","哇","我被人欺负了","他打不过你boost的，刚他","问题代码逻辑 还没写好呢0 0 只能手操啊","lspl","这应该是某个人的小号吧0 0","他这个  乱七八糟的 小道具 挺多的啊","打不过 打不过","门口这样放 攻不进去啊","说实话 我也是懵逼的","就教学的代码上改改呗 我就这么玩了好几天","新手第一周目可以从教程的代码开始改","不打进去，站外面守着","在教程代码基础上改就行了","原来自动修墙一百多行代码就能搞定","出来看来自深渊","涩图五连","出来看来自深渊","真好看","超级治愈的","来了来了","我私信他 让他别打我0 0 我是不是很怂","我想看tv版","还好吧，不是战狂都会这样","草这个地形太好防守了","主要我连 基础代码都还没写好呢","没精力写防御代码啊","这房间现在都没正常挖矿的","我说他的房间","对啊","那暂时放弃这个房?","而且一看这 肯定是小号","你不可能打下来的","才3个房间","代码质量 我肯定搞不过","小号倒不至于","隔段时间派改creep去续下命就行了","除了我们其他人好像不喜欢开小号的","他也拿你没办法","我私信发他了  看他怎么弄哇","嗯","bb！","你康康我和大刺蛇聊天","bb!","就这?","大刺蛇：可恶","他要就给他好了= =","跟他耗着做什么","不给 太他妈欺负新手了0 0","我都私信求饶了","新手被欺负不是很正常嘛","他要是还干我  我打不过他 能恶心他也好","你也不要想打他","你照常过","能过且过","你家里又没防御随便就扬了","可恶","就这","我宁愿respawn 也不认输。。","你学学人家","太菜了！就这！","出来看来自深渊","来自深渊","他除非把我的房全搞没了 否则","那啥玩意儿啊","你被谁打了呀","让czc救救你不就完了","么事 先看看情况","能和平发展是最好的","放心，搞没了我也可以帮你把spawn造起来","老治愈了","好的~","没有","没有","给我买一个","13级的小号？","我也就14级","3个房间要挂挺多年才能13级","他只是没怎么发展","历史排名断断续续的","把他给干掉不就好了","我没有能力干掉0 0","让czc帮你","这个房间不好干的","展开不了","好干的","太远了填塔来不了","自闭房","好干好干","我不行。。。。","让czc给你点几个nuker不就完了","球球他","哈哈哈哈","这种房间塔旁边居然不放link","估计也没打过架吧","怎么会态度好","你看上去明显好欺负-。-","czc!","毕竟我现在只有被欺负的份 还是老老实实原谅他吧","补上了readme","快出手呀！","可以安心抄hoho的代码了","今天修了market代码，腾出了7CPU","啊哈哈哈","是我的惹不起！","就这","没写给正","你还不会改！","明天开始补test","好意思吗","那我现在写","过几天你就知道了","带刺蛇 我还活着嘛","到时候","哇","你在哪啊","活着","我就","今天刚看着你","活着呢","一窝曲奇bot","找找你要分新手礼包","哦耶","曲奇bot！","曲奇bot！","摄图bot","代码在哪呀 我想康康","很菜的","还几乎什么都没写","太好了","哈哈哈哈","一窝曲奇bot","这群没人看来自深渊吗","神作啊","没有大会员","怎么一直推荐","那我和我女盆友去看了","大会员多少钱","让女盆友买个大会员吧","理清思路很好抄的","这个游戏写完所有功能大概要2w行代码吧","TS 的提示会告诉你哪里没抄到","你看看hoho连eslint都去了啊","hoho 的 eslint 太宽容了","98一年","已经是最便宜了","每年就两次98","过年的时候更便宜","我用的比较严格的","不过这次有等级的可以送几个月","以前是白送","然而直到最近他的过道代码好像还是有bug","快醒醒 只有你没女朋友啦","你想打 感觉借个nuke就够让他手忙脚乱了","哦哦0 0","曹乐","他派兵过来吃我的资源了","哔了狗了","他之前也这样","搬挂机玩家的东西","问题他他妈现在明摆着欺负我啊 我都私聊他了","私聊都不回的吗…","回复了","说他就是要欺负你","你也是食尸鬼！","那个房间控制器降到0我才占的0 0","问题我是活人啊","然后发现他是个kr或者弯弯","听说你来自cn就要追着你打","他说的啥玩意儿","我咋抓不到重点","挺近的","害不想说就打","他意思让我回到我自己的扇区 别去他那片0 0","哦哦 第二句这个意思啊","【不打czc只打你 明显只会欺负人","上次有人非要扬我小号 怎么说都不听","我就只能把他扬了","你周围的确房间挺少了已经…","【小猫咪","（我也没去弄个区啊","go","defense！","啊忘了 你抢在czc前面了","需要帮你defense一下吗","你太强了","需要！","不需要出手啊","我快气死了","结果最后你还不是自己搞定了=。=","他他妈吃我storage的资源","草","ntr","这点资源- -","小意思辣","没多少的","我爱好和平","你看我家","当面ntr","又中了一个nuker","修一修 energy就没了","太过分了","派大creep把能量用掉吧","我写不了代码啊0 0","也是哈，那就睡觉，不管了","不是啥事","我用的typescript  编译以后的 没法处理","反正这个房他占不了","安心吧","为啥不开个sf呢","。。。。。。","太惨了","我忘记了，，，","我曹了","啊哈哈哈哈惨 ts 惨","刚才他打我的时候我就应该开","过15分钟我应该到他家了- -","哔了狗了","1500秒是多久啊- -","20多分钟！","那还要挺久的","这样有什么问题吗","看看","给点意见呗","聊天记录都1mb了","我去","再看娜娜奇","头发还好吗","8个小时了，还没出广州/我酸了","这就是高速嘛，，，，","e","我振幅了","真服了","这他妈就是个智障","你被打了？","谢了好长","我居然基本看懂了","我让欺负惨了- -","那确实是这个道理","卧槽，这么长","但是啊","搁着写信呢","这和俄罗斯人有啥关系","我喜欢打架 因为我是俄罗斯人？","揍他","没实力。。。。","你是搏斗的人，他是熊","他就举例子说，他老狠了，求饶没用","在游戏里写作文的人现实里一定很没有存在感吧","别骂了别骂了","只能说，这毛子好狠","抱大腿","边上有群友么 透透他就好了","一点机会都不给","你虽然是熊，但我有狐朋狗友（乐","桃太郎大战斯拉夫棕熊","你有刺蛇","刺蛇不比熊熊牛批吗","大刺蛇 离得有点远是不是0 0 ？","有星门","看看大刺蛇乐不乐意过去了","星门十字军","艹","大刺蛇：有这种好事？","你是哪个位置啊","进来了一个腾讯dalao？","W49S9","是大佬","群地位--","是新大佬","没有","有","5mb","有吗","惊了","纯文本5m","？","谁能写5m","那就是没限制","不是","这游戏不需要ai","我是初中生","让creep跑起来就行了！（bushi","群友很多是学生","我也是(","我也是（","这个跟ai没关系","就像即时战略的bot一样发展和进攻","发视频的要好玩一点","自动进攻的话","大部分都是这样","你也可以自动进攻","没有效果","有自动进攻的","不过惹到大佬就没了吧","之前那几个比赛","就是全自动","一觉醒来，creep全死了","总能量小于300才会回","之前我的spawn就在我睡觉的时候没的","然后我现在spawn里只有14点能量","一觉醒来只剩一个一直降级的房间控制器","现在只能等死吗？","extension还有能量吧","有","有人纯用py玩","extension的能量可以直接用来造creep叭","但是没法造creep了","啊这","200能量肯定有啊","就是可执行文件吧","不知道，没研究过","应该是dll吧","doc上面有介绍","github上面应该也有范例代码吧","好吧，可以做，只是我的设定的harvest耗能太高了","先玩私服就行了","ok","早起来个涩图","上面我给你截图了一下","二进制模块是什么","cpu就那么多，你还来个多任务处理机，怎么跑的动","可以氪金解锁cpu嘛","问题不大","/偷看","一觉醒来creeps又被打完了","学 操作系统的吗？","我特么","通常不会的  好战分子是少数","最多也就是部分智障  仗着游戏之前的资源 欺负欺负新手玩家","shard3","快来写uos","我写了一点点的玩意儿","就是想用操作系统的想法","大家中秋和国庆都在一起了，你们的对象呢？","在new了在new了","（新建文件夹","所以要记笔记鸭","多写","写多了就记住了","忘了的时候快速过一遍笔记就好了鸭","野怪是从自己房间生成的 还是别的房间生成的走过来的?","生成的","啊我以为都用cef写","我看qq音乐好像是cef写的","直接出在我家的么。。。","建议qt","tower或者墙","或者自己creep全部自杀","Tower可以打全屏么","可以","可以打全屏 但是越远伤害越低 最少是150吧","上回二级被隔壁玩家一个小兵清了围墙。。。防御塔都没来得及造","安全模式不是有数量的？","造两个分别采集啊","？","为什么要把飞机杯放锅里啊","最近游戏老是有小更新?","@萌新  你代码怎么写的","为什么要把飞机杯放锅里啊","为什么要把飞机杯放锅里啊","消毒","加热吧","啊这","诶，我creep皮肤居然卖出去了","lsp排行","我家被大刺蛇捣了后再也起不来了","哦耶","心态崩了呀","不就是破了几个墙吗","不是","我家右边","一个怪","我代码优先级先打怪","所以","所以啥啊","根本没人挖矿","死循环了","。。","打怪挖矿不能同时进行？","代码没改","太怪了","这可能就是他代码的独特之处😂","单任务房间","我还没搞任务系统","就一个状态机","玩帝国时代别人来打你了不都是农民工也拿锄头上去干/emm","没有啊","我生成几个民兵","结果点太多了","没钱买农民了","啊我就直接所有人上去干。。","还一直买民兵","所以我就没钱打猎了","也就是说","你房间能量储备还不够，就不挖矿了全出去打怪了","是的","开安全模式呀","没想到吧","他是打外面的怪（","老哥 有啥好办法吗","右边的房间的怪","只要还有一个spawn在","就崩不了啊","这玩意不是有次数的么","是哇","是啊","睡一觉就又起来了","但是creep没了","要改代码啊。。","出bug了吧","教程里都有自动生creep的代码","自动根据当前的生育能力计算尺寸","剩余能量（","简单的数学问题","你看我 是会写的鸭子吗","【防宕机策略","这个群的联盟是uop吗","加入有什么条件呢","没有啥条件","你可以写一个最简单的","*carry","可能这就是大佬吧","草","这不是初中数学？？？","按等级写死的话","creep = 0的时候 建个211？","被打掉几个ext不就绝育了","【211还行","我刚才说的那个计算方法也就是个demo","可以在这个基础上慢慢改","然后再加入其他情况","能先帮我想个办法对付野怪吗","【圈养自己","【消极对待","省时省力","等野怪老死","我tower本来逻辑是先修。。。","要是来一堆奶妈 逻辑写不好的话也打不死","先打 能打死么","【还不如不管了","不管就。。。团灭了呀","只剩 211了","等野怪寿命到了","你再发展","这期间你可以改改代码","准备好对付下一波野怪","我可是要完全重构了","好","帮我看看设计呗","是不是重构完就能把大刺蛇踩在脚下了","大刺蛇：可恶","帮我看看呗","我这个设计有什么问题","不是 野怪来的时候我在睡觉。。","不够硬","？","功能太少","对的","因我我就想到了这些","我打算设计个可扩展的框架","大刺蛇变成大刺猫","就是想写什么功能就写什么功能的","我还在用教程代码","可扩展的话","刚组装的creep","操作系统模型比较好扩展吧","像qos，uos什么的","贴合当下需求和精力","hardcode升八再说","hardcode升八再说","hardcode升八再说","hardcode升八再说","反正写了也是白写 都得从头再来","看目标是什么了","【还在坐等轮子哥的设计案更新","如果目标是写出一套很厉害的代码","就没必要hardcore到升八","嗯","目标就是，可扩展性高，可以快速实现想要的功能","其实这个问题","快速实现：hard","你还是得从要实现什么功能来考虑","主要是新需求很少啊","容易快速调整的","主要是我对游戏不熟，全部都是新功能啊","你得先知道要实现哪些功能，你才能把它们的共性抽象出来","才能写出框架","这样有问题吗","写到代码上就没什么上中下之分了","没问题","我想自上而下的实现这些功能","不，我要分开的，以任务的形式解析","加油","将一个任务分配下去，给几个房间分解，然后落实到creep上","这样，有问题吗","建议保证测试跟得上编码","你先写吧","我就慢慢写慢慢发展，熟悉一边游戏呗","是这样的","【主要是之前进群就着急要写大型设计的几个人现在都没声音了","大型设计的","我们只能给你加油","边玩边熟悉边改也挺好","哈哈哈哈哈哈哈哈哈","听到了吗 你快没声音了","放假看番去了","这游戏可是有手就能玩的","不行的呀 你要证明你自己的呀","【不能这么说 到时候写出来个新一代战狂","我为什么要证明自己","tigga小猫咪","tigga小猫咪","统治s3 辐射s2 反攻s1","大齿蛇小蛇皮","暴揍yp","s0呢","你们怎么控制外矿数量的","历史遗老 目前s0的故事没怎么听过","我们是手动开外矿","czc shoucao滴神","算了，当我没问","你搞这个咱也没经验","所以说只能给你加油","大刺蛇把我家拆了我还在外矿","哈哈哈哈哈哈哈哈哈","真是大刺蛇日了","我发现","大刺蛇好像从来没有讨论过设计什么的","没人知道他的代码结构","最高机密","最高机密","可怕","吃人","可恶，原来大刺蛇隐藏这么深！","可恶","大齿蛇的代码我已经摸透了","任务模式","他这几天打我时候丢出来的代码我就知道","大刺蛇","嘘...","是个代码老司机了","不仅是代码老司机","大刺蛇还是RTS职业选手","？","真的吗","就真职业选手？","真的","是啊","前职业","哪个游戏的","虎牙搜大刺蛇","好象是sc2","果然群里只有我是fw吗","好像搜大刺蛇搜不到/沧桑","christinayo","Christinayo","草","大刺蛇是妹子（确信）","大刺蛇是妹子（确信）","不过看他直播确实有妹子说话","大刺蛇几岁了啊","突然好奇","二十多","/emm","我也二十多啊","具体多多少","盲猜26+-2","天啊","这么老了","还跟小孩子一样","16年打职业","所以你们再说谁","大刺蛇啊","出来挨透！","莫非是老乡","胡建人？","不是 你们是瞎比吹的","还是说真的啊","真的啊","估计是真的","他战队历史都能搜到","胡建人什么味","反正没啥名气就是了","胡建人胡椒味","https://b23.tv/Ph6QqP","出来听胡建人讲话","还有，这个胡建人讲话不快","草","之前有个福建的朋友来找我","我山东人","听她讲普通话都有一半听不懂","东营人，南方东西基本听不懂","本湖南人也听不懂","东北话没什么存在感，谁都能听懂","今年SDSC夏令营在日照一个什么外国语大学","那边有个日照工作人员说话","说的直接听不明白","山东外国语职业技术大学？","因为我们这边还挺特殊，上个世纪末才有的我们市","一直也都是东北来这","草？","我就是这个学校的","草","草","暑假有幸去你们学校","下一天雨校园积水7天","日照话和山东其他地方都很不一样","你们餐厅饭平常也那样吗","还是你们平常不去餐厅","啥样","算了，从现在开始","难恰","退群","闭关修代码","告辞各位","指时光餐厅，那边好像还有个，但是暑假没开","祝我写个能打的AI","水群云游戏不好吗","时光餐厅其实就一大堆摊子","时光餐厅暑假的时候摊子基本没开","你能想象一下吗","草","平时摊位都是全开的","虽然我不去（","那还好","两年都连着去那边","宿舍的厕所条件8太吼蛙","全是蹲坑","地砖之间还有奇怪的粘合剂","不是蹲坑不蹲坑的问题","关键是我们那边","楼上会往下滴水","草","没见过","可怕","今年建了新宿舍楼","我一般上厕所都去实验实训楼","那边厕所环境很好，很干净","就是厕所头顶那个水管，下面有黄色的液体往下滴的那种","有电梯 还有指纹锁什么的","草","啊嘞？","实验实训楼那边电脑草","今年买了新电脑","不想吐槽了，打模拟赛打到一半","对面和我闹着玩，踢一下我机箱","蓝屏了","以前的配置挺烂的","代码没保存","故障率也高得离谱","上个学期去上课 教室里接近一半电脑是坏的","这学期换了一体机","我们每天晚上都要重新给你们机房接线","妙手回春修好了一大堆电脑","tql","啊这","涩图十连！","曹乐 又来打我了","我开safemode了","救我啊0 0","大佬~","大佬们 谁能救救我","悲","接受社会的毒打吧","。。","我在外面","他打不死你，放心吧","而且他不会boost，等你主房8级暴打他","好吧","我先修修墙？","可以先把塔修起来吧","升级就完事了","用一两天时间刷墙就暂时够用了","不刷墙","对面几级啊","8级","修墙修塔","他没有boost奶不上来的","哦哦","现在steam账号算财产了","擅自买可以起诉的","大刺蛇！","在手刃yp的路上- -","前期刷墙有必要吗","我看我这边没什么好战分子一直没刷墙","没有","没啥必要","我都裸奔的","说","s2被人打了才刷墙","深挖洞，广积粮","现在50m了","如果很想修就修100k吧","被人打了sf直接boost刷= =","一下就起来了","我用20m的遗产加自己的10m刷的","把墙刷上100M","核弹来了都顶得住","感觉真有人认真打我刷了墙也顶不住","随便骚扰一下不刷墙也罢","核弹无所谓","落地重制safemode cd","直接原地sf 开始刷墙- -","不不","他就无奈了","要是没墙别人一个一体机就拆家了","有墙麻烦一点，也许就不打你了","懒得写可以学我","打我拿得到的东西还没拆墙的消耗大","一罐子能量 100m以上的墙","尽管拆 拆完了什么也赚不到","。。。","- -","我就几m","但是你来打我","我就会原地自动刷几个boost修墙","大刺蛇在线的话可否帮我看看w12n37的storage","ck!","foraphe !","为什么不用神奇的ck呢.jpg","资源转移好慢","这么随意吗","只要能挡得住就是好墙","单口堵口，多口靠墙","感觉摊饼不太行","czc大佬还有Gbar不 挂了个6的没人deal了","那就挂7吧","gbar少了不deal6","也可以选择沿着建筑外沿铺一圈，中间不铺","没有boost","不然咋说单口","【taki sector","堵门的好处是四人小队进不来","还有三个以上奶妈的进攻小队发挥不出最好效果","哎","我的tower都修道基地里面去了","草","问题不大","而且我也没有单口房","【fora的自闭单口房","对付能抗塔的人，主要是靠creep防守","我房间的一个出口连着一个单口房","后花园？","揍人咯","气死这个yp仔","？？","来个涩图","说啥啊","？？","要说啥- -","那个sign？","他不让我开新房","我也打爆他新房","气死他","嘿嘿嘿","七死七死！","37tick破墙","卧槽 也怪怎么天天来","一天会来好多次","老打野了","一般是按照你采的能量数多少为频率刷的","他那个尸体值钱么 要不要捡一下？","不值钱","不值钱","很多废品","不过新手cpu多可以捡来合战斗化合物","我看有很多HO GO什么的 不值钱那就不捡了","120k t3","爽的一批","全都给你撒了！","哈哈没啦","气死他","哈哈","来了","新人必问","memory设state，如果装满就改成1，用光改成0","0就去哇","1就去升级","刚才打你的那个人吗","我晚点就去制裁他=。=","话说你没个炮台吗","tower","他进攻什么配置","好像这人进攻奶妈都不带","带奶 一红球俩绿","不过大概率是shoucao的","这个人随便欺负好吧","是啊","我的 这俩个 房间 只有1个炮台啊","1m的墙","才5级房","不刷墙吗...","是啊 我真不动了 离我这么远","应该也没必要","还打我","可以respawn了","看看群友威慑有没有用","主要不是干死这个来个更厉害的报复","直接就干他了","一个炮台","600伤","这个人是手操的","需要50个heal不停奶","才能奶住","他有没有boost","你手动操作炮台打他就玩了","我觉得应该是看到你完全没墙啥的才敢这么玩","ok","这么久了我没见过他打人","赶快堵一下墙","关键我私聊他了","他个sb回复我了还","不然你家就无了","【私聊能有啥用 他还该打打","为啥你们总是会被打啊。。","真是个民族优越感强烈的傻逼","大概就是你求生欲太差了","看不懂","虽然说得很扯 但是也没问题","翻译一哈","家都不堵好","所以他来干你了","怎么这么长","之前lib打萌新也有点这个感觉","懒得看","说啥了都","没啥好聊的","如果你打不过聊了也没用","聊天写作文 我服的呀","打就完事了","有没有翻译版的看看","不过倒是很好奇要是大刺蛇来了他会是什么反应","你家storage里还有核弹","他不会boost？","不boost","家里没有t3","那怕个鸟😂","又是个玩了很久还很菜还很自大的菜鸡😂","应该是","这人用户名叫什么..","lib也是这个想法","2333","中二啊","doctorcat啥的","lib自称清理不更新代码挂机党- -","lib好歹会手操打人还有主动防御","我看看我shoucao能不能打得动他","lei了lei了","fora上回用一体机是几个月以前的事了?","还是在今年年初吧","话说我刚开始选在大刺蛇旁边都没人打过我😂","除了被npc打死还有自己把自己玩死（","我的那些room","来个房间","都是抢来的=。=","然后一直挂机挂了几个月到8级","😂","233","/暗中观察我觉得他写得还挺友好的","就是看起来有点中二/扯一扯","【好像说的很对 但是其实就是说欺负人合理","问问他多大","他ID是什么","欺负人这事在坐的谁没干过","DoctorCat92","【圈养自己 不打人","the great chinese firewall","好","他家3个房里走廊挺近的","都能直接一锅端了","W10N50","1M墙","有boost打无boost就是欺负人","科技就是力量","不用","我能打就摸一下打不动也就那样","养老玩家（","哦哦  好的","你6级就学学boost","就不会怕别人了","打人没啥毛病- -","在座的群友 谁还没淘汰过几个萌新","当你有了这个","我都私聊他求饶了。。。。","他就给我回复个这","外交没卵用的","要是我估计都懒得理","他要是说 我打算占用这个房间 让我离开也算呢","跟他打呗","你一个tower就够打他了- -","一下600","你们俩 谁强啊？","他没boost打不过你的","我在去他家的路上了- -","其实昨晚本来要去他家的","走到一半yp的来打我了 我就去yp那人家了","谢谢大佬","现场写lab.jpg","要拆墙纯shoucao还是太难受了","谢谢大佬们了","涩图","这个画风喜欢","到咯","这个把？","挂件也到了","准备看戏","嘿嘿，我也准备打他，然后在过道发现了大刺蛇","看戏","我瓜子汽水准备好了~","show time","刚好我在转移资源不太想打","可恶","czc在骗人！","嘿嘿","给你发点hxd的武器","不知道顶不顶得住","下次爆仓就要很久以后了，我五级storage点好了","278t干爆他家墙","czc你gpl多少了","96?","今天刚修好抛瓦的bug","这段时间没怎么吃","半自动(确信","带刺蛇入场！","懒得搞","mist0无限供应","那我得再开个房","就决定是w13n49了","不招打工仔了吗","看来我不用去凑热闹了","我花12m从邻居那买了一个房","和平","找我聊天了吧","艹了","这个sb","哈哈","他不是自己说自己是俄罗斯巨熊吗","咋的  打他 还 有啥说的","啊这","秒怂还行","没实力是这样的","找人聊天你就输了","帮我回他 用它的原话","= =","。。","算了  算了","不合适","没必要","打服就完事","恩么呢","sf了","我觉得主要是他不知道你的creep咋过来的","换个房间打=。=","草，sf了打不死你的兵","他完蛋","学习yoner","第一次一遍过没红色警告符号","星门命令是啥来着","老欺软怕硬了","换个地方继续了- -","他急了","很正常的- -","s3被我打过的都跟我聊过","hiahiahia","打别人没做好自己被打的觉悟","大刺蛇打W12N51吗","是啊- -","我这个小队破个口","然后让atk自杀","它就会变成 11t6ra 23h","扫地机器人 - -","稍等","奶就会转职成defender扫地","扫地机器人~","草","好呀","跳板而已，准备去w13n49","不抢这边过道了","4work是什么神秘矿机","太舒服了","草","一条命刷10m","这就是舒服~","超级工蜂","减能量？？？","带carry做甚","好了","防御塔无视你了","好","你游戏名叫什么了","你对门","跟我名字一样","有没有群友能换一点战斗t3","我XLHO2用不掉了","换，都可以换","等我把claim派出去","23，14有个127k的墙","无所谓啦- -","反正就那么点","唉","真奇怪","还有一个100k的。。","省事了- -","草，上面都是60m","45k","换其他5个各10k吧","房号","W9N38","发你哪个房间","他在说啥","w12n37，","现在是满的，明天发吧","行","谢谢","在威胁你0 0","我已经占领了这里","我已经做好准备一个手段对付你","我好像能量有点不足，先发这些","最后一句 afc 是啥意思了。。。","这真的智障啊","啊法克","afc是个联盟吗？","safari:?","真的狠 还拉人垫背","。。我反正准备打Safari","心疼 不过safari也开始往s2跑了","w9n49也是备选房间","Safari不就是个鸡么- -","路过都能打死的那种","到了他这里就 摇人？","可不是","他原话","哈哈","你没啥实力是这样的","只不过是个借口而已","真的是 多喜欢欺软怕硬","那个s啥的","那就打到服呗","不就是一个采集么","墙都没有- -","问题不大","把他兄弟都给羊了- -","猫猫自拍","是啊","里外不是人（","主要是不太想打人","那个又是谁","我找到一个刚好的房","是个om","我感觉他的意思不是说safari是他的兄弟","咱们sector的一个","他想把仇恨拉到挂机玩家上","不然用overmind吗","正常","正常","czc","给他几个nuker砸一下啊","不是老是让我一个人当带恶人=。=","本地服cli有文档吗","哈哈，这就丢两个","发布任务的","教程代码我用了一个礼拜了","本地服","谁接到任务就去捡- -","我想留着打om呢","help()就有了","不够详细啊","比如说我想让一个房间瞬间lv8怎么办","怎么。。。","角色","哦哦","感觉还是生活不能自理的样子","eventlog扫到事件然后发任务吗","一会就来了","他是不是氪金了，怎么这么多creep皮肤","点他门口","。点里面了","好8","他有spawn可以再起的= =","把他spawn给点了","让他再起不能","还没确认。。取消了","那点门口","一个门口一个terminal","看简书教程 目录里有","无法反驳- -","看来他是不想建塔了","他spawn挺好看的，我想摸一下","他说我要是一直帮的话","他该找我聊天了","会让他变得很懒","不写代码- -","然后变菜","看来没我事了","他在鼓励你写代码呢","呵呵","哈哈哈哈哈","本来还想拆个房间爽爽","哈哈","yuan佬天天后院扫落叶","你回复他  我在帮你  你的防御塔代码写的太差了","给你个机会认识错误","过两天可以来拆w12n47","算了 理他 显得有失身份~","哈哈.jpg","102分钟","我觉得你应该早点写防守代码=。=","自己和他说","建议打起来","战争世界赛高","那我说了昂","就上午那个毛子和熊的男人吗","是啊","就直接死斗","这是战士之间的尊重！","都是虐杀没意思= =","他可能还没发现nuke","我也不打死他","我的脑中又想起了毛球","史诗般的战争","*Dead cell - 被囚者的牢房*","打扫战场（确信","其实都可以起lab了","自己写一下boost","随便干他-。-","7级房打他完全足够了","是这样的，快写代码让他心服口服","是这样的","你可以先手操打他感受一下","所以拉人打人真的没意思","手操打人才好玩","咱们群是不是有个联盟来着？","uop","uop","uop不是霸权","我们只负责杀ayce","现成bot也没啥用","不快不快","（除了我","只要你和我一样肝","没有直接可以打人的把- -","同样是70行","bot都是种田的- -","我以前的代码写了个从storage到extension","他那不是大佬","现在能塞一个自动填lab","他才是新手","因为他也不强啊- -","screeps置顶评论都是两年前了","大佬说bot都是种田的","我们懒得理他","不那么菜了！(不是","我正式玩了有4天了，还没有进攻和防御手段，正常吗？","4天没有很正常","正常","正常的 我也没有","我新手代码可能挂了四个月","正常","我一年了都没有","那我先挂四个月再说","我种了14天的田- -","我不信","才到8","这段时间都是新手代码","然后开始写挖pb 挖deposit","完了才boost打人","om和tooangel","所以还是自己写比较牛逼吗","基本实现了除自动打人的大部分功能了","那om有什么优势吗","那你就能在全球玩家里排上号了","om挂上就不用管了","能完全自动化很难的","但是可能随时会oops","而且自动并不一定比手动强","也不用修bug","我现在是自动和手操结合","自己写肯定要留出人工决策的部分","和手操接口","每次都要配置不如在代码开头写个自动配置","然后内容手动填进去","是大佬","8级的吗","make WN great again!","那其实还有挺多东西的","挺好","有这套就够用了","聊天是没用的","早点写代码吧-。-","打不过人再聊也是浪费时间","还没有发现比我还肝的新手","怎么在不同的 shard 建立殖民地？","睡觉咯","我昨晚写到12点半","走传送门呗","加一下我吧？","今天写到上车前一小时","/screeps fr","请提供出发房间，举例: shard3_E40N40","加你","干啥","今天谢谢你了","小问题","帮助群友也不是第一次了","我给你把cpu发过去吧","今天消耗的能量","不用了","你先写个tower逻辑","基本就没事了","我已经天天在想怎么写了","上班都没心思了","差不多","老哥们，除了steam买CPU，还能在哪里得到CPU啊？","tower伤害很高","不同的 shard 可以直接走过去的么？","market有cpu unlock","一天的订阅","RCL8的六个tower伤害在900-3600","哦哦","满配啥啊","要boost的","boost可以强化creep","7级以前就不要想着打人了","boost翻四倍","一个顶四个","尤其是不止一个塔的房间","6级可以欺负新手","RCL6有boost了其实就行 但是挺难受的","tower大概是t2boost兵的战斗力","是怎么算的啊","7级可以欺负不会boost的","是啊","t3boost乱杀tower","portal","8级有pc就无敌了","op tower再加50%战斗力","靠tower就无敌了","不开power就不用在代码里打pc(确信","草，这都能对狙","满级optower是多少加成","你怕个啥的","建筑根本就不值钱","掉了可以再起","别人可以帮你造","蹲地上了gg","controller没掉就行","controller进度相比建筑重要多了","是啊","可贵了","建筑没了可以别的房派creep过来建","controller掉了就没那么容易升上去了","建筑无所谓的","rcl7前没有真正意义上的防御","rcl8前都很难顶住蓄意的进攻","没拆干净","再按一波拆你家","没拆干净？","没有主动防御甚至会被野怪灭全家","7就可以了","辣鸡，连个代码都写不好","除非自闭刷墙","我的7级房血战四五天了","拆都拆不干净","自动boost刷墙和红球","稳得一批","红球便宜的很","曲奇！","建筑不贵？","还有十几分钟","不贵啊","terminal 100k","修好了别的都是小问题","起xlh2o 省一半energy","爽的一批","没必要","给自己的tower贴一个100k足矣","写写新手faq吧","😂😂","裸奔到7","在搞别的","一般是8级重构一次","然后弄花里胡哨的东西","新手期被打还是可以随便帮一帮的","经典问题来了","可以看看memory的用法","他们是可以记住自己要去哪的","写个加锁机制","🔒一下自己要去的矿","让矿记住来采自己的creep（）","别的creep不让他采","来了","草","这啥","看戏.jpg","小针管","修起来了","我去起个boost","x哈哈哈他修上来了","草","你杀他creep啊","现在大佬玩这游戏都不修路了么？","我shoucao大失败","哈哈他跑不过我","他腿没了","他就是个渣渣","(自己写大概率消耗更大","可以设置缓存回合","过两天写完作业还可以打他另一个房","反应慢点就慢点吧，多缓存一点路","n个tick寻一次","有点快乐","我在想怎么让memory更加高效","比如数据库那样","带index什么的","api看看","有参数的","十一放假来写bot啊","无了","发不发呢","不好吧","然后他会打creep和ext","家都没了还在这15work升级","估计已经放弃抵抗了","太战狼了","没必要/头秃","太战狼了","他还没开始防核","你可以…存位置存id都行啊","为什么要存索引😂","你在Memory里随便写个呗","新手教程不是教了内存用法吗","谢谢了","没事","教程不是说过清理memory吗","MAC都能反复横跳的吗","是要自己管理","是这样啊","不是这样","哦不对","遍历对象不对","应该遍历memory","死掉了的不在game.creep。。。","是的","你只要用过一次creep.memory","就会出现在memory里面","没用过也会有","spawn了就有","(印象中是这样)","这不太好吧","或者另外写点别的","目测要被挂在slack上","太过分了","代烧香","rip","2333","cuicui的私服是不是停了","填起来了","这个是不是后天晚上落地","这个哥们为啥不能填中间那个","不可通过","哦 哦    懂了","(有terminal可以拿新手大礼包了)","200m了","说起来","有什么api可以直接获取room里面指定x，y对象的id","lookforat","应该能","采集能量的creep什么身体数据比较合理","这括号换行真是异端/偷看","没毛病啊，执行eee不就取到活虫子了吗","你不可能都死完了吧","5work站着一直挖就行了","game.creep","没看懂","然后满了扔掉还是边挖边扔","game.creep才是取活的","满了会自动掉地上","溢出自动扔啊","你循环内部还用的memory","脚底下造个container就会自动掉进去","我挖矿的 body 是这样的Emmmm","好的  图我收下了","我去造一个","他是shard2玩法","s3还是高一点carry","有啥区别Emmmmm","高carry少一点放进link的次数，省cpu","没办法啊，没cpu用","（0.2）","transefer很吃cpu吗","transfer也是0.2","upgrade和haevest好像不冲突","那如何让两个creep去不一样的矿","你让creep记录不一样的目标不就行了","好的","不是给你说了吗","取活的用game.creep","。。。","我傻了","为啥要用memory","那你看看你是怎么判断是不是活的creep","你是在做教程吗","你根本没取到creep对象啊","？？","？？？","改变游戏世界的操作有0.2的固定开销","对","怎么表示升级的状态。这样？","理论可行，你把Python解释器打包成二进制模块，然后调用","确实","二进制模块不止wasm","你也可以手动实现一个node-ffi","然后调用so","虽然runtime还没跑起来cpu就超了","为什么总是有新人问其它语言的问题","js不香吗","Rust对Wasm支持不错","C++ debug坑多","你碰了Js的语法糖之后会把Python烤了吃掉","这个游戏js是一等公民","哪个语言没有语法糖啊","我说Js的糖","用其他语言文档有限，需要自己摸索很多","emsdk坑挺多，Linux编译好一会还要自己解决问题","这个游戏先用js熟悉api本身，再用其他语言比较好","还停留在if else就不用评判语言优劣了吧","为什么一定要适应你的IDE吗","命令行不行吗","w29n47在群里吗","提示？","SuribaCN在群里吗","稍等我去杀只creep","居然是群友","rcl2不需要墙","纯能量搞地上的话","会掉","不封闭等于没墙","罐子好像长一些，上次我朋友respawn","1M能量掉地上我捡一晚上没捡完","带新手么","？？？","fatbu！","fatbu~~","斜着建的话","斜着能到达的地方多","同样长度的路周围能摆更多的ext","skyfox","大佬们外面的方便都不防守的吗","房间","是啊","这不tooAngel吗","智障推荐","话说 GUI 显示面板怎么写有例子么？","有啊","群文件里就有","这个么？","cmd/偷看mac大佬","问下内置寻路的复杂度怎么样","不知道有没有做其它优化","我现在是手写a*","A*的函数也不清楚具体是怎么写的","看看地形","疑似bot","草","?","ck！","草","有志青年!","涩图！","ck!","FFFFFFFFFF","ck!","🍪！","是编辑也是作者","runPython","print('来一份涩图'*3)",".","这人哎","算了","别造建筑物了，主房派兵升级","哦哦","好玩吗","硬核","这图要是有原图的话","涩图相册早就被封了","涩图","更新代码是会执行完本tick才换吗","嗯","@小曲奇qwq 分析","这机器人怎么那么（）","那么（）","...大家都好聪明","我一直在等你呐，你终于来啦~","help","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","help","有什么需要帮助的，小曲奇我竭尽所能","--help","需要小曲奇帮忙做什么","-h","哎呀~麻花疼粑粑把你的消息丢掉啦……请重新试试吧~","草（）","纯人工智障（）","你好","我在这里好久了，终于等到你来啦","一直在等你呢，又可以和你聊天啦，想聊点什么呢？","？","小曲奇请求场外支援呀","cn","pixivia要进群吗","这是啥游戏啊","这个是塞尔达传说里面的林克公主","害怕极了","原来是魔神林克公主（）","给你加个🐶头","？","这群里","有机器人了？","72魔神之一的林克公主","/help",".help","帮助","lsp排行","不是那些框架的啊","miari","哦哦",".ck!","咋用","no~","ck！","草","涩图","ck!","Lev_CT | 群退学不时来群里挂科!","？","有5 6个","草","还真有这个功能","你直接看源码吧","对啊","并且","ck!","masterkeze Yoner!!","我不会编程（","涩图 来","所以退坑了（","js简单的","非常好学","js简单","java也简单","awa","c＋＋ 难（）","《简单》","群除我佬系列","虽然c＋＋也会","高考完学吧","但是难就是难（）","项目不好管理","写到最后都不知道哪出错了（（","c＋＋就是这样（）","找个引用都不好找","指针传来传去的","那是啥游戏","java报错只需要debug在报错栈上一个个找（）","总能解决的 时间问题（）","c＋＋直接抓瞎（）","但是优化没有异星工厂好","哦哦","我不喜欢没有分号的语言","因为我以前 Python 写多了","😂😂😂","有分号感觉比较稳，而且现在都能自动补全","js的分号是可选的","可以兼容各种使用习惯","我感觉有没有分号都一样...","根本不会花精力去关注","谁有中文文档网址啊","我怎么打不开了","Python 没有分号有的时候很坑","python还好吧","不会很坑啊","如果有分号我就不用游标卡尺了","话说我应该还来得及接收遗产吧","idea和vscode都有显示缩进层次的插件","还算方便","有分号的话随便打都不用担心，reformat 一下就行了","没有分号就要加上 tab 的心智负担","可能是因为我写Python写得不多","目前还没感觉到强制缩进麻烦","初期写的时候不会有什么文档","问题","后期要加减东西就容易踩坑","Python设计成强制缩进的初衷是什么","我很好奇","vi 的时代。。。","为了让语言没有那么自由（）","为了让每个人都看得懂每个人的代码（）","lsp排行","为了促进游标卡尺的销量","草","我总感觉我这排行榜坏了","涩图","lsp排行","国庆之后再修好了","关闭 rank","成功 关闭 rank","开启rank","开启 rank","啊啊啊 喵喵喵","czc!","这墙有意思","我的creep又崩了","bb！","我是工作20年有30年工作经验的二转程序员","学生学个毛代码","学生学个毛代码","抓紧找对象","有这时间去学深度学习不香吗","学个鬼","我就后悔","当年大好时光","当年大好时光，竟然没去找个女朋友？","就应该找对象啊","我后悔高中才开始学编程","这是什么涩图","不想带carry部件 而且也carry不了多少","好 我查一下","在采矿的creep站的地方造一个container","谢谢","带个carry及时转移给负责搬运的creep也行","有考虑过 但是开发难度太大了哈哈","搞不好还是会浪费","服务器炸了?我突然就不去了","进不去了","涩图十八连","涩图六连","坏了？","涩图","涩图十连","omg","在github上怎么找相关代码","等等","你群有几个色图机器人？","我记得我屏蔽了一个了","怎么还有色图","话说。。。JS/TS 是不是没有具名参数 = =","你可以弄一个Object类型的参数","用它实现实现具名参数","很多js库都是这么做的","这样就类似于具名参数了","把所有参数放到一个object里","js和ts在语言层面是没有具名参数的。","草草草","loop一个tick就执行一遍啊","理论上","可以自己写个babel插件","把while 编译为状态机","被自动转成if elae的自动机","有没有开源的实现","感觉没必要","俺就是大学生","俺也一样","工作了天天996哪有时间在游戏上肝代码","我大六了","有学弟吗（","上班肝代码 打游戏也在肝代码","那可太肝了","不难上手","变难","不难","硬就完事了","写死就完事了","是这样的","写得越硬越省CPU（确信","其实把while换成if就行了","能用浏览器就能带动","带得动chrome","(除非你要用它开私服)","就带得动","其实能发http请求就带得动","因为有API","好了","成功继承遗产","你的creep造型好独特啊","这一地废墟只能等自动消失么？","也可以用核弹炸一下，废墟就消失了","你可以收拾","可以在废墟整理再建","要让他消失只有等或者用核弹","但是这里推荐直接扔个核弹","墙也许不一定","我还是等 20000 tick 吧","墙留下的废墟或许可以修","也就一天？","哈哈，毕竟核弹也要50000tick落地","无","建议机翻","遇到不认识的百度就好了","初中英语就能搞定","语法还是很简单的","哇 这边还有好多遗产= =","你的遗产真不错","是群里大佬的遗产啊","就mist值钱","等有了终端全卖掉","等等。。。","大佬不会是被人打的吧？","但是看记录好像不像是被打了的样子","诶现在access key已经可以用了吗？","这附近是不是都是群友？","他开学了","?","没代码谁知道啊","报错呢","前大括号换行 老c傻普了","哈哈，最近写了会c#，搞不懂为什么vs自动换行成这样","前大括号换行太反人类了","一整行只放一个大括号","太浪费了","太丑了","太恶心了","怎么会有人这么写","（我觉得挺好","我也觉得（","不知道为啥 我们学校有些老师喜欢这么写","我是按照Golang的规范写","谁知道用代码建造road的api","我是能换行就换行的","涩图！","最好一行一个操作符","太长心智负担太重","怎么从link中取能量出来","求解","3级搭塔有什么用啊","暴躁老哥 猛甩文档","不用看 肯定要修的","大家好","抄完自己改","我是抄作业中的萌新","有人带萌新吗","（其实我也是萌新","不要盘我！","对了有github的就可以发名字加组织","什么签名啊","你说呢","我爱你！","ck！","草","我总感觉我这配置有问题= =","✅ | 正在取得数据","\u6211\u7231\u4f60","\u6211\u7231\u4f60","github组织加一个","发了邀请","目力猫！","今天写lab给了我一个思路","建筑抓一个creep干活","干完了放回去睡觉","为什么不配","群很水的","creep那边还是角色制","发了邀请","memory.role","这个里边的能量怎么取出来","5555555555","creep.withdraw","好的","怪了","今天出现这个鬼东西了","不写分号？？？异端","那就都写","？","js最好了，写不写都行","js最好写不写都行","爱写不写","没有走到","我在搞任务模式","搞完代码整来我抄一下呀","重置频率降低了","没跪为什么要再发？","比如if发现没有信息就自动重新算","取出来需要work部件吗","哦哦，恍然大悟，忘记写参数","3q","我已经挂机刷好几个月了","关闭 tips","成功 关闭 tips","最近才能看懂一点文档","中秋快乐","那是昨天的事了呢","谁@我","这两天新人爆发式增长","猜猜能剩下几个活跃的呢","我这两天批了大概三十个加群申请","咋费事呢","空着","你信不信我可以趁你不在","我不信","不打死你一个creep和建筑","把你家搞崩","我不信","就这？","明天你起床就知道了","我虚晃一枪","后天搞你","我从来不睡觉","你是AI","AI是什么？","这才是爱","可恶啊","bb变成妹子了","An Idiot","爷青结","我变成妹子了？","那我做梦都能笑出声","bb快变啊","拉狗子也变","太贵了变不了","来世再变","这就找泥头车转生","不然是女装大佬？","好吧，我就是妹子","星际操作靠单身，screeps操作靠头发","如果第一套星际的 js API","👴青结","真的变了","实现moveTo attack什么的","*写一套","星际的python的api","有现成的","那玩啥screeps","草","助您真正实现同时多线操作甩一队枪兵","哈？","这个包出了好久了","被你发现了呢","跑进别人的后花园还行","😱😱","交涉一下让他给你开个白名单","这人上线了还不捏死你？","不不不，我要听你的真实描述","肚子迷糊 脑瓜疼","用肚子思考的大刺蛇是屑","你女朋友姨妈来了会不会打你","真实描述","我是mtf","没了","还行","（特地查了一下看了意思","私服闪退了怎么办","群友交涉术","跟他说让你发展到可以进行星际殖民再鲨（","所以是女装大佬了","事机动特遣队（雾","建议单房发展","是不是妹子有什么区别吗","不一样的。。","退游","垃圾游戏","私服都开不起来","一样","我是1但我的性格其实更适合我心中的0","大差不差，吃糖","crossdress和trans-gender差别大了去了","无限闪退","有没有人告诉我","这游戏本地模式存储在哪里","我把它给删了","傻逼微软又在干什么","你怎么开的本地？","？","不是说要redis和mongo的么","这个功能是坏的","哦 没有客户端 告辞","？","我用客户端里的服务端一次也没开起来过","还是装个docker吧","我开过","不能关机啊","不太行","感觉。。。要跑很久","Github Actions 的U太弱了","20分钟才跑了7000多tick","可以禁言你的鸭","30天","300只","毕竟嘲讽你直播就是我剩下的乐趣了","我女盆友很闲","可以封你","大刺蛇！","别告诉我其实是你女朋友在玩游戏，你只不过管理聊天的","没错","曲奇！！！","想看曲奇白丝！","想看曲奇白丝！","想看曲奇白丝！","只有黑丝","看黑丝！","看黑丝！","hso","又裂开来","新手教程看失败了吧","原来这么近","那我也能给到Nuke","是阿","来个坐标","呃，你真占我地方我就堵死了","我家直接临着的没啥好地方","没事可以打下来","来个坐标","我还差一个心仪的X房","W29N47","这样写有问题?","当我没说","15间房还有cpu，是怎样的优化啊","没啥优化 8级之后占用自然就下来了","优化：去掉外矿","为什么，原因是什么呢","creep可以偷懒了","8级不用升级","草","hh","decoration画图专用","准备落户这里了","问个问题","我不会","Set是什么类型的","set是set类型","set就是set","基础是封装了object的true false之类的吗","不能重复的数组","还是有什么优化吗","这个Tor___是一个月没上线变这样了吗","不能重复的数组","狂喜","明天中午开3房间","卧槽","我要等代码写完才能开了","不知道能不能行","tql","我gcl十分位还没破1","你来我给你发能量","中央9房，最中间那房没野怪，可以不做防御吗","就几步路","你那点能量不够看的","是啊","呃","帮你加速升个本","哦不对","低级房没终端我忘了","自己起到6也很快的","明天给你表演一下","【还有在s1的群友吗","到6一个礼拜呗","不临街意义不大","有外矿的话更快","3天","3天之内升了你得controller","不打了！","太累了","我也要睡觉了","好像都赢了","是啊","困死了困死了","按一波兵去63家明天早上起来看看怎么样了","堵车","草","哈哈哈","这是谁啊","他私服","我的","嗷","本地服","改move逻辑","堵车","草","大量能量出售","怎么卖","教教我","(涨一点点","2m稳定出售","你要多少啊","我卖你","纳尼，你有2m吗","超过1m没","我不信","每个tick都执行","就可以卖了","(没错)","明早起来你就有很多钱了","是这个吧","W24N17","W12N37","这是说明树上写的","可恶啊","被你发现了","上面还写了","唉","真拿你没办法","W24N17 我地图只会亮亮的","多了几个亮亮的点点","可以截取一段聊天记录让他们分别说完吗","看起来更像聊天","但是要写代码","要改","他技术力不够","不要勉强他","要消耗memory","他已经回答我了","学习","学个屁","你要把这句话没说完的，放内存里面","{page:0,index:0}","大概是这样的","抽到同一句","草","7000多句呢","快去原神抽卡","抱歉","我的creep名字可以抽卡","草","没错","我github education终于过了","再不过我都快毕业了","抽卡！","你的creep中出了一个内鬼","你的creep 中出 了 一个 内鬼","你的内鬼中出 了 一个 creep","你 中出 了 一个 creep","你们要小心啊，你们所说的话","都会","松活弹抖闪电五连鞭","出现在接下来的聊天里面","明天我起一个bot","！","每天晚上1-5点之间","打我的？","会一直 复读松活弹抖闪电五连鞭","那是不是可以让他学习点奇怪的东西","然后你家到时候","那就好","就会一直喊","松活弹抖闪电五连鞭","？？？","！！！","哈哈哈哈哈哈","我就回你：还好我我没闪","草，能看一晚上","真实能看一晚上","感觉就跟有人发弹幕一样","是吧","但是没有关联啊","我也去整一个","句子之间","谢谢大哥","pudongdong在群里吗", ] ;

// Talk=_.filter(Talk,e=>e.length==20);
/**
 * 主循环里面里面调用 一次 TalkAll()
 * @来源 群内聊天记录
 * @作者 6g3y 版本 20201007 截至的聊天记录
 */

let roomMap={};
let creepMap={};

let randomTalk=function (creep,array) {
    if(!roomMap[creep.room.name])
        roomMap[creep.room.name]=Math.floor(array.length*Math.random());
    roomMap[creep.room.name]=(1+roomMap[creep.room.name])%Talk.length;
    let index=roomMap[creep.room.name];
    return {
        i:index,//index
        p:0,//page
        l:array[index].length/10//length
    }
};



Creep.prototype.randomSay=function(float){
    if(creepMap[this.name]){
        creepMap[this.name].p+=1;
        if (creepMap[this.name].p >= creepMap[this.name].l) {
            delete creepMap[this.name];
        }else {
            this.say(Talk[creepMap[this.name].i].substr(creepMap[this.name].p*10),true);
        }
    }else if(float>Math.random()){
        let $talk = randomTalk(this,Talk);
        if($talk.l>1)creepMap[this.name]= $talk;
        this.say(Talk[$talk.i],true);
    }
};



commonjsGlobal.TalkAll=function () {
    _.values(Game.creeps).forEach(e=>e.randomSay(0.15));
    if(Game.time%3253==0){//质数
        _.keys(creepMap).forEach(name=>{
            if (!Game.creeps[name]) {
                delete creepMap[name];
            }
        });
    }
};

const RandomName = {
    createName: function(){
        var firstNames = new Array(
            '赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '楮', '卫', '蒋', '沈', '韩', '杨',
            '朱', '秦', '尤', '许', '何', '吕', '施', '张', '孔', '曹', '严', '华', '金', '魏', '陶', '姜',
            '戚', '谢', '邹', '喻', '柏', '水', '窦', '章', '云', '苏', '潘', '葛', '奚', '范', '彭', '郎',
            '鲁', '韦', '昌', '马', '苗', '凤', '花', '方', '俞', '任', '袁', '柳', '酆', '鲍', '史', '唐',
            '费', '廉', '岑', '薛', '雷', '贺', '倪', '汤', '滕', '殷', '罗', '毕', '郝', '邬', '安', '常',
            '乐', '于', '时', '傅', '皮', '卞', '齐', '康', '伍', '余', '元', '卜', '顾', '孟', '平', '黄',
            '和', '穆', '萧', '尹', '姚', '邵', '湛', '汪', '祁', '毛', '禹', '狄', '米', '贝', '明', '臧',
            '计', '伏', '成', '戴', '谈', '宋', '茅', '庞', '熊', '纪', '舒', '屈', '项', '祝', '董', '梁',
            '杜', '阮', '蓝', '闽', '席', '季', '麻', '强', '贾', '路', '娄', '危', '江', '童', '颜', '郭',
            '梅', '盛', '林', '刁', '锺', '徐', '丘', '骆', '高', '夏', '蔡', '田', '樊', '胡', '凌', '霍',
            '虞', '万', '支', '柯', '昝', '管', '卢', '莫', '经', '房', '裘', '缪', '干', '解', '应', '宗',
            '丁', '宣', '贲', '邓', '郁', '单', '杭', '洪', '包', '诸', '左', '石', '崔', '吉', '钮', '龚',
            '程', '嵇', '邢', '滑', '裴', '陆', '荣', '翁', '荀', '羊', '於', '惠', '甄', '麹', '家', '封',
            '芮', '羿', '储', '靳', '汲', '邴', '糜', '松', '井', '段', '富', '巫', '乌', '焦', '巴', '弓',
            '牧', '隗', '山', '谷', '车', '侯', '宓', '蓬', '全', '郗', '班', '仰', '秋', '仲', '伊', '宫',
            '宁', '仇', '栾', '暴', '甘', '斜', '厉', '戎', '祖', '武', '符', '刘', '景', '詹', '束', '龙',
            '叶', '幸', '司', '韶', '郜', '黎', '蓟', '薄', '印', '宿', '白', '怀', '蒲', '邰', '从', '鄂',
            '索', '咸', '籍', '赖', '卓', '蔺', '屠', '蒙', '池', '乔', '阴', '郁', '胥', '能', '苍', '双',
            '闻', '莘', '党', '翟', '谭', '贡', '劳', '逄', '姬', '申', '扶', '堵', '冉', '宰', '郦', '雍',
            '郤', '璩', '桑', '桂', '濮', '牛', '寿', '通', '边', '扈', '燕', '冀', '郏', '浦', '尚', '农',
            '温', '别', '庄', '晏', '柴', '瞿', '阎', '充', '慕', '连', '茹', '习', '宦', '艾', '鱼', '容',
            '向', '古', '易', '慎', '戈', '廖', '庾', '终', '暨', '居', '衡', '步', '都', '耿', '满', '弘',
            '匡', '国', '文', '寇', '广', '禄', '阙', '东', '欧', '殳', '沃', '利', '蔚', '越', '夔', '隆',
            '师', '巩', '厍', '聂', '晁', '勾', '敖', '融', '冷', '訾', '辛', '阚', '那', '简', '饶', '空',
            '曾', '毋', '沙', '乜', '养', '鞠', '须', '丰', '巢', '关', '蒯', '相', '查', '后', '荆', '红',
            '游', '竺', '权', '逑', '盖', '益', '桓', '公', '仉', '督', '晋', '楚', '阎', '法', '汝', '鄢',
            '涂', '钦', '岳', '帅', '缑', '亢', '况', '后', '有', '琴', '归', '海', '墨', '哈', '谯', '笪',
            '年', '爱', '阳', '佟', '商', '牟', '佘', '佴', '伯', '赏',"万俟", "司马", "上官", "欧阳", "夏侯",
            "诸葛", "闻人", "东方", "赫连", "皇甫", "尉迟", "公羊", "澹台", "公冶", "宗政", "濮阳", "淳于", 
            "单于", "太叔", "申屠", "公孙", "仲孙", "轩辕", "令狐", "锺离", "宇文", "长孙", "慕容", "鲜于", 
            "闾丘", "司徒", "司空", "丌官", "司寇", "子车", "微生", "颛孙", "端木", "巫马", "公西", "漆雕", 
            "乐正", "壤驷", "公良", "拓拔", "夹谷", "宰父", "谷梁", "段干", "百里", "东郭", "南门", "呼延", 
            "羊舌", "梁丘", "左丘", "东门", "西门", "南宫"
        );
         
        var lastNames =  new Array(
            '子璇', '淼', '国栋', '夫子', '瑞堂', '甜', '敏', '尚', '国贤', '贺祥', '晨涛',
            '昊轩', '易轩', '益辰', '益帆', '益冉', '瑾春', '瑾昆', '春齐', '杨', '文昊',
            '东东', '雄霖', '浩晨', '熙涵', '溶溶', '冰枫', '欣欣', '宜豪', '欣慧', '建政',
            '美欣', '淑慧', '文轩', '文杰', '欣源', '忠林', '榕润', '欣汝', '慧嘉', '新建',
            '建林', '亦菲', '林', '冰洁', '佳欣', '涵涵', '禹辰', '淳美', '泽惠', '伟洋',
            '涵越', '润丽', '翔', '淑华', '晶莹', '凌晶', '苒溪', '雨涵', '嘉怡', '佳毅',
            '子辰', '佳琪', '紫轩', '瑞辰', '昕蕊', '萌', '明远', '欣宜', '泽远', '欣怡',
            '佳怡', '佳惠', '晨茜', '晨璐', '运昊', '汝鑫', '淑君', '晶滢', '润莎', '榕汕',
            '佳钰', '佳玉', '晓庆', '一鸣', '语晨', '添池', '添昊', '雨泽', '雅晗', '雅涵',
            '清妍', '诗悦', '嘉乐', '晨涵', '天赫', '玥傲', '佳昊', '天昊', '萌萌', '若萌',
            "秋白", "南风", "醉山", "初彤", "凝海", "紫文", "凌晴", "香卉", "雅琴", "傲安", 
            "傲之", "初蝶", "寻桃", "代芹", "诗霜", "春柏", "绿夏", "碧灵", "诗柳", "夏柳", 
            "采白", "慕梅", "乐安", "冬菱", "紫安", "宛凝", "雨雪", "易真", "安荷", "静竹", 
            "飞雪", "雪兰", "雅霜", "从蓉", "冷雪", "靖巧", "翠丝", "觅翠", "凡白", "乐蓉", 
            "迎波", "丹烟", "梦旋", "书双", "念桃", "夜天", "海桃", "青香", "恨风", "安筠", 
            "觅柔", "初南", "秋蝶", "千易", "安露", "诗蕊", "山雁", "友菱", "香露", "晓兰", 
            "涵瑶", "秋柔", "思菱", "醉柳", "以寒", "迎夏", "向雪", "香莲", "以丹", "依凝", 
            "如柏", "雁菱", "凝竹", "宛白", "初柔", "南蕾", "书萱", "梦槐", "香芹", "南琴", 
            "绿海", "沛儿", "晓瑶", "听春", "易巧", "念云", "晓灵", "静枫", "夏蓉", "如南", 
            "幼丝", "秋白", "冰安", "凝蝶", "紫雪", "念双", "念真", "曼寒", "凡霜", "白卉", 
            "语山", "冷珍", "秋翠", "夏柳", "如之", "忆南", "书易", "翠桃", "寄瑶", "如曼", 
            "问柳", "香梅", "幻桃", "又菡", "春绿", "醉蝶", "亦绿", "诗珊", "听芹", "新之", 
            "博瀚", "博超", "才哲", "才俊", "成和", "成弘", "昊苍", "昊昊", "昊空", "昊乾", 
            "昊然", "昊然", "昊天", "昊焱", "昊英", "浩波", "浩博", "浩初", "浩大", "浩宕", 
            "浩荡", "浩歌", "浩广", "浩涆", "浩瀚", "浩浩", "浩慨", "浩旷", "浩阔", "浩漫", 
            "浩淼", "浩渺", "浩邈", "浩气", "浩然", "浩穰", "浩壤", "浩思", "浩言", "皓轩", 
            "和蔼", "和安", "和昶", "翔东", "昊伟", "楚桥", "智霖", "浩杰", "炎承", "思哲", 
            "璟新", "楚怀", "继智", "昭旺", "俊泽", "子中", "羽睿", "嘉雷", "鸿翔", "明轩", 
            "棋齐", "轶乐", "昭易", "臻翔", "泽鑫", "芮军", "浩奕", "宏明", "忠贤", "锦辉", 
            "元毅", "霈胜", "宇峻", "子博", "语霖", "胜佑", "俊涛", "浩淇", "乐航", "泽楷", 
            "嘉宁", "敬宣", "韦宁", "建新", "宇怀", "皓玄", "冠捷", "俊铭", "一鸣", "堂耀", 
            "轩凝", "舰曦", "跃鑫", "梓杰", "筱宇", "弘涛", "羿天", "广嘉", "陆铭", "志卿", 
            "连彬", "景智", "孟昕", "羿然", "文渊", "羿楦", "晗昱", "晗日", "涵畅", "涵涤",
            "昊穹", "涵亮", "涵忍", "涵容", "俊可", "智鹏", "诚钰", "书墨", "俊易", "浩渺", 
            "宸水", "嘉许", "时贤", "飞腾", "沂晨", "殿斌", "霄鸿", "辰略", "澜鸿", "景博", 
            "咨涵", "修德", "景辉", "语旋", "智逸", "鸿锋", "思梵", "弈煊", "泰河", "逞宇", 
            "嘉颢", "锦沅", "颢焱", "萧彬", "悦升", "香音", "烨柠", "颢咏", "仁贤", "尚然", 
            "羿鳞", "月鸿", "健霖", "鸿昊", "竣杰", "可顺", "炯乐", "俊彦", "海沧", "捷明", 
            "飞扬", "杰辰", "羽捷", "曦晴", "裕鸿", "翌锦", "沐宸", "福同", "旻驰", "龙宁", 
            "文虹", "义凡", "广晨", "宸滔", "嘉岐", "雅珺", "睿明", "皓轩", "程天", "子酝", 
            "艾康", "如羽", "冠玉", "子歉", "永昊", "龙华", "兆颜", "奇文", "月昕", "裕锦", 
            "昂佳", "昊浩", "宇韬", "睿焓", "永译", "鸿彬", "颢霖", "益彬", "虹昊", "飞悦", 
            "睿珏","?宵童", "睿鸿", "容冰", "逸濠", "楷岩", "弘义", "海萦", "昊孺", "梓铭", 
            "生钊", "蓝玺", "晨辕", "宇菡", "砚海", "文揩", "韬瑞", "彦红", "奕韦", "清予", 
            "宁翼", "冬睿", "锦昌", "烨宁", "昌权", "国研", "德运", "孝清", "佳阳", "凯玮", 
            "正真", "民云", "昕冶", "力威", "帅欣", "知淳", "烨飞", "兴远", "子墨", "澄欣", 
            "烨煊", "悦勤", "晨津", "博宏", "育萌", "羽炫", "绍钧", "睿昌", "泓千", "颢炜", 
            "虹金", "筠航", "元甲", "星明", "景涛", "铭虹", "德本", "向辉", "基翔", "家易", 
            "欣鹏", "羽荃", "泽容", "弘亮", "尚廷", "轩梓", "甫津", "彬楷", "寅飞", "愉君", 
            "阳平", "誉杰", "钦昭", "蕴藉", "羽程", "宏海", "涵畅", "光浩", "令沂", "浩浩", 
            "睿锦", "易泽", "俊康", "家文", "晨元", "语洋", "裕宏", "梓榛", "阳嘉", "恒展", 
            "雨远", "哲伊", "逸江", "丰源", "学东", "奇岩", "浩财", "和蔼", "红言", "瑞赫", 
            "森圆", "欣赢", "梓鸿", "博明", "铭育", "颢硕", "宇烯", "宇如", "淳炎", "源承", 
            "斌彬", "飞沉", "鸿璐", "昊弘"
        );
         
         
        var firstLength = firstNames.length;
        var lastLength = lastNames.length;
         
        var i = parseInt(  Math.random() * firstLength );
        var j = parseInt(  Math.random() * lastLength );
        var name = firstNames[i] + lastNames[j];
         
        return name;
        
    }
    
};

const Body = {
    createAverageBody: function(energy){
      var numParts = Math.floor(energy/200);
      var body = [];
      for (let i = 0; i< numParts; i++){
        body.push(WORK);
      }
      for (let i = 0; i< numParts; i++){
        body.push(CARRY);
      }
      for (let i = 0; i< numParts; i++){
        body.push(MOVE);
      }
  
      return body;
    },
  
    createPercentageBody: function(percentageWork,energy){
      var workParts = Math.floor(energy * percentageWork/150);
      var body = [];
      for (let i = 0; i < workParts; i ++){
        body.push(WORK);
      }
      energy -= workParts * 150;
      var carryParts = Math.floor(energy/100);
      for (let i = 0; i < carryParts; i++){
        body.push(CARRY);
      }
      for (let i = 0; i < carryParts+workParts; i++){
        body.push(MOVE);
      }
      return body;
    },
  
  
  
    createSoloBody: function(typeCreep,energy){
      var workParts = Math.floor((energy - 250)/100);
      var body = [];
      if (typeCreep == 'work'){
        for (let i = 0; i < workParts; i++){
          body.push(WORK);
        }
      }else if (typeCreep == "carry"){
        for (let i = 0; i < workParts; i++){
          body.push(CARRY);
        }
      }
  
      for (let i = 0; i < 5; i++){
        body.push(MOVE);
      }
      return body;
    }
  };

// To be efficient, you have to mine 3000 energy every 300 ticks.


const loop = errorMapper(() => {

    //prototyping for spawn
    // clearing memory
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            // if (Memory.creeps[name].role == "crossSourceHarvester"){
            //     energyArr.push(Memory.creeps[name].sourceIndex);
            // }
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }

    //spawn creep
    var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    // var harvestCreeps = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvestCreep');
    var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
    var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');
    var repairers = _.filter(Game.creeps, (creep) => creep.memory.role == 'repairer');
    var wallRepairers = _.filter(Game.creeps, (creep) => creep.memory.role == 'wallRepairer');
    var crossHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'crossHarvester');
    var crossSourceHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'crossSourceHarvester');

    //resource pooint

    //energy count
    var energyMax = Game.spawns['Spawn1'].room.energyCapacityAvailable;
    var energyAvaliable = Game.spawns['Spawn1'].room.energyAvailable;
    var energy1 = Game.getObjectById('5bbcaf169099fc012e63a241');
    var energy2 = Game.getObjectById('5bbcaf169099fc012e63a240');
    // console.log("energyMax: "+energyMax);
    // console.log("Energy Avaliable: "+ energyAvaliable);

    //this.spawnCreep(body,name,{memory: {role: roleName}});

    if(harvesters.length < 1) {
        let energyUsing = undefined;
        if (crossSourceHarvesters.length == 0 && harvesters.length == 0){
            energyUsing = energyAvaliable;
        }
        else {
            energyUsing = 1300;
        }
        Game.spawns['Spawn1'].spawnCreep(Body.createAverageBody(energyUsing),"Harvester_"+RandomName.createName(),
        {memory: {role: "harvester"}});
    // }else if(harvestCreeps.length < 2){
    //      Game.spawns['Spawn1'].createSoloCreep('work',energyMax,'harvestCreep',"HarvestCreep_"+harvestCreeps.length,'E35S47','E36S47');
    }else if(upgraders.length < 1){
        Game.spawns['Spawn1'].spawnCreep(Body.createAverageBody(1200),"Upgrader_"+RandomName.createName(),
        {memory: {role: "upgrader"}});
    }else if(repairers.length < 1){
        Game.spawns['Spawn1'].spawnCreep(Body.createAverageBody(1200),"Repairer_"+RandomName.createName(),
        {memory: {role: "repairer"}});
    }else if(builders.length < 1){
        Game.spawns['Spawn1'].spawnCreep(Body.createAverageBody(1200),"Builder_"+RandomName.createName(),
        {memory:{ role: "builder", target: 0}});
    }else if(wallRepairers.length < 1){
        Game.spawns['Spawn1'].spawnCreep(Body.createAverageBody(1200),"WallRepairer_"+RandomName.createName(),
        {memory: {role: "wallRepairer", target: ""}});
    
    // }else if(crossSourceHarvesters.length < 2){
    //     Game.spawns['Spawn1'].spawnCreep(bodyType.createPercentageBody(0.4,energyMax),"CrossSourceHarvester_"+crossSourceHarvesters.length,
    //     {memory: {role: "crossSourceHarvester", home:'E35S47', target:'E36S47'}});
    // }else if(crossHarvesters.length < 1) {
    //     Game.spawns['Spawn1'].spawnCreep(bodyType.createSoloBody('carry',1200),"CrossHarvester_"+randomName.createName(),
    //     {memory: {role:"crossHarvester", home:"E35S47", target:"E36S47"}});
    }else if (!_.some(Game.creeps,(c)=> c.name == "CrossSourceHarvester_0")){
        Game.spawns['Spawn1'].spawnCreep(Body.createPercentageBody(0.4,energyMax),"CrossSourceHarvester_0",
        {memory: {role: "crossSourceHarvester", home:'E35S47', target:'E36S47'}});       
    }else if (!_.some(Game.creeps,(c)=> c.name == "CrossSourceHarvester_1")){
        Game.spawns['Spawn1'].spawnCreep(Body.createPercentageBody(0.4,energyMax),"CrossSourceHarvester_1",
        {memory: {role: "crossSourceHarvester", home:'E35S47', target:'E36S47'}});       
    }
    //tower logic

    var towers = Game.spawns['Spawn1'].room.find(FIND_STRUCTURES, {
      filter: (t) => t.structureType == STRUCTURE_TOWER
    });

    for (let tower of towers){
    //   var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
    //       filter: (structure) => structure.hits < structure.hitsMax
    //   });
    //   if(closestDamagedStructure) {
    //       tower.repair(closestDamagedStructure);
    //   }

      var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      if(closestHostile) {
          tower.attack(closestHostile);
      }
    }


    //creep running
    for (name in Game.creeps){
        var creep = Game.creeps[name];
        if (creep.memory.role == 'harvester'){
            Harvester.run(creep);
        }
        if (creep.memory.role == "upgrader"){
            Upgrader.run(creep);
        }
        if (creep.memory.role == "builder"){
            Builder.run(creep);
        }
        if (creep.memory.role == "repairer"){
            Repairer.run(creep);
        }
        if (creep.memory.role == "wallRepairer"){
            WallRepairer.run(creep);
        }
        if (creep.memory.role == "crossSourceHarvester"){
            CrossSourceHarvester.run(creep);
        }
        if (creep.memory.role == "crossHarvester"){
            CrossHarvester.run(creep);
        }
        //特殊处理
        if (creep.name == "CrossSourceHarvester_0"){
            CrossSourceHarvester.run(creep,energy1);
        }
        if (creep.name == "CrossSourceHarvester_1"){
            CrossSourceHarvester.run(creep,energy2);
        }



    }

    //奇怪的东西
    TalkAll();

    if(Game.cpu.bucket == 10000){
        Game.cpu.generatePixel();
    }


});

exports.loop = loop;
//# sourceMappingURL=main.js.map
