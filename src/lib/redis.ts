import { KV_REST_API_TOKEN, KV_REST_API_URL } from '$env/static/private';
import { Redis } from '@upstash/redis';

export const redis = new Redis({ url: KV_REST_API_URL, token: KV_REST_API_TOKEN });
