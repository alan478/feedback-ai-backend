import { test, expect, describe } from "bun:test";

describe("API Tests", () => {
  test("health endpoint returns ok status", async () => {
    const response = await fetch("http://localhost:3000/health");
    const data = await response.json();
    expect(data.status).toBe("ok");
  });

  test("root endpoint returns welcome message", async () => {
    const response = await fetch("http://localhost:3000/");
    const text = await response.text();
    expect(text).toBe("Welcome to Alan Frontdesk AI Backend");
  });
});
