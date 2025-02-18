import * as Effect from "effect/Effect"

const loadTodos = (id: number) =>
  Effect.promise(() => fetch(`https://jsonplaceholder.typicode.com/todos/${id}`).then((res) => res.json()))

const program = Effect.all([loadTodos(1), loadTodos(2)], { concurrency: 2 })

const result = await Effect.runPromise(program)
console.log(result)
