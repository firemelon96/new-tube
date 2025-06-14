import { db } from '@/db';
import { videoViews } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

export const videoViewsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ videoId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { videoId } = input;
      const { id: userId } = ctx.user;

      try {
        const [existingVideoView] = await db
          .select()
          .from(videoViews)
          .where(
            and(eq(videoViews.videoId, videoId), eq(videoViews.userId, userId))
          );

        if (existingVideoView) {
          return existingVideoView;
        }

        const [createdVideoView] = await db
          .insert(videoViews)
          .values({
            videoId,
            userId,
          })
          .onConflictDoNothing()
          .returning();

        // If conflict occurred, fetch the existing record
        if (!createdVideoView) {
          const [existingView] = await db
            .select()
            .from(videoViews)
            .where(
              and(
                eq(videoViews.videoId, videoId),
                eq(videoViews.userId, userId)
              )
            );
          return existingView;
        }

        return createdVideoView;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create video view',
        });
      }
    }),
});
