export class RestApi {
  private routes: Map<string, Function> = new Map();

  register(path: string, handler: Function): void {
    this.routes.set(path, handler);
  }

  async handle(path: string, payload: any): Promise<any> {
    const handler = this.routes.get(path);
    if (!handler) {
      throw new Error(`Route not found: ${path}`);
    }
    return handler(payload);
  }

  routesList(): string[] {
    return Array.from(this.routes.keys());
  }
}
