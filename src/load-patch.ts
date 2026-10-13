import { readFile } from 'node:fs/promises';

export async function loadPatch(
  path: string,
  number: number,
): Promise<{ id: number; data: Uint8Array }> {
  const fileData = await readFile(path);
  const resType = fileData[0] & 0b0111_1111;
  const id = (resType << 11) | (number & 0b111_1111_1111);
  return { id, data: fileData.subarray(2) };
}
