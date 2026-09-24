function createTask(name) {
  let count = 0;              
  let status = "idle";      
  let lastTime = null;      

  return {
    name,
    getStatus() { return status; },
    getLastTime() { return lastTime; },
    getCount() { return count; }, 
    reset() {
      count = 0;
      status = "idle";
      lastTime = null;
      renderTasks();
    },
    run() {
      status = "running";
      count++;            
      const duration = 500 + Math.floor(Math.random() * 1500);
      lastTime = duration;
      renderTasks();
      logStatus(`${name}: started (run #${count}, ~${duration}ms)`);

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const fail = Math.random() < 0.25; 
          status = fail ? "failed" : "completed";
          renderTasks();
          if (fail) {
            logStatus(`${name}: Failed`);
            reject(new Error(`${name} failed`));
          } else {
            logStatus(`${name}: Completed`);
            resolve(`${name} completed`);
          }
        }, duration);
      });
    }
  };
}

//Num 2. Task instances
const tasks = [
  createTask("Load Users"),
  createTask("Load Posts"),
  createTask("Load Comments")
];

//Num 3. Rendering 
function renderTasks() {
  const container = document.getElementById("tasks");
  container.innerHTML = "";
  tasks.forEach((task, i) => {
    const card = document.createElement("div");
    card.className = "task-card";
    card.innerHTML = `
      <div class="info">
        <strong>${task.name}</strong><br>
        runs: ${task.getCount()} | last time: ${task.getLastTime() ?? "-"}ms
      </div>
      <span class="status ${task.getStatus()}">${task.getStatus()}</span>
      <button data-idx="${i}" class="runOne">Run</button>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll(".runOne").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.idx);
      tasks[idx].run().catch(() => {}); 
    });
  });
}

function logStatus(msg) {
  const log = document.getElementById("statusLog");
  const time = new Date().toLocaleTimeString();
  log.textContent += `[${time}] ${msg}\n`;
  log.scrollTop = log.scrollHeight;
}

renderTasks();

//4. Run All
document.getElementById("runAllBtn").addEventListener("click", async () => {
  logStatus("--- Running all tasks concurrently ---");
  const results = await Promise.allSettled(tasks.map(t => t.run()));
  logStatus("All tasks finished");
  results.forEach(r => logStatus(r.status === "fulfilled" ? r.value : r.reason.message));
});

document.getElementById("resetAllBtn").addEventListener("click", () => {
  tasks.forEach(t => t.reset());
  document.getElementById("statusLog").textContent = "";
});

//5. Sequential vs Concurrent
document.getElementById("seqBtn").addEventListener("click", async () => {
  const t0 = performance.now();
  for (const task of tasks) {
    await task.run().catch(() => {});
  }
  const t1 = performance.now();
  document.getElementById("compareResult").textContent =
    `Sequential total time: ${(t1 - t0).toFixed(0)}ms`;
});

document.getElementById("concBtn").addEventListener("click", async () => {
  const t0 = performance.now();
  await Promise.allSettled(tasks.map(t => t.run()));
  const t1 = performance.now();
  document.getElementById("compareResult").textContent =
    `Concurrent total time: ${(t1 - t0).toFixed(0)}ms`;
});

//6. Event Loop Demo
const predictedOrder = [
  "1 (sync)",
  "5 (sync)",
  "4 (promise .then - microtask)",
  "6 (async fn before its own await, but runs sync until first await... see explanation)",
  "3 (setTimeout 0ms - task)",
  "2 (setTimeout 50ms - task)"
];
document.getElementById("predicted").textContent = predictedOrder.join("\n");

async function asyncDemoPart() {
  console.log("6: inside async function, before await");
  await Promise.resolve();
  console.log("7: inside async function, after await (microtask)");
}

document.getElementById("eventLoopBtn").addEventListener("click", () => {
  const actualLog = [];
  const record = msg => { actualLog.push(msg); console.log(msg); };
  record("1: sync - start of script");
  setTimeout(() => record("2: setTimeout 50ms callback (task)"), 50);
  setTimeout(() => record("3: setTimeout 0ms callback (task)"), 0);
  Promise.resolve().then(() => record("4: Promise.resolve().then callback (microtask)"));
  asyncDemoPart().then(() => record("8: asyncDemoPart() finished"));
  record("5: sync - end of script");
  setTimeout(() => {
    document.getElementById("actual").textContent = actualLog.join("\n");
  }, 150);
});
