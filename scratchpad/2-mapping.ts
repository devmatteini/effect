import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"

function saluta(s: string) {
  return `${s} world`
}

function toUpper(s: string) {
  return s.toUpperCase()
}

const program = pipe(
  Effect.succeed("Hello"),
  Effect.map(saluta),
  Effect.map(toUpper)
)

// Effect.map(Effect.map(Effect.succeed("Hello"), (s) => `${s} world`), (s) => s.toUpperCase())

console.log(Effect.runSync(program))
