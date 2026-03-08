async function refresh() {
  const [eventsRes, sessionsRes] = await Promise.all([
    fetch("/api/events?limit=200"),
    fetch("/api/sessions")
  ]);

  const eventsJson = await eventsRes.json();
  const sessionsJson = await sessionsRes.json();

  document.getElementById("meta").textContent =
    `projectDir=${eventsJson.projectDir} | logFile=${eventsJson.logFile}`;

  const sessionsTbody = document.getElementById("sessions");
  sessionsTbody.innerHTML = "";
  for (const s of sessionsJson.sessions) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${s.session_id}</td><td>${s.last_ts}</td><td>${s.count}</td>`;
    sessionsTbody.appendChild(tr);
  }

  document.getElementById("events").textContent =
    eventsJson.events.map((e) => JSON.stringify(e, null, 2)).join("\n\n---\n\n");
}

refresh();
setInterval(refresh, 1500);