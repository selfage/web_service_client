export interface SessionStorage {
  save: (session: string) => Promise<void> | void;
  read: () => Promise<string | undefined> | string | undefined;
  clear: () => Promise<void> | void;
}
