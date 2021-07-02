import assert from 'assert';
import Md from '@gerhobbelt/markdown-it';
import attrs from '../index.js';

const md = Md().use(attrs, {
  // allowedAttributes: ...
});

let src = '# header {.style-me}\n';
src += 'paragraph {data-toggle=modal}';

const res = md.render(src);

console.log(res);  // eslint-disable-line

assert.strictEqual(res, '<h1 class="style-me">header</h1>\n<p data-toggle="modal">paragraph</p>\n');
