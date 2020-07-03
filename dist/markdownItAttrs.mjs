/*! markdown-it-attrs 3.0.3-20 https://github.com//GerHobbelt/markdown-it-attrs @license MIT */

/**
 * parse {.class #id key=val} strings
 * @param {string} str: string to parse
 * @param {int} start: where to start parsing (including {)
 * @returns {2d array}: [['key', 'val'], ['class', 'red']]
 */
function getAttrs(str, start, options) {
  // not tab, line feed, form feed, space, solidus, greater than sign, quotation mark, apostrophe and equals sign
  const allowedKeyChars = /[^\t\n\f />"'=]/;
  const pairSeparator = ' ';
  const keySeparator = '=';
  const classChar = '.';
  const idChar = '#';
  const attrs = [];
  let key = '';
  let value = '';
  let parsingKey = true;
  let valueInsideQuotes = false; // read inside {}
  // start + left delimiter length to avoid beginning {
  // breaks when } is found or end of string

  for (let i = start + options.leftDelimiter.length; i < str.length; i++) {
    if (str.slice(i, i + options.rightDelimiter.length) === options.rightDelimiter) {
      if (key !== '') {
        attrs.push([key, value]);
      }

      break;
    }

    let char_ = str.charAt(i); // switch to reading value if equal sign

    if (char_ === keySeparator && parsingKey) {
      parsingKey = false;
      continue;
    } // {.class} {..css-module}


    if (char_ === classChar && key === '') {
      if (str.charAt(i + 1) === classChar) {
        key = 'css-module';
        i += 1;
      } else {
        key = 'class';
      }

      parsingKey = false;
      continue;
    } // {#id}


    if (char_ === idChar && key === '') {
      key = 'id';
      parsingKey = false;
      continue;
    } // {value="inside quotes"}


    if (char_ === '"' && value === '') {
      valueInsideQuotes = true;
      continue;
    }

    if (char_ === '"' && valueInsideQuotes) {
      valueInsideQuotes = false;
      continue;
    } // read next key/value pair


    if (char_ === pairSeparator && !valueInsideQuotes) {
      if (key === '') {
        // beginning or ending space: { .red } vs {.red}
        continue;
      }

      attrs.push([key, value]);
      key = '';
      value = '';
      parsingKey = true;
      continue;
    } // continue if character not allowed


    if (parsingKey && char_.search(allowedKeyChars) === -1) {
      continue;
    } // no other conditions met; append to key/value


    if (parsingKey) {
      key += char_;
      continue;
    }

    value += char_;
  }

  if (options.allowedAttributes && options.allowedAttributes.length) {
    let allowedAttributes = options.allowedAttributes;
    return attrs.filter(function (attrPair) {
      let attr = attrPair[0];

      function isAllowedAttribute(allowedAttribute) {
        return attr === allowedAttribute || allowedAttribute instanceof RegExp && allowedAttribute.test(attr);
      }

      return allowedAttributes.some(isAllowedAttribute);
    });
  }

  return attrs;
}
/**
 * add attributes from [['key', 'val']] list
 * @param {array} attrs: [['key', 'val']]
 * @param {token} token: which token to add attributes
 * @returns token
 */


function addAttrs(attrs, token) {
  for (let j = 0, l = attrs.length; j < l; ++j) {
    let key = attrs[j][0];

    if (key === 'class') {
      token.attrJoin('class', attrs[j][1]);
    } else if (key === 'css-module') {
      token.attrJoin('css-module', attrs[j][1]);
    } else {
      token.attrPush(attrs[j]);
    }
  }

  return token;
}
/**
 * Does string have properly formatted curly?
 *
 * start: '{.a} asdf'
 * middle: 'a{.b}c'
 * end: 'asdf {.a}'
 * only: '{.a}'
 *
 * @param {string} where to expect {} curly. start, middle, end or only.
 * @return {function(string)} Function which testes if string has curly.
 */


function hasDelimiters(where, options) {
  if (!where) {
    throw new Error('Parameter `where` not passed. Should be "start", "middle", "end" or "only".');
  }
  /**
   * @param {string} str
   * @return {boolean}
   */


  return function (str) {
    // we need minimum three chars, for example {b}
    let minCurlyLength = options.leftDelimiter.length + 1 + options.rightDelimiter.length;

    if (!str || typeof str !== 'string' || str.length < minCurlyLength) {
      return false;
    }

    function validCurlyLength(curly) {
      let isClass = curly.charAt(options.leftDelimiter.length) === '.';
      let isId = curly.charAt(options.leftDelimiter.length) === '#';
      return isClass || isId ? curly.length >= minCurlyLength + 1 : curly.length >= minCurlyLength;
    }

    let start, end, slice, nextChar;
    let rightDelimiterMinimumShift = minCurlyLength - options.rightDelimiter.length;

    switch (where) {
      case 'start':
        // first char should be {, } found in char 2 or more
        slice = str.slice(0, options.leftDelimiter.length);
        start = slice === options.leftDelimiter ? 0 : -1;
        end = start === -1 ? -1 : str.indexOf(options.rightDelimiter, rightDelimiterMinimumShift); // check if next character is not one of the delimiters

        nextChar = str.charAt(end + options.rightDelimiter.length);

        if (nextChar && options.rightDelimiter.indexOf(nextChar) !== -1) {
          end = -1;
        }

        break;

      case 'end':
        // last char should be }
        start = str.lastIndexOf(options.leftDelimiter);
        end = start === -1 ? -1 : str.indexOf(options.rightDelimiter, start + rightDelimiterMinimumShift);
        end = end === str.length - options.rightDelimiter.length ? end : -1;
        break;

      case 'only':
        // '{.a}'
        slice = str.slice(0, options.leftDelimiter.length);
        start = slice === options.leftDelimiter ? 0 : -1;
        slice = str.slice(str.length - options.rightDelimiter.length);
        end = slice === options.rightDelimiter ? str.length - options.rightDelimiter.length : -1;
        break;
    }

    return start !== -1 && end !== -1 && validCurlyLength(str.substring(start, end + options.rightDelimiter.length));
  };
}
/**
 * Removes last curly from string.
 */


function removeDelimiter(str, options) {
  const start = escapeRegExp(options.leftDelimiter);
  const end = escapeRegExp(options.rightDelimiter);
  let curly = new RegExp('[ \\n]?' + start + '[^' + start + end + ']+' + end + '$');
  let pos = str.search(curly);
  return pos !== -1 ? str.slice(0, pos) : str;
}
/**
 * Escapes special characters in string s such that the string
 * can be used in `new RegExp`. For example "[" becomes "\\[".
 *
 * @param {string} s Regex string.
 * @return {string} Escaped string.
 */


function escapeRegExp(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}
/**
 * find corresponding opening block
 */


function getMatchingOpeningToken(tokens, i) {
  if (tokens[i].type === 'softbreak') {
    return false;
  } // non closing blocks, example img


  if (tokens[i].nesting === 0) {
    return tokens[i];
  }

  let level = tokens[i].level;
  let type = tokens[i].type.replace('_close', '_open');

  for (; i >= 0; --i) {
    if (tokens[i].type === type && tokens[i].level === level) {
      return tokens[i];
    }
  }

  return false;
}

/**
 * If a pattern matches the token stream,
 * then run transform.
 */

function patternsConfig(options) {
  const __hr = new RegExp('^ {0,3}[-*_]{3,} ?' + escapeRegExp(options.leftDelimiter) + '[^' + escapeRegExp(options.rightDelimiter) + ']');

  return [{
    /**
     * ```python {.cls}
     * for i in range(10):
     *     print(i)
     * ```
     */
    name: 'fenced code blocks',
    tests: [{
      shift: 0,
      block: true,
      info: hasDelimiters('end', options)
    }],
    transform: (tokens, i) => {
      let token = tokens[i];
      let start = token.info.lastIndexOf(options.leftDelimiter);
      let attrs = getAttrs(token.info, start, options);
      addAttrs(attrs, token);
      token.info = removeDelimiter(token.info, options);
    }
  }, {
    /**
     * bla `click()`{.c} ![](img.png){.d}
     *
     * differs from 'inline attributes' as it does
     * not have a closing tag (nesting: -1)
     */
    name: 'inline nesting 0',
    tests: [{
      shift: 0,
      type: 'inline',
      children: [{
        shift: -1,
        type: str => str === 'image' || str === 'code_inline'
      }, {
        shift: 0,
        type: 'text',
        content: hasDelimiters('start', options)
      }]
    }],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let endChar = token.content.indexOf(options.rightDelimiter);
      let attrToken = tokens[i].children[j - 1];
      let attrs = getAttrs(token.content, 0, options);
      addAttrs(attrs, attrToken);

      if (token.content.length === endChar + options.rightDelimiter.length) {
        tokens[i].children.splice(j, 1);
      } else {
        token.content = token.content.slice(endChar + options.rightDelimiter.length);
      }
    }
  }, {
    /**
     * | h1 |
     * | -- |
     * | c1 |
     * {.c}
     */
    name: 'tables',
    tests: [{
      // let this token be i, such that for-loop continues at
      // next token after tokens.splice
      shift: 0,
      type: 'table_close'
    }, {
      shift: 1,
      type: 'paragraph_open'
    }, {
      shift: 2,
      type: 'inline',
      content: hasDelimiters('only', options)
    }],
    transform: (tokens, i) => {
      let token = tokens[i + 2];
      let tableOpen = getMatchingOpeningToken(tokens, i);
      let attrs = getAttrs(token.content, 0, options); // add attributes

      addAttrs(attrs, tableOpen); // remove <p>{.c}</p>

      tokens.splice(i + 1, 3);
    }
  }, {
    /**
     * *emphasis*{.with attrs=1}
     */
    name: 'inline attributes',
    tests: [{
      shift: 0,
      type: 'inline',
      children: [{
        shift: -1,
        nesting: -1 // closing inline tag, </em>{.a}

      }, {
        shift: 0,
        type: 'text',
        content: hasDelimiters('start', options)
      }]
    }],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let content = token.content;
      let attrs = getAttrs(content, 0, options);
      let openingToken = getMatchingOpeningToken(tokens[i].children, j - 1);
      addAttrs(attrs, openingToken);
      token.content = content.slice(content.indexOf(options.rightDelimiter) + options.rightDelimiter.length);
    }
  }, {
    /**
     * - item
     * {.a}
     */
    name: 'list softbreak',
    tests: [{
      shift: -2,
      type: 'list_item_open'
    }, {
      shift: 0,
      type: 'inline',
      children: [{
        position: -2,
        type: 'softbreak'
      }, {
        position: -1,
        type: 'text',
        content: hasDelimiters('only', options)
      }]
    }],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let content = token.content;
      let attrs = getAttrs(content, 0, options);
      let ii = i - 2;

      while (tokens[ii - 1] && tokens[ii - 1].type !== 'ordered_list_open' && tokens[ii - 1].type !== 'bullet_list_open') {
        ii--;
      }

      addAttrs(attrs, tokens[ii - 1]);
      tokens[i].children = tokens[i].children.slice(0, -2);
    }
  }, {
    /**
     * - nested list
     *   - with double \n
     *   {.a} <-- apply to nested ul
     *
     * {.b} <-- apply to root <ul>
     */
    name: 'list double softbreak',
    tests: [{
      // let this token be i = 0 so that we can erase
      // the <p>{.a}</p> tokens below
      shift: 0,
      type: str => str === 'bullet_list_close' || str === 'ordered_list_close'
    }, {
      shift: 1,
      type: 'paragraph_open'
    }, {
      shift: 2,
      type: 'inline',
      content: hasDelimiters('only', options),
      children: arr => arr.length === 1
    }, {
      shift: 3,
      type: 'paragraph_close'
    }],
    transform: (tokens, i) => {
      let token = tokens[i + 2];
      let content = token.content;
      let attrs = getAttrs(content, 0, options);
      let openingToken = getMatchingOpeningToken(tokens, i);
      addAttrs(attrs, openingToken);
      tokens.splice(i + 1, 3);
    }
  }, {
    /**
     * - end of {.list-item}
     */
    name: 'list item end',
    tests: [{
      shift: -2,
      type: 'list_item_open'
    }, {
      shift: 0,
      type: 'inline',
      children: [{
        position: -1,
        type: 'text',
        content: hasDelimiters('end', options)
      }]
    }],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let content = token.content;
      let attrs = getAttrs(content, content.lastIndexOf(options.leftDelimiter), options);
      addAttrs(attrs, tokens[i - 2]);
      let trimmed = content.slice(0, content.lastIndexOf(options.leftDelimiter));
      token.content = last(trimmed) !== ' ' ? trimmed : trimmed.slice(0, -1);
    }
  }, {
    /**
     * something with softbreak
     * {.cls}
     */
    name: '\n{.a} softbreak then curly in start',
    tests: [{
      shift: 0,
      type: 'inline',
      children: [{
        position: -2,
        type: 'softbreak'
      }, {
        position: -1,
        type: 'text',
        content: hasDelimiters('only', options)
      }]
    }],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let attrs = getAttrs(token.content, 0, options); // find last closing tag

      let ii = i + 1;

      while (tokens[ii + 1] && tokens[ii + 1].nesting === -1) {
        ii++;
      }

      let openingToken = getMatchingOpeningToken(tokens, ii);
      addAttrs(attrs, openingToken);
      tokens[i].children = tokens[i].children.slice(0, -2);
    }
  }, {
    /**
     * horizontal rule --- {#id}
     */
    name: 'horizontal rule',
    tests: [{
      shift: 0,
      type: 'paragraph_open'
    }, {
      shift: 1,
      type: 'inline',
      children: arr => arr.length === 1,
      content: str => str.match(__hr) !== null
    }, {
      shift: 2,
      type: 'paragraph_close'
    }],
    transform: (tokens, i) => {
      let token = tokens[i];
      token.type = 'hr';
      token.tag = 'hr';
      token.nesting = 0;
      let content = tokens[i + 1].content;
      let start = content.lastIndexOf(options.leftDelimiter);
      token.attrs = getAttrs(content, start, options);
      token.markup = content;
      tokens.splice(i + 1, 2);
    }
  }, {
    /**
     * end of {.block}
     */
    name: 'end of block',
    tests: [{
      shift: 0,
      type: 'inline',
      children: [{
        position: -1,
        content: hasDelimiters('end', options),
        type: t => t !== 'code_inline'
      }]
    }],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let content = token.content;
      let attrs = getAttrs(content, content.lastIndexOf(options.leftDelimiter), options);
      let ii = i + 1;

      while (tokens[ii + 1] && tokens[ii + 1].nesting === -1) {
        ii++;
      }

      let openingToken = getMatchingOpeningToken(tokens, ii);
      addAttrs(attrs, openingToken);
      let trimmed = content.slice(0, content.lastIndexOf(options.leftDelimiter));
      token.content = last(trimmed) !== ' ' ? trimmed : trimmed.slice(0, -1);
    }
  }];
} // get last element of array or string


