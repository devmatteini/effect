import * as PodsRpc from "@effect/cluster-node/PodsRpc"
import type * as ShardingServiceRpc from "@effect/cluster-node/ShardingServiceRpc"
import * as ShardManagerClientRpc from "@effect/cluster-node/ShardManagerClientRpc"
import * as StorageFile from "@effect/cluster-node/StorageFile"
import * as Serialization from "@effect/cluster/Serialization"
import * as Sharding from "@effect/cluster/Sharding"
import * as ShardingConfig from "@effect/cluster/ShardingConfig"
import { HttpClient, HttpClientRequest } from "@effect/platform"
import { NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { Resolver } from "@effect/rpc"
import { HttpResolver } from "@effect/rpc-http"
import { Effect, Layer, Logger, LogLevel, Ref } from "effect"
import { CounterEntity, GetCurrent, Increment } from "./sample-common.js"

const liveLayer = Effect.gen(function*(_) {
  const messenger = yield* _(Sharding.messenger(CounterEntity))
  const idRef = yield* _(Ref.make(0))

  while (true) {
    const id = yield* _(Ref.getAndUpdate(idRef, (_) => _ + 1))
    const entityId = `entity-${id % 10}`

    yield* _(messenger.sendDiscard(entityId)(new Increment({ messageId: `increment-${id}` })))
    const result = yield* _(messenger.send(entityId)(new GetCurrent({ messageId: `get-count-${id}` })))
    yield* _(Effect.logInfo(`Counter ${entityId} is now: ${result}`))

    yield* _(Effect.sleep(200))
  }
}).pipe(
  Layer.effectDiscard,
  Layer.provide(Sharding.live),
  Layer.provide(StorageFile.storageFile),
  Layer.provide(PodsRpc.podsRpc<never>((podAddress) =>
    HttpResolver.make<ShardingServiceRpc.ShardingServiceRpc>(
      HttpClient.fetchOk.pipe(
        HttpClient.mapRequest(
          HttpClientRequest.prependUrl(`http://${podAddress.host}:${podAddress.port}/api/rest`)
        )
      )
    ).pipe(Resolver.toClient)
  )),
  Layer.provide(ShardManagerClientRpc.shardManagerClientRpc(
    (shardManagerUri) =>
      HttpResolver.make<ShardingServiceRpc.ShardingServiceRpc>(
        HttpClient.fetchOk.pipe(
          HttpClient.mapRequest(
            HttpClientRequest.prependUrl(shardManagerUri)
          )
        )
      ).pipe(Resolver.toClient)
  )),
  Layer.provide(ShardingConfig.withDefaults({ shardingPort: 54322 })),
  Layer.provide(Serialization.json),
  Layer.provide(NodeHttpClient.layerUndici)
)

Layer.launch(liveLayer).pipe(
  Logger.withMinimumLogLevel(LogLevel.All),
  Effect.tapErrorCause(Effect.logError),
  NodeRuntime.runMain
)
