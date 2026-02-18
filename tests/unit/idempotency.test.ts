import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";
import { getIdempotencyKeyFromRequest, hashIdempotencyKey } from "@/lib/edtech/idempotency";

describe("idempotency helpers", () => {
  it("reads and trims idempotency key headers", () => {
    const request = new Request("https://example.com", {
      headers: {
        "Idempotency-Key": "  publish-123  ",
      },
    });

    expect(getIdempotencyKeyFromRequest(request)).toBe("publish-123");
  });

  it("rejects overly long idempotency keys", () => {
    const request = new Request("https://example.com", {
      headers: {
        "Idempotency-Key": "x".repeat(129),
      },
    });

    expect(() => getIdempotencyKeyFromRequest(request)).toThrowError(ApiError);
  });

  it("hashes idempotency keys deterministically", () => {
    expect(hashIdempotencyKey("abc")).toBe(hashIdempotencyKey("abc"));
    expect(hashIdempotencyKey("abc")).not.toBe(hashIdempotencyKey("abcd"));
  });
});
