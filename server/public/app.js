let selectedSessionId = null;

function getEventTypeFilter() {
  return document.getElementById("event-type-filter").value;
}

async function refresh() {
  const params = new URLSearchParams({ limit: "200" });
  if (selectedSessionId) params.set("session_id", selectedSessionId);
  const eventType = getEventTypeFilter();
  if (eventType) params.set("event_type", eventType);

  const [eventsRes, sessionsRes] = await Promise.all([
    fetch(`/api/events?${params}`),
    fetch("/api/sessions")
  ]);

  const eventsJson = await eventsRes.json();
  const sessionsJson = await sessionsRes.json();

  document.getElementById("meta").textContent =
    `projectDir=${eventsJson.projectDir} | logFile=${eventsJson.logFile}`;

  // Filter info
  const parts = [];
  if (selectedSessionId) parts.push(`session: ${selectedSessionId}`);
  if (eventType) parts.push(`type: ${eventType}`);
  document.getElementById("filter-info").textContent =
    parts.length ? `Showing ${eventsJson.events.length} of ${eventsJson.total} (${parts.join(", ")})` : `${eventsJson.events.length} events`;

  // Sessions table
  const sessionsTbody = document.getElementById("sessions");
  sessionsTbody.innerHTML = "";
  for (const s of sessionsJson.sessions) {
    const tr = document.createElement("tr");
    tr.className = "clickable" + (s.session_id === selectedSessionId ? " selected" : "");
    tr.innerHTML = `<td>${s.session_id}</td><td>${s.last_ts}</td><td>${s.count}</td>`;
    tr.addEventListener("click", () => {
      selectedSessionId = selectedSessionId === s.session_id ? null : s.session_id;
      refresh();
    });
    sessionsTbody.appendChild(tr);
  }

  // Events
  document.getElementById("events").textContent =
    eventsJson.events.map((e) => JSON.stringify(e, null, 2)).join("\n\n---\n\n");
}

document.getElementById("event-type-filter").addEventListener("change", refresh);
document.getElementById("clear-filters").addEventListener("click", () => {
  selectedSessionId = null;
  document.getElementById("event-type-filter").value = "";
  refresh();
});

refresh();
setInterval(refresh, 3000);