# Async Task Runner — README

Homework project for practicing closures, call stack, promises,
async/await and the event loop. Made it a "mission control" theme
(Launch Rocket, Deploy Satellite, Scan for Signal) instead of the boring
Load Users example.

## 1. Closure = private counter

`createTask(name)` has local variables (`count`, `status`, `lastTime`)
inside it. The only way to touch them from outside is through the
methods it returns, like `getCount()` — there's no `task.count` you can
just read directly. Each `createTask()` call makes its own fresh set of
variables, so every task has its own counter, totally separate from the
others.

## 2. Call stack example

Clicking "Run":

```
click -> tasks[idx].run() -> new Promise(...) -> renderTasks() -> logStatus()
```

Each call goes on the stack and comes off once it returns. `run()`
doesn't wait for the timer — it starts it and returns right away, so the
stack is already empty long before the timer actually finishes.

## 3. Why JS doesn't freeze during setTimeout

`setTimeout` isn't handled by JS itself, it's a browser thing. JS just
tells the browser "run this later" and moves on immediately — the stack
never waits around for it. Once the timer's done AND the stack is
empty, the callback finally gets picked up and run.

## 4. Predicted vs actual output

What I predicted before running the Event Loop Demo:

```
1 (sync)
5 (sync)
4 (promise .then)
6 (async fn start)
7 (after await)
3 (setTimeout 0ms)
2 (setTimeout 50ms)
```

Ran it and checked the console — matched. All sync code first, then the
promise/microtask stuff, then the two timers last (0ms before 50ms).

## 5. Tasks vs microtasks

- Microtasks (`.then`, code after `await`) run right after the current
  sync code finishes, and JS clears the whole microtask queue before
  moving on.
- Tasks (`setTimeout`, clicks) only run once microtasks are empty.

That's why `Promise.resolve().then()` always logs before
`setTimeout(fn, 0)`, even with a 0ms delay.

## 6. Multiple promises + errors

Single task runs get `.catch(() => {})` so a failed task doesn't throw
an unhandled rejection warning (the error's already logged inside
`run()`).

For "Launch All Systems" I used `Promise.allSettled()` instead of
`Promise.all()` — tried `all()` first and it just stops as soon as one
task fails, ignoring the rest. `allSettled()` waits for every task no
matter what, which is what lets it say "all finished" correctly.

## 7. Sequential vs concurrent

- Sequential (`await` in a loop): each task waits for the last one, so
  total time ≈ sum of all three durations.
- Concurrent (`Promise.allSettled(tasks.map(...))`): all timers start
  basically together, total time ≈ the slowest task, not the sum.

Timed both with `performance.now()` — concurrent is consistently 2-3x
faster.
