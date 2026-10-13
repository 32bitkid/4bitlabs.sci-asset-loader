import { readdir, readFile } from 'node:fs/promises';
import { join as pathJoin } from 'node:path';
import {
  parseAllMappings,
  parseHeaderWithPayload,
  type ResourceHeader,
} from '@4bitlabs/sci0';
import type { AstroIntegrationLogger } from 'astro';
import regexpEscape from 'regexp.escape';

export interface CollectSourceOptions {
  path: string;
  resourceName?: string;
  filter?: (id: number) => boolean;
}

export async function* collectSource(
  options: CollectSourceOptions,
  logger: AstroIntegrationLogger,
): AsyncGenerator<[ResourceHeader, Uint8Array]> {
  const { filter, path, resourceName = 'RESOURCE' } = options;
  const RESOURCE = regexpEscape(resourceName);

  logger.info(`Scanning ${path} for ${resourceName}.map`);

  const files = await readdir(path);
  const mapPath = files.find((it) =>
    it.match(new RegExp(`^${RESOURCE}\\.MAP$`, 'i')),
  );
  if (!mapPath) {
    logger.error(`Resource root not found: ${path}`);
    return;
  }

  const matches = parseAllMappings(
    await readFile(pathJoin(path, mapPath)),
  ).filter(({ id }) => filter?.(id) ?? true);

  const uniqueMatches = [
    ...new Map(
      matches.map(({ id, file, offset }) => [id, { file, offset }]),
    ).values(),
  ];

  const resourceFiles = new Map<number, Uint8Array>();
  for (const file of new Set(uniqueMatches.map((it) => it.file))) {
    const packFile = files.find((it) =>
      it.match(
        new RegExp(
          `^${RESOURCE}\\.${file.toString(10).padStart(3, '0')}$`,
          'i',
        ),
      ),
    );

    if (!packFile) {
      logger.error(`Resource not found: ${file}`);
      return;
    }
    const packBytes = await readFile(pathJoin(path, packFile));
    resourceFiles.set(file, packBytes);
  }

  for (const { file, offset } of uniqueMatches) {
    const resource = resourceFiles.get(file);
    if (!resource) {
      logger.error(`Resource not found: ${file}`);
      continue;
    }
    const [header, payload] = parseHeaderWithPayload(resource, offset);
    yield [header, payload];
  }
}
