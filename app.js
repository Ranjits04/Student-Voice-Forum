const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const departments = ["Academics", "Library", "Hostel", "Canteen", "Transport", "Placements", "Sports", "Administration"];
const categories = ["Maintenance", "Safety", "Suggestion", "Harassment", "Facility", "Event", "Academic", "Lost & Found"];
const priorities = ["Low", "Medium", "High", "Urgent"];

const DATA_VERSION = "empty-live-v1";
const emptyData = {
  issues: [],
  ideas: [],
  polls: [],
  events: [],
  announcements: [],
  wall: [],
  chat: [{ role: "cabinet", text: "Hi, this is the anonymous cabinet desk. How can we help today?" }],
  happiness: null
};

const knowledge = [
  { keys: ["library", "book", "reading"], answer: "The library is open from 8 AM to 8 PM on weekdays. SparkRise currently shows an extended-hours trial for the reading hall." },
  { keys: ["scholarship", "fee"], answer: "Scholarship help desk support is available in Block B this week. Carry your ID card, income documents, and latest marksheet." },
  { keys: ["placement", "job", "career"], answer: "Placement readiness events include resume review, mock interviews, aptitude practice, and company-specific briefings." },
  { keys: ["exam", "marks", "grievance"], answer: "Exam grievances can be submitted during the announced window. Use the Exams category for academic clarification requests." },
  { keys: ["club", "event"], answer: "You can suggest a new club from the Suggestion Box or register for upcoming events in the Events section." },
  { keys: ["rule", "rules", "discipline"], answer: "For rules, ask the administration office or use SparkRise to request clarification. Anonymous reporting is available for unsafe or unfair practices." }
];

const store = {
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(`sparkrise:${key}`);
      return raw ? JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(raw), (char) => char.charCodeAt(0)))) : fallback;
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    const binary = [...bytes].map((byte) => String.fromCharCode(byte)).join("");
    localStorage.setItem(`sparkrise:${key}`, btoa(binary));
  }
};

if (localStorage.getItem("sparkrise:dataVersion") !== DATA_VERSION) {
  ["issues", "ideas", "polls", "events", "chat", "happiness"].forEach((key) => localStorage.removeItem(`sparkrise:${key}`));
  localStorage.setItem("sparkrise:dataVersion", DATA_VERSION);
}

const translations = {
  en: {
    hero: "Your Voice Matters",
    subtitle: "Student Voice Forum",
    issue: "Raise Issue",
    idea: "Share Idea",
    chat: "Live Chat"
  },
  hi: {
    hero: "Aapki Aawaz Zaroori Hai",
    subtitle: "Student Voice Forum",
    issue: "Issue Uthayein",
    idea: "Idea Share Karein",
    chat: "Live Chat"
  },
  ta: {
    hero: "Ungal Kural Mukkiyam",
    subtitle: "Student Voice Forum",
    issue: "Issue Raise",
    idea: "Idea Share",
    chat: "Live Chat"
  }
};

const state = {
  issues: store.read("issues", emptyData.issues),
  ideas: store.read("ideas", emptyData.ideas),
  polls: store.read("polls", emptyData.polls),
  events: store.read("events", emptyData.events),
  announcements: emptyData.announcements,
  wall: emptyData.wall,
  liveChat: store.read("chat", emptyData.chat),
  happiness: store.read("happiness", emptyData.happiness)
};

function persist() {
  store.write("issues", state.issues);
  store.write("ideas", state.ideas);
  store.write("polls", state.polls);
  store.write("events", state.events);
  store.write("chat", state.liveChat);
  store.write("happiness", state.happiness);
}

