<template>
  <div class="card shadow-lg mb-5 mx-auto devotion-generator-card" style="max-width: 60rem;">
    <div class="card-header bg-transparent py-3">
      <h2 class="card-title h4 d-flex align-items-center gap-2 mb-1">
        <i :class="selectedContentTypeInternal === 'devotion' ? 'bi bi-stars text-primary' : 'bi bi-lightbulb-fill text-primary'" style="font-size: 1.5rem;"></i>
        {{ generatorCardTitle }}
      </h2>
      <p class="card-text text-muted small">
        {{ generatorCardSubtitle }}
      </p>
    </div>
    <div class="card-body">
      <ul class="nav nav-tabs nav-fill mb-3" id="contentTypeTab" role="tablist">
        <li class="nav-item" role="presentation">
          <button 
            class="nav-link" 
            :class="{ active: selectedContentTypeInternal === 'devotion' }" 
            id="devotion-tab" 
            @click="setContentType('devotion')" 
            type="button" role="tab" aria-controls="devotion-panel" 
            :aria-selected="selectedContentTypeInternal === 'devotion'"
          >
            Devotion
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button 
            class="nav-link" 
            :class="{ active: selectedContentTypeInternal === 'faithIntegration' }" 
            id="faith-integration-tab" 
            @click="setContentType('faithIntegration')" 
            type="button" role="tab" aria-controls="faith-integration-panel" 
            :aria-selected="selectedContentTypeInternal === 'faithIntegration'"
          >
            Faith & Learning Idea
          </button>
        </li>
      </ul>

      <form @submit.prevent="submitForm">
        <div class="mb-3">
          <textarea
            id="topicInput"
            class="form-control form-control-lg"
            rows="3"
            :placeholder="topicInputPlaceholder"
            v-model="topicInputInternal"
            aria-label="Enter your topic or request"
          ></textarea>
        </div>
        <button
          type="submit"
          class="btn btn-gradient btn-lg w-100"
          :disabled="props.isLoading || !topicInputInternal.trim()"
        >
          <span v-if="props.isLoading">
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Generating...
          </span>
          <span v-else><i :class="selectedContentTypeInternal === 'devotion' ? 'bi bi-stars me-2' : 'bi bi-lightbulb me-2'"></i>{{ generateButtonText }}</span>
        </button>
      </form>
      <!-- generationError display will be handled by the parent App.vue -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

type ContentType = 'devotion' | 'faithIntegration';

const props = defineProps<{
  isLoading: boolean;
  initialSelectedType?: ContentType; 
}>();

const emit = defineEmits<{
  (e: 'generate-content', payload: { topic: string; type: ContentType }): void;
  (e: 'content-type-changed', type: ContentType): void;
}>();

const selectedContentTypeInternal = ref<ContentType>(props.initialSelectedType || 'devotion');
const topicInputInternal = ref('');

// Watch for changes in the initialSelectedType prop from the parent
watch(() => props.initialSelectedType, (newVal) => {
  if (newVal && newVal !== selectedContentTypeInternal.value) {
    selectedContentTypeInternal.value = newVal;
  }
});

const setContentType = (type: ContentType) => {
  selectedContentTypeInternal.value = type;
  emit('content-type-changed', type);
};

const generatorCardTitle = computed(() => {
  return selectedContentTypeInternal.value === 'devotion' ? 'Request Your Devotion' : 'Generate Faith & Learning Idea';
});

const generatorCardSubtitle = computed(() => {
  return selectedContentTypeInternal.value === 'devotion' 
    ? 'Enter a topic or feeling, and let AI craft a personalized devotion grounded in the Bible.' 
    : 'Describe a topic or subject, and let AI suggest ways to integrate faith and learning.';
});

const topicInputPlaceholder = computed(() => {
  return selectedContentTypeInternal.value === 'devotion' 
    ? "E.g., 'finding peace in hardship', 'gratitude', or 'guidance for a tough decision'"
    : "E.g., 'teaching biology through a faith lens', 'integrating ethics in computer science', or 'faith perspectives on history'";
});

const generateButtonText = computed(() => {
  return selectedContentTypeInternal.value === 'devotion' ? 'Generate Devotion' : 'Generate Idea';
});

const submitForm = () => {
  if (!topicInputInternal.value.trim()) return;
  emit('generate-content', {
    topic: topicInputInternal.value,
    type: selectedContentTypeInternal.value,
  });
  // topicInputInternal.value = ''; // Optionally clear input after submission
};
</script>

<style scoped>
/* Styles for GeneratorForm, copied and adapted from App.vue (state of Turn 19/21) */
.devotion-generator-card {
  /* padding: 1rem; /* This is now inherited from .card in App.vue */
  /* max-width: 60rem; /* This is an inline style on the App.vue template */
}

/* Card header icons are styled in App.vue's global scope using .devotion-generator-card .card-header .bi */
/* If more specific styling is needed here, it can be added. */
.card-header .bi { /* Example if we want to ensure color via this component */
 color: var(--primary-color) !important;
}


.card-title.h4 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  /* color: var(--bs-body-color); /* Inherited */
}

.card-text.text-muted {
  font-family: 'Roboto', sans-serif;
  font-weight: 400;
  color: var(--sidebar-item-muted-text-color) !important;
}

.nav-tabs {
  border-bottom: 1px solid var(--bs-border-color);
  margin-bottom: 1.5rem;
}

.nav-link {
  border: none;
  background-color: transparent;
  color: var(--sidebar-item-muted-text-color);
  padding: 0.75rem 1rem;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px; /* Aligns with the bottom border of nav-tabs */
  transition: color 0.2s ease, border-color 0.2s ease;
  font-family: 'Roboto', sans-serif;
}

.nav-link:hover {
  color: var(--bs-body-color);
  border-bottom-color: var(--bs-hover-bg);
}

.nav-link.active {
  color: var(--primary-color);
  background-color: transparent;
  border-bottom: 2px solid var(--primary-color);
  font-weight: 500; 
}

#topicInput.form-control { /* ID selector for specificity */
  background-color: #161F2A; 
  border: 1px solid var(--bs-border-color);
  color: var(--bs-body-color);
  border-radius: 4px;
  font-family: 'Roboto', sans-serif;
}
#topicInput.form-control::placeholder {
  color: var(--themed-placeholder-color);
  font-weight: 300;
}
#topicInput.form-control:focus {
  background-color: #161F2A;
  border-color: var(--primary-color);
  color: var(--bs-body-color);
  box-shadow: 0 0 0 0.2rem rgba(0, 169, 255, 0.2);
}

.btn-gradient {
  background-color: var(--primary-color);
  background-image: none;
  color: var(--text-on-primary); /* Updated text color */
  border: none;
  padding: 0.6rem 1.2rem; 
  font-weight: 500; 
  text-transform: uppercase; 
  letter-spacing: 0.5px; 
  border-radius: 4px; 
  transition: transform 0.2s ease, background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease; 
  font-family: 'Roboto', sans-serif;
}
.btn-gradient:hover {
  background-color: color-mix(in srgb, var(--primary-color) 90%, black);
  transform: translateY(-2px);
}
.btn-gradient i {
  color: var(--text-on-primary); /* Updated icon color */
}
.btn-gradient:disabled { 
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
