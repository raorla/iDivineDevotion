<template>
  <div class_original="sidebar" :class="{ collapsed: props.isSidebarCollapsed && !props.isMobile }">
    <button
      class="btn btn-sm btn-outline-light sidebar-toggle-btn top-right-absolute"
      @click="$emit('toggle-sidebar')"
      v-if="!(props.isSidebarCollapsed && !props.isMobile)"
    >
      <i v-if="props.isMobile && !props.isSidebarCollapsed" class="bi bi-x-lg"></i>
      <i v-else-if="!props.isMobile && !props.isSidebarCollapsed" class="bi bi-arrow-left-square-fill"></i>
    </button>
    <h2 class="sidebar-title"><span v-if="!props.isSidebarCollapsed || (props.isMobile && !props.isSidebarCollapsed)">My Saved Content</span></h2>
    <div class="search-bar mb-3" v-if="!props.isSidebarCollapsed || (props.isMobile && !props.isSidebarCollapsed)">
      <input
        type="text"
        class="form-control form-control-sm"
        placeholder="Search..."
        v-model="searchQuery"
      />
    </div>
    <ul class="list-unstyled saved-devotions-list" v-if="!props.isSidebarCollapsed || (props.isMobile && !props.isSidebarCollapsed)">
      <li v-if="filteredContent.length === 0 && searchQuery" class="text-muted small p-2">No matches found.</li>
      <li v-if="filteredContent.length === 0 && !searchQuery && (!props.savedContent || props.savedContent.length === 0)" class="text-muted small p-2">No content saved yet.</li>
      <li
        v-for="(content) in filteredContent"
        :key="content.id || content.topic"
        class="saved-devotion-card"
        @click="handleViewContent(content)"
      >
        <h6 class="saved-devotion-topic">
          {{ content.topic || "Saved Content" }}
        </h6>
        <p class="saved-devotion-excerpt">{{ truncateText(content.text, 30) }}</p>
        <span class="content-type-flag" :class="'flag-' + content.type">
          {{ content.type === 'devotion' ? 'Devo' : 'Idea' }}
        </span>
        <button
          class="btn btn-sm btn-outline-danger delete-saved-btn"
          @click.stop="handleDeleteInternal(content.id)"
          v-if="content.id"
          title="Delete content"
        >
          <i class="bi bi-trash3"></i>
        </button>
      </li>
    </ul>
    <!-- Desktop collapsed icons -->
    <div class="sidebar-collapsed-icons" v-if="props.isSidebarCollapsed && !props.isMobile">
      <i class="bi bi-search" @click="$emit('toggle-sidebar')" title="Search Content"></i>
      <i class="bi bi-card-list" @click="$emit('toggle-sidebar')" title="View Content"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
// Assuming StoredContent is in composables/useDevotions.ts relative to App.vue
// Adjust path based on actual project structure if SidebarNav.vue is deeper
import type { StoredContent } from '../composables/useDevotions'; 

const props = defineProps<{
  savedContent: StoredContent[];
  isSidebarCollapsed: boolean;
  isMobile: boolean;
}>();

const emit = defineEmits<{
  (e: 'view-content', content: StoredContent): void;
  (e: 'delete-content', id: string | undefined): void;
  (e: 'toggle-sidebar'): void;
}>();

const searchQuery = ref('');

