const md = require('@gerhobbelt/markdown-it')();
//let markdownItAttrs = require('markdown-it-attrs');
const markdownItAttrs = require('../');
const assert = require('assert');

md.use(markdownItAttrs);

let src = '# header {.style-me}\n';
src += 'paragraph {data-toggle=modal}';

const res = md.render(src);

console.log(res);  // eslint-disable-line

assert.strictEqual(res, '<h1 class="style-me">header</h1>\n<p data-toggle="modal">paragraph</p>\n');
