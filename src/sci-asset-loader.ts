import { decompress } from '@4bitlabs/sci0';
import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import { collectSource } from './collect-source.js';
import { cyrb53bin } from './cybr53.js';
import { loadPatch } from './load-patch.js';
import { defaultIdFn, type IdFucntion } from './shared.js';

export interface SciAssetLoaderOptions {
  resources?: {
    [prefix: string]: {
      path: string;
      resourceName?: string;
      filter?: (id: number) => boolean;
      engine?: 'sci0' | 'sci01';
    };
  };
  patches?: { number: number; path: string; prefix: string }[];
  idFn?: IdFucntion;
}

export function sciAssetLoader(options: SciAssetLoaderOptions) {
  const { idFn = defaultIdFn, resources = {}, patches = [] } = options;
  return {
    name: 'sci-asset-loader',
    schema: z.object({
      id: z.number(),
      content: z.base64(),
    }),
    load: async (ctx) => {
      const { store, logger, parseData } = ctx;
      store.clear();

      const addData = async (
        prefix: string,
        resId: number,
        bytes: Uint8Array,
      ) => {
        const id = idFn(prefix, resId);

        if (store.has(id)) {
          logger.warn(`Duplicate resource: ${id} [SKIPPING]`);
          return;
        }

        const data = await parseData({
          id,
          data: {
            id: resId,
            content: z.util.uint8ArrayToBase64(bytes),
          },
        });

        store.set({
          id,
          data,
          digest: cyrb53bin(bytes),
        });
      };

      for (const { path, prefix, number } of patches) {
        const { id: resId, data } = await loadPatch(path, number);
        await addData(prefix, resId, data);
      }

      for (const [prefix, source] of Object.entries(resources)) {
        const engine = source.engine ?? 'sci0';
        for await (const [header, bytes] of collectSource(source, logger)) {
          await addData(
            prefix,
            header.id,
            decompress(engine, header.compression, bytes),
          );
        }
      }
    },
  } satisfies Loader;
}
