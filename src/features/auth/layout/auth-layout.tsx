import type { ReactNode } from 'react';

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return <main className='flex flex-1 items-center justify-center'>{children}</main>;
}
