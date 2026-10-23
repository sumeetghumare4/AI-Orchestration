export interface GrpcServiceDefinition {
  name: string;
  methods: GrpcMethod[];
}

export interface GrpcMethod {
  name: string;
  requestType: string;
  responseType: string;
}

export class GrpcServer {
  private services: Map<string, GrpcServiceDefinition> = new Map();

  registerService(definition: GrpcServiceDefinition): void {
    this.services.set(definition.name, definition);
  }

  getService(name: string): GrpcServiceDefinition | undefined {
    return this.services.get(name);
  }

  listServices(): string[] {
    return Array.from(this.services.keys());
  }
}
