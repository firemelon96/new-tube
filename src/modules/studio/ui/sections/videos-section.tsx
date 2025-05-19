'use client';
import { InfiniteScroll } from '@/components/infinite-scroll';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DEEFAULT_LIMIT } from '@/constants';
import { snakeCaseToTitle } from '@/lib/utils';
import { VideoThumbnail } from '@/modules/videos/ui/components/video-thumbnail';
import { trpc } from '@/trpc/client';
import { format } from 'date-fns';
import { Globe2Icon, LockIcon } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export const VideosSection = () => {
  return (
    <Suspense fallback={<VideoSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <VideosSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

const VideoSectionSkeleton = () => {
  return (
    <>
      <div className='border-y'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='pl-6 w-[510px]'>Video</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className='text-righ'>Views </TableHead>
              <TableHead className='text-righ'>Comments</TableHead>
              <TableHead className='text-righ pr-6'>Likes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className='pl-6'>
                  <div className='flex items-center gap-4'>
                    <Skeleton className='h-20 w-36' />
                    <div className='flex flex-col gap-2'>
                      <Skeleton className='h-4 w-[100px]' />
                      <Skeleton className='h-3 w-[150px]' />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-20' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-16' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-24' />
                </TableCell>
                <TableCell className='text-right'>
                  <Skeleton className='h-4 w-12 ml-auto' />
                </TableCell>
                <TableCell className='text-right'>
                  <Skeleton className='h-4 w-12 ml-auto' />
                </TableCell>
                <TableCell className='text-right pr-6'>
                  <Skeleton className='h-4 w-12 ml-auto' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

const VideosSectionSuspense = () => {
  const [videos, query] = trpc.studio.getMany.useSuspenseInfiniteQuery(
    {
      limit: DEEFAULT_LIMIT,
    },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
  return (
    <div>
      <div className='border-y'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='pl-6 w-[510px]'>Video</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className='text-righ'>Views </TableHead>
              <TableHead className='text-righ'>Comments</TableHead>
              <TableHead className='text-righ pr-6'>Likes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.pages
              .flatMap((page) => page.items)
              .map((video) => (
                <Link
                  href={`/studio/videos/${video.id}`}
                  key={video.id}
                  legacyBehavior
                >
                  <TableRow className='cursor-pointer'>
                    <TableCell className='pl-6'>
                      <div className='flex items-center gap-4'>
                        <div className='relative aspect-video w-3/6 shrink-0'>
                          <VideoThumbnail
                            duration={video.duration}
                            imageUrl={video.thumbnailUrl}
                            previewUrl={video.previewUrl}
                            title={video.title}
                          />
                        </div>
                        <div className='flex flex-col gap-y-1'>
                          <span className='text-sm line-clamp-1'>
                            {video.title}
                          </span>
                          <span className='text-xs text-muted-foreground line-clamp-1'>
                            {video.description || 'No description'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center'>
                        {video.visibility === 'private' ? (
                          <LockIcon className='size-4 mr-2' />
                        ) : (
                          <Globe2Icon className='size-4 mr-2' />
                        )}
                        {snakeCaseToTitle(video.visibility)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center'>
                        {snakeCaseToTitle(video.muxStatus || 'error')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(video.updatedAt, 'd MMM yyyy')}
                    </TableCell>
                    <TableCell className='text-right text-sm'>views</TableCell>
                    <TableCell className='text-right text-sm'>
                      comments
                    </TableCell>
                    <TableCell className='pr-6 text-right text-sm'>
                      likes
                    </TableCell>
                  </TableRow>
                </Link>
              ))}
          </TableBody>
        </Table>
      </div>
      <InfiniteScroll
        // isManual
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  );
};
