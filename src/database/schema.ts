// Database collection interface with MongoDB-like methods
export interface Collection<T = any> {
  find(query?: any): QueryBuilder<T>;
  findOne(query: any): Promise<T | null>;
  insertOne(doc: T): Promise<{ insertedId: string }>;
  updateOne(query: any, update: any): Promise<{ matchedCount: number; modifiedCount: number }>;
  deleteOne(query: any): Promise<{ deletedCount: number }>;
  count(query?: any): Promise<number>;
  
  // Aliases for easier usage (matching existing code patterns)
  insert(doc: T): Promise<{ insertedId: string }>;
  update(query: any, update: any): Promise<{ matchedCount: number; modifiedCount: number }>;
}

// Chainable query builder interface
export interface QueryBuilder<T = any> {
  sort(sortObj: any): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  skip(count: number): QueryBuilder<T>;
  exec(): Promise<T[]>;
  
  // Array-like methods for convenience
  reduce<U>(callback: (accumulator: U, currentValue: T, index: number, array: T[]) => U, initialValue: U): U;
  forEach(callback: (value: T, index: number, array: T[]) => void): void;
  map<U>(callback: (value: T, index: number, array: T[]) => U): U[];
  filter(callback: (value: T, index: number, array: T[]) => boolean): T[];
  
  // Make it iterable for array operations
  [Symbol.iterator](): Iterator<T>;
}

export interface Database {
  userProfiles: Collection<any>;
  xpTransactions: Collection<any>;
  achievements: Collection<any>;
  badges: Collection<any>;
  badgeEvents: Collection<any>;
  manualReviewQueue: Collection<any>;
  leaderboard: Collection<any>;
  cache?: CacheInterface;
}

// Cache interface with proper methods
export interface CacheInterface {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Collections would be MongoDB/PostgreSQL in production
// For testing, this uses in-memory storage
