class DataManagementPage {
  navigateTo() {
    cy.visit("/", {
      onBeforeLoad(win) {
        delete win.navigator.__proto__.serviceWorker;
      }
    });
    cy.get("a").contains("Data").click();
  }

  resetData() {
    cy.get("button").contains("Reset").click();
  }

  importData(data) {
    const rawData = JSON.stringify(data);
    cy.get("textarea").type(rawData, { parseSpecialCharSequences: false, delay: 0 });
    cy.get("button").contains("Import").click();
  }
}

export default DataManagementPage;