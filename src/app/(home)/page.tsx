import { HydrateClient, trpc } from '@/trpc/server';
import { ClientPage } from './client';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export default async function Home() {
  void trpc.hello.prefetch({ text: 'no' });

  return (
    <HydrateClient>
      <Suspense fallback={<p>loading...</p>}>
        <ErrorBoundary fallback={<p>Error...</p>}>
          <ClientPage />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
}
