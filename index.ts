export default class SuperPromise<T, TError extends Error = Error> implements PromiseLike<T>{
    private _promise: Promise<any>;
    private _promiseRj!: Function;
    isDone: boolean = false;
    isCanceled: boolean = false;
    private _alwaysFunc: (() => void)[] = [];
    private _cancelFunc?: (() => void)[];

    constructor(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason: any) => void) => void) {
        this._promise = new Promise<T>((rs, rj) => {
            this._promiseRj = rj;

            //重新定义resolve
            let resolve = (value?: T | PromiseLike<T>) => {
                //Cancelable
                if (this.isCanceled || this.isDone) {
                    return;
                }

                this.isDone = true;

                //Always Call
                this._alwaysFunc.forEach(v => { v.call(this) });

                rs(value);

                //clear memory
                this._cancelFunc = undefined as any;
                this._alwaysFunc = undefined as any;
            }
            //重新定义reject
            let reject = (err: TError) => {
                //Cancelable
                if (this.isCanceled || this.isDone) {
                    return;
                }

                this.isDone = true;

                //Always Call
                this._alwaysFunc.forEach(v => { v.call(this) });

                rj(err);

                //clear memory
                this._cancelFunc = undefined as any;
                this._alwaysFunc = undefined as any;
            }
            executor(resolve, reject);
        });
    }

    /**
     * add cancel listener
     * @param handler 
     */
    onCancel(handler: () => void): this {
        if (this._cancelFunc) {
            this._cancelFunc.push(handler);
        }
        else {
            this._cancelFunc = [handler];
        }
        return this;
    }

    /**
     * 立即取消该Promise
     * 如果取消成功或之前已经取消，则返回true
     * 如果取消失败（已经resolve或reject），则返回false
     */
    cancel(): boolean {
        if (this.isDone) {
            return false;
        }

        if (this.isCanceled) {
            return true;
        }

        //cancel handler
        this.isCanceled = true;
        if (this._cancelFunc) {
            for (let func of this._cancelFunc) {
                func();
            }
            this._cancelFunc = undefined;
        }

        //Prevent UnhandledPromiseRejection
        this._promise = this._promise.catch(() => { });
        this._promiseRj();

        //clear memory
        this._promiseRj = undefined as any;
        this._promise = undefined as any;
        this._alwaysFunc = undefined as any;

        return true;
    }

    always(func: () => void): this {
        if (this.isCanceled) {
            //Do nothing
        }
        else if (this.isDone) {
            func.call(this);
        }
        else {
            this._alwaysFunc.push(func);
        }
        return this;
    }

    then(onfulfilled?: ((value: T) => T | PromiseLike<T>) | undefined | null, onrejected?: ((reason: any) => T | PromiseLike<T>) | undefined | null): SuperPromise<T, TError>;
    then<TResult, TE extends Error = TError>(onfulfilled: ((value: T) => T | PromiseLike<T>) | undefined | null, onrejected: (reason: any) => TResult | PromiseLike<TResult>): SuperPromise<T | TResult, TE>;
    then<TResult, TE extends Error = TError>(onfulfilled: (value: T) => TResult | PromiseLike<TResult>, onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): SuperPromise<TResult, TE>;
    then<TResult1, TResult2, TE extends Error = TError>(onfulfilled: (value: T) => TResult1 | PromiseLike<TResult1>, onrejected: (reason: any) => TResult2 | PromiseLike<TResult2>): SuperPromise<TResult1 | TResult2, TE>;
    then(onfulfilled: any, onrejected: any) {
        if (!this.isCanceled) {
            this._promise = this._promise.then(onfulfilled, onrejected);
        }
        return this;
    }

    catch(onrejected?: (err: TError) => any): SuperPromise<any, TError>;
    catch<TResult, TE extends Error = TError>(onrejected: (err: TError) => TResult | PromiseLike<TResult>): SuperPromise<TResult, TE>;
    catch(onrejected: any) {
        if (!this.isCanceled) {
            this._promise = this._promise.catch(onrejected);
        }
        return this;
    }

    static all<T, TE extends Error = Error>(promises: SuperPromise<T>[]): SuperPromise<T[], TE> {
        let output = new SuperPromise<T[], TE>((rs, rj) => {
            Promise.all(promises).then(result => {
                rs(result);
            }).catch(err => {
                rj(err);
            })
        });

        output.onCancel(function () {
            promises.forEach(promise => {
                promise.cancel();
            })
        })

        return output;
    }
}