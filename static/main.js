// State Management
let allEntries = [];
let currentFilter = 'all';
let searchQuery = '';
let selectedNote = null;

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const lastRefreshedSpan = document.getElementById('last-refreshed-time');
const searchInput = document.getElementById('search-input');
const filterBadges = document.querySelectorAll('.filter-badge');
const feedContainer = document.getElementById('feed-container');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const emptyState = document.getElementById('empty-state');
const resetFiltersBtn = document.getElementById('reset-filters-btn');
const scrollTopBtn = document.getElementById('scroll-top-btn');
const toastContainer = document.getElementById('toast-container');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statFeatures = document.getElementById('stat-features');
const statChanges = document.getElementById('stat-changes');
const statAnnouncements = document.getElementById('stat-announcements');

// Tweet Composer Elements
const tweetPanel = document.getElementById('tweet-panel');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const tweetWarning = document.getElementById('tweet-warning');
const closeTweetPanel = document.getElementById('close-tweet-panel');
const resetTweetBtn = document.getElementById('reset-tweet-btn');
const copyTweetBtn = document.getElementById('copy-tweet-btn');
const shareTweetBtn = document.getElementById('share-tweet-btn');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    setupEventListeners();
});

// Event Listeners Configuration
function setupEventListeners() {
    // Refresh feed
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);

    // Search filter (de-bounced)
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderFeed();
        }, 150);
    });

    // Filter badges
    filterBadges.forEach(badge => {
        badge.addEventListener('click', () => {
            filterBadges.forEach(b => b.classList.remove('active'));
            badge.classList.add('active');
            currentFilter = badge.getAttribute('data-type');
            renderFeed();
        });
    });

    // Reset filters in empty state
    resetFiltersBtn.addEventListener('click', resetAllFilters);

    // Tweet panel closing
    closeTweetPanel.addEventListener('click', () => {
        tweetPanel.classList.add('hidden');
        selectedNote = null;
        updateSelectedCardUI();
    });

    // Clear/Reset draft
    resetTweetBtn.addEventListener('click', () => {
        if (selectedNote) {
            tweetTextarea.value = formatTweet(
                selectedNote.date,
                selectedNote.type,
                selectedNote.plainText,
                selectedNote.link
            );
        } else {
            tweetTextarea.value = '';
        }
        updateCharCount();
        showToast('Draft reset to default template', 'info');
    });

    // Copy draft to clipboard
    copyTweetBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        if (!text) return;
        
        navigator.clipboard.writeText(text).then(() => {
            showToast('Draft copied to clipboard!', 'success');
            // Quick visual feedback on button
            const btnSpan = copyTweetBtn.querySelector('span');
            const originalText = btnSpan.textContent;
            btnSpan.textContent = 'Copied!';
            copyTweetBtn.classList.add('btn-icon-active');
            setTimeout(() => {
                btnSpan.textContent = originalText;
                copyTweetBtn.classList.remove('btn-icon-active');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            showToast('Failed to copy to clipboard', 'error');
        });
    });

    // Tweet text change listener
    tweetTextarea.addEventListener('input', updateCharCount);

    // Send/Share Tweet
    shareTweetBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
        showToast('Launching X Share Intent...', 'info');
    });

    // Scroll window listener for "Back to Top"
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            scrollTopBtn.classList.remove('hidden');
        } else {
            scrollTopBtn.classList.add('hidden');
        }
    });

    // Click to scroll to top
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // If '/' is pressed and user is not inside an input/textarea, focus search
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            searchInput.focus();
            showToast('Press [Esc] to exit search', 'info');
        }
        
        // If 'Esc' is pressed
        if (e.key === 'Escape') {
            if (document.activeElement === searchInput) {
                searchInput.value = '';
                searchQuery = '';
                searchInput.blur();
                renderFeed();
            } else if (!tweetPanel.classList.contains('hidden')) {
                closeTweetPanel.click();
                showToast('Composer closed', 'info');
            }
        }
    });
}

