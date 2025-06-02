import { db } from '@/db';
import { videoReactions, videoViews } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

export const videoReactionsRouter = createTRPCRouter({
  like: protectedProcedure
    .input(z.object({ videoId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { videoId } = input;
      const { id: userId } = ctx.user;

      try {
        const [existingVideoReaction] = await db
          .select()
          .from(videoReactions)
          .where(
            and(
              eq(videoReactions.videoId, videoId),
              eq(videoReactions.userId, userId),
              eq(videoReactions.type, 'like')
            )
          );

        if (existingVideoReaction) {
          const [deleteViewerReaction] = await db
            .delete(videoReactions)
            .where(
              and(
                eq(videoReactions.videoId, videoId),
                eq(videoReactions.userId, userId)
              )
            )
            .returning();

          return deleteViewerReaction;
        }

        const [createdVideoReaction] = await db
          .insert(videoReactions)
          .values({
            videoId,
            userId,
            type: 'like',
          })
          .onConflictDoUpdate({
            target: [videoReactions.videoId, videoReactions.userId],
            set: {
              type: 'like',
            },
          })
          .returning();

        return createdVideoReaction;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create video view',
        });
      }
    }),
  dislike: protectedProcedure
    .input(z.object({ videoId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { videoId } = input;
      const { id: userId } = ctx.user;

      try {
        const [existingVideoReaction] = await db
          .select()
          .from(videoReactions)
          .where(
            and(
              eq(videoReactions.videoId, videoId),
              eq(videoReactions.userId, userId),
              eq(videoReactions.type, 'dislike')
            )
          );

        if (existingVideoReaction) {
          const [deleteViewerReaction] = await db
            .delete(videoReactions)
            .where(
              and(
                eq(videoReactions.videoId, videoId),
                eq(videoReactions.userId, userId)
              )
            )
            .returning();

          return deleteViewerReaction;
        }

        const [createdVideoReaction] = await db
          .insert(videoReactions)
          .values({
            videoId,
            userId,
            type: 'dislike',
          })
          .onConflictDoUpdate({
            target: [videoReactions.videoId, videoReactions.userId],
            set: {
              type: 'dislike',
            },
          })
          .returning();

        return createdVideoReaction;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create video view',
        });
      }
    }),
});
