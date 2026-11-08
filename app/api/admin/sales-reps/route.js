import handler from '@/server_api/admin/sales-reps.js';
import { createRouteHandler } from '@/lib/apiHandler';

export const dynamic = 'force-dynamic';

const handlers = createRouteHandler(handler);
export const { GET, POST, PUT, DELETE, PATCH, OPTIONS } = handlers;
