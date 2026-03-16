async function initDashboard() {
    const testList = document.getElementById('testList');
    const metaGrid = document.getElementById('metaGrid');
    const iframe1 = document.getElementById('iframe1');
    const iframe2 = document.getElementById('iframe2');
    const pane1Title = document.getElementById('pane1Title');
    const pane2Title = document.getElementById('pane2Title');

    const tests = window.TESTS_REGISTRY || [];

    if (tests.length === 0) {
        testList.innerHTML = '<p style="padding: 1rem; color: var(--text-secondary);">No tests found. Run <code>node update.js</code> after adding folders to <code>tests/</code>.</p>';
        return;
    }

    renderTestList(tests);
    
    // Load the first test by default
    if (tests.length > 0) {
        loadTest(tests[0]);
    }

    function renderTestList(tests) {
        testList.innerHTML = '';
        tests.forEach((test, index) => {
            const item = document.createElement('div');
            item.className = 'test-item animate-fade-in';
            item.style.animationDelay = `${index * 0.05}s`;
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <span class="test-date">${test.date}</span>
                        <span class="test-title">${test.title}</span>
                    </div>
                    <a href="${test.path}/view.html" class="btn-icon" title="Open Dedicated Page" style="text-decoration: none;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                </div>
            `;
            item.onclick = (e) => {
                if (e.target.closest('a')) return; // Don't trigger loadTest if clicking the link
                document.querySelectorAll('.test-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                loadTest(test);
            };
            testList.appendChild(item);
        });
        
        // Set first item active
        if (testList.firstChild) testList.firstChild.classList.add('active');
    }

    function loadTest(test) {
        // Update Metadata
        metaGrid.innerHTML = `
            <div class="meta-item">
                <label>Test Title</label>
                <p>${test.title}</p>
            </div>
            <div class="meta-item">
                <label>Comparison</label>
                <p>${test.model_a} vs ${test.model_b}</p>
            </div>
            <div class="meta-item">
                <label>Date</label>
                <p>${test.date}</p>
            </div>
             <div class="meta-item" style="flex: 1; min-width: 0;">
                <label style="display: flex; align-items: center;">
                    Prompt Preview 
                    <button class="btn-copy" onclick="copyPrompt(\`${test.prompt.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`)">Copy Prompt</button>
                </label>
                <p style="font-size: 0.75rem; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${test.prompt}</p>
            </div>
        `;

        // Update Titles and Actions
        renderPaneHeader('pane1Header', test.model_a || 'Model A', 1);
        renderPaneHeader('pane2Header', test.model_b || 'Model B', 2);

        // Update Iframes
        iframe1.src = `${test.path}/result_1.html`;
        iframe2.src = `${test.path}/result_2.html`;
        
        // Reset state
        document.querySelectorAll('.result-pane').forEach(p => p.classList.remove('maximized'));
        
        // Reset animation
        const comparisonArea = document.getElementById('comparisonArea');
        comparisonArea.classList.remove('animate-fade-in');
        void comparisonArea.offsetWidth; // Trigger reflow
        comparisonArea.classList.add('animate-fade-in');
    }

    function renderPaneHeader(headerId, title, paneIndex) {
        const header = document.getElementById(headerId);
        const pane = document.querySelectorAll('.result-pane')[paneIndex - 1];
        const isMaxed = pane.classList.contains('maximized');
        
        header.innerHTML = `
            <span>${title}</span>
            <div class="pane-actions">
                <div class="btn-icon" onclick="toggleMaximize(${paneIndex})" title="${isMaxed ? 'Exit Full View' : 'Full View'}">
                    ${isMaxed 
                        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
                        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`
                    }
                </div>
            </div>
        `;
    }
}

function toggleMaximize(paneIndex) {
    const panes = document.querySelectorAll('.result-pane');
    const targetPane = panes[paneIndex - 1];
    const isMaxed = targetPane.classList.contains('maximized');
    
    panes.forEach(p => p.classList.remove('maximized'));
    document.body.classList.remove('has-maximized');

    if (!isMaxed) {
        targetPane.classList.add('maximized');
        document.body.classList.add('has-maximized');
    }
    
    // Rerender headers to update icons
    const testList = document.querySelector('.test-item.active');
    if (testList) {
        const tests = window.TESTS_REGISTRY || [];
        const activeTitle = testList.querySelector('.test-title').innerText;
        const test = tests.find(t => t.title === activeTitle);
        if (test) {
            const pane1Header = document.getElementById('pane1Header');
            const pane2Header = document.getElementById('pane2Header');
            
            // Simple logic to just update icons without full reload
            const icon1 = document.querySelector('#pane1Header .btn-icon');
            const icon2 = document.querySelector('#pane2Header .btn-icon');
            
            // We need to re-call the header render for both
            const pane1 = panes[0];
            const pane2 = panes[1];
            
            // Re-render both headers to ensure correct icons
            renderHeaderUI('pane1Header', test.model_a, pane1.classList.contains('maximized'), 1);
            renderHeaderUI('pane2Header', test.model_b, pane2.classList.contains('maximized'), 2);
        }
    }
}

function renderHeaderUI(headerId, title, isMaxed, paneIndex) {
    const header = document.getElementById(headerId);
    header.innerHTML = `
        <span>${title}</span>
        <div class="pane-actions">
            <div class="btn-icon" onclick="viewCode(${paneIndex})" title="View Source Code">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            </div>
            <div class="btn-icon" onclick="toggleMaximize(${paneIndex})" title="${isMaxed ? 'Exit Full View' : 'Full View'}">
                ${isMaxed 
                    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
                    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`
                }
            </div>
        </div>
    `;
}

function viewCode(paneIndex) {
    const testList = document.querySelector('.test-item.active');
    if (!testList) return;
    
    const activeIdx = Array.from(document.querySelectorAll('.test-item')).indexOf(testList);
    const tests = window.TESTS_REGISTRY || [];
    const test = tests[activeIdx];
    
    if (!test) return;

    const code = paneIndex === 1 ? test.code_a : test.code_b;
    const title = paneIndex === 1 ? test.model_a : test.model_b;

    document.getElementById('codeContainer').textContent = code;
    document.getElementById('modalTitle').textContent = `Source Code: ${title}`;
    document.getElementById('modalCopyBtn').onclick = () => copyPrompt(code);
    
    document.body.classList.add('modal-open');
}

function closeModal() {
    document.body.classList.remove('modal-open');
}

async function copyPrompt(text) {
    try {
        await navigator.clipboard.writeText(text);
        const btn = event.target;
        const originalText = btn.innerText;
        btn.innerText = 'Copied!';
        btn.style.background = '#4caf50';
        btn.style.borderColor = '#4caf50';
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = '';
            btn.style.borderColor = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
}

document.addEventListener('DOMContentLoaded', initDashboard);
