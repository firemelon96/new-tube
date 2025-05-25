import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';

export const VideoReactions = () => {
  const viewerReaction: 'like' | 'dislike' = 'like';

  return (
    <div className='flex items-center flex-none'>
      <Button
        className='rounded-l-full rounded-r-none pr-3'
        variant={'secondary'}
      >
        <ThumbsUpIcon
          className={cn('size-5', viewerReaction === 'like' && 'fill-black')}
        />{' '}
        {1}
      </Button>
      <Separator orientation='vertical' className='h-7' />
      <Button
        className='rounded-r-full rounded-l-none pl-3'
        variant={'secondary'}
      >
        <ThumbsDownIcon
          className={cn('size-5', viewerReaction !== 'like' && 'fill-black')}
        />{' '}
        {1}
      </Button>
    </div>
  );
};
