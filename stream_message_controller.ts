import EventEmitter = require("events");

export interface StreamMessageController<T> {
  on(event: "data", listener: (chunk: string) => void): this;
  on(event: "end", listener: () => void): this;
}

export class StreamMessageController<T> extends EventEmitter {
  public push(message: T): void {
    this.emit(JSON.stringify(message));
  }
  public end(): void {
    this.emit("end");
  }
}
