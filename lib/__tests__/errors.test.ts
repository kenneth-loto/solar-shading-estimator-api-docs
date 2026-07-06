import { describe, expect, test } from "bun:test";
import { getErrorMessage } from "../errors";

describe("getErrorMessage", () => {
  test("returns message from Error instance", () => {
    const error = new Error("something went wrong");

    expect(getErrorMessage(error)).toBe("something went wrong");
  });

  test("returns message from custom Error subclass", () => {
    class CustomError extends Error {}
    const error = new CustomError("custom failure");

    expect(getErrorMessage(error)).toBe("custom failure");
  });

  test("returns string as-is", () => {
    expect(getErrorMessage("raw string error")).toBe("raw string error");
  });

  test("converts number to string", () => {
    expect(getErrorMessage(404)).toBe("404");
  });

  test("converts null to string", () => {
    expect(getErrorMessage(null)).toBe("null");
  });

  test("converts undefined to string", () => {
    expect(getErrorMessage(undefined)).toBe("undefined");
  });

  test("converts boolean to string", () => {
    expect(getErrorMessage(false)).toBe("false");
  });

  test("converts plain object to string", () => {
    expect(getErrorMessage({ code: 500 })).toBe("[object Object]");
  });

  test("converts array to string", () => {
    expect(getErrorMessage([1, 2, 3])).toBe("1,2,3");
  });

  test("uses custom toString if defined", () => {
    const error = { toString: () => "custom error string" };

    expect(getErrorMessage(error)).toBe("custom error string");
  });

  test("converts empty string to string", () => {
    expect(getErrorMessage("")).toBe("");
  });

  test("converts 0 to string", () => {
    expect(getErrorMessage(0)).toBe("0");
  });
});
