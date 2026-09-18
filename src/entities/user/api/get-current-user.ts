import { api } from '@/shared/api/instance';
import type { ApiSchemas } from '@/shared/api/schema';

export type User = ApiSchemas['UserDto'];

export const currentUserQueryKey = ['current-user'] as const;

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<ApiSchemas['UserResponseDto']>('/users/me');

  return data.user;
}
