import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";

export const useUserStore = defineStore("user", () => {
  const state = useLocalStorage("user", {
    lastBackupDate: null
  });

  function save(ageGroup, gender, bowType, classification, maxYards, name, constructiveCriticism) {
    state.value = {
      ageGroup, gender, bowType, classification, maxYards, name, constructiveCriticism
    };
  }

  function updateLastBackupDate() {
    state.value = {
      ...state.value,
      lastBackupDate: new Date().toISOString()
    };
  }

  function needsBackup() {
    const lastBackup = state.value.lastBackupDate;
    if (!lastBackup) return true;

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return new Date(lastBackup) < monthAgo;
  }


  return {
    user: state,
    save,
    updateLastBackupDate,
    needsBackup
  };
});