const filteredContent = computed(() => {
  if (!searchQuery.value) {
    return props.savedContent;
  }
  return props.savedContent.filter(item =>
    (item.topic && item.topic.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
    (item.text && item.text.toLowerCase().includes(searchQuery.value.toLowerCase()))
  );
});

const truncateText = (text: string | undefined, length: number): string => {
  if (!text) return '';
  if (text.length <= length) {
    return text;
  }
  return text.substring(0, length) + '...';
};

const handleViewContent = (content: StoredContent) => {
  emit('view-content', content);
   // If on mobile and sidebar is open, emit event to close it
  if (props.isMobile && !props.isSidebarCollapsed) {
    emit('toggle-sidebar');
  }
};

const handleDeleteInternal = (id?: string) => {
  if (id) {
    emit('delete-content', id);
  }
};
</script>

<style scoped>
/* Scoped styles for SidebarNav, copied and adapted from App.vue */
.sidebar { /* Renamed class_original to class for Vue syntax */
  width: 300px;
  padding: 20px;
  border-right: 1px solid var(--bs-border-color);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  transition: width 0.3s ease, padding 0.3s ease, transform 0.3s ease;
  z-index: 1000;
  background-image: none; /* Removed gradient from previous step, ensure solid */
  background-color: var(--bs-card-bg); /* Apply solid color */
}

.sidebar.collapsed { /* Added for when props.isSidebarCollapsed is true */
  width: 60px; 
  padding: 20px 10px;
}
.sidebar.collapsed .sidebar-title span,
.sidebar.collapsed .search-bar,
.sidebar.collapsed .saved-devotions-list {
  display: none;
}
.sidebar.collapsed .sidebar-toggle-btn { /* For the button inside the sidebar */
  align-self: center;
}
.sidebar.collapsed .top-right-absolute {
    position: static; 
    align-self: center;
}
.sidebar.collapsed .sidebar-collapsed-icons {
  display: flex;
}


.sidebar-toggle-btn {
  z-index: 1001;
  font-size: 1.2rem;
  padding: 0.2rem 0.5rem;
  margin-bottom: 1rem; 
  align-self: flex-end; 
}
.sidebar-toggle-btn i {
  color: var(--sidebar-item-muted-text-color); 
  transition: color 0.2s ease;
}
.sidebar-toggle-btn:hover i {
  color: var(--primary-color);
}

.top-right-absolute {
    position: absolute;
    top: 15px;
    right: 15px;
}

.sidebar-collapsed-icons {
  display: none; 
  flex-direction: column;
  align-items: center;
  gap: 20px; 
  margin-top: 20px;
}

.sidebar-collapsed-icons i {
  font-size: 1.8rem;
  cursor: pointer;
  color: var(--sidebar-item-muted-text-color); 
  transition: color 0.2s ease;
}
.sidebar-collapsed-icons i:hover {
  color: var(--primary-color); 
}

.sidebar-title {
  font-size: 1.5rem;
  font-weight: 500; 
  margin-bottom: 1.5rem;
  color: var(--bs-body-color); 
  font-family: 'Montserrat', sans-serif;
}

.search-bar .form-control {
  background-color: var(--bs-card-bg); 
  border: 1px solid var(--sidebar-item-border-color); 
  color: var(--bs-body-color); 
  font-family: 'Roboto', sans-serif;
}
.search-bar .form-control::placeholder {
  color: var(--themed-placeholder-color); 
  font-weight: 300;
}

.saved-devotions-list {
  flex-grow: 1;
  overflow-y: auto; 
}

.saved-devotion-card {
  background-color: var(--sidebar-item-bg);
  padding: 12px 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
  border: 1px solid var(--sidebar-item-border-color);
  position: relative; 
}
.saved-devotion-card:hover {
  background-color: var(--sidebar-item-hover-bg);
  transform: translateY(-2px);
}

.saved-devotion-topic {
  font-size: 0.95rem; 
  font-weight: 500; 
  color: var(--sidebar-item-text-color);
  margin-bottom: 5px;
  margin-right: 35px; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap; 
  font-family: 'Montserrat', sans-serif;
}

.saved-devotion-excerpt {
  font-family: 'Roboto', sans-serif; 
  font-size: 0.8rem;
  font-weight: 400; 
  color: var(--sidebar-item-muted-text-color);
  margin-bottom: 0;
  line-height: 1.4;
  margin-right: 35px; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap; 
}

.delete-saved-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  color: var(--delete-btn-color); 
  border-color: var(--delete-btn-color);
  padding: 2px 5px;
  font-size: 0.7rem;
  font-family: 'Roboto', sans-serif;
}
.delete-saved-btn:hover {
  background-color: var(--delete-btn-hover-bg);
  color: var(--delete-btn-hover-color);
}

.content-type-flag {
  font-size: 0.7rem;
  font-weight: 500; 
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
  vertical-align: middle;
  font-family: 'Roboto', sans-serif;
}
.flag-devotion {
  background-color: var(--flag-devotion-bg); 
  color: var(--flag-devotion-text); 
}
.flag-faithIntegration {
  background-color: var(--flag-faith-integration-bg); 
  color: var(--flag-faith-integration-text); 
}
</style>