function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  $("#toastRegion").append(node);
  setTimeout(() => node.remove(), 3600);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function daysLeft(date) {
  const ms = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

function generateTrackingId() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SR-${year}-${random}`;
}

function renderFeatures() {
  const features = [
    ["AN", "Anonymous Issue Submission", "Students can report sensitive problems without a login while keeping a private reference ID."],
    ["LC", "Live Cabinet Chat", "Real-time anonymous chat with typing states, history, emoji support, and image sharing."],
    ["PV", "Polls & Voting", "Anonymous campus polls with live charts, countdowns, and one-tap voting."],
    ["AI", "AI Student Assistant", "Answers common questions about rules, library, scholarships, exams, placements, events, and clubs."],
    ["HM", "Campus Heatmap", "Detect issue concentration by department and campus zone for faster prioritization."],
    ["TR", "Transparency Reports", "Monthly performance, response time, resolution, and cabinet accountability metrics."],
    ["NF", "Notifications", "Pinned notices, bookmarks, announcements, activity feed, and timely event reminders."],
    ["PW", "PWA + Offline", "Installable app shell with offline cache so students can access key pages anytime."]
  ];
  $("#featureGrid").innerHTML = features
    .map(
      ([icon, title, body]) => `
      <article class="feature-card reveal">
        <div class="feature-icon">${icon}</div>
        <h3>${title}</h3>
        <p class="card-muted">${body}</p>
      </article>`
    )
    .join("");
}

function priorityClass(priority) {
  if (priority === "Urgent") return "red";
  if (priority === "High") return "gold";
  return "green";
}

function renderIssues() {
  $("#issueBoard").innerHTML = state.issues.length
    ? state.issues
    .slice(0, 6)
    .map(
      (issue) => `
      <article class="issue-card reveal">
        <div class="badge-row">
          <span class="badge">${issue.status}</span>
          <span class="badge ${priorityClass(issue.priority)}">${issue.priority}</span>
          <button
          class="primary-button resolve-btn"
          data-resolve="${issue.id}">
          Resolve Issue
          </button>
        </div>
        <h3>${escapeHtml(issue.title)}</h3>
        <p class="card-muted">${escapeHtml(issue.description)}</p>
        <div class="meter-track" aria-label="Progress ${issue.progress}%"><i style="width:${issue.progress}%"></i></div>
        <div class="badge-row">
          <span class="badge">${issue.id}</span>
          <span class="badge">${issue.department}</span>
          <span class="badge">${issue.category}</span>
        </div>
      </article>`
    )
    .join("")
    : `<div class="empty-state">No issues have been submitted yet. New anonymous reports will appear here in real time.</div>`;
  renderDashboard();
  renderStats();
}

function fillSelects() {
  const fill = (name, values) => {
    const select = $(`[name="${name}"]`);
    select.innerHTML = values.map((value) => `<option value="${value}">${value}</option>`).join("");
  };
  fill("department", departments);
  fill("category", categories);
  fill("priority", priorities);
}

function validateFiles(files) {
  const allowed = ["image/", "video/", "application/pdf"];
  const maxBytes = 15 * 1024 * 1024;
  return [...files].every((file) => file.size <= maxBytes && allowed.some((type) => file.type.startsWith(type) || file.type === type));
}

function renderIdeas() {
  const query = $("#ideaSearch")?.value?.toLowerCase() || "";
  const filter = $("#ideaFilter")?.value || "all";
  const ideas = state.ideas
    .filter((idea) => idea.text.toLowerCase().includes(query))
    .filter((idea) => filter === "all" || idea.tag === filter || (filter === "supported" && idea.likes > 0))
    .sort((a, b) => b.likes - a.likes);
  $("#ideaList").innerHTML =
    ideas
      .map(
        (idea) => `
        <article class="idea-card reveal">
          <div>
            <h3>${escapeHtml(idea.text)}</h3>
            <div class="idea-meta">
              <span>${idea.comments} comments</span>
              <span>${idea.tag}</span>
              <span>${idea.likes} supporters</span>
            </div>
          </div>
          <button class="secondary-button support-button" data-like="${idea.id}">Support</button>
        </article>`
      )
      .join("") || `<div class="empty-state">No suggestions yet. Student ideas will appear here after the first submission.</div>`;
  renderStats();
}

function renderPolls() {
  $("#pollGrid").innerHTML = state.polls.length
    ? state.polls
    .map((poll) => {
      const total = poll.options.reduce((sum, option) => sum + option.votes, 0);
      return `
        <article class="poll-card reveal">
          <div class="poll-top">
            <span class="badge gold">${daysLeft(poll.ends)} days left</span>
            <span class="badge">${total} votes</span>
          </div>
          <h3>${escapeHtml(poll.question)}</h3>
          ${poll.options
            .map((option, index) => {
              const pct = total ? Math.round((option.votes / total) * 100) : 0;
              return `
                <button class="ghost-button full" data-vote="${poll.id}:${index}" ${poll.voted ? "disabled" : ""}>${escapeHtml(option.label)}</button>
                <div class="poll-option">
                  <span>${pct}%</span>
                  <div class="poll-bar"><span style="width:${pct}%"></span></div>
                </div>`;
            })
            .join("")}
        </article>`;
    })
    .join("")
    : `<div class="empty-state">No polls are live yet. Published cabinet polls will start at zero votes and update as students participate.</div>`;
  renderStats();
}

function renderAssistantMessage(role, text) {
  const node = document.createElement("div");
  node.className = `chat-message ${role}`;
  node.textContent = text;
  $("#assistantMessages").append(node);
  $("#assistantMessages").scrollTop = $("#assistantMessages").scrollHeight;
}

function assistantAnswer(question) {
  const lower = question.toLowerCase();
  const hit = knowledge.find((entry) => entry.keys.some((key) => lower.includes(key)));
  return hit ? hit.answer : "I can help with college rules, departments, library, scholarships, placements, exams, events, clubs, and FAQs. Try asking with one of those topics.";
}

function renderEvents() {
  $("#eventGrid").innerHTML = state.events.length
    ? state.events
    .map(
      (event) => `
      <article class="event-card reveal">
        <span class="badge gold">${event.category}</span>
        <h3>${escapeHtml(event.title)}</h3>
        <p class="card-muted">${new Date(event.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
        <div class="meter-track"><i style="width:${Math.round((event.registered / event.seats) * 100)}%"></i></div>
        <p class="card-muted">${event.registered}/${event.seats} registered. Certificates and feedback forms unlock after attendance.</p>
        <div class="event-actions">
          <button class="primary-button" data-register="${event.id}">Register</button>
          <span class="badge">${daysLeft(event.date)} days</span>
        </div>
      </article>`
    )
    .join("")
    : `<div class="empty-state">No events have been published yet. Registrations will count from zero when events go live.</div>`;
}

function renderAnnouncements() {
  $("#announcementList").innerHTML = state.announcements.length
    ? state.announcements
    .map(
      (item) => `
      <article class="announcement ${item.pinned ? "pinned" : ""}">
        <div class="badge-row">
          <span class="badge">${item.category}</span>
          ${item.pinned ? `<span class="badge gold">Pinned</span>` : ""}
          <button class="ghost-button" data-bookmark="${escapeHtml(item.title)}">Bookmark</button>
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p class="card-muted">${new Date(item.date).toLocaleDateString()}</p>
      </article>`
    )
    .join("")
    : `<div class="empty-state">No announcements have been posted yet.</div>`;
}

function renderRoadmap() {
  $("#roadmap").innerHTML = `<div class="empty-state">The improvement roadmap will populate from approved issues and cabinet commitments.</div>`;
}

function renderImpact() {
  const resolved = state.issues.filter((issue) => issue.status === "Resolved");
  $("#impactTimeline").innerHTML = resolved.length
    ? resolved
        .map(
          (issue, index) =>
            `<article class="impact-item reveal"><div class="impact-dot">${index + 1}</div><div><h3>${escapeHtml(issue.title)}</h3><p class="card-muted">${escapeHtml(issue.response)}</p></div></article>`
        )
        .join("")
    : `<div class="empty-state">Completed outcomes will appear here after real student issues are resolved.</div>`;
}

function renderWall() {
  $("#feedbackWall").innerHTML = state.wall.length
    ? state.wall.map((text) => `<article class="wall-card reveal"><p>${escapeHtml(text)}</p></article>`).join("")
    : `<div class="empty-state">Anonymous appreciation messages and success stories will appear after students submit them.</div>`;
}

function renderExtras() {
  const extras = [
    ["Lost & Found", "Report or search misplaced ID cards, chargers, books, and lab equipment."],
    ["Resource Sharing", "Share notes, forms, policy links, and cabinet-approved student resources."],
    ["Student Gallery", "Moderated gallery for events, achievements, and campus improvement images."],
    ["Leaderboards", "Celebrate constructive ideas, event volunteers, and community contributors anonymously."],
    ["Activity Feed", "Live stream of new reports, responses, poll changes, and event registrations."]
  ];
  $("#extraGrid").innerHTML = extras.map(([title, body]) => `<article class="extra-card reveal"><h3>${title}</h3><p class="card-muted">${body}</p></article>`).join("");
}

function renderFaq() {
  const faqs = [
    ["Do students need to log in?", "No. Student features are anonymous by default and use private reference IDs instead of accounts."],
    ["Can cabinet identify me?", "No. Student submissions do not require accounts or personal details."],
    ["How is spam reduced?", "The interface validates input, limits file types, rate-limits repeated submissions, and is ready for server-side protection in production."],
    ["Can cabinet see analytics?", "Yes. The dashboard shows queue health, response metrics, issue trends, and report export."]
  ];
  $("#faqList").innerHTML = faqs.map(([q, a]) => `<details class="announcement"><summary>${q}</summary><p class="card-muted">${a}</p></details>`).join("");
}

function renderHeatmap() {
  const zones = ["Library", "Block A", "Hostel", "Canteen", "Ground", "Lab", "Bus Bay", "Office", "Auditorium", "Clinic"];
  $("#heatmap").innerHTML = zones
    .map((zone) => {
      const heat = state.issues.filter((issue) => issue.department === zone || issue.description.toLowerCase().includes(zone.toLowerCase())).length;
      return `<div class="map-cell" style="--heat:${heat}"><strong>${zone}</strong><span>${heat} signals</span></div>`;
    })
    .join("");
}

function renderDashboard() {
  const resolved = state.issues.filter((issue) => issue.status === "Resolved").length;
  const urgent = state.issues.filter((issue) => issue.priority === "Urgent" || issue.priority === "High").length;
  const avgProgress = state.issues.length ? Math.round(state.issues.reduce((sum, issue) => sum + issue.progress, 0) / state.issues.length) : 0;
  const analytics = [
    ["Open Issues", state.issues.length - resolved, "Active management queue"],
    ["Resolved", resolved, "Verified resolution history"],
    ["High Priority", urgent, "Needs cabinet attention"],
    ["Avg Progress", `${avgProgress}%`, "Across all tracked issues"]
  ];
  $("#analyticsGrid").innerHTML = analytics
    .map(([label, value, note]) => `<article class="analytics-card"><span>${label}</span><strong>${value}</strong><p class="card-muted">${note}</p></article>`)
    .join("");
  $("#dashboardRows").innerHTML = state.issues
    .map(
      (issue) => `
      <tr>
        <td>${issue.id}</td>
        <td>${escapeHtml(issue.title)}</td>
        <td>${issue.department}</td>
        <td>${issue.priority}</td>
        <td>${issue.status}</td>
        <td>${escapeHtml(issue.response)}</td>
      </tr>`
    )
    .join("") || `<tr><td colspan="6">No issues in the cabinet queue yet.</td></tr>`;
}

function renderHeroFeed() {
  const items = [
    ...state.issues.slice(0, 2).map((issue) => [issue.status, issue.title]),
    ...state.ideas.slice(0, 1).map((idea) => ["Idea", idea.text]),
    ...state.polls.slice(0, 1).map((poll) => ["Poll", poll.question])
  ];
  $("#heroFeed").innerHTML = items
    .map(([tag, text]) => `<div class="feed-item"><span class="badge gold">${tag}</span><p>${text}</p></div>`)
    .join("") || `<div class="feed-item"><span class="badge gold">Ready</span><p>Live activity will appear after students begin using SparkRise.</p></div>`;
}

function renderStats() {
  const resolved = state.issues.filter((issue) => issue.status === "Resolved").length;
  const supported = state.ideas.reduce((sum, idea) => sum + idea.likes, 0);
  const activePolls = state.polls.length;
  const responsesToday = state.issues.filter((issue) => issue.response && issue.response !== "Your report is in the anonymous queue. Cabinet will triage it and keep the reference record updated.").length;
  [
    ["#resolvedCount", resolved],
    ["#supportCount", supported],
    ["#pollCount", activePolls],
    ["#responseCount", responsesToday]
  ].forEach(([selector, value]) => {
    const node = $(selector);
    node.dataset.count = String(value);
    node.textContent = String(value);
  });
}

function renderHappiness() {
  const hasScore = typeof state.happiness === "number";
  const label = hasScore ? `${state.happiness}%` : "No responses yet";
  $("#happinessScore").textContent = label;
  $("#heroHappiness").textContent = label;
  $("#happinessSlider").value = String(hasScore ? state.happiness : 0);
  $("#heroHappinessBar").style.width = `${hasScore ? state.happiness : 0}%`;
}

function renderLiveChat() {
  $("#liveChatMessages").innerHTML = state.liveChat.map((msg) => `<div class="chat-message ${msg.role}">${escapeHtml(msg.text)}</div>`).join("");
  $("#liveChatMessages").scrollTop = $("#liveChatMessages").scrollHeight;
}

function allSearchItems() {
  return [
    ...state.issues.map((issue) => ({ type: "Issue", title: issue.title, body: `${issue.id} ${issue.department} ${issue.status}` })),
    ...state.ideas.map((idea) => ({ type: "Idea", title: idea.text, body: `${idea.likes} supporters` })),
    ...state.events.map((event) => ({ type: "Event", title: event.title, body: new Date(event.date).toLocaleDateString() })),
    ...state.announcements.map((item) => ({ type: "Notice", title: item.title, body: item.category }))
  ];
}

function renderSearch(target, query) {
  const results = allSearchItems().filter((item) => `${item.title} ${item.body} ${item.type}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  $(target).innerHTML =
    results.map((item) => `<article class="global-item"><span class="badge">${item.type}</span><h3>${escapeHtml(item.title)}</h3><p class="card-muted">${escapeHtml(item.body)}</p></article>`).join("") ||
    `<div class="empty-state">No results yet.</div>`;
}

function wirePanels() {
  $$("[data-open-panel]").forEach((button) => {
    button.addEventListener("click", () => {
      const panel = $(`#${button.dataset.openPanel}`);
      panel.setAttribute("aria-hidden", "false");
      document.body.classList.add("panel-open");
    });
  });
  $$("[data-close-panel]").forEach((button) => {
    button.addEventListener("click", () => {
      $(`#${button.dataset.closePanel}`).setAttribute("aria-hidden", "true");
      document.body.classList.remove("panel-open");
    });
  });
  $$("[data-scroll]").forEach((button) => button.addEventListener("click", () => $(button.dataset.scroll).scrollIntoView({ behavior: "smooth" })));
}

function wireForms() {
  $("#issueForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const files = form.getAll("files").filter((file) => file.name);
    if (!validateFiles(files)) {
      toast("Upload blocked: use images, videos, or PDFs up to 15 MB each.");
      return;
    }
    const now = Date.now();
    const recent = Number(localStorage.getItem("sparkrise:lastSubmit") || 0);
    if (now - recent < 15000) {
      toast("Please wait a few seconds before submitting another issue.");
      return;
    }
    localStorage.setItem("sparkrise:lastSubmit", String(now));
    const issue = {
      id: generateTrackingId(),
      title: form.get("title").trim(),
      description: form.get("description").trim(),
      department: form.get("department"),
      category: form.get("category"),
      priority: form.get("priority"),
      files: files.map((file) => file.type.split("/")[0]),
      status: "Received",
      progress: 12,
      response: "Your report is in the anonymous queue. Cabinet will triage it and keep the reference record updated.",
      created: new Date().toISOString().slice(0, 10),
      timeline: ["Received anonymously", "Awaiting cabinet triage"]
    };
    state.issues.unshift(issue);
    persist();
    renderIssues();
    renderHeatmap();
    $("#issueForm").hidden = true;
    $("#issueSuccess").hidden = false;
    $("#issueSuccess").innerHTML = `
      <div class="status-pill">Submitted securely</div>
      <h2>Issue received</h2>
      <p class="card-muted">Save this private reference ID for cabinet follow-up.</p>
      <div class="stat-card"><span>${issue.id}</span><p>${escapeHtml(issue.title)}</p></div>
      <button class="primary-button" id="copyTracking">Copy Reference ID</button>
      <button class="secondary-button" id="raiseAnother">Raise Another Issue</button>`;
    $("#copyTracking").addEventListener("click", async () => {
      await navigator.clipboard?.writeText(issue.id);
      toast("Reference ID copied.");
    });
    $("#raiseAnother").addEventListener("click", () => {
      $("#issueForm").reset();
      $("#issueForm").hidden = false;
      $("#issueSuccess").hidden = true;
    });
    toast("Anonymous issue submitted.");
  });

  $("#ideaForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const text = $("#ideaInput").value.trim();
    if (!text) return;
    state.ideas.unshift({ id: Date.now(), text, likes: 0, comments: 0, tag: "trending" });
    $("#ideaInput").value = "";
    persist();
    renderIdeas();
    renderHeroFeed();
    toast("Idea added to the anonymous suggestion box.");
  });

  $("#assistantForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const question = $("#assistantInput").value.trim();
    if (!question) return;
    renderAssistantMessage("user", question);
    $("#assistantInput").value = "";
    setTimeout(() => renderAssistantMessage("bot", assistantAnswer(question)), 450);
  });

  $("#liveChatForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $("#liveChatInput");
    const image = $("#chatImage").files[0];
    const text = input.value.trim() || (image ? `Shared image: ${image.name}` : "");
    if (!text) return;
    state.liveChat.push({ role: "user", text });
    input.value = "";
    $("#chatImage").value = "";
    persist();
    renderLiveChat();
    $("#typingIndicator").hidden = false;
    setTimeout(() => {
      $("#typingIndicator").hidden = true;
      state.liveChat.push({ role: "cabinet", text: "Thanks for sharing. We have noted this anonymously and will route it to the right cabinet member." });
      persist();
      renderLiveChat();
    }, 900);
  });
}

