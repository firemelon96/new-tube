'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { videoInsertSchema } from '@/db/schema';
import { trpc } from '@/trpc/client';
import {
  CopyCheckIcon,
  CopyIcon,
  Globe2Icon,
  LockIcon,
  MoreVertical,
  TrashIcon,
} from 'lucide-react';
import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { VideoPlayer } from '@/modules/videos/ui/components/video-player';
import Link from 'next/link';
import { snakeCaseToTitle } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface FormSectionProps {
  videoId: string;
}

export const FormSection = ({ videoId }: FormSectionProps) => {
  return (
    <Suspense fallback={<FormSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <FormSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  );
};

const FormSectionSkeleton = () => {
  return (
    <div>
      <Skeleton />
    </div>
  );
};

const FormSectionSuspense = ({ videoId }: FormSectionProps) => {
  const utils = trpc.useUtils();
  const router = useRouter();
  const [isCopy, setIsCopy] = useState(false);
  const [categories] = trpc.categories.getMany.useSuspenseQuery();
  const [video] = trpc.studio.getOne.useSuspenseQuery({ id: videoId });
  const removeVideo = trpc.videos.remove.useMutation({
    onSuccess: () => {
      toast.success('Video Deleted');
      router.push('/studio');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateVideo = trpc.videos.update.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate(),
        utils.studio.getOne.invalidate({ id: videoId });
      toast.success('Updated successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm<z.infer<typeof videoInsertSchema>>({
    resolver: zodResolver(videoInsertSchema),
    defaultValues: video,
  });

  const onSubmit = (data: z.infer<typeof videoInsertSchema>) => {
    updateVideo.mutate(data);
  };

  const fullUrl = `${
    process.env.VERCEL_URL || 'http://localhost:3000'
  }/videos/${videoId}`;

  const onCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setIsCopy(true);

    setTimeout(() => {
      setIsCopy(false);
    }, 2000);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} action=''>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-2xl font-bold'>Video details</h1>
            <p className='text-xs text-muted-foreground'>
              Manage your video details
            </p>
          </div>
          <div className='flex items-center gap-x-2'>
            <Button type='submit' disabled={updateVideo.isPending}>
              Save
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={'ghost'} size={'icon'}>
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={() => removeVideo.mutate({ id: videoId })}
                >
                  <TrashIcon className='size-4 mr-2' /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-5'>
          <div className='lg:col-span-3 space-y-8'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Add a title to your video' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Decription</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      rows={10}
                      className='resize-none pr-10'
                      placeholder='Add a description to your video'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* TODO: Add thumbnail field */}
            <FormField
              control={form.control}
              name='categoryId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl className='w-full'>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a category' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem value={cat.id} key={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          <div className='flex flex-col lg:col-span-2 space-y-8'>
            <div className='flex flex-col gap-4 bg-[#f9f9f9] rounded-xl overflow-hidden h-fit'>
              <div className='aspect-video overflow-hidden relative'>
                <VideoPlayer
                  playbackId={video.muxPlaybackId}
                  thumbnailUrl={video.thumbnailUrl}
                />
              </div>
              <div className='p-4 flex flex-col gap-y-6'>
                <div className='flex justify-between items-center gap-x-2'>
                  <div className='flex flex-col gap-y-1'>
                    <p className='text-muted-foreground text-xs'>Video link</p>
                    <div className='flex items-center gap-x-2'>
                      <Link href={`/videos/${video.id}`}>
                        <p className='line-clamp-1 text-sm text-blue-500'>
                          {fullUrl}
                        </p>
                      </Link>
                      <Button
                        variant={'ghost'}
                        size={'icon'}
                        className='shrink-0'
                        onClick={onCopy}
                        disabled={isCopy}
                        type='button'
                      >
                        {isCopy ? <CopyCheckIcon /> : <CopyIcon />}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className='flex justify-between items-center'>
                  <div className='flex flex-col gap-y-1'>
                    <p className='text-muted-foreground text-xs'>
                      Video status
                    </p>
                    <p className='text-sm'>
                      {snakeCaseToTitle(video.muxStatus || 'preparing')}
                    </p>
                  </div>
                </div>
                <div className='flex justify-between items-center'>
                  <div className='flex flex-col gap-y-1'>
                    <p className='text-muted-foreground text-xs'>
                      Subtitles status
                    </p>
                    <p className='text-sm'>
                      {snakeCaseToTitle(video.muxTrackStatus || 'no_subtitles')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <FormField
              control={form.control}
              name='visibility'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl className='w-full'>
                      <SelectTrigger>
                        <SelectValue placeholder='Select visibility' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='public'>
                        <Globe2Icon /> Public
                      </SelectItem>
                      <SelectItem value='private'>
                        <LockIcon /> Private
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  );
};
