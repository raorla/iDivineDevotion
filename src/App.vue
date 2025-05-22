<template>
  <div id="app" :class="{ 'sidebar-collapsed': isSidebarCollapsed, 'mobile-view': isMobile }">
    <div v-if="isMobile && !isSidebarCollapsed" class="sidebar-overlay" @click="toggleSidebar"></div>
    
    <SidebarNav 
      :savedContent="savedContent"
      :isSidebarCollapsed="isSidebarCollapsed"
      :isMobile="isMobile"
      @toggle-sidebar="toggleSidebar"
      @view-content="viewSavedContent"
      @delete-content="handleDeleteContent"
    />

    <div class="main-content">
      <button class="btn btn-sm btn-outline-light sidebar-toggle-btn-main" @click="toggleSidebar" v-if="isSidebarCollapsed">
         <i class="bi bi-list"></i>
      </button>
      <header class="text-center mb-5">
        <h1 class="display-4 app-title">DivineDevotion</h1>
        <p class="lead">Your AI-powered spiritual companion</p>
      </header>

      <GeneratorForm 
        :isLoading="isLoading"
        :initialSelectedType="selectedContentTypeForParent"
        @generate-content="handleGenerateContentFromForm"
        @content-type-changed="updateSelectedContentType"
      />
      <div v-if="generationError && !isLoading" class="alert alert-danger mt-3 mx-auto" role="alert" style="max-width: 60rem;">
         <strong>Error:</strong> {{ generationError }}
      </div>

      <ContentDisplayWrapper
        :currentContent="currentContent"
        :isLoading="isLoading"
        :firstVerseText="firstVerseText"
        :generationError="generationError" 
        @save-content="handleSaveCurrentContent"
        @share-content="handleShareContent"
      />
      
      <div v-if="showSaveConfirmation" class="alert alert-success-custom alert-dismissible fade show mt-3" role="alert">
        <i class="bi bi-check-circle-fill me-2"></i>Content saved successfully!
        <button type="button" class="btn-close btn-close-white" @click="showSaveConfirmation = false" aria-label="Close"></button>
      </div>

      <div v-if="showShareAlert" class="alert alert-info-custom alert-dismissible fade show mt-3" role="alert">
        <i class="bi bi-info-circle-fill me-2"></i>{{ shareAlertMessage }}
        <button type="button" class="btn-close btn-close-white" @click="showShareAlert = false" aria-label="Close"></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import SidebarNav from './components/SidebarNav.vue'; 
import GeneratorForm from './components/GeneratorForm.vue'; 
import ContentDisplayWrapper from './components/ContentDisplayWrapper.vue';
import useOpenAI from './composables/useOpenAI';
import useContentStorage, { type StoredContent } from './composables/useDevotions'; 

type ContentType = 'devotion' | 'faithIntegration';

const selectedContentTypeForParent = ref<ContentType>('devotion');

const currentContent = ref<StoredContent>({
  id: '',
  text: '',
  verses: [],
  topic: '', 
  type: selectedContentTypeForParent.value, 
});
const firstVerseText = ref(''); 

const { generateOpenAIContent, isLoading, error: generationError } = useOpenAI();
const { savedContent, saveContent, deleteContent, loadContent } = useContentStorage();
const showSaveConfirmation = ref(false);
const showShareAlert = ref(false);
const shareAlertMessage = ref('');

const isMobile = ref(false);
const isSidebarCollapsed = ref(window.innerWidth <= 768);

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  loadContent();
  checkMobile();
  if (isMobile.value) {
    isSidebarCollapsed.value = true;
  }
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

watch(() => (currentContent.value.type === 'devotion' && currentContent.value.verses && currentContent.value.verses[0]), async (verse) => {
  if (!verse) {
    firstVerseText.value = ''; return;
  }
  const match = verse.match(/^(\d*\s*[a-zA-Z\s]+)\s*(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) { firstVerseText.value = ''; return; }
  const book = match[1].trim().toLowerCase().replace(/\s+/g, '');
  const chapter = match[2];
  const startVerse = match[3];
  const apiUrl = `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/en-kjv/books/${book}/chapters/${chapter}/verses/${startVerse}.json`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) { firstVerseText.value = ''; return; }
    const data = await response.json();
    firstVerseText.value = data.text ? data.text.trim() : '';
  } catch { firstVerseText.value = ''; }
}, { immediate: true });

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

