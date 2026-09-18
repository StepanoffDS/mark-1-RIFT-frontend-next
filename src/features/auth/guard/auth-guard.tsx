'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import {
  currentUserQueryKey,
  getCurrentUser,
} from '@/entities/user/api/get-current-user';
import { AuthLayout } from '@/features/auth/layout/auth-layout';

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { error, isPending } = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    enabled: typeof window !== 'undefined',
  });
  const isUnauthorized =
    axios.isAxiosError(error) && error.response?.status === 401;

  useEffect(() => {
    if (isUnauthorized) router.replace('/login');
  }, [isUnauthorized, router]);

  if (isPending || isUnauthorized) {
    return <AuthLayout>Loading…</AuthLayout>;
  }

  if (error) {
    return <AuthLayout>Failed to verify the session.</AuthLayout>;
  }

  return children;
}
