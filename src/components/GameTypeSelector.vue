<script setup>
import RoundCard from "./RoundCard.vue";
import { useRouter } from "vue-router";

const props = defineProps({  // Make sure to assign to a variable
  gameType: {
    type: String,
    required: true
  }
});

defineEmits(["changeGameType"]);
const router = useRouter();

function navigateToRoundSelection() {
  router.push({
    name: "selectRound",
    query: {
      returnTo: "score",
      currentRound: props.gameType  // Now using props.gameType
    }
  });
}
</script>

<template>
  <div>
    <!-- Replace button with RoundCard for the currently selected round -->
    <div class="current-round-container" @click="navigateToRoundSelection">
      <RoundCard
        v-if="gameType"
        :round="{ round: gameType }"
      />
      <div v-else class="select-placeholder">
        <span>Select the round you're shooting</span>
      </div>
    </div>
  </div>
</template>
<style scoped>

.current-round-container {
  cursor: pointer;
  transition: transform 0.1s ease;
  margin: 1em 0.5em 1em 0.5em;
}

.current-round-container:active {
  transform: scale(0.98);
}

.select-placeholder {
  width: 100%;
  padding: 1.5em;
  font-size: 1.2em;
  text-align: center;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-light);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  background-color: var(--color-background);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1em;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
}

.search-container {
  padding: 1em;
  border-bottom: 1px solid var(--color-border);
}

.search-container input {
  width: 100%;
  padding: 0.5em;
  font-size: 1em;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
}

.rounds-container {
  padding: 1em;
  overflow-y: auto;
}

.rounds-container h3 {
  margin-top: 0;
  margin-bottom: 0.5em;
}
</style>
