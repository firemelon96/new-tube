import { db } from '@/db';
import { videoReactions, videoViews } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const toggleReaction = async (
  userId: string,
  videoId: string,
  reaction: 'like' | 'dislike'
) => {
  const [existingVideoReaction] = await db
    .select()
    .from(videoReactions)
    .where(
      and(
        eq(videoReactions.videoId, videoId),
        eq(videoReactions.userId, userId),
        eq(videoReactions.type, reaction)
      )
    );

  if (existingVideoReaction) {
    //toggle off: remove the reaction
    return await db
      .delete(videoReactions)
      .where(
        and(
          eq(videoReactions.videoId, videoId),
          eq(videoReactions.userId, userId)
        )
      )
      .returning();
  }

  //adding or changing the reaction type
  return await db
    .insert(videoReactions)
    .values({
      videoId,
      userId,
      type: reaction,
    })
    .onConflictDoUpdate({
      target: [videoReactions.videoId, videoReactions.userId],
      set: {
        type: reaction,
        updatedAt: new Date(),
      },
    })
    .returning();
};

export const videoReactionsRouter = createTRPCRouter({
  like: protectedProcedure
    .input(z.object({ videoId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { videoId } = input;
      const { id: userId } = ctx.user;

      try {
        const [createdReaction] = await toggleReaction(userId, videoId, 'like');

        return createdReaction;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to toggle video reaction',
        });
      }
    }),
  dislike: protectedProcedure
    .input(z.object({ videoId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { videoId } = input;
      const { id: userId } = ctx.user;

      try {
        const [createdReaction] = await toggleReaction(
          userId,
          videoId,
          'dislike'
        );

        return createdReaction;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to toggle video reaction',
        });
      }
    }),
});
