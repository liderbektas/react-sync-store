import { useSyncExternalStore } from "react";

export function createStore<T>(initialState: T) {

    let state = initialState;
    const subscribers = new Set<() => void>();

    const get = () => state;

    const set = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
        const nextState = typeof partial === "function"
            ? (partial as (state: T) => Partial<T>)(state)
            : partial;

        if (!Object.is(nextState, state)) {
            state = (typeof nextState !== "object" || nextState === null)
                ? (nextState as T)
                : Object.assign({}, state, nextState);
            subscribers.forEach((listener) => listener());
        }
    };

    const subscribe = (listener: () => void) => {
        subscribers.add(listener);
        return () => {
            subscribers.delete(listener);
        };
    };

    const watch = <U>(selector: (state: T) => U, callback?: (selectedState: U, previousState: U) => void) => {
        let previousValue = selector(state);
        if (callback) {
            subscribe(() => {
                const nextValue = selector(state);
                if (!Object.is(previousValue, nextValue)) {
                    const prev = previousValue;
                    previousValue = nextValue;
                    callback?.(nextValue, prev);
                }
            });
        } else {
            return previousValue;
        }
    };

    const store = <U>(selector: (state: T) => U): [U, typeof set] => {
        const value = useSyncExternalStore(subscribe, () => selector(get()));
        return [value, set];
    };

    return Object.assign(store, { get, set, subscribe, watch })
}