type AsyncFunction<T> = (...args: unknown[]) => Promise<T>;
type TaskResult<F, R> = [F, null] | [null, R];
type TaskStatus = "idle" | "running" | "completed" | "failed" | "aborted";
type UUID = ReturnType<typeof crypto.randomUUID>;
type TaskOptions = {
    name?: string;
};

export class Task<TFulfilled, TRejected extends Error> {
    static readonly displayName = "Task";
    readonly #id: UUID;
    readonly #asyncFn: AsyncFunction<TFulfilled>;
    readonly #abortController: AbortController;
    #status: TaskStatus;
    #result?: TaskResult<TFulfilled, TRejected>;
    #name?: string;

    constructor(asyncFn: AsyncFunction<TFulfilled>, options?: TaskOptions) {
        this.#id = crypto.randomUUID();
        this.#status = "idle";
        this.#asyncFn = asyncFn;
        this.#abortController = new AbortController();
        this.#name = options?.name;
    }

    get status() {
        return this.#status;
    }

    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }

    async run(): Promise<TaskResult<TFulfilled, TRejected>> {
        if (/(completed|failed)/.test(this.status)) {
            return this.#result!;
        }

        if (this.#status === "running") {
            throw new Error("The task is already running");
        }

        if (this.status === "idle") {
            try {
                this.#abortController.signal.addEventListener(
                    "abort",
                    this.#handleAbort,
                );
                this.#status = "running";
                const value = await this.#asyncFn();
                this.#status = "completed";
                this.#result = [value, null];
            } catch (error) {
                this.#status = this.#status === "aborted"
                    ? "aborted"
                    : "failed";
                this.#result = [null, error];
            }
        } else {
            this.#result = [null, this.#abortController.signal.reason];
        }

        this.#removeAbortHandler();

        return this.#result;
    }

    abort(reason?: unknown): void {
        if (this.status !== "aborted") {
            this.#status = "aborted";
            this.#abortController.abort(reason);
        }
    }

    #removeAbortHandler() {
        this.#abortController.signal.removeEventListener(
            "abort",
            this.#handleAbort,
        );
    }

    #handleAbort({ target }: Event) {
        this.#removeAbortHandler();
        throw (target as AbortSignal).reason;
    }
}
