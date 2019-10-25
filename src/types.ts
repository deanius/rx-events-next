/**
 * Options that get mixed into the agent as read-only
 * properties upon construction. Whitelisted to: agentId
 */
export interface AgentConfig {
  /**
   * Any value: One Suggestion is hex digits (a4ad3d) but
   * the way you'll create this will depend on your environment.
   */
  agentId?: any;
  [key: string]: any;
}

/**
 * The core of the Rx-Helper Agent API: methods to add subscribers (filters or handlers)
 * and a single method to 'dispatch' an event (Flux Standard Action) to relevant subscribers.
 */
export interface Evented {
  process(event: Event, context?: Object): ProcessResult;
  // subscribe(event$: Observable<Event>, context?: Object): Subscription
  // filter(eventMatcher: EventMatcher, handler: Subscriber, config?: HandlerConfig): Subscription
  // on(eventMatcher: EventMatcher, handler: Subscriber, config?: HandlerConfig): Subscription
}

/**
 * A subscriber is either a handler or a filter - a function which
 * receives as its argument the EventedItem, typically to use
 * the payload of the `event` property to cause some side-effect.
 */
export type Subscriber = (event: Event) => any;

/**
 * An object conforming to the Flux Standard Action specification
 */
export interface Event {
  type: string;
  payload?: any;
  error?: boolean;
  meta?: Object;
}

/**
 * When a handler (async usually) returns an Observable, it's possible
 * that another handler for that type is running already (see demo 'speak-up').
 * The options are:
 * - parallel: Concurrent handlers are unlimited, unadjusted
 * - serial: Concurrency of 1, handlers are queued
 * - cutoff: Concurrency of 1, any existing handler is killed
 * - mute: Concurrency of 1, existing handler prevents new handlers
 *
 * ![concurrency modes](https://s3.amazonaws.com/www.deanius.com/ConcurModes.png)
 */
export enum Concurrency {
  /**
   * Handlers are invoked on-demand - no limits */
  parallel = "parallel",
  /**
   * Concurrency of 1, handlers are queued */
  serial = "serial",
  /**
   * Concurrency of 1, any existing handler is killed */
  cutoff = "cutoff",
  /**
   * Concurrency of 1, existing handler prevents new handlers */
  mute = "mute"
}

export interface HandlerConfig {
  /** A name by which the results will be keyed. Example: `agent.process(event).completed.NAME.then(() => ...)` */
  name: string;
  /** The concurrency mode to use. Governs what happens when another handling from this handler is already in progress. */
  mode?: Concurrency;
  next?: string | Function;
  error?: string | Function;
  complete: string | Function;
  /** Alias for `mode`. */
  concurrency?: Concurrency;
}

export interface Predicate {
  (event: Event): boolean;
}
export type EventMatcher = string | string[] | RegExp | Predicate | boolean;

/**
 * The return value from calling `process`/`trigger`.
 * Basically this is the event that was passed to `process`,
 * but extended with the return values of filters (under their name).
 */
export interface ProcessResult extends Event {
  [key: string]: any;
}
