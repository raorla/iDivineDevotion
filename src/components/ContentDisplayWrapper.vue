<template>
  <div v-if="props.isLoading || (props.currentContent && props.currentContent.text && !props.generationError)" class="card shadow-lg mb-5 mx-auto current-devotion-card" style="max-width: 60rem;">
    <div class="card-header bg-transparent py-3">
      <h3 class="card-title h4 d-flex align-items-center gap-2 mb-0">
         <i :class="props.currentContent.type === 'devotion' ? 'bi bi-journal-text me-2' : 'bi bi-lightbulb me-2'" style="font-size: 1.5rem;"></i>
         Your {{ props.currentContent.type === 'devotion' ? 'Devotion' : 'Faith & Learning Idea' }}
      </h3>
    </div>
    <div class="card-body">
      <div v-if="props.isLoading" class="text-center py-3">
        <div class="spinner-border text-primary mb-2" style="width: 3rem; height: 3rem;" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="lead mt-2">Generating your content...</p>
        <div class="placeholder-glow mt-4">
          <span class="placeholder col-9 mb-2 py-2"></span>
          <span class="placeholder col-12 mb-2 py-2"></span>
          <span class="placeholder col-10 mb-2 py-2"></span>
          <span class="placeholder col-12 py-2"></span>
        </div>
      </div>
      
      <div v-else-if="props.currentContent && props.currentContent.text && !props.generationError">
        <div v-if="props.currentContent.type === 'devotion' && props.currentContent.verses && props.currentContent.verses.length > 0" class="first-verse-highlight">
          <span class="verse-reference-bold">{{ props.currentContent.verses[0] }}</span>
          <blockquote v-if="props.firstVerseText" class="verse-text-blockquote">
            “{{ props.firstVerseText }}”
          </blockquote>
        </div>
        <DevotionDisplay :devotion="formattedContentForDisplay" :content-type="props.currentContent.type || 'devotion'" />
        <div class="actions-toolbar text-center mt-4 pt-3">
          <button class="btn btn-gradient-success btn-sm me-2" @click="emitSave">
            <i class="bi bi-heart-fill me-2"></i>Save {{ props.currentContent.type === 'devotion' ? 'Devotion' : 'Idea' }}
          </button>
          <button class="btn btn-outline-info btn-sm" @click="emitShare" title="Share this content">
            <i class="bi bi-share-fill me-2"></i>Share
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <section v-else-if="!props.isLoading && (!props.currentContent || !props.currentContent.text) && !props.generationError" class="text-center placeholder-section mx-auto p-5 rounded">
    <i class="bi bi-lightbulb-fill"></i>
    <p class="lead">Select a type and enter a topic above to generate content.</p>
    <p class="text-muted">Or, select saved content from the sidebar.</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DevotionDisplay from './DevotionDisplay.vue'; 
import type { StoredContent } from '../composables/useDevotions';

const props = defineProps<{
  currentContent: StoredContent;
  isLoading: boolean;
  firstVerseText: string;
  generationError: string | null;
}>();

const emit = defineEmits<{
  (e: 'save-content'): void;
  (e: 'share-content'): void;
}>();

const formattedContentForDisplay = computed(() => {
  if (!props.currentContent || !props.currentContent.text) return props.currentContent;
  
  let text = props.currentContent.text;
  if (props.currentContent.type === 'devotion') {
    text = text.replace(/^(?:\*\*([^*]+)\*\*|([^:]+?))(:|—|--)(\s|$)/, (_match, p1, p2, p3, p4) => { // Renamed 'match' to '_match'
      const titleContent = p1 || p2;
      return `<strong class="devotion-title-intro">${titleContent.trim()}${p3}</strong>${p4}`;
    });
  }
  return {
    ...props.currentContent,
    text,
    verses: props.currentContent.verses || [],
  };
});

const emitSave = () => {
  emit('save-content');
};

const emitShare = () => {
  emit('share-content');
};
</script>

<style scoped>
/* Styles for ContentDisplayWrapper, copied and adapted from App.vue */
.current-devotion-card {
  /* padding: 1rem; /* Inherited from .card in App.vue */
}

.card-header .bi { 
  color: var(--primary-color) !important; 
}

