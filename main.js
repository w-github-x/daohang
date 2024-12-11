import { navigationData } from './data.js';

// 常量定义
const KEYBOARD_SHORTCUTS = {
    FOCUS_SEARCH: '/',
    CLEAR_SEARCH: 'Escape'
};

const MESSAGES = {
    SEARCH_RESULTS: (total, categories) => `找到 ${total} 个结果，在 ${categories} 个分类中`,
    NO_RESULTS: '未找到匹配的结果'
};

// DOM 工具函数
function $(selector) {
    return document.querySelector(selector);
}

function createElement(tag, className) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
}

// 性能优化
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// 搜索管理
class SearchManager {
    constructor() {
        this.input = $('#searchInput');
        this.status = $('#searchStatus');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.input.addEventListener('input', debounce(() => this.handleSearch(), 300));
        
        document.addEventListener('keydown', (e) => {
            if (e.key === KEYBOARD_SHORTCUTS.FOCUS_SEARCH && 
                document.activeElement !== this.input) {
                e.preventDefault();
                this.input.focus();
            }
            if (e.key === KEYBOARD_SHORTCUTS.CLEAR_SEARCH && 
                document.activeElement === this.input) {
                this.clearSearch();
            }
        });
    }

    clearSearch() {
        this.input.value = '';
        this.handleSearch();
        this.input.blur();
    }

    handleSearch() {
        const searchTerm = this.input.value.toLowerCase().trim();
        const results = this.updateSearchResults(searchTerm);
        this.updateSearchStatus(searchTerm, results);
    }

    updateSearchResults(searchTerm) {
        const categories = document.querySelectorAll('.category');
        let totalLinks = 0;
        let visibleCategories = 0;

        categories.forEach(category => {
            const links = category.querySelectorAll('.link-item');
            let hasVisibleLinks = false;

            links.forEach(link => {
                const title = link.querySelector('.link-title').textContent.toLowerCase();
                const url = link.href.toLowerCase();
                const isVisible = !searchTerm || 
                                title.includes(searchTerm) || 
                                url.includes(searchTerm);
                
                link.style.display = isVisible ? '' : 'none';
                if (isVisible) {
                    hasVisibleLinks = true;
                    totalLinks++;
                }
            });

            category.style.display = hasVisibleLinks ? '' : 'none';
            if (hasVisibleLinks) visibleCategories++;
        });

        return { totalLinks, visibleCategories };
    }

    updateSearchStatus(searchTerm, { totalLinks, visibleCategories }) {
        if (!searchTerm) {
            this.status.textContent = '';
            this.status.classList.remove('active');
            return;
        }

        this.status.textContent = totalLinks > 0
            ? MESSAGES.SEARCH_RESULTS(totalLinks, visibleCategories)
            : MESSAGES.NO_RESULTS;
        
        this.status.classList.add('active');
    }
}

// 分类管理
class CategoryManager {
    constructor(data) {
        this.data = data;
        this.container = $('#categoriesContainer');
        this.render();
    }

    render() {
        const fragment = document.createDocumentFragment();
        
        this.data.categories.forEach(category => {
            const categoryElement = this.createCategory(category);
            fragment.appendChild(categoryElement);
        });

        this.container.appendChild(fragment);
    }

    createCategory(category) {
        const categoryDiv = createElement('div', 'category fade-in');
        
        const titleDiv = createElement('div', 'category-title');
        titleDiv.textContent = category.name;
        
        const linksGrid = createElement('div', 'links-grid');
        
        category.links.forEach(link => {
            const linkElement = this.createLink(link);
            linksGrid.appendChild(linkElement);
        });

        categoryDiv.appendChild(titleDiv);
        categoryDiv.appendChild(linksGrid);
        return categoryDiv;
    }

    createLink(link) {
        const linkDiv = createElement('a', 'link-item');
        linkDiv.href = link.url;
        linkDiv.target = '_blank';
        linkDiv.rel = 'noopener noreferrer';

        const icon = createElement('img', 'link-icon');
        icon.src = link.icon;
        icon.alt = link.title;
        icon.loading = 'lazy';
        icon.onerror = () => {
            icon.src = this.getDefaultIcon();
        };

        const title = createElement('span', 'link-title');
        title.textContent = link.title;

        linkDiv.appendChild(icon);
        linkDiv.appendChild(title);
        return linkDiv;
    }

    getDefaultIcon() {
        return 'data:image/svg+xml,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="#f0f0f0"/>
                <text x="50" y="50" font-family="Arial" font-size="40" 
                      fill="#999" text-anchor="middle" dy=".3em">?</text>
            </svg>
        `);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    try {
        new CategoryManager(navigationData);
        new SearchManager();
    } catch (error) {
        console.error('应用初始化失败:', error);
    }
});