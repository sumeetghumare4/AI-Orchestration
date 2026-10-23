// SPDX-License-Identifier: MIT
import { RestApi } from '../index';

describe('RestApi', () => {
  let api: RestApi;

  beforeEach(() => {
    api = new RestApi();
  });

  describe('happy path', () => {
    test('should register and handle routes', async () => {
      const handler = jest.fn((payload: any) => ({ result: payload }));
      api.register('/test', handler);

      const payload = { data: 'test' };
      const result = await api.handle('/test', payload);

      expect(result).toEqual({ result: payload });
      expect(handler).toHaveBeenCalledWith(payload);
    });

    test('should handle multiple routes', async () => {
      api.register('/users', (payload: any) => ({ users: payload }));
      api.register('/posts', (payload: any) => ({ posts: payload }));

      const usersResult = await api.handle('/users', { id: 1 });
      expect(usersResult).toEqual({ users: { id: 1 } });

      const postsResult = await api.handle('/posts', { id: 2 });
      expect(postsResult).toEqual({ posts: { id: 2 } });
    });

    test('should maintain routes list', () => {
      api.register('/users', () => ({}));
      api.register('/posts', () => ({}));

      const routes = api.routesList();
      expect(routes).toContain('/users');
      expect(routes).toContain('/posts');
      expect(routes).toHaveLength(2);
    });

    test('should handle async handlers', async () => {
      const handler = jest.fn(async (payload: any) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { async: payload };
      });
      api.register('/async', handler);

      const result = await api.handle('/async', { data: 'test' });
      expect(result).toEqual({ async: { data: 'test' } });
    });
  });

  describe('error cases', () => {
    test('should throw error for non-existent route', async () => {
      await expect(api.handle('/non-existent', {})).rejects.toThrow('Route not found: /non-existent');
    });

    test('should handle handler errors', async () => {
      api.register('/error', () => {
        throw new Error('Handler error');
      });

      await expect(api.handle('/error', {})).rejects.toThrow('Handler error');
    });

    test('should return empty routes list when none registered', () => {
      const routes = api.routesList();
      expect(routes).toEqual([]);
    });
  });
});