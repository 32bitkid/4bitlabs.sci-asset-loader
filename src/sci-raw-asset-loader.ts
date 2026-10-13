import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import { collectSource } from './collect-source.js';
import { cyrb53bin } from './cybr53.js';
import { loadPatch } from './load-patch.js';
import { defaultIdFn, type IdFucntion } from './shared.js';

export interface SciRawAssetLoaderOptions {
  resources?: {
    [prefix: string]: {
      path: string;
      resourceName?: string;
      filter?: (id: number) => boolean;
    };
  };
  patches?: { number: number; path: string; prefix: string }[];
  idFn?: IdFucntion;
}

export function sciRawAssetLoader(options: SciRawAssetLoaderOptions) {
  const { idFn = defaultIdFn, resources = {}, patches = [] } = options;
  return {
    name: 'sci-raw-asset-loader',
    schema: z.object({
      id: z.number(),
      compression: z.union([z.literal(0), z.literal(1), z.literal(2)]),
      content: z.base64(),
    }),
    load: async ({ store, logger, parseData }) => {
      store.clear();

      const addData = async (
        prefix: string,
        resId: number,
        compression: number,
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
            compression: compression,
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
        await addData(prefix, resId, 0, data);
      }

      for (const [prefix, source] of Object.entries(resources)) {
        for await (const [header, data] of collectSource(source, logger)) {
          await addData(prefix, header.id, header.compression, data);
        }
      }
    },
  } satisfies Loader;
}
