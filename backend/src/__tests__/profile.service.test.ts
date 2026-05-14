import { calculateInvestableAmount } from "../services/profile.service.js";

describe("calculateInvestableAmount", () => {
  it("uses surplus, risk allocation, and horizon", () => {
    expect(calculateInvestableAmount(80000, 45000, "MEDIUM_TERM", "MODERATE")).toBe(168000);
  });
});
