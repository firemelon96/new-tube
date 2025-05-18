import { DEEFAULT_LIMIT } from '@/constants';
import { StudioView } from '@/modules/studio/ui/view/studio-view';
import { HydrateClient, trpc } from '@/trpc/server';

const StudioPage = async () => {
  await trpc.studio.getMany
    .prefetchInfinite({ limit: DEEFAULT_LIMIT })
    .catch((error) => console.error('prefetch error', error));

  return (
    <HydrateClient>
      <StudioView />
    </HydrateClient>
  );
};

export default StudioPage;
