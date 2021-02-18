import { SessionStorage } from "./session_storage";

export class LocalSessionStorage implements SessionStorage {
  private static NAME = "session";

  public save(session: string): void {
    localStorage.setItem(LocalSessionStorage.NAME, session);
  }

  public read(): string | undefined {
    return localStorage.getItem(LocalSessionStorage.NAME);
  }

  public clear(): void {
    localStorage.removeItem(LocalSessionStorage.NAME);
  }
}
