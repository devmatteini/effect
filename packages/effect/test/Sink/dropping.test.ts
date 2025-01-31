import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import { pipe } from "effect/Function"
import * as Sink from "effect/Sink"
import * as Stream from "effect/Stream"
import { deepStrictEqual } from "effect/test/util"
import * as it from "effect/test/utils/extend"
import { describe } from "vitest"

describe("Sink", () => {
  it.effect("dropUntil", () =>
    Effect.gen(function*() {
      const result = yield* pipe(
        Stream.make(1, 2, 3, 4, 5, 1, 2, 3, 4, 5),
        Stream.pipeThrough(Sink.dropUntil<number>((n) => n >= 3)),
        Stream.runCollect
      )
      deepStrictEqual(Array.from(result), [4, 5, 1, 2, 3, 4, 5])
    }))

  it.effect("dropUntilEffect - happy path", () =>
    Effect.gen(function*() {
      const result = yield* pipe(
        Stream.make(1, 2, 3, 4, 5, 1, 2, 3, 4, 5),
        Stream.pipeThrough(Sink.dropUntilEffect((n) => Effect.succeed(n >= 3))),
        Stream.runCollect
      )
      deepStrictEqual(Array.from(result), [4, 5, 1, 2, 3, 4, 5])
    }))

  it.effect("dropUntilEffect - error", () =>
    Effect.gen(function*() {
      const result = yield* pipe(
        Stream.make(1, 2, 3),
        Stream.concat(Stream.fail("Aie")),
        Stream.concat(Stream.make(5, 1, 2, 3, 4, 5)),
        Stream.pipeThrough(Sink.dropUntilEffect((n) => Effect.succeed(n >= 2))),
        Stream.either,
        Stream.runCollect
      )
      deepStrictEqual(Array.from(result), [Either.right(3), Either.left("Aie")])
    }))

  it.effect("dropWhile", () =>
    Effect.gen(function*() {
      const result = yield* pipe(
        Stream.make(1, 2, 3, 4, 5, 1, 2, 3, 4, 5),
        Stream.pipeThrough(Sink.dropWhile<number>((n) => n < 3)),
        Stream.runCollect
      )
      deepStrictEqual(Array.from(result), [3, 4, 5, 1, 2, 3, 4, 5])
    }))

  it.effect("dropWhileEffect - happy path", () =>
    Effect.gen(function*() {
      const result = yield* pipe(
        Stream.make(1, 2, 3, 4, 5, 1, 2, 3, 4, 5),
        Stream.pipeThrough(Sink.dropWhileEffect((n) => Effect.succeed(n < 3))),
        Stream.runCollect
      )
      deepStrictEqual(Array.from(result), [3, 4, 5, 1, 2, 3, 4, 5])
    }))

  it.effect("dropWhileEffect - error", () =>
    Effect.gen(function*() {
      const result = yield* pipe(
        Stream.concat(
          Stream.make(1, 2, 3),
          Stream.fail("Aie")
        ),
        Stream.concat(Stream.make(5, 1, 2, 3, 4, 5)),
        Stream.pipeThrough(Sink.dropWhileEffect((n) => Effect.succeed(n < 3))),
        Stream.either,
        Stream.runCollect
      )
      deepStrictEqual(Array.from(result), [Either.right(3), Either.left("Aie")])
    }))
})