.card-title.h4 { /* General card title style */
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  /* color: var(--bs-body-color); /* Inherited */
}

.first-verse-highlight {
  background-color: var(--bs-hover-bg); 
  border: 1px solid var(--bs-border-color); 
  border-left: 4px solid var(--primary-color); 
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem !important; 
  border-radius: 0.375rem; 
}
.first-verse-highlight .verse-reference-bold {
  font-weight: bold;
  font-size: 1.15rem;
  color: var(--primary-color); 
  display: block;
  margin-bottom: 0.5rem;
}
.first-verse-highlight .verse-text-blockquote {
  font-size: 1.05rem;
  border-left: none;
  padding-left: 0;
  margin-top: 0.25rem;
  margin-bottom: 0;
  background-color: transparent;
  color: var(--sidebar-item-muted-text-color); 
}

.actions-toolbar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem; 
  border-top: 1px solid var(--bs-border-color); /* Use theme border color */
  padding-top: 1rem; /* Added padding to match design */
  margin-top: 1rem; /* Added margin to match design */
}

.btn-gradient-success { 
  background-color: var(--secondary-accent-color); 
  background-image: none; 
  color: var(--save-btn-text-dark); 
  border: none;
  /* Other .btn styles (padding, font-weight, etc.) are inherited from App.vue */
}
.btn-gradient-success:hover {
  background-color: color-mix(in srgb, var(--secondary-accent-color) 90%, black); 
  transform: translateY(-2px);
}
.btn-gradient-success i {
  color: var(--save-btn-text-dark);
}

.btn-outline-info { 
  color: var(--primary-color); 
  border-color: var(--primary-color); 
  background-color: transparent;
}
.btn-outline-info:hover {
  color: white; 
  background-color: var(--primary-color); 
  border-color: var(--primary-color); 
}
.btn-outline-info i {
  color: var(--primary-color);
}
.btn-outline-info:hover i {
  color: white;
}

/* Placeholder section styling */
.placeholder-section {
  max-width: 42rem; 
  background-color: var(--bs-card-bg); 
  border: 1px solid var(--bs-border-color); 
  color: var(--sidebar-item-muted-text-color); 
  /* p-5 class (padding: 3rem) is applied on the element in template */
  /* rounded class is applied on the element in template */
  /* text-center class is applied on the element in template */
}
.placeholder-section .lead {
  color: var(--bs-body-color); 
  font-size: 1.1rem; 
  margin-bottom: 0.5rem !important;
  font-family: 'Roboto', sans-serif;
}
.placeholder-section .text-muted { 
   color: var(--sidebar-item-muted-text-color) !important;
   font-size: 0.9rem;
   font-family: 'Roboto', sans-serif;
}
.placeholder-section .bi-lightbulb-fill {
  font-size: 3rem; 
  color: var(--primary-color); 
  opacity: 0.6; 
  margin-bottom: 1rem !important; 
}

/* Loading placeholder styles from App.vue */
.lead.mt-2 { 
  font-family: 'Roboto', sans-serif;
}

/* :deep styles for DevotionDisplay */
:deep(.devotion-display-content .main-devotion-text) { 
  color: var(--bs-body-color) !important; 
}
:deep(.devotion-display-content .verses-section-title) { 
   color: var(--bs-body-color) !important; 
}
:deep(.devotion-display-content .list-group-item) {
  color: var(--bs-body-color) !important; 
  background-color: transparent !important; 
}
:deep(.devotion-display-content .list-group-item a) {
  color: var(--primary-color) !important; 
}
:deep(.devotion-display-content .list-group-item a:hover) {
  color: color-mix(in srgb, var(--primary-color) 80%, white) !important; 
}
:deep(.devotion-display-content hr) {
    background-color: var(--bs-border-color); 
}
:deep(.devotion-title-intro) {
  font-weight: 700; 
  font-family: 'Montserrat', sans-serif;
}
:deep(.inline-verse-link) { 
  font-weight: bold;
  font-style: italic;
  color: var(--primary-color); 
}
:deep(.inline-verse-link:hover) {
  color: color-mix(in srgb, var(--primary-color) 80%, white); 
}

</style>