function last(arr) {
  return arr.slice(-1)[0];
}

const defaultOptions = {
  leftDelimiter: '{',
  rightDelimiter: '}',
  allowedAttributes: [],
  ignore: null // callback(token)

};

function attributes(md, options_) {
  let options = Object.assign({}, defaultOptions);
  options = Object.assign(options, options_);
  const patterns = patternsConfig(options);

  function curlyAttrs(state) {
    let tokens = state.tokens;

    for (let i = 0; i < tokens.length; i++) {
      for (let p = 0; p < patterns.length; p++) {
        let pattern = patterns[p];
        let j = null; // position of child with offset 0

        let match = pattern.tests.every(t => {
          let res = test(tokens, i, t, options);

          if (res.j !== null) {
            j = res.j;
          }

          return res.match;
        });

        if (match) {
          pattern.transform(tokens, i, j);

          if (pattern.name === 'inline attributes' || pattern.name === 'inline nesting 0') {
            // retry, may be several inline attributes
            p--;
          }
        }
      }
    }
  }

  md.core.ruler.after('inline', 'curly_attributes', curlyAttrs);
}
/**
 * Test if t matches token stream.
 *
 * @param {array} tokens
 * @param {number} i
 * @param {object} t Test to match.
 * @return {object} { match: true|false, j: null|number }
 */


