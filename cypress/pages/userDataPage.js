export class UserDataPage {
  navigateTo() {
    cy.get("a").contains("You").click();
  }

  setArcherDetails(gender, bowType, ageGroup) {
    cy.get("select").eq(0).select(ageGroup);
    cy.get("select").eq(1).select(gender);
    cy.get("select").eq(2).select(bowType);
    cy.get("button").contains("Save").click();
  }

  setClassification(classification) {
    cy.get("select").eq(3).select(classification);
  }

  checkRoundRecommendation(roundName, shouldExist = true) {
    if (shouldExist) {
      cy.contains(roundName).should("exist");
    } else {
      cy.contains(roundName).should("not.exist");
    }
  }

  setMaxDistance(yards) {
    cy.get("input[type=\"range\"]").invoke("val", yards).trigger("input");
  }

}

export const userDataPage = new UserDataPage();