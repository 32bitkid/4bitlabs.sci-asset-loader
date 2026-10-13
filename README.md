# @4bitlabs/sci-asset-loader

[![License][license]][npm]
[![NPM Version][version]][npm]
[![NPM Downloads][dl]][npm]
[![Ko-fi][kofibadge]][kofi]

[npm]: https://www.npmjs.com/package/@4bitlabs/sci-asset-loader
[version]: https://img.shields.io/npm/v/%404bitlabs%2Fsci-asset-loader
[license]: https://img.shields.io/npm/l/%404bitlabs%2Fsci-asset-loader
[dl]: https://img.shields.io/npm/dy/%404bitlabs%2Fsci-asset-loader
[kofibadge]: https://shields.io/badge/ko--fi-donate-ff5f5f?logo=ko-fi&style=for-the-badgeKo-fi
[kofi]: https://ko-fi.com/thirtytwo


An Astro integration for loading [Sierra On-line][sierra] [SCI-engine][sci0] assets from resource files and patches.

## Install

```bash
npm install --save-dev astro @4bitlabs/sci0 @4bitlabs/sci-asset-loader
```

## Usage

There are two loaders available `sciAssetLoader` and `sciRawAssetLoader`

### sciAssetLoader

```ts
import { sciAssetLoader } from "@4bitlabs/sci-asset-loader";
```

This loader will load the _uncompressed_ bytes into the collection entry with the following shape:

```ts
type Data = {
  id: number;      /* The SCI-engine ID number */
  content: string; /* Base64 encoded raw data */
}
```

### sciRawAssetLoader

```ts
import { sciRawAssetLoader } from "@4bitlabs/sci-asset-loader";
```

This loader will load the _compressed_ bytes into the collection entry with the following shape:

```ts
type Data = {
  id: number;             /* The SCI-engine ID number */
  compression: 0 | 1 | 2; /* The compression algoithm used */
  content: string;        /* Base64 encoded compressed data */
}
```

See `decompress()` from `@4bitlabs/sci0` to manually decompress the data, when you need it.

## Configuration

Add to Astro `content.config.ts` file, the same as any custom loader.

```ts
import { sciRawAssetLoader } from "@4bitlabs/sci-asset-loader";

/* other collection data */

/**
 * The loader will fill this collection with *all* resources from RESOURCE.MAP in `./path/to/kq4`
 * with the default collection ids of: "kq4/pic.001"
 */
const sciData = defineCollection({
  loader: sciRawAssetLoader({
    resources: {
      kq4: { path: './path/to/kq4' },
    },
  })
})

export const collections = {
  /* other collections */
  sciData,
}
```

### Loading from multiple games

You can either point to multiple folders

```ts
const sciData = defineCollection({
  loader: sciRawAssetLoader({
    resources: {
      kq4: { path: './path/to/kq1' },
      sq3: { path: './path/to/sq3' },
    }
  })
})
```

or you can rename `RESOURCE.MAP` and `RESOURCE.XXX` files into the same folder and use `resourceName` option to load the correct ones:

```ts
const sciData = defineCollection({
  loader: sciRawAssetLoader({
    resources: {
      kq4: { 
        path: './path/to/sci0',
        resourceName: 'KQ4', /* will search for KG4.MAP and KG4.001 */
      },
      sq3: { 
        path: './path/to/sci0',
        resourceName: 'SQ3', /* will search for SQ3.MAP and SQ3.001 */
      },
    }
  })
})
```

### Loading from patches

You can load from `RESOURCE.*` packs that can be found in most Sierra On-Line releases, or you can load specific PATCH
files directly:


```ts
const sciData = defineCollection({
  loader: sciRawAssetLoader({
    patches: [
      { prefix: 'qg1', path: './path/to/patch/PIC.001', number: 1 },  /** loads "qg1/pic.001" */
      { prefix: 'qg1', path: './path/to/patch/VIEW.026', number: 26 } /** loads "qg1/view.026" */
    ],
  })
})
```

## Customization

### Filtering resources

You can filter resources to specific resource types, or resource number, to optimize the number of resources loaded 
into the collection, using the `filter` option:

```ts
import { Resource, ResourceType } from '@4bitlabs/sci0'; 

const sciData = defineCollection({
  loader: sciRawAssetLoader({
    idFn: (prefix: string, resourceId: number) => {
      /** your custom id logic here */
    }, 
    resources: {
      kq4: { 
        path: './path/to/kq4', 
        /** Only process resources that are PIC_TYPE resources */
        filter: (id: number) => Resource.getType(id) === ResourceType.PIC_TYPE,
      },
    },
  })
})
```


### Adjusting the default collection id generation scheme

The default id generation will always generate `"[prefix]/[type].[num]"`, where `[prefix]` is the key in the `resources`
object or `prefix` value of a patch. `[type]` and `[num]` will be generated from the decoded resource as defined by
the SCI-Engine. Some examples: `kq4/pic.001` or `qg1/view.029` or `sq3/font.000`

```ts
const sciData = defineCollection({
  loader: sciRawAssetLoader({
    idFn: (prefix: string, resourceId: number) => {
      /** your custom id logic here */
    }, 
    resources: {
      kq4: { path: './path/to/kq4' },
    },
  })
})
```

[sierra]: https://en.wikipedia.org/wiki/Sierra_Entertainment
[sci0]: http://sciwiki.sierrahelp.com/index.php/Sierra_Creative_Interpreter
