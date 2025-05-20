import { ResponsiveModal } from '@/components/responsive-modal';
import { UploadDropzone } from '@/lib/uploadthing';
import { trpc } from '@/trpc/client';

// import '@uploadthing/react/styles.css';

interface ThumbnailProps {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ThumbnailUploadModal = ({
  videoId,
  open,
  onOpenChange,
}: ThumbnailProps) => {
  const utils = trpc.useUtils();

  const onUploadComplete = () => {
    utils.studio.getOne.invalidate({ id: videoId });
    utils.studio.getMany.invalidate();
    onOpenChange(false);
  };

  return (
    <ResponsiveModal
      title='Upload a thumbnail'
      open={open}
      onOpenChange={onOpenChange}
    >
      <UploadDropzone
        endpoint='thumbnailUploader'
        input={{ videoId }}
        onClientUploadComplete={onUploadComplete}
        appearance={{
          button: {
            backgroundColor: 'red',
          },
          container: {
            padding: 15,
          },
        }}
      />
    </ResponsiveModal>
  );
};
