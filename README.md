This project is an interactive web-based simulation of CPU scheduling algorithms in Operating Systems.
It focuses on Round Robin and Preemptive Priority Scheduling, providing a visual and analytical representation of how processes are executed over time.

The main goal is to bridge the gap between theoretical OS concepts and practical implementation through an interactive simulation.

Features:

Simulation of:
Round Robin Scheduling
Preemptive Priority Scheduling
Process execution visualization (Gantt Chart)
Calculation of key performance metrics:
Waiting Time
Turnaround Time
Response Time
Completion Time
Input validation for process data
Multiple test cases and edge-case scenarios
Full analysis of scheduling behavior

Result Table & Comparison:

The system generates a detailed result table for each scheduling execution, including:

Arrival Time
Burst / Request Time
Waiting Time
Response Time
Turnaround Time
Completion Time

These values are calculated for every process to evaluate how each scheduling algorithm behaves.

In addition, a comparison section is generated to analyze both algorithms, including:

Average Waiting Time
Average Turnaround Time
CPU efficiency comparison
Overall performance evaluation between algorithms

This helps in comparing Round Robin and Preemptive Priority Scheduling in terms of performance, fairness, responsiveness, and starvation handling.

Operating System Concepts Covered

CPU Scheduling Algorithms
Round Robin time slicing mechanism
Preemptive Priority Scheduling behavior
Process state transitions and execution flow
Starvation problem in Priority Scheduling
Fairness and urgency handling
Trade-offs between responsiveness and efficiency

Testing & Analysis:

The system was tested using multiple normal and edge-case scenarios to ensure correctness and robustness.

We implemented:

Gantt Chart visualization for process execution flow
Result Table for detailed per-process metrics
Comparison module between both algorithms

The results were analyzed to understand scheduling trade-offs, especially regarding:

Starvation
Fairness
Urgency handling
Overall CPU efficiency

Tech Stack:

HTML
CSS
JavaScript

Purpose of the Project:

Understand CPU scheduling algorithms in Operating Systems
Implement theoretical concepts in a real interactive system
Analyze performance differences between scheduling techniques
Improve frontend development skills using vanilla web technologies