function wireActions() {
  document.addEventListener("click", (event) => {
    const resolve = event.target.closest("[data-resolve]");

if (resolve) {

    const issue = state.issues.find(
        i => i.id === resolve.dataset.resolve
    );

    if (!issue) return;

    issue.status = "Resolved";

    issue.progress = 100;

    issue.response = "Issue has been resolved by the Student Cabinet.";

    persist();

    renderIssues();

    renderDashboard();

    toast("Issue marked as resolved.");

}
    const like = event.target.closest("[data-like]");
    if (like) {
      const idea = state.ideas.find((item) => item.id === Number(like.dataset.like));
      idea.likes += 1;
      persist();
      renderIdeas();
      renderHeroFeed();
      toast("Support added anonymously.");
    }
    const vote = event.target.closest("[data-vote]");
    if (vote) {
      const [pollId, index] = vote.dataset.vote.split(":").map(Number);
      const poll = state.polls.find((item) => item.id === pollId);
      if (!poll.voted) {
        poll.options[index].votes += 1;
        poll.voted = true;
        persist();
        renderPolls();
        renderHeroFeed();
        toast("Vote counted anonymously.");
      }
    }
    const register = event.target.closest("[data-register]");
    if (register) {
      const eventItem = state.events.find((item) => item.id === Number(register.dataset.register));
      if (eventItem.registered < eventItem.seats) {
        eventItem.registered += 1;
        persist();
        renderEvents();
        toast("Event registration confirmed.");
      }
    }
    const bookmark = event.target.closest("[data-bookmark]");
    if (bookmark) toast("Announcement bookmarked in this browser.");
  });

  $("#ideaSearch").addEventListener("input", renderIdeas);
  $("#ideaFilter").addEventListener("change", renderIdeas);
  $("#globalSearch").addEventListener("input", (event) => renderSearch("#globalResults", event.target.value));
  $("#modalSearchInput").addEventListener("input", (event) => renderSearch("#modalSearchResults", event.target.value));
  $("#happinessSlider").addEventListener("input", (event) => {
    state.happiness = Number(event.target.value);
    persist();
    renderHappiness();
  });
  $("#emojiButton").addEventListener("click", () => {
    $("#liveChatInput").value += " :)";
    $("#liveChatInput").focus();
  });
  $("#endChat").addEventListener("click", () => {
    state.liveChat.push({ role: "cabinet", text: "This chat has ended. You can start another anonymous chat anytime." });
    persist();
    renderLiveChat();
    toast("Chat ended.");
  });
  $("#exportReport").addEventListener("click", () => {
    const report = [
      "SparkRise Monthly Transparency Report",
      `Generated: ${new Date().toLocaleString()}`,
      `Issues tracked: ${state.issues.length}`,
      `Suggestions: ${state.ideas.length}`,
      `Polls: ${state.polls.length}`,
      "",
      ...state.issues.map((issue) => `${issue.id} | ${issue.status} | ${issue.department} | ${issue.title}`)
    ].join("\n");
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sparkrise-transparency-report.txt";
    link.click();
    URL.revokeObjectURL(url);
  });
}

