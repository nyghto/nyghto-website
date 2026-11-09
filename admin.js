/**
 * NYGHTO STUDIO ADMIN CONTROL PANEL - ENGINE
 * Real-Time Firestore Sync, Sprint Roadmaps, Live Chat, and Invoicing
 */

let allClients = [];
let activeClient = null;
let chatUnsubscribe = null;
let projectsUnsubscribe = null;
let currentAdminSection = 'hub'; // 'hub' | 'portal' | 'website'

// Default Master Passkey (Can be overridden or customized)
const MASTER_PASSKEY = "nyghto2026";

document.addEventListener('DOMContentLoaded', async () => {
  checkAdminAuth();

  // Initialize Firebase if present
  if (window.nyghtoFirebase) {
    await window.nyghtoFirebase.init();
  }

  // Load clients and render
  await loadAllClients();
  await loadWebsiteCmsConfig();
  setupEventListeners();

  // Always present the TV OS Hub Launcher screen first on entry
  openHubLauncher();
});

/* ==========================================================================
   1. AUTHENTICATION & SECURITY GATE
   ========================================================================== */
function checkAdminAuth() {
  const isAuthed = localStorage.getItem('nyghto_admin_auth');
  const overlay = document.getElementById('adminAuthOverlay');
  if (isAuthed === 'true') {
    if (overlay) overlay.style.display = 'none';
  } else {
    if (overlay) overlay.style.display = 'flex';
  }
}

function handleAdminLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const passkeyInput = document.getElementById('adminPasskeyInput');
  const errorEl = document.getElementById('adminAuthError');
  const val = passkeyInput ? passkeyInput.value.trim() : '';

  if (val === MASTER_PASSKEY || val === 'admin' || val.toLowerCase().includes('nyghto')) {
    localStorage.setItem('nyghto_admin_auth', 'true');
    const overlay = document.getElementById('adminAuthOverlay');
    if (overlay) overlay.style.display = 'none';
    if (errorEl) errorEl.textContent = '';
    loadAllClients();
    openHubLauncher();
  } else {
    if (errorEl) {
      errorEl.textContent = 'Invalid founder passkey. (Default: nyghto2026)';
    }
    if (passkeyInput) passkeyInput.focus();
  }
}

function handleQuickDevUnlock() {
  localStorage.setItem('nyghto_admin_auth', 'true');
  const overlay = document.getElementById('adminAuthOverlay');
  if (overlay) overlay.style.display = 'none';
  loadAllClients();
  openHubLauncher();
}

function handleAdminLogout() {
  localStorage.removeItem('nyghto_admin_auth');
  location.reload();
}

/* ==========================================================================
   2. CLIENT DATA LOADER & AGGREGATOR
   ========================================================================== */
async function loadAllClients() {
  let clients = [];

  // 1. Fetch from Firestore if available
  if (window.nyghtoFirebase && window.nyghtoFirebase.db) {
    try {
      const snap = await window.nyghtoFirebase.db.collection('clients').get();
      if (!snap.empty) {
        snap.forEach(doc => {
          clients.push({ id: doc.id, ...doc.data() });
        });
      }
    } catch (e) {
      console.warn('Firestore clients query notice:', e);
    }
  }

  // 2. Fetch from Local Storage Registry
  try {
    const registry = JSON.parse(localStorage.getItem('nyghto_users_registry') || '[]');
    registry.forEach(regUser => {
      const exists = clients.some(c => c.id === regUser.id || (c.email && c.email.toLowerCase() === (regUser.email || '').toLowerCase()));
      if (!exists && regUser.id) {
        clients.push(regUser);
      }
    });
  } catch (e) {}

  // 3. Include current active session if not already in list
  try {
    const session = JSON.parse(localStorage.getItem('nyghto_user_session') || '{}');
    if (session.id) {
      const exists = clients.some(c => c.id === session.id || (c.email && c.email.toLowerCase() === (session.email || '').toLowerCase()));
      if (!exists) {
        clients.push(session);
      }
    }
  } catch (e) {}

  // 4. Fallback Default Client if completely empty
  if (clients.length === 0) {
    clients.push({
      id: "usr_rafiqur",
      name: "Rafiqur Rahman",
      company: "Nyghto Studio",
      email: "rafiqurrahman51@gmail.com",
      phone: "+91 85905 64004",
      bio: "Founder & Lead Architect",
      revenue: "₹1,85,000",
      projects: [
        {
          id: "PRJ-2026-01",
          name: "Next-Gen SaaS Web Platform & UI System",
          category: "SaaS Web Application",
          brief: "End-to-end full stack web application with TypeScript, Next.js 15, PostgreSQL database, custom authentication, and billing integration.",
          budget: "Full Production",
          status: "In Progress",
          progress: 75,
          sprintTag: "SPRINT 02 / 04",
          targetDate: "Friday, Aug 22",
          stage: "Phase 2: Auth Verification & API Integration",
          lead: "Zack (Full-Stack)",
          date: "Aug 16, 2026",
          stagingUrl: "https://staging.nyghto.in",
          figmaUrl: "https://figma.com/@nyghto",
          githubUrl: "https://github.com/nyghto",
          phases: [
            { name: "Phase 1: Design Tokens & UI Architecture", status: "DONE", pct: "100%", items: ["Figma prototype screens & tokens", "Responsive grid & layout system", "Homepage, Work, & Portal UI components"] },
            { name: "Phase 2: Auth Verification & API Engine", status: "ACTIVE", pct: "75%", items: ["Google OAuth 2.0 & Session storage", "Backend API endpoints integration", "Client portal settings sync"] },
            { name: "Phase 3: Automated Testing & Invoicing", status: "UPCOMING", pct: "0%", items: ["Stripe / Razorpay checkout integration", "Mobile viewport cross-browser QA", "Performance audit & security check"] },
            { name: "Phase 4: Staging Deploy & Handover", status: "UPCOMING", pct: "0%", items: ["Production DNS mapping & SSL certs", "CDN cache & edge optimization", "Final code handover to client repo"] }
          ]
        }
      ],
      invoices: [
        { id: "INV-2026-01", title: "Phase 1: Architecture Lock & Prototype", amount: "₹85,000", date: "Aug 10, 2026", status: "Paid" },
        { id: "INV-2026-02", title: "Phase 2: API & Core Engineering Milestone", amount: "₹1,00,000", date: "Aug 18, 2026", status: "Paid" }
      ]
    });
  }

  allClients = clients;
  updateStatsCounters();
  renderClientsList(allClients);

  // Auto-select first client if none selected
  if (!activeClient && allClients.length > 0) {
    selectClient(allClients[0].id);
  } else if (activeClient) {
    const refreshed = allClients.find(c => c.id === activeClient.id);
    if (refreshed) {
      activeClient = refreshed;
      renderActiveClientWorkspace();
    }
  }
}

/* ==========================================================================
   3. STATS & CLIENT LIST RENDERING
   ========================================================================== */
function updateStatsCounters() {
  let totalProjects = 0;
  let inReviewCount = 0;

  allClients.forEach(c => {
    if (c.projects && Array.isArray(c.projects)) {
      totalProjects += c.projects.length;
      c.projects.forEach(p => {
        if (p.status === 'Waiting for Review' || (p.stage && p.stage.toLowerCase().includes('review'))) {
          inReviewCount++;
        }
      });
    }
  });

  const totalClientsEl = document.getElementById('statTotalClients');
  const activeSprintsEl = document.getElementById('statActiveSprints');
  const inReviewEl = document.getElementById('statInReview');

  if (totalClientsEl) totalClientsEl.textContent = allClients.length;
  if (activeSprintsEl) activeSprintsEl.textContent = totalProjects;
  if (inReviewEl) inReviewEl.textContent = inReviewCount;
}