function test(tokens, i, t, options) {
  let res = {
    match: false,
    j: null // position of child

  };
  let ii = t.shift !== undefined ? i + t.shift : t.position;
  let token = get(tokens, ii); // supports negative ii
  // supports ignore token

  if (token === undefined || options.ignore && options.ignore(token)) {
    return res;
  }

  for (let key in t) {
    if (key === 'shift' || key === 'position') {
      continue;
    }

    if (token[key] === undefined) {
      return res;
    }

    if (key === 'children' && isArrayOfObjects(t.children)) {
      if (token.children.length === 0) {
        return res;
      }

      let match;
      let childTests = t.children;
      let children = token.children;

      if (childTests.every(tt => tt.position !== undefined)) {
        // positions instead of shifts, do not loop all children
        match = childTests.every(tt => test(children, tt.position, tt, options).match);

        if (match) {
          // we may need position of child in transform
          let j = last$1(childTests).position;
          res.j = j >= 0 ? j : children.length + j;
        }
      } else {
        for (let j = 0; j < children.length; j++) {
          match = childTests.every(tt => test(children, j, tt, options).match);

          if (match) {
            res.j = j; // all tests true, continue with next key of pattern t

            break;
          }
        }
      }

      if (match === false) {
        return res;
      }

      continue;
    }

    switch (typeof t[key]) {
      case 'boolean':
      case 'number':
      case 'string':
        if (token[key] !== t[key]) {
          return res;
        }

        break;

      case 'function':
        if (!t[key](token[key])) {
          return res;
        }

        break;

      case 'object':
        if (isArrayOfFunctions(t[key])) {
          let r = t[key].every(tt => tt(token[key]));

          if (r === false) {
            return res;
          }

          break;
        }

      // fall through for objects !== arrays of functions

      default:
        throw new Error(`Unknown type of pattern test (key: ${key}). Test should be of type boolean, number, string, function or array of functions.`);
    }
  } // no tests returned false -> all tests returns true


  res.match = true;
  return res;
}

function isArrayOfObjects(arr) {
  return Array.isArray(arr) && arr.length && arr.every(i => typeof i === 'object');
}

function isArrayOfFunctions(arr) {
  return Array.isArray(arr) && arr.length && arr.every(i => typeof i === 'function');
}
/**
 * Get n item of array. Supports negative n, where -1 is last
 * element in array.
 * @param {array} arr
 * @param {number} n
 */


function get(arr, n) {
  return n >= 0 ? arr[n] : arr[arr.length + n];
} // get last element of array, safe - returns {} if not found


function last$1(arr) {
  return arr.slice(-1)[0] || {};
} //module.exports = attributes;

export default attributes;
//# sourceMappingURL=markdownItAttrs.mjs.map
