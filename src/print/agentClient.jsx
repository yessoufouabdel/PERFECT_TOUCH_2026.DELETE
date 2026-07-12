// src/print/agentClient.js
const AGENT_URL = "http://127.0.0.1:5353";

export async function pingAgent(timeoutMs = 800) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  try {
    const r = await fetch(AGENT_URL + "/health", { signal: c.signal });
    return r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

// ESC/POS print (no HTML)
export async function printViaAgentEscPos(ticket, { printerName = null } = {}) {
  // `ticket` matches build_ticket() shape in app.py
  const payload = { ...ticket };
    console.log('payload')
  console.log(payload)
  if (printerName) payload.printerName = printerName;

  const res = await fetch(AGENT_URL + "/print", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("/print HTTP " + res.status);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Agent returned ok:false");
  return true;
}
