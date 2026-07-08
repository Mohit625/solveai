import { test } from "node:test";
import assert from "node:assert/strict";
import { ChatRepository } from "../../src/repositories/ChatRepository.js";

// Supabase's query builder is chainable AND awaitable — every method returns
// the same object, and awaiting it resolves via `.then`. This fake mirrors
// that shape so the repository can be tested without a real Supabase client.
function fakeDb(result) {
  const query = {
    select: () => query,
    insert: () => query,
    update: () => query,
    delete: () => query,
    eq: () => query,
    order: () => query,
    range: () => query,
    single: () => query,
    maybeSingle: () => query,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return { from: () => query };
}

test("create returns the inserted chat row", async () => {
  const repo = new ChatRepository(fakeDb({ data: { id: "1", title: "New Chat" }, error: null }));
  const chat = await repo.create("user-1", "New Chat");
  assert.equal(chat.id, "1");
  assert.equal(chat.title, "New Chat");
});

test("create throws AppError when Supabase returns an error", async () => {
  const repo = new ChatRepository(fakeDb({ data: null, error: { message: "db down" } }));
  await assert.rejects(() => repo.create("user-1"), /Failed to create chat/);
});

test("findByIdForUser throws AppError.notFound when no row matches", async () => {
  const repo = new ChatRepository(fakeDb({ data: null, error: null }));
  await assert.rejects(() => repo.findByIdForUser("missing-id", "user-1"), /Chat not found/);
});

test("findByIdForUser returns the row when found", async () => {
  const repo = new ChatRepository(fakeDb({ data: { id: "1", user_id: "user-1" }, error: null }));
  const chat = await repo.findByIdForUser("1", "user-1");
  assert.equal(chat.id, "1");
});

test("delete resolves when Supabase reports no error", async () => {
  const repo = new ChatRepository(fakeDb({ error: null }));
  await assert.doesNotReject(() => repo.delete("1"));
});

test("delete throws AppError when Supabase returns an error", async () => {
  const repo = new ChatRepository(fakeDb({ error: { message: "db down" } }));
  await assert.rejects(() => repo.delete("1"), /Failed to delete chat/);
});
