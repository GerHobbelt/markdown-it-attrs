#!/usr/bin/env node

/* eslint no-console:0 */

import argparse from 'argparse';

async function action() {
  const hdrMod = await import('./header.js');
  const hdr = hdrMod.default;

  const cli = new argparse.ArgumentParser({
    prog: 'getGlobalName',
    version: hdr.version,
    addHelp: true
  });

  cli.addArgument([ 'type' ], {
    help: 'type of name/string to produce',
    nargs: '?',
    choices: [ 'global', 'package', 'version', 'license', 'microbundle' ]
  });

  const options = cli.parseArgs();

  function print(msg) {
    process.stdout.write(msg);
  }

  ////////////////////////////////////////////////////////////////////////////////

  switch (options.type) {
  default:
    cli.exit(1, cli.formatHelp());
    break;

  case 'version':
    print(hdr.version);
    cli.exit(0);
    break;

  case 'package':
    print(hdr.packageName);
    cli.exit(0);
    break;

  case 'global':
    print(hdr.globalName);
    cli.exit(0);
    break;

  case 'microbundle':
    print(hdr.safeVariableName);
    cli.exit(0);
    break;

  case 'license':
    print(hdr.license);
    cli.exit(0);
    break;
  }
}

action();