const updateSelectedContentType = (newType: ContentType) => {
  selectedContentTypeForParent.value = newType;
};

const handleGenerateContentFromForm = async (payload: { topic: string; type: ContentType }) => {
  if (!payload.topic.trim()) return;
  const newId = `content-${Date.now()}`;
  currentContent.value = { id: newId, text: '', verses: [], topic: payload.topic, type: payload.type };
  generationError.value = null; 
  try {
    const result = await generateOpenAIContent(payload.topic, payload.type);
    currentContent.value = { 
      id: newId, text: result.text, verses: result.verses || [], 
      topic: payload.topic, type: payload.type 
    };
  } catch (err: any) {
    console.error('Error generating content in App.vue component:', err);
  }
};

const handleSaveCurrentContent = () => { 
  if (currentContent.value.text) {
    if (!currentContent.value.id) { currentContent.value.id = `content-${Date.now()}`; }
    const isAlreadySaved = savedContent.value.some(
      (d) => d.id === currentContent.value.id || (d.text === currentContent.value.text && d.topic === currentContent.value.topic && d.type === currentContent.value.type)
    );
    if (!isAlreadySaved) {
      saveContent({ ...currentContent.value }); 
      showSaveConfirmation.value = true;
      setTimeout(() => { showSaveConfirmation.value = false; }, 3000);
    } else {
      shareAlertMessage.value = 'This content is already saved.';
      showShareAlert.value = true;
      setTimeout(() => { showShareAlert.value = false; }, 3000);
    }
  }
};

const handleDeleteContent = (id?: string) => { 
  if (!id) return;
  const itemToDelete = savedContent.value.find(item => item.id === id);
  if (itemToDelete && currentContent.value.id === itemToDelete.id) {
      currentContent.value = { id: `content-${Date.now()}`, text: '', verses: [], topic: '', type: selectedContentTypeForParent.value };
  }
  deleteContent(id); 
};

const viewSavedContent = (content: StoredContent) => { 
  currentContent.value = { ...content };
  selectedContentTypeForParent.value = content.type || 'devotion'; 
  if (isMobile.value && !isSidebarCollapsed.value) { 
    toggleSidebar();
  }
};

const handleShareContent = async () => { 
  if (!currentContent.value.text) return;
  const title = currentContent.value.topic 
    ? `${currentContent.value.type === 'devotion' ? 'Devotion' : 'Faith & Learning Idea'}: ${currentContent.value.topic}` 
    : `A Divine ${currentContent.value.type === 'devotion' ? 'Devotion' : 'Idea'}`;
  let shareText = currentContent.value.text;
  if (currentContent.value.type === 'devotion' && currentContent.value.verses && currentContent.value.verses.length > 0) {
    const versesText = currentContent.value.verses.join("\n");
    shareText += `\n\nKey Verses:\n${versesText}`;
  }
  if (navigator.share) {
    try {
      await navigator.share({ title: title, text: shareText });
      shareAlertMessage.value = 'Content shared successfully!';
      showShareAlert.value = true;
      setTimeout(() => { showShareAlert.value = false; }, 3000);
    } catch (err) {
      if ((err as DOMException).name !== 'AbortError') {
        console.error('Error sharing, falling back to clipboard: ', err);
        await copyToClipboard(shareText, 'fallback'); 
      }
    }
  } else {
    await copyToClipboard(shareText, 'direct');
  }
};

const copyToClipboard = async (text: string, context: 'fallback' | 'direct' = 'direct') => {
  try {
    await navigator.clipboard.writeText(text);
    if (context === 'fallback') {
      shareAlertMessage.value = 'Sharing failed, content copied to clipboard!';
    } else {
      shareAlertMessage.value = 'Content copied to clipboard!';
    }
    showShareAlert.value = true;
  } catch (err) {
    console.error('Failed to copy: ', err);
    shareAlertMessage.value = 'Failed to copy content to clipboard.';
    showShareAlert.value = true;
  } finally {
    setTimeout(() => { showShareAlert.value = false; }, 3000);
  }
};
</script>

