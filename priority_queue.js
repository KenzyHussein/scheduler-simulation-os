function runPriority(processes) {
    let n = processes.length;
    let pState = processes.map(p => ({
        pid: p.pid,
        arrivalTime: parseInt(p.arrival),
        burstTime: parseInt(p.burst),
        priority: parseInt(p.priority),
        remainingTime: parseInt(p.burst),
        firstStartTime: -1,
        completionTime: 0,
        done: false
    }));

    let ganttChart = [];
    let currentTime = 0;
    let completed = 0;
    let lastPid = null;

    while (completed < n) {
        let selectedIdx = -1;
        let highestPriority = Infinity;

        for (let i = 0; i < n; i++) {
            if (!pState[i].done && pState[i].arrivalTime <= currentTime) {
                if (pState[i].priority < highestPriority) {
                    highestPriority = pState[i].priority;
                    selectedIdx = i;
                } else if (pState[i].priority === highestPriority) {
                    if (pState[i].arrivalTime < pState[selectedIdx].arrivalTime) {
                        selectedIdx = i;
                    }
                }
            }
        }

        if (selectedIdx === -1) {
            currentTime++;
            lastPid = "idle";
            continue;
        }

        let p = pState[selectedIdx];
        if (p.firstStartTime === -1) p.firstStartTime = currentTime;

        if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].pid === p.pid) {
            ganttChart[ganttChart.length - 1].end++;
        } else {
            ganttChart.push({ pid: p.pid, start: currentTime, end: currentTime + 1 });
        }

        p.remainingTime--;
        currentTime++;

        if (p.remainingTime === 0) {
            p.completionTime = currentTime;
            p.done = true;
            completed++;
        }
    }

    return {
        metrics: pState.map(p => ({
            pid: p.pid,
            priority: p.priority,
            tat: p.completionTime - p.arrivalTime,
            wt: (p.completionTime - p.arrivalTime) - p.burstTime,
            rt: p.firstStartTime - p.arrivalTime,
            ct: p.completionTime
        })),
        gantt: ganttChart
    };
}