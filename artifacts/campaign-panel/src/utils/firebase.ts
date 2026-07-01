export const isFirebaseConfigured = false;
export const db: any = null;
export const auth: any = null;
export const app: any = null;

export const initFirebasePromise: Promise<void> = Promise.resolve();

export function terminateFirestore(): void {}

export function collection(_db: any, _path: string): any {
  return null;
}

export function getDocs(_ref: any): Promise<any> {
  return Promise.resolve({ docs: [], empty: true, size: 0, forEach: () => {} });
}

export function setDoc(_ref: any, _data: any, _options?: any): Promise<void> {
  return Promise.resolve();
}

export function doc(_db: any, _collection: string, _id: string): any {
  return null;
}

export function deleteDoc(_ref: any): Promise<void> {
  return Promise.resolve();
}

export function getDoc(_ref: any): Promise<any> {
  return Promise.resolve({ exists: () => false, data: () => null, id: null });
}

export function query(..._args: any[]): any {
  return null;
}

export function limit(_n: number): any {
  return null;
}

export function where(_field: string, _op: string, _value: any): any {
  return null;
}

export function terminate(_db: any): Promise<void> {
  return Promise.resolve();
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: { userId: null, email: null },
    operationType,
    path
  };
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<void> {}
