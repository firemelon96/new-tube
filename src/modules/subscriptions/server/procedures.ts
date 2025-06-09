import { z } from 'zod';
import { db } from '@/db';
import { and, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { subscriptions } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';

export const subscriptionsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { userId } = input;

      if (userId === ctx.user.id) {
        throw new TRPCError({ code: 'BAD_GATEWAY' });
      }

      const [subscribe] = await db
        .insert(subscriptions)
        .values({ viewerId: ctx.user.id, creatorId: userId })
        .returning();

      return subscribe;
    }),
  remove: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { userId } = input;

      if (userId === ctx.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      const [unsubscribe] = await db
        .delete(subscriptions)
        .where(
          and(
            eq(subscriptions.viewerId, ctx.user.id),
            eq(subscriptions.creatorId, userId)
          )
        )
        .returning();

      return unsubscribe;
    }),
});
