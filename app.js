document.addEventListener('DOMContentLoaded', () => {
    const choreForm = document.getElementById('chore-form');
    const choreList = document.getElementById('chore-list');
    const emptyMessage = document.getElementById('empty-message');
    const scoreboard = document.getElementById('scoreboard');
    const filterButtons = document.querySelectorAll('.filter-btn');

    let chores = JSON.parse(localStorage.getItem('chores')) || [];
    let currentFilter = 'all';

    function saveChores() {
        localStorage.setItem('chores', JSON.stringify(chores));
    }

    function renderChores() {
        choreList.innerHTML = '';

        const filtered = chores.filter(chore => {
            if (currentFilter === 'pending') return !chore.done;
            if (currentFilter === 'done') return chore.done;
            return true;
        });

        if (filtered.length === 0) {
            emptyMessage.classList.remove('hidden');
        } else {
            emptyMessage.classList.add('hidden');
        }

        filtered.forEach(chore => {
            const li = document.createElement('li');
            li.className = `chore-item${chore.done ? ' done' : ''}`;
            li.innerHTML = `
                <input type="checkbox" class="chore-checkbox" ${chore.done ? 'checked' : ''} data-id="${chore.id}">
                <div class="chore-info">
                    <div class="chore-name">${escapeHtml(chore.name)}</div>
                    <div class="chore-meta">${escapeHtml(chore.assignee)}</div>
                </div>
                <span class="chore-points">${chore.points}pt</span>
                <button class="chore-delete" data-id="${chore.id}" title="削除">&times;</button>
            `;
            choreList.appendChild(li);
        });

        renderScoreboard();
    }

    function renderScoreboard() {
        const scores = {};
        chores.forEach(chore => {
            if (!scores[chore.assignee]) {
                scores[chore.assignee] = { total: 0, earned: 0 };
            }
            scores[chore.assignee].total += chore.points;
            if (chore.done) {
                scores[chore.assignee].earned += chore.points;
            }
        });

        const names = Object.keys(scores);
        if (names.length === 0) {
            scoreboard.innerHTML = '<p class="empty-message">まだデータがありません</p>';
            return;
        }

        const maxTotal = Math.max(...names.map(n => scores[n].total));

        scoreboard.innerHTML = names.map(name => {
            const s = scores[name];
            const percent = maxTotal > 0 ? (s.earned / maxTotal) * 100 : 0;
            return `
                <div class="score-card">
                    <div>
                        <div class="score-name">${escapeHtml(name)}</div>
                        <div class="score-bar"><div class="score-bar-fill" style="width:${percent}%"></div></div>
                    </div>
                    <div class="score-points">${s.earned} / ${s.total} pt</div>
                </div>
            `;
        }).join('');
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Add chore
    choreForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('chore-name').value.trim();
        const points = parseInt(document.getElementById('chore-points').value, 10);
        const assignee = document.getElementById('chore-assignee').value.trim();

        if (!name || !assignee) return;

        chores.push({
            id: Date.now().toString(),
            name,
            points,
            assignee,
            done: false,
            createdAt: new Date().toISOString()
        });

        saveChores();
        renderChores();
        choreForm.reset();
        document.getElementById('chore-points').value = '10';
    });

    // Toggle done / delete
    choreList.addEventListener('click', (e) => {
        if (e.target.classList.contains('chore-checkbox')) {
            const id = e.target.dataset.id;
            const chore = chores.find(c => c.id === id);
            if (chore) {
                chore.done = e.target.checked;
                saveChores();
                renderChores();
            }
        }

        if (e.target.classList.contains('chore-delete')) {
            const id = e.target.dataset.id;
            chores = chores.filter(c => c.id !== id);
            saveChores();
            renderChores();
        }
    });

    // Filter
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderChores();
        });
    });

    // Initial render
    renderChores();
});
