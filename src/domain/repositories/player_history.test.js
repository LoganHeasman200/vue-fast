import { classificationList } from "@/domain/scoring/classificationList.js";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { PlayerHistory } from "@/domain/repositories/player_history.js";

beforeEach(() => {
  global.fetch = vi.fn((path) => {
    // Check if the path is for the 50+ age group
    if (path.includes("/50+.json")) {
      return Promise.resolve({
        json: () => Promise.resolve([
          { id: 1, gender: "Men", bowType: "Recurve", age: "50+", round: "windsor", score: 470 },
          { id: 2, gender: "Men", bowType: "Recurve", age: "50+", round: "windsor", score: 582 },
          { id: 3, gender: "Men", bowType: "Recurve", age: "50+", round: "windsor", score: 681 },
          { id: 4, gender: "Men", bowType: "Recurve", age: "50+", round: "windsor", score: 762 },
          // Add portsmouth round for 50+ age group
          { id: 5, gender: "Men", bowType: "Recurve", age: "50+", round: "portsmouth", score: 470 }
        ])
      });
    } else {
      // Return the original mock data for all other paths
      return Promise.resolve({
        json: () => Promise.resolve([
          { id: 1, gender: "Men", bowType: "Recurve", age: "Senior", round: "windsor", score: 490 },
          { id: 2, gender: "Men", bowType: "Recurve", age: "Senior", round: "windsor", score: 602 },
          { id: 3, gender: "Men", bowType: "Recurve", age: "Senior", round: "windsor", score: 701 },
          { id: 4, gender: "Men", bowType: "Recurve", age: "Senior", round: "windsor", score: 782 },
          // Add portsmouth round for senior age group
          { id: 5, gender: "Men", bowType: "Recurve", age: "Senior", round: "portsmouth", score: 500 }
        ])
      });
    }
  });
});


describe("player history", () => {
  test("keeps records sorted and adds top score indicator", async () => {
    const storage = { value: [] };
    const playerHistory = new PlayerHistory(storage);

    playerHistory.add(new Date().addDays(2), 456, "national 50", [1, 2, 3], "yd");
    playerHistory.add(new Date().addDays(5), 200, "national 50", [1, 2, 3], "yd");
    playerHistory.add(new Date().addDays(10), 123, "national 50", [1, 2, 3], "yd");
    playerHistory.add(new Date().addDays(10), 826, "windsor 50", [1, 2, 3], "yd");

    const sortedHistory = await playerHistory.sortedHistory("male", "senior", "recurve");
    expect(sortedHistory).toHaveLength(4);
    expect(sortedHistory[0].score).toEqual(123);
    expect(sortedHistory[0].topScore).toBeFalsy();
    expect(sortedHistory[1].topScore).toBeTruthy();
    expect(sortedHistory[2].topScore).toBeFalsy();
    expect(sortedHistory[3].topScore).toBeTruthy();
  });

  test("it can retrieve your personal best for a round", () => {
    const storage = { value: [] };
    const playerHistory = new PlayerHistory(storage);

    playerHistory.add(new Date(), 456, "national 50", [1, 2, 3], "yd");
    playerHistory.add(new Date(), 826, "windsor 50", [1, 2, 3], "yd");

    expect(playerHistory.personalBest("national 50")).toEqual(456);
    expect(playerHistory.personalBest("windsor 50")).toEqual(826);
    expect(playerHistory.personalBest("frostbite")).toBeUndefined();
  });

  test("it can total up the number of arrows shot", () => {
    const storage = { value: [] };
    const playerHistory = new PlayerHistory(storage);

    playerHistory.add(new Date(), 456, "national 50", [1, 2, 3], "yd");
    expect(playerHistory.totalArrows()).toEqual(3);
  });

  test("gets unique game types from recent games, ordered by most recent first", () => {
    const storage = { value: [] };
    const playerHistory = new PlayerHistory(storage);

    const now = new Date();
    const oneWeekAgo = new Date().addDays(-7);
    const twoWeeksAgo = new Date().addDays(-14);
    const sevenWeeksAgo = new Date().addDays(-49);

    playerHistory.add(twoWeeksAgo, 200, "national", [1, 2, 3], "yd");
    playerHistory.add(oneWeekAgo, 300, "windsor", [1, 2, 3], "yd");
    playerHistory.add(now, 100, "national", [1, 2, 3], "yd");
    playerHistory.add(sevenWeeksAgo, 400, "york", [1, 2, 3], "yd");

    const recentTypes = playerHistory.getRecentGameTypes();
    expect(recentTypes).toEqual(["national", "windsor"]);
  });

  test("filtered history - personal bests only", async () => {
    const storage = { value: [] };
    const playerHistory = new PlayerHistory(storage);
    const user = { gender: "male", ageGroup: "senior", bowType: "recurve" };

    playerHistory.add(new Date(), 100, "national", [1, 2, 3], "yd");
    playerHistory.add(new Date(), 200, "national", [1, 2, 3], "yd");
    playerHistory.add(new Date(), 150, "windsor", [1, 2, 3], "yd");

    const filters = { pbOnly: true };
    const filtered = await playerHistory.getFilteredHistory(filters, user);

    expect(filtered.length).toBe(2);
    expect(filtered.every(score => score.topScore)).toBe(true);
  });

  test("filtered history - by round", async () => {
    const storage = { value: [] };
    const playerHistory = new PlayerHistory(storage);
    const user = { gender: "male", ageGroup: "senior", bowType: "recurve" };

    playerHistory.add(new Date(), 100, "national", [1, 2, 3], "yd");
    playerHistory.add(new Date(), 200, "windsor", [1, 2, 3], "yd");

    const filters = { round: "national" };
    const filtered = await playerHistory.getFilteredHistory(filters, user);

    expect(filtered.length).toBe(1);
    expect(filtered[0].gameType).toBe("national");
  });

  test("filtered history - by date range", async () => {
    const storage = { value: [] };
    const playerHistory = new PlayerHistory(storage);
    const user = { gender: "male", ageGroup: "senior", bowType: "recurve" };

    const today = new Date();
    const lastWeek = new Date().addDays(-7);
    const twoWeeksAgo = new Date().addDays(-14);

    playerHistory.add(today, 100, "national", [1, 2, 3], "yd");
    playerHistory.add(lastWeek, 200, "national", [1, 2, 3], "yd");
    playerHistory.add(twoWeeksAgo, 300, "national", [1, 2, 3], "yd");

    const filters = {
      dateRange: {
        startDate: lastWeek,
        endDate: today
      }
    };
    const filtered = await playerHistory.getFilteredHistory(filters, user);

    expect(filtered.length).toBe(2);
  });

  test("filtered history - by classification", async () => {
    const storage = { value: [] };
    const user = { gender: "male", ageGroup: "senior", bowType: "recurve" };
    const playerHistory = new PlayerHistory(storage, user);

    playerHistory.add(new Date(), 490, "windsor", [1, 2, 3], "yd", user);
    playerHistory.add(new Date(), 100, "windsor", [1, 2, 3], "yd", user);

    const filters = { classification: "A3" };
    const filtered = await playerHistory.getFilteredHistory(filters);

    expect(filtered.length).toBe(1,
      `Expected to find 1 score with A3 classification. Found ${filtered.length} scores instead. Scores: ${JSON.stringify(filtered, null, 2)}`
    );

    if (filtered.length > 0) {
      expect(filtered[0].classification?.name).toBe("A3",
        `Expected classification A3 but got ${filtered[0].classification?.name}`
      );
    }
  });

  test("filtered history - combining multiple filters", async () => {
    const storage = { value: [] };
    const user = { gender: "male", ageGroup: "senior", bowType: "recurve" };
    const playerHistory = new PlayerHistory(storage, user);

    const today = new Date();

    playerHistory.add(today, 490, "windsor", [1, 2, 3], "yd", user);
    playerHistory.add(today, 490, "national", [1, 2, 3], "yd", user);
    playerHistory.add(today, 100, "windsor", [1, 2, 3], "yd", user);

    const filters = {
      round: "windsor",
      classification: "A3"
    };

    const filtered = await playerHistory.getFilteredHistory(filters);

    expect(filtered.length).toEqual(1,
      `Expected to find 1 score matching windsor round and A3 classification. Found ${filtered.length} scores instead. Scores: ${JSON.stringify(filtered, null, 2)}`
    );

    if (filtered.length > 0) {
      expect(filtered[0].gameType).toBe("windsor",
        `Expected round windsor but got ${filtered[0].gameType}`
      );
      expect(filtered[0].classification?.name).toBe("A3",
        `Expected classification A3 but got ${filtered[0].classification?.name}`
      );
    }
  });
});