function wireChrome() {
  const root = document.documentElement;
  root.dataset.theme = store.read("theme", window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  const savedLanguage = store.read("language", "en");
  $("#languageSelect").value = savedLanguage;
  applyLanguage(savedLanguage);
  $("#themeToggle").addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    store.write("theme", root.dataset.theme);
  });
  $("#languageSelect").addEventListener("change", (event) => {
    applyLanguage(event.target.value);
    store.write("language", event.target.value);
    toast("Language preference saved.");
  });
  $("#menuToggle").addEventListener("click", () => $(".nav-links").classList.toggle("open"));
  $("#searchToggle").addEventListener("click", () => {
    $("#searchModal").setAttribute("aria-hidden", "false");
    $("#modalSearchInput").focus();
    renderSearch("#modalSearchResults", "");
  });
  $("#closeSearch").addEventListener("click", () => $("#searchModal").setAttribute("aria-hidden", "true"));
  window.addEventListener("scroll", () => $(".topbar").dataset.elevated = String(window.scrollY > 12), { passive: true });
}

function applyLanguage(code) {
  const copy = translations[code] || translations.en;
  $(".hero-copy h1").textContent = copy.hero;
  $(".subtitle").textContent = copy.subtitle;
  const heroButtons = $$(".hero-actions button");
  heroButtons[0].textContent = copy.issue;
  heroButtons[1].textContent = copy.idea;
  heroButtons[2].textContent = copy.chat;
}

