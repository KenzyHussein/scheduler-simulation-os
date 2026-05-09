function calculateAverages(metrics) {
    let totalWT = 0, totalTAT = 0, totalRT = 0;

    metrics.forEach(p => {
        totalWT += p.wt;
        totalTAT += p.tat;
        totalRT += p.rt;
    });

    let n = metrics.length;

    return {
        avgWT: totalWT / n,
        avgTAT: totalTAT / n,
        avgRT: totalRT / n
    };
}

//----------------------------------

function compareAlgorithms(rrResult, prResult) {

    return {
        roundRobin: {
            metrics: rrResult.metrics,
            averages: calculateAverages(rrResult.metrics),
            gantt: rrResult.gantt
        },

        priority: {
            metrics: prResult.metrics,
            averages: calculateAverages(prResult.metrics),
            gantt: prResult.gantt
        }
    };
}

const COMPARISON_STORAGE_KEY = "osSchedulerComparisonData";

function saveComparisonData(rrResult, prResult, quantum) {
    const payload = buildComparisonPayload(rrResult, prResult, quantum);
    localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(payload));
}

function openComparisonAnalysis() {
    const saved = localStorage.getItem(COMPARISON_STORAGE_KEY);
    if (!saved) return showToast('Run simulation first', true);
    window.location.href = "comparison.html";
}

function buildComparisonPayload(rrResult, prResult, quantum) {
    return {
        savedAt: new Date().toISOString(),
        quantum,
        processes: processes.map(p => ({ ...p })),
        roundRobin: enrichAlgorithmData(rrResult),
        priority: enrichAlgorithmData(prResult)
    };
}

function enrichAlgorithmData(result) {
    const totalBurst = processes.reduce((sum, p) => sum + Number(p.burst), 0);
    const firstArrival = Math.min(...processes.map(p => Number(p.arrival)));
    const totalCompletionTime = result.gantt.length ? Math.max(...result.gantt.map(slot => slot.end)) : 0;
    const elapsed = Math.max(totalCompletionTime - firstArrival, 1);
    const averages = calculateAverages(result.metrics);

    return {
        metrics: result.metrics,
        gantt: result.gantt,
        averages,
        executionOrder: result.gantt.map(slot => slot.pid),
        totalCompletionTime,
        cpuUtilization: (totalBurst / elapsed) * 100,
        throughput: result.metrics.length / elapsed,
        starvation: detectStarvation(result.metrics)
    };
}

function detectStarvation(metrics) {
    const avgWaiting = metrics.reduce((sum, p) => sum + p.wt, 0) / metrics.length;
    const threshold = Math.max(avgWaiting * 1.75, avgWaiting + 5);
    return metrics.filter(p => p.wt > threshold);
}
