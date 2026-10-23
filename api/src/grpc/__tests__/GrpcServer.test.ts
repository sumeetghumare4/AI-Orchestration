// SPDX-License-Identifier: MIT
import { GrpcServer, GrpcServiceDefinition, GrpcMethod } from '../index';

describe('GrpcServer', () => {
  let server: GrpcServer;

  beforeEach(() => {
    server = new GrpcServer();
  });

  describe('happy path', () => {
    test('should register and retrieve service', () => {
      const serviceDef: GrpcServiceDefinition = {
        name: 'UserService',
        methods: [
          { name: 'GetUser', requestType: 'GetUserRequest', responseType: 'User' },
          { name: 'ListUsers', requestType: 'ListUsersRequest', responseType: 'UserList' }
        ]
      };
      server.registerService(serviceDef);

      const retrieved = server.getService('UserService');
      expect(retrieved).toEqual(serviceDef);
    });

    test('should list all registered services', () => {
      const service1: GrpcServiceDefinition = { name: 'Service1', methods: [] };
      const service2: GrpcServiceDefinition = { name: 'Service2', methods: [] };

      server.registerService(service1);
      server.registerService(service2);

      const services = server.listServices();
      expect(services).toContain('Service1');
      expect(services).toContain('Service2');
      expect(services).toHaveLength(2);
    });

    test('should overwrite existing service', () => {
      const service1: GrpcServiceDefinition = { name: 'UserService', methods: [] };
      const service2: GrpcServiceDefinition = { name: 'UserService', methods: [{ name: 'NewMethod', requestType: 'Request', responseType: 'Response' }] };

      server.registerService(service1);
      server.registerService(service2);

      const retrieved = server.getService('UserService');
      expect(retrieved?.methods).toHaveLength(1);
      expect(retrieved?.methods[0].name).toBe('NewMethod');
    });
  });

  describe('error cases', () => {
    test('should return undefined for non-existent service', () => {
      const service = server.getService('NonExistent');
      expect(service).toBeUndefined();
    });

    test('should return empty list when no services registered', () => {
      const services = server.listServices();
      expect(services).toEqual([]);
    });
  });
});