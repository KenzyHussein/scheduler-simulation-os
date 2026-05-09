const STORAGE_KEY = "osSchedulerComparisonData";

const state = {
  data: null
};

document.addEventListener("DOMContentLoaded", initComparison);

function initComparison() {
  state.data = readStoredSimulation();

  if (!state.data) {
    document.getElementById("emptyState").style.display = "block";
    return;
  }

  document.getElementById("dashboard").style.display = "block";
  document.getElementById("runStamp").textContent = `Latest simulation: ${formatRunTime(state.data.savedAt)}`;

  renderMetricCards();
  renderAnalysis();
  renderRiskPanels();
  renderCharts();
  renderGanttChart("rrGanttChart", "rrGanttTotal", state.data.roundRobin.gantt);
  renderGanttChart("prGanttChart", "prGanttTotal", state.data.priority.gantt);
  renderProcessTable();
}

function readStoredSimulation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed.roundRobin || !parsed.priority || !parsed.processes) return null;
    return parsed;
  } catch (error) {
    return null;
  }
}

function renderMetricCards() {
  const rr = state.data.roundRobin;
  const pr = state.data.priority;
  const metrics = [
    { label: "Average Waiting Time", rr: rr.averages.avgWT, pr: pr.averages.avgWT, unit: "ms", lowerIsBetter: true },
    { label: "Average Turnaround Time", rr: rr.averages.avgTAT, pr: pr.averages.avgTAT, unit: "ms", lowerIsBetter: true },
    { label: "Average Response Time", rr: rr.averages.avgRT, pr: pr.averages.avgRT, unit: "ms", lowerIsBetter: true },
    { label: "CPU Utilization", rr: rr.cpuUtilization, pr: pr.cpuUtilization, unit: "%", lowerIsBetter: false },
    { label: "Throughput", rr: rr.throughput, pr: pr.throughput, unit: "/ms", lowerIsBetter: false },
    { label: "Total Completion Time", rr: rr.totalCompletionTime, pr: pr.totalCompletionTime, unit: "ms", lowerIsBetter: true }
  ];

  document.getElementById("metricCards").innerHTML = metrics.map(metric => {
    const winner = getWinner(metric.rr, metric.pr, metric.lowerIsBetter);
    return `
      <article class="comparison-metric-card">
        <div class="metric-name">${metric.label}</div>
        <div class="metric-pair">
          <div class="metric-value-box ${winner === "rr" ? "is-better" : ""} ${winner === "tie" ? "is-tie" : ""}">
            <div class="metric-label">Round Robin</div>
            <div class="metric-number">${formatMetric(metric.rr, metric.unit)}</div>
          </div>
          <div class="metric-value-box ${winner === "pr" ? "is-better" : ""} ${winner === "tie" ? "is-tie" : ""}">
            <div class="metric-label">Priority</div>
            <div class="metric-number">${formatMetric(metric.pr, metric.unit)}</div>
          </div>
        </div>
        <div class="winner-badge">${getWinnerLabel(winner)}</div>
      </article>
    `;
  }).join("");
}

