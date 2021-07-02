import assert from 'assert';
import Md from '@gerhobbelt/markdown-it';
import attrs from '../index.js';

const md = Md().use(attrs, {
  leftDelimiter: '{{',
  rightDelimiter: '}}'
});

const src = 'asdf *asd*{{.c}} khg';

const res = md.render(src);

console.log(res);  // eslint-disable-line

assert.strictEqual(res, '<p>asdf <em class="c">asd</em> khg</p>\n');
