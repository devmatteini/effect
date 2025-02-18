import * as Effect from "effect/Effect"

const program = Effect.sync(() => "Hello world!")

console.log(Effect.runSync(program))
