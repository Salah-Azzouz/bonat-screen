import { apiGet } from './client';
import type { Branch } from '@/types/branch';

export async function getAllBranches(): Promise<Branch[]> {
  return apiGet<Branch[]>('/allbranch');
}
