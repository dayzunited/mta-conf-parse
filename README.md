# mta-conf-parse

Parse `mtaserver.conf` into a plain JS object with normalized resources list (always an array) and basic validation of resource names.

## Install

```bash
npm i mta-conf-parse
```

## Usage

```ts
import { parseServerConf } from 'mta-conf-parse';

const conf = parseServerConf('./mtaserver.conf');

console.log(conf.resource); // always an array of <resource> nodes
console.log(conf.servername); // first occurrence wins for non-resource tags
```

### Behavior
- Fails with `[ERR]` if XML is invalid or `<config>` root is missing.
- `<resource>` is always returned as an array (empty when none). Each entry must have a valid `src`; bad names are skipped with `[WARN]`.
- Other duplicated tags keep only the first value.

## API
- `parseServerConf(confPath: string): MTAServerConfConfig`
  - `resource: ResourceNode[]` � normalized resource nodes.
  - Other properties mirror the tags found in the config.

## License

MIT � 2026 dayzunited