function renderAnalysis() {
  const rr = state.data.roundRobin;
  const pr = state.data.priority;
  const urgent = getUrgentProcesses();
  const urgentResponse = compareUrgentResponse(urgent);
  const fairnessWinner = getStdDev(rr.metrics.map(p => p.wt)) <= getStdDev(pr.metrics.map(p => p.wt)) ? "Round Robin" : "Priority Scheduling";

  document.getElementById("rrFairnessText").textContent =
    `${fairnessWinner === "Round Robin" ? "Round Robin provided better fairness." : "Round Robin still rotated CPU access, but its waiting distribution was less balanced in this run."} It cycles through ready processes using the saved quantum of ${state.data.quantum} ms, so execution order is distributed across repeated CPU slices instead of one long priority-driven run.`;

  document.getElementById("priorityUrgencyText").textContent =
    `${urgentResponse.priorityBetter ? "Priority Scheduling minimized response time for urgent tasks." : "Priority Scheduling did not significantly improve urgent response time in this run."} Lower priority numbers moved earlier in the execution order, changing the CPU sequence toward urgency instead of equal rotation.`;

  document.getElementById("rrOrder").innerHTML = renderExecutionOrder(rr.executionOrder);
  document.getElementById("prOrder").innerHTML = renderExecutionOrder(pr.executionOrder);

  const insights = [
    fairnessWinner === "Round Robin"
      ? "Round Robin distributed CPU time more evenly."
      : "Priority Scheduling had the tighter waiting-time spread in this specific dataset.",
    urgentResponse.priorityBetter
      ? `Urgent processes improved by ${urgentResponse.delta.toFixed(2)} ms average response time under Priority Scheduling.`
      : "Urgent processes did not gain a strong response-time advantage from Priority Scheduling.",
    pr.averages.avgRT < rr.averages.avgRT
      ? "Priority Scheduling produced the lower average response time."
      : "Round Robin produced the lower average response time.",
    pr.starvation.length > 0
      ? "Low priority processes experienced starvation risk."
      : "No process crossed the starvation-risk threshold."
  ];

  document.getElementById("dynamicInsights").innerHTML = insights.map(text => `<div class="insight">${text}</div>`).join("");
}

function renderRiskPanels() {
  const pr = state.data.priority;
  const rrSpread = getStdDev(state.data.roundRobin.metrics.map(p => p.wt));
  const prSpread = getStdDev(pr.metrics.map(p => p.wt));
  const starvationList = pr.starvation.map(item => item.pid).join(", ");
  const warning = pr.starvation.length
    ? `<div class="warning-badge">Possible Starvation Detected</div><p>Processes ${starvationList} waited far longer than the workload average, which indicates low-priority starvation risk.</p>`
    : `<div class="winner-badge">No Starvation Spike</div><p>Priority Scheduling did not produce an extreme waiting-time outlier in this simulation.</p>`;

  document.getElementById("starvationPanel").innerHTML = `<h2>Starvation Risk</h2>${warning}`;
  document.getElementById("balancePanel").innerHTML = `
    <h2>Service Balance</h2>
    <p>Round Robin waiting spread: ${rrSpread.toFixed(2)} ms. Priority waiting spread: ${prSpread.toFixed(2)} ms. ${rrSpread <= prSpread ? "Round Robin gave more balanced service." : "Priority Scheduling was more balanced for this exact input set."}</p>
  `;
}

function renderCharts() {
  renderBarChart("wtChart", "wt");
  renderBarChart("tatChart", "tat");
  renderBarChart("rtChart", "rt");
}

function renderBarChart(containerId, metricKey) {
  const rows = state.data.processes.map(process => {
    const rrMetric = findMetric(state.data.roundRobin.metrics, process.pid);
    const prMetric = findMetric(state.data.priority.metrics, process.pid);
    return {
      pid: process.pid,
      rr: rrMetric ? rrMetric[metricKey] : 0,
      pr: prMetric ? prMetric[metricKey] : 0
    };
  });
  const max = Math.max(1, ...rows.flatMap(row => [row.rr, row.pr]));

  document.getElementById(containerId).innerHTML = rows.map(row => `
    <div class="bar-row">
      <div class="bar-pid">${row.pid}</div>
      <div class="bar-track" title="Round Robin ${row.rr} ms">
        <div class="bar-fill rr" style="width:${getPercent(row.rr, max)}%">${row.rr}</div>
      </div>
      <div class="bar-track" title="Priority ${row.pr} ms">
        <div class="bar-fill pr" style="width:${getPercent(row.pr, max)}%">${row.pr}</div>
      </div>
    </div>
  `).join("");
}

function renderProcessTable() {
  document.getElementById("processComparisonRows").innerHTML = state.data.processes.map(process => {
    const rr = findMetric(state.data.roundRobin.metrics, process.pid);
    const pr = findMetric(state.data.priority.metrics, process.pid);
    return `
      <tr>
        <td class="pid-cell">${process.pid}</td>
        <td><span class="priority-badge ${getPriorityClass(process.priority)}">${process.priority}</span></td>
        <td>${rr.wt}</td>
        <td>${pr.wt}</td>
        <td>${rr.tat}</td>
        <td>${pr.tat}</td>
        <td>${rr.rt}</td>
        <td>${pr.rt}</td>
      </tr>
    `;
  }).join("");
}

