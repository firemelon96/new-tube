import { createTRPCRouter } from '../init';
import { videosRouter } from '@/modules/videos/server/procedures';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videoViewsRouter } from '@/modules/video-views/procedures';
import { commentsRouter } from '@/modules/comments/server/procedures';
import { categoriesRouter } from '@/modules/categories/server/procedures';
import { videoReactionsRouter } from '@/modules/video-reactions/procedures';
import { subscriptionsRouter } from '@/modules/subscriptions/server/procedures';
export const appRouter = createTRPCRouter({
  studio: studioRouter,
  videos: videosRouter,
  comments: commentsRouter,
  categories: categoriesRouter,
  videoViews: videoViewsRouter,
  subscriptions: subscriptionsRouter,
  videoReactions: videoReactionsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
