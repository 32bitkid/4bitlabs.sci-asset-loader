import { Resource } from '@4bitlabs/sci0';

export type IdFucntion = () => string;

export const defaultIdFn = (prefix: string, resourceId: number) => {
  const resType = Resource.getTypeStr(resourceId);
  const resNum = Resource.getNumber(resourceId);
  return `${prefix}/${resType.toLowerCase()}.${resNum.toString(10).padStart(3, '0')}`;
};
