
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// see https://nodejs.org/docs/latest-v13.x/api/esm.html#esm_no_require_exports_module_exports_filename_dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function camelCase(str) {
  return str.replace(/-([\w])/g, (m, p1) => p1.toUpperCase());
}

const year = new Date().getFullYear();
const pkg = JSON.parse(fs.readFileSync(path.normalize(path.join(__dirname, '../package.json')), 'utf8'));
const version = pkg.version;
const name = pkg.name.replace(/^.*?\//, '');
const globalName = ((name) => {
  name = name.replace(/^.*?\//, '');
  name = name
    .replace('markdown-it', 'markdownit')
    .replace(/-([a-z])/g, function (m, p1) {
      return p1.toUpperCase();
    });
  return name;
})(pkg.name);

const removeScope = (name) => name.replace(/^@.*\//, '');
// safeVariableName: taken from microbundle: this is the dist/<name>.*.js used in that utility
const safeVariableName = ((name) =>
  camelCase(
    removeScope(name)
      .toLowerCase()
      .replace(/((^[^a-zA-Z]+)|[^\w.-])|([^a-zA-Z0-9]+$)/g, '')
  ))(name);

const license = pkg.license;

const text = `/*! ${name} ${version} https://github.com//GerHobbelt/${name} @license ${license} */\n\n`;
const match = `/*! ${name} `; // skip the file where this match is true

export default {
  text,
  match,
  version,
  globalName,
  packageName: name,
  safeVariableName,
  license,
  year
};