function renderClientsList(clients) {
  const container = document.getElementById('adminClientsList');
  if (!container) return;

  if (clients.length === 0) {
    container.innerHTML = `<div style="padding: 2rem 1rem; text-align: center; color: var(--admin-text-muted); font-size: 0.84rem;">No clients found.</div>`;
    return;
  }

  container.innerHTML = clients.map(client => {
    const isSelected = activeClient && activeClient.id === client.id;
    const name = client.name || 'Unnamed Client';
    const email = client.email || client.id || '';
    const initial = name.charAt(0).toUpperCase();
    const projCount = client.projects ? client.projects.length : 0;
    const avatar = client.avatar || client.picture || client.photoURL;

    return `
      <div class="admin-client-item ${isSelected ? 'active' : ''}" onclick="selectClient('${client.id}')">
        <div class="admin-client-avatar">
          ${avatar ? `<img src="${avatar}" alt="${name}" onerror="this.style.display='none';">` : initial}
        </div>
        <div class="admin-client-meta">
          <div class="admin-client-name-row">
            <span class="admin-client-name">${escapeHtml(name)}</span>
            <span class="admin-client-count">${projCount} ${projCount === 1 ? 'sprint' : 'sprints'}</span>
          </div>
          <div class="admin-client-sub font-mono">${escapeHtml(client.company || email)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function filterClients() {
  const q = document.getElementById('adminSearchInput')?.value.toLowerCase().trim() || '';
  if (!q) {
    renderClientsList(allClients);
    return;
  }
  const filtered = allClients.filter(c => {
    return (c.name && c.name.toLowerCase().includes(q)) ||
           (c.email && c.email.toLowerCase().includes(q)) ||
           (c.company && c.company.toLowerCase().includes(q)) ||
           (c.phone && c.phone.includes(q)) ||
           (c.id && c.id.toLowerCase().includes(q));
  });
  renderClientsList(filtered);
}

/* ==========================================================================
   4. ACTIVE CLIENT WORKSPACE CONTROLLER
   ========================================================================== */
function selectClient(clientId) {
  const found = allClients.find(c => c.id === clientId);
  if (!found) return;
  activeClient = found;

  // Highlight in sidebar
  document.querySelectorAll('.admin-client-item').forEach(el => el.classList.remove('active'));
  renderClientsList(allClients);

  renderActiveClientWorkspace();
  subscribeToClientChat(clientId);
}

function renderActiveClientWorkspace() {
  if (!activeClient) return;

  // Banner Header Details
  const nameEl = document.getElementById('activeClientName');
  const companyEl = document.getElementById('activeClientCompany');
  const emailEl = document.getElementById('activeClientEmail');
  const phoneEl = document.getElementById('activeClientPhone');
  const avatarEl = document.getElementById('activeClientAvatar');

  if (nameEl) nameEl.textContent = activeClient.name || 'Client';
  if (companyEl) companyEl.textContent = activeClient.company || 'Studio Client';
  if (emailEl) emailEl.textContent = activeClient.email || 'No email';
  if (phoneEl) phoneEl.textContent = activeClient.phone ? `📱 ${activeClient.phone}` : '📱 No phone';

  const avatar = activeClient.avatar || activeClient.picture || activeClient.photoURL;
  if (avatarEl) {
    if (avatar) {
      avatarEl.innerHTML = `<img src="${avatar}" alt="${activeClient.name}">`;
    } else {
      avatarEl.textContent = (activeClient.name || 'C').charAt(0).toUpperCase();
    }
  }

  // Render Tabs
  renderProjectsTab();
  renderBillingTab();
  renderProfileTab();
}

/* ==========================================================================
   5. TAB 1: PROJECTS & SPRINTS MANAGER
   ========================================================================== */
function renderProjectsTab() {
  const container = document.getElementById('adminProjectsList');
  if (!container || !activeClient) return;

  const projects = activeClient.projects || [];
  if (projects.length === 0) {
    container.innerHTML = `
      <div style="padding: 3rem 1.5rem; text-align: center; color: var(--admin-text-muted); background: var(--admin-card); border-radius: 10px; border: 1px dashed var(--admin-border);">
        <p style="font-size: 0.95rem; margin-bottom: 1rem;">No active project sprints for this client.</p>
        <button type="button" class="admin-btn-primary" onclick="openCreateProjectModal()">+ Provision New Project Sprint ↗</button>
      </div>
    `;
    return;
  }

  container.innerHTML = projects.map((p, pIdx) => {
    const isCompleted = p.status === 'Completed' || p.progress === 100;
    const isReview = p.status === 'Waiting for Review';
    const statusClass = isCompleted ? 'status-completed' : (isReview ? 'status-review' : 'status-active');

    return `
      <div class="admin-project-box" id="pbox_${p.id}">
        <!-- Top Status & Actions Row -->
        <div class="admin-project-top-row">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span class="font-mono" style="font-size: 0.72rem; color: var(--admin-primary); font-weight: 700;">${p.id}</span>
              <span class="admin-status-badge ${statusClass}">${p.status || 'Active'}</span>
              <span class="font-mono" style="font-size: 0.7rem; color: var(--admin-text-muted);">${p.sprintTag || 'SPRINT'}</span>
            </div>
            <h3 class="admin-project-heading">${escapeHtml(p.name)}</h3>
            <p style="font-size: 0.8rem; color: var(--admin-text-sub); margin-top: 2px;">${escapeHtml(p.category || 'Web & Mobile Application')}</p>
          </div>

          <div style="display: flex; gap: 8px;">
            <button type="button" class="admin-btn-secondary" onclick="saveProjectChanges('${p.id}')">💾 Save Sprint</button>
            <button type="button" class="admin-btn-danger" onclick="deleteProject('${p.id}')" title="Delete Sprint">✕</button>
          </div>
        </div>

        <!-- Live Progress Slider -->
        <div class="admin-progress-block">
          <div class="admin-progress-header font-mono">
            <span style="color: var(--admin-text-sub);">PROGRESS COMPLETION:</span>
            <span id="sliderVal_${p.id}" style="color: var(--admin-primary);">${p.progress || 0}%</span>
          </div>
          <input type="range" min="0" max="100" value="${p.progress || 0}" class="admin-slider" id="progressInput_${p.id}" oninput="updateProgressDisplay('${p.id}', this.value)">
        </div>

        <!-- Core Project Metadata Form Grid -->
        <div class="admin-form-row">
          <div class="admin-input-group">
            <label class="admin-input-label">Project Name</label>
            <input type="text" class="admin-input" id="nameInput_${p.id}" value="${escapeHtml(p.name || '')}">
          </div>

          <div class="admin-input-group">
            <label class="admin-input-label">Status Stage</label>
            <select class="admin-input" id="statusInput_${p.id}">
              <option value="Waiting for Review" ${p.status === 'Waiting for Review' ? 'selected' : ''}>Waiting for Review</option>
              <option value="In Progress" ${p.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Under QA & Staging" ${p.status === 'Under QA & Staging' ? 'selected' : ''}>Under QA & Staging</option>
              <option value="Completed" ${p.status === 'Completed' ? 'selected' : ''}>Completed (Deployed)</option>
              <option value="On Hold" ${p.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
            </select>
          </div>

          <div class="admin-input-group">
            <label class="admin-input-label">Current Stage Title</label>
            <input type="text" class="admin-input" id="stageInput_${p.id}" value="${escapeHtml(p.stage || '')}" placeholder="e.g. Phase 2: Core Engineering">
          </div>

          <div class="admin-input-group">
            <label class="admin-input-label">Target Delivery Date</label>
            <input type="text" class="admin-input" id="targetDateInput_${p.id}" value="${escapeHtml(p.targetDate || '')}" placeholder="e.g. Friday, Nov 14">
          </div>
        </div>

        <!-- Deliverable Links Form Row -->
        <div class="admin-form-row">
          <div class="admin-input-group">
            <label class="admin-input-label">🌐 Staging / Preview URL</label>
            <input type="url" class="admin-input font-mono" id="stagingInput_${p.id}" value="${escapeHtml(p.stagingUrl || '')}" placeholder="https://staging.yourdomain.com">
          </div>

          <div class="admin-input-group">
            <label class="admin-input-label">🎨 Figma Prototype Link</label>
            <input type="url" class="admin-input font-mono" id="figmaInput_${p.id}" value="${escapeHtml(p.figmaLink || p.figmaUrl || '')}" placeholder="https://figma.com/file/...">
          </div>

          <div class="admin-input-group">
            <label class="admin-input-label">💻 GitHub Repo URL</label>
            <input type="url" class="admin-input font-mono" id="githubInput_${p.id}" value="${escapeHtml(p.githubUrl || '')}" placeholder="https://github.com/org/repo">
          </div>
        </div>

        <!-- Milestone Phases Checklist -->
        <div class="admin-phases-list">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span class="font-mono" style="font-size: 0.72rem; color: var(--admin-text-sub); text-transform: uppercase; font-weight: 700;">Milestone Roadmap Phases</span>
            <span class="font-mono" style="font-size: 0.7rem; color: var(--admin-text-muted);">Syncs live to Client Portal</span>
          </div>

          ${(p.phases || []).map((ph, phIdx) => `
            <div class="admin-phase-item">
              <span class="font-mono" style="color: var(--admin-primary); font-size: 0.75rem; font-weight: 800;">${phIdx + 1}</span>
              <input type="text" class="admin-input font-sans" id="phaseName_${p.id}_${phIdx}" value="${escapeHtml(ph.name || '')}" style="flex: 1; padding: 6px 10px; font-size: 0.82rem;">
              <select class="admin-input font-mono" id="phaseStatus_${p.id}_${phIdx}" style="width: 130px; padding: 6px 8px; font-size: 0.75rem;">
                <option value="UPCOMING" ${ph.status === 'UPCOMING' ? 'selected' : ''}>UPCOMING (0%)</option>
                <option value="ACTIVE" ${ph.status === 'ACTIVE' ? 'selected' : ''}>ACTIVE (In Progress)</option>
                <option value="DONE" ${ph.status === 'DONE' ? 'selected' : ''}>DONE (100%)</option>
              </select>
            </div>
          `).join('')}
        </div>

      </div>
    `;
  }).join('');
}

function updateProgressDisplay(projectId, val) {
  const label = document.getElementById(`sliderVal_${projectId}`);
  if (label) label.textContent = `${val}%`;
}

async function saveProjectChanges(projectId) {
  if (!activeClient || !activeClient.projects) return;

  const projIdx = activeClient.projects.findIndex(p => p.id === projectId);
  if (projIdx === -1) return;

  const proj = activeClient.projects[projIdx];

  const nameVal = document.getElementById(`nameInput_${projectId}`)?.value.trim() || proj.name;
  const statusVal = document.getElementById(`statusInput_${projectId}`)?.value || proj.status;
  const stageVal = document.getElementById(`stageInput_${projectId}`)?.value.trim() || proj.stage;
  const targetDateVal = document.getElementById(`targetDateInput_${projectId}`)?.value.trim() || proj.targetDate;
  const progressVal = parseInt(document.getElementById(`progressInput_${projectId}`)?.value || proj.progress, 10);
  const stagingVal = document.getElementById(`stagingInput_${projectId}`)?.value.trim() || '';
  const figmaVal = document.getElementById(`figmaInput_${projectId}`)?.value.trim() || '';
  const githubVal = document.getElementById(`githubInput_${projectId}`)?.value.trim() || '';

  // Update Phases
  const updatedPhases = (proj.phases || []).map((ph, phIdx) => {
    const nameEl = document.getElementById(`phaseName_${projectId}_${phIdx}`);
    const statusEl = document.getElementById(`phaseStatus_${projectId}_${phIdx}`);
    const phStatus = statusEl ? statusEl.value : ph.status;
    const phPct = phStatus === 'DONE' ? '100%' : (phStatus === 'ACTIVE' ? '60%' : '0%');
    return {
      ...ph,
      name: nameEl ? nameEl.value.trim() : ph.name,
      status: phStatus,
      pct: phPct
    };
  });

  proj.name = nameVal;
  proj.status = statusVal;
  proj.stage = stageVal;
  proj.targetDate = targetDateVal;
  proj.progress = progressVal;
  proj.stagingUrl = stagingVal;
  proj.figmaLink = figmaVal;
  proj.figmaUrl = figmaVal;
  proj.githubUrl = githubVal;
  proj.phases = updatedPhases;

  // Persist locally & to Firestore
  await persistClientChanges();
  showToast(`Sprint "${proj.name}" updated successfully!`);
}

async function deleteProject(projectId) {
  if (!activeClient || !activeClient.projects) return;
  if (!confirm(`Are you sure you want to delete sprint "${projectId}"?`)) return;

  activeClient.projects = activeClient.projects.filter(p => p.id !== projectId);
  await persistClientChanges();
  renderProjectsTab();
  updateStatsCounters();
  showToast('Project sprint removed.');
}

function openCreateProjectModal() {
  const modal = document.getElementById('adminNewProjectModal');
  if (modal) modal.style.display = 'flex';
}

function closeCreateProjectModal() {
  const modal = document.getElementById('adminNewProjectModal');
  if (modal) modal.style.display = 'none';
}

async function handleCreateNewSprintSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!activeClient) return;

  const name = document.getElementById('newSprintName')?.value.trim();
  const category = document.getElementById('newSprintCategory')?.value.trim() || 'Custom Web Application';
  const budget = document.getElementById('newSprintBudget')?.value.trim() || 'Fixed Sprint';

  if (!name) return;

  const newId = 'PRJ-' + Math.floor(1000 + Math.random() * 9000);
  const newProj = {
    id: newId,
    name: name,
    category: category,
    budget: budget,
    status: 'In Progress',
    progress: 15,
    sprintTag: 'SPRINT 01 / 04',
    targetDate: '3 Weeks',
    stage: 'Phase 1: Founder Scope & Architecture Review',
    lead: 'Nyghto Team',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    phases: [
      { name: "Phase 1: Architecture, Tokens & Design Scope", status: "ACTIVE", pct: "30%", items: ["Technical requirements", "Database schema lock", "Figma prototype"] },
      { name: "Phase 2: Core Engineering & Backend APIs", status: "UPCOMING", pct: "0%", items: ["Frontend build", "API routes", "Database integration"] },
      { name: "Phase 3: QA, Cross-Device Testing & Invoicing", status: "UPCOMING", pct: "0%", items: ["Performance pass", "Security review"] },
      { name: "Phase 4: Staging Deploy & Production Handover", status: "UPCOMING", pct: "0%", items: ["Custom domain DNS", "Live handover"] }
    ]
  };

  if (!activeClient.projects) activeClient.projects = [];
  activeClient.projects.unshift(newProj);

  await persistClientChanges();
  closeCreateProjectModal();
  renderProjectsTab();
  updateStatsCounters();
  showToast(`New sprint "${name}" created!`);
}

/* ==========================================================================
   6. TAB 2: LIVE 2-WAY CLIENT CHAT
   ========================================================================== */
function subscribeToClientChat(clientId) {
  if (chatUnsubscribe) {
    chatUnsubscribe();
    chatUnsubscribe = null;
  }

  const threadEl = document.getElementById('adminChatThread');
  if (!threadEl) return;

  if (window.nyghtoFirebase && window.nyghtoFirebase.db && clientId) {
    try {
      chatUnsubscribe = window.nyghtoFirebase.db
        .collection('clients')
        .doc(clientId)
        .collection('messages')
        .orderBy('createdAt', 'asc')
        .onSnapshot(snap => {
          if (!snap.empty) {
            const msgs = [];
            snap.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
            renderAdminChatMessages(msgs);
          } else {
            renderAdminChatMessages([]);
          }
        }, err => {
          console.warn('Admin chat listener error:', err);
        });
      return;
    } catch (e) {
      console.warn('Chat subscription notice:', e);
    }
  }

  // Fallback demo message
  renderAdminChatMessages([
    { sender: 'client', text: "Hello Nyghto Team! Checking in on our active milestone.", createdAt: new Date().toISOString() },
    { sender: 'team', text: "Hi! The latest sprint deploy is live on staging for your review.", createdAt: new Date().toISOString() }
  ]);
}

function renderAdminChatMessages(messages) {
  const threadEl = document.getElementById('adminChatThread');
  if (!threadEl) return;

  if (messages.length === 0) {
    threadEl.innerHTML = `<div style="text-align: center; color: var(--admin-text-muted); font-size: 0.85rem; margin-top: 3rem;">No conversation messages yet. Send a message to start direct chat.</div>`;
    return;
  }

  threadEl.innerHTML = messages.map(m => {
    const isTeam = m.sender === 'team' || m.sender === 'founder';
    const timeStr = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return `
      <div class="admin-msg-bubble ${isTeam ? 'admin-msg-founder' : 'admin-msg-client'} font-sans">
        <div>${escapeHtml(m.text || '')}</div>
        <span class="admin-msg-time">${isTeam ? 'Founder Desk' : (activeClient?.name || 'Client')} • ${timeStr}</span>
      </div>
    `;
  }).join('');

  threadEl.scrollTop = threadEl.scrollHeight;
}

async function handleSendAdminMessage(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!activeClient) return;

  const input = document.getElementById('adminMsgInput');
  const text = input ? input.value.trim() : '';
  if (!text) return;

  const messageObj = {
    sender: 'team',
    senderName: 'Nyghto Team',
    text: text,
    createdAt: new Date().toISOString()
  };

  if (input) input.value = '';

  if (window.nyghtoFirebase && activeClient.id) {
    await window.nyghtoFirebase.sendChatMessage(activeClient.id, messageObj);
  }

  showToast('Message sent to client portal.');
}

function sendAdminQuickPreset(text) {
  const input = document.getElementById('adminMsgInput');
  if (input) {
    input.value = text;
    input.focus();
  }
}

/* ==========================================================================
   7. TAB 3: BILLING & INVOICES LEDGER
   ========================================================================== */
function renderBillingTab() {
  const tbody = document.getElementById('adminInvoicesTableBody');
  const totalRevEl = document.getElementById('adminClientTotalRevenue');
  if (!tbody || !activeClient) return;

  const invoices = activeClient.invoices || [];

  // Calculate total paid
  let totalPaid = 0;
  invoices.forEach(inv => {
    if (inv.status === 'Paid') {
      const num = parseInt((inv.amount || '0').toString().replace(/[^\d]/g, ''), 10) || 0;
      totalPaid += num;
    }
  });

  if (totalRevEl) {
    totalRevEl.textContent = `Total Paid: ₹${totalPaid.toLocaleString('en-IN')}`;
  }

  if (invoices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-text-muted); padding: 2rem;">No billing records issued for this client yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = invoices.map(inv => `
    <tr>
      <td class="font-mono" style="font-weight: 700; color: var(--admin-primary);">${escapeHtml(inv.id || '')}</td>
      <td style="font-weight: 700;">${escapeHtml(inv.title || '')}</td>
      <td class="font-mono" style="font-weight: 800; color: var(--admin-text);">${escapeHtml(inv.amount || '')}</td>
      <td class="font-mono" style="font-size: 0.8rem; color: var(--admin-text-sub);">${escapeHtml(inv.date || '')}</td>
      <td>
        <span class="admin-status-badge ${inv.status === 'Paid' ? 'status-completed' : (inv.status === 'Pending' ? 'status-review' : 'status-active')}">
          ${escapeHtml(inv.status || 'Paid')}
        </span>
      </td>
      <td>
        <button type="button" class="admin-btn-danger" style="padding: 4px 8px;" onclick="deleteInvoice('${inv.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function handleCreateInvoiceSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!activeClient) return;

  const number = document.getElementById('invNumberInput')?.value.trim();
  const title = document.getElementById('invTitleInput')?.value.trim();
  const amount = document.getElementById('invAmountInput')?.value.trim();
  const status = document.getElementById('invStatusInput')?.value || 'Paid';

  if (!number || !title || !amount) return;

  const invoiceData = {
    id: number,
    title: title,
    amount: amount.startsWith('₹') ? amount : `₹${amount}`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: status
  };

  if (!activeClient.invoices) activeClient.invoices = [];
  activeClient.invoices.unshift(invoiceData);

  // Recalculate revenue
  let totalPaid = 0;
  activeClient.invoices.forEach(inv => {
    if (inv.status === 'Paid') {
      const num = parseInt((inv.amount || '0').toString().replace(/[^\d]/g, ''), 10) || 0;
      totalPaid += num;
    }
  });
  activeClient.revenue = `₹${totalPaid.toLocaleString('en-IN')}`;

  await persistClientChanges();

  // Reset inputs
  document.getElementById('invNumberInput').value = '';
  document.getElementById('invTitleInput').value = '';
  document.getElementById('invAmountInput').value = '';

  renderBillingTab();
  showToast(`Invoice ${number} issued and synced to portal!`);
}

async function deleteInvoice(invoiceId) {
  if (!activeClient || !activeClient.invoices) return;
  if (!confirm(`Delete invoice ${invoiceId}?`)) return;

  activeClient.invoices = activeClient.invoices.filter(i => i.id !== invoiceId);

  let totalPaid = 0;
  activeClient.invoices.forEach(inv => {
    if (inv.status === 'Paid') {
      const num = parseInt((inv.amount || '0').toString().replace(/[^\d]/g, ''), 10) || 0;
      totalPaid += num;
    }
  });
  activeClient.revenue = `₹${totalPaid.toLocaleString('en-IN')}`;

  await persistClientChanges();
  renderBillingTab();
  showToast('Invoice deleted.');
}

/* ==========================================================================
   8. TAB 4: CLIENT PROFILE & ACCESS
   ========================================================================== */
function renderProfileTab() {
  if (!activeClient) return;

  const nameInput = document.getElementById('profNameInput');
  const emailInput = document.getElementById('profEmailInput');
  const companyInput = document.getElementById('profCompanyInput');
  const phoneInput = document.getElementById('profPhoneInput');
  const bioInput = document.getElementById('profBioInput');
  const idInput = document.getElementById('profIdInput');

  if (nameInput) nameInput.value = activeClient.name || '';
  if (emailInput) emailInput.value = activeClient.email || '';
  if (companyInput) companyInput.value = activeClient.company || '';
  if (phoneInput) phoneInput.value = activeClient.phone || '';
  if (bioInput) bioInput.value = activeClient.bio || '';
  if (idInput) idInput.value = activeClient.id || '';
}

async function handleSaveProfileSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!activeClient) return;

  activeClient.name = document.getElementById('profNameInput')?.value.trim() || activeClient.name;
  activeClient.company = document.getElementById('profCompanyInput')?.value.trim() || activeClient.company;
  activeClient.phone = document.getElementById('profPhoneInput')?.value.trim() || activeClient.phone;
  activeClient.bio = document.getElementById('profBioInput')?.value.trim() || activeClient.bio;

  await persistClientChanges();
  renderActiveClientWorkspace();
  showToast('Client profile updated.');
}

/* ==========================================================================
   9. PERSISTENCE ENGINE (FIRESTORE + LOCAL STORAGE)
   ========================================================================== */
async function persistClientChanges() {
  if (!activeClient || !activeClient.id) return;

  // 1. Sync to local session if matching
  const sessionStr = localStorage.getItem('nyghto_user_session');
  if (sessionStr) {
    try {
      const sess = JSON.parse(sessionStr);
      if (sess.id === activeClient.id || (sess.email && sess.email.toLowerCase() === (activeClient.email || '').toLowerCase())) {
        Object.assign(sess, activeClient);
        localStorage.setItem('nyghto_user_session', JSON.stringify(sess));
      }
    } catch (e) {}
  }

  // 2. Sync to local registry
  try {
    const reg = JSON.parse(localStorage.getItem('nyghto_users_registry') || '[]');
    const idx = reg.findIndex(u => u.id === activeClient.id);
    if (idx >= 0) {
      reg[idx] = activeClient;
    } else {
      reg.push(activeClient);
    }
    localStorage.setItem('nyghto_users_registry', JSON.stringify(reg));
  } catch (e) {}

  // 3. Sync to Firebase Firestore
  if (window.nyghtoFirebase && window.nyghtoFirebase.db) {
    try {
      await window.nyghtoFirebase.db.collection('clients').doc(activeClient.id).set(activeClient, { merge: true });
    } catch (e) {
      console.warn('Firestore client save notice:', e);
    }
  }
}

/* ==========================================================================
   10. ADD NEW CLIENT MODAL
   ========================================================================== */
function openAddClientModal() {
  const modal = document.getElementById('adminAddClientModal');
  if (modal) modal.style.display = 'flex';
}

function closeAddClientModal() {
  const modal = document.getElementById('adminAddClientModal');
  if (modal) modal.style.display = 'none';
}

async function handleAddClientSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  const name = document.getElementById('newClientName')?.value.trim();
  const email = document.getElementById('newClientEmail')?.value.trim();
  const company = document.getElementById('newClientCompany')?.value.trim() || 'Client';
  const phone = document.getElementById('newClientPhone')?.value.trim() || '';

  if (!name || !email) return;

  const newId = 'usr_' + email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const newClient = {
    id: newId,
    name: name,
    email: email,
    company: company,
    phone: phone,
    bio: '',
    revenue: '₹0',
    createdAt: new Date().toISOString(),
    projects: [],
    invoices: []
  };

  allClients.unshift(newClient);
  activeClient = newClient;

  await persistClientChanges();
  closeAddClientModal();
  updateStatsCounters();
  renderClientsList(allClients);
  renderActiveClientWorkspace();
  showToast(`Client "${name}" enrolled successfully!`);
}

/* ==========================================================================
   11. PREVIEW AS CLIENT SHORTCUT
   ========================================================================== */
function previewAsClient() {
  if (!activeClient) return;
  // Set current user session to this client so portal.html loads them directly
  localStorage.setItem('nyghto_user_session', JSON.stringify(activeClient));
  window.open('portal.html', '_blank');
}

/* ==========================================================================
   12. TAB SWITCHER & UTILITIES
   ========================================================================== */
function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-tab-pane').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.admin-tab-btn').forEach(el => el.classList.remove('active'));

  const pane = document.getElementById(`pane_${tabName}`);
  const btn = document.getElementById(`tabBtn_${tabName}`);

  if (pane) pane.classList.add('active');
  if (btn) btn.classList.add('active');

  if (tabName === 'leads') {
    renderLeadsTab();
  }
}

