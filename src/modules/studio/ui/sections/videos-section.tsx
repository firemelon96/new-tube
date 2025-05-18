'use client';
import { DEEFAULT_LIMIT } from '@/constants';
import { trpc } from '@/trpc/client';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export const VideosSection = () => {
  const data = trpc.studio.getMany.useSuspenseInfiniteQuery(
    {
      limit: DEEFAULT_LIMIT,
    },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
  return <div>{JSON.stringify(data)}</div>;
};