function animateStats() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const node = entry.target;
      const target = Number(node.dataset.count);
      let current = 0;
      const step = Math.max(1, Math.floor(target / 45));
      const timer = setInterval(() => {
        current = Math.min(target, current + step);
        node.textContent = current;
        if (current === target) clearInterval(timer);
      }, 24);
      observer.unobserve(node);
    });
  });
  $$("[data-count]").forEach((node) => observer.observe(node));
}

function revealOnScroll() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.08 });
  $$(".reveal").forEach((node) => observer.observe(node));
}

function drawConstellation() {
  const canvas = $("#constellation");
  const ctx = canvas.getContext("2d");
  const points = Array.from({ length: 72 }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.0006, vy: (Math.random() - 0.5) * 0.0006 }));
  function resize() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
  }
  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,.16)";
    ctx.fillStyle = "rgba(245,184,51,.52)";
    points.forEach((point, i) => {
      point.x = (point.x + point.vx + 1) % 1;
      point.y = (point.y + point.vy + 1) % 1;
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 2 * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
      for (let j = i + 1; j < points.length; j += 1) {
        const other = points[j];
        const ox = other.x * canvas.width;
        const oy = other.y * canvas.height;
        const distance = Math.hypot(x - ox, y - oy);
        if (distance < 120 * devicePixelRatio) {
          ctx.globalAlpha = 1 - distance / (120 * devicePixelRatio);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(ox, oy);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    });
    requestAnimationFrame(frame);
  }
  resize();
  window.addEventListener("resize", resize);
  frame();
}

function boot() {
  fillSelects();
  renderFeatures();
  renderHeroFeed();
  renderIssues();
  renderIdeas();
  renderPolls();
  renderAssistantMessage("bot", "Ask me about rules, departments, library, scholarships, placements, exams, events, clubs, or FAQs.");
  renderEvents();
  renderAnnouncements();
  renderRoadmap();
  renderImpact();
  renderWall();
  renderExtras();
  renderFaq();
  renderHeatmap();
  renderStats();
  renderHappiness();
  renderLiveChat();
  renderSearch("#globalResults", "");
  wirePanels();
  wireForms();
  wireActions();
  wireChrome();
  animateStats();
  revealOnScroll();
  drawConstellation();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

boot();
