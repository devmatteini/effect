# 1. Sync Effects

Effect.runSync
-> runtime_.unsafeRunSyncEffect
-> unsafeRunSync(defaultRuntime)

## defaultRuntime

defaultRuntime: Runtime<never> = istanza statica di Runtime

- context: Context<never> = services Map for dependency injection
- runtimeFlags: RuntimeFlags = it affect the operation of the Effect runtime system
  default flags:
    - Interruption
    - CooperativeYielding
    - RuntimeMetrics
- fiberRefs: FiberRefs = collection of fibers

## unsafeRunSync

unsafeRunSyncExit(runtime)(effect)

1. create SyncScheduler
2. unsafeFork(runtime)(effect, { scheduler }) -> returns RuntimeFiber
3. fiberRuntime.unsafePoll() -> returns Exit<A, E>
4. Return the Exit result or die

## unsafeFork

1. Creates new fiberId
2. Creates new FiberRefs
    - Empty Context
    - Optionally, Scheduler
3. Create new FiberRuntime(fiberId, fiberRefs, runtime.runtimeFlags)
4. If the Effect is scoped, it adds a finalizer to the effect to close the scope when done
5. Starts a supervisor on the fiber runtime, if not already done
6. Add fiberRuntime to fiberScope.globalScope -> GlobalScope is a `FiberScope` that represents the scope of a fiber
   lifetime
7. fiberRuntime.start(effect) to start the execution

## FiberRuntime.start

1. Switch currentFiberURI to current `this`
2. this.evaluateEffect(effect): Evaluates an effect until completion, potentially asynchronously.
3. Create mutable and nullable effect variable. My guess is the current effect being executed
4. `while(effect != null)`
   1. `this.runLoop(eff)`: The main run-loop for evaluating effects.
   2. If it's not yielding, it ask the scheduler if it should yield. If yes, it schedules a yieldNow and then our `eff`.
      yieldNow creates a `EffectPrimitive(OpCodes.OP_YIELD)`
   3. `return this[(cur as core.Primitive)._op](cur as core.Primitive)` -> FiberRuntime have methods with the same name as `core.Primitive`, 
      for example `[OpCodes.OP_SUCCESS](op:...)` uses `op.effect_instruction_i0` to get the value out of the effect, as described in `core.succeed` when creating `EffectPrimitiveSuccess`
      These are the operations that actually execute our functions!
   4. Check whether the effect is a YieldedOp or not
      If yes, it checks the `yieldedOpChannel` to determine the status of the Fiber.
      If OP_YIELD or OP_ASYNC, exit `runLoop` with YieldedOp
      If OP_SUCCESS or OP_FAILURE, return the Exit value, otherwise die

## FiberRuntime[OpCodes.*]

`cont` (Continuation) should be the state of execution to be used when the fiber is resumed (saved in `FiberRuntime._stack`).