describe("Classification with changing age groups", () => {
  test("classifications should be based on historical profile, not current profile", async () => {
    // Mock storage
    const storage = { value: [] };

    // Create a player history with a senior archer
    const seniorProfile = {
      gender: "male",
      ageGroup: "senior",
      bowType: "recurve",
      classification: "B3"
    };

    const playerHistory = new PlayerHistory(storage, seniorProfile);

    // Add a shoot as a senior
    const seniorShootId = playerHistory.add(
      "2023-01-01",
      500,
      "portsmouth",
      Array(60).fill(9), // 60 arrows of 9s
      "m",
      seniorProfile
    );

    // Get the history and check classification
    let history = await playerHistory.sortedHistory();
    const seniorShoot = history.find(item => item.id === seniorShootId);
    const seniorClassification = seniorShoot.classification?.name;

    // Now change to 50+ and add another shoot
    const veteranProfile = {
      gender: "male",
      ageGroup: "50+",
      bowType: "recurve",
      classification: "B3"
    };

    // Update the player history with the new profile
    const updatedPlayerHistory = new PlayerHistory(storage, veteranProfile);

    // Add a shoot as a 50+
    const veteranShootId = updatedPlayerHistory.add(
      "2023-06-01",
      500, // Same score
      "portsmouth", // Same round
      Array(60).fill(9), // Same arrows
      "m",
      veteranProfile
    );

    // Get the updated history
    history = await updatedPlayerHistory.sortedHistory();

    // Find both shoots
    const historicalSeniorShoot = history.find(item => item.id === seniorShootId);
    const veteranShoot = history.find(item => item.id === veteranShootId);

    // The senior shoot should still have its original classification
    expect(historicalSeniorShoot.classification?.name).toBe(seniorClassification);

    // The veteran shoot should have a potentially different classification
    // (50+ typically has lower thresholds, so same score might achieve higher classification)
    console.log(veteranShoot);
    console.log(historicalSeniorShoot);
    expect(veteranShoot.classification?.name).not.toBeUndefined();

    // If the classifications for 50+ are indeed more lenient, this would be true
    // This might need adjustment based on your actual classification data
    if (seniorClassification !== "GMB") { // If not already at the top
      expect(
        classificationList.indexOf(veteranShoot.classification?.name) <=
        classificationList.indexOf(seniorClassification)
      ).toBe(true);
    }
  });
});