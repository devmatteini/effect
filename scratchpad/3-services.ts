import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Random from "effect/Random"

const programWithDefaultServices = pipe(
  Random.nextInt,
  Effect.flatMap((n) => n % 2 === 0 ? Effect.succeed(n) : Effect.fail("Odd number"))
)

const MyService = Context.GenericTag<{ nextInt: Effect.Effect<number> }>("MyService")

const program = pipe(
  MyService,
  Effect.flatMap((s) => s.nextInt),
  Effect.flatMap((n) => n % 2 === 0 ? Effect.succeed(n) : Effect.fail("Odd number"))
)

const runnable = pipe(
  // keep new line
  program,
  Effect.provideService(MyService, { nextInt: Effect.succeed(10) })
)

console.log(Effect.runSync(programWithDefaultServices))