<style>
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css");

/* Font Definitions */
body {
  font-family: 'Roboto', sans-serif;
  font-weight: 400;
}

h1, h2, h3, h4, h5, h6,
.app-title,
.card-title, /* General card titles if any directly in App.vue */
:deep(.devotion-title-intro) { /* :deep for titles in child components */
  font-family: 'Montserrat', sans-serif;
}

button, 
input, 
textarea, 
.form-control, /* General .form-control styles */
.btn,
/* .nav-link, */ /* Specific nav-link for tabs moved to GeneratorForm */
.form-label,
.alert, 
.badge {
  font-family: 'Roboto', sans-serif;
}

/* General App Styles */
:root {
  --primary-color: #00A9FF; 
  --secondary-accent-color: #FFB800; 
  --primary-gradient: linear-gradient(to right, #00A9FF, #007acc); 
  --success-gradient: linear-gradient(to right, #FFB800, #cc9300); 
}

[data-bs-theme="dark"] {
  --bs-body-bg: #101821; 
  --bs-body-color: #E1E1E1; 
  --bs-border-color: #0D121A; 
  --bs-card-bg: #1A2430; 
  --bs-hover-bg: #253342; 
  /* --sidebar-bg-dark: linear-gradient(to bottom, #1A2430, #101821); /* Sidebar uses solid now */
  --save-btn-bg-dark: var(--success-gradient); 
  --save-btn-text-dark: #101821; 
  --save-btn-hover-shadow-dark: 0 4px 15px rgba(0, 0, 0, 0.4); 
  --themed-placeholder-color: rgba(225, 225, 225, 0.5); 
  
  /* These are used by SidebarNav, but defined globally for now */
  --sidebar-item-bg: #1A2430; 
  --sidebar-item-hover-bg: #253342; 
  --sidebar-item-border-color: #253342; 
  --sidebar-item-text-color: var(--bs-body-color);
  --sidebar-item-muted-text-color: rgba(225, 225, 225, 0.65);
  --delete-btn-color: #D32F2F; 
  --delete-btn-hover-bg: #b72b2b;
  --delete-btn-hover-color: #ffffff;
  --flag-devotion-bg: var(--primary-color);
  --flag-devotion-text: #ffffff;
  --flag-faith-integration-bg: var(--secondary-accent-color);
  --flag-faith-integration-text: #101821; 
}

/* Styling for .sidebar-toggle-btn-main (hamburger icon in main content) */
.sidebar-toggle-btn-main i { 
  color: var(--sidebar-item-muted-text-color); 
  transition: color 0.2s ease;
}
.sidebar-toggle-btn-main:hover i { 
  color: var(--primary-color);
}

.main-content {
  margin-left: 300px; 
  padding: 2rem 3rem;
  flex-grow: 1;
  height: 100vh; 
  transition: margin-left 0.3s ease;
  display: flex;
  flex-direction: column;
}

#app.sidebar-collapsed .main-content {
  margin-left: 60px; 
}

/* General Card Styling (base for cards in child components) */
.card { 
  background-color: var(--bs-card-bg); 
  border: 1px solid var(--bs-border-color); 
  color: var(--bs-body-color); 
  box-shadow: none; 
  transition: border-color 0.3s ease; 
}
.devotion-generator-card, .current-devotion-card { /* These classes are on the wrapper divs in App.vue */
  padding: 1rem; 
}
.devotion-generator-card:hover, .current-devotion-card:hover { /* Hover for the wrapper divs */
  border-color: var(--primary-color); 
}
.card-header { /* General style for card headers */
  background-color: transparent !important; 
  border-bottom: 1px solid var(--bs-border-color); 
  color: var(--bs-body-color); 
  padding-top: 1rem;
  padding-bottom: 1rem;
}
.card-body { /* General style for card bodies */
  color: var(--bs-body-color); 
}
.card-title.h4 { /* General style for h4 card titles */
  font-weight: 500; 
  color: var(--bs-body-color); 
}
.card-text.text-muted { /* General style for muted card text */
  font-family: 'Roboto', sans-serif; 
  font-weight: 400; 
  color: var(--sidebar-item-muted-text-color) !important; 
}

/* General .form-control styles */
.form-control { 
  background-color: var(--bs-card-bg); 
  color: var(--bs-body-color); 
  border: 1px solid var(--sidebar-item-border-color); 
}
.form-control:focus {
  background-color: var(--bs-card-bg); 
  color: var(--bs-body-color); 
  border-color: var(--primary-color); 
  box-shadow: 0 0 0 0.25rem rgba(0, 169, 255, 0.25); 
}
.form-control::placeholder {
  color: var(--themed-placeholder-color); 
  font-weight: 300;
}

.app-title {
  color: var(--bs-body-color); 
  font-weight: 500; 
}
.main-content .lead {
  font-family: 'Roboto', sans-serif; 
  font-weight: 300; 
  color: var(--sidebar-item-muted-text-color); 
}

/* General button styles */
.btn { /* General transition for all buttons */
  transition: transform 0.2s ease, background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}
.btn-gradient, .btn-gradient-success { /* Base for main action buttons */
  border: none;
  padding: 0.6rem 1.2rem;
  font-weight: 500; 
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 4px; 
}
.btn-gradient:disabled, .btn-gradient-success:disabled { /* Disabled states for main action buttons */
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Alert styles (used directly in App.vue template) */
.alert-success-custom {
  background-color: var(--secondary-accent-color); 
  color: var(--save-btn-text-dark); 
  border-color: #cc9300; 
  border-radius: 4px; 
}
.alert-info-custom {
  background-color: var(--primary-color); 
  color: white;
  border-color: #007acc; 
  border-radius: 4px; 
}

/* Scrollbar and Tooltip styles are global */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bs-body-bg); }
::-webkit-scrollbar-thumb {
  background: var(--bs-card-bg); 
  border-radius: 4px;
  border: 1px solid var(--bs-border-color); 
}
::-webkit-scrollbar-thumb:hover { background: var(--primary-color); }

