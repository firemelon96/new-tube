import { eq } from 'drizzle-orm';
import {
  VideoAssetCreatedWebhookEvent,
  VideoAssetErroredWebhookEvent,
  VideoAssetReadyWebhookEvent,
  VideoAssetTrackReadyWebhookEvent,
  VideoAssetDeletedWebhookEvent,
} from '@mux/mux-node/resources/webhooks';
import { headers } from 'next/headers';
import { mux } from '@/lib/mux';
import { db } from '@/db';
import { videos } from '@/db/schema';
import { UTApi } from 'uploadthing/server';

type WebhookEvent =
  | VideoAssetCreatedWebhookEvent
  | VideoAssetErroredWebhookEvent
  | VideoAssetReadyWebhookEvent
  | VideoAssetTrackReadyWebhookEvent
  | VideoAssetDeletedWebhookEvent;

const SIGNING_SECRET = process.env.MUX_WEBHOOK_SECRET;

export const POST = async (req: Request) => {
  if (!SIGNING_SECRET) {
    throw new Error('MUX_WEBHOOK_SECRET is not set');
  }

  const headersPayload = await headers();
  const muxSignature = headersPayload.get('mux-signature');

  if (!muxSignature) {
    throw new Response('No Signature found', { status: 401 });
  }

  const rawBody = await req.text();

  try {
    mux.webhooks.verifySignature(
      rawBody,
      {
        'mux-signature': muxSignature,
      },
      SIGNING_SECRET
    );
  } catch (error) {
    return new Response('Invalid signature', { status: 401 });
  }

  const payload = JSON.parse(rawBody) as WebhookEvent;

  switch (payload.type as WebhookEvent['type']) {
    case 'video.asset.created': {
      const data = payload.data as VideoAssetCreatedWebhookEvent['data'];

      if (!data.upload_id) {
        throw new Response('No upload ID found', { status: 400 });
      }

      await db
        .update(videos)
        .set({
          muxAssetId: data.id,
          muxStatus: data.status,
        })
        .where(eq(videos.muxUploadId, data.upload_id));
      break;
    }

    case 'video.asset.ready':
      {
        const data = payload.data as VideoAssetReadyWebhookEvent['data'];
        const playbackId = data.playback_ids?.[0].id;
        const duration = data.duration ? Math.round(data.duration * 1000) : 0;

        if (!data.upload_id) {
          throw new Response('Missing upload ID', { status: 400 });
        }

        if (!playbackId) {
          throw new Response('Missing playback ID', { status: 400 });
        }

        const tempThumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
        const tempPreviewUrl = `https://image.mux.com/${playbackId}/animated.gif`;

        const utapi = new UTApi();
        const [uploadedThumbnail, uploadedPreview] =
          await utapi.uploadFilesFromUrl([tempThumbnailUrl, tempPreviewUrl]);

        if (!uploadedPreview.data || !uploadedThumbnail.data) {
          throw new Response('Failed to upload thumbnail or preview', {
            status: 500,
          });
        }

        const { key: previewKey, ufsUrl: previewUrl } = uploadedPreview.data;
        const { key: thumbnailKey, ufsUrl: thumbnailUrl } =
          uploadedThumbnail.data;

        await db
          .update(videos)
          .set({
            muxStatus: data.status,
            muxPlaybackId: playbackId,
            muxAssetId: data.id,
            thumbnailUrl,
            previewKey,
            previewUrl,
            thumbnailKey,
            duration,
          })
          .where(eq(videos.muxUploadId, data.upload_id));
      }
      break;

    case 'video.asset.errored': {
      const data = payload.data as VideoAssetErroredWebhookEvent['data'];

      if (!data.upload_id) {
        throw new Response('Missing upload id', { status: 400 });
      }

      await db
        .update(videos)
        .set({ muxStatus: data.status })
        .where(eq(videos.muxUploadId, data.upload_id));

      break;
    }

    case 'video.asset.deleted': {
      const data = payload.data as VideoAssetDeletedWebhookEvent['data'];

      if (!data.upload_id) {
        throw new Response('Missing upload id', { status: 400 });
      }

      await db.delete(videos).where(eq(videos.muxUploadId, data.upload_id));

      break;
    }

    case 'video.asset.track.ready': {
      const data = payload.data as VideoAssetTrackReadyWebhookEvent['data'] & {
        asset_id: string;
      };

      const assetId = data.asset_id;
      const trackId = data.id;
      const status = data.status;

      if (!assetId) {
        throw new Response('Missing upload id', { status: 400 });
      }

      await db
        .update(videos)
        .set({ muxTrackId: trackId, muxTrackStatus: status })
        .where(eq(videos.muxAssetId, assetId));

      break;
    }
  }

  return new Response('Webhook received', { status: 200 });
};
