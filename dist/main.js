'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
    //   ???sources??? entry.  This value is prepended to the individual
    //   entries in the ???source??? field.
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
  //   ???sourceRoot???, the sources are resolved relative to the
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
 * ???????????????????????????
 * 
 * ?????? rollup ???????????????????????????????????????????????????????????????????????????????????????????????????
 * ??????????????????????????????????????????????????????????????????
 * 
 * @see https://github.com/screepers/screeps-typescript-starter/blob/master/src/utils/ErrorMapper.ts
 */

 // ?????? SourceMap
 let consumer = null;
 
 // ???????????????????????? sourceMap
 const getConsumer = function () {
     if (consumer == null) consumer = new SourceMapConsumer(require("main.js.map"));
     return consumer
 };
 
 // ?????????????????????????????????
 const cache = {};
 
 /**
  * ????????????????????????????????????????????????????????????
  * ?????? - global ????????????????????????????????????????????? cpu ?????? (> 30 CPU)
  * ??????????????????????????????????????? cpu ?????? (~ 0.1 CPU / ???)
  *
  * @param {Error | string} error ????????????????????????
  * @returns {string} ?????????????????????????????????
  */
 const sourceMappedStackTrace = function (error) {
     const stack = error instanceof Error ? error.stack : error;
     // ??????????????????
     if (cache.hasOwnProperty(stack)) return cache[stack]
 
     const re = /^\s+at\s+(.+?\s+)?\(?([0-z._\-\\\/]+):(\d+):(\d+)\)?$/gm;
     let match;
     let outStack = error.toString();
     console.log("ErrorMapper -> sourceMappedStackTrace -> outStack", outStack);
 
     while ((match = re.exec(stack))) {
         // ????????????
         if (match[2] !== "main") break
         
         // ??????????????????
         const pos = getConsumer().originalPositionFor({
             column: parseInt(match[4], 10),
             line: parseInt(match[3], 10)
         });
 
         // ????????????
         if (!pos.line) break
         
         // ???????????????
         if (pos.name) outStack += `\n    at ${pos.name} (${pos.source}:${pos.line}:${pos.column})`;
         else {
             // ?????????????????????????????????????????????????????????
             if (match[1]) outStack += `\n    at ${match[1]} (${pos.source}:${pos.line}:${pos.column})`;
             // ?????????????????????????????????????????????????????????????????????????????????
             else outStack += `\n    at ${pos.source}:${pos.line}:${pos.column}`;
         }
     }
 
     cache[stack] = outStack;
     return outStack
 };
 
 /**
  * ?????????????????????
  * ??????????????????????????? source-map ?????????????????????????????????
  * ????????? wrapLoop ???????????????wrapLoop ???????????????????????????????????????????????????
  * 
  * @param next ????????????
  */
 const errorMapper = function (next) {
     return () => {
         try {
             // ??????????????????
             next();
         }
         catch (e) {
             if (e instanceof Error) {
                 // ???????????????????????????????????????????????????
                 const errorMessage = Game.rooms.sim ?
                     `???????????????????????? source-map - ?????????????????????<br>${_.escape(e.stack)}` :
                     `${_.escape(sourceMappedStackTrace(e))}`;
                 
                 console.log(`<text style="color:#ef9a9a">${errorMessage}</text>`);
             }
             // ???????????????????????????
             else throw e
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
//import { Upgrader as upgrader } from "./Upgrader";
const WallRepairer$1 = {
    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.working && creep.store.getUsedCapacity() == 0) {
            creep.memory.working = false;
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
        }
        if (creep.memory.working) {
            let setPercentage;
            if (creep.memory.homeRoom == "E35S47") {
                setPercentage = 0.25;
            }
            else {
                setPercentage = 1;
            }
            var ramparts = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType == STRUCTURE_RAMPART && (s.hits / s.hitsMax < setPercentage)
            });
            var findRampart = function () {
                let rampart = _.sortBy(ramparts, (r) => (r.hits / r.hitsMax));
                return rampart[0];
            };
            var newRampart = function () {
                let rampart = ramparts.filter((r) => r.hits < 100);
                return rampart;
            };
            if (ramparts.length) {
                if (creep.memory.target == undefined || creep.memory.target.structureType != STRUCTURE_RAMPART) {
                    if (newRampart().length) {
                        creep.memory.target = newRampart()[0];
                    }
                    else {
                        creep.memory.target = findRampart();
                    }
                }
                else if (creep.memory.target != undefined && creep.memory.target.hits < creep.memory.target.hitsMax) {
                    if (newRampart().length && creep.memory.target.id != newRampart()[0].id) {
                        creep.memory.target = undefined;
                    }
                    else if (creep.repair(Game.getObjectById(creep.memory.target.id)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.getObjectById(creep.memory.target.id), { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
                else {
                    creep.memory.target = undefined;
                }
            }
            else {
                var walls = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => {
                        return (s.structureType == STRUCTURE_WALL && s.hits / s.hitsMax);
                    }
                });
                var findTarget = function () {
                    let wall = _.sortBy(walls, (w) => w.hits / w.hitsMax);
                    return wall[0];
                };
                if (creep.memory.target == undefined) {
                    creep.memory.target = findTarget();
                    if (!creep.memory.target) ;
                }
                else if (creep.memory.target.hits / creep.memory.target.hitsMax) {
                    if (creep.repair(Game.getObjectById(creep.memory.target.id)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.getObjectById(creep.memory.target.id), { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
                else {
                    creep.memory.target = undefined;
                }
            }
        }
        else {
            // if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.storage)
            // }
            //   if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
            //       creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
            //   }
            let sources = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
            });
            let source = _.sortBy(sources, (s) => s.store[RESOURCE_ENERGY]).reverse();
            if (source.length) {
                if (creep.withdraw(source[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source[0]);
                }
            }
            // else{
            //     if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //         creep.moveTo(creep.room.storage)
            //     }
            // }
        }
    }
};

const Builder$1 = {
    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.working && creep.store.getUsedCapacity() == 0) {
            creep.memory.working = false;
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
        }
        if (creep.memory.working) {
            creep.room.find(FIND_CONSTRUCTION_SITES, {
                filter: (s) => s.structureType == STRUCTURE_STORAGE
            });
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length) {
                if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            else {
                WallRepairer$1.run(creep);
            }
        }
        else {
            let sources = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 1800
            });
            let source = _.sortBy(sources, (s) => s.store[RESOURCE_ENERGY]).reverse();
            if (source.length) {
                if (creep.withdraw(source[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source[0]);
                }
            }
            else if (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 300) {
                if (creep.withdraw(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.storage);
                }
            }
            else {
                if (creep.memory.sourceId) {
                    if (creep.harvest(Game.getObjectById(creep.memory.sourceId)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.getObjectById(creep.memory.sourceId));
                    }
                }
                // else{
                //     if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
                //         creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
                //     }
                // }
            }
        }
    }
};

const Harvester = {
    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.working && creep.store.getUsedCapacity() == 0) {
            creep.memory.working = false;
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
        }
        if (creep.memory.working) {
            let extensions = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                }
            });
            let spawns = creep.room.find(FIND_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_SPAWN && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 });
            let labs = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    return (s.structureType == STRUCTURE_LAB && s.store[RESOURCE_ENERGY] < 1500);
                }
            });
            extensions = _.sortBy(extensions, (s) => creep.pos.getRangeTo(s)); //creep.pos.getRangeTo
            if (extensions.length) {
                if (creep.transfer(extensions[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(extensions[0], { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            else if (spawns.length) {
                if (creep.transfer(spawns[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(spawns[0]);
                }
            }
            // if extensions and spawns are full
            else if (labs.length) {
                if (creep.transfer(labs[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(labs[0], { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            //if nothing to store or carrying not ENERGY-ONLY
            else {
                if (creep.room.storage) {
                    let storage = creep.room.storage;
                    for (const resourceType in creep.store) {
                        if (creep.transfer(storage, resourceType) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(storage);
                        }
                    }
                }
                //???
                else {
                    Builder$1.run(creep);
                }
            }
        }
        else {
            let link = Game.getObjectById(creep.memory.linkId);
            if (link && link.store[RESOURCE_ENERGY] > 0) {
                if (creep.withdraw(link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(link);
                }
            }
            else {
                let sources = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
                });
                let source = _.sortBy(sources, (s) => s.store[RESOURCE_ENERGY]).reverse();
                if (creep.memory.stateSwitch == false) {
                    if (source.length) {
                        creep.memory.containerId = source[0].id;
                        creep.memory.stateSwitch = true;
                    }
                }
                if (source.length) {
                    if (creep.withdraw(Game.getObjectById(creep.memory.containerId), RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.getObjectById(creep.memory.containerId));
                    }
                    else {
                        creep.memory.stateSwitch = false;
                    }
                }
                else {
                    if (creep.memory.sourceId) {
                        if (creep.harvest(Game.getObjectById(creep.memory.sourceId)) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(Game.getObjectById(creep.memory.sourceId));
                        }
                    }
                    else {
                        if (creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), { visualizePathStyle: { stroke: '#ffaa00' } });
                        }
                    }
                }
            }
        }
    }
};

const HarvestCreep = {
    run: function (creep) {
        let source = Game.getObjectById(creep.memory.sourceId);
        let container = source.pos.findInRange(FIND_STRUCTURES, 1, { filter: { structureType: STRUCTURE_CONTAINER } })[0];
        let link = source.pos.findInRange(FIND_STRUCTURES, 2, { filter: { structureType: STRUCTURE_LINK } })[0];
        if (container && !creep.pos.isEqualTo(container.pos)) {
            creep.moveTo(container);
        }
        else {
            if (link) {
                if (creep.transfer(link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(link);
                }
            }
            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
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
const Upgrader$1 = {
    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.working && creep.store.getUsedCapacity() == 0) {
            creep.memory.working = false;
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
        }
        if (creep.memory.working) {
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            // if(creep.signController(creep.room.controller,"Farmer player ????") == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.controller)
            // }
        }
        else {
            if (!creep.memory.controllerSource) {
                let sources = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 1500
                });
                let source = _.sortBy(sources, (s) => s.store[RESOURCE_ENERGY]).reverse();
                if (source.length) {
                    if (creep.withdraw(source[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source[0]);
                    }
                }
                else if (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 300) {
                    if (creep.withdraw(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.storage);
                    }
                }
                else if (creep.memory.sourceId) {
                    if (creep.harvest(Game.getObjectById(creep.memory.sourceId)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.getObjectById(creep.memory.sourceId));
                    }
                }
            }
            else {
                if (creep.memory.stateSwitch) {
                    if (creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                    creep.upgradeController(creep.room.controller);
                    creep.memory.stateSwitch = false;
                }
                else {
                    creep.upgradeController(creep.room.controller);
                    creep.memory.stateSwitch = true;
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
* var mod = require('Repairer');
* mod.thing == 'a thing'; // true
*/
//import { Upgrader as upgrader } from "./Upgrader";
const WallRepairer = {
    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.working && creep.store.getUsedCapacity() == 0) {
            creep.memory.working = false;
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
        }
        if (creep.memory.working) {
            let setPercentage;
            if (creep.memory.homeRoom == "E35S47") {
                setPercentage = 0.25;
            }
            else {
                setPercentage = 1;
            }
            var ramparts = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType == STRUCTURE_RAMPART && (s.hits / s.hitsMax < setPercentage)
            });
            var findRampart = function () {
                let rampart = _.sortBy(ramparts, (r) => (r.hits / r.hitsMax));
                return rampart[0];
            };
            var newRampart = function () {
                let rampart = ramparts.filter((r) => r.hits < 100);
                return rampart;
            };
            if (ramparts.length) {
                if (creep.memory.target == undefined || creep.memory.target.structureType != STRUCTURE_RAMPART) {
                    if (newRampart().length) {
                        creep.memory.target = newRampart()[0];
                    }
                    else {
                        creep.memory.target = findRampart();
                    }
                }
                else if (creep.memory.target != undefined && creep.memory.target.hits < creep.memory.target.hitsMax) {
                    if (newRampart().length && creep.memory.target.id != newRampart()[0].id) {
                        creep.memory.target = undefined;
                    }
                    else if (creep.repair(Game.getObjectById(creep.memory.target.id)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.getObjectById(creep.memory.target.id), { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
                else {
                    creep.memory.target = undefined;
                }
            }
            else {
                var walls = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => {
                        return (s.structureType == STRUCTURE_WALL && s.hits / s.hitsMax);
                    }
                });
                var findTarget = function () {
                    let wall = _.sortBy(walls, (w) => w.hits / w.hitsMax);
                    return wall[0];
                };
                if (creep.memory.target == undefined) {
                    creep.memory.target = findTarget();
                    if (!creep.memory.target) ;
                }
                else if (creep.memory.target.hits / creep.memory.target.hitsMax) {
                    if (creep.repair(Game.getObjectById(creep.memory.target.id)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.getObjectById(creep.memory.target.id), { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
                else {
                    creep.memory.target = undefined;
                }
            }
        }
        else {
            // if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.storage)
            // }
            //   if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
            //       creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
            //   }
            let sources = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
            });
            let source = _.sortBy(sources, (s) => s.store[RESOURCE_ENERGY]).reverse();
            if (source.length) {
                if (creep.withdraw(source[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source[0]);
                }
            }
            // else{
            //     if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //         creep.moveTo(creep.room.storage)
            //     }
            // }
        }
    }
};

const Builder = {
    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.working && creep.store.getUsedCapacity() == 0) {
            creep.memory.working = false;
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
        }
        if (creep.memory.working) {
            creep.room.find(FIND_CONSTRUCTION_SITES, {
                filter: (s) => s.structureType == STRUCTURE_STORAGE
            });
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length) {
                if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            else {
                WallRepairer.run(creep);
            }
        }
        else {
            let sources = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 1800
            });
            let source = _.sortBy(sources, (s) => s.store[RESOURCE_ENERGY]).reverse();
            if (source.length) {
                if (creep.withdraw(source[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source[0]);
                }
            }
            else if (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 300) {
                if (creep.withdraw(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.storage);
                }
            }
            else {
                if (creep.memory.sourceId) {
                    if (creep.harvest(Game.getObjectById(creep.memory.sourceId)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.getObjectById(creep.memory.sourceId));
                    }
                }
                // else{
                //     if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
                //         creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
                //     }
                // }
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
    run: function (creep) {
        if (creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.working = false;
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
        }
        if (creep.memory.working) {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType != STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART && s.hits < s.hitsMax
            });
            var target = _.sortBy(targets, (r) => r.hits / r.hitsMax);
            if (target.length) {
                if (creep.repair(target[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target[0], { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            // if nothing to repair
            else {
                Upgrader$1.run(creep);
            }
        }
        else {
            //   if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
            //       creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
            //   }
            let sources = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 300
            });
            let source = _.sortBy(sources, (s) => s.store[RESOURCE_ENERGY]).reverse();
            if (source.length) {
                if (creep.withdraw(source[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source[0]);
                }
            }
            else {
                if (creep.withdraw(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.storage);
                }
            }
        }
    }
};

const CrossSourceHarvester = {
    /** @param {Creep} creep **/
    run: function (creep) {
        if (!(creep.hits < creep.hitsMax)) {
            if (creep.memory.working && creep.store.getUsedCapacity() == 0) {
                creep.memory.working = false;
            }
            if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
                creep.memory.working = true;
            }
            if (!creep.memory.working) {
                let droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
                    filter: (d) => d.amount >= 500
                });
                droppedEnergy = _.sortBy(droppedEnergy, (e) => e.amount).reverse();
                let source = Game.getObjectById(creep.memory.sourceId);
                if (creep.room.name == creep.memory.targetRoom) {
                    if (droppedEnergy.length) {
                        if (creep.pickup(droppedEnergy[0]) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(droppedEnergy[0], { ignoreSwamps: true });
                        }
                    }
                    else if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, { ignoreSwamps: true });
                    }
                }
                // if creep is not in the target room
                else {
                    let exit = creep.room.findExitTo(creep.memory.targetRoom);
                    creep.moveTo(creep.pos.findClosestByRange(exit));
                }
                // finished harvesting
            }
            else {
                if (creep.room.name == creep.memory.homeRoom) {
                    let link = Game.getObjectById(creep.memory.linkId);
                    if (link && link.store.getFreeCapacity(RESOURCE_ENERGY) != 0) {
                        if (creep.transfer(link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(link);
                        }
                    }
                    else if (creep.room.storage) {
                        if (creep.transfer(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(creep.room.storage);
                        }
                    }
                    else {
                        Harvester.run(creep);
                    }
                }
                // if not in home room
                else {
                    let exit = creep.room.findExitTo(creep.memory.homeRoom);
                    creep.moveTo(creep.pos.findClosestByRange(exit), { ignoreSwamps: true });
                }
            }
        }
        else {
            if (creep.memory.homeRoom == "E35S47") {
                new RoomPosition(7, 22, creep.memory.targetRoom);
            }
            else if (creep.memory.homeRoom == "E39S47") {
                new RoomPosition(12, 8, creep.memory.targetRoom);
            }
        }
    }
};

const Attacker = {
    run: function (creep) {
        if (creep.room.name == creep.memory.targetRoom) {
            let t;
            let sInvaderCore = creep.room.find(FIND_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_INVADER_CORE });
            let enemyCreep = creep.room.find(FIND_HOSTILE_CREEPS, { filter: (c) => global.whiteList.indexOf(c.owner.username) === -1 });
            let damagedCreep = creep.room.find(FIND_MY_CREEPS, { filter: (c) => c.hits < c.hitsMax });
            let position;
            if (creep.memory.homeRoom == "E35S47") {
                position = new RoomPosition(7, 21, creep.memory.targetRoom);
            }
            else if (creep.memory.homeRoom == "E39S47") {
                position = new RoomPosition(12, 7, creep.memory.targetRoom);
            }
            if (enemyCreep.length) {
                t = enemyCreep[0];
            }
            else if (sInvaderCore.length) {
                t = sInvaderCore[0];
            }
            if (creep.attack(t) == ERR_NOT_IN_RANGE) {
                creep.moveTo(t.pos);
            }
            else if (creep.rangedAttack(t) == ERR_NOT_IN_RANGE) {
                creep.moveTo(t.pos);
            }
            if (!sInvaderCore.length && !enemyCreep.length) {
                creep.moveTo(position, { ignoreSwamps: true });
            }
            if (creep.pos.isEqualTo(position)) {
                if (damagedCreep.length) {
                    creep.heal(damagedCreep[0]);
                }
                else {
                    creep.heal(creep);
                }
            }
        }
        else {
            let exit = creep.room.findExitTo(creep.memory.targetRoom);
            creep.moveTo(creep.pos.findClosestByRange(exit));
        }
    }
};

const Claimer = {
    run: function (creep) {
        if (creep.room.name == creep.memory.targetRoom) {
            if (creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, { ignoreSwamps: true, maxRooms: 0 });
            }
        }
        else {
            let exit = creep.room.findExitTo(creep.memory.targetRoom);
            creep.moveTo(creep.pos.findClosestByRange(exit), { ignoreSwamps: true });
        }
    }
};

const Miner = {
    run: function (creep) {
        if (!creep.memory.working && creep.store.getUsedCapacity() == 0) {
            creep.memory.working = true;
        }
        if (creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = false;
        }
        if (!creep.memory.working) {
            var storage = creep.room.storage;
            for (const resourceType in creep.store) {
                if (creep.transfer(storage, resourceType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage);
                }
            }
        }
        else {
            if (creep.harvest(Game.getObjectById(creep.memory.sourceId)) == ERR_NOT_IN_RANGE) {
                creep.moveTo(Game.getObjectById(creep.memory.sourceId));
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
    run: function (creep) {
        if (creep.memory.working && creep.store.getUsedCapacity() == 0) {
            creep.memory.working = false;
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
        }
        if (creep.memory.working) {
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            // if(creep.signController(creep.room.controller,"Farmer player ????") == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.controller)
            // }
        }
        else {
            if (!creep.memory.controllerSource) {
                let sources = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 1500
                });
                let source = _.sortBy(sources, (s) => s.store[RESOURCE_ENERGY]).reverse();
                if (source.length) {
                    if (creep.withdraw(source[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source[0]);
                    }
                }
                else if (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 300) {
                    if (creep.withdraw(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.storage);
                    }
                }
                else if (creep.memory.sourceId) {
                    if (creep.harvest(Game.getObjectById(creep.memory.sourceId)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.getObjectById(creep.memory.sourceId));
                    }
                }
            }
            else {
                if (creep.memory.stateSwitch) {
                    if (creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                    creep.upgradeController(creep.room.controller);
                    creep.memory.stateSwitch = false;
                }
                else {
                    creep.upgradeController(creep.room.controller);
                    creep.memory.stateSwitch = true;
                }
            }
        }
    }
};

const TrashHarvester = {
    /** @param {Creep} creep **/
    run: function (creep) {
        let tombEnergy = creep.room.find(FIND_TOMBSTONES, {
            filter: (s) => s.store.getUsedCapacity() > 0
        });
        let droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
            filter: (d) => d.amount >= 500
        });
        droppedEnergy = _.sortBy(droppedEnergy, (e) => e.amount).reverse();
        let ruinEnergy = creep.room.find(FIND_RUINS, {
            filter: (s) => s.store.getUsedCapacity() > 0
        });
        droppedEnergy = _.sortBy(droppedEnergy, (s) => creep.pos.getRangeTo(s));
        if (creep.memory.working && creep.store.getUsedCapacity() == 0) {
            creep.memory.working = false;
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
        }
        if (creep.room.name == creep.memory.homeRoom) {
            if (creep.memory.working) {
                if (creep.store[RESOURCE_ENERGY] != creep.store.getUsedCapacity()) {
                    for (const resourceType in creep.store) {
                        if (creep.transfer(creep.room.storage, resourceType) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(creep.room.storage);
                        }
                    }
                }
                else {
                    let extensions = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                        }
                    });
                    let spawns = creep.room.find(FIND_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_SPAWN && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 });
                    let towers = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType == STRUCTURE_TOWER && structure.store[RESOURCE_ENERGY] <= 600);
                        }
                    });
                    let labs = creep.room.find(FIND_STRUCTURES, {
                        filter: (s) => {
                            return (s.structureType == STRUCTURE_LAB && s.store[RESOURCE_ENERGY] < 2000);
                        }
                    });
                    if (spawns.length || extensions.length) {
                        Harvester.run(creep);
                    }
                    else if (towers.length) {
                        if (creep.transfer(towers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(towers[0], { visualizePathStyle: { stroke: '#ffffff' } });
                        }
                    }
                    else if (tombEnergy.length || ruinEnergy.length || droppedEnergy.length) {
                        //???
                        if (creep.transfer(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(creep.room.storage);
                        }
                    }
                    else if (labs.length) {
                        if (creep.transfer(labs[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(labs[0]);
                        }
                    }
                    else {
                        if (creep.room.controller.level == 8) {
                            Builder$1.run(creep);
                        }
                        else {
                            Upgrader.run(creep);
                        }
                    }
                }
            }
            else {
                let containerNonEnergy = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] != s.store.getUsedCapacity()
                });
                if (droppedEnergy.length) {
                    if (creep.pickup(droppedEnergy[0]) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(droppedEnergy[0]);
                    }
                }
                else if (tombEnergy.length) {
                    for (const resourceType in tombEnergy[0].store) {
                        if (creep.withdraw(tombEnergy[0], resourceType) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(tombEnergy[0]);
                        }
                    }
                }
                else if (ruinEnergy.length) {
                    for (const resourceType in ruinEnergy[0].store) {
                        if (creep.withdraw(ruinEnergy[0], resourceType) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(ruinEnergy[0]);
                        }
                    }
                }
                else if (containerNonEnergy.length) {
                    for (const resourceType in containerNonEnergy[0].store) {
                        if (creep.withdraw(containerNonEnergy[0], resourceType) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(containerNonEnergy[0]);
                        }
                    }
                }
                else {
                    let sources = creep.room.find(FIND_STRUCTURES, {
                        filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 1800
                    });
                    let source = _.sortBy(sources, (s) => s.store[RESOURCE_ENERGY]).reverse();
                    if (source.length) {
                        if (creep.withdraw(source[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(source[0]);
                        }
                    }
                    else if (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 500) {
                        if (creep.withdraw(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(creep.room.storage);
                        }
                    }
                    else {
                        if (creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), { visualizePathStyle: { stroke: '#ffaa00' } });
                        }
                    }
                }
            }
        }
        else {
            let exit = creep.room.findExitTo(creep.memory.homeRoom);
            creep.moveTo(creep.pos.findClosestByRange(exit));
        }
    }
};

//????????? centercreep????????????????????????????????????energy?????????????????????
const CenterCreep = {
    run: function (creep) {
        if (!(creep.pos.isEqualTo(new RoomPosition(creep.memory.position[0], creep.memory.position[1], creep.memory.homeRoom)))) {
            creep.moveTo(new RoomPosition(creep.memory.position[0], creep.memory.position[1], creep.memory.homeRoom));
        }
        else {
            if (creep.memory.homeRoom == "E35S47") {
                let linkPoint = Game.getObjectById('61a3f58732b74f02f5a76f1a');
                let factory = Game.getObjectById("61ba7016a2783d8fd293aaab");
                if (linkPoint && linkPoint.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                    for (const resourceType in creep.store) {
                        if (creep.transfer(creep.room.storage, resourceType) == ERR_NOT_IN_RANGE) ;
                    }
                    creep.withdraw(linkPoint, RESOURCE_ENERGY);
                }
                else if (factory.cooldown < 6 && creep.room.storage.store[RESOURCE_ZYNTHIUM] > 5000) {
                    if (creep.store[RESOURCE_ZYNTHIUM_BAR] > 0) {
                        creep.transfer(creep.room.storage, RESOURCE_ZYNTHIUM_BAR);
                    }
                    else if (factory.store[RESOURCE_ZYNTHIUM_BAR] > 0) {
                        creep.withdraw(factory, RESOURCE_ZYNTHIUM_BAR);
                    }
                    else if (creep.store[RESOURCE_ZYNTHIUM] > 0) {
                        creep.transfer(factory, RESOURCE_ZYNTHIUM);
                    }
                    else if (factory.store[RESOURCE_ENERGY] < 200 && creep.room.storage[RESOURCE_ZYNTHIUM] > 6000) {
                        creep.transfer(factory, RESOURCE_ENERGY);
                        creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
                    }
                    else if (factory.store[RESOURCE_ZYNTHIUM] < 500 && creep.room.storage[RESOURCE_ZYNTHIUM] > 6000) {
                        creep.withdraw(creep.room.storage, RESOURCE_ZYNTHIUM);
                    }
                    else {
                        if (factory.cooldown < 1) {
                            factory.produce(RESOURCE_ZYNTHIUM_BAR);
                        }
                    }
                }
                // else if (creep.memory.working == true){
                //     // console.log('hw')
                //     if (terminal.transferResource(creep,RESOURCE_ENERGY,100000,'E37S48') == 0){
                //         if(creep.room.terminal.send(RESOURCE_ENERGY,100000,"E37S48") == 0){
                //             creep.memory.working = false
                //         }
                //     }
                // }
            }
            if (creep.memory.homeRoom == "E39S47") {
                let factory = Game.getObjectById("61e5f5e94aca3a629c20a8e7");
                let linkPoint = Game.getObjectById('61e4e758883aa8f6df8c1c5d');
                if (linkPoint && linkPoint.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                    for (const resourceType in creep.store) {
                        if (creep.transfer(creep.room.storage, resourceType) == ERR_NOT_IN_RANGE) ;
                    }
                    creep.withdraw(linkPoint, RESOURCE_ENERGY);
                }
                else if (creep.room.terminal.store[RESOURCE_ENERGY] > 0) {
                    if (creep.store.getFreeCapacity() == 0) {
                        for (const resourceType in creep.store) {
                            if (creep.transfer(creep.room.storage, resourceType) == ERR_NOT_IN_RANGE) ;
                        }
                    }
                    else {
                        creep.withdraw(creep.room.terminal, RESOURCE_ENERGY);
                    }
                }
                else if (factory.cooldown < 6 && creep.room.storage.store[RESOURCE_UTRIUM] > 5000) {
                    if (creep.store[RESOURCE_UTRIUM_BAR] > 0) {
                        creep.transfer(creep.room.storage, RESOURCE_UTRIUM_BAR);
                    }
                    else if (factory.store[RESOURCE_UTRIUM_BAR] > 0) {
                        creep.withdraw(factory, RESOURCE_UTRIUM_BAR);
                    }
                    else if (creep.store[RESOURCE_UTRIUM] > 0) {
                        creep.transfer(factory, RESOURCE_UTRIUM);
                    }
                    else if (factory.store[RESOURCE_ENERGY] < 200 && creep.room.storage[RESOURCE_UTRIUM] > 6000) {
                        creep.transfer(factory, RESOURCE_ENERGY);
                        creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
                    }
                    else if (factory.store[RESOURCE_UTRIUM] < 500 && creep.room.storage[RESOURCE_UTRIUM] > 6000) {
                        creep.withdraw(creep.room.storage, RESOURCE_UTRIUM);
                    }
                    else {
                        if (factory.cooldown < 1) {
                            factory.produce(RESOURCE_UTRIUM_BAR);
                        }
                    }
                }
            }
            if (creep.memory.homeRoom == "E37S48") {
                let linkPoint = Game.getObjectById('61e7d673c32f8f7570ad7e44');
                if (linkPoint && linkPoint.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                    creep.withdraw(linkPoint, RESOURCE_ENERGY);
                }
                if (creep.room.terminal.store[RESOURCE_ENERGY] > 0 && creep.store[RESOURCE_ENERGY] != creep.store.getCapacity()) {
                    creep.withdraw(creep.room.terminal, RESOURCE_ENERGY);
                }
                else {
                    creep.transfer(creep.room.storage, RESOURCE_ENERGY);
                }
            }
        }
    }
};

const RoomClaimer = {
    run: function (creep) {
        // let creepPath = creep.memory.path;
        // let pathLength = creepPath.length;
        // let currentPath;
        // if(pathLength > 0){
        //     currentPath = creepPath[0];
        //     if (creep.room.name != currentPath){
        //         let exit = creep.room.findExitTo(currentPath) as FindConstant;
        //         creep.moveTo(creep.pos.findClosestByRange(exit));
        //         creep.heal(creep)
        //     }
        //     else {
        //         creepPath.shift()
        //     }
        // }
        // else{
        //     if (creep.room.name == creep.memory.path[0]){
        //         if(creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE){
        //             creep.moveTo(creep.room.controller);
        //             creep.heal(creep);
        //         }
        //     }
        //     else{
        //     }
        // }
        if (!creep.pos.isEqualTo(new RoomPosition(12, 22, "E37S48"))) {
            creep.moveTo(new RoomPosition(12, 22, "E37S48"));
        }
        else {
            creep.claimController(creep.room.controller);
        }
    }
};
///['E36S47','E37S47','E37S46','E38S46','E39S46','E39S47']

const crossRoomBuilder = {
    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.room.name == "E39S47") {
            if (creep.memory.working && creep.store.getUsedCapacity() == 0) {
                creep.memory.working = false;
            }
            if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
                creep.memory.working = true;
            }
            if (creep.memory.working) {
                creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_TOWER && structure.store[RESOURCE_ENERGY] <= 300);
                    }
                });
                creep.room.find(FIND_CONSTRUCTION_SITES);
                // if (towers.length){
                //     if (creep.transfer(towers[0],RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                //         creep.moveTo(towers[0])
                //     } 
                // }
                // if (towers.length){
                //     if (creep.transfer(towers[0],RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                //         creep.moveTo(towers[0])
                //     }
                // }
                // else if(targets.length) {
                //     if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                //         creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                //     }
                // }
                // else{
                Builder$1.run(creep);
                // }
                // if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE){
                //     creep.moveTo(creep.room.controller)
                // }
            }
            else {
                let sources = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 1500
                });
                _.sortBy(sources, (s) => s.store[RESOURCE_ENERGY]).reverse();
                // if (source.length){
                //     if(creep.withdraw(source[0],RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                //         creep.moveTo(source[0]);                
                //     }
                // }
                if (creep.room.terminal) {
                    if (creep.withdraw(creep.room.terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.terminal);
                    }
                }
                else if (creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            }
        }
        else {
            if (creep.room.name == "E35S47") {
                let exit = creep.room.findExitTo('E36S47');
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else if (creep.room.name == "E36S47") {
                let exit = creep.room.findExitTo('E37S47');
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else if (creep.room.name == "E37S47") {
                let exit = creep.room.findExitTo('E37S46');
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else if (creep.room.name == "E37S46") {
                let exit = creep.room.findExitTo('E38S46');
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else {
                creep.moveTo(new RoomPosition(11, 14, "E39S47"));
            }
        }
    }
};
// Game.spawns['Spawn1'].spawnCreep([MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],"??????",{memory:{role:"crossRoomBuilder"}})

//???
const crossRoomAttacker = {
    run: function (creep) {
        if (creep.memory.working && creep.store.getUsedCapacity() == 0) {
            creep.memory.working = false;
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
        }
        if (creep.room.name == creep.memory.targetRoom) {
            if (creep.memory.working) {
                // if(creep.transfer(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                //     creep.moveTo(creep.room.storage)
                // }
                Harvester.run(creep);
            }
            else {
                let droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
                    filter: (d) => d.amount >= 0
                });
                droppedEnergy = _.sortBy(droppedEnergy, (e) => e.amount).reverse();
                if (creep.pickup(droppedEnergy[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(droppedEnergy[0]);
                }
            }
        }
        else {
            creep.moveTo(new RoomPosition(10, 25, 'E37S48'));
        }
    }
};

const Carrier = {
    run: function (creep) {
        for (const resourceType in creep.room.terminal.store) {
            if (creep.store.getUsedCapacity() != 0) {
                for (const resource in creep.store) {
                    if (creep.transfer(creep.room.storage, resource) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.storage);
                    }
                }
            }
            else {
                if (creep.withdraw(creep.room.terminal, resourceType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.terminal);
                }
            }
        }
    }
};

/*
ts??????

creep??????+???????????????+???????????? 
???????????????????????????????????????
????????????????????????creep.moveTo?????????????????????????????????reusePath???serializeMemory???noPathFinding???ignore???avoid???serialize
??????creep.moveTo??????????????????????????????visualizePathStyle???range???ignoreDestructibleStructures???ignoreCreeps???ignoreRoad???
??????creep.moveTo???????????????ignoreSwamps????????????swamp???road????????????????????????????????????plain???????????????????????????pc???????????????false
??????creep.moveTo(controller, {ignoreSwamps: true});
??????creep.moveTo???????????????bypassHostileCreeps??????creep?????????????????????true??????????????????creep????????????true?????????false??????????????????
??????creep.moveTo(controller, {bypassHostileCreeps: false});
??????creep.moveTo???????????????bypassRange??????creep????????????????????????????????????????????????5
??????creep.moveTo(controller, {bypassRange: 10});
??????creep.moveTo???????????????noPathDelay?????????????????????????????????????????????????????????????????????10
??????creep.moveTo(controller, {noPathDelay: 5});
???????????????ERR_INVALID_ARGS?????????range??????bypassRange????????????

????????????creep????????????????????????????????????????????????????????????creep??????bypassHostileCreeps??????true???????????????creep??????????????????
??????????????????????????????invaderCore?????????????????????
?????????????????????portal????????????creep.moveTo(portal)
?????????Memory???global?????????????????????????????????
?????????Creep.prototype???PowerCreep.prototype???????????????????????????????????????????????????????????????
?????????????????????sim??????sim????????????????????????????????????ERR_INVALID_TARGET
?????????????????????????????????????????????????????????
??????????????????alpha test = 0.1.x???beta test = 0.9.x???publish >= 1.0.0

author: Scorpior
debug helpers: fangxm, czc
inspired by: Yuandiaodiaodiao
date: 2020/3/30
version: 0.9.4(beta test)

Usage:
import "./??????????????????"


changelog:
0.1.0:  maybe not runnable
0.1.1??? still maybe not runnable???????????????typo??????????????????????????????isObstacleStructure
0.1.2??? maybe runnable???some bugs are fixed
0.1.3:  ???????????????????????????????????????????????????
0.1.4:  ??????pc????????????????????????cache hits??????
0.9.0:  ?????????????????????????????????ignoreCreeps???????????????????????????+?????????storage?????????????????????
        ??????????????????rampart??????????????????range??????????????????????????????????????????
0.9.1:  ???????????????????????????????????????cache?????????????????????cache miss?????????????????????bugfix???????????????bugfix???other bugfix
0.9.2:  ????????????????????????????????????????????????????????????????????????????????????????????????bugfix???other bugfix
0.9.3??? ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????avoidRooms?????????
        ????????????????????????????????????????????????????????????bug fix
0.9.4:  ??????????????????????????????????????????????????????????????????????????????????????????neutralCostMatrixClearDelay???
        ????????????????????????????????????????????????costMatrix?????????????????????ob???????????????????????????????????????
        ??????deletePathInRoom??????????????????????????????ps??????print()??????????????????????????????????????????????????????????????????
        findRoute????????????????????????bugfix???????????????bugfix
0.9.5??? TODO???ignoreSwamp??????????????????deletePathFromRoom???deletePathToRoom?????????????????????visual???betterMove
0.9.6 :Sokranotes??? ?????????ts??????


ps:
1.??????ignoreCreeps???true???????????????ignoreCreeps???false????????????creep???????????????
2.????????????????????????creep???????????????????????????????????????, ??????memory???
creep.memory.dontPullMe = true;
3.?????????????????????????????????????????????????????????????????????
require('??????????????????').deletePathInRoom(roomName);
4.?????????????????????pc???????????????rampart??????????????????????????????????????????????????????????????????moveTo??????????????????????????????????????????????????????????????????????????????????????????
5.??????????????????require('??????????????????').print()???????????????????????????????????????????????????
*/
// ??????????????? 
let pathClearDelay = 5000;  // ????????????????????????????????????????????????????????????????????????creep??????????????????undefined?????????????????????
let hostileCostMatrixClearDelay = 500; // ?????????????????????????????????????????????????????????costMatrix
let coreLayoutRange = 3; // ???????????????????????????storage?????????????????????????????????????????????????????????
// let avoidRooms = ['E18S8', 'E19S9', 'E21S9', 'E24S8', 'E35N6', 'E25S9',
//     'E19N2', 'E18N3', 'E29N5', 'E29N3', 'E28N8', 'E33N9', 'E34N8',
//     'E37N6', 'E41N8', 'E39N11', 'E39N12', 'E39N13', 'E17S9']      // ????????????????????????
let avoidRooms = ['W46S14', 'W46S11', 'W47S9', 'W46S9', 'W45S9', 'W44S9'];      // ????????????????????????
/** @type {{id:string, roomName:string, taskQueue:{path:MyPath, idx:number, roomName:string}[]}[]} */
// let observers = ['5e3646219c6dc78024fd7097', '5e55e9b8673548d9468a2d3d', '5e36372d00fab883d281d95e'];  // ????????????ob????????????ob???id?????????
let observers = ['617ab31dd8dc485dfd4310d7'];  // ????????????ob????????????ob???id?????????
/***************************************
 *  ????????????
 */
/** @type {{ [time: number]:{path:MyPath, idx:number, roomName:string}[] }} */
let obTimer = {};   // ???????????????????????????ob?????????????????????tick??????????????????
let obTick = Game.time;
/** @type {Paths} */
let globalPathCache = {};     // ??????path
/** @type {MoveTimer} */
let pathCacheTimer = {}; // ????????????path????????????????????????????????????????????????path
/** @type {CreepPaths} */
let creepPathCache = {};    // ????????????creep??????path?????????
let creepMoveCache = {};    // ????????????creep?????????????????????tick
let emptyCostMatrix = new PathFinder.CostMatrix;
/** @type {CMs} */
let costMatrixCache = {};    // true???ignoreDestructibleStructures==true??????false??????
/** @type {{ [time: number]:{roomName:string, avoids:string[]}[] }} */
let costMatrixCacheTimer = {}; // ????????????costMatrix??????????????????????????????costMatrix
let autoClearTick = Game.time;  // ??????????????????????????????

const obstacles = new Set(OBSTACLE_OBJECT_TYPES);
const originMove = Creep.prototype.move;
Creep.prototype.moveTo;
RoomPosition.prototype.findClosestByPath;

// ????????????
let startTime;
let endTime;
let startCacheSearch;
let analyzeCPU = { // ???????????????????????????
    move: { sum: 0, calls: 0 },
    moveTo: { sum: 0, calls: 0 },
    findClosestByPath: { sum: 0, calls: 0 }
};
let cacheHitCost = 0;
let cacheMissCost = 0;

/***************************************
 *  util functions
 */
let reg1 = /^([WE])([0-9]+)([NS])([0-9]+)$/;    // parse??????['E28N7','E','28','N','7']
/**
 *  ?????????????????????????????????????????????0.00005
 * @param {RoomPosition} pos 
 */
function formalize(pos) {
    let splited = reg1.exec(pos.roomName);
    if (splited && splited.length == 5) {
        return { // ??????????????????????????????????????????????????????????????????????????????????????????parse??????????????????
            x: (splited[1] === 'W' ? -splited[2] : +splited[2] + 1) * 50 + pos.x,
            y: (splited[3] === 'N' ? -splited[4] : +splited[4] + 1) * 50 + pos.y
        }
    } // else ??????????????????????????????
    return {}
}

/**
 *  ?????????isEqualTo?????????
 * @param {RoomPosition} pos1 
 * @param {RoomPosition} pos2 
 */
function isEqual(pos1, pos2) {
    return pos1.x == pos2.x && pos1.y == pos2.y && pos1.roomName == pos2.roomName;
}

/**
 *  ??????????????????
 *  ????????????x???y????????????
 * @param {RoomPosition} pos1 
 * @param {RoomPosition} pos2 
 */
function isNear(pos1, pos2) {
    if (pos1.roomName == pos2.roomName) {    // undefined == undefined ?????????
        return -1 <= pos1.x - pos2.x && pos1.x - pos2.x <= 1 && -1 <= pos1.y - pos2.y && pos1.y - pos2.y <= 1;
    } else if (pos1.roomName && pos2.roomName) {    // ????????????RoomPosition
        if (pos1.x + pos2.x != 49 && pos1.y + pos2.y != 49) return false;    // ???????????????????????????, 0.00003 cpu
        // start
        let splited1 = reg1.exec(pos1.roomName);
        let splited2 = reg1.exec(pos2.roomName);
        if (splited1 && splited1.length == 5 && splited2 && splited2.length == 5) {
            // ????????????????????????
            let formalizedEW = (splited1[1] === 'W' ? -splited1[2] : +splited1[2] + 1) * 50 + pos1.x - (splited2[1] === 'W' ? -splited2[2] : +splited2[2] + 1) * 50 - pos2.x;
            let formalizedNS = (splited1[3] === 'N' ? -splited1[4] : +splited1[4] + 1) * 50 + pos1.y - (splited2[3] === 'N' ? -splited2[4] : +splited2[4] + 1) * 50 - pos2.y;
            return -1 <= formalizedEW && formalizedEW <= 1 && -1 <= formalizedNS && formalizedNS <= 1;
        }
        // end - start = 0.00077 cpu
    }
    return false
}

/** 
* @param {RoomPosition} pos1 
* @param {RoomPosition} pos2 
*/
function inRange(pos1, pos2, range) {
    if (pos1.roomName == pos2.roomName) {
        return -range <= pos1.x - pos2.x && pos1.x - pos2.x <= range && -range <= pos1.y - pos2.y && pos1.y - pos2.y <= range;
    } else {
        pos1 = formalize(pos1);
        pos2 = formalize(pos2);
        return pos1.x && pos2.x && inRange(pos1, pos2);
    }
}

/**
 *  fromPos???toPos???pathFinder????????????????????????????????????????????????????????????????????????
 * @param {RoomPosition} fromPos 
 * @param {RoomPosition} toPos 
 */
function getDirection(fromPos, toPos) {
    if (fromPos.roomName == toPos.roomName) {
        if (toPos.x > fromPos.x) {    // ??????????????????
            if (toPos.y > fromPos.y) {    // ??????????????????
                return BOTTOM_RIGHT;
            } else if (toPos.y == fromPos.y) { // ??????????????????
                return RIGHT;
            }
            return TOP_RIGHT;   // ??????????????????
        } else if (toPos.x == fromPos.x) { // ????????????
            if (toPos.y > fromPos.y) {    // ??????????????????
                return BOTTOM;
            } else if (toPos.y < fromPos.y) {
                return TOP;
            }
        } else {  // ??????????????????
            if (toPos.y > fromPos.y) {    // ??????????????????
                return BOTTOM_LEFT;
            } else if (toPos.y == fromPos.y) {
                return LEFT;
            }
            return TOP_LEFT;
        }
    } else {  // ???????????????
        if (fromPos.x == 0 || fromPos.x == 49) {  // ??????????????????????????????????????????????????????????????????????????????
            if (toPos.y > fromPos.y) {   // ??????????????????
                return BOTTOM;
            } else if (toPos.y < fromPos.y) { // ???????????????
                return TOP
            } // else ????????????
            return fromPos.x ? RIGHT : LEFT;
        } else if (fromPos.y == 0 || fromPos.y == 49) {    // ??????????????????????????????????????????????????????????????????????????????
            if (toPos.x > fromPos.x) {    // ??????????????????
                return RIGHT;
            } else if (toPos.x < fromPos.x) {
                return LEFT;
            }// else ????????????
            return fromPos.y ? BOTTOM : TOP;
        }
    }
}
let isHighWay = (roomName) => {
        // E0 || E10 || E1S0 || [E10S0|E1S10] || [E10S10] ??????????????????
        return roomName[1] == 0 || roomName[2] == 0 || roomName[3] == 0 || roomName[4] == 0 || roomName[5] == 0;
    };

/**
 *  ????????????????????????moveTo????????????
 * @param {MyPath} path 
 * @param {*} ops 
 */
function isSameOps(path, ops) {
    return path.ignoreRoads == !!ops.ignoreRoads &&
        path.ignoreSwamps == !!ops.ignoreSwamps &&
        path.ignoreStructures == !!ops.ignoreDestructibleStructures;
}

function hasActiveBodypart(body, type) {
    if (!body) {
        return true;
    }

    for (var i = body.length - 1; i >= 0; i--) {
        if (body[i].hits <= 0)
            break;
        if (body[i].type === type)
            return true;
    }

    return false;

}

function isClosedRampart(structure) {
    return structure.structureType == STRUCTURE_RAMPART && !structure.my && !structure.isPublic;
}

/**
 *  ???????????????????????????
 * @param {Room} room
 * @param {RoomPosition} pos 
 * @param {boolean} ignoreStructures
 */
function isObstacleStructure(room, pos, ignoreStructures) {
    let consSite = room.lookForAt(LOOK_CONSTRUCTION_SITES, pos);
    if (0 in consSite && consSite[0].my && obstacles.has(consSite[0].structureType)) {  // ???????????????
        return true;
    }
    for (let s of room.lookForAt(LOOK_STRUCTURES, pos)) {
        if (!s.hits || s.ticksToDeploy) {     // ??????????????????????????????invaderCore
            return true;
        } else if (!ignoreStructures && (obstacles.has(s.structureType) || isClosedRampart(s))) {
            return true
        }
    }
    return false;
    // let possibleStructures = room.lookForAt(LOOK_STRUCTURES, pos);  // room.lookForAt???pos.lookFor???
    // ????????????????????????extension??????????????????????????????????????????????????????3????????????rap+road+?????????
    // return obstacles.has(possibleStructures[0]) || obstacles.has(possibleStructures[1]) || obstacles.has(possibleStructures[2]);    // ????????????????????????0.00013cpu
}

/**
 *  ??????ob??????
 * @param {MyPath} path 
 * @param {number} idx 
 */
function addObTask(path, idx) {
    let roomName = path.posArray[idx].roomName;
    //console.log('??????ob ' + roomName);
    for (let obData of observers) {
        if (Game.map.getRoomLinearDistance(obData.roomName, roomName) <= 10) {
            obData.taskQueue.push({ path: path, idx: idx, roomName: roomName });
            break;
        }
    }
}

/**
 *  ?????????ob????????????
 */
function doObTask() {
    for (let obData of observers) { // ????????????ob
        let queue = obData.taskQueue;
        while (queue.length) {  // ??????task???pass
            let task = queue[queue.length - 1];
            let roomName = task.roomName;
            if (roomName in costMatrixCache) {  // ?????????????????????ob
                if (!task.path.directionArray[task.idx]) {
                    //console.log(roomName + ' ??????????????????ob');
                    checkRoom({ name: roomName }, task.path, task.idx - 1);
                }
                queue.pop();
                continue;
            }
            /** @type {StructureObserver} */
            let ob = Game.getObjectById(obData.id);
            if (ob) {
                //console.log('ob ' + roomName);
                ob.observeRoom(roomName);
                if (!(Game.time + 1 in obTimer)) {
                    obTimer[Game.time + 1] = [];
                }
                obTimer[Game.time + 1].push({ path: task.path, idx: task.idx, roomName: roomName });    // idx?????????direction
            } else {
                observers.splice(observers.indexOf(obData), 1);
            }
            break;
        }
    }
}

/**
 *  ??????ob???????????????
 */
function checkObResult() {
    for (let tick in obTimer) {
        if (tick < Game.time) {
            delete obTimer[tick];
            continue;   // ??????????????????????????????
        } else if (tick == Game.time) {
            for (let result of obTimer[tick]) {
                if (result.roomName in Game.rooms) {
                    //console.log('ob?????? ' + result.roomName);
                    checkRoom(Game.rooms[result.roomName], result.path, result.idx - 1);    // checkRoom?????????direction???idx
                }
            }
            delete obTimer[tick];
        } // else ??????????????????
        break;  // ????????????????????????????????????
    }
}

/**
 *  ???????????????costMatrix???ignoreDestructibleStructures??????????????????????????????????????????costMatrix
 *  ??????costMatrix?????????????????????
 * @param {Room} room 
 * @param {RoomPosition} pos
 */
function generateCostMatrix(room, pos) {
    let noStructureCostMat = new PathFinder.CostMatrix; // ????????????????????????????????????????????????????????????????????????3?????????????????????????????????????????????
    let structureCostMat = new PathFinder.CostMatrix;   // ???noStructrue?????????????????????????????????????????????
    let totalStructures = room.find(FIND_STRUCTURES);
    let ???????????????????????? = [].concat(room.find(FIND_SOURCES), room.find(FIND_MINERALS), room.find(FIND_DEPOSITS));
    let x, y, noviceWall, deployingCore, centralPortal;
    let clearDelay = Infinity;
    for (let object of ????????????????????????) {
        x = object.pos.x; y = object.pos.y;
        noStructureCostMat.set(x, y, 255);
    }
    if (room.controller && (room.controller.my || room.controller.safeMode)) {  // ????????????????????????
        for (let consSite of room.find(FIND_CONSTRUCTION_SITES)) {
            if (obstacles.has(consSite.structureType)) {
                x = consSite.pos.x; y = consSite.pos.y;
                noStructureCostMat.set(x, y, 255);
                structureCostMat.set(x, y, 255);
            }
        }
    }
    for (let s of totalStructures) {
        if (s.structureType == STRUCTURE_INVADER_CORE) {  // ???1????????????????????????
            if (s.ticksToDeploy) {
                deployingCore = true;
                clearDelay = clearDelay > s.ticksToDeploy ? s.ticksToDeploy : clearDelay;
                noStructureCostMat.set(s.pos.x, s.pos.y, 255);
            }
            structureCostMat.set(s.pos.x, s.pos.y, 255);
        } else if (s.structureType == STRUCTURE_PORTAL) {  // ???2???????????????
            if (!isHighWay(room.name)) {
                centralPortal = true;
                clearDelay = clearDelay > s.ticksToDecay ? s.ticksToDecay : clearDelay;
            }
            x = s.pos.x; y = s.pos.y;
            structureCostMat.set(x, y, 255);
            noStructureCostMat.set(x, y, 255);
        } else if (s.structureType == STRUCTURE_WALL) {    // ???3????????????????????????
            if (!s.hits) {
                noviceWall = true;
                noStructureCostMat.set(s.pos.x, s.pos.y, 255);
            }
            structureCostMat.set(s.pos.x, s.pos.y, 255);
        } else if (s.structureType == STRUCTURE_ROAD) {    // ????????????????????????1????????????????????????????????????
            x = s.pos.x; y = s.pos.y;
            if (noStructureCostMat.get(x, y) == 0) {  // ?????????3?????????????????????????????????
                noStructureCostMat.set(x, y, 1);
                if (structureCostMat.get(x, y) == 0) {     // ?????????????????????????????????
                    structureCostMat.set(x, y, 1);
                }
            }
        } else if (obstacles.has(s.structureType) || isClosedRampart(s)) {   // HELP???????????????????????????????????? noStructureCostMat ??????
            structureCostMat.set(s.pos.x, s.pos.y, 255);
        }
    }

    costMatrixCache[room.name] = {
        roomName: room.name,
        true: noStructureCostMat,   // ?????? ignoreDestructibleStructures = true
        false: structureCostMat     // ?????? ignoreDestructibleStructures = false
    };

    let avoids = [];
    if (room.controller && room.controller.owner && !room.controller.my && hostileCostMatrixClearDelay) {  // ?????????????????????costMat?????????????????????????????????
        if (!(Game.time + hostileCostMatrixClearDelay in costMatrixCacheTimer)) {
            costMatrixCacheTimer[Game.time + hostileCostMatrixClearDelay] = [];
        }
        costMatrixCacheTimer[Game.time + hostileCostMatrixClearDelay].push({
            roomName: room.name,
            avoids: avoids
        });   // ??????????????????
    } else if (noviceWall || deployingCore || centralPortal) { // ?????????????????????????????????????????????3????????????clearDelay????????????????????????Infinity
        if (noviceWall) {    // ?????????????????????
            let neighbors = Game.map.describeExits(room.name);
            for (let direction in neighbors) {
                let status = Game.map.getRoomStatus(neighbors[direction]);
                if (status.status == 'closed') {
                    avoidRooms[neighbors[direction]] = 1;
                } else if (status.status != 'normal' && status.timestamp != null) {
                    let estimateTickToChange = (status.timestamp - new Date().getTime()) / 10000; // 10s per tick
                    clearDelay = clearDelay > estimateTickToChange ? Math.ceil(estimateTickToChange) : clearDelay;
                }
            }
            if (pos) {  // ?????????????????????pos
                for (let direction in neighbors) {
                    if (!(neighbors[direction] in avoidRooms)) {
                        let exits = room.find(+direction);
                        if (PathFinder.search(pos, exits, { maxRooms: 1, roomCallback: () => noStructureCostMat }).incomplete) {    // ????????????
                            avoidRooms[neighbors[direction]] = 1;
                            avoids.push(neighbors[direction]);
                        }
                    }
                }
            }
        }
        //console.log(room.name + ' costMat ???????????? ' + clearDelay);
        if (!(Game.time + clearDelay in costMatrixCacheTimer)) {
            costMatrixCacheTimer[Game.time + clearDelay] = [];
        }
        costMatrixCacheTimer[Game.time + clearDelay].push({
            roomName: room.name,
            avoids: avoids  // ?????????????????????avoidRooms????????????
        });   // ??????????????????
    }
    //console.log('??????costMat ' + room.name);

}

/**
 *  ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????costMatrixCache
 * @param {MyPath} path 
 */
function generateDirectionArray(path) {
    let posArray = path.posArray;
    let directionArray = new Array(posArray.length);
    let incomplete = false;
    for (let idx = 1; idx in posArray; idx++) {
        if (posArray[idx - 1].roomName in costMatrixCache) {    // ???costMat????????????????????????????????????????????????checkRoom()
            directionArray[idx] = getDirection(posArray[idx - 1], posArray[idx]);
        } else if (!incomplete) {   // ??????????????????????????????????????????
            incomplete = idx;
        }
    }
    if (observers.length && incomplete) {
        addObTask(path, incomplete); // ????????????direction
    }
    path.directionArray = directionArray;
}

/**
 *  ??????????????????room?????????startIdx?????????????????????direction?????????
 * @param {Room} room 
 * @param {MyPath} path 
 * @param {number} startIdx 
 */
function checkRoom(room, path, startIdx) {
    if (!(room.name in costMatrixCache)) {
        generateCostMatrix(room, path.posArray[startIdx]);
    }
    let thisRoomName = room.name;
    /** @type {CostMatrix} */
    let costMat = costMatrixCache[thisRoomName][path.ignoreStructures];
    let posArray = path.posArray;
    let directionArray = path.directionArray;
    let i;
    for (i = startIdx; i + 1 in posArray && posArray[i].roomName == thisRoomName; i++) {
        if (costMat.get(posArray[i].x, posArray[i].y) == 255) {   // ?????????????????????
            return false;
        }
        directionArray[i + 1] = getDirection(posArray[i], posArray[i + 1]);
    }
    if (observers.length && i + 1 in posArray) {
        while (i + 1 in posArray) {
            if (!directionArray[i + 1]) {
                addObTask(path, i + 1);     // ????????????direction
                break;
            }
            i += 1;
        }
    }
    return true;
}

/**
 *  ??????????????????2??????????????????
 * @param {Creep} creep 
 * @param {RoomPosition} pos  
 * @param {boolean} bypassHostileCreeps
 */
function trySwap(creep, pos, bypassHostileCreeps, ignoreCreeps) {     // ERR_NOT_FOUND??????0.00063???????????????0.0066
    let obstacleCreeps = creep.room.lookForAt(LOOK_CREEPS, pos).concat(creep.room.lookForAt(LOOK_POWER_CREEPS, pos));
    if (obstacleCreeps.length) {
        if (!ignoreCreeps) {
            return ERR_INVALID_TARGET;
        }
        for (let c of obstacleCreeps) {
            if (c.my) {
                if (c.memory.dontPullMe) {    // ???1??????????????????????????????creep??????????????????
                    return ERR_INVALID_TARGET;
                }
                if (creepMoveCache[c.name] != Game.time && originMove.call(c, getDirection(pos, creep.pos)) == ERR_NO_BODYPART && creep.pull) {
                    creep.pull(c);
                    originMove.call(c, creep);
                }
            } else if (bypassHostileCreeps && (!c.room.controller || !c.room.controller.my || !c.room.controller.safeMode)) {  // ?????????????????????????????????????????????creep
                return ERR_INVALID_TARGET;
            }
        }
        return OK;    // ????????????????????????
    }
    return ERR_NOT_FOUND // ??????creep
}

let temporalAvoidFrom, temporalAvoidTo;
function routeCallback(nextRoomName, fromRoomName) {    // ??????avoidRooms????????????
    if (nextRoomName in avoidRooms) {
        //console.log('Infinity at ' + nextRoomName);
        return Infinity;
    }
    return isHighWay(nextRoomName) ? 1 : 1.15;
}
function bypassRouteCallback(nextRoomName, fromRoomName) {
    if (fromRoomName == temporalAvoidFrom && nextRoomName == temporalAvoidTo) {
        //console.log(`Infinity from ${fromRoomName} to ${nextRoomName}`);
        return Infinity;
    }
    return routeCallback(nextRoomName);
}
/**
 *  ?????????????????????????????????????????????route??????????????????path
 * @param {string} fromRoomName 
 * @param {string} toRoomName 
 * @param {boolean} bypass
 */
function findRoute(fromRoomName, toRoomName, bypass) {  // TODO ?????????shard??????????????????????????????
    //console.log('findRoute', fromRoomName, toRoomName, bypass);
    return Game.map.findRoute(fromRoomName, toRoomName, { routeCallback: bypass ? bypassRouteCallback : routeCallback });
}

/**
 * @param {RoomPosition} pos
 * @param {Room} room 
 * @param {CostMatrix} costMat 
 */
function checkTemporalAvoidExit(pos, room, costMat) {    // ???????????????creep???????????????????????????????????????
    let neighbors = Game.map.describeExits(room.name);
    temporalAvoidFrom = temporalAvoidTo = '';   // ???????????????
    for (let direction in neighbors) {
        if (!(neighbors[direction] in avoidRooms)) {
            for (let direction in neighbors) {
                let exits = room.find(+direction);
                if (PathFinder.search(pos, exits, {
                    maxRooms: 1,
                    roomCallback: () => costMat
                }).incomplete) {    // ????????????
                    temporalAvoidFrom = room.name;
                    temporalAvoidTo = neighbors[direction];
                }
            }
        }
    }
}
function routeReduce(temp, item) {
    temp[item.room] = 1;
    return temp;
}
function bypassHostile(creep) {
    return !creep.my || creep.memory.dontPullMe;
}
function bypassMy(creep) {
    return creep.my && creep.memory.dontPullMe;
}
let bypassRoomName, bypassCostMat, bypassIgnoreCondition, userCostCallback, costMat, route;
function bypassRoomCallback(roomName) {
    if (roomName in avoidRooms) {
        return false;
    }
    if (roomName == bypassRoomName) {     // ???findTemporalRoute????????????????????????costMatrix
        costMat = bypassCostMat;
    } else {
        costMat = roomName in costMatrixCache ? costMatrixCache[roomName][findPathIgnoreCondition] : emptyCostMatrix;
    }

    if (userCostCallback) {
        let resultCostMat = userCostCallback(roomName, roomName in costMatrixCache ? costMat.clone() : new PathFinder.CostMatrix);
        if (resultCostMat instanceof PathFinder.CostMatrix) {
            costMat = resultCostMat;
        }
    }
    return costMat;
}
function bypassRoomCallbackWithRoute(roomName) {
    if (roomName in route) {
        if (roomName == bypassRoomName) {     // ???findTemporalRoute????????????????????????costMatrix
            costMat = bypassCostMat;
        } else {
            costMat = roomName in costMatrixCache ? costMatrixCache[roomName][findPathIgnoreCondition] : emptyCostMatrix;
        }

        if (userCostCallback) {
            let resultCostMat = userCostCallback(roomName, roomName in costMatrixCache ? costMat.clone() : new PathFinder.CostMatrix);
            if (resultCostMat instanceof PathFinder.CostMatrix) {
                costMat = resultCostMat;
            }
        }
        return costMat;
    }
    return false;
}
/**
 *  ???????????????bypassHostileCreeps, ignoreRoads, ignoreDestructibleStructures, ignoreSwamps, costCallback, range, bypassRange
 *  ?????????PathFinder?????????plainCost, SwampCost, masOps, maxRooms, maxCost, heuristicWeight
 * @param {Creep} creep 
 * @param {RoomPosition} toPos 
 * @param {MoveToOpts} ops 
 */
function findTemporalPath(creep, toPos, ops) {
    let nearbyCreeps;
    if (ops.ignoreCreeps) { // ???ignoreCreep???????????????????????????creep
        nearbyCreeps = creep.pos.findInRange(FIND_CREEPS, ops.bypassRange, {
            filter: ops.bypassHostileCreeps ? bypassHostile : bypassMy
        }).concat(creep.pos.findInRange(FIND_POWER_CREEPS, ops.bypassRange, {
            filter: ops.bypassHostileCreeps ? bypassHostile : bypassMy
        }));
    } else {    // ????????????creep
        nearbyCreeps = creep.pos.findInRange(FIND_CREEPS, ops.bypassRange).concat(
            creep.pos.findInRange(FIND_POWER_CREEPS, ops.bypassRange)
        );
    }
    if (!(creep.room.name in costMatrixCache)) { // ???????????????costMatrix???????????????
        generateCostMatrix(creep.room, creep.pos);
    }
    bypassIgnoreCondition = !!ops.ignoreDestructibleStructures;
    /** @type {CostMatrix} */
    bypassCostMat = costMatrixCache[creep.room.name][bypassIgnoreCondition].clone();
    for (let c of nearbyCreeps) {
        bypassCostMat.set(c.pos.x, c.pos.y, 255);
    }
    bypassRoomName = creep.room.name;
    userCostCallback = typeof ops.costCallback == 'function' ? ops.costCallback : undefined;

    /**@type {PathFinderOpts} */
    let PathFinderOpts = {
        maxRooms: ops.maxRooms,
        maxCost: ops.maxCost,
        heuristicWeight: ops.heuristicWeight || 1.2
    };
    if (ops.ignoreSwamps) {   // HELP ??????????????????????????????????????????????????????
        PathFinderOpts.plainCost = ops.plainCost;
        PathFinderOpts.swampCost = ops.swampCost || 1;
    } else if (ops.ignoreRoads) {
        PathFinderOpts.plainCost = ops.plainCost;
        PathFinderOpts.swampCost = ops.swampCost || 5;
    } else {
        PathFinderOpts.plainCost = ops.plainCost || 2;
        PathFinderOpts.swampCost = ops.swampCost || 10;
    }

    if (creep.pos.roomName != toPos.roomName) { // findRoute??????????????????path?????????
        checkTemporalAvoidExit(creep.pos, creep.room, bypassCostMat);   // ??????creep????????????????????????????????????
        route = findRoute(creep.pos.roomName, toPos.roomName, true);
        if (route == ERR_NO_PATH) {
            return false;
        }
        PathFinderOpts.maxRooms = PathFinderOpts.maxRooms || route.length + 1;
        PathFinderOpts.maxOps = ops.maxOps || 2000 + route.length ** 2 * 100;  // ???10room??????2000+10*10*100=12000
        route = route.reduce(routeReduce, { [creep.pos.roomName]: 1 });     // ?????? key in Object ??? Array.includes(value) ??????????????????????????????reduce
        PathFinderOpts.roomCallback = bypassRoomCallbackWithRoute;
    } else {
        PathFinderOpts.maxOps = ops.maxOps;
        PathFinderOpts.roomCallback = bypassRoomCallback;
    }

    let result = PathFinder.search(creep.pos, { pos: toPos, range: ops.range }, PathFinderOpts).path;
    if (result.length) {
        let creepCache = creepPathCache[creep.name];
        creepCache.path = {     // ?????????????????????????????????????????????????????????????????????????????????????????????start?????????idx????????????startRoute?????????
            end: formalize(result[result.length - 1]),
            posArray: result,
            ignoreStructures: !!ops.ignoreDestructibleStructures
        };
        generateDirectionArray(creepCache.path);
        return true;
    }
    return false;
}

let findPathIgnoreCondition;
/**
 * @param {{[roomName:string]:1}} temp 
 * @param {{room:string}} item 
 * @returns {{[roomName:string]:1}}
 */
function roomCallback(roomName) {
    if (roomName in avoidRooms) {
        return false;
    }

    costMat = roomName in costMatrixCache ? costMatrixCache[roomName][findPathIgnoreCondition] : emptyCostMatrix;
    if (userCostCallback) {
        let resultCostMat = userCostCallback(roomName, roomName in costMatrixCache ? costMat.clone() : new PathFinder.CostMatrix);
        if (resultCostMat instanceof PathFinder.CostMatrix) {
            costMat = resultCostMat;
        }
    }
    return costMat;
}
function roomCallbackWithRoute(roomName) {
    if (roomName in route) {
        costMat = roomName in costMatrixCache ? costMatrixCache[roomName][findPathIgnoreCondition] : emptyCostMatrix;
        //console.log('in route ' + roomName);
        if (userCostCallback) {
            let resultCostMat = userCostCallback(roomName, roomName in costMatrixCache ? costMat.clone() : new PathFinder.CostMatrix);
            if (resultCostMat instanceof PathFinder.CostMatrix) {
                costMat = resultCostMat;
            }
        }
        return costMat;
    }
    //console.log('out route ' + roomName);
    return false;   // ??????route???????????????
}
/**
 *  ???????????????ignoreRoads, ignoreDestructibleStructures, ignoreSwamps, costCallback, range
 *  ?????????PathFinder?????????plainCost, SwampCost, masOps, maxRooms, maxCost, heuristicWeight
 * @param {RoomPosition} fromPos 
 * @param {RoomPosition} toPos 
 * @param {MoveToOpts} ops 
 */
function findPath(fromPos, toPos, ops) {

    if (!(fromPos.roomName in costMatrixCache) && fromPos.roomName in Game.rooms) {   // ????????????costMatrix
        generateCostMatrix(Game.rooms[fromPos.roomName], fromPos);
    }

    findPathIgnoreCondition = !!ops.ignoreDestructibleStructures;
    userCostCallback = typeof ops.costCallback == 'function' ? ops.costCallback : undefined;

    /**@type {PathFinderOpts} */
    let PathFinderOpts = {
        maxRooms: ops.maxRooms,
        maxCost: ops.maxCost,
        heuristicWeight: ops.heuristicWeight || 1.2
    };
    if (ops.ignoreSwamps) {   // HELP ??????????????????????????????????????????????????????
        PathFinderOpts.plainCost = ops.plainCost;
        PathFinderOpts.swampCost = ops.swampCost || 1;
    } else if (ops.ignoreRoads) {
        PathFinderOpts.plainCost = ops.plainCost;
        PathFinderOpts.swampCost = ops.swampCost || 5;
    } else {
        PathFinderOpts.plainCost = ops.plainCost || 2;
        PathFinderOpts.swampCost = ops.swampCost || 10;
    }

    if (fromPos.roomName != toPos.roomName) {   // findRoute??????????????????path?????????
        route = findRoute(fromPos.roomName, toPos.roomName);
        if (route == ERR_NO_PATH) {
            return { path: [] };
        }
        PathFinderOpts.maxOps = ops.maxOps || 2000 + route.length ** 2 * 100;  // ???10room??????2000+10*10*50=7000
        PathFinderOpts.maxRooms = PathFinderOpts.maxRooms || route.length + 1;
        route = route.reduce(routeReduce, { [fromPos.roomName]: 1 });   // ?????? key in Object ??? Array.includes(value) ??????????????????????????????reduce
        //console.log(fromPos + ' using route ' + JSON.stringify(route));
        PathFinderOpts.roomCallback = roomCallbackWithRoute;
    } else {
        PathFinderOpts.maxOps = ops.maxOps;
        PathFinderOpts.roomCallback = roomCallback;
    }

    return PathFinder.search(fromPos, { pos: toPos, range: ops.range }, PathFinderOpts);
}

let combinedX, combinedY;
/**
 * @param {MyPath} newPath 
 */
function addPathIntoCache(newPath) {
    combinedX = newPath.start.x + newPath.start.y;
    combinedY = newPath.end.x + newPath.end.y;
    if (!(combinedX in globalPathCache)) {
        globalPathCache[combinedX] = {
            [combinedY]: []  // ??????????????????ops????????????start???end???????????????
        };
    } else if (!(combinedY in globalPathCache[combinedX])) {
        globalPathCache[combinedX][combinedY] = [];      // ??????????????????ops????????????start???end???????????????
    }
    globalPathCache[combinedX][combinedY].push(newPath);
}

function invalidate() {
    return 0;
}
/**
 * @param {MyPath} path 
 */
function deletePath(path) {
    if (path.start) {     // ???start????????????????????????
        let pathArray = globalPathCache[path.start.x + path.start.y][path.end.x + path.end.y];
        pathArray.splice(pathArray.indexOf(path), 1);
        path.posArray = path.posArray.map(invalidate);
    }
}

let minX, maxX, minY, maxY;
/**
 *  ??????????????????????????????????????????????????????????????????????????????
 * @param {RoomPosition} formalFromPos 
 * @param {RoomPosition} formalToPos
 * @param {RoomPosition} fromPos
 * @param {CreepPaths} creepCache 
 * @param {MoveToOpts} ops 
 */
function findShortPathInCache(formalFromPos, formalToPos, fromPos, creepCache, ops) {     // ops.range????????????????????????
    startCacheSearch = Game.cpu.getUsed();
    minX = formalFromPos.x + formalFromPos.y - 2;
    maxX = formalFromPos.x + formalFromPos.y + 2;
    minY = formalToPos.x + formalToPos.y - 1 - ops.range;
    maxY = formalToPos.x + formalToPos.y + 1 + ops.range;
    for (combinedX = minX; combinedX <= maxX; combinedX++) {
        if (combinedX in globalPathCache) {
            for (combinedY = minY; combinedY <= maxY; combinedY++) {
                if (combinedY in globalPathCache[combinedX]) {
                    for (let path of globalPathCache[combinedX][combinedY]) {     // ???????????????????????????
                        if (isNear(path.start, formalFromPos) && isNear(fromPos, path.posArray[1]) && inRange(path.end, formalToPos, ops.range) && isSameOps(path, ops)) {     // ????????????
                            creepCache.path = path;
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

/**
 *  ????????????????????????????????????????????????????????????
 * @param {RoomPosition} formalFromPos
 * @param {RoomPosition} formalToPos
 * @param {CreepPaths} creepCache
 * @param {MoveToOpts} ops
 */
function findLongPathInCache(formalFromPos, formalToPos, creepCache, ops) {     // ops.range????????????????????????
    startCacheSearch = Game.cpu.getUsed();
    minX = formalFromPos.x + formalFromPos.y - 2;
    maxX = formalFromPos.x + formalFromPos.y + 2;
    minY = formalToPos.x + formalToPos.y - 1 - ops.range;
    maxY = formalToPos.x + formalToPos.y + 1 + ops.range;
    for (combinedX = minX; combinedX <= maxX; combinedX++) {
        if (combinedX in globalPathCache) {
            for (combinedY = minY; combinedY <= maxY; combinedY++) {
                if (combinedY in globalPathCache[combinedX]) {
                    for (let path of globalPathCache[combinedX][combinedY]) {     // ???????????????????????????
                        if (isNear(path.start, formalFromPos) && inRange(path.end, formalToPos, ops.range) && isSameOps(path, ops)) {     // ????????????
                            creepCache.path = path;
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

let startRoomName, endRoomName;
/**
 *  ??????????????????????????????????????????
 * @param {CreepPaths['name']} creepCache 
 */
function setPathTimer(creepCache) {
    {
        let posArray = creepCache.path.posArray;
        startRoomName = posArray[0].roomName;
        endRoomName = posArray[posArray.length - 1].roomName;
        if (startRoomName != endRoomName || (startRoomName in Game.rooms && Game.rooms[startRoomName].controller && !Game.rooms[startRoomName].controller.my)) {    // ??????????????????????????????
            if (!(Game.time + pathClearDelay in pathCacheTimer)) {
                pathCacheTimer[Game.time + pathClearDelay] = [];
            }
            pathCacheTimer[Game.time + pathClearDelay].push(creepCache.path);
            creepCache.path.lastTime = Game.time;
        }
    }
}

/**@type {RoomPosition[]} */
let tempArray = [];
/**
 *  
 * @param {Creep} creep 
 * @param {RoomPosition} toPos 
 * @param {RoomPosition[]} posArray 
 * @param {number} startIdx 
 * @param {number} idxStep 
 * @param {PolyStyle} visualStyle 
 */
function showVisual(creep, toPos, posArray, startIdx, idxStep, visualStyle) {
    tempArray.length = 0;
    tempArray.push(creep.pos);
    let thisRoomName = creep.room.name;
    _.defaults(visualStyle, defaultVisualizePathStyle);
    for (let i = startIdx; i in posArray && posArray[i].roomName == thisRoomName; i += idxStep) {
        tempArray.push(posArray[i]);
    }
    if (toPos.roomName == thisRoomName) {
        tempArray.push(toPos);
    }
    creep.room.visual.poly(tempArray, visualStyle);
}

/**
 *  ?????????????????????
 * @param {Creep} creep 
 * @param {PolyStyle} visualStyle 
 * @param {RoomPosition} toPos 
 */
function moveOneStep(creep, visualStyle, toPos) {
    let creepCache = creepPathCache[creep.name];
    if (visualStyle) {
        showVisual(creep, toPos, creepCache.path.posArray, creepCache.idx, 1, visualStyle);
    }
    if (creep.fatigue) {
        return ERR_TIRED;
    }
    creepCache.idx++;
    creepMoveCache[creep.name] = Game.time;
    Game.cpu.getUsed() - startTime;
    //creep.room.visual.circle(creepCache.path.posArray[creepCache.idx]);
    return originMove.call(creep, creepCache.path.directionArray[creepCache.idx]);
}

/**
 * 
 * @param {Creep} creep 
 * @param {{
        path: MyPath,
        dst: RoomPosition,
        idx: number
    }} pathCache 
 * @param {PolyStyle} visualStyle 
 * @param {RoomPosition} toPos 
 * @param {boolean} ignoreCreeps
 */
function startRoute(creep, pathCache, visualStyle, toPos, ignoreCreeps) {
    let posArray = pathCache.path.posArray;

    let idx = 0;
    while (idx in posArray && isNear(creep.pos, posArray[idx])) {
        idx += 1;
    }
    idx -= 1;
    pathCache.idx = idx;

    if (visualStyle) {
        showVisual(creep, toPos, posArray, idx, 1, visualStyle);
    }
    creepMoveCache[creep.name] = Game.time;

    let nextStep = posArray[idx];
    if (ignoreCreeps) {
        trySwap(creep, nextStep, false, true);
    }
    return originMove.call(creep, getDirection(creep.pos, posArray[idx]));
}

/**
 * @param {Function} fn 
 */
function wrapFn(fn, name) {
    return function () {
        startTime = Game.cpu.getUsed();     // 0.0015cpu
        if (obTick < Game.time) {
            obTick = Game.time;
            checkObResult();
            doObTask();
        }
        let code = fn.apply(this, arguments);
        endTime = Game.cpu.getUsed();
        if (endTime - startTime >= 0.2) {
            analyzeCPU[name].sum += endTime - startTime;
            analyzeCPU[name].calls++;
        }
        return code;
    }
}

function clearUnused() {
    if (Game.time % pathClearDelay == 0) { // ????????????????????????creep
        for (let name in creepPathCache) {
            if (!(name in Game.creeps)) {
                delete creepPathCache[name];
            }
        }
    }
    for (let time in pathCacheTimer) {
        if (time > Game.time) {
            break;
        }
        //console.log('clear path');
        for (let path of pathCacheTimer[time]) {
            if (path.lastTime == time - pathClearDelay) {
                deletePath(path);
            }
        }
        delete pathCacheTimer[time];
    }
    for (let time in costMatrixCacheTimer) {
        if (time > Game.time) {
            break;
        }
        //console.log('clear costMat');
        for (let data of costMatrixCacheTimer[time]) {
            delete costMatrixCache[data.roomName];
            for (let avoidRoomName of data.avoids) {
                delete avoidRooms[avoidRoomName];
            }
        }
        delete costMatrixCacheTimer[time];
    }
}

/***************************************
 *  ????????????
 */

const defaultVisualizePathStyle = { fill: 'transparent', stroke: '#fff', lineStyle: 'dashed', strokeWidth: .15, opacity: .1 };
/**@type {[MoveToOpts, RoomPosition, CreepPaths['1'], MyPath, number, RoomPosition[], boolean]}
*/
let [ops, toPos, creepCache, path, idx, posArray, found] = [];
/**
 *  ???moveTo????????????
 * @param {Creep} this
 * @param {number | RoomObject} firstArg 
 * @param {number | MoveToOpts} secondArg 
 * @param {MoveToOpts} opts 
 */
function betterMoveTo(firstArg, secondArg, opts) {
    if (!this.my) {
        return ERR_NOT_OWNER;
    }

    if (this.spawning) {
        return ERR_BUSY;
    }

    if (typeof firstArg == 'object') {
        toPos = firstArg.pos || firstArg;
        ops = secondArg || {};
    } else {
        toPos = { x: firstArg, y: secondArg, roomName: this.room.name };
        ops = opts || {};
    }
    ops.bypassHostileCreeps = ops.bypassHostileCreeps === undefined || ops.bypassHostileCreeps;    // ??????????????????true
    ops.ignoreCreeps = ops.ignoreCreeps === undefined || ops.ignoreCreeps;

    if (typeof toPos.x != "number" || typeof toPos.y != "number") {   // ???????????????????????????????????????????????????
        //this.say('no tar');
        return ERR_INVALID_TARGET;
    } else if (inRange(this.pos, toPos, ops.range || 1)) {   // ?????????
        if (isEqual(toPos, this.pos) || ops.range) {  // ?????????
            return OK;
        } // else ?????????
        if (this.pos.roomName == toPos.roomName && ops.ignoreCreeps) {    // ???????????????????????????
            trySwap(this, toPos, false, true);
        }
        creepMoveCache[this.name] = Game.time;      // ???????????????????????????????????????
        Game.cpu.getUsed() - startTime;
        return originMove.call(this, getDirection(this.pos, toPos));
    }
    ops.range = ops.range || 1;

    if (!hasActiveBodypart(this.body, MOVE)) {
        return ERR_NO_BODYPART;
    }

    if (this.fatigue) {
        if (!ops.visualizePathStyle) {    // ?????????????????????????????????return
            return ERR_TIRED;
        } // else ?????????????????????return
    }

    // HELP????????????????????????????????????????????????orz
    creepCache = creepPathCache[this.name];
    if (creepCache) {  // ?????????
        path = creepCache.path;
        idx = creepCache.idx;
        if (path && idx in path.posArray && path.ignoreStructures == !!ops.ignoreDestructibleStructures) {  // ?????????????????????
            posArray = path.posArray;
            if (isEqual(toPos, creepCache.dst) || inRange(posArray[posArray.length - 1], toPos, ops.range)) {   // ???????????????????????????
                if (isEqual(this.pos, posArray[idx])) {    // ??????
                    if ('storage' in this.room && inRange(this.room.storage.pos, this.pos, coreLayoutRange) && ops.ignoreCreeps) {
                        if (trySwap(this, posArray[idx + 1], false, true) == OK) ;
                    }
                    //this.say('??????');
                    return moveOneStep(this, ops.visualizePathStyle, toPos);
                } else if (idx + 1 in posArray && idx + 2 in posArray && isEqual(this.pos, posArray[idx + 1])) {  // ?????????
                    creepCache.idx++;
                    if (!path.directionArray[idx + 2]) {  // ????????????????????????????????????
                        if (checkRoom(this.room, path, creepCache.idx)) {   // ???creep???????????????idx
                            //this.say('?????? ??????');
                            //console.log(`${Game.time}: ${this.name} check room ${this.pos.roomName} OK`);
                            return moveOneStep(this, ops.visualizePathStyle, toPos);  // ????????????????????????
                        }   // else ??????????????????????????????????????????????????????
                        //console.log(`${Game.time}: ${this.name} check room ${this.pos.roomName} failed`);
                        deletePath(path);
                    } else {
                        //this.say('?????????????????????');
                        return moveOneStep(this, ops.visualizePathStyle, toPos);  // ????????????????????????
                    }
                } else if (isNear(this.pos, posArray[idx])) {  // ?????????
                    let code = trySwap(this, posArray[idx], ops.bypassHostileCreeps, ops.ignoreCreeps);  // ????????????creep
                    if (code == OK) {
                        let posString = posArray[idx].roomName + '-' + posArray[idx].x + '-' + posArray[idx].y;
                        if (creepCache.jamPos[0] == posString) {
                            creepCache.jamPos[1]++;
                            if (creepCache.jamPos[1] > 3) { // ???????????????????????????
                                ops.bypassRange = ops.bypassRange || 5; // ?????????
                                ops.ignoreCreeps = false;   // ????????????
                                if (typeof ops.bypassRange != "number" || typeof ops.range != 'number') {
                                    return ERR_INVALID_ARGS;
                                }
                                if (findTemporalPath(this, toPos, ops)) { // ?????????creepCache?????????????????????????????????
                                    this.say('????????????');
                                    return startRoute(this, creepCache, ops.visualizePathStyle, toPos, ops.ignoreCreeps);
                                } else {  // ??????
                                    //this.say('?????????');
                                    return ERR_NO_PATH;
                                }
                            }
                        } else {
                            creepCache.jamPos = [posString, 1];
                        }
                        // ???????????????????????????????????????
                    } else if (code == ERR_INVALID_TARGET) {   // ??????????????????????????????creep????????????creep?????????????????????
                        ops.bypassRange = ops.bypassRange || 5; // ?????????
                        if (typeof ops.bypassRange != "number" || typeof ops.range != 'number') {
                            return ERR_INVALID_ARGS;
                        }
                        if (findTemporalPath(this, toPos, ops)) { // ?????????creepCache?????????????????????????????????
                            //this.say('????????????');
                            return startRoute(this, creepCache, ops.visualizePathStyle, toPos, ops.ignoreCreeps);
                        } else {  // ??????
                            //this.say('?????????');
                            return ERR_NO_PATH;
                        }
                    } else if (code == ERR_NOT_FOUND && isObstacleStructure(this.room, posArray[idx], ops.ignoreDestructibleStructures)) {   // ???????????????????????????????????????costMatrix???path?????????????????????
                        //console.log(`${Game.time}: ${this.name} find obstacles at ${this.pos}`);
                        delete costMatrixCache[this.pos.roomName];
                        deletePath(path);
                    } // else ???tick????????????????????????????????????creep/pc????????????2????????????1.???????????????????????????????????????????????????2.???????????????????????????????????????creep??????????????????????????????????????????????????????1??????????????????2??????????????????
                    //this.say('??????' + getDirection(this.pos, posArray[idx]) + '-' + originMove.call(this, getDirection(this.pos, posArray[idx])));
                    if (ops.visualizePathStyle) {
                        showVisual(this, toPos, posArray, idx, 1, ops.visualizePathStyle);
                    }
                    creepMoveCache[this.name] = Game.time;
                    return originMove.call(this, getDirection(this.pos, posArray[idx]));  // ????????????????????????????????????or????????????moveTo???move???????????????????????????call?????????
                } else if (idx - 1 >= 0 && isNear(this.pos, posArray[idx - 1])) {  // ?????????????????????????????????????????????
                    //this.say('????????????');
                    if (this.pos.roomName == posArray[idx - 1].roomName && ops.ignoreCreeps) {    // ???????????????????????????????????????
                        trySwap(this, posArray[idx - 1], false, true);
                    }
                    if (ops.visualizePathStyle) {
                        showVisual(this, toPos, posArray, idx, 1, ops.visualizePathStyle);
                    }
                    creepMoveCache[this.name] = Game.time;
                    return originMove.call(this, getDirection(this.pos, posArray[idx - 1]));    // ??????????????????moveTo???move
                } // else ???????????????????????????
            } // else ???????????????
        } // else ?????????????????????????????????
    } // else ?????????????????????????????????????????????????????????

    if (!creepCache) {    // ?????????cache
        creepCache = {
            dst: { x: NaN, y: NaN },
            path: undefined,
            idx: 0,
            jamPos: []
        };
        creepPathCache[this.name] = creepCache;
    } else {
        creepCache.path = undefined;
    }

    if (typeof ops.range != 'number') {
        return ERR_INVALID_ARGS
    }

    found = this.pos.roomName == toPos.roomName ? findShortPathInCache(formalize(this.pos), formalize(toPos), this.pos, creepCache, ops) : findLongPathInCache(formalize(this.pos), formalize(toPos), creepCache, ops);
    if (found) ; else {  // ??????????????????

        if (autoClearTick < Game.time) {  // ????????????
            autoClearTick = Game.time;
            clearUnused();
        }

        let result = findPath(this.pos, toPos, ops);
        if (!result.path.length || (result.incomplete && result.path.length == 1)) {     // ?????????????????????
            //this.say('no path')
            return ERR_NO_PATH;
        }
        result = result.path;
        result.unshift(this.pos);

        //this.say('start new');
        let newPath = {
            start: formalize(result[0]),
            end: formalize(result[result.length - 1]),
            posArray: result,
            ignoreRoads: !!ops.ignoreRoads,
            ignoreStructures: !!ops.ignoreDestructibleStructures,
            ignoreSwamps: !!ops.ignoreSwamps
        };
        generateDirectionArray(newPath);
        addPathIntoCache(newPath);
        //console.log(this, this.pos, 'miss');
        creepCache.path = newPath;
    }

    creepCache.dst = toPos;
    setPathTimer(creepCache);

    found ? cacheHitCost += Game.cpu.getUsed() - startCacheSearch : cacheMissCost += Game.cpu.getUsed() - startCacheSearch;

    return startRoute(this, creepCache, ops.visualizePathStyle, toPos, ops.ignoreCreeps);
}

/***************************************
 *  ?????????
 *  Creep.prototype.move()??????v0.9.x????????????
 *  ob???????????????visual??????v0.9.x???v1.0.x????????????
 *  RoomPosition.prototype.findClosestByPath()??????v1.1??????
 *  Creep.prototype.flee()???RoomPosition.prototype.findSquadPathTo()????????????v1.1???v1.2??????
 *  checkSquadPath()??????????????????
 */
avoidRooms = avoidRooms.reduce((temp, roomName) => {
    temp[roomName] = 1;
    return temp;
}, {});

observers = observers.reduce((temp, id) => {
    let ob = Game.getObjectById(id);
    if (ob && ob.observeRoom && ob.my) {
        temp.push({ id, roomName: ob.room.name, taskQueue: [] });
    }
    return temp;
}, []);

// Creep.prototype.move = wrapFn(config.changeMove? betterMove : originMove, 'move');
Creep.prototype.moveTo = wrapFn(betterMoveTo , 'moveTo');

const Body = {
    createAverageBody: function (energy) {
        let numParts = Math.floor(energy / 200);
        let body = [];
        for (let i = 0; i < numParts; i++) {
            body.push(WORK);
        }
        for (let i = 0; i < numParts; i++) {
            body.push(CARRY);
        }
        for (let i = 0; i < numParts; i++) {
            body.push(MOVE);
        }
        return body;
    },
    createPercentageBody: function (percentageWork, energy) {
        let workParts = Math.floor(energy * percentageWork / 150);
        let body = [];
        for (let i = 0; i < workParts; i++) {
            body.push(WORK);
        }
        energy -= workParts * 150;
        var carryParts = Math.floor(energy / 100);
        for (let i = 0; i < carryParts; i++) {
            body.push(CARRY);
        }
        for (let i = 0; i < carryParts + workParts; i++) {
            body.push(MOVE);
        }
        return body;
    },
    createSoloBody: function (typeCreep, energy) {
        let workParts = Math.floor((energy - 250) / 100);
        let body = [];
        if (typeCreep == 'work') {
            for (let i = 0; i < workParts; i++) {
                body.push(WORK);
            }
        }
        else if (typeCreep == "carry") {
            for (let i = 0; i < workParts; i++) {
                body.push(CARRY);
            }
        }
        for (let i = 0; i < 5; i++) {
            body.push(MOVE);
        }
        return body;
    },
    createMoveCarryBody: function (energy) {
        let body = [];
        let number = Math.floor((energy - 150) / 3 / 50);
        for (let i = 0; i < number; i++) {
            body.push(CARRY);
            body.push(CARRY);
            body.push(MOVE);
        }
        body.push(WORK);
        body.push(MOVE);
        return body;
    }
};

const RandomName = {
    createName: function(){
        var firstNames = new Array(
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',
            '???', '???', '???', '???', '???', '???', '???', '???', '???', '???',"??????", "??????", "??????", "??????", "??????",
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????"
        );
         
        var lastNames =  new Array(
            '??????', '???', '??????', '??????', '??????', '???', '???', '???', '??????', '??????', '??????',
            '??????', '??????', '??????', '??????', '??????', '??????', '??????', '??????', '???', '??????',
            '??????', '??????', '??????', '??????', '??????', '??????', '??????', '??????', '??????', '??????',
            '??????', '??????', '??????', '??????', '??????', '??????', '??????', '??????', '??????', '??????',
            '??????', '??????', '???', '??????', '??????', '??????', '??????', '??????', '??????', '??????',
            '??????', '??????', '???', '??????', '??????', '??????', '??????', '??????', '??????', '??????',
            '??????', '??????', '??????', '??????', '??????', '???', '??????', '??????', '??????', '??????',
            '??????', '??????', '??????', '??????', '??????', '??????', '??????', '??????', '??????', '??????',
            '??????', '??????', '??????', '??????', '??????', '??????', '??????', '??????', '??????', '??????',
            '??????', '??????', '??????', '??????', '??????', '??????', '??????', '??????', '??????', '??????',
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????",
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????","???????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", "??????", 
            "??????", "??????", "??????", "??????","???","??????"
        );
         
         
        var firstLength = firstNames.length;
        var lastLength = lastNames.length;
         
        var i = parseInt(  Math.random() * firstLength );
        var j = parseInt(  Math.random() * lastLength );
        var name = firstNames[i] + lastNames[j];
         
        return name;
        
    }
    
};

class WhiteListController {
    constructor() {
        this.whiteList = ['hi'];
    }
    addName() {
        return this.whiteList;
    }
    renewAddName() {
        if (!global.WLaddName) {
            global.WLaddnName = function () { this.addName(); };
        }
    }
}

const Stats = function () {
    // ??? 20 tick ????????????
    if (Game.time % 20)
        return;
    if (!Memory.stats)
        Memory.stats = {};
    // ?????? GCL / GPL ???????????????????????????
    Memory.stats.gcl = (Game.gcl.progress / Game.gcl.progressTotal) * 100;
    Memory.stats.gclLevel = Game.gcl.level;
    Memory.stats.gpl = (Game.gpl.progress / Game.gpl.progressTotal) * 100;
    Memory.stats.gplLevel = Game.gpl.level;
    // CPU ??????????????????
    Memory.stats.cpu = Game.cpu.getUsed();
    // bucket ???????????????
    Memory.stats.bucket = Game.cpu.bucket;
};

let whiteListControll;
let whiteList = ['superbitch', 'orbitingflea'];
const loop = errorMapper(() => {
    //?????????crossRoomAttacker
    global.whiteList = whiteList;
    (!whiteListControll) ? whiteListControll = new WhiteListController() : whiteListControll.renewAddName();
    whiteListControll.renewAddName();
    // clearing memory
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            // if (Memory.creeps[name].role == "crossSourceHarvester"){
            //     energyArr.push(Memory.creeps[name].sourceIndex);
            // }
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    for (let room in Game.rooms) {
        if (room == "E35S47") {
            //spawn creep
            let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester' && creep.memory.homeRoom == room);
            let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader' && creep.memory.homeRoom == room);
            let builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder' && creep.memory.homeRoom == room);
            let wallRepairers = _.filter(Game.creeps, (creep) => creep.memory.role == 'wallRepairer' && creep.memory.homeRoom == room);
            let crossSourceHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'crossSourceHarvester' && creep.memory.homeRoom == room);
            let attackers = _.filter(Game.creeps, (creep) => creep.memory.role == "attacker" && creep.memory.homeRoom == room);
            let claimers = _.filter(Game.creeps, (creep) => creep.memory.role == "claimer" && creep.memory.homeRoom == room);
            let miners = _.filter(Game.creeps, (creep) => creep.memory.role == "miner" && creep.memory.homeRoom == room);
            let trashHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == "trashHarvester" && creep.memory.homeRoom == room);
            let centerCreeps = _.filter(Game.creeps, (creep) => creep.memory.role == "centerCreep" && creep.memory.homeRoom == room);
            let crossRoomAttackers = _.filter(Game.creeps, (creep) => creep.memory.role == "crossRoomAttacker" && creep.memory.homeRoom == room);
            let roomClaimers = _.filter(Game.creeps, (creep) => creep.memory.role == "roomClaimer" && creep.memory.homeRoom == room);
            let crossRoomBuilders = _.filter(Game.creeps, (creep) => creep.memory.role == "crossRoomBuilder" && creep.memory.homeRoom == room);
            //energy count
            var energyMax = Game.spawns['E35S47_1'].room.energyCapacityAvailable;
            var energyAvaliable = Game.spawns['E35S47_1'].room.energyAvailable;
            let mineral = Game.getObjectById('5bbcb634d867df5e54207604');
            let centerLink = Game.getObjectById('61a3f58732b74f02f5a76f1a');
            let outterSourceLink = Game.getObjectById('61b63440d582576e9ae52683');
            let sourceLink1 = Game.getObjectById('61e9230ca54da5f314382217');
            let sourceLink2 = Game.getObjectById('61e9247eca3c7ace9b6b3db8');
            // console.log("energyMax: "+energyMax);
            // console.log("Energy Avaliable: "+ energyAvaliable);
            //this.spawnCreep(body,name,{memory: {role: roleName}});
            // if(harvesters.length < 1) {
            //     let energyUsing = undefined;
            //     if (harvesters.length == 0 && trashHarvesters.length == 0){
            //         if (energyAvaliable < 300){
            //             energyUsing = 300
            //         }
            //         else{
            //             energyUsing = energyAvaliable;
            //         }
            //     }
            //     else{
            //         energyUsing = 1600;
            //     }
            //     Game.spawns['E35S47_1'].spawnCreep(bodyType.createMoveCarryBody(energyUsing),"Harvester_"+randomName.createName(),
            //     {memory: {role: "harvester",homeRoom: 'E35S47',linkId: '61a3f58732b74f02f5a76f1a',stateSwitch:false}});
            if (trashHarvesters.length < 2) {
                let energyUsing = undefined;
                if (trashHarvesters.length == 0) {
                    if (energyAvaliable < 300) {
                        energyUsing = 300;
                    }
                    else if (energyAvaliable < 2000) {
                        energyUsing = energyAvaliable;
                    }
                    else {
                        energyUsing = 2000;
                    }
                }
                else {
                    energyUsing = 2000;
                }
                Game.spawns['E35S47_1'].spawnCreep(Body.createAverageBody(energyUsing), "????????????" + RandomName.createName(), { memory: { role: "trashHarvester", homeRoom: 'E35S47' } });
            }
            else if (!_.some(Game.creeps, (c) => c.name == "HarvestCreep_0")) {
                Game.spawns['E35S47_1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], "HarvestCreep_0", { memory: { role: "harvestCreep", sourceId: '5bbcaf069099fc012e639ff5', dontPullMe: true, homeRoom: 'E35S47' } });
            }
            else if (!_.some(Game.creeps, (c) => c.name == "HarvestCreep_1")) {
                Game.spawns['E35S47_1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], "HarvestCreep_1", { memory: { role: "harvestCreep", sourceId: '5bbcaf069099fc012e639ff6', dontPullMe: true, homeRoom: 'E35S47' } });
            }
            else if (centerCreeps.length < 1) {
                Game.spawns['E35S47_1'].spawnCreep([MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY], "CenterCreep_" + RandomName.createName(), { memory: { role: "centerCreep", dontPullMe: true, homeRoom: 'E35S47', position: [12, 18], working: true } });
            }
            else if (upgraders.length < 1 && Game.rooms[room].controller.ticksToDowngrade < 64000) {
                Game.spawns['E35S47_1'].spawnCreep(Body.createAverageBody(300), "Upgrader_" + RandomName.createName(), { memory: { role: "upgrader", homeRoom: 'E35S47' } });
            }
            else if (builders.length < 2 && Game.rooms[room].storage.store[RESOURCE_ENERGY] > 200000) {
                Game.spawns['E35S47_1'].spawnCreep(Body.createAverageBody(2300), "Builder_" + RandomName.createName(), { memory: { role: "builder", homeRoom: 'E35S47' } });
            }
            else if (claimers.length < 1) {
                Game.spawns['E35S47_1'].spawnCreep([CLAIM, CLAIM, MOVE, MOVE], "Claimer_" + RandomName.createName(), { memory: { role: "claimer", homeRoom: 'E35S47', targetRoom: "E36S47" } });
            }
            else if (attackers.length < 1) {
                Game.spawns['E35S47_1'].spawnCreep([TOUGH, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, HEAL, HEAL, MOVE, MOVE, MOVE, MOVE, MOVE], "Attacker_" + RandomName.createName(), { memory: { role: "attacker", homeRoom: 'E35S47', targetRoom: "E36S47" } });
            }
            else if (miners.length < 1 && mineral.mineralAmount > 0) {
                Game.spawns['E35S47_1'].spawnCreep(Body.createAverageBody(1200), "Miner_" + RandomName.createName(), { memory: { role: "miner", homeRoom: 'E35S47', sourceId: '5bbcb634d867df5e54207604' } });
                // }else if(roomClaimers.length < 1){
                //     Game.spawns['E35S47_1'].spawnCreep([ATTACK,CLAIM,MOVE,MOVE,MOVE,MOVE],"RoomClaimer_"+randomName.createName(),
                //     {memory: {role: "roomClaimer", homeRoom: 'E35S47'}});   
                // }else if(crossRoomBuilders.length < 2){
                //     Game.spawns['E35S47_1'].spawnCreep(bodyType.createAverageBody(1600),"CrossRoomBuilder_"+randomName.createName(),
                //     {memory: {role: "crossRoomBuilder", homeRoom: 'E35S47'}});  
                // }else if(crossRoomAttackers.length < 2){
                //     Game.spawns['E35S47_1'].spawnCreep(bodyType.createMoveCarryBody(1600),"CrossRoomAttacker_"+randomName.createName(),
                //     {memory: {role: "crossRoomAttacker", homeRoom: 'E35S47', targetRoom:"E37S48"}});  
            }
            else if (!_.some(Game.creeps, (c) => c.name == "CrossSourceHarvester_0")) {
                Game.spawns['E35S47_1'].spawnCreep(Body.createPercentageBody(0.4, 2500), "CrossSourceHarvester_0", { memory: { role: "crossSourceHarvester", homeRoom: 'E35S47', targetRoom: 'E36S47', sourceId: '5bbcaf169099fc012e63a241', linkId: '61b63440d582576e9ae52683' } });
            }
            else if (!_.some(Game.creeps, (c) => c.name == "CrossSourceHarvester_1")) {
                Game.spawns['E35S47_1'].spawnCreep(Body.createPercentageBody(0.4, 2500), "CrossSourceHarvester_1", { memory: { role: "crossSourceHarvester", homeRoom: 'E35S47', targetRoom: 'E36S47', sourceId: '5bbcaf169099fc012e63a240', linkId: '61b63440d582576e9ae52683' } });
            }
            //tower logic
            let towers = Game.spawns['E35S47_1'].room.find(FIND_STRUCTURES, {
                filter: (t) => t.structureType == STRUCTURE_TOWER
            });
            for (let tower of towers) {
                var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                    filter: (c) => whiteList.indexOf(c.owner.username) === -1
                });
                if (closestHostile) {
                    tower.attack(closestHostile);
                }
                else {
                    var targets = tower.room.find(FIND_STRUCTURES, {
                        filter: (s) => s.structureType != STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART && s.hits < s.hitsMax
                    });
                    if (targets.length && tower.store[RESOURCE_ENERGY] > 300) {
                        tower.repair(targets[0]);
                    }
                }
            }
            //link logic
            if (outterSourceLink.store[RESOURCE_ENERGY] > 700) {
                outterSourceLink.transferEnergy(centerLink);
            }
            if (sourceLink1.store[RESOURCE_ENERGY] == 800) {
                sourceLink1.transferEnergy(centerLink);
            }
            if (sourceLink2.store[RESOURCE_ENERGY] == 800) {
                sourceLink2.transferEnergy(centerLink);
            }
        }
        else if (room == "E39S47") {
            let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester' && creep.memory.homeRoom == room);
            let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader' && creep.memory.homeRoom == room);
            let builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder' && creep.memory.homeRoom == room);
            let trashHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == "trashHarvester" && creep.memory.homeRoom == room);
            let crossSourceHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'crossSourceHarvester' && creep.memory.homeRoom == room);
            let miners = _.filter(Game.creeps, (creep) => creep.memory.role == "miner" && creep.memory.homeRoom == room);
            let centerCreeps = _.filter(Game.creeps, (creep) => creep.memory.role == "centerCreep" && creep.memory.homeRoom == room);
            let claimers = _.filter(Game.creeps, (creep) => creep.memory.role == "claimer" && creep.memory.homeRoom == room);
            let attackers = _.filter(Game.creeps, (creep) => creep.memory.role == "attacker" && creep.memory.homeRoom == room);
            let carriers = _.filter(Game.creeps, (creep) => creep.memory.role == "carrier" && creep.memory.homeRoom == room);
            let remoteSourceHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == "remoteSourceHarvester" && creep.memory.homeRoom == room);
            let sourceLink1 = Game.getObjectById('61d6dd2832dc6d502a7918ac');
            let sourceLink2 = Game.getObjectById('61e90b7a22a86677dcbfa8c3');
            let centerLink = Game.getObjectById('61e4e758883aa8f6df8c1c5d');
            let energyAvaliable = Game.rooms[room].energyAvailable;
            let energyMax = Game.rooms[room].energyCapacityAvailable;
            var mineral = Game.getObjectById('5bbcb65cd867df5e5420778d');
            let builderAmount;
            let builderBody;
            if (Game.rooms[room].storage.store[RESOURCE_ENERGY] > 200000) {
                builderAmount = 2;
                builderBody = 1600;
            }
            else {
                builderAmount = 1;
                builderBody = 1000;
            }
            if (trashHarvesters.length < 2) {
                let energyUsing = undefined;
                if (trashHarvesters.length == 0) {
                    if (energyAvaliable < 300) {
                        energyUsing = 300;
                    }
                    else if (energyAvaliable < 2000) {
                        energyUsing = energyAvaliable;
                    }
                    else {
                        energyUsing = 2000;
                    }
                }
                else {
                    energyUsing = 2000;
                }
                Game.spawns['E39S47_2'].spawnCreep(Body.createAverageBody(energyUsing), "????????????" + RandomName.createName(), { memory: { role: "trashHarvester", homeRoom: 'E39S47' } });
            }
            else if (!_.some(Game.creeps, (c) => c.name == "HarvestCreep_2")) {
                Game.spawns['E39S47_2'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], "HarvestCreep_2", { memory: { role: "harvestCreep", sourceId: '5bbcaf4a9099fc012e63a6ec', dontPullMe: true, homeRoom: 'E39S47' } });
            }
            else if (!_.some(Game.creeps, (c) => c.name == "HarvestCreep_3")) {
                Game.spawns['E39S47_2'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], "HarvestCreep_3", { memory: { role: "harvestCreep", sourceId: '5bbcaf4a9099fc012e63a6ee', dontPullMe: true, homeRoom: 'E39S47' } });
            }
            else if (centerCreeps.length < 1) {
                Game.spawns['E39S47_2'].spawnCreep([MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY], "CenterCreep_" + RandomName.createName(), { memory: { role: "centerCreep", dontPullMe: true, homeRoom: 'E39S47', position: [21, 15] } });
                // }else if(upgraders.length < 1){
                //     Game.spawns['E39S47_2'].spawnCreep(bodyType.createAverageBody(1200),"Upgrader_"+randomName.createName(),
                //     {memory: {role: "upgrader",homeRoom: 'E39S47'}});      
                // }else if(carriers.length < 2 && Game.rooms['E39S47'].terminal.store.getUsedCapacity() > 0){
                //     Game.spawns['E39S47_2'].spawnCreep(bodyType.createMoveCarryBody(1400),"Carrier_"+randomName.createName(),
                //     {memory:{ role: "carrier",homeRoom: 'E39S47'}});           
            }
            else if (builders.length < builderAmount) {
                Game.spawns['E39S47_1'].spawnCreep(Body.createAverageBody(builderBody), "Builder_" + RandomName.createName(), { memory: { role: "builder", homeRoom: 'E39S47' } });
                // }else if(claimers.length < 1){
                //     Game.spawns['E39S47_2'].spawnCreep([CLAIM,CLAIM,MOVE,MOVE],"Claimer_"+randomName.createName(),
                //     {memory: {role: "claimer", homeRoom: 'E39S47', targetRoom:"E39S46"}}); 
            }
            else if (attackers.length < 1) {
                Game.spawns['E39S47_2'].spawnCreep([TOUGH, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, HEAL, HEAL, MOVE, MOVE, MOVE, MOVE, MOVE], "Attacker_" + RandomName.createName(), { memory: { role: "attacker", homeRoom: 'E39S47', targetRoom: "E39S46" } });
            }
            else if (miners.length < 1 && mineral.mineralAmount > 0) {
                Game.spawns['E39S47_1'].spawnCreep(Body.createAverageBody(800), "Miner_" + RandomName.createName(), { memory: { role: "miner", homeRoom: 'E39S47', sourceId: "5bbcb65cd867df5e5420778d" } });
            }
            else if (!_.some(Game.creeps, (c) => c.name == "CrossSourceHarvester_2")) {
                Game.spawns['E39S47_1'].spawnCreep(Body.createPercentageBody(0.4, 2500), "CrossSourceHarvester_2", { memory: { role: "crossSourceHarvester", homeRoom: 'E39S47', targetRoom: 'E39S46', sourceId: '5bbcaf4a9099fc012e63a6e9', linkId: '61d6dd2832dc6d502a7918ac' } });
            }
            let towers = Game.rooms['E39S47'].find(FIND_STRUCTURES, {
                filter: (t) => t.structureType == STRUCTURE_TOWER
            });
            for (let tower of towers) {
                let closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                    filter: (c) => whiteList.indexOf(c.owner.username) === -1
                });
                if (closestHostile) {
                    tower.attack(closestHostile);
                }
                else {
                    let targets = tower.room.find(FIND_STRUCTURES, {
                        filter: (s) => s.structureType != STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART && s.hits < s.hitsMax
                    });
                    if (targets.length && tower.store[RESOURCE_ENERGY] > 300) {
                        tower.repair(targets[0]);
                    }
                }
            }
            if (sourceLink1.store.getUsedCapacity(RESOURCE_ENERGY) == 800) {
                sourceLink1.transferEnergy(centerLink);
            }
            if (sourceLink2.store.getUsedCapacity(RESOURCE_ENERGY) == 800) {
                sourceLink2.transferEnergy(centerLink);
            }
        }
        else if (room == "E37S48") {
            let energyAvaliable = Game.rooms[room].energyAvailable;
            let energyMax = Game.rooms[room].energyCapacityAvailable;
            let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester' && creep.memory.homeRoom == room);
            let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader' && creep.memory.homeRoom == room);
            let builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder' && creep.memory.homeRoom == room);
            let trashHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == "trashHarvester" && creep.memory.homeRoom == room);
            let centerCreeps = _.filter(Game.creeps, (creep) => creep.memory.role == "centerCreep" && creep.memory.homeRoom == room);
            let miners = _.filter(Game.creeps, (creep) => creep.memory.role == "miner" && creep.memory.homeRoom == room);
            let centerLink = Game.getObjectById('61e7d673c32f8f7570ad7e44');
            let sourceLink1 = Game.getObjectById('61e7dfc0363f39514da6ee51');
            let sourceLink2 = Game.getObjectById('61ed52620bd2bf7ca5dd404b');
            let sourceLink3 = Game.getObjectById('621337af282098652c59f7b6');
            var mineral = Game.getObjectById('5bbcb647d867df5e542076b6');
            let upgraderAmount;
            if (Game.rooms[room].storage.store[RESOURCE_ENERGY] > 200000) {
                upgraderAmount = 2;
            }
            else {
                upgraderAmount = 1;
            }
            if (trashHarvesters.length < 2) {
                let energyUsing = undefined;
                if (trashHarvesters.length == 0) {
                    if (energyAvaliable < 300) {
                        energyUsing = 300;
                    }
                    else if (energyAvaliable < 2000) {
                        energyUsing = energyAvaliable;
                    }
                    else {
                        energyUsing = 2000;
                    }
                }
                else {
                    energyUsing = 2000;
                }
                Game.spawns['E37S48_1'].spawnCreep(Body.createMoveCarryBody(energyUsing), "????????????" + RandomName.createName(), { memory: { role: "trashHarvester", homeRoom: 'E37S48' } });
            }
            else if (!_.some(Game.creeps, (c) => c.name == "HarvestCreep_4")) {
                Game.spawns['E37S48_1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], "HarvestCreep_4", { memory: { role: "harvestCreep", sourceId: '5bbcaf269099fc012e63a3dc', dontPullMe: true, homeRoom: 'E37S48' } });
            }
            else if (!_.some(Game.creeps, (c) => c.name == "HarvestCreep_5")) {
                Game.spawns['E37S48_1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], "HarvestCreep_5", { memory: { role: "harvestCreep", sourceId: '5bbcaf269099fc012e63a3de', dontPullMe: true, homeRoom: 'E37S48' } });
            }
            else if (centerCreeps.length < 1) {
                Game.spawns['E37S48_1'].spawnCreep([MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY], "CenterCreep_" + RandomName.createName(), { memory: { role: "centerCreep", dontPullMe: true, homeRoom: 'E37S48', position: [41, 36], working: true } });
            }
            else if (upgraders.length < upgraderAmount) {
                Game.spawns['E37S48_1'].spawnCreep(Body.createAverageBody(1800), "Upgrader_" + RandomName.createName(), { memory: { role: "upgrader", homeRoom: 'E37S48', sourceId: "5bbcaf269099fc012e63a3de" } });
            }
            else if (builders.length < 1) {
                Game.spawns['E37S48_1'].spawnCreep(Body.createAverageBody(1800), "Builder_" + RandomName.createName(), { memory: { role: "builder", homeRoom: 'E37S48', sourceId: "5bbcaf269099fc012e63a3dc" } });
            }
            else if (miners.length < 1 && mineral.mineralAmount > 0) {
                Game.spawns['E37S48_1'].spawnCreep(Body.createAverageBody(800), "Miner_" + RandomName.createName(), { memory: { role: "miner", homeRoom: 'E37S48', sourceId: "5bbcb647d867df5e542076b6" } });
            }
            else if (!_.some(Game.creeps, (c) => c.name == "CrossSourceHarvester_3")) {
                Game.spawns['E37S48_1'].spawnCreep(Body.createPercentageBody(0.4, 2500), "CrossSourceHarvester_3", { memory: { role: "crossSourceHarvester", homeRoom: 'E37S48', targetRoom: 'E37S49', sourceId: '5bbcaf269099fc012e63a3e0' } });
            }
            else if (!_.some(Game.creeps, (c) => c.name == "CrossSourceHarvester_4")) {
                Game.spawns['E37S48_1'].spawnCreep(Body.createPercentageBody(0.4, 2500), "CrossSourceHarvester_4", { memory: { role: "crossSourceHarvester", homeRoom: 'E37S48', targetRoom: 'E36S48', sourceId: '5bbcaf169099fc012e63a245', linkId: '61ed52620bd2bf7ca5dd404b' } });
            }
            else if (!_.some(Game.creeps, (c) => c.name == "CrossSourceHarvester_5")) {
                Game.spawns['E37S48_1'].spawnCreep(Body.createPercentageBody(0.4, 2500), "CrossSourceHarvester_5", { memory: { role: "crossSourceHarvester", homeRoom: 'E37S48', targetRoom: 'E37S47', sourceId: '5bbcaf269099fc012e63a3d9', linkId: '61e7dfc0363f39514da6ee51' } });
            }
            let towers = Game.rooms['E37S48'].find(FIND_STRUCTURES, {
                filter: (t) => t.structureType == STRUCTURE_TOWER
            });
            for (let tower of towers) {
                let closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                    filter: (c) => whiteList.indexOf(c.owner.username) === -1
                });
                if (closestHostile) {
                    tower.attack(closestHostile);
                }
                else {
                    let targets = tower.room.find(FIND_STRUCTURES, {
                        filter: (s) => s.structureType != STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART && s.hits < s.hitsMax
                    });
                    if (targets.length && tower.store[RESOURCE_ENERGY] > 300) {
                        tower.repair(targets[0]);
                    }
                }
            }
            if (sourceLink1.store.getUsedCapacity(RESOURCE_ENERGY) == 800) {
                sourceLink1.transferEnergy(centerLink);
            }
            if (sourceLink2.store.getUsedCapacity(RESOURCE_ENERGY) == 800) {
                sourceLink2.transferEnergy(centerLink);
            }
            if (sourceLink3.store.getUsedCapacity(RESOURCE_ENERGY) == 800) {
                sourceLink3.transferEnergy(centerLink);
            }
        }
    }
    //creep running
    for (name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.role == 'harvester') {
            Harvester.run(creep);
        }
        if (creep.memory.role == "harvestCreep") {
            HarvestCreep.run(creep);
        }
        if (creep.memory.role == "upgrader") {
            Upgrader$1.run(creep);
        }
        if (creep.memory.role == "builder") {
            Builder.run(creep);
        }
        if (creep.memory.role == "repairer") {
            Repairer.run(creep);
        }
        if (creep.memory.role == "crossSourceHarvester") {
            CrossSourceHarvester.run(creep);
        }
        if (creep.memory.role == "attacker") {
            Attacker.run(creep);
        }
        if (creep.memory.role == "claimer") {
            Claimer.run(creep);
        }
        if (creep.memory.role == "miner") {
            Miner.run(creep);
        }
        if (creep.memory.role == "trashHarvester") {
            TrashHarvester.run(creep);
        }
        if (creep.memory.role == "centerCreep") {
            CenterCreep.run(creep);
        }
        if (creep.memory.role == "roomClaimer") {
            RoomClaimer.run(creep);
        }
        //???
        if (creep.memory.role == "crossRoomBuilder") {
            crossRoomBuilder.run(creep);
        }
        if (creep.memory.role == "crossRoomAttacker") {
            crossRoomAttacker.run(creep);
        }
        if (creep.memory.role == "carrier") {
            Carrier.run(creep);
        }
    }
    //???????????????
    // TalkAll();
    Stats();
    if (Game.cpu.bucket == 10000) {
        Game.cpu.generatePixel();
    }
});

exports.loop = loop;
//# sourceMappingURL=main.js.map