.bible-verse-tooltip .tooltip-inner {
  background-color: var(--bs-hover-bg); 
  color: var(--bs-body-color); 
  border: 1px solid var(--bs-border-color); 
  max-width: 400px; 
  text-align: left; 
  padding: 10px;
  font-size: 0.9rem;
  white-space: pre-wrap; 
}
.bible-verse-tooltip .tooltip-arrow::before {
  border-top-color: var(--bs-border-color); 
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 1rem 1rem; 
  }
  .sidebar-toggle-btn-main {
    display: none; 
    position: fixed;
    top: 10px;
    left: 10px;
    z-index: 1005; 
    font-size: 1.5rem; 
  }
  .devotion-generator-card, .current-devotion-card {
    margin-left: auto; 
    margin-right: auto;
    max-width: 100%; 
  }
  .app-title {
    font-size: 1.8rem; 
    margin-top: 2.5rem; 
  }
  .main-content .lead {
    font-size: 0.9rem; 
  }
  .main-content header {
    margin-bottom: 1.5rem !important; 
  }
  .card { /* General card adjustments for mobile */
    margin-bottom: 1.5rem !important; 
  }
  .card-body, .card-header { /* General card padding adjustments for mobile */
    padding: 0.75rem; 
  }
  .form-control-lg { /* If used globally or directly in App.vue */
    font-size: 1rem; 
  }
  .btn-lg { /* If used globally or directly in App.vue */
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}

#app:not(.mobile-view).sidebar-collapsed .sidebar-toggle-btn-main i {
   content: '\F13A'; 
}
#app.mobile-view.sidebar-collapsed .sidebar-toggle-btn-main i::before {
  content: "\F479"; 
}

.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  z-index: 1099; 
}
#app.mobile-view:not(.sidebar-collapsed) .sidebar-overlay {
  display: block;
}
</style>
