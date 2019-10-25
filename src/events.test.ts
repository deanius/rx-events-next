import { trigger, on, pubsub } from "./index";

describe("Rx-Events", () => {
  const anyEventType = "any";
  const anyPayload = {};
  const anyEventCriteria = true;
  const anyHandler = () => null;
  const anyHandlerName = "anyHandler";
  const anyHandlerConfig = { name: anyHandlerName };
  const badBoyFn = () => {
    throw new Error();
  };
  it("should be sane", () => {
    expect(1).toEqual(1);
  });

  describe("#trigger", () => {
    it("should return an event", () => {
      const result = trigger(anyEventType, anyPayload);
      expect(result).toBeInstanceOf(Object);
    });
  });

  describe("#on", () => {
    beforeEach(() => pubsub.reset());

    it("adds a listener", () => {
      on(anyEventCriteria, anyHandler, { name: anyHandlerName });
      expect(pubsub.allListeners.size).toEqual(1);
      expect(pubsub.listenerNames).toEqual([anyHandlerName]);
    });

    it("allows for unsubscription", () => {
      const listener = on(anyEventCriteria, anyHandler, anyHandlerConfig);
      expect(pubsub.allListeners.size).toEqual(1);
      listener.unsubscribe();
      expect(pubsub.allListeners.size).toEqual(0);
    });

    describe("then #trigger", () => {
      it("calls the handler", () => {
        const simpleHandler = jest.fn();
        on(anyEventCriteria, simpleHandler, anyHandlerConfig);

        trigger(anyEventType);
        expect(simpleHandler).toHaveBeenCalled();
      });

      it("populates the completed.handlerName", async () => {
        const simpleHandler = jest.fn(() => 42);
        on(anyEventCriteria, simpleHandler, { name: "fortyTwo" });

        const result = trigger(anyEventType);
        expect(result).toHaveProperty("completed.fortyTwo");

        const thisResult = result.completed.fortyTwo;
        expect(thisResult).toBeInstanceOf(Promise);
        expect(await thisResult).toEqual(42);
      });

      describe("throwing handler", () => {
        it("should unsubscribe the handler", () => {
          const throwingHandler = jest.fn(badBoyFn);
          on(anyEventCriteria, throwingHandler, anyHandlerConfig);

          trigger(anyEventType);
          expect(throwingHandler).toHaveBeenCalled();
          expect(pubsub.allListeners.size).toEqual(0);
        });

        it("should not let unandled rejection bubble up", async () => {
          const throwingHandler = jest.fn(badBoyFn);
          const sawUnhandled = jest.fn();
          window.addEventListener("unhandledrejection", sawUnhandled);
          on(anyEventCriteria, throwingHandler, anyHandlerConfig);

          const result = trigger(anyEventType);
          console.log(result.completed);

          expect(sawUnhandled).not.toHaveBeenCalled();
        });

        it("should reject the .completed.anyHandler Promise", async () => {
          const throwingHandler = jest.fn(badBoyFn);
          on(anyEventCriteria, throwingHandler, anyHandlerConfig);

          const result = trigger(anyEventType);
          expect(result).toHaveProperty("completed.anyHandler");
          expect(result.completed.anyHandler).toBeInstanceOf(Promise);
          let err = await result.completed.anyHandler.catch(ex => ex);
          expect(err).toBeInstanceOf(Error);
        });

        it("should reject the .completed Promise", async () => {
          const throwingHandler = jest.fn(badBoyFn);
          on(anyEventCriteria, throwingHandler, anyHandlerConfig);

          const result = trigger(anyEventType);
          expect(result).toHaveProperty("completed");
          let err = await result.completed.catch(ex => ex);
          expect(err).toBeInstanceOf(Error);
        });
      });
    });
  });

  describe("#reset", () => {
    it("clears all listeners");
  });
});