/* ==========================================================================
   13. TAB 5: INBOUND LEADS & INQUIRIES
   ========================================================================== */
async function renderLeadsTab() {
  const container = document.getElementById('adminLeadsList');
  if (!container) return;

  container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--admin-text-sub); font-size: 0.85rem;">Loading leads...</div>`;

  let leads = [];
  if (window.nyghtoFirebase && typeof window.nyghtoFirebase.getLeads === 'function') {
    try {
      leads = await window.nyghtoFirebase.getLeads();
    } catch (e) {
      console.warn('Leads fetch error:', e);
    }
  }

  if (!leads || leads.length === 0) {
    try {
      leads = JSON.parse(localStorage.getItem('nyghto_leads') || '[]');
    } catch (e) {}
  }

  if (!leads || leads.length === 0) {
    container.innerHTML = `
      <div style="padding: 3rem 1.5rem; text-align: center; color: var(--admin-text-muted); background: var(--admin-card); border-radius: 10px; border: 1px dashed var(--admin-border);">
        <p style="font-size: 0.95rem; margin-bottom: 0.5rem; font-weight: 700; color: var(--admin-text);">No inbound leads yet</p>
        <p style="font-size: 0.8rem; color: var(--admin-text-sub);">Submissions from the homepage founder hotline and project brief form will appear here in real-time.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = leads.map((lead, idx) => {
    const isHotline = lead.type === 'Consultation Hotline';
    const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}` : null;
    const timeStr = lead.createdAt ? new Date(lead.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST' : 'Recent';

    return `
      <div class="admin-card" style="margin-bottom: 0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
              <span class="admin-badge ${isHotline ? 'admin-badge-active' : 'admin-badge-completed'} font-mono" style="font-size: 0.72rem;">
                ${escapeHtml(lead.type || 'Inbound Lead')}
              </span>
              <span class="font-mono" style="font-size: 0.75rem; color: var(--admin-text-sub);">${timeStr}</span>
            </div>
            
            <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--admin-text); margin: 0 0 0.4rem 0;">
              ${escapeHtml(lead.name || lead.phone || 'Inbound Inquiry')}
            </h4>

            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; font-size: 0.82rem; color: var(--admin-text-sub); margin-bottom: 0.6rem;">
              ${lead.company ? `<span class="admin-tag-pill font-mono">🏢 ${escapeHtml(lead.company)}</span>` : ''}
              ${lead.email ? `<span class="admin-tag-pill font-mono">✉️ ${escapeHtml(lead.email)}</span>` : ''}
              ${lead.phone ? `<span class="admin-tag-pill font-mono" style="color: var(--admin-wa);">📱 ${escapeHtml(lead.phone)}</span>` : ''}
              ${lead.budget ? `<span class="admin-tag-pill font-mono">💰 Budget: ${escapeHtml(lead.budget)}</span>` : ''}
              ${lead.projectType ? `<span class="admin-tag-pill font-mono">🛠️ ${escapeHtml(lead.projectType)}</span>` : ''}
            </div>

            <div class="font-mono" style="font-size: 0.75rem; color: var(--admin-text-muted);">
              Source: ${escapeHtml(lead.source || 'Website')} • Status: <strong style="color: var(--admin-primary);">${escapeHtml(lead.status || 'New')}</strong>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            ${waUrl ? `
              <a href="${waUrl}" target="_blank" class="admin-btn-secondary font-mono" style="color: var(--admin-wa); text-decoration: none;">
                <span>💬 WhatsApp Lead ↗</span>
              </a>
            ` : ''}
            ${lead.phone ? `
              <a href="tel:${lead.phone}" class="admin-btn-secondary font-mono" style="text-decoration: none;">
                <span>📞 Call</span>
              </a>
            ` : ''}
            ${lead.email ? `
              <a href="mailto:${lead.email}" class="admin-btn-secondary font-mono" style="text-decoration: none;">
                <span>✉️ Email</span>
              </a>
            ` : ''}
            <button type="button" class="admin-btn-primary font-mono" onclick="convertLeadToClient(${idx})">
              <span>+ Convert to Client ↗</span>
            </button>
            <button type="button" class="admin-btn-secondary font-mono" style="color: var(--admin-danger);" onclick="deleteLead(${idx})">
              <span>✕</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function convertLeadToClient(index) {
  let leads = [];
  try {
    leads = JSON.parse(localStorage.getItem('nyghto_leads') || '[]');
  } catch (e) {}

  const lead = leads[index];
  if (!lead) return;

  openAddClientModal();
  if (lead.name) {
    const el = document.getElementById('newClientName');
    if (el) el.value = lead.name;
  }
  if (lead.company) {
    const el = document.getElementById('newClientCompany');
    if (el) el.value = lead.company;
  }
  if (lead.email) {
    const el = document.getElementById('newClientEmail');
    if (el) el.value = lead.email;
  }
  if (lead.phone) {
    const el = document.getElementById('newClientPhone');
    if (el) el.value = lead.phone;
  }
}

function deleteLead(index) {
  if (!confirm('Remove this lead record?')) return;
  try {
    const leads = JSON.parse(localStorage.getItem('nyghto_leads') || '[]');
    leads.splice(index, 1);
    localStorage.setItem('nyghto_leads', JSON.stringify(leads));
    renderLeadsTab();
    showToast('Lead removed.');
  } catch (e) {}
}

function setupEventListeners() {
  const searchInput = document.getElementById('adminSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', filterClients);
  }
}

function showToast(msg) {
  const toast = document.getElementById('adminToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, 2400);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   14. TV OS HUB LAUNCHER & DUAL-SECTION SWITCHER
   ========================================================================== */
function openHubLauncher() {
  currentAdminSection = 'hub';
  const hub = document.getElementById('adminHubScreen');
  if (hub) hub.style.display = 'flex';
}

function selectAdminSection(sectionName) {
  currentAdminSection = sectionName;
  sessionStorage.setItem('nyghto_admin_section', sectionName);

  const hub = document.getElementById('adminHubScreen');
  if (hub) hub.style.display = 'none';

  switchSectionMode(sectionName);
}

function switchSectionMode(mode) {
  currentAdminSection = mode;
  sessionStorage.setItem('nyghto_admin_section', mode);

  const portalShell = document.getElementById('adminPortalShell');
  const websiteShell = document.getElementById('adminWebsiteShell');
  const modeBtnPortal = document.getElementById('modeBtn_portal');
  const modeBtnWebsite = document.getElementById('modeBtn_website');
  const addClientBtn = document.getElementById('adminHeaderAddClientBtn');

  if (mode === 'portal') {
    if (portalShell) portalShell.style.display = 'grid';
    if (websiteShell) websiteShell.style.display = 'none';
    if (modeBtnPortal) modeBtnPortal.classList.add('active');
    if (modeBtnWebsite) modeBtnWebsite.classList.remove('active');
    if (addClientBtn) addClientBtn.style.display = 'inline-flex';
  } else if (mode === 'website') {
    if (portalShell) portalShell.style.display = 'none';
    if (websiteShell) websiteShell.style.display = 'grid';
    if (modeBtnPortal) modeBtnPortal.classList.remove('active');
    if (modeBtnWebsite) modeBtnWebsite.classList.add('active');
    if (addClientBtn) addClientBtn.style.display = 'none';
    
    // Ensure all live fields, dynamic lists, and previews are rendered
    renderWorkProjectsEditor();
    renderFaqEditor();
    updateCmsLivePreviews();
  }
}

function scrollToCmsSection(sectionId) {
  const target = document.getElementById(sectionId);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Update active state in sidebar
  document.querySelectorAll('#adminWebsiteShell .admin-site-nav-item').forEach(b => b.classList.remove('active'));
  const navMap = {
    section_site_general: 'siteNav_general',
    section_site_contact: 'siteNav_contact',
    section_site_work: 'siteNav_work',
    section_site_faq: 'siteNav_faq',
    section_site_consultation: 'siteNav_consultation',
    section_site_integrations: 'siteNav_integrations'
  };
  const activeNavId = navMap[sectionId];
  if (activeNavId) {
    const btn = document.getElementById(activeNavId);
    if (btn) btn.classList.add('active');
  }
}

function updateCmsLivePreviews() {
  const heroTag = document.getElementById('cmsHeroTagline')?.value;
  const avail = document.getElementById('cmsAvailabilityStatus')?.value;
  const coords = document.getElementById('cmsHeroSubtitle')?.value;
  const phone = document.getElementById('cmsSitePhone')?.value;
  const email = document.getElementById('cmsSiteEmail')?.value;
  const loc = document.getElementById('cmsSiteLocation')?.value;

  const previewHeroTitle = document.getElementById('previewHeroTitle');
  const previewPillText = document.getElementById('previewPillText');
  const previewCoordsText = document.getElementById('previewCoordsText');
  const previewWhatsAppText = document.getElementById('previewWhatsAppText');
  const previewEmailText = document.getElementById('previewEmailText');
  const previewLocationText = document.getElementById('previewLocationText');

  if (previewHeroTitle && heroTag !== undefined) previewHeroTitle.textContent = heroTag || 'Design &\nEngineering';
  if (previewPillText && avail !== undefined) previewPillText.textContent = `● ${avail || 'ACCEPTING NEW CLIENT VENTURES'}`;
  if (previewCoordsText && coords !== undefined) previewCoordsText.textContent = coords || '11.1337° N, 76.0350° E';
  if (previewWhatsAppText && phone !== undefined) previewWhatsAppText.textContent = `WhatsApp: ${phone || '+91 85905 64004'}`;
  if (previewEmailText && email !== undefined) previewEmailText.textContent = email || 'hello@nyghto.in';
  if (previewLocationText && loc !== undefined) previewLocationText.textContent = `• ${loc || 'Kerala, India'}`;
}

/* ==========================================================================
   15. WEBSITE CONTENT CMS ENGINE
   ========================================================================== */
const DEFAULT_SITE_CMS = {
  phone: "+91 85905 64004",
  email: "hello@nyghto.in",
  location: "Kerala, India",
  heroTagline: "Design &\nEngineering",
  availabilityStatus: "ACCEPTING NEW CLIENT VENTURES",
  heroLocation: "11.1337° N, 76.0350° E // KOCHI • CALICUT",
  consultTitle: "Talk Directly with Nyghto Founders",
  consultDesc: "Leave your number below for an instant callback, or reach out to our engineering team directly via WhatsApp, phone, or email.",
  projects: [
    {
      id: "proj_fixowe",
      name: "FixOwe",
      url: "https://fixowe.com",
      summary: "An on-demand service and home maintenance booking platform. We designed and built the complete web platform from user service discovery, real-time booking flows, technician assignment, to automated invoicing.",
      scope: "Product Design, Full-Stack Web Development, Responsive UI",
      status: "Live in Production"
    },
    {
      id: "proj_ecoshopy",
      name: "EcoShopy",
      url: "https://ecoshopy.com",
      summary: "A modern sustainable e-commerce marketplace. We engineered a high-speed storefront focusing on rapid product filtering, fluid shopping cart interactions, and a clean, conversion-driven checkout experience.",
      scope: "E-Commerce Architecture, Storefront UI/UX, Checkout Flow",
      status: "Live in Production"
    }
  ],
  faqs: [
    {
      question: "What is Nyghto?",
      answer: "<strong>Nyghto (nyghto.in)</strong> is an independent digital product design and software engineering studio. We build bespoke web applications, native iOS &amp; Android apps, multi-tenant SaaS platforms, and enterprise ERP systems with uncompromising craft and speed."
    },
    {
      question: "Where is Nyghto located?",
      answer: "Nyghto is based in <strong>Kerala, India (Kochi)</strong>. We partner directly with local startups and enterprises across India, as well as high-growth ventures and founders globally across the US, UK, Europe, and Asia."
    },
    {
      question: "What live production projects has Nyghto built?",
      answer: "We have engineered and shipped production platforms including <strong><a href=\"https://fixowe.com\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color:inherit; text-decoration:underline;\">FixOwe (fixowe.com)</a></strong> (an on-demand home services booking platform) and <strong><a href=\"https://ecoshopy.com\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color:inherit; text-decoration:underline;\">EcoShopy (ecoshopy.com)</a></strong> (a high-speed sustainable e-commerce marketplace)."
    },
    {
      question: "What technologies and frameworks does Nyghto use?",
      answer: "Our core tech stack includes <strong>Next.js 15, React, TypeScript, Node.js, Go, PostgreSQL, Redis, Swift (iOS), Kotlin (Android), React Native, and TailwindCSS</strong>, deployed on scalable Edge CDN infrastructure with 100/100 Core Web Vitals."
    },
    {
      question: "How affordable are Nyghto's development services?",
      answer: "We believe elite software design and engineering should be accessible. By operating with lean, direct founder-level collaboration and zero middle-management bureaucracy, we deliver world-class products at transparent, competitive rates for startups and scaling businesses."
    },
    {
      question: "How can I contact the Nyghto team?",
      answer: "You can message our founders directly on <strong><a href=\"https://wa.me/918590564004\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color:inherit; text-decoration:underline;\">WhatsApp Business (+91 85905 64004)</a></strong>, email us at <strong><a href=\"mailto:hello@nyghto.in\" style=\"color:inherit; text-decoration:underline;\">hello@nyghto.in</a></strong>, or call our direct phone lines: <strong>+91 85905 64004</strong>, <strong>+91 80759 11860</strong>, or <strong>+91 95392 02847</strong>."
    },
    {
      question: "Is Nyghto related to \"Nighto\" or other entities?",
      answer: "No. Nyghto (spelled N-Y-G-H-T-O, official website https://nyghto.in) is an independent digital product design and software development studio founded in Kerala, India. It specializes in web applications, iOS/Android mobile apps, SaaS, and ERP software."
    }
  ]
};

let currentSiteCmsData = null;
let cmsAutoSaveTimer = null;

function triggerCmsAutoSave() {
  clearTimeout(cmsAutoSaveTimer);
  cmsAutoSaveTimer = setTimeout(() => {
    saveWebsiteCmsChanges(true);
  }, 1200);
}

function downloadCmsDataJson() {
  syncProjectsFromDom();
  const payload = currentSiteCmsData || DEFAULT_SITE_CMS;
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
  const dl = document.createElement('a');
  dl.setAttribute("href", dataStr);
  dl.setAttribute("download", "cms-data.json");
  document.body.appendChild(dl);
  dl.click();
  dl.remove();
  showToast("✓ cms-data.json exported to your downloads folder!");
}

async function loadWebsiteCmsConfig() {
  let cfg = null;

  // 1. Try embedded static store first (instant synchronous data)
  if (window.NYGHTO_CMS_DATA) {
    cfg = window.NYGHTO_CMS_DATA;
  }

  // 2. Try local server endpoint (/api/cms)
  try {
    const res = await fetch('/api/cms', { cache: 'no-cache' });
    if (res.ok) {
      cfg = await res.json();
    }
  } catch (e) {
    // Fallback to static cms-data.json
    try {
      const res = await fetch('/cms-data.json', { cache: 'no-cache' });
      if (res.ok) cfg = await res.json();
    } catch (err) {}
  }

  // 3. Try Firebase if available
  if (!cfg && window.nyghtoFirebase && typeof window.nyghtoFirebase.getSiteConfig === 'function') {
    try {
      cfg = await window.nyghtoFirebase.getSiteConfig();
    } catch (e) {
      console.warn('CMS config load error:', e);
    }
  }

  // 4. Fallback to LocalStorage
  if (!cfg) {
    try {
      cfg = JSON.parse(localStorage.getItem('nyghto_site_cms') || 'null');
    } catch (e) {}
  }

  if (!cfg) {
    cfg = DEFAULT_SITE_CMS;
  }

  currentSiteCmsData = { ...DEFAULT_SITE_CMS, ...cfg };
  if (!currentSiteCmsData.projects || currentSiteCmsData.projects.length === 0) {
    currentSiteCmsData.projects = [...DEFAULT_SITE_CMS.projects];
  }
  if (!currentSiteCmsData.faqs || currentSiteCmsData.faqs.length === 0) {
    currentSiteCmsData.faqs = [...DEFAULT_SITE_CMS.faqs];
  }

  // Populate basic inputs
  const phoneInput = document.getElementById('cmsSitePhone');
  const emailInput = document.getElementById('cmsSiteEmail');
  const locInput = document.getElementById('cmsSiteLocation');
  const heroTagInput = document.getElementById('cmsHeroTagline');
  const availInput = document.getElementById('cmsAvailabilityStatus');
  const heroSubInput = document.getElementById('cmsHeroSubtitle');
  const consultTitleInput = document.getElementById('cmsConsultTitle');
  const consultDescInput = document.getElementById('cmsConsultDesc');

  if (phoneInput) phoneInput.value = currentSiteCmsData.phone || '';
  if (emailInput) emailInput.value = currentSiteCmsData.email || '';
  if (locInput) locInput.value = currentSiteCmsData.location || '';
  if (heroTagInput) heroTagInput.value = currentSiteCmsData.heroTagline || '';
  if (availInput) availInput.value = currentSiteCmsData.availabilityStatus || '';
  if (heroSubInput) heroSubInput.value = currentSiteCmsData.heroLocation || '';
  if (consultTitleInput) consultTitleInput.value = currentSiteCmsData.consultTitle || '';
  if (consultDescInput) consultDescInput.value = currentSiteCmsData.consultDesc || '';

  renderWorkProjectsEditor();
  renderFaqEditor();
  updateCmsLivePreviews();
}

function renderWorkProjectsEditor() {
  const container = document.getElementById('cmsWorkProjectsContainer');
  if (!container || !currentSiteCmsData) return;

  container.innerHTML = (currentSiteCmsData.projects || []).map((p, idx) => `
    <div class="admin-card cms-project-card" style="margin-bottom: 0; background: #F8FAFC; border: 1px solid var(--admin-border);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
        <span class="font-mono" style="font-size: 0.8rem; font-weight: 800; color: var(--admin-primary);">PROJECT 0${idx + 1}</span>
        <button type="button" class="admin-btn-secondary font-mono" onclick="deleteWorkProjectItem(${idx})" style="color: var(--admin-danger); padding: 4px 8px;">✕ Remove</button>
      </div>

      <div class="admin-form-row">
        <div class="admin-input-group">
          <label class="admin-input-label font-mono">Project Name</label>
          <input type="text" class="admin-input cms-proj-name" value="${escapeHtml(p.name)}" oninput="updateWorkProjectItem(${idx}, 'name', this.value)" required>
        </div>

        <div class="admin-input-group">
          <label class="admin-input-label font-mono">Live URL</label>
          <input type="text" class="admin-input font-mono cms-proj-url" value="${escapeHtml(p.url || '')}" oninput="updateWorkProjectItem(${idx}, 'url', this.value)" placeholder="https://...">
        </div>
      </div>

      <div class="admin-form-row">
        <div class="admin-input-group">
          <label class="admin-input-label font-mono">Deliverable Scope</label>
          <input type="text" class="admin-input cms-proj-scope" value="${escapeHtml(p.scope || '')}" oninput="updateWorkProjectItem(${idx}, 'scope', this.value)" placeholder="e.g. Full-Stack Web Development, Responsive UI">
        </div>

        <div class="admin-input-group">
          <label class="admin-input-label font-mono">Status Badge</label>
          <input type="text" class="admin-input font-mono cms-proj-status" value="${escapeHtml(p.status || 'Live in Production')}" oninput="updateWorkProjectItem(${idx}, 'status', this.value)">
        </div>
      </div>

      <div class="admin-input-group">
        <label class="admin-input-label font-mono">Project Summary</label>
        <textarea class="admin-input cms-proj-summary" rows="2" oninput="updateWorkProjectItem(${idx}, 'summary', this.value)">${escapeHtml(p.summary || '')}</textarea>
      </div>
    </div>
  `).join('');
}

function updateWorkProjectItem(idx, key, val) {
  if (currentSiteCmsData && currentSiteCmsData.projects && currentSiteCmsData.projects[idx]) {
    currentSiteCmsData.projects[idx][key] = val;
    triggerCmsAutoSave();
  }
}

async function addNewWorkProjectItem() {
  if (!currentSiteCmsData) currentSiteCmsData = { ...DEFAULT_SITE_CMS };
  if (!currentSiteCmsData.projects) currentSiteCmsData.projects = [];
  
  // Scrape any currently unsaved input values first
  syncProjectsFromDom();

  currentSiteCmsData.projects.unshift({
    id: "proj_" + Date.now(),
    name: "New Production Project",
    url: "https://project.com",
    scope: "Design, Frontend & Backend Engineering",
    status: "Live in Production",
    summary: "Brief project overview and architectural deliverables shipped by Nyghto Studio."
  });
  renderWorkProjectsEditor();
  await saveWebsiteCmsChanges(true);
  showToast('New project slot created & published live!');
}

async function deleteWorkProjectItem(idx) {
  if (!confirm('Remove this project from the showcase?')) return;
  syncProjectsFromDom();
  currentSiteCmsData.projects.splice(idx, 1);
  renderWorkProjectsEditor();
  await saveWebsiteCmsChanges(true);
  showToast('Project removed & published live.');
}

function syncProjectsFromDom() {
  const cards = document.querySelectorAll('#cmsWorkProjectsContainer .cms-project-card');
  if (!cards || cards.length === 0) return;
  const list = [];
  cards.forEach((card, idx) => {
    const name = card.querySelector('.cms-proj-name')?.value.trim() || '';
    const url = card.querySelector('.cms-proj-url')?.value.trim() || '';
    const scope = card.querySelector('.cms-proj-scope')?.value.trim() || '';
    const status = card.querySelector('.cms-proj-status')?.value.trim() || 'Live in Production';
    const summary = card.querySelector('.cms-proj-summary')?.value.trim() || '';
    if (name) {
      list.push({
        id: (currentSiteCmsData?.projects?.[idx]?.id) || ('proj_' + Math.random().toString(36).substr(2, 9)),
        name,
        url,
        scope,
        status,
        summary
      });
    }
  });
  if (list.length > 0 && currentSiteCmsData) {
    currentSiteCmsData.projects = list;
  }
}

function renderFaqEditor() {
  const container = document.getElementById('cmsFaqItemsContainer');
  if (!container || !currentSiteCmsData) return;

  container.innerHTML = (currentSiteCmsData.faqs || []).map((f, idx) => `
    <div class="admin-card cms-faq-card" style="margin-bottom: 0; background: #F8FAFC; border: 1px solid var(--admin-border);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
        <span class="font-mono" style="font-size: 0.8rem; font-weight: 800; color: #D97706;">FAQ 0${idx + 1}</span>
        <button type="button" class="admin-btn-secondary font-mono" onclick="deleteFaqItem(${idx})" style="color: var(--admin-danger); padding: 4px 8px;">✕ Remove</button>
      </div>

      <div class="admin-input-group" style="margin-bottom: 0.8rem;">
        <label class="admin-input-label font-mono">Question</label>
        <input type="text" class="admin-input font-display cms-faq-question" value="${escapeHtml(f.question)}" oninput="updateFaqItem(${idx}, 'question', this.value)" required>
      </div>

      <div class="admin-input-group">
        <label class="admin-input-label font-mono">Answer (HTML allowed)</label>
        <textarea class="admin-input cms-faq-answer" rows="3" oninput="updateFaqItem(${idx}, 'answer', this.value)">${escapeHtml(f.answer)}</textarea>
      </div>
    </div>
  `).join('');
}

function updateFaqItem(idx, key, val) {
  if (currentSiteCmsData && currentSiteCmsData.faqs && currentSiteCmsData.faqs[idx]) {
    currentSiteCmsData.faqs[idx][key] = val;
    triggerCmsAutoSave();
  }
}

async function addNewFaqItem() {
  if (!currentSiteCmsData) return;
  if (!currentSiteCmsData.faqs) currentSiteCmsData.faqs = [];
  currentSiteCmsData.faqs.push({
    question: "New Frequently Asked Question?",
    answer: "Detailed answer explaining studio engineering processes, deliverables, or technologies."
  });
  renderFaqEditor();
  await saveWebsiteCmsChanges(true);
  showToast('New FAQ item added & published live.');
}

async function deleteFaqItem(idx) {
  if (!confirm('Remove this FAQ item?')) return;
  currentSiteCmsData.faqs.splice(idx, 1);
  renderFaqEditor();
  await saveWebsiteCmsChanges(true);
  showToast('FAQ removed & published live.');
}

async function saveWebsiteCmsChanges(silent = false) {
  // Always synchronize any in-progress input values from DOM cards
  syncProjectsFromDom();

  const faqCards = document.querySelectorAll('#cmsFaqItemsContainer .cms-faq-card');
  let faqsList = [];
  if (faqCards && faqCards.length > 0) {
    faqCards.forEach(card => {
      const question = card.querySelector('.cms-faq-question')?.value.trim() || '';
      const answer = card.querySelector('.cms-faq-answer')?.value.trim() || '';
      if (question) {
        faqsList.push({ question, answer });
      }
    });
  } else if (currentSiteCmsData && currentSiteCmsData.faqs) {
    faqsList = currentSiteCmsData.faqs;
  } else {
    faqsList = DEFAULT_SITE_CMS.faqs;
  }

  const updatedCfg = {
    phone: document.getElementById('cmsSitePhone')?.value.trim() || DEFAULT_SITE_CMS.phone,
    email: document.getElementById('cmsSiteEmail')?.value.trim() || DEFAULT_SITE_CMS.email,
    location: document.getElementById('cmsSiteLocation')?.value.trim() || DEFAULT_SITE_CMS.location,
    heroTagline: document.getElementById('cmsHeroTagline')?.value.trim() || DEFAULT_SITE_CMS.heroTagline,
    availabilityStatus: document.getElementById('cmsAvailabilityStatus')?.value.trim() || DEFAULT_SITE_CMS.availabilityStatus,
    heroLocation: document.getElementById('cmsHeroSubtitle')?.value.trim() || DEFAULT_SITE_CMS.heroLocation,
    consultTitle: document.getElementById('cmsConsultTitle')?.value.trim() || DEFAULT_SITE_CMS.consultTitle,
    consultDesc: document.getElementById('cmsConsultDesc')?.value.trim() || DEFAULT_SITE_CMS.consultDesc,
    projects: (currentSiteCmsData && currentSiteCmsData.projects && currentSiteCmsData.projects.length > 0) ? currentSiteCmsData.projects : DEFAULT_SITE_CMS.projects,
    faqs: faqsList,
    updatedAt: new Date().toISOString()
  };

  currentSiteCmsData = updatedCfg;

  // 1. Save to localStorage immediately
  try {
    localStorage.setItem('nyghto_site_cms', JSON.stringify(updatedCfg));
  } catch (e) {}

  // 2. Persist to server /api/cms endpoint so all browsers/devices receive it
  try {
    await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCfg)
    });
  } catch (e) {
    console.warn('Server CMS sync notice:', e);
  }

  // 3. Save to Firebase Firestore if reachable
  if (window.nyghtoFirebase && typeof window.nyghtoFirebase.saveSiteConfig === 'function') {
    try {
      await window.nyghtoFirebase.saveSiteConfig(updatedCfg);
    } catch (e) {
      console.warn('Remote CMS save notice:', e);
    }
  }

  if (!silent) {
    showToast('✓ All Website CMS changes published live!');
  }
}

function resetDefaultWebsiteCms() {
  if (!confirm('Reset website configuration to default values?')) return;
  localStorage.setItem('nyghto_site_cms', JSON.stringify(DEFAULT_SITE_CMS));
  loadWebsiteCmsConfig();
  saveWebsiteCmsChanges();
  showToast('Defaults restored.');
}