function renderGanttChart(chartId, totalId, gantt) {
  const chart = document.getElementById(chartId);
  const totalLabel = document.getElementById(totalId);

  if (!gantt || gantt.length === 0) {
    chart.innerHTML = `<div class="gantt-empty">No chart data available.</div>`;
    totalLabel.textContent = "Total time: 0 ms";
    return;
  }

  const totalTime = Math.max(...gantt.map(slot => slot.end));
  totalLabel.textContent = `Total time: ${totalTime} ms`;

  const segments = gantt.map(slot => {
    const duration = Math.max(slot.end - slot.start, 1);
    return `
      <div class="gantt-segment" style="flex:${duration} 0 0; background:${getGanttColor(slot.pid)};">
        <strong>${slot.pid}</strong>
        <span>${slot.start} - ${slot.end}</span>
      </div>
    `;
  }).join("");

  const labels = gantt.map((slot, index) => {
    const duration = Math.max(slot.end - slot.start, 1);
    const lastLabel = index === gantt.length - 1 ? `<b>${slot.end}</b>` : "";
    return `
      <div class="gantt-tick" style="flex:${duration} 0 0;">
        <span>${slot.start}</span>
        ${lastLabel}
      </div>
    `;
  }).join("");

  chart.innerHTML = `<div class="gantt-track">${segments}</div><div class="gantt-axis">${labels}</div>`;
}

function getUrgentProcesses() {
  const priorities = state.data.processes.map(p => p.priority);
  const bestPriority = Math.min(...priorities);
  return state.data.processes.filter(p => p.priority === bestPriority);
}

function compareUrgentResponse(urgent) {
  const rrAvg = average(urgent.map(p => findMetric(state.data.roundRobin.metrics, p.pid).rt));
  const prAvg = average(urgent.map(p => findMetric(state.data.priority.metrics, p.pid).rt));
  return {
    priorityBetter: prAvg < rrAvg,
    delta: Math.abs(rrAvg - prAvg)
  };
}

function renderExecutionOrder(order) {
  const compactOrder = order.filter((pid, index) => index === 0 || pid !== order[index - 1]);
  return compactOrder.map(pid => `<span class="order-chip">${pid}</span>`).join("");
}

function findMetric(metrics, pid) {
  return metrics.find(metric => metric.pid === pid);
}

function getWinner(rr, pr, lowerIsBetter) {
  if (Number(rr).toFixed(4) === Number(pr).toFixed(4)) return "tie";
  if (lowerIsBetter) return rr < pr ? "rr" : "pr";
  return rr > pr ? "rr" : "pr";
}

function getWinnerLabel(winner) {
  if (winner === "rr") return "Round Robin better";
  if (winner === "pr") return "Priority better";
  return "Performance tied";
}

function formatMetric(value, unit) {
  const numeric = Number(value);
  const precision = unit === "/ms" || unit === "%" ? 2 : 2;
  return `${numeric.toFixed(precision)} ${unit}`;
}

function getPercent(value, max) {
  return Math.max(4, (value / max) * 100);
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getStdDev(values) {
  const avg = average(values);
  const variance = average(values.map(value => Math.pow(value - avg, 2)));
  return Math.sqrt(variance);
}

function getPriorityClass(priority) {
  if (priority <= 2) return "p-high";
  if (priority <= 4) return "p-med";
  return "p-low";
}

function getGanttColor(pid) {
  const colors = [
    "#2ecc71", "#45b7d1", "#9b5de5", "#f4a261",
    "#ff6b6b", "#00c2a8", "#ffd166", "#f72585"
  ];
  let hash = 0;

  for (let i = 0; i < pid.length; i++) {
    hash = (hash + pid.charCodeAt(i) * (i + 1)) % colors.length;
  }

  return colors[hash];
}

function formatRunTime(value) {
  if (!value) return "unknown time";
  return new Date(value).toLocaleString();
}