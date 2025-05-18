import { StudioView } from '@/modules/studio/ui/view/studio-view';
import { HydrateClient, trpc } from '@/trpc/server';

const StudioPage = async () => {
  return (
    <HydrateClient>
      <StudioView />
    </HydrateClient>
  );
};

export default StudioPage;
