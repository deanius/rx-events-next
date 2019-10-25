import { Subscription, Observable, of, throwError, ReplaySubject } from "rxjs";

import {
  Event,
  EventMatcher,
  Evented,
  HandlerConfig,
  Subscriber
} from "./types";

interface SafeListener {
  (event: Event): Observable<any>;
}

export class PubSub implements Evented {
  public allListeners: Map<string, Listener>;

  constructor() {
    this.allListeners = new Map<string, Listener>();
  }

  get listenerNames(): string[] {
    return Array.from(this.allListeners.keys());
  }

  process(event: Event) {
    const listenerResults = new Map<string, Promise<any>>();

    for (let [name, listener] of this.allListeners.entries()) {
      const result = listener.process(event);
      // TODO compose in notifications and concurrency to the recipe
      listenerResults.set(name, result);
    }

    let completedObject = {};
    for (let [name, result] of listenerResults) {
      Object.defineProperty(completedObject, name, {
        get: () => result,
        configurable: false,
        enumerable: true
      });
    }

    const promiseForAll = Promise.all(listenerResults.values());
    Object.assign(completedObject, {
      then(fn1, fn2) {
        return promiseForAll.then(fn1, fn2);
      },
      catch(fn) {
        return promiseForAll.catch(fn);
      }
    });

    const result = Object.assign({}, event);
    Object.defineProperty(result, "completed", {
      get() {
        return completedObject;
      },
      configurable: false,
      enumerable: true
    });
    return result;
  }

  trigger(type: string, payload: any): Event {
    const event = { type, payload };
    return this.process(event);
  }

  on(criteria: EventMatcher, fn: Subscriber, config: HandlerConfig) {
    return new Listener(this, criteria, fn, config);
  }

  reset() {
    this.allListeners.clear();
  }
}

class Listener extends Subscription {
  public matches: (item: Event) => boolean;
  public name: string;
  private listenerFn: SafeListener;

  constructor(
    private pubsub: PubSub,
    private criteria: EventMatcher,
    private userFn: Subscriber,
    private config: HandlerConfig
  ) {
    super(() => {
      pubsub.allListeners.delete(config.name);
    });

    const name = config.name;
    pubsub.allListeners.set(name, this);
    this.name = name;
    this.listenerFn = (event: Event) => {
      let returnValue;
      try {
        returnValue = userFn(event);
      } catch (ex) {
        this.unsubscribe();
        return throwError(ex);
      }

      return of(returnValue);
    };
  }

  process(event: Event): Promise<any> {
    const recipe = this.listenerFn(event);
    const ender = new ReplaySubject(1);

    // TODO subscribe with concurrency
    recipe.subscribe(ender);
    const result = ender.toPromise();

    return result;
  }
}

export const pubsub = new PubSub();
export const trigger = pubsub.trigger.bind(pubsub);
export const on = pubsub.on.bind(pubsub);