// Reset filters helper
function resetAllFilters() {
    searchInput.value = '';
    searchQuery = '';
    currentFilter = 'all';
    
    filterBadges.forEach(b => b.classList.remove('active'));
    document.querySelector('.filter-badge[data-type="all"]').classList.add('active');
    
    renderFeed();
    showToast('Filters reset successfully', 'success');
}

// Toast notification helper
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '';
    if (type === 'success') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-feature)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-breaking)" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="9" x2="12.01" y2="9"></line></svg>`;
    }

    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove toast
    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}

// Fetch BigQuery Release Notes API
async function fetchReleaseNotes() {
    showLoading();
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;

    try {
        const response = await fetch('/api/release-notes');
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            allEntries = data.entries;
            updateStats();
            renderFeed();
            
            // Update last refreshed time
            const now = new Date();
            lastRefreshedSpan.textContent = `Refreshed: ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            
            hideLoading();
            showToast(`Loaded ${data.count} release note entries`, 'success');
        } else {
            throw new Error(data.message || 'Unknown error occurred');
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        showError(error.message);
        showToast('Failed to fetch release notes feed', 'error');
    } finally {
        refreshBtn.classList.remove('loading');
        refreshBtn.disabled = false;
    }
}

// Stats Calculator
function updateStats() {
    let total = 0;
    let features = 0;
    let changes = 0;
    let announcements = 0;

    allEntries.forEach(entry => {
        entry.sections.forEach(section => {
            total++;
            const type = section.type.toLowerCase();
            if (type.includes('feature')) features++;
            else if (type.includes('change')) changes++;
            else if (type.includes('announcement')) announcements++;
        });
    });

    statTotal.textContent = total;
    statFeatures.textContent = features;
    statChanges.textContent = changes;
    statAnnouncements.textContent = announcements;
}

// Render Feed Content
function renderFeed() {
    feedContainer.innerHTML = '';
    
    // Clear state check
    if (allEntries.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    let matchCount = 0;

    allEntries.forEach(entry => {
        // Filter sections within entry
        const matchedSections = entry.sections.filter(section => {
            // Type Match
            const matchesType = (currentFilter === 'all') || 
                                (currentFilter === 'feature' && section.type.toLowerCase().includes('feature')) ||
                                (currentFilter === 'change' && section.type.toLowerCase().includes('change')) ||
                                (currentFilter === 'announcement' && section.type.toLowerCase().includes('announcement')) ||
                                (currentFilter === 'breaking' && section.type.toLowerCase().includes('breaking')) ||
                                (currentFilter === 'issue' && (section.type.toLowerCase().includes('issue') || section.type.toLowerCase().includes('fix')));

            // Search Match
            const matchesSearch = !searchQuery || 
                                  section.plain_text.toLowerCase().includes(searchQuery) || 
                                  section.type.toLowerCase().includes(searchQuery) || 
                                  entry.title.toLowerCase().includes(searchQuery);

            return matchesType && matchesSearch;
        });

        if (matchedSections.length > 0) {
            matchCount += matchedSections.length;

            // Create Date Group Container
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';

            // Create Date Header
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            dateHeader.innerHTML = `
                <span class="date-title">${entry.title}</span>
                <div class="date-line"></div>
            `;
            dateGroup.appendChild(dateHeader);

            // Create cards for each matched section
            matchedSections.forEach(section => {
                const noteCard = document.createElement('article');
                noteCard.className = 'note-card glass';
                noteCard.setAttribute('data-id', `${entry.title}-${section.type}-${section.plain_text.substring(0, 15)}`);
                
                // Determine badge type styling class
                let badgeClass = 'badge-update';
                const typeLower = section.type.toLowerCase();
                if (typeLower.includes('feature')) badgeClass = 'badge-feature';
                else if (typeLower.includes('change')) badgeClass = 'badge-change';
                else if (typeLower.includes('announcement')) badgeClass = 'badge-announcement';
                else if (typeLower.includes('breaking')) badgeClass = 'badge-breaking';
                else if (typeLower.includes('issue')) badgeClass = 'badge-issue';

                // Check if this card is currently selected
                const isSelected = selectedNote && 
                                   selectedNote.id === noteCard.getAttribute('data-id');
                if (isSelected) {
                    noteCard.classList.add('btn-icon-active');
                }

                noteCard.innerHTML = `
                    <div class="note-card-header">
                        <div class="badge-wrapper">
                            <span class="type-badge ${badgeClass}">${section.type}</span>
                        </div>
                    </div>
                    <div class="note-card-body">
                        ${section.content_html}
                    </div>
                    <div class="note-card-actions">
                        <button class="btn btn-secondary btn-tweet-action ${isSelected ? 'btn-icon-active' : ''}" title="Draft post for this update">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            <span>${isSelected ? 'Selected' : 'Select to Tweet'}</span>
                        </button>
                    </div>
                `;

                // Add listener to Tweet button
                const tweetActionBtn = noteCard.querySelector('.btn-tweet-action');
                tweetActionBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectNoteForTweet({
                        id: noteCard.getAttribute('data-id'),
                        date: entry.title,
                        type: section.type,
                        plainText: section.plain_text,
                        link: entry.link
                    });
                });

                dateGroup.appendChild(noteCard);
            });

            feedContainer.appendChild(dateGroup);
        }
    });

    if (matchCount === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }
}

// Select Note & Format Composer
function selectNoteForTweet(note) {
    // If clicking already selected note, toggle panel off
    if (selectedNote && selectedNote.id === note.id) {
        tweetPanel.classList.add('hidden');
        selectedNote = null;
        updateSelectedCardUI();
        return;
    }

    selectedNote = note;
    updateSelectedCardUI();

    // Populate composer
    const formatted = formatTweet(note.date, note.type, note.plainText, note.link);
    tweetTextarea.value = formatted;
    
    // Display panel
    tweetPanel.classList.remove('hidden');
    updateCharCount();
    tweetTextarea.focus();
    showToast('Composer loaded with selected update', 'info');
}

// Sync selection visual states on card components
function updateSelectedCardUI() {
    const cards = document.querySelectorAll('.note-card');
    cards.forEach(card => {
        const actionBtn = card.querySelector('.btn-tweet-action');
        const cardId = card.getAttribute('data-id');
        
        if (selectedNote && cardId === selectedNote.id) {
            actionBtn.classList.add('btn-icon-active');
            actionBtn.querySelector('span').textContent = 'Selected';
        } else {
            actionBtn.classList.remove('btn-icon-active');
            actionBtn.querySelector('span').textContent = 'Select to Tweet';
        }
    });
}

// Smart Tweet Formatter with auto-truncation
function formatTweet(date, type, plainText, link) {
    const hashtags = " #GoogleCloud #BigQuery";
    const prefix = `BigQuery Update [${date}] (${type}):\n`;
    const linkText = `\n\nLink: ${link}`;
    
    // Calculates character space
    const fixedLength = prefix.length + linkText.length + hashtags.length;
    const maxDescLength = 280 - fixedLength;
    
    let description = plainText;
    if (description.length > maxDescLength) {
        description = description.substring(0, maxDescLength - 3) + "...";
    }
    
    return `${prefix}${description}${linkText}${hashtags}`;
}

// Character counter and visual validator
function updateCharCount() {
    const len = tweetTextarea.value.length;
    charCounter.textContent = `${len} / 280`;
    
    if (len > 280) {
        charCounter.style.color = 'var(--color-breaking)';
        tweetWarning.classList.remove('hidden');
    } else {
        charCounter.style.color = 'var(--text-muted)';
        tweetWarning.classList.add('hidden');
    }
}

// UI States Helpers
function showLoading() {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    emptyState.classList.add('hidden');
}

function hideLoading() {
    loadingState.classList.add('hidden');
}

function showError(msg) {
    loadingState.classList.add('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.remove('hidden');
    errorMessage.textContent = msg || 'Failed to fetch release notes feed. Check backend connectivity or network.';
}
