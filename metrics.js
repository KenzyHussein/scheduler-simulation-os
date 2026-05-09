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