import { afterEach, beforeEach, describe, test } from "jsr:@std/testing/bdd";
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { delay } from "jsr:@std/async";
import { Task } from "./task.ts";

const doSomeLongWork = (ms: number, signal: AbortSignal) => async () => {
    await delay(ms, { signal });
    console.log("Done!");
};

let aborter: AbortController;

describe(
    "task.ts",
    () => {
        beforeEach(() => {
            aborter = new AbortController();
        });

        afterEach(() => {
            aborter.abort();
        });

        test("should report status 'idle' before it is run", () => {
            const task = new Task(doSomeLongWork(1000, aborter.signal));
            assertEquals(task.status, "idle");
        });

        test(
            "should report status 'aborted' when it is aborted",
            () => {
                const task = new Task(doSomeLongWork(1000, aborter.signal));
                task.abort();
                assertEquals(task.status, "aborted");
            },
        );

        test(
            "should throw when it is already running",
            async () => {
                const task = new Task(doSomeLongWork(100_000, aborter.signal));
                task.run();
                await assertRejects(
                    () => task.run(),
                    Error,
                    "The task is already running",
                );
            },
        );
    },
);
