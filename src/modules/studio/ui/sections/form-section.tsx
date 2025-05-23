'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { videoUpdateSchema } from '@/db/schema';
import { trpc } from '@/trpc/client';
import {
  CopyCheckIcon,
  CopyIcon,
  Globe2Icon,
  ImagePlusIcon,
  Loader2Icon,
  LockIcon,
  MoreVertical,
  RotateCcwIcon,
  Sparkle,
  SparklesIcon,
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
import Image from 'next/image';
import { THUMBNAIL_FALLBACK } from '@/modules/videos/constants';
import { ThumbnailUploadModal } from '../components/thumbnail-upload-modal';
import { ThumbnailGenerateModal } from '../components/thumbnail-generate-modal';

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
      <div className='flex items-center justify-between mb-6'>
        <div className='space-y-2'>
          <Skeleton className='h-7 w-32' />
          <Skeleton className='h-4 w-40' />
        </div>
        <Skeleton className='h-9 w-24' />
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
        <div className='lg:col-span-3 space-y-8'>
          <div className='space-y-2'>
            <Skeleton className='h-5 w-16' />
            <Skeleton className='h-10 w-full' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-[220px] w-full' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-5 w-20' />
            <Skeleton className='h-[84px] w-[153px]' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-5 w-20' />
            <Skeleton className='h-[84px] w-full' />
          </div>
        </div>
        <div className='lg:col-span-2 space-y-8 flex flex-col'>
          <div className='flex flex-col gap-4 bg-[#f9f9f9] rounded-xl overflow-hidden'>
            <Skeleton className='aspect-video' />
            <div className='p-4 space-y-6'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-5 w-full' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-5 w-32' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-5 w-32' />
              </div>
            </div>
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-5 w-20' />
            <Skeleton className='h-10 w-full' />
          </div>
        </div>
      </div>
    </div>
  );
};

const FormSectionSuspense = ({ videoId }: FormSectionProps) => {
  const utils = trpc.useUtils();
  const router = useRouter();
  const [isCopy, setIsCopy] = useState(false);
  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);
  const [thumbnailGenerateOpen, setThumbnailGenerateOpen] = useState(false);
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

  const generateDescription = trpc.videos.generateDescription.useMutation({
    onSuccess: () => {
      toast.success('Background job started', {
        description: 'This will take a while',
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const generateTitle = trpc.videos.generateTitle.useMutation({
    onSuccess: () => {
      toast.success('Background job started', {
        description: 'This will take a while',
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const restoreThumbnail = trpc.videos.restoreThumbnail.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      utils.studio.getOne.invalidate({ id: videoId });
      toast.success('Thumbnail restored');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateVideo = trpc.videos.update.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      utils.studio.getOne.invalidate({ id: videoId });
      toast.success('Updated successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm<z.infer<typeof videoUpdateSchema>>({
    resolver: zodResolver(videoUpdateSchema),
    defaultValues: video,
  });

  const onSubmit = (data: z.infer<typeof videoUpdateSchema>) => {
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
    <>
      <ThumbnailGenerateModal
        open={thumbnailGenerateOpen}
        onOpenChange={setThumbnailGenerateOpen}
        videoId={videoId}
      />
      <ThumbnailUploadModal
        open={thumbnailModalOpen}
        onOpenChange={setThumbnailModalOpen}
        videoId={videoId}
      />
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
              <Button
                type='submit'
                disabled={updateVideo.isPending || !form.formState.isDirty}
              >
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
                    <FormLabel>
                      <div className='flex items-center gap-x-2'>
                        Title
                        <Button
                          size={'icon'}
                          variant={'outline'}
                          type='button'
                          className='rounded-full size-6 [&_svg]:size-3'
                          onClick={() => generateTitle.mutate({ id: videoId })}
                          disabled={
                            generateTitle.isPending || !video.muxTrackId
                          }
                        >
                          {generateTitle.isPending ? (
                            <Loader2Icon className='animate-spin' />
                          ) : (
                            <SparklesIcon />
                          )}
                        </Button>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder='Add a title to your video'
                      />
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
                    <FormLabel>
                      <div className='flex items-center gap-x-2'>
                        Description
                        <Button
                          size={'icon'}
                          variant={'outline'}
                          type='button'
                          className='rounded-full size-6 [&_svg]:size-3'
                          onClick={() =>
                            generateDescription.mutate({ id: videoId })
                          }
                          disabled={
                            generateDescription.isPending || !video.muxTrackId
                          }
                        >
                          {generateDescription.isPending ? (
                            <Loader2Icon className='animate-spin' />
                          ) : (
                            <SparklesIcon />
                          )}
                        </Button>
                      </div>
                    </FormLabel>
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
              <FormField
                control={form.control}
                name='thumbnailUrl'
                render={() => (
                  <FormItem>
                    <FormLabel>Thumbnail</FormLabel>
                    <FormControl>
                      <div className='p-0.5 border border-dashed border-neutral-400 relative h-[84px] w-[153px] group'>
                        <Image
                          src={video.thumbnailUrl ?? THUMBNAIL_FALLBACK}
                          fill
                          alt='Thumbnail'
                          className='object-cover'
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type='button'
                              size={'icon'}
                              className='bg-black/50 absolute hover:bg-black/50 top-1 right-1 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 duration-300 size-7'
                            >
                              <MoreVertical className='text-white' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='start' side='right'>
                            <DropdownMenuItem
                              onClick={() => setThumbnailModalOpen(true)}
                            >
                              <ImagePlusIcon className='size-4 mr-1' /> Change
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setThumbnailGenerateOpen(true)}
                            >
                              <SparklesIcon className='size-4 mr-1' />
                              AI-generated
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                restoreThumbnail.mutate({ id: videoId })
                              }
                              disabled={restoreThumbnail.isPending}
                            >
                              <RotateCcwIcon className='size-4 mr-1' /> Restore
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
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
                      <p className='text-muted-foreground text-xs'>
                        Video link
                      </p>
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
                        {snakeCaseToTitle(
                          video.muxTrackStatus || 'no_subtitles'
                        )}
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
    </>
  );
};
