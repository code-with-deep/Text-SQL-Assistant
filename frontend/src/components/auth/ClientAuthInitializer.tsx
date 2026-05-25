'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export default function ClientAuthInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    // Try to auto-refresh session from cookies on mount
    initializeAuth().catch(() => {
      // Not logged in or expired, which is fine for public pages
    });
  }, [initializeAuth]);

  return <>{children}</>;
}
