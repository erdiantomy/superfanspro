/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from "vitest";

// ─── Chainable query builder mock ────────────────────
// Every method returns `this` so `.from("x").select("*").eq("a","b").order(...)` works.
// Terminal methods (execute) resolve with { data, error }.

type MockResponse = { data: any; error: any };

export function createMockQueryBuilder(response: MockResponse = { data: [], error: null }) {
  const builder: Record<string, any> = {};
  const methods = [
    "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike",
    "in", "is", "not", "or", "filter",
    "order", "limit", "range", "offset",
    "single", "maybeSingle",
    "match", "textSearch", "contains", "containedBy",
    "overlaps", "csv",
  ];
  for (const m of methods) {
    builder[m] = vi.fn().mockReturnValue(builder);
  }
  // Terminal — resolves the chain
  builder.then = vi.fn((resolve: (v: any) => any) => resolve(response));
  // Also allow await directly
  builder.single = vi.fn().mockResolvedValue(response);
  builder.maybeSingle = vi.fn().mockResolvedValue(response);

  // Make the builder itself thenable (so `await supabase.from(...).select(...)` works)
  const proxy = new Proxy(builder, {
    get(target, prop) {
      if (prop === "then") {
        return (resolve: (v: any) => any, reject?: (e: any) => any) => {
          return Promise.resolve(response).then(resolve, reject);
        };
      }
      return target[prop as string];
    },
  });

  return proxy;
}

// ─── Channel mock (Realtime) ─────────────────────────
function createMockChannel() {
  const ch: Record<string, any> = {};
  ch.on = vi.fn().mockReturnValue(ch);
  ch.subscribe = vi.fn().mockReturnValue(ch);
  ch.unsubscribe = vi.fn().mockReturnValue(ch);
  return ch;
}

// ─── Auth mock ───────────────────────────────────────
const authSubscription = { unsubscribe: vi.fn() };

// ─── Default mock data store ─────────────────────────
let mockResponses: Record<string, MockResponse> = {};
let mockRpcResponses: Record<string, MockResponse> = {};

export function setMockResponse(table: string, response: MockResponse) {
  mockResponses[table] = response;
}

export function setMockRpcResponse(fn: string, response: MockResponse) {
  mockRpcResponses[fn] = response;
}

export function resetMockResponses() {
  mockResponses = {};
  mockRpcResponses = {};
}

// ─── The mock supabase client ────────────────────────
export const mockSupabase = {
  from: vi.fn((table: string) => {
    const response = mockResponses[table] || { data: [], error: null };
    return createMockQueryBuilder(response);
  }),
  rpc: vi.fn((fn: string, _args?: any) => {
    const response = mockRpcResponses[fn] || { data: null, error: null };
    return Promise.resolve(response);
  }),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn((_cb: any) => ({ data: { subscription: authSubscription } })),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
    setSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  },
  channel: vi.fn((_name: string) => createMockChannel()),
  removeChannel: vi.fn(),
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
  },
};

// ─── Setup vi.mock ───────────────────────────────────
// Call this OR use vi.mock at the top of each test file:
//   vi.mock("@/integrations/supabase/client", () => ({
//     supabase: mockSupabase,
//   }));
